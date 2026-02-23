# Video Transcription Application - Implementation Plan

## Project Overview

A **Tauri-based video transcription application** that:
- Accepts video files of any size
- Splits them into configurable chunks (default 20 minutes)
- Extracts audio and sends to OpenAI Whisper API
- Generates SRT subtitle files
- **Target Platform**: Windows only

---

## Technology Stack

- **Frontend**: React + TypeScript + Vite
- **Backend**: Rust/Tauri
- **Video Processing**: FFmpeg (bundled)
- **API**: OpenAI Whisper API
- **Storage**: Tauri's built-in storage for settings
- **Subtitle Format**: SRT

---

## Feature Requirements

### 1. Settings Management

**Storage Schema:**
```typescript
{
  apiKey: string,
  defaultOutputFolder: string | null, // null = same as video
  preferredLanguages: string[], // filtered list
  chunkDurationMinutes: number, // default 20
  maxRetries: number, // default 3
  sourceLanguage: string,
  targetLanguage: string | null // null = no translation
}
```

**Storage Strategy:**
- **Development**: API key from `.env` file
- **Production**: User enters in settings screen, stored in app settings

**UI Screens:**
- Main screen
- Settings modal/screen

---

### 2. Core Features

#### Main UI Components
- Video file picker (drag-drop + button)
- Source language dropdown (from settings.preferredLanguages or all)
- Target language dropdown (optional, for translation)
- Output location display + change button
- **Estimated cost display** (before processing)
- Process button
- Progress bar with stages:
  - Splitting video (X/Y chunks)
  - Extracting audio (X/Y chunks)
  - Transcribing (X/Y chunks)
  - Generating subtitles
- Cancel button
- Status/error messages

#### Settings UI
- API Key input (password field)
- Default output folder selector
- Chunk duration slider/input (5-60 mins, default: 20)
- Max retries input (1-10, default: 3)
- Language filter: multi-select from all Whisper languages (show all by default)
- Test API key button

---

### 3. Output Behavior

- **Default**: Same folder and same name as video file (with `.srt` extension)
- **Configurable**: User can set custom default folder in settings
- **Per-operation**: Allow output location change for each transcription

---

### 4. Error Handling & Retry Logic

- Retry failed chunks up to configurable number of times (default: 3)
- Network errors → retry
- FFmpeg errors → fail with descriptive message
- API key invalid → prompt settings
- Disk space → check before processing
- Partial failure → save progress and allow resume/retry

---

## Technical Architecture

### Backend (Rust) Components

#### Dependencies to Add
```toml
[dependencies]
reqwest = { version = "0.11", features = ["json", "multipart"] }
serde = { version = "1.0", features = ["derive"] }
serde_json = "1.0"
tokio = { version = "1", features = ["full"] }
anyhow = "1.0"
tauri = { version = "2.x", features = ["...", "fs-all", "path-all", "dialog-all"] }
```

#### Tauri Commands

1. `select_video_file()` → Opens file dialog, returns path
2. `get_video_info(path)` → Returns duration, format, size
3. `estimate_cost(duration_seconds)` → Calculates Whisper API cost
4. `process_video(config)` → Main processing pipeline
5. `cancel_processing()` → Stops current job
6. `get_settings()` → Loads settings
7. `save_settings(settings)` → Persists settings
8. `test_api_key(key)` → Validates OpenAI API key
9. `get_supported_languages()` → Returns all Whisper languages
10. `select_output_folder()` → Opens folder dialog

#### Processing Pipeline

```rust
// Stages with event emission
1. Validate video file
2. Calculate chunks (based on duration & chunk size)
3. For each chunk:
   - Split video segment (FFmpeg)
   - Extract audio to WAV/MP3 (FFmpeg)
   - Upload to Whisper API (with retry logic)
   - Get transcript with timestamps
   - Cleanup chunk temp files
4. Merge all transcripts
5. Generate SRT file
6. Final cleanup
7. Emit completion event
```

#### FFmpeg Bundling

- Download FFmpeg Windows static build
- Place in `src-tauri/binaries/ffmpeg-x86_64-pc-windows-msvc.exe`
- Configure in `tauri.conf.json` as sidecar binary
- Call via Rust Command API or `std::process::Command`

