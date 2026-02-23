#!/usr/bin/env node

const fs = require("fs/promises");
const path = require("path");

const USAGE = `
Usage:
  node scripts/install-skill.js <github-url> [--dest <repo-root>] [--force]

Example:
  node scripts/install-skill.js https://github.com/org/repo/tree/main/.github/skills/example-skill
`;

async function pathExists(targetPath) {
  try {
    await fs.access(targetPath);
    return true;
  } catch {
    return false;
  }
}

function parseArgs(argv) {
  const args = { url: null, dest: process.cwd(), force: false };
  const rest = [...argv];

  if (rest.length === 0) {
    return args;
  }

  while (rest.length) {
    const current = rest.shift();
    if (!args.url && !current.startsWith("--")) {
      args.url = current;
      continue;
    }
    if (current === "--dest") {
      const next = rest.shift();
      if (!next) {
        throw new Error("--dest requires a path");
      }
      args.dest = next;
      continue;
    }
    if (current === "--force") {
      args.force = true;
      continue;
    }
    throw new Error(`Unknown argument: ${current}`);
  }

  return args;
}

function parseGithubUrl(input) {
  let url;
  try {
    url = new URL(input);
  } catch {
    throw new Error("Invalid URL");
  }

  if (url.hostname !== "github.com") {
    throw new Error("Only github.com URLs are supported");
  }

  const segments = url.pathname.split("/").filter(Boolean);
  if (segments.length < 3) {
    throw new Error("URL must include owner, repo, and a folder path");
  }

  const owner = segments[0];
  const repo = segments[1].replace(/\.git$/, "");
  let ref;
  let folderPathSegments = [];

  if (segments[2] === "tree" || segments[2] === "blob") {
    if (segments.length < 5) {
      throw new Error("URL must include a folder path after the branch");
    }
    ref = segments[3];
    folderPathSegments = segments.slice(4);
  } else {
    folderPathSegments = segments.slice(2);
  }

  if (folderPathSegments.length === 0) {
    throw new Error("URL must point to a specific folder");
  }

  const folderPath = folderPathSegments.join("/");
  const skillName = folderPathSegments[folderPathSegments.length - 1];

  return { owner, repo, ref, folderPath, skillName };
}

async function fetchJson(url, token) {
  const response = await fetch(url, {
    headers: {
      "Accept": "application/vnd.github+json",
      "User-Agent": "skill-installer",
      ...(token ? { Authorization: `Bearer ${token}` } : {}),
    },
  });

  if (!response.ok) {
    const text = await response.text();
    throw new Error(`GitHub API error ${response.status}: ${text}`);
  }

  return response.json();
}

async function downloadFile(downloadUrl, destPath, token) {
  const response = await fetch(downloadUrl, {
    headers: {
      "User-Agent": "skill-installer",
      ...(token ? { Authorization: `Bearer ${token}` } : {}),
    },
  });

  if (!response.ok) {
    const text = await response.text();
    throw new Error(`Download failed ${response.status}: ${text}`);
  }

  const buffer = Buffer.from(await response.arrayBuffer());
  await fs.mkdir(path.dirname(destPath), { recursive: true });
  await fs.writeFile(destPath, buffer);
}

async function downloadDir(owner, repo, ref, dirPath, destPath, token) {
  const apiUrl = new URL(`https://api.github.com/repos/${owner}/${repo}/contents/${dirPath}`);
  if (ref) {
    apiUrl.searchParams.set("ref", ref);
  }

  const entries = await fetchJson(apiUrl.toString(), token);

  if (!Array.isArray(entries)) {
    throw new Error("The provided URL does not point to a folder");
  }

  for (const entry of entries) {
    const entryDest = path.join(destPath, entry.name);
    if (entry.type === "dir") {
      await downloadDir(owner, repo, ref, entry.path, entryDest, token);
    } else if (entry.type === "file") {
      await downloadFile(entry.download_url, entryDest, token);
    } else {
      throw new Error(`Unsupported entry type: ${entry.type}`);
    }
  }
}

async function getDefaultBranch(owner, repo, token) {
  const data = await fetchJson(`https://api.github.com/repos/${owner}/${repo}`, token);
  if (!data.default_branch) {
    throw new Error("Unable to determine default branch");
  }
  return data.default_branch;
}

async function main() {
  const { url, dest, force } = parseArgs(process.argv.slice(2));

  if (!url) {
    console.error(USAGE);
    process.exit(1);
  }

  const token = process.env.GITHUB_TOKEN || process.env.GH_TOKEN || "";
  const { owner, repo, ref: rawRef, folderPath, skillName } = parseGithubUrl(url);
  const ref = rawRef || (await getDefaultBranch(owner, repo, token));

  const destRoot = path.resolve(dest);
  const targetDir = path.join(destRoot, ".github", "skills", skillName);

  if (await pathExists(targetDir)) {
    if (!force) {
      throw new Error(`Destination already exists: ${targetDir}. Use --force to overwrite.`);
    }
    await fs.rm(targetDir, { recursive: true, force: true });
  }

  await fs.mkdir(targetDir, { recursive: true });
  await downloadDir(owner, repo, ref, folderPath, targetDir, token);

  const skillFile = path.join(targetDir, "SKILL.md");
  const hasSkillFile = await pathExists(skillFile);

  console.log(`Installed ${skillName} to ${targetDir}`);
  if (!hasSkillFile) {
    console.warn("Warning: SKILL.md not found in the installed folder.");
  }
}

main().catch((error) => {
  console.error(error.message || error);
  process.exit(1);
});
