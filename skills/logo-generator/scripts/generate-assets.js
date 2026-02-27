#!/usr/bin/env node

/**
 * Logo Generator — Asset Export Script
 *
 * Converts SVG logos into a full brand asset kit:
 * - Favicons (16-512 PNG + multi-size ICO)
 * - Apple touch icon (180x180)
 * - Social images (OG 1200x630, Twitter 1200x600)
 * - PWA webmanifest
 * - Visual preview HTML
 *
 * Usage:
 *   node generate-assets.js \
 *     --svg logo.svg \
 *     --svg-dark logo-dark.svg \
 *     --svg-mono logo-mono.svg \
 *     --output ./public \
 *     --brand-name "MyApp" \
 *     --primary-color "#1a365d" \
 *     --bg-color "#ffffff" \
 *     [--preview-only]
 */

const fs = require("fs");
const path = require("path");
const { execSync } = require("child_process");

// ── Config ──────────────────────────────────────────────────────────────────

const FAVICON_SIZES = [16, 32, 48, 64, 180, 192, 512];
const ICO_SIZES = [16, 32, 48];

// ── Arg Parsing ─────────────────────────────────────────────────────────────

const VALID_STAGES = ["all", "svgs", "favicons", "social", "meta", "preview"];

function parseArgs() {
  const args = process.argv.slice(2);
  const parsed = {
    svg: null,
    svgDark: null,
    svgMono: null,
    output: "./public",
    brandName: "Brand",
    primaryColor: "#1a365d",
    bgColor: "#ffffff",
    previewOnly: false,
    stage: "all",
  };

  for (let i = 0; i < args.length; i++) {
    switch (args[i]) {
      case "--svg":
        parsed.svg = args[++i];
        break;
      case "--svg-dark":
        parsed.svgDark = args[++i];
        break;
      case "--svg-mono":
        parsed.svgMono = args[++i];
        break;
      case "--output":
        parsed.output = args[++i];
        break;
      case "--brand-name":
        parsed.brandName = args[++i];
        break;
      case "--primary-color":
        parsed.primaryColor = args[++i];
        break;
      case "--bg-color":
        parsed.bgColor = args[++i];
        break;
      case "--preview-only":
        parsed.previewOnly = true;
        break;
      case "--stage":
        parsed.stage = args[++i];
        break;
    }
  }

  if (!parsed.svg) {
    console.error("Error: --svg is required");
    process.exit(1);
  }

  if (!VALID_STAGES.includes(parsed.stage)) {
    console.error(`Error: --stage must be one of: ${VALID_STAGES.join(", ")}`);
    process.exit(1);
  }

  return parsed;
}

// ── Converter Abstraction ───────────────────────────────────────────────────

async function getConverter() {
  // Try sharp first
  try {
    const sharp = require("sharp");
    return {
      name: "sharp",

      async svgToPng(svgPath, outputPath, size) {
        const svgBuffer = fs.readFileSync(svgPath);
        await sharp(svgBuffer, { density: 300 })
          .resize(size, size, { fit: "contain", background: { r: 0, g: 0, b: 0, alpha: 0 } })
          .png()
          .toFile(outputPath);
      },

      async createSocialImage(svgPath, outputPath, width, height, bgColor) {
        const svgBuffer = fs.readFileSync(svgPath);
        const logoSize = Math.min(width, height) * 0.4;
        const logoPng = await sharp(svgBuffer, { density: 300 })
          .resize(Math.round(logoSize), Math.round(logoSize), {
            fit: "contain",
            background: { r: 0, g: 0, b: 0, alpha: 0 },
          })
          .png()
          .toBuffer();

        const bg = parseHexColor(bgColor);
        await sharp({
          create: {
            width,
            height,
            channels: 4,
            background: { r: bg.r, g: bg.g, b: bg.b, alpha: 1 },
          },
        })
          .composite([{ input: logoPng, gravity: "centre" }])
          .png()
          .toFile(outputPath);
      },
    };
  } catch {
    // Fallback: macOS qlmanage + sips
    console.log("⚠ sharp not found, using macOS qlmanage+sips fallback");
    console.log("  For best quality: cd ~/.claude/skills/logo-generator/scripts && npm install\n");

    return {
      name: "qlmanage",

      async svgToPng(svgPath, outputPath, size) {
        const tmpDir = fs.mkdtempSync("/tmp/logo-gen-ql-");
        const absPath = path.resolve(svgPath);
        // qlmanage renders SVG to PNG at specified size
        execSync(
          `qlmanage -t -s ${Math.max(size, 512)} -o "${tmpDir}" "${absPath}" 2>/dev/null`
        );
        // qlmanage outputs as filename.svg.png
        const qlOut = path.join(tmpDir, path.basename(absPath) + ".png");
        if (!fs.existsSync(qlOut)) {
          throw new Error(`qlmanage failed to render ${absPath}`);
        }
        // Resize with sips
        execSync(
          `sips -z ${size} ${size} "${qlOut}" --out "${path.resolve(outputPath)}" 2>/dev/null`
        );
        // Cleanup
        fs.rmSync(tmpDir, { recursive: true });
      },

      async createSocialImage(svgPath, outputPath, width, height, bgColor) {
        // For fallback, just create the logo PNG centered — limited compositing
        const tmpDir = fs.mkdtempSync("/tmp/logo-gen-social-");
        const logoPath = path.join(tmpDir, "logo.png");
        const logoSize = Math.min(width, height) * 0.4;
        await this.svgToPng(svgPath, logoPath, Math.round(logoSize));

        // Create background with sips padding
        const absOut = path.resolve(outputPath);
        execSync(`sips -s format png -z ${height} ${width} "${logoPath}" --out "${absOut}" 2>/dev/null || cp "${logoPath}" "${absOut}"`);
        fs.rmSync(tmpDir, { recursive: true });
      },
    };
  }
}