**FFmpeg Operations:**
```bash
# Get video info
ffprobe -v quiet -print_format json -show_format -show_streams input.mp4

# Split video into chunks
ffmpeg -i input.mp4 -ss START_TIME -t DURATION -c copy chunk_001.mp4

# Extract audio from chunk
ffmpeg -i chunk.mp4 -vn -acodec pcm_s16le -ar 16000 -ac 1 chunk.wav
```

---

### Frontend (React/TypeScript) Components

#### File Structure
```
src/
  components/
    FileSelector.tsx          # Video file picker
    LanguageSelector.tsx      # Source/target language dropdowns
    ProgressDisplay.tsx       # Multi-stage progress bar
    SettingsModal.tsx         # Settings configuration
    CostEstimate.tsx          # API cost calculator display
    OutputLocationPicker.tsx  # Output folder selector
  services/
    tauri-commands.ts         # Typed wrappers for Tauri commands
  types/
    settings.ts               # Settings interface
    processing.ts             # Processing state types
    languages.ts              # Whisper language codes
  hooks/
    useSettings.ts            # Settings management hook
    useProcessing.ts          # Video processing hook
  App.tsx
  App.css
```

---

### Tauri Project Structure

```
src-tauri/
  binaries/
    ffmpeg-x86_64-pc-windows-msvc.exe
  src/
    commands/
      video.rs          # FFmpeg operations (split, extract, probe)
      whisper.rs        # OpenAI Whisper API client
      settings.rs       # Settings storage/retrieval
      processing.rs     # Main processing orchestration
    models/
      settings.rs       # Settings struct
      processing.rs     # Processing state/config structs
      language.rs       # Language definitions
    utils/
      ffmpeg.rs         # FFmpeg wrapper utilities
      srt.rs            # SRT file generator
      retry.rs          # Retry logic helper
    lib.rs
    main.rs
  .env                  # dev-only API key
  build.rs
  Cargo.toml
  tauri.conf.json
```

---

## Implementation Phases

### Phase 1: Setup & Configuration ✓
**Goal**: Foundation and settings infrastructure

- [ ] Add Rust dependencies to `Cargo.toml`
- [ ] Set up FFmpeg sidecar in `tauri.conf.json`
- [ ] Create settings data structures (Rust + TypeScript)
- [ ] Implement settings storage using Tauri Store
- [ ] Build Settings UI component
- [ ] Add .env file support for dev API key

### Phase 2: UI & File Selection
**Goal**: Main screen and file handling

- [ ] Design main screen layout
- [ ] Implement file picker component (button + drag-drop)
- [ ] Create language dropdown components
- [ ] Build output location selector
- [ ] Add all Whisper supported languages list

### Phase 3: Video Analysis
**Goal**: Video inspection and cost estimation

- [ ] Integrate FFmpeg probe functionality
- [ ] Parse video duration, format, size
- [ ] Calculate chunk count based on settings
- [ ] Implement cost estimation logic
- [ ] Display cost in UI before processing

### Phase 4: Video Processing (Backend)
**Goal**: Core video manipulation

- [ ] Implement video splitting with FFmpeg
- [ ] Implement audio extraction with FFmpeg
- [ ] Create temp file management system
- [ ] Set up progress event emission
- [ ] Add cleanup logic

### Phase 5: Whisper API Integration
**Goal**: Transcription service

- [ ] Create OpenAI HTTP client
- [ ] Implement audio file upload
- [ ] Parse Whisper API response (verbose_json format)
- [ ] Implement retry logic with exponential backoff
- [ ] Handle API errors (rate limits, auth, etc.)
- [ ] Support translation parameter

### Phase 6: Subtitle Generation
**Goal**: SRT file creation

- [ ] Build SRT formatter (timestamps + text)
- [ ] Merge transcripts from all chunks
- [ ] Handle timestamp offsets per chunk
- [ ] Write SRT file to disk
- [ ] Add success notification

### Phase 7: Polish & Testing
**Goal**: Production-ready application

- [ ] Implement cancel functionality
- [ ] Add comprehensive error messages
- [ ] Create loading/processing states
- [ ] End-to-end testing with various video formats
- [ ] Test with large files (multi-hour videos)
- [ ] Memory optimization
- [ ] UI/UX improvements

