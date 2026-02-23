# Video Transcription Application - Implementation Tasks

## Phase 1: Setup & Configuration

### Task 1.1: Add Rust Dependencies
**Priority**: P0 - Foundation  
**Estimated Time**: 30 minutes

**Definition of Done:**
- [x] `Cargo.toml` includes `reqwest` with `json` and `multipart` features
- [x] `Cargo.toml` includes `serde` with `derive` feature
- [x] `Cargo.toml` includes `serde_json`
- [x] `Cargo.toml` includes `tokio` with `full` features
- [x] `Cargo.toml` includes `anyhow` for error handling
- [x] `Cargo.toml` includes `dotenv` for .env file support
- [x] Project builds successfully with `cargo build`

---

### Task 1.2: Download and Bundle FFmpeg
**Priority**: P0 - Foundation  
**Estimated Time**: 45 minutes

**Definition of Done:**
- [ ] FFmpeg Windows static build downloaded (ffmpeg.exe)
- [ ] Binary placed in `src-tauri/binaries/` directory
- [x] FFmpeg Windows static build downloaded (ffmpeg.exe)
- [x] Binary placed in `src-tauri/binaries/` directory
- [x] Binary named `ffmpeg-x86_64-pc-windows-msvc.exe`
- [x] `tauri.conf.json` updated with sidecar configuration
- [x] Test command to verify FFmpeg can be executed from Rust
- [x] FFmpeg version and capabilities logged on app startup

---

### Task 1.3: Create Settings Data Models (Rust)
**Priority**: P0 - Foundation  
**Estimated Time**: 1 hour

**Definition of Done:**
- [x] `src-tauri/src/models/settings.rs` created
- [x] `AppSettings` struct with all fields (apiKey, defaultOutputFolder, preferredLanguages, chunkDurationMinutes, maxRetries, sourceLanguage, targetLanguage)
- [x] Serde derive macros for serialization/deserialization
- [x] Default implementation with sensible defaults (20 min chunks, 3 retries)
- [x] Validation methods (e.g., chunk duration 5-60 mins)
- [x] `src-tauri/src/models/mod.rs` exports settings module

---

### Task 1.4: Create Settings Data Models (TypeScript)
**Priority**: P0 - Foundation  
**Estimated Time**: 30 minutes

**Definition of Done:**
- [x] `src/types/settings.ts` created
- [x] `AppSettings` interface matching Rust model
- [x] Type definitions for language codes
- [x] Default settings constant exported
- [x] TypeScript compiles without errors

---

### Task 1.5: Implement Settings Storage (Rust)
**Priority**: P0 - Foundation  
**Estimated Time**: 1.5 hours

**Definition of Done:**
- [x] `src-tauri/src/commands/settings.rs` created
- [x] `get_settings()` Tauri command reads from app data directory
- [x] `save_settings(settings: AppSettings)` Tauri command persists to app data
- [x] Settings stored as JSON file in appropriate OS location
- [x] Error handling for file I/O operations
- [x] Commands registered in `main.rs`
- [x] .env file loading for dev environment (OPENAI_API_KEY)
- [x] API key precedence: .env (dev) → stored settings (prod)

---

### Task 1.6: Create Settings UI Component
**Priority**: P0 - Foundation  
**Estimated Time**: 2 hours

**Definition of Done:**
- [x] `src/components/SettingsModal.tsx` created
- [x] Modal/dialog component with open/close state
- [x] API Key password input field
- [x] Default output folder picker with browse button
- [x] Chunk duration slider/input (5-60 mins)
- [x] Max retries number input (1-10)
- [x] Language filter multi-select (starts with all Whisper languages)
- [x] Save button calls `save_settings()` command
- [x] Cancel button discards changes
- [x] Test API Key button (placeholder for now)
- [x] Form validation with error messages
- [x] Settings load on modal open

---

### Task 1.7: Create Language Definitions
**Priority**: P0 - Foundation  
**Estimated Time**: 45 minutes

**Definition of Done:**
- [x] `src/types/languages.ts` created with all 99 Whisper languages
- [x] Array of objects: `{ code: string, name: string }`
- [x] ISO-639-1 codes for all languages
- [x] Exported constants for easy import
- [x] `src-tauri/src/models/language.rs` with matching enum/struct
- [x] `get_supported_languages()` Tauri command returns list
- [x] Command registered in `main.rs`

---

