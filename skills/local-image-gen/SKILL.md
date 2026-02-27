---
name: local-image-gen
description: "Generate custom images locally using Stable Diffusion. Auto-detects your hardware (Apple Silicon, NVIDIA, AMD, CPU) and picks the best model and settings. Supports single and batch modes. Cross-platform: macOS, Linux, Windows."
argument-hint: "[slug] [image description, e.g. 'abstract neural network, dark blue gradient']"
disable-model-invocation: true
allowed-tools: Bash, Read, Write, Glob, Grep, AskUserQuestion
---

# Local Image Generator

Generate images locally using Stable Diffusion. Auto-detects your hardware and picks the optimal model, device, and resolution.

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

print(json.dumps(info))
"
```

Parse the JSON output and store it internally as `COMPUTE`. Present the results to the user:

> **Detected hardware:**
> - OS: {os} ({arch})
> - RAM: {ram_gb} GB
> - GPU: {gpu} ({vram_gb} GB VRAM)
> - Compute device: {device}

### Model Selection Matrix

Based on the detected hardware, recommend a model from this table:

| Condition | Recommended Model | Reason |
|-----------|------------------|--------|
| VRAM >= 8 GB (CUDA or MPS) | `stabilityai/sdxl-turbo` | Best quality, fast with GPU |
| VRAM 4-7 GB (CUDA) | `stabilityai/sd-turbo` | Lighter model, fits in low VRAM |
| VRAM < 4 GB or CPU + RAM >= 16 GB | `stabilityai/sd-turbo` + CPU offload | Slow but works |
| CPU + RAM < 16 GB | `segmind/tiny-sd` | Smallest model, runs on anything |

Present the recommendation and let the user choose:

```
AskUserQuestion: "Which image generation model should I use?"
Options:
- [Recommended model] (Recommended) — [reason based on their hardware]
- SDXL-Turbo — Best quality, needs 8+ GB VRAM, ~6 GB download
- SD-Turbo — Good quality, needs 4+ GB VRAM, ~3 GB download
- Tiny-SD — Lower quality, runs on any hardware, ~1 GB download
```

Store the chosen model as `MODEL`.

### Resolution Selection

Based on model and VRAM:

| VRAM | SDXL-Turbo | SD-Turbo | Tiny-SD |
|------|-----------|----------|---------|
| >= 16 GB | 1200x640 | 1200x640 | 768x408 |
| 8-15 GB | 1024x576 | 1200x640 | 768x408 |
| 4-7 GB | N/A | 768x408 | 512x272 |
| CPU | N/A | 512x272 | 512x272 |

### Steps Selection

| Device | SDXL-Turbo | SD-Turbo | Tiny-SD |
|--------|-----------|----------|---------|
| CUDA | 4-6 | 4-6 | 20-30 |
| MPS | 6 | 6 | 25 |
| CPU | 6-8 | 6-8 | 30-40 |

## Phase 1: Determine What to Generate

**If the user provided a slug and prompt** (argument after the skill name), parse them and skip to Phase 3.

Expected argument format: `{slug} {prompt}` (e.g., `beginners-guide-to-rag abstract knowledge retrieval system with floating documents`)

**If only a slug was provided**, read the blog post to generate an appropriate prompt:

```bash
# Find the blog post
cat content/blog/{SLUG}.mdx 2>/dev/null | head -50
```

Extract the title, description, and key themes. Generate a prompt using **one of the SAI style templates below** that best fits the post's topic. Each image MUST use a different style to avoid visual repetition across blog posts.

### SAI Style Templates (pick ONE per image)

Each template wraps your subject description in a distinct visual style. Replace `{subject}` with a short, vivid description of the post's core concept as a visual metaphor.

| Style | Template | Best for |
|-------|----------|----------|
| **Isometric** | `isometric style {subject}. vibrant, beautiful, crisp, detailed, ultra detailed, intricate` | Architecture, systems, infrastructure |
| **Low-poly** | `low-poly style {subject}. low-poly game art, polygon mesh, jagged, blocky, wireframe edges, centered composition` | Tutorials, beginner guides, fundamentals |
| **Neonpunk** | `neonpunk style {subject}. cyberpunk, vaporwave, neon, vibrant, stunningly beautiful, crisp, detailed, sleek, ultramodern, magenta highlights, dark purple shadows, high contrast, cinematic` | AI/ML, cutting-edge tech, future-facing |
| **Concept art** | `concept art {subject}. digital artwork, illustrative, painterly, matte painting, highly detailed` | Opinion pieces, deep dives, strategy |
| **Line art** | `line art drawing {subject}. professional, sleek, modern, minimalist, graphic, line art, vector graphics` | Comparisons, frameworks, decision guides |
| **3D model** | `professional 3d model {subject}. octane render, highly detailed, volumetric, dramatic lighting` | Product/tool reviews, practical guides |
| **Fantasy** | `ethereal fantasy concept art of {subject}. magnificent, celestial, ethereal, painterly, epic, majestic, magical` | Vision pieces, thought leadership |
| **Cinematic** | `cinematic film still {subject}. shallow depth of field, vignette, highly detailed, high budget, bokeh, cinemascope, moody, epic, gorgeous` | Case studies, real-world stories |

### Subject Description Guidelines

Write the `{subject}` as a **vivid visual metaphor**, not a literal description. Never include hands, fingers, faces, or human figures.

- **Good:** "a crystalline data pipeline splitting light into rainbow streams"
- **Bad:** "data pipeline architecture diagram"
- **Good:** "mechanical clockwork gears meshing with glowing circuit traces"
- **Bad:** "AI system with nodes and connections"

Vary across posts: color palette, physical metaphor (clockwork, rivers, crystals, bridges, constellations), and composition.

**If no input was provided**, use AskUserQuestion to ask for a slug and description.

## Phase 2: Confirm with User

Present the generation plan:

> I'll generate a hero image for `{slug}`:
> **Model:** {MODEL} on {device}
> **Resolution:** {width}x{height} ({steps} steps)
> **Prompt:** "{prompt}"
> **Seed:** {seed or "random"}
> **Estimated time:** {estimate based on device and model}
>
> Want me to adjust anything before generating?

Time estimates:

| Device | SDXL-Turbo | SD-Turbo | Tiny-SD |
|--------|-----------|----------|---------|
| CUDA (RTX 3060+) | 5-10s | 3-8s | 15-25s |
| MPS (M1/M2/M3/M4) | 25-35s | 15-25s | 30-45s |
| CPU (16GB+ RAM) | 3-8 min | 2-5 min | 5-10 min |

## Phase 3: Install Dependencies

Check and install what's needed based on platform:

```bash
# Check Python + torch
python3 -c "import torch; print(torch.__version__)" 2>&1
```

If torch is missing, install based on platform:

| Platform | Install command |
|----------|----------------|
| macOS (MPS) | `pip3 install torch torchvision` |
| Linux (CUDA) | `pip3 install torch torchvision --index-url https://download.pytorch.org/whl/cu121` |
| Linux (ROCm) | `pip3 install torch torchvision --index-url https://download.pytorch.org/whl/rocm6.0` |
| Linux/Windows (CPU) | `pip3 install torch torchvision --index-url https://download.pytorch.org/whl/cpu` |
| Windows (CUDA) | `pip3 install torch torchvision --index-url https://download.pytorch.org/whl/cu121` |