// ── ICO Generator ───────────────────────────────────────────────────────────

function generateIco(outputDir, sizes = ICO_SIZES) {
  const pngBuffers = sizes.map((size) => {
    const pngPath = path.join(outputDir, `favicon-${size}x${size}.png`);
    return { size, data: fs.readFileSync(pngPath) };
  });

  const headerSize = 6;
  const dirEntrySize = 16;
  const headerAndDir = headerSize + dirEntrySize * pngBuffers.length;

  // Header
  const header = Buffer.alloc(headerSize);
  header.writeUInt16LE(0, 0); // Reserved
  header.writeUInt16LE(1, 2); // Type: ICO
  header.writeUInt16LE(pngBuffers.length, 4); // Image count

  // Directory entries + image data
  const dirEntries = [];
  let dataOffset = headerAndDir;

  for (const { size, data } of pngBuffers) {
    const entry = Buffer.alloc(dirEntrySize);
    entry.writeUInt8(size >= 256 ? 0 : size, 0); // Width (0 = 256)
    entry.writeUInt8(size >= 256 ? 0 : size, 1); // Height
    entry.writeUInt8(0, 2); // Color count
    entry.writeUInt8(0, 3); // Reserved
    entry.writeUInt16LE(1, 4); // Color planes
    entry.writeUInt16LE(32, 6); // Bits per pixel
    entry.writeUInt32LE(data.length, 8); // Data size
    entry.writeUInt32LE(dataOffset, 12); // Data offset
    dirEntries.push(entry);
    dataOffset += data.length;
  }

  const ico = Buffer.concat([
    header,
    ...dirEntries,
    ...pngBuffers.map((p) => p.data),
  ]);

  fs.writeFileSync(path.join(outputDir, "favicon.ico"), ico);
}

// ── Webmanifest ─────────────────────────────────────────────────────────────

function generateManifest(outputDir, brandName, primaryColor) {
  const manifest = {
    name: brandName,
    short_name: brandName,
    icons: [
      { src: "/favicon-192x192.png", sizes: "192x192", type: "image/png" },
      {
        src: "/favicon-512x512.png",
        sizes: "512x512",
        type: "image/png",
        purpose: "any maskable",
      },
    ],
    theme_color: primaryColor,
    background_color: "#ffffff",
    display: "standalone",
  };
  fs.writeFileSync(
    path.join(outputDir, "site.webmanifest"),
    JSON.stringify(manifest, null, 2)
  );
}

// ── Preview HTML ────────────────────────────────────────────────────────────