### Task 1.8: Create .env File for Development
**Priority**: P1 - Nice to Have  
**Estimated Time**: 15 minutes

**Definition of Done:**
- [x] `.env` file created in `src-tauri/` directory
- [x] `OPENAI_API_KEY` placeholder variable
- [x] `.env.example` file created with template
- [x] `.gitignore` updated to exclude `.env`
- [x] README section on setting up .env for development

---

## Phase 2: UI & File Selection

### Task 2.1: Design Main Screen Layout
**Priority**: P0 - Foundation  
**Estimated Time**: 2 hours

**Definition of Done:**
- [x] `src/App.tsx` updated with main layout structure
- [x] Header with app title and settings button
- [x] File selection area (placeholder)
- [x] Language selection area (source & target dropdowns)
- [x] Output location display area
- [x] Cost estimate display area
- [x] Process button (disabled state initially)
- [x] Progress area (hidden until processing)
- [x] Basic CSS styling in `src/App.css`
- [x] Responsive layout for different window sizes

---

### Task 2.2: Implement File Picker Component
**Priority**: P0 - Core Feature  
**Estimated Time**: 2 hours

**Definition of Done:**
- [x] `src/components/FileSelector.tsx` created
- [x] "Select Video File" button
- [x] `select_video_file()` Tauri command implemented
- [x] File dialog opens with video format filters (.mp4, .avi, .mkv, .mov, .wmv)
- [x] Selected file path displayed
- [x] File name and size displayed
- [x] Clear/remove file button
- [x] Drag and drop zone area (bonus)
- [x] File validation (exists, is video file)
- [x] Error messages for invalid files

---

### Task 2.3: Implement select_video_file Command (Rust)
**Priority**: P0 - Core Feature  
**Estimated Time**: 1 hour

**Definition of Done:**
- [x] `src-tauri/src/commands/video.rs` created (or update existing)
- [x] `select_video_file()` command uses Tauri dialog API
- [x] File filter for video extensions
- [x] Returns `Option<String>` with file path
- [x] Error handling for dialog cancellation
- [x] Command registered in `main.rs`
- [x] Windows-style path handling

---

### Task 2.4: Create Language Selector Components
**Priority**: P0 - Core Feature  
**Estimated Time**: 1.5 hours

**Definition of Done:**
- [x] `src/components/LanguageSelector.tsx` created
- [x] Reusable dropdown component with props (languages, selected, onChange, label)
- [x] Source language selector displays filtered or all languages
- [x] Target language selector with "None" option for no translation
- [x] Searchable/filterable dropdown (use library like react-select)
- [x] Languages sorted alphabetically
- [x] Selected language persists in state
- [x] Integrated into main App.tsx

---

### Task 2.5: Implement Output Location Picker
**Priority**: P0 - Core Feature  
**Estimated Time**: 1.5 hours

**Definition of Done:**
- [x] `src/components/OutputLocationPicker.tsx` created
- [x] Displays current output path (default: same as video file)
- [x] "Change" button to select custom folder
- [x] `select_output_folder()` Tauri command implemented
- [x] Folder dialog opens and returns selected path
- [x] "Reset to Default" button (same folder as video)
- [x] Path validation and normalization
- [x] Command registered in `main.rs`

---

### Task 2.6: Create Tauri Commands Service (TypeScript)
**Priority**: P1 - Code Quality  
**Estimated Time**: 1 hour

**Definition of Done:**
- [x] `src/services/tauri-commands.ts` created
- [x] Typed wrapper functions for all Tauri commands
- [x] Proper TypeScript return types
- [x] Async/await support
- [x] Error handling wrappers
- [x] JSDoc comments for each function
- [x] Exported functions used throughout app instead of direct `invoke()`

---

## Phase 3: Video Analysis


### Task 3.1: Implement FFmpeg Wrapper Utility (Rust)
**Priority**: P0 - Core Feature  
**Estimated Time**: 2 hours

**Definition of Done:**
- [ ] `src-tauri/src/utils/ffmpeg.rs` created
- [ ] Function to get FFmpeg binary path (from sidecar)
- [ ] Helper function to execute FFmpeg commands
- [ ] Stdout/stderr capture
- [ ] Exit code checking
- [ ] Error type for FFmpeg failures
- [ ] Logging for all FFmpeg commands
- [ ] Timeout support for long-running commands

---

### Task 3.2: Implement Video Probe Functionality
**Priority**: P0 - Core Feature  
**Estimated Time**: 2 hours