Then install diffusers:

```bash
pip3 install diffusers accelerate Pillow
```

## Phase 4: Generate Image

Run inline Python generation (no external script needed):

```python
import torch
from diffusers import AutoPipelineForText2Image
from PIL import Image
import os

MODEL = "{MODEL}"
DEVICE = "{device}"
DTYPE = torch.float16 if "{dtype}" == "float16" else torch.float32
WIDTH = {width}
HEIGHT = {height}
STEPS = {steps}
PROMPT = "{PROMPT}"
SEED = {SEED}
SLUG = "{SLUG}"

pipe = AutoPipelineForText2Image.from_pretrained(MODEL, torch_dtype=DTYPE, variant="fp16" if DTYPE == torch.float16 else None)
pipe = pipe.to(DEVICE)

if DEVICE == "cuda":
    pipe.enable_attention_slicing()  # Reduce VRAM usage

generator = torch.Generator(device="cpu").manual_seed(SEED)

image = pipe(prompt=PROMPT, num_inference_steps=STEPS, guidance_scale=0.0, width=WIDTH, height=HEIGHT, generator=generator).images[0]

out_dir = f"public/blog/{SLUG}"
os.makedirs(out_dir, exist_ok=True)
image.save(f"{out_dir}/hero.jpg", "JPEG", quality=90)
print(f"Saved to {out_dir}/hero.jpg ({WIDTH}x{HEIGHT})")
```

Run in the background for GPU, or warn the user about wait time for CPU.

For batch generation, loop over entries with the model loaded once.

## Phase 5: Verify and Present

After generation:

1. Check the output file exists:
```bash
file public/blog/{SLUG}/hero.jpg
```

2. Show the image to the user using the Read tool.

3. Ask:
```
AskUserQuestion: "How does this look?"
Options:
- Looks good, use it
- Regenerate with a different seed
- Adjust the prompt and try again
- Try a different model
- Discard
```

If "try a different model": go back to Phase 0's model selection and re-run.

## SDXL-Turbo / SD-Turbo Prompting Rules

**Critical:** These turbo models use `guidance_scale=0.0`, which means negative prompts are IGNORED. All steering must come from the positive prompt alone.

**DO:**
- Always lead with a SAI style prefix (see table above)
- Use vivid, concrete visual metaphors as the subject
- Specify a dominant color palette in the subject

**DON'T:**
- Don't include hands, fingers, or human body parts (renders badly)
- Don't include faces or people as focal subjects
- Don't request text or labels (diffusion models can't render text reliably)
- Don't rely on negative prompts (ignored at guidance_scale=0.0)

## Error Handling

| Error | Cause | Fix |
|-------|-------|-----|
| `torch not found` | Python deps missing | Install per platform table above |
| `CUDA out of memory` | Model too large for VRAM | Switch to smaller model or reduce resolution |
| `MPS out of memory` | Not enough unified memory | Close other apps, reduce resolution |
| `RuntimeError: slow_conv2d_cpu` | Running on CPU without float32 | Set `DTYPE = torch.float32` for CPU |
| Black/noisy image | Bad seed or too few steps | Try a different seed or increase steps |
| Model download fails | Network issue | Check connection, model is cached at `~/.cache/huggingface/` after first download |