---

## Key Technical Decisions

### Whisper API Specifics

**Endpoint**: `https://api.openai.com/v1/audio/transcriptions`

**Parameters**:
- `file`: Audio file (max 25MB)
- `model`: "whisper-1"
- `language`: ISO-639-1 code (e.g., "en", "es", "fr")
- `response_format`: "verbose_json" (includes timestamps)
- `temperature`: 0-1 (optional)
- `prompt`: Context hint (optional)

**Translation Endpoint**: `https://api.openai.com/v1/audio/translations`

**Pricing** (as of 2026):
- $0.006 per minute of audio
- Example: 1 hour video = 60 minutes × $0.006 = $0.36

### SRT Format

```srt
1
00:00:00,000 --> 00:00:05,000
First subtitle text

2
00:00:05,000 --> 00:00:10,000
Second subtitle text

3
00:00:10,000 --> 00:00:15,000
Third subtitle text
```

**Timestamp Format**: `HH:MM:SS,mmm`

### Supported Whisper Languages (99 languages)

Afrikaans, Arabic, Armenian, Azerbaijani, Belarusian, Bosnian, Bulgarian, Catalan, Chinese, Croatian, Czech, Danish, Dutch, English, Estonian, Finnish, French, Galician, German, Greek, Hebrew, Hindi, Hungarian, Icelandic, Indonesian, Italian, Japanese, Kannada, Kazakh, Korean, Latvian, Lithuanian, Macedonian, Malay, Marathi, Maori, Nepali, Norwegian, Persian, Polish, Portuguese, Romanian, Russian, Serbian, Slovak, Slovenian, Spanish, Swahili, Swedish, Tagalog, Tamil, Thai, Turkish, Ukrainian, Urdu, Vietnamese, Welsh, and more.

**ISO-639-1 Codes**: 
- English: `en`
- Spanish: `es`
- French: `fr`
- German: `de`
- etc.

---

## Recommended Implementation Order

1. **Phase 1**: Settings infrastructure → Foundation for everything else
2. **Phase 2**: File selection & UI → User can select videos
3. **Phase 3**: Video analysis → Prove FFmpeg integration works
4. **Phase 4**: Processing pipeline → Core video manipulation
5. **Phase 5**: Whisper API → Transcription functionality
6. **Phase 6**: SRT generation → Final output
7. **Phase 7**: Polish → Production ready

---

## Testing Strategy

### Unit Tests
- SRT timestamp formatting
- Chunk calculation logic
- Retry mechanism
- Settings validation

### Integration Tests
- FFmpeg operations
- Whisper API calls (with mock server)
- Full pipeline with small test video

### Manual Testing Checklist
- [ ] Small video (< 5 minutes)
- [ ] Medium video (20-40 minutes)
- [ ] Large video (2+ hours)
- [ ] Various formats (MP4, AVI, MKV, MOV)
- [ ] Network interruption during transcription
- [ ] Invalid API key handling
- [ ] Disk space exhaustion
- [ ] Cancel mid-process
- [ ] Settings persistence across app restarts

---

## Future Enhancements (Post-MVP)

- Support for VTT subtitle format
- Batch processing (multiple videos)
- Custom FFmpeg quality settings
- Whisper model selection (when available)
- Subtitle preview/editor
- Direct video player integration
- Progress persistence (resume interrupted jobs)
- Translation quality settings
- Auto-punctuation and formatting options
- Export to other formats (TXT, DOCX)

---

## Development Environment Setup

### Prerequisites
- Node.js 18+
- Rust 1.70+
- Tauri CLI
- FFmpeg (for development testing)

### Getting Started
```bash
# Install dependencies
npm install

# Run in development mode
npm run tauri dev

# Build for production
npm run tauri build
```

### Environment Variables (.env)
```
OPENAI_API_KEY=sk-...
```

---

## Notes

- FFmpeg bundling adds ~100MB to app size (acceptable for Windows)
- Temp files can grow large; ensure cleanup happens even on crash
- Consider streaming audio to API instead of full file uploads (future optimization)
- Whisper API has rate limits; implement proper backoff
- SRT timestamps must account for chunk offsets when merging