**Definition of Done:**
- [ ] Function in `src-tauri/src/commands/video.rs` to probe video
- [ ] Execute `ffprobe` with JSON output format
- [ ] Parse duration, format, codec, resolution, size
- [ ] `get_video_info(path: String)` Tauri command
- [ ] Returns struct with video metadata
- [ ] Error handling for invalid/corrupted videos
- [ ] Command registered in `main.rs`
- [ ] Corresponding TypeScript type in `src/types/processing.ts`

---

### Task 3.3: Implement Chunk Calculation Logic
**Priority**: P0 - Core Feature  
**Estimated Time**: 1 hour

**Definition of Done:**
- [ ] Function to calculate number of chunks based on duration and chunk size
- [ ] Function to generate chunk timestamps (start/end for each)
- [ ] Edge case handling (video shorter than chunk duration)
- [ ] Last chunk handling (may be shorter than configured duration)
- [ ] Returns array of `ChunkInfo` structs with start_time, duration, chunk_number
- [ ] Unit tests for chunk calculation logic

---

### Task 3.4: Implement Cost Estimation
**Priority**: P0 - User Value  
**Estimated Time**: 1.5 hours

**Definition of Done:**
- [ ] `estimate_cost(duration_seconds: f64)` Tauri command
- [ ] Calculation: `(duration_minutes * RATE_PER_MINUTE)` where rate = $0.006
- [ ] Returns formatted cost string (e.g., "$0.36 USD")
- [ ] Command registered in `main.rs`
- [ ] `src/components/CostEstimate.tsx` component created
- [ ] Display estimated cost before processing
- [ ] Warning if cost exceeds threshold (e.g., $5)
- [ ] Real-time update when video selected

---

### Task 3.5: Display Video Info in UI
**Priority**: P1 - User Value  
**Estimated Time**: 1 hour

**Definition of Done:**
- [ ] Video duration displayed (formatted as HH:MM:SS)
- [ ] Video size displayed (formatted as MB/GB)
- [ ] Number of chunks calculated and displayed
- [ ] Video format/codec displayed
- [ ] Cost estimate displayed prominently
- [ ] All info appears after file selection
- [ ] Loading state while probing video

---

## Phase 4: Video Processing (Backend)

### Task 4.1: Implement Temp File Management
**Priority**: P0 - Core Feature  
**Estimated Time**: 1.5 hours

**Definition of Done:**
- [ ] `src-tauri/src/utils/temp.rs` created
- [ ] Function to create temp directory for each processing job
- [ ] Unique temp folder per job (use UUID or timestamp)
- [ ] Function to clean up temp directory
- [ ] Cleanup on success, failure, and cancellation
- [ ] Disk space check before creating temp files
- [ ] Error handling for I/O operations

---

### Task 4.2: Implement Video Splitting
**Priority**: P0 - Core Feature  
**Estimated Time**: 2.5 hours

**Definition of Done:**
- [ ] Function in `src-tauri/src/utils/ffmpeg.rs` to split video
- [ ] FFmpeg command: `ffmpeg -i input.mp4 -ss START -t DURATION -c copy output.mp4`
- [ ] Takes input path, chunk info, output path
- [ ] Copy codec (no re-encoding) for speed
- [ ] Progress callback/event emission
- [ ] Error handling for FFmpeg failures
- [ ] Verification that output file exists and is valid
- [ ] Unit test with sample video

---

### Task 4.3: Implement Audio Extraction
**Priority**: P0 - Core Feature  
**Estimated Time**: 2 hours

**Definition of Done:**
- [ ] Function in `src-tauri/src/utils/ffmpeg.rs` to extract audio
- [ ] FFmpeg command: `ffmpeg -i input.mp4 -vn -acodec pcm_s16le -ar 16000 -ac 1 output.wav`
- [ ] Output format: WAV, 16kHz mono (Whisper optimal)
- [ ] File size check (must be < 25MB for Whisper API)
- [ ] Compression to MP3 if WAV exceeds limit
- [ ] Progress callback/event emission
- [ ] Error handling
- [ ] Verification of audio output

---

### Task 4.4: Create Processing State Management
**Priority**: P0 - Core Feature  
**Estimated Time**: 2 hours

