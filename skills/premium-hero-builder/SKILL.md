---
name: premium-hero-builder
version: 1.0.0
description: |
  Build premium, dark-themed hero sections and landing pages with cinematic video backgrounds,
  liquid glass morphism, editorial typography, and pixel-perfect specifications. Based on the
  Viktor Oddy methodology of detailed design prompts that produce agency-quality results from
  AI code generation. Use when building hero sections, landing pages, or any premium dark UI.
allowed-tools:
  - Read
  - Write
  - Edit
  - Bash
  - Grep
  - Glob
  - Agent
  - WebFetch
  - WebSearch
  - AskUserQuestion
  - TaskCreate
  - TaskUpdate
---

# Premium Hero Builder

Build agency-quality hero sections and landing pages with cinematic video backgrounds, liquid glass morphism, and editorial typography. This skill encodes the patterns, CSS techniques, and design system extracted from 20 pixel-perfect design prompts and the Viktor Oddy methodology.

## When to Use

- Building hero sections or landing pages
- User asks for "premium", "dark", "cinematic", "glassmorphic", or "editorial" UI
- Creating marketing pages, SaaS landing pages, or portfolio sites
- Any request involving background videos, liquid glass effects, or high-end typography

## Core Philosophy

> "AI will not replace you, but designers who use AI will replace those who don't."

The difference between generic AI output and premium results is **prompt specificity**. Generic prompts produce template-looking sites. Detailed prompts with exact fonts, sizes, colors, spacing, and effects produce agency-quality work.

**The formula:**
1. Pick a visual direction from the Reference Patterns below
2. Specify every detail: fonts, sizes, colors, spacing, effects, animations
3. Build in layers: background video -> overlays -> content -> glass effects -> animations
4. Iterate: add videos to multiple sections, swap placeholder images, refine copy

---

## Design System: Recurring Patterns

### Typography Pairings (Pick One)

| Display Font | Body Font | Vibe |
|---|---|---|
| Instrument Serif (italic) | Inter / Barlow / Geist | Editorial, Apple-like |
| General Sans | Inter | Web3, Modern |
| Rubik (bold, uppercase) | Rubik (regular) | Industrial, Bold |
| Poppins + Source Serif 4 | Poppins | Botanical, Refined |
| Instrument Sans | Instrument Serif (italic accent) | SaaS, Clean |

**Rule:** Display font for headlines (big, dramatic). Body font for nav, descriptions, buttons. One italic serif accent word inside a sans-serif headline creates instant editorial feel.

### Color Palettes

**Pure Black (most common):**
```css
--background: #000000;
--foreground: #ffffff;
--muted: #888888 or hsl(0 0% 65%);
```

**Deep Navy:**
```css
--background: hsl(201 100% 13%);  /* or hsl(260 87% 3%) */
--foreground: #ffffff;
```

**Dark Purple:**
```css
--background: #070612;
--primary: #7b39fc;
--secondary: #2b2344;
```

### The Liquid Glass Effect

This is THE signature effect. Two tiers - subtle and strong.

```css
/* Tier 1: Subtle liquid glass */
.liquid-glass {
  background: rgba(255, 255, 255, 0.01);
  background-blend-mode: luminosity;
  backdrop-filter: blur(4px);
  -webkit-backdrop-filter: blur(4px);
  border: none;
  box-shadow: inset 0 1px 1px rgba(255, 255, 255, 0.1);
  position: relative;
  overflow: hidden;
}
.liquid-glass::before {
  content: '';
  position: absolute;
  inset: 0;
  border-radius: inherit;
  padding: 1.4px;
  background: linear-gradient(180deg,
    rgba(255,255,255,0.45) 0%, rgba(255,255,255,0.15) 20%,
    rgba(255,255,255,0) 40%, rgba(255,255,255,0) 60%,
    rgba(255,255,255,0.15) 80%, rgba(255,255,255,0.45) 100%);
  -webkit-mask: linear-gradient(#fff 0 0) content-box, linear-gradient(#fff 0 0);
  -webkit-mask-composite: xor;
  mask-composite: exclude;
  pointer-events: none;
}

/* Tier 2: Strong liquid glass (for CTAs, panels) */
.liquid-glass-strong {
  background: rgba(255, 255, 255, 0.01);
  background-blend-mode: luminosity;
  backdrop-filter: blur(50px);
  -webkit-backdrop-filter: blur(50px);
  border: none;
  box-shadow: 4px 4px 4px rgba(0,0,0,0.05),
    inset 0 1px 1px rgba(255,255,255,0.15);
  position: relative;
  overflow: hidden;
}
.liquid-glass-strong::before {
  content: '';
  position: absolute;
  inset: 0;
  border-radius: inherit;
  padding: 1.4px;
  background: linear-gradient(180deg,
    rgba(255,255,255,0.5) 0%, rgba(255,255,255,0.2) 20%,
    rgba(255,255,255,0) 40%, rgba(255,255,255,0) 60%,
    rgba(255,255,255,0.2) 80%, rgba(255,255,255,0.5) 100%);
  -webkit-mask: linear-gradient(#fff 0 0) content-box, linear-gradient(#fff 0 0);
  -webkit-mask-composite: xor;
  mask-composite: exclude;
  pointer-events: none;
}
```

