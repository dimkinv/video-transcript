# Video Transcript

Tauri + React desktop app for transcribing videos into SRT subtitles.

## Prerequisites

- Node.js 18+
- Rust stable
- Tauri CLI

## Development Setup

1. Install frontend dependencies:
```bash
pnpm install
```

2. Configure local development API key:
```bash
cp src-tauri/.env.example src-tauri/.env
```
Then set `OPENAI_API_KEY` in `src-tauri/.env`.

3. Start development mode:
```bash
pnpm tauri dev
```

## Notes

- In debug/dev mode, `OPENAI_API_KEY` from `src-tauri/.env` overrides the stored API key when reading settings.
- Place Windows FFmpeg binary at `src-tauri/binaries/ffmpeg-x86_64-pc-windows-msvc.exe` for sidecar packaging.