**Definition of Done:**
- [ ] `src-tauri/src/models/processing.rs` created
- [ ] `ProcessingState` enum (Idle, Splitting, Extracting, Transcribing, Generating, Complete, Error, Cancelled)
- [ ] `ProcessingProgress` struct with current stage, chunk number, total chunks, percentage
- [ ] Global state management (use `Arc<Mutex<ProcessingState>>`)
- [ ] Thread-safe state updates
- [ ] Corresponding TypeScript types in `src/types/processing.ts`

---

### Task 4.5: Implement Progress Event Emission
**Priority**: P0 - User Value  
**Estimated Time**: 1.5 hours

**Definition of Done:**
- [ ] Tauri event emission for progress updates
- [ ] Event: `processing-progress` with payload containing state and progress
- [ ] Event: `processing-error` with error message
- [ ] Event: `processing-complete` with output file path
- [ ] Frontend listener in React component
- [ ] Progress updates at meaningful intervals (per chunk, per stage)
- [ ] TypeScript event types defined

---

### Task 4.6: Create Progress Display Component
**Priority**: P0 - User Value  
**Estimated Time**: 2 hours

**Definition of Done:**
- [ ] `src/components/ProgressDisplay.tsx` created
- [ ] Multi-stage progress visualization (splitting → extracting → transcribing → generating)
- [ ] Progress bar for overall completion
- [ ] Current stage highlighted
- [ ] Current chunk / total chunks displayed
- [ ] Percentage complete displayed
- [ ] Status messages (e.g., "Splitting chunk 3 of 15...")
- [ ] Hidden when not processing
- [ ] Animated transitions

---

## Phase 5: Whisper API Integration

### Task 5.1: Create OpenAI Client Module
**Priority**: P0 - Core Feature  
**Estimated Time**: 2 hours

**Definition of Done:**
- [ ] `src-tauri/src/commands/whisper.rs` created
- [ ] HTTP client setup using `reqwest`
- [ ] Authentication header with API key
- [ ] Base URL configuration
- [ ] Request/response structs for Whisper API
- [ ] Proper error types for API errors (auth, rate limit, network, etc.)
- [ ] Logging for all API requests

---

### Task 5.2: Implement Audio Upload to Whisper
**Priority**: P0 - Core Feature  
**Estimated Time**: 2.5 hours

**Definition of Done:**
- [ ] Function to upload audio file to Whisper transcription endpoint
- [ ] Multipart form data with file, model, language, response_format
- [ ] Model: "whisper-1"
- [ ] Response format: "verbose_json" for timestamps
- [ ] Language parameter from settings
- [ ] File reading and streaming
- [ ] Progress tracking for upload (if possible)
- [ ] Returns transcript with word-level timestamps

---

### Task 5.3: Implement Translation Support
**Priority**: P1 - Feature  
**Estimated Time**: 1 hour

**Definition of Done:**
- [ ] Function to upload audio file to Whisper translation endpoint
- [ ] Translation endpoint: `/v1/audio/translations`
- [ ] Only translate if target language is selected and different from source
- [ ] Same parameters as transcription
- [ ] Translation always outputs English (Whisper API limitation documented)
- [ ] UI note about translation to English only

---

### Task 5.4: Implement Retry Logic
**Priority**: P0 - Reliability  
**Estimated Time**: 2 hours

**Definition of Done:**
- [ ] `src-tauri/src/utils/retry.rs` created
- [ ] Generic retry function with configurable max attempts
- [ ] Exponential backoff between retries (1s, 2s, 4s, 8s...)
- [ ] Retry on network errors and rate limit errors (429)
- [ ] No retry on auth errors (401, 403)
- [ ] Logging for each retry attempt
- [ ] Returns final error if all retries exhausted
- [ ] Respects max retries from settings

---

### Task 5.5: Parse Whisper API Response
**Priority**: P0 - Core Feature  
**Estimated Time**: 1.5 hours

**Definition of Done:**
- [ ] Parse verbose_json response from Whisper API
- [ ] Extract text segments with timestamps
- [ ] Struct: `Segment { start: f64, end: f64, text: String }`
- [ ] Handle different response formats (word-level, segment-level)
- [ ] Error handling for malformed JSON
- [ ] Unit tests with sample API responses
- [ ] Timestamp validation (start < end, no negative values)

---

### Task 5.6: Implement Test API Key Command
**Priority**: P1 - User Value  
**Estimated Time**: 1 hour

**Definition of Done:**
- [ ] `test_api_key(key: String)` Tauri command
- [ ] Makes lightweight Whisper API call (or list models endpoint)
- [ ] Returns success/failure status
- [ ] Error message for invalid key
- [ ] "Test API Key" button in Settings UI calls command
- [ ] Loading state during test
- [ ] Success/error notification in UI

