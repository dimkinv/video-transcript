Place Windows FFmpeg sidecar binaries in this folder.

Required filename for x64 Windows builds:
- ffmpeg-x86_64-pc-windows-msvc.exe

Optional companion for probing:
- ffprobe-x86_64-pc-windows-msvc.exe

The Tauri config references `binaries/ffmpeg` as external bin, which resolves to the target-specific suffix at build time.