### Background Video Patterns

**Direct MP4 (simplest):**
```tsx
<video
  autoPlay loop muted playsInline
  className="absolute inset-0 w-full h-full object-cover z-0"
  src="VIDEO_URL"
/>
```

**HLS Streaming (for Mux URLs):**
```tsx
import Hls from "hls.js";

useEffect(() => {
  const video = videoRef.current;
  if (!video) return;
  if (Hls.isSupported()) {
    const hls = new Hls();
    hls.loadSource(hlsUrl);
    hls.attachMedia(video);
    hls.on(Hls.Events.MANIFEST_PARSED, () => {
      video.play().catch(() => {});
    });
    return () => hls.destroy();
  } else if (video.canPlayType("application/vnd.apple.mpegurl")) {
    video.src = hlsUrl;
    video.addEventListener("loadedmetadata", () => video.play().catch(() => {}));
  }
}, []);
```

**Video with fade-in/out loop (manual):**
Use `requestAnimationFrame` to read `currentTime` and `duration`. Fade opacity 0->1 over 0.5s at start, 1->0 over 0.5s before end. On `ended`, reset and replay.

**Video fade overlays (top + bottom blend to background):**
```tsx
<div className="absolute inset-0 bg-gradient-to-b from-background via-transparent to-background" />
```
For taller sections, use two separate 200px-tall gradients at top and bottom.

### Section Badges (Recurring Element)

Every section gets a small pill badge above the heading:

```tsx
<span className="liquid-glass rounded-full px-3.5 py-1 text-xs font-medium text-white inline-block mb-4">
  Badge Text
</span>
```

### Section Heading Pattern

```tsx
<h2 className="text-4xl md:text-5xl lg:text-6xl font-heading italic text-white tracking-tight leading-[0.9]">
  Heading Text
</h2>
```

### Entrance Animations

Staggered fade-rise using Framer Motion:

```css
@keyframes fade-rise {
  from { opacity: 0; transform: translateY(24px); }
  to { opacity: 1; transform: translateY(0); }
}
.animate-fade-rise { animation: fade-rise 0.8s ease-out both; }
.animate-fade-rise-delay { animation: fade-rise 0.8s ease-out 0.2s both; }
.animate-fade-rise-delay-2 { animation: fade-rise 0.8s ease-out 0.4s both; }
```

Or with motion/react:
```tsx
initial={{ opacity: 0, y: 20 }}
animate={{ opacity: 1, y: 0 }}
transition={{ delay: index * 0.15, duration: 0.6 }}
```

### BlurText Animation (Word-by-Word Reveal)

Splits heading by words. Each word animates via IntersectionObserver:
- filter: blur(10px) -> blur(0px)
- opacity: 0 -> 1
- y: 50 -> 0
- Step duration: 0.35s, stagger: 0.08-0.1s per word

### Logo Marquee

Infinite horizontal scroll of partner logos:
```css
@keyframes marquee {
  0% { transform: translateX(0%); }
  100% { transform: translateX(-50%); }
}
.animate-marquee { animation: marquee 20s linear infinite; }
```
Duplicate the logo set for seamless loop. Apply `brightness-0 invert` to make logos white.

---

## Landing Page Section Blueprint

A complete premium landing page follows this structure (5-7 sections):

1. **Hero** - Video background, badge pill, large headline (serif italic), subtitle, CTA buttons
2. **Partners/Social Proof** - Logo marquee or partner name row in serif italic
3. **How It Works / Start** - Video background section, badge, heading, subtitle, CTA
4. **Features Chess** - Alternating text-left/image-right then image-left/text-right rows. Images in liquid-glass frames.
5. **Feature Grid** - 4-column grid of liquid-glass cards with icons
6. **Stats** - Video background (desaturated), liquid-glass card, 4-stat grid in serif italic
7. **Testimonials** - 3-column grid of liquid-glass quote cards OR scroll-driven word reveal
8. **CTA Footer** - Video background, large heading, two buttons, minimal footer links

### Apple-Style Copywriting

After building, rewrite all text using Apple.com principles:
- Short, punchy sentences (3-6 words for headlines)
- Premium feel: "Obsessively crafted", "Built to convert", "Days, not months"
- Emotional hooks over feature lists
- Sentence fragments are OK for impact