---

## Phase 6: Subtitle Generation

### Task 6.1: Create SRT Formatter Utility
**Priority**: P0 - Core Feature  
**Estimated Time**: 2 hours

**Definition of Done:**
- [ ] `src-tauri/src/utils/srt.rs` created
- [ ] Function to convert timestamp (seconds) to SRT format (HH:MM:SS,mmm)
- [ ] Function to format single subtitle entry (index, timestamps, text)
- [ ] Function to generate complete SRT file from segments
- [ ] Proper newline handling (double newline between entries)
- [ ] Timestamp precision (milliseconds)
- [ ] Unit tests for timestamp conversion
- [ ] Unit tests for SRT generation with sample data

---

### Task 6.2: Implement Chunk Transcript Merging
**Priority**: P0 - Core Feature  
**Estimated Time**: 2 hours

**Definition of Done:**
- [ ] Function to merge transcripts from multiple chunks
- [ ] Adjust timestamps based on chunk offset (chunk 2 starts at chunk 1 duration, etc.)
- [ ] Maintain sequential subtitle indices
- [ ] Handle overlapping timestamps at chunk boundaries
- [ ] Validation that merged timestamps are monotonically increasing
- [ ] Error handling for malformed chunk transcripts
- [ ] Unit tests with multiple chunk scenarios

---

### Task 6.3: Implement SRT File Writing
**Priority**: P0 - Core Feature  
**Estimated Time**: 1 hour

**Definition of Done:**
- [ ] Function to write SRT content to file
- [ ] UTF-8 encoding with BOM (for Windows compatibility)
- [ ] File path generation (same name as video, .srt extension)
- [ ] Respect output folder settings
- [ ] File overwrite confirmation (if exists)
- [ ] Error handling for file I/O
- [ ] Success event emission with output path

---

### Task 6.4: Implement Main Processing Orchestration
**Priority**: P0 - Core Feature  
**Estimated Time**: 3 hours

**Definition of Done:**
- [ ] `process_video(config: ProcessingConfig)` Tauri command
- [ ] ProcessingConfig includes video path, languages, output path, settings
- [ ] Orchestrates full pipeline: probe → split → extract → transcribe → merge → generate SRT
- [ ] Progress events at each stage
- [ ] Error handling with cleanup
- [ ] Cancellation support
- [ ] Async/tokio runtime usage
- [ ] Command registered in `main.rs`
- [ ] Returns result with output file path or error

---

### Task 6.5: Implement Process Button and Flow
**Priority**: P0 - Core Feature  
**Estimated Time**: 2 hours

**Definition of Done:**
- [ ] "Start Processing" button in main UI
- [ ] Button enabled only when video selected and settings valid
- [ ] Calls `process_video()` command with all parameters
- [ ] Disables button during processing
- [ ] Shows ProgressDisplay component
- [ ] Handles success/error results
- [ ] Success notification with "Open Subtitle File" button
- [ ] Error notification with retry option

---

## Phase 7: Polish & Testing

### Task 7.1: Implement Cancel Functionality
**Priority**: P1 - User Value  
**Estimated Time**: 2 hours

**Definition of Done:**
- [ ] `cancel_processing()` Tauri command
- [ ] Cancellation flag in shared state
- [ ] Check cancellation flag between chunks
- [ ] Cleanup temp files on cancellation
- [ ] Cancel button in UI during processing
- [ ] Confirmation dialog before canceling
- [ ] Status update: "Cancelled by user"
- [ ] Return to idle state

---

### Task 7.2: Implement Error Messages
**Priority**: P0 - User Experience  
**Estimated Time**: 1.5 hours

**Definition of Done:**
- [ ] User-friendly error messages for all failure scenarios
- [ ] FFmpeg errors: "Failed to process video. The file may be corrupted."
- [ ] API errors: "Transcription failed. Check your API key or network connection."
- [ ] Disk space errors: "Not enough disk space."
- [ ] Toast/notification component for errors
- [ ] Error logging to console/file for debugging
- [ ] Retry suggestions in error messages

---

### Task 7.3: Add Loading States
**Priority**: P1 - User Experience  
**Estimated Time**: 1 hour

