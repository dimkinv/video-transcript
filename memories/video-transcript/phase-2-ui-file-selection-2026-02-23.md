---
summary: "Completed Phase 2 tasks 2.1-2.6: main workflow UI, file picker and validation commands, language/output selectors, and typed Tauri command wrappers."
created: 2026-02-23
status: resolved
tags: [video-transcript, tauri, phase-2, ui, file-selection]
related: [src/App.tsx, src/components/FileSelector.tsx, src-tauri/src/commands/video.rs, src/services/tauri-commands.ts]
---

# Phase 2 UI and File Selection

## Context
Implemented all Phase 2 tasks from `TASKS.md` (2.1 through 2.6), building the main app workflow UI and required Rust commands.

## Decisions
- Added backend dialog commands in `src-tauri/src/commands/video.rs` for `select_video_file` and `select_output_folder` using `tauri-plugin-dialog`.
- Kept `select_video_file` return type as `Option<String>` and added `validate_video_file(path)` to perform file existence/extension validation and return file metadata needed by UI.
- Implemented language search/filter with a reusable native dropdown component (`LanguageSelector`) to avoid introducing a new dependency.
- Unified frontend-backend calls through typed wrappers with centralized error wrapping in `src/services/tauri-commands.ts`.
- Switched settings output-folder browse flow to use the same backend `select_output_folder` command for consistency.

## Artifacts
- Backend: `src-tauri/src/commands/video.rs`, `src-tauri/src/commands/mod.rs`, `src-tauri/src/lib.rs`
- Frontend UI: `src/App.tsx`, `src/App.css`, `src/components/FileSelector.tsx`, `src/components/LanguageSelector.tsx`, `src/components/OutputLocationPicker.tsx`
- Types/services: `src/types/video.ts`, `src/services/tauri-commands.ts`
- Tracking: `TASKS.md` (Task 2.1-2.6 checklists marked complete)

## Verification
- `pnpm build` passed.
- `cargo build` passed.

## Next Steps
- Continue with Phase 3: FFmpeg/ffprobe wrapper, video probe metadata command, chunk calculation, and cost estimation.