---

## Reference Patterns Library

Below are 20 complete design specifications. Each is a self-contained recipe. When building, pick the closest pattern and adapt it.

### Pattern 1: Automation Platform Hero
**Vibe:** Dark, purple CTA, blurred pill overlay, dashboard preview
**Fonts:** Manrope (nav/body), Inter (headline L1), Instrument Serif italic (headline L2), Cabin (buttons)
**Key specs:**
- Background video at 120% scale, bottom-anchored focal point
- Blurred black pill (801x384px, blur 77.5px) between video and content
- Navbar: 1440px max, 120px h-padding, logo + links left, buttons right
- Hero: max-w-871px centered, mt-162px, 76px headline, -2px tracking
- CTA: #7b39fc primary, #2b2344 secondary, 10px border-radius
- Dashboard: glassmorphic outer frame (24px radius, rgba(255,255,255,0.05) bg), 22.5px inner padding

### Pattern 2: Cinematic Minimal (Velorah)
**Vibe:** Ultra-minimal, cinematic, navy deep background
**Fonts:** Instrument Serif (display), Inter 400/500 (body)
**Key specs:**
- Video: absolute inset-0, object-cover, z-0. No overlays.
- Background: hsl(201 100% 13%) deep navy
- Nav: "Velorah" in Instrument Serif 3xl, liquid-glass CTA pill
- Hero: text-8xl Instrument Serif, leading-[0.95], tracking-[-2.46px]
- Contrast trick: wrap select words in `text-muted-foreground` for color depth
- CTA: liquid-glass rounded-full, px-14 py-5