function generatePreview(outputDir, brandName, primaryColor, bgColor, hasDark, hasMono) {
  const faviconSizes = FAVICON_SIZES;

  const faviconCards = faviconSizes
    .map(
      (s) => `
      <div class="card">
        <img src="favicon-${s}x${s}.png" width="${Math.min(s, 128)}" height="${Math.min(s, 128)}" alt="${s}x${s}">
        <span class="label">${s}x${s}</span>
      </div>`
    )
    .join("");

  const darkSection = hasDark
    ? `
    <section>
      <h2>Dark Variant</h2>
      <div class="preview-row dark-bg">
        <img src="logo-dark.svg" class="logo-display" alt="Dark variant">
      </div>
    </section>`
    : "";

  const monoSection = hasMono
    ? `
    <section>
      <h2>Monochrome Variant</h2>
      <div class="preview-row" style="background: #f0f0f0">
        <img src="logo-mono.svg" class="logo-display" alt="Mono variant">
      </div>
    </section>`
    : "";

  const socialSection = `
    <section>
      <h2>Social Images</h2>
      <div class="social-grid">
        <div class="card social-card">
          <img src="og-image.png" alt="OG Image">
          <span class="label">OG Image (1200x630)</span>
        </div>
        <div class="card social-card">
          <img src="twitter-card.png" alt="Twitter Card">
          <span class="label">Twitter Card (1200x600)</span>
        </div>
      </div>
    </section>`;

  const metaTags = `<link rel="icon" type="image/png" sizes="32x32" href="/favicon-32x32.png">
<link rel="icon" type="image/png" sizes="16x16" href="/favicon-16x16.png">
<link rel="apple-touch-icon" sizes="180x180" href="/apple-touch-icon.png">
<link rel="manifest" href="/site.webmanifest">
<meta property="og:image" content="/og-image.png">
<meta name="twitter:image" content="/twitter-card.png">
<meta name="theme-color" content="${primaryColor}">`;

  const html = `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>${brandName} — Logo Preview</title>
  <style>
    * { margin: 0; padding: 0; box-sizing: border-box; }
    body {
      font-family: -apple-system, BlinkMacSystemFont, "SF Pro Display", "Segoe UI", sans-serif;
      background: #0a0a0a; color: #e0e0e0;
      padding: 48px 32px; max-width: 1100px; margin: 0 auto;
      line-height: 1.6;
    }
    h1 { font-size: 28px; font-weight: 600; margin-bottom: 8px; color: #fff; }
    h1 span { color: ${primaryColor}; }
    .subtitle { color: #666; font-size: 14px; margin-bottom: 48px; }
    h2 { font-size: 18px; font-weight: 500; margin: 40px 0 16px; color: #aaa; text-transform: uppercase; letter-spacing: 1px; font-size: 12px; }
    section { margin-bottom: 48px; }

    .preview-row {
      background: ${bgColor}; border-radius: 16px; padding: 48px;
      display: flex; align-items: center; justify-content: center;
      border: 1px solid #1a1a1a;
    }
    .dark-bg { background: #0f0f0f; border: 1px solid #222; }
    .logo-display { max-width: 256px; max-height: 256px; }

    .favicon-grid { display: flex; flex-wrap: wrap; gap: 16px; }
    .card {
      background: #141414; border: 1px solid #222; border-radius: 12px;
      padding: 20px; display: flex; flex-direction: column;
      align-items: center; gap: 12px; transition: border-color 0.2s;
    }
    .card:hover { border-color: ${primaryColor}44; }
    .card img { image-rendering: pixelated; }
    .label { font-size: 11px; color: #666; font-family: "SF Mono", monospace; }

    .social-grid { display: grid; grid-template-columns: 1fr; gap: 16px; }
    .social-card { padding: 16px; }
    .social-card img { width: 100%; border-radius: 8px; }

    .code-block {
      background: #141414; border: 1px solid #222; border-radius: 12px;
      padding: 24px; overflow-x: auto; position: relative;
    }
    .code-block pre {
      font-family: "SF Mono", "Fira Code", monospace; font-size: 13px;
      color: #b0b0b0; line-height: 1.8;
    }
    .code-block .tag { color: #ff6b6b; }
    .code-block .attr { color: #ffd43b; }
    .code-block .val { color: #69db7c; }

    .copy-btn {
      position: absolute; top: 12px; right: 12px;
      background: #222; border: 1px solid #333; color: #888;
      padding: 6px 12px; border-radius: 6px; cursor: pointer;
      font-size: 11px; font-family: inherit; transition: all 0.2s;
    }
    .copy-btn:hover { background: #333; color: #fff; }

    .file-list { list-style: none; }
    .file-list li {
      padding: 8px 16px; border-bottom: 1px solid #1a1a1a;
      font-family: "SF Mono", monospace; font-size: 13px; color: #888;
      display: flex; justify-content: space-between;
    }
    .file-list li:last-child { border-bottom: none; }
    .file-list .size { color: #555; }
  </style>
</head>
<body>
  <h1><span>${brandName}</span> Brand Kit</h1>
  <p class="subtitle">Generated by logo-generator skill</p>

  <section>
    <h2>Primary Logo</h2>
    <div class="preview-row">
      <img src="logo.svg" class="logo-display" alt="Primary logo">
    </div>
  </section>

  ${darkSection}
  ${monoSection}

  <section>
    <h2>Favicons</h2>
    <div class="favicon-grid">
      ${faviconCards}
    </div>
  </section>

  ${socialSection}

  <section>
    <h2>HTML Meta Tags</h2>
    <div class="code-block">
      <button class="copy-btn" onclick="navigator.clipboard.writeText(document.getElementById('meta-code').textContent).then(()=>this.textContent='Copied!')">Copy</button>
      <pre id="meta-code">${metaTags.replace(/</g, "&lt;").replace(/>/g, "&gt;")}</pre>
    </div>
  </section>
</body>
</html>`;

  fs.writeFileSync(path.join(outputDir, "logo-preview.html"), html);
}

