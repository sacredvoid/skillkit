# Leisure Lab Sketch Catalog

Complete catalog of 43 creative coding sketches from [lab.xubh.top](https://lab.xubh.top/) by KainXu. Use as inspiration and technique reference.

## Sketches by Category

### Particle Systems
| # | Name | Technique | Interaction |
|---|------|-----------|-------------|
| 002 | Flux | Perlin noise flow field, Canvas2D | Mouse influences flow |
| 034 | InteractiveParticle | SVG-to-particle decomposition, physics | Mouse scatters particles |
| 042 | Purrka Dots | Pixel sampling to animated circles | Image upload |

### 3D Scenes (Three.js)
| # | Name | Technique | Interaction |
|---|------|-----------|-------------|
| 001 | Roll Dice | Three.js physics, collision detection | Click to roll, cheat mode |
| 011 | DOF | Depth of field postprocessing shader | Camera focus control |
| 014 | Models | 3D model showcase | Orbit controls |
| 015 | Spline | Spline curves in 3D | - |
| 039 | Mac | GLTF MacBook model + GSAP animation | Click screen to open, drag to rotate |

### Mathematical / Generative Geometry
| # | Name | Technique | Interaction |
|---|------|-----------|-------------|
| 009 | Hilbertcurve | Space-filling Hilbert curve rendering | - |
| 010 | Entropy | "Order and chaos" - digital poetry in motion | - |
| 012 | Vortex | Polar coordinate parametric art | Click to change pattern, edit expressions, Space for resolution |
| 020 | SpiralAn | Spiral analysis / harmonograph | - |
| 037 | GenGeo | Mondrian-style algorithmic composition | Click to regenerate |

### Fluid / Shader Effects
| # | Name | Technique | Interaction |
|---|------|-----------|-------------|
| 004 | Vein | Organic vein/network generation | - |
| 006 | Glow | Light/glow simulation | - |
| 030 | GeometricBlur | Geometric shapes with blur effects | - |
| 031 | DistortionEffect | Visual distortion shader | - |
| 032 | FluidGradient | Fluid gradient animation | - |
| 033 | FluidSwirl | WebGL iterative sine + spiral distortion | Mouse controls swirl center |

### Nature / Biology Simulation
| # | Name | Technique | Interaction |
|---|------|-----------|-------------|
| 007 | Tree | Recursive fractal tree | - |
| 028 | Tree (2) | Advanced tree generation | - |
| 036 | Plant | L-System recursive branching | Growth animation |
| 040 | Cells | Cell division / biological simulation | - |

### Vector Fields / Automata
| # | Name | Technique | Interaction |
|---|------|-----------|-------------|
| 005 | Field | Vector field visualization | - |
| 035 | VectorField | Cellular automata, neighbor averaging, anchor points | Self-organizing waves |

### Text Effects
| # | Name | Technique | Interaction |
|---|------|-----------|-------------|
| 022 | Ghost404 | Creative 404 page with ghost character | Navigate links |
| 026 | FontEffects | 7 text effects: particle text, neon RGB, vaporize (WebGL), bend, layered, glitch, blur animation | Mouse drives particles |

### Image Processing
| # | Name | Technique | Interaction |
|---|------|-----------|-------------|
| 027 | Artify | Algorithmic brush stroke painting | Upload image or use camera |

### Interactive Backgrounds / UI
| # | Name | Technique | Interaction |
|---|------|-----------|-------------|
| 003 | Hex | Hexagonal grid/pattern | - |
| 016 | Lattice | Lattice/grid structure | - |
| 017 | WavesBG | Animated wave background (inspired by @wodniack) | - |
| 019 | Bubble | Bubble physics simulation | - |
| 021 | UI | UI component experiments | - |
| 023 | CatBG | Cat-themed background | - |

### Cultural / Themed
| # | Name | Technique | Interaction |
|---|------|-----------|-------------|
| 008 | China | National Day commemorative generative art | - |
| 013 | Neko | Cat-themed generative art | - |
| 024 | Castle | Castle scene generation | - |
| 025 | Newspaper | Newspaper-style layout generation | - |
| 029 | Brain | Neural/brain visualization | Click to regenerate |
| 038 | Zoo | Animal-themed generative art | - |
| 041 | Horse | Year of the Horse - "a thousand sparks, one galloping soul" | Particle animation |

## Tech Stack

The Leisure Lab is built with:
- **Framework**: Next.js (React, TypeScript)
- **Styling**: Tailwind CSS
- **3D**: Three.js, GLTF models
- **2D**: Canvas API, WebGL shaders
- **Animation**: GSAP, requestAnimationFrame
- **Creative coding**: P5.js concepts, custom implementations
- **Math**: Perlin noise, L-systems, polar coordinates, cellular automata

## Key Design Patterns

1. **Each sketch is self-contained** - independent route, own dependencies
2. **Progressive complexity** - early sketches simpler, later ones combine techniques
3. **Mouse interaction is standard** - most sketches respond to cursor
4. **Dark backgrounds dominate** - dark canvas with bright elements (trails, particles, glow)
5. **HSL color mapping** - map computed values to hue for rainbow effects
6. **Trail effects via alpha fade** - `rgba(0,0,0,0.02)` overlay instead of clear
7. **Info panels describe technique** - each sketch has a description overlay

## Notable Inspirations Cited

- **@antfu** and **@aemkei** (Vortex sketch)
- **@wodniack** (WavesBG sketch)
- **Adrian Barron's "Understanding Perlin Noise"** (Flux sketch)
- **Piet Mondrian** (GenGeo sketch)