### Pattern 3: Growth SaaS (Gradient Headline)
**Vibe:** Pure black, giant gradient headline word, purple accents
**Fonts:** General Sans (headline), Geist Sans (body)
**Key specs:**
- Background: hsl(260 87% 3%)
- Primary: hsl(262 83% 58%) purple
- Giant "Grow" headline: text-[230px], gradient fill (223deg, #E8E8E9 -> #3A7BBF)
- Video in separate social-proof section below hero with fade-in/out loop
- Logo marquee: 20s infinite scroll, liquid-glass icon squares

### Pattern 4: AI Design Agency (Full Landing Page)
**Vibe:** Pure black, Instrument Serif italic headings, multi-section
**Fonts:** Instrument Serif italic (headings), Barlow 300-600 (body)
**Key specs:**
- Navbar: fixed, liquid-glass pill in center with nav links + white CTA
- Hero: 1000px height, video at top:20%, BlurText word-by-word animation
- Badge: liquid-glass pill with inner white "New" tag
- 8 sections total: hero, partners, how-it-works, features-chess, feature-grid, stats, testimonials, CTA
- All section videos use HLS via hls.js with Safari fallback
- All section badges: liquid-glass rounded-full px-3.5 py-1 text-xs
- Stats video: desaturated via filter: saturate(0)

### Pattern 5: AI Website Builder (Blue Gradient)
**Vibe:** Dark, blue/indigo gradients, serif + sans pairing
**Fonts:** Instrument Serif (pre-headline), Instrument Sans (main headline + body)
**Key specs:**
- Video: HLS stream, opacity 60%, bg-black/60 overlay + backdrop-blur-[2px]
- Decorative gradient blobs: blue-900/20 and indigo-900/20, blur-[120px], mix-blend-screen
- Pre-headline: Instrument Serif 3xl-5xl
- Main headline: Instrument Sans, text-[136px], gradient from-white to-[#b4c0ff], bg-clip-text
- Primary CTA: white pill with blue (#3054ff) arrow circle, hover glow shadow

### Pattern 6: Hotel Booking Hero
**Vibe:** Video background (no overlay), purple buttons, glassmorphic badge
**Fonts:** Manrope (nav), Instrument Serif (headline), Inter (body), Cabin (buttons)
**Key specs:**
- Video: 100% opacity, no overlay, object-cover
- Tagline pill: bg-[rgba(85,80,110,0.4)], backdrop-blur, border rgba(164,132,215,0.5)
- Inner "New" badge: #7b39fc, rounded 6px
- Headline: 96px desktop, Instrument Serif, "and" italicized with spacing
- CTA: #7b39fc primary, #2b2344 secondary, rounded 10px

### Pattern 7: Video Agency (White Floating Navbar)
**Vibe:** Background video (no overlay), white floating nav, large serif text
**Fonts:** Barlow (body/buttons), Instrument Serif italic (headline L2)
**Key specs:**
- Floating navbar: white bg, rounded-[16px], shadow
- Headline L1: Barlow bold, tracking-[-4px]; L2: Instrument Serif italic 84px
- "See Our Workreel" pill button with play icon
- 45-degree arrow icon in circular housing on dark CTA button
- No video overlay, min-h-[90vh]

### Pattern 8: Liquid Glass Floral (Two-Panel Split)
**Vibe:** Full-screen video, two-panel layout, botanical/organic feel
**Fonts:** Poppins 500 (display/body), Source Serif 4 (italic accents)
**Key specs:**
- Strict grayscale only, no color accents
- Left panel w-[52%]: liquid-glass-strong overlay, hero content, quote at bottom
- Right panel w-[48%]: social icons, community card, feature cards
- CTA: "Explore Now" with Download icon in bg-white/15 circle
- Three pills: "Artistic Gallery", "AI Generation", "3D Structures"
- All icons from lucide-react, no border classes

### Pattern 9: Portfolio Loading Screen
**Vibe:** Minimalist loading animation, monochrome
**Fonts:** Instrument Serif italic 400 (display)
**Key specs:**
- Fixed inset-0, z-[9999], bg #0a0a0a
- "Portfolio" label: top-left, uppercase tracking-[0.3em], text-muted
- Rotating words center: "Design" -> "Create" -> "Inspire" every 900ms
- Counter bottom-right: 000->100 over 2.7s via requestAnimationFrame, 3-digit zero-padded
- Progress bar: 3px tall, gradient #89AACC -> #4E85BF, glow shadow
- Timing: 0s start, 2.7s counter done, 3.1s onComplete, 3.7s page visible

### Pattern 10: Remote Team (Light Mode, Flipped Video)
**Vibe:** Light/white, editorial serif accent, email input hero
**Fonts:** Geist (body), Instrument Serif italic (accent word)
**Key specs:**
- Video: vertically flipped via scaleY(-1), object-cover
- Gradient overlay: from-[rgba(255,255,255,0)] at 26.416% to white at 66.943%
- Headline: 80px Geist medium, tracking -0.04em; accent word 100px Instrument Serif italic
- Email input: rounded-[40px], bg-[#fcfcfc], shadow 0px 10px 40px 5px rgba(194,194,194,0.25)
- CTA button: multi-layered gradient with complex inner shadow

### Pattern 11: Video Editing Agency (Clean)
**Vibe:** Background video (no overlay), white floating nav, Barlow + Serif
**Fonts:** Barlow medium (body), Instrument Serif italic (headline L2)
**Key specs:**
- Video: muted, autoplay, object-cover, 100% opacity
- White floating nav with rounded corners and subtle shadow
- Left: logo. Center: menu links 14px Barlow medium. Right: dark #222 CTA with 45-degree arrow
- Headline L1: Barlow bold tracking-[-4px]. L2: Instrument Serif italic 84px
- Secondary CTA: white pill "See Our Workreel" with play icon

### Pattern 12: Analytics Dashboard SaaS (Neuralyn)
**Vibe:** Pure black, serif accent word, parallax dashboard
**Fonts:** Inter 400-700 (body), Instrument Serif 400-italic (accent)
**Key specs:**
- Liquid glass tag pill with inner "New" badge
- Title: text-7xl, tracking-[-2px], "Overview" in Instrument Serif italic
- Dashboard image: parallax y:[0,-250] on scroll, mix-blend-mode luminosity
- Hero content fades: y:[0,-200] opacity:[1,0] over first 50% scroll
- Section 2: Testimonial with scroll-driven word reveal - each word maps to scroll range, opacity 0.2->1
- Full-width video using w-screen + marginLeft: calc(-50vw + 50%)

### Pattern 13: Logistics Brand (Targo)
**Vibe:** Black + brand red (#EE3F2C), uppercase, industrial
**Fonts:** Rubik bold uppercase (headlines), Rubik (body)
**Key specs:**
- Video: 100% opacity, no overlay
- Clip-path buttons: 10-12px diagonal cuts on top-right and bottom-left corners
- Consultation card: liquid glass with blur(40px) saturate(180%), diagonal shine gradient
- Headline: 64px desktop, 42px mobile
- Left-aligned hero (upper-third, not centered)
- Bottom-left "Book a Free Consultation" card

### Pattern 14: AI Platform (Left-Aligned, Purple-Black)
**Vibe:** Dark purple-black #070612, left-aligned content, HLS video
**Fonts:** Custom (not specified, likely sans-serif)
**Key specs:**
- Video: HLS stream, shifted 200px right (margin-left), scaled 1.2x origin-left
- Bottom gradient fade: h-40, background-color to transparent
- Badge: Sparkles icon + "New AI Automation Ally", border-white/20, backdrop-blur-sm
- SplitText animation: word-by-word, 0.08s stagger, y:40->0, opacity:0->1
- CTA: white pill with ArrowRight + semi-transparent bg-white/20 secondary
- z-index: video z-0, gradient z-10, content z-20

### Pattern 15: Web3 Landing (Gradient Text)
**Vibe:** Pure black, gradient-fading headline text, minimal
**Fonts:** General Sans from Fontshare
**Key specs:**
- Video: covered by bg-black/50 overlay
- Navbar: 120px h-padding, logo + 4 links with chevron-down icons, "Join Waitlist" pill
- Waitlist button: layered construction - 0.6px white outer border, black inner pill, white glow streak at top
- Headline: 56px, gradient at ~144.5deg from white to transparent black, bg-clip-text
- Badge pill: 4px white dot + text at 60% opacity + bold date
- CTA: Same layered button but white bg, black text

### Pattern 16: AI Testing Platform (Synapse)
**Vibe:** Black, gradient buttons, glass badges, HLS video
**Fonts:** Custom sans-serif (medium, tight tracking)
**Key specs:**
- Fixed navbar with blurred glass effect, "Features" link has gradient border active state
- CTA: white/gray gradient button
- 3 glass-effect badges in a row: "Integrated with" + icon
- Headline: ~80px, tight tracking, fade-in animation
- Video: HLS via hls.js, 80vh height, positioned absolute bottom-[35vh]
- Logo marquee: grayscale, 40% opacity placeholder SVGs

### Pattern 17: Purple/Pink Gradient SaaS
**Vibe:** Dark #010101, purple-pink gradient accents, mix-blend-screen video
**Fonts:** Modern sans-serif
**Key specs:**
- Primary gradient: from-[#FA93FA] via-[#C967E8] to-[#983AD6]
- Headline: gradient fill white to purple/pink, 48-80px responsive
- Video: mix-blend-screen (black blends into page), -mt-[150px] overlap, no object-contain
- CTA: white pill with gradient arrow circle
- Announcement pill: bg-[rgba(28,27,36,0.15)], Zap icon with gradient glow
- InfiniteSlider component for logo cloud

### Pattern 18: ClearInvoice SaaS (Orange Gradient CTA)
**Vibe:** Dark, orange gradient CTA, HLS video, social proof
**Fonts:** Switzer medium (headings), Geist (body)
**Key specs:**
- Top bar: 5px gradient from-[#ccf] via-[#e7d04c] to-[#31fb78]
- Video: HLS, z:-10, 100% opacity
- Primary CTA: gradient from-[#FF3300] to-[#EE7926], glow div behind (blur-lg), 1.5px inner border-white/20
- Hover: scale 1.05, glow increases, ArrowRight slides in
- Secondary: bg-white/90 backdrop-blur, 1.5px border-black/5
- Social proof: 3 overlapping avatar circles + "210k+ stores"

### Pattern 19: Project Estimation Calculator
**Vibe:** Dark, interactive pricing, red accent #FF5656
**Fonts:** Standard sans-serif
**Key specs:**
- 2-column grid: left = calculator form (bg #0D0D0D), right = cost comparison
- Custom radio/checkbox styling with #FF5656 accent
- 4 form sections separated by divide-y divide-[#1E1E1E]
- Right column: 3 stacked price cards (agency, freelancer, "your price")
- "Your price" card: bg-gradient-to-r from-pink-500 to-orange-500
- Dynamic pricing logic with service type, pages slider, add-ons, timeline

### Pattern 20: Bold Uppercase (NEW ERA)
**Vibe:** Video background, industrial uppercase, custom SVG button
**Fonts:** Rubik bold uppercase
**Key specs:**
- Video: 100% opacity, no overlay, object-cover
- Headline: 3 lines uppercase, 100px desktop, line-height 0.98, tracking -2 to -4px
- CTA button: 184x65px fixed size, custom SVG path background filled white
- Text: Rubik bold uppercase 20px, dark #161a20
- Hover: scale-105, active: scale-95
- Content aligned to top (pt-32 mobile, pt-48 desktop), NOT centered

---

## Workflow

When the user asks you to build a premium hero or landing page:

1. **Clarify the vibe** - Ask which Pattern (1-20) is closest, or describe the feel
2. **Pick typography pairing** - Select from the table above
3. **Set up the design system** - CSS variables, liquid glass classes, font imports
4. **Build the hero first** - Video background, overlays, content, animations
5. **Add sections** - Follow the Landing Page Section Blueprint
6. **Refine copy** - Apply Apple-style copywriting principles
7. **Polish** - Entrance animations, hover effects, responsive breakpoints

## Asset Generation Pipeline

Creating a premium hero requires custom video backgrounds - not stock footage. This is the full pipeline from inspiration to hosted video URL.

### Step 1: Find Inspiration (Manual)

Browse **Pinterest** for visual direction. Search terms that work well:
- "hero section" / "landing page" / "dark website design"
- "cosmos website" / "3D" / "futuristic webdesign"
- Look for backgrounds with depth, atmosphere, and subtle motion potential (nature scenes, abstract textures, cosmic imagery, architectural shots)

**What to look for:** Backgrounds that would look cinematic with slow, subtle motion. Avoid busy/cluttered images. The best backgrounds have depth layers (foreground/midground/background) that create parallax potential.

When you find one you like, screenshot just the background area (crop out any UI/text).

### Step 2: Upscale the Background Image

Take your screenshot to an AI image generator to recreate it in high quality without text/UI.

**Tool:** Higgsfield AI / Nano Banana (higgsfield.ai/image/nano_banana_flash)
- Free tier available, credits-based

**Prompt template:**
```
Give me the background of this exact image - no text, no buttons, no logos, no UI elements.
Same color grading and atmosphere as the original but in higher quality.
Clean background only.
```

Upload your screenshot with this prompt. Pick the best result from the generated options.

**Alternative tools:**
- Midjourney (use --sref with your screenshot URL for style reference)
- DALL-E 3 (describe the background you want)
- Stable Diffusion (img2img with the screenshot)

### Step 3: Generate Video from Image

Take your upscaled image and turn it into a seamless looping video.

**Tool:** Kling 3.0 (klingai.com)
- Best quality for cinematic motion, 10-second clips at 1080p
- Credits-based ($0.35-$0.70 per generation)

**Prompt template (THE key prompt):**
```
Fixed camera, locked lens, no camera movement.
Ultra slow cinematic motion. A very gentle breeze moves through the scene.
Foreground flowers/elements sway very slightly and naturally, minimal movement.
The motion should be extremely slow, smooth, and elegant. No fast movements.
Calm, peaceful, aesthetic atmosphere. Natural physics, soft wind effect.
```

**Settings:**
- Model: Kling 3.0 (not 2.0)
- Duration: 10 seconds
- Resolution: 1080p
- Motion mode: Standard (not high motion)

**Alternative video generators:**
- Runway Gen-3 Alpha (runway.ml) - good but more expensive
- Pika (pika.art) - cheaper, slightly lower quality
- Luma Dream Machine (lumalabs.ai) - free tier available
- Higgsfield Video (same platform as image upscaling)

**Tips for best results:**
- "Fixed camera, locked lens" is critical - you don't want camera movement, just subtle element motion
- "Ultra slow" prevents the AI from adding dramatic motion
- Mention specific elements that should move ("leaves sway", "water ripples", "particles drift")
- Generate 2-3 variations and pick the smoothest one

### Step 4: Host the Video

Your video needs a publicly accessible URL. Options:

**Mux (recommended for HLS streaming):**
- Upload at mux.com, get an HLS URL like `https://stream.mux.com/PLAYBACK_ID.m3u8`
- Best for: long videos, adaptive bitrate, professional delivery
- Requires hls.js in your code (see HLS implementation in Design System section)
- Free tier: 10GB storage, 100GB bandwidth/month

**CloudFront/S3 (recommended for direct MP4):**
- Upload MP4 to S3, serve via CloudFront CDN
- URL format: `https://your-distribution.cloudfront.net/video.mp4`
- Best for: short loops (under 30s), simple `<video>` tags
- Cost: ~$0.085/GB transfer

**Other hosts:**
- Cloudflare Stream (good free tier, HLS)
- Vercel Blob (if already on Vercel)
- Any CDN that serves MP4 files

### Step 5: Use in Your Hero

Reference the hosted URL in your component:

```tsx
// Direct MP4 (CloudFront, S3, etc.)
<video autoPlay loop muted playsInline
  className="absolute inset-0 w-full h-full object-cover z-0"
  src="https://your-cdn.com/hero-bg.mp4"
/>

// HLS stream (Mux)
// See HLS implementation in Design System section above
```

---

### Pre-Made Video Sources (Skip Steps 1-3)

If you want to skip the generation pipeline:

- **DesignRocket** (designrocket.io/video-backgrounds) - curated looping motion backgrounds, "Copy URL" button, membership required
- **MotionSites** - free hero section templates with embedded videos, copy the video source URL from the HTML
- **Pexels/Pixabay** - free stock video, lower quality but fast
- **Coverr.co** - free stock video optimized for backgrounds

---

### Automation Potential

**What CAN be automated (with API access):**

| Step | Tool | API Available? | How |
|---|---|---|---|
| Image generation | Midjourney | Via Discord bot API | Send prompt, poll for result |
| Image generation | DALL-E 3 | Yes (OpenAI API) | `client.images.generate()` |
| Image generation | Stable Diffusion | Yes (Stability AI API, or local) | img2img endpoint |
| Video generation | Runway Gen-3 | Yes (API waitlist) | Upload image + prompt |
| Video generation | Luma | Yes (API) | `POST /generations` |
| Video hosting | Mux | Yes (full API) | Upload asset, get playback ID |
| Video hosting | Cloudflare Stream | Yes (full API) | Upload via API, get HLS URL |
| Video hosting | S3/CloudFront | Yes (AWS SDK) | `s3.putObject()` + CloudFront distribution |

**What CANNOT be automated easily:**
- Pinterest browsing (creative decision, needs human eye)
- Kling 3.0 (no public API as of March 2026 - web UI only)
- Higgsfield/Nano Banana (no public API - web UI only)
- Quality selection (picking the best result from multiple generations)

**Realistic automation flow (with Playwright):**
```
1. User provides: inspiration image or description
2. Script generates background via DALL-E 3 API (automated)
3. Script generates video via Luma API (automated)
4. Script uploads to Mux via API (automated)
5. Script returns HLS URL ready for the hero component
```

This could be built as a companion MCP server or CLI script. The main bottleneck is video generation quality - Kling 3.0 produces the best results but has no API, while Luma/Runway have APIs but slightly different aesthetics.

**Playwright automation for Kling (possible but fragile):**
You could automate Kling's web UI with Playwright (upload image, paste prompt, click generate, wait, download), but web UIs change frequently and this approach is brittle. Better to use API-first tools (Luma, Runway) for automation and reserve Kling for manual, high-stakes hero sections.

## Key Dependencies

| Package | Purpose |
|---|---|
| `motion` (framer-motion) | Entrance animations, parallax, transitions |
| `hls.js` | HLS video streaming (Mux URLs) |
| `lucide-react` | Icons |
| `tailwindcss` | Styling |
| `shadcn/ui` | Component primitives |

## Cinematic Theme Transitions (Superwhisper Technique)

Inspired by superwhisper.com's day/dusk/night switcher. Instead of toggling a CSS class and instantly swapping colors, stack multiple gradient layers and crossfade between them with a slow opacity transition. The result is a gorgeous, cinematic color shift.

### How It Works

**Architecture:** 3+ absolute-positioned gradient layers stacked on top of each other. Only the active theme's layer has `opacity: 1`. All others are `opacity: 0`. A 1.2s ease-in-out transition creates the crossfade.

```tsx
// ThemeProvider state manages the active theme
const [theme, setTheme] = useState<"day" | "dusk" | "night">("day");
```

### CSS: Define Gradient Layers

```css
/* Container holds all gradient layers */
.theme-gradient-container {
  position: relative;
  overflow: hidden;
}

/* Each gradient layer is fullscreen, stacked, and crossfades */
.gradient-layer {
  position: absolute;
  inset: 0;
  width: 100%;
  height: 100%;
  opacity: 0;
  transition: opacity 1.2s ease-in-out;
  z-index: 0;
}

/* Active layer becomes visible */
.theme-day .gradient-layer.day,
.theme-dusk .gradient-layer.dusk,
.theme-night .gradient-layer.night {
  opacity: 1;
}
```

### CSS: The Three Gradient Palettes

```css
/* Day - warm sky blue, golden undertones */
.gradient-layer.day {
  background:
    linear-gradient(90deg, rgba(25, 74, 232, 0.2) 2.75%, rgba(255, 190, 10, 0.2) 99.26%),
    radial-gradient(170% 104% at 50% 0%, rgba(38, 84, 144, 0.5) 17%, rgba(255, 255, 255, 0.5) 100%),
    radial-gradient(570% 155% at 50% -38%, rgba(0,0,0,0.5) 0%, rgba(2, 32, 68, 0.5) 21%,
      rgba(31, 93, 135, 0.5) 46%, rgba(93, 109, 142, 0.5) 62%, rgba(159, 138, 145, 0.5) 74%,
      rgba(205, 155, 142, 0.5) 80%, rgba(255, 226, 97, 0.5) 88%, rgba(255, 126, 30, 0.5) 100%),
    rgb(115, 175, 235);
}

/* Dusk - purple/pink twilight */
.gradient-layer.dusk {
  background:
    linear-gradient(90deg, rgba(25, 153, 232, 0.15) 2.75%, rgba(164, 91, 242, 0.15) 99.26%),
    linear-gradient(rgba(0,0,0,0.5) 0.85%, rgba(0, 5, 46, 0.5) 26%, rgba(41, 40, 94, 0.5) 58%,
      rgba(84, 60, 123, 0.5) 80%, rgba(133, 90, 146, 0.5) 96%, rgba(195, 134, 171, 0.5) 107%),
    linear-gradient(rgb(0,0,0) 0.85%, rgb(17, 45, 114) 33%, rgb(75, 82, 170) 50%,
      rgb(168, 135, 220) 71%, rgb(230, 196, 231) 96%, rgb(252, 219, 239) 107%),
    rgb(0, 0, 0);
}

/* Night - deep dark blue, subtle warm edge */
.gradient-layer.night {
  background:
    linear-gradient(90deg, rgba(25, 153, 232, 0.1) 2.75%, rgba(164, 91, 242, 0.1) 99.26%),
    radial-gradient(83% 104% at 50% 0%, rgba(38, 84, 144, 0) 72%, rgba(255, 117, 117, 0) 100%),
    radial-gradient(610% 214% at 50% -38%, rgba(0,0,0,0.5) 0%, rgba(2, 32, 68, 0.5) 21%,
      rgba(31, 93, 135, 0.5) 46%, rgba(93, 109, 142, 0.5) 62%, rgba(159, 138, 145, 0.5) 74%,
      rgba(205, 155, 142, 0.5) 80%, rgba(255, 162, 97, 0.5) 88%, rgba(255, 126, 30, 0.5) 100%),
    rgb(0, 0, 0);
}
```

### React Implementation

```tsx
"use client";
import { useState } from "react";
import { Sun, Sunset, Moon } from "lucide-react";

const themes = [
  { id: "day", icon: Sun, label: "Day" },
  { id: "dusk", icon: Sunset, label: "Dusk" },
  { id: "night", icon: Moon, label: "Night" },
] as const;

type Theme = typeof themes[number]["id"];

export function ThemeHero() {
  const [theme, setTheme] = useState<Theme>("day");

  return (
    <section className={`theme-gradient-container relative min-h-screen theme-${theme}`}>
      {/* Stacked gradient layers - all render, only active one is visible */}
      <div className="gradient-layer day" />
      <div className="gradient-layer dusk" />
      <div className="gradient-layer night" />

      {/* Theme toggle - small pill in top-right */}
      <div className="absolute top-4 right-4 z-20 flex gap-1 rounded-full bg-black/20 p-1 backdrop-blur-sm">
        {themes.map(({ id, icon: Icon, label }) => (
          <button
            key={id}
            onClick={() => setTheme(id)}
            className={`rounded-full p-2 transition-colors ${
              theme === id ? "bg-white/20 text-white" : "text-white/50 hover:text-white/80"
            }`}
            aria-label={label}
          >
            <Icon className="size-4" />
          </button>
        ))}
      </div>

      {/* Content sits above gradients */}
      <div className="relative z-10">
        {/* Your hero content here */}
      </div>
    </section>
  );
}
```

### Extending the Technique

**Images that swap per theme:** Stack multiple versions of the same image and crossfade:
```tsx
<div className="relative">
  <img src="/hero-day.jpg" className={`absolute inset-0 transition-opacity duration-[1200ms] ${theme === "day" ? "opacity-100" : "opacity-0"}`} />
  <img src="/hero-dusk.jpg" className={`absolute inset-0 transition-opacity duration-[1200ms] ${theme === "dusk" ? "opacity-100" : "opacity-0"}`} />
  <img src="/hero-night.jpg" className={`absolute inset-0 transition-opacity duration-[1200ms] ${theme === "night" ? "opacity-100" : "opacity-0"}`} />
</div>
```

**Text color that shifts:** Use CSS variables that transition:
```css
.theme-day { --text-hero: rgba(0, 0, 0, 0.9); --text-muted: rgba(0, 0, 0, 0.6); }
.theme-dusk { --text-hero: rgba(255, 255, 255, 0.95); --text-muted: rgba(255, 255, 255, 0.7); }
.theme-night { --text-hero: rgba(255, 255, 255, 1); --text-muted: rgba(255, 255, 255, 0.8); }
```

**Key details:**
- Transition duration: **1.2s ease-in-out** (slower = more cinematic)
- All layers are always in the DOM (no mount/unmount)
- The parent container's class drives which layer is visible via CSS
- Works with gradients, images, videos, and even text colors
- Zero JavaScript animation - pure CSS transitions

---

## Anti-Patterns to Avoid

- **Generic AI look:** Never use default gradients, centered-everything layouts, or standard shadcn cards without customization
- **Video overlays too dark:** 100% opacity video with no overlay > video buried under bg-black/80
- **Missing liquid glass:** If you have dark bg + cards/badges, they NEED the liquid glass effect
- **Single font:** Always pair a serif display font with a sans-serif body font
- **No entrance animations:** Staggered fade-rise on ALL hero content (heading, subtitle, buttons)
- **Centered hero when left-aligned is better:** Not everything needs to be centered. Left-aligned heroes with right-side video/image feel more editorial