// ── Helpers ─────────────────────────────────────────────────────────────────

function parseHexColor(hex) {
  hex = hex.replace("#", "");
  return {
    r: parseInt(hex.substring(0, 2), 16),
    g: parseInt(hex.substring(2, 4), 16),
    b: parseInt(hex.substring(4, 6), 16),
  };
}

// ── Main ────────────────────────────────────────────────────────────────────

async function stageSvgs(args) {
  const svgFiles = [
    { src: args.svg, dest: "logo.svg" },
    { src: args.svgDark, dest: "logo-dark.svg" },
    { src: args.svgMono, dest: "logo-mono.svg" },
  ];

  for (const { src, dest } of svgFiles) {
    if (src && fs.existsSync(src)) {
      fs.copyFileSync(src, path.join(args.output, dest));
      console.log(`  ✓ ${dest}`);
    }
  }
}

async function stageFavicons(args, converter) {
  for (const size of FAVICON_SIZES) {
    const outPath = path.join(args.output, `favicon-${size}x${size}.png`);
    await converter.svgToPng(args.svg, outPath, size);
    console.log(`  ✓ favicon-${size}x${size}.png`);
  }

  fs.copyFileSync(
    path.join(args.output, "favicon-180x180.png"),
    path.join(args.output, "apple-touch-icon.png")
  );
  console.log("  ✓ apple-touch-icon.png");

  generateIco(args.output);
  console.log("  ✓ favicon.ico");
}

async function stageSocial(args, converter) {
  await converter.createSocialImage(
    args.svg,
    path.join(args.output, "og-image.png"),
    1200,
    630,
    args.bgColor
  );
  console.log("  ✓ og-image.png (1200x630)");

  await converter.createSocialImage(
    args.svg,
    path.join(args.output, "twitter-card.png"),
    1200,
    600,
    args.bgColor
  );
  console.log("  ✓ twitter-card.png (1200x600)");
}

async function stageMeta(args) {
  generateManifest(args.output, args.brandName, args.primaryColor);
  console.log("  ✓ site.webmanifest");
}

async function stagePreview(args) {
  const hasDark = args.svgDark && fs.existsSync(path.join(args.output, "logo-dark.svg"));
  const hasMono = args.svgMono && fs.existsSync(path.join(args.output, "logo-mono.svg"));
  generatePreview(args.output, args.brandName, args.primaryColor, args.bgColor, hasDark, hasMono);
  console.log("  ✓ logo-preview.html");
}

async function main() {
  const args = parseArgs();
  const converter = await getConverter();
  const stage = args.stage;

  fs.mkdirSync(args.output, { recursive: true });

  console.log(`  Logo Generator — ${converter.name} backend`);

  if (stage === "all" || stage === "svgs") {
    await stageSvgs(args);
  }

  if (stage === "all" || stage === "favicons") {
    await stageFavicons(args, converter);
  }

  if ((stage === "all" || stage === "social") && !args.previewOnly) {
    await stageSocial(args, converter);
  }

  if (stage === "all" || stage === "meta") {
    await stageMeta(args);
  }

  if (stage === "all" || stage === "preview") {
    await stagePreview(args);
  }

  const fileCount = fs.readdirSync(args.output).length;
  console.log(`  Done — ${stage === "all" ? "all stages" : stage} (${fileCount} files in ${args.output}/)`);
}

main().catch((err) => {
  console.error("Error:", err.message);
  process.exit(1);
});
