---
name: skill-creator
description: Create, update, and package Agent Skills. Use when asked to design a new skill, refine an existing skill, or set up the required SKILL.md structure, frontmatter, and resources.
---

# Skill Creator

Follow this process to create or update a skill in this repository.

## 1) Understand the skill

- Ask for concrete examples of user requests that should trigger the skill.
- Identify what the skill must do and what it should not do.
- Confirm the expected output quality or standards.

## 2) Plan reusable resources

For each example, decide what reusable assets are needed:

- scripts/ for deterministic or repeated code
- references/ for large or detailed guidance
- assets/ for templates, boilerplate, or files used in outputs

Only include what is truly necessary. Do not add extra documentation files.

## 3) Create the skill directory

- Use lowercase with hyphens for the directory name.
- Place it under the skills folder where this SKILL.md lives (same root as this skill).

## 4) Write SKILL.md

### Frontmatter (required)

Use only these fields:

- name: lowercase, hyphenated, unique
- description: when to use the skill and what it does

### Body (required)

- Use imperative instructions.
- Keep it concise and task-focused.
- Reference any scripts or reference files and when to use them.
- Avoid “When to use this skill” sections in the body; put that in the description.

## 5) Add resources (optional)

- Put scripts in scripts/
- Put reference docs in references/
- Put templates or assets in assets/

Keep resources shallow (one level from SKILL.md) and avoid deep nesting.

## 6) Validate quality

- Ensure the description clearly signals triggers.
- Ensure instructions are actionable and minimal.
- Remove any example files you did not use.

## 7) Package (optional)

If a packaging script exists in the repo, run it to validate and package the skill. Otherwise, skip this step.
