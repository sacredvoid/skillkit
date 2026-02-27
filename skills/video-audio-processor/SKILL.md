---
name: video-audio-processor
description: Process video/audio recordings (Zoom, meetings, etc.) by transcribing audio with Whisper and extracting visual frames with ffmpeg. Use when the user provides a video/audio file and wants transcription, meeting notes, observations, or content extraction.
---

# Video/Audio Processor

Process video and audio recordings into text transcripts and visual frame captures for analysis.

## Prerequisites

These tools must be installed (install if missing):

```bash
# Audio/video processing
brew install ffmpeg

# Speech-to-text transcription
pip3 install openai-whisper
```

## Workflow

### 1. Identify the Recording

Find the file. Zoom recordings typically follow the pattern:
- `GMT{date}-{time}_Recording_{resolution}.mp4` (video)
- `GMT{date}-{time}_Recording.m4a` (audio only)
- `GMT{date}-{time}_RecordingnewChat.txt` (chat log)

Check for all three artifacts. Read the chat file first (it's small and gives immediate context).

### 2. Get Duration

```bash
afinfo "/path/to/file.m4a" 2>/dev/null | grep "estimated duration"
```

### 3. Extract Visual Frames

Extract one frame per minute for visual context:

```bash
mkdir -p /tmp/zoom-frames && ffmpeg -i "/path/to/video.mp4" \
  -vf "fps=1/60,scale=1280:-1" -q:v 3 /tmp/zoom-frames/frame_%03d.jpg
```

Use the Read tool on each frame to view it. Frames show:
- Screen shares (code, slides, UIs)
- Participant names (bottom-left of each video tile)
- Timestamps (if visible in screen share)

### 4. Transcribe Audio

Run Whisper transcription (use `base` model for speed, `medium` for accuracy on long recordings):

```python
import whisper, json

model = whisper.load_model("base")  # or "medium" for better accuracy
result = model.transcribe("/path/to/audio.m4a", verbose=False)

# Save timestamped transcript
with open("/tmp/zoom-transcript.json", "w") as f:
    json.dump(result, f, indent=2)

with open("/tmp/zoom-transcript.txt", "w") as f:
    for seg in result["segments"]:
        start = int(seg["start"])
        mins, secs = divmod(start, 60)
        f.write(f"[{mins:02d}:{secs:02d}] {seg['text'].strip()}\n")
```

Run this in the background since it takes ~3 minutes for a 47-minute recording on CPU.

### 5. Synthesize

Combine visual frames + transcript + chat to build understanding:
- **Who**: Identify participants from video name labels and voice attribution
- **What**: What was shown on screen (demos, slides, code)
- **Said**: Key quotes, decisions, requirements, feedback
- **Action items**: Explicit commitments and follow-ups

## Model Selection

| Model | Speed | Accuracy | Best For |
|-------|-------|----------|----------|
| `tiny` | Very fast | Low | Quick scan, checking if audio is usable |
| `base` | Fast (~3 min for 47 min) | Good | Default for most meetings |
| `small` | Moderate | Better | Important meetings with accents |
| `medium` | Slow (~10 min for 47 min) | High | Customer-facing recordings, legal |
| `large` | Very slow | Best | Critical recordings, poor audio quality |

## Tips

- Always run transcription in the background while reviewing frames visually
- Read frames in batches of 8 (tool parallelism limit)
- Whisper uses FP32 on CPU (M-series Macs) - this is normal, ignore the warning
- For very long recordings (>1 hour), consider splitting audio first
- Chat files from Zoom contain timestamps and shared links - read first for quick context