**Definition of Done:**
- [ ] Loading spinner/skeleton for video info probe
- [ ] Loading state for settings load
- [ ] Loading state for API key test
- [ ] Disabled buttons during async operations
- [ ] Loading text messages (e.g., "Analyzing video...")
- [ ] Proper loading state transitions

---

### Task 7.4: Implement Cleanup Logic
**Priority**: P0 - Reliability  
**Estimated Time**: 1.5 hours

**Definition of Done:**
- [ ] Cleanup temp files after successful processing
- [ ] Cleanup temp files after errors
- [ ] Cleanup temp files on app shutdown
- [ ] Cleanup temp files on cancellation
- [ ] Configurable temp file retention (for debugging)
- [ ] Cleanup old temp directories from previous runs
- [ ] Logging for cleanup operations

---

### Task 7.5: End-to-End Testing
**Priority**: P0 - Quality  
**Estimated Time**: 3 hours

**Definition of Done:**
- [ ] Test with small video (< 5 min) - success case
- [ ] Test with medium video (30 min spanning 2 chunks)
- [ ] Test with large video (90+ min, multiple chunks)
- [ ] Test with various formats (MP4, AVI, MKV, MOV)
- [ ] Test with invalid video file
- [ ] Test with invalid API key
- [ ] Test cancellation mid-process
- [ ] Test all error scenarios
- [ ] Verify SRT file accuracy (timestamps, text)
- [ ] Test settings persistence across app restarts

---

### Task 7.6: Memory and Performance Optimization
**Priority**: P1 - Quality  
**Estimated Time**: 2 hours

**Definition of Done:**
- [ ] Memory profiling during large video processing
- [ ] Streaming file reads instead of loading entire files
- [ ] Cleanup chunk files immediately after transcription
- [ ] Optimize FFmpeg commands for speed
- [ ] Parallel audio extraction (if safe)
- [ ] Cancel long-running FFmpeg commands on error
- [ ] Memory usage stays under reasonable limits (< 500MB)

---

### Task 7.7: UI/UX Improvements
**Priority**: P2 - Polish  
**Estimated Time**: 2 hours

**Definition of Done:**
- [ ] Professional styling with consistent color scheme
- [ ] Icons for buttons and actions
- [ ] Hover states and animations
- [ ] Responsive layout (min window size enforcement)
- [ ] Tooltips for settings options
- [ ] Keyboard shortcuts (Ctrl+O for file picker, etc.)
- [ ] Focus management and accessibility
- [ ] Dark mode support (optional)

---

### Task 7.8: Documentation
**Priority**: P2 - Maintenance  
**Estimated Time**: 2 hours

**Definition of Done:**
- [ ] README.md with setup instructions
- [ ] Development environment setup guide
- [ ] How to obtain OpenAI API key
- [ ] Building for production instructions
- [ ] Troubleshooting common issues
- [ ] Code comments for complex logic
- [ ] API documentation for Tauri commands
- [ ] Architecture diagram (optional)

---

### Task 7.9: Windows Installer Configuration
**Priority**: P1 - Distribution  
**Estimated Time**: 1.5 hours

**Definition of Done:**
- [ ] `tauri.conf.json` configured for Windows installer
- [ ] App icon set (various sizes)
- [ ] Installer metadata (name, version, publisher)
- [ ] File associations for video files (optional)
- [ ] Test installer on clean Windows machine
- [ ] Installer size reasonable (< 150MB)
- [ ] Uninstaller works correctly

---

## Summary

**Total Estimated Time**: ~65-70 hours

**Critical Path** (must complete in order):
1. Phase 1: Foundation and settings (8-10 hours)
2. Phase 2: UI and file selection (6-8 hours)
3. Phase 3: Video analysis (5-7 hours)
4. Phase 4: Video processing backend (10-12 hours)
5. Phase 5: Whisper API integration (9-11 hours)
6. Phase 6: SRT generation and orchestration (10-12 hours)
7. Phase 7: Polish and testing (10-12 hours)

**Parallelizable Work:**
- Frontend and backend tasks within same phase can sometimes be done in parallel
- UI styling can happen alongside backend work
- Documentation can be written throughout

**High Risk Tasks:**
- FFmpeg bundling and sidecar configuration (may have platform-specific issues)
- Whisper API retry logic (network edge cases)
- Chunk merging with timestamp accuracy (complex logic)
- Memory management for large videos

**Quick Wins** (small, high value):
- Cost estimation display
- API key test button
- Progress visualization
- File drag-and-drop
