---
name: video-audio-processor
description: "Process video/audio recordings (Zoom, meetings, etc.) by transcribing audio with Whisper and extracting visual frames with ffmpeg. Auto-detects your hardware (Apple Silicon, NVIDIA, AMD, CPU) and picks the best transcription model. Cross-platform: macOS, Linux, Windows."
allowed-tools: Bash, Read, Write, Glob, Grep, AskUserQuestion
---

# Video/Audio Processor

Process video and audio recordings into text transcripts and visual frame captures for analysis. Auto-detects your hardware and picks the optimal transcription model, device, and settings.

## Phase 0: Detect Compute Environment

Run this at the start of every invocation. It determines everything downstream.

```bash
python3 -c "
import platform, shutil, subprocess, json

info = {'os': platform.system(), 'arch': platform.machine(), 'ram_gb': 0, 'gpu': 'none', 'vram_gb': 0, 'device': 'cpu', 'dtype': 'float32'}

# RAM
try:
    if platform.system() == 'Darwin':
        import os; info['ram_gb'] = round(os.sysconf('SC_PAGE_SIZE') * os.sysconf('SC_PHYS_PAGES') / (1024**3))
    elif platform.system() == 'Linux':
        with open('/proc/meminfo') as f:
            for line in f:
                if line.startswith('MemTotal'):
                    info['ram_gb'] = round(int(line.split()[1]) / (1024**2))
                    break
    else:
        import ctypes
        mem = ctypes.c_ulonglong(0)
        ctypes.windll.kernel32.GetPhysicallyInstalledMemory(ctypes.byref(mem))
        info['ram_gb'] = round(mem.value / (1024**2))
except: pass

# GPU detection
try:
    import torch
    if torch.cuda.is_available():
        info['gpu'] = torch.cuda.get_device_name(0)
        info['vram_gb'] = round(torch.cuda.get_device_properties(0).total_mem / (1024**3))
        info['device'] = 'cuda'
        info['dtype'] = 'float16'
    elif hasattr(torch.backends, 'mps') and torch.backends.mps.is_available():
        info['gpu'] = 'Apple Silicon (MPS)'
        info['vram_gb'] = info['ram_gb']  # unified memory
        info['device'] = 'mps'
        info['dtype'] = 'float16'
    elif hasattr(torch, 'hip') or 'AMD' in str(getattr(torch, '_C', '')):
        info['gpu'] = 'AMD (ROCm)'
        info['device'] = 'cuda'  # ROCm uses cuda API
        info['dtype'] = 'float16'
except ImportError:
    pass

# ffmpeg detection
info['ffmpeg'] = shutil.which('ffmpeg') is not None
info['ffprobe'] = shutil.which('ffprobe') is not None

print(json.dumps(info))
"
```

Parse the JSON output and store it internally as `COMPUTE`. Present the results to the user:

> **Detected hardware:**
> - OS: {os} ({arch})
> - RAM: {ram_gb} GB
> - GPU: {gpu} ({vram_gb} GB VRAM)
> - Compute device: {device}
> - ffmpeg: {installed/missing}

### Whisper Engine Selection

Based on hardware, choose the transcription engine:

| Condition | Engine | Reason |
|-----------|--------|--------|
| CUDA GPU available | `faster-whisper` | GPU-accelerated CTranslate2, 4x faster than standard Whisper |
| MPS (Apple Silicon) | `openai-whisper` | Standard Whisper, uses MPS acceleration when available |
| CPU only | `openai-whisper` | Standard Whisper on CPU, reliable fallback |

### Model Selection Matrix

Based on hardware and recording length, recommend a model:

| Condition | Recommended Model | Speed (1hr recording) | Accuracy |
|-----------|------------------|----------------------|----------|
| CUDA >= 8 GB VRAM | `large-v3` | ~5 min | Best |
| CUDA 4-7 GB VRAM | `medium` | ~8 min | High |
| MPS (Apple Silicon, 16+ GB) | `medium` | ~15 min | High |
| MPS (Apple Silicon, 8 GB) | `small` | ~10 min | Good |
| CPU + RAM >= 16 GB | `small` | ~30 min | Good |
| CPU + RAM < 16 GB | `base` | ~15 min | Adequate |

Present the recommendation and let the user choose:

```
AskUserQuestion: "Which transcription model should I use?"
Options:
- [Recommended model] (Recommended) - [reason based on their hardware]
- large-v3 - Best accuracy, needs 8+ GB VRAM or lots of RAM
- medium - High accuracy, balanced speed
- small - Good accuracy, faster processing
- base - Adequate for most meetings, fastest
```

Store the chosen model as `WHISPER_MODEL` and engine as `WHISPER_ENGINE`.

## Phase 1: Identify the Recording

Find the file. Zoom recordings typically follow the pattern:
- `GMT{date}-{time}_Recording_{resolution}.mp4` (video)
- `GMT{date}-{time}_Recording.m4a` (audio only)
- `GMT{date}-{time}_RecordingnewChat.txt` (chat log)

Check for all three artifacts. Read the chat file first (it's small and gives immediate context).

## Phase 2: Install Dependencies

Check and install what's needed based on platform.

### ffmpeg

```bash
# Check if ffmpeg is available
ffmpeg -version 2>&1 | head -1
ffprobe -version 2>&1 | head -1
```

If ffmpeg is missing, install based on platform:

| Platform | Install command |
|----------|----------------|
| macOS (Homebrew) | `brew install ffmpeg` |
| macOS (no Homebrew) | Guide user to install Homebrew first, then ffmpeg |
| Ubuntu/Debian | `sudo apt update && sudo apt install -y ffmpeg` |
| Fedora/RHEL | `sudo dnf install -y ffmpeg` |
| Arch Linux | `sudo pacman -S ffmpeg` |
| Windows (winget) | `winget install Gyan.FFmpeg` |
| Windows (choco) | `choco install ffmpeg` |
| Windows (scoop) | `scoop install ffmpeg` |

### Python + Whisper

```bash
python3 -c "import torch; print(torch.__version__)" 2>&1
```

If torch is missing, install based on platform:

| Platform | Install command |
|----------|----------------|
| macOS (MPS) | `pip3 install torch torchvision torchaudio` |
| Linux (CUDA) | `pip3 install torch torchvision torchaudio --index-url https://download.pytorch.org/whl/cu121` |
| Linux (ROCm) | `pip3 install torch torchvision torchaudio --index-url https://download.pytorch.org/whl/rocm6.0` |
| Linux/Windows (CPU) | `pip3 install torch torchvision torchaudio --index-url https://download.pytorch.org/whl/cpu` |
| Windows (CUDA) | `pip3 install torch torchvision torchaudio --index-url https://download.pytorch.org/whl/cu121` |

Then install the transcription engine:

```bash
# For CUDA systems (faster-whisper with CTranslate2 acceleration)
pip3 install faster-whisper

# For MPS / CPU systems (standard OpenAI Whisper)
pip3 install openai-whisper
```

## Phase 3: Get Duration

Use `ffprobe` (cross-platform) to get the file duration:

```bash
ffprobe -v quiet -show_entries format=duration -of csv=p=0 "/path/to/file"
```

This returns duration in seconds. Convert to human-readable format and display to user. Use this to estimate transcription time based on the selected model and hardware.

Present the plan:

> **Processing plan:**
> - File: {filename} ({duration})
> - Engine: {WHISPER_ENGINE} with {WHISPER_MODEL} model on {device}
> - Estimated transcription time: {estimate}
> - Frame extraction: 1 per minute ({frame_count} frames)
>
> Want me to adjust anything before starting?

### Time Estimates

| Device | base | small | medium | large-v3 |
|--------|------|-------|--------|----------|
| CUDA (RTX 3060+) | ~1 min/hr | ~2 min/hr | ~4 min/hr | ~5 min/hr |
| CUDA (faster-whisper) | ~30s/hr | ~1 min/hr | ~2 min/hr | ~3 min/hr |
| MPS (M1/M2/M3/M4) | ~3 min/hr | ~6 min/hr | ~15 min/hr | ~25 min/hr |
| CPU (16GB+ RAM) | ~8 min/hr | ~15 min/hr | ~30 min/hr | ~60 min/hr |

## Phase 4: Extract Visual Frames

Extract one frame per minute for visual context. Use a cross-platform temp directory:

```bash
# Create temp directory (cross-platform)
python3 -c "import tempfile, os; d = os.path.join(tempfile.gettempdir(), 'av-frames'); os.makedirs(d, exist_ok=True); print(d)"
```

Then extract frames:

```bash
ffmpeg -i "/path/to/video.mp4" \
  -vf "fps=1/60,scale=1280:-1" -q:v 3 {TEMP_DIR}/frame_%03d.jpg
```

Use the Read tool on each frame to view it. Frames show:
- Screen shares (code, slides, UIs)
- Participant names (bottom-left of each video tile)
- Timestamps (if visible in screen share)

## Phase 5: Transcribe Audio

Run the transcription engine. Choose the correct code based on `WHISPER_ENGINE`:

### faster-whisper (CUDA systems)

```python
from faster_whisper import WhisperModel
import json

model = WhisperModel("{WHISPER_MODEL}", device="cuda", compute_type="float16")
segments, info = model.transcribe("/path/to/audio", beam_size=5, language="en")

results = []
for segment in segments:
    results.append({
        "start": segment.start,
        "end": segment.end,
        "text": segment.text.strip()
    })

# Save timestamped transcript
with open("{TEMP_DIR}/transcript.json", "w") as f:
    json.dump({"language": info.language, "segments": results}, f, indent=2)

with open("{TEMP_DIR}/transcript.txt", "w") as f:
    for seg in results:
        start = int(seg["start"])
        mins, secs = divmod(start, 60)
        f.write(f"[{mins:02d}:{secs:02d}] {seg['text']}\n")

print(f"Transcribed {len(results)} segments")
```

### openai-whisper (MPS / CPU systems)

```python
import whisper, json

model = whisper.load_model("{WHISPER_MODEL}")
result = model.transcribe("/path/to/audio", verbose=False)

# Save timestamped transcript
with open("{TEMP_DIR}/transcript.json", "w") as f:
    json.dump(result, f, indent=2)

with open("{TEMP_DIR}/transcript.txt", "w") as f:
    for seg in result["segments"]:
        start = int(seg["start"])
        mins, secs = divmod(start, 60)
        f.write(f"[{mins:02d}:{secs:02d}] {seg['text'].strip()}\n")

print(f"Transcribed {len(result['segments'])} segments")
```

Run transcription in the background since it takes significant time. While it runs, review the extracted frames visually.

## Phase 6: Synthesize

Combine visual frames + transcript + chat to build understanding:
- **Who**: Identify participants from video name labels and voice attribution
- **What**: What was shown on screen (demos, slides, code)
- **Said**: Key quotes, decisions, requirements, feedback
- **Action items**: Explicit commitments and follow-ups

## Model Reference

| Model | Parameters | Speed | Accuracy | Best For |
|-------|-----------|-------|----------|----------|
| `tiny` | 39M | Very fast | Low | Quick scan, checking if audio is usable |
| `base` | 74M | Fast | Adequate | Default for short/clear meetings |
| `small` | 244M | Moderate | Good | General meetings with accents |
| `medium` | 769M | Slow | High | Important meetings, customer-facing |
| `large-v3` | 1.5B | Very slow | Best | Critical recordings, poor audio quality |

## Tips

- Always run transcription in the background while reviewing frames visually
- Read frames in batches of 8 (tool parallelism limit)
- Standard Whisper uses FP32 on CPU and MPS; faster-whisper uses CTranslate2 with FP16 on CUDA
- For very long recordings (>1 hour), consider splitting audio first
- Chat files from Zoom contain timestamps and shared links, read first for quick context
- On Windows, use forward slashes or raw strings for file paths in Python

## Error Handling

| Error | Cause | Fix |
|-------|-------|-----|
| `ffmpeg: command not found` | ffmpeg not installed | Install per platform table above |
| `No module named 'whisper'` | Whisper not installed | `pip3 install openai-whisper` |
| `No module named 'faster_whisper'` | faster-whisper not installed | `pip3 install faster-whisper` |
| `CUDA out of memory` | Model too large for VRAM | Switch to smaller model |
| `RuntimeError: MPS backend` | MPS issue on older macOS | Update macOS, or fall back to CPU with `PYTORCH_MPS_HIGH_WATERMARK_RATIO=0.0` |
| `torch not found` | Python deps missing | Install torch per platform table above |
| Garbled transcript | Wrong language or poor audio | Try specifying `language="en"` or use a larger model |
| Very slow transcription | Running large model on CPU | Switch to `base` or `small` model |
