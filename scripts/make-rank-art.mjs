import { mkdirSync, writeFileSync } from "node:fs";
import path from "node:path";

const OUT = path.join(process.cwd(), "public", "images", "badges");
mkdirSync(OUT, { recursive: true });

const SECTIONS = {
  boy: { main: "#17683a", dark: "#0d4527", label: "Boy Scouts" },
  senior: { main: "#b21e2b", dark: "#7a121c", label: "Senior Scouts" },
  kid: { main: "#2b7bb9", dark: "#1b5480", label: "KID Scouts" },
};

const GOLD = "#fcd116";
const FLAG_BLUE = "#0038a8";
const FLAG_RED = "#ce1126";
const CREAM = "#fdf8ec";

const round = (n) => Number(n.toFixed(1));

function star(cx, cy, r, fill, extra = "") {
  const points = [];
  for (let i = 0; i < 10; i += 1) {
    const radius = i % 2 === 0 ? r : r * 0.42;
    const angle = ((-90 + i * 36) * Math.PI) / 180;
    points.push(`${round(cx + radius * Math.cos(angle))},${round(cy + radius * Math.sin(angle))}`);
  }
  return `<polygon points="${points.join(" ")}" fill="${fill}"${extra ? ` ${extra}` : ""}/>`;
}

/** The BSP emblem: a trefoil in the colours of the Philippine flag over a green neckerchief. */
function emblem(cx, cy, scale, colors, soft = false) {
  return `<g transform="translate(${cx} ${cy}) scale(${scale})">
    <path d="M0 13 L-16 33 H16 Z" fill="${soft ? "#3f8f5f" : "#1b6b3a"}"/>
    <ellipse cx="0" cy="-14" rx="12" ry="16.5" fill="#ffffff" stroke="${colors.dark}" stroke-width="2.6"/>
    <ellipse cx="-16" cy="0" rx="11.5" ry="15.5" fill="${FLAG_BLUE}" transform="rotate(-42 -16 0)"/>
    <ellipse cx="16" cy="0" rx="11.5" ry="15.5" fill="${FLAG_RED}" transform="rotate(42 16 0)"/>
    <circle cx="0" cy="3" r="4.6" fill="${GOLD}"/>
    <circle cx="-7" cy="-4" r="1.7" fill="${GOLD}"/>
    <circle cx="7" cy="-4" r="1.7" fill="${GOLD}"/>
  </g>`;
}

const DEVICES = {
  footprint: (ink) => `<g fill="${ink}">
    <ellipse cx="0" cy="7" rx="11" ry="13.5"/>
    <circle cx="-8" cy="-10" r="4"/>
    <circle cx="-0.5" cy="-14.5" r="4"/>
    <circle cx="7" cy="-12.5" r="4"/>
  </g>`,
  campfire: (ink, dark) => `<g>
    <path d="M0 -22c-7 9-11 15-11 21a11 11 0 0 0 22 0c0-6-4-12-11-21z" fill="${ink}"/>
    <path d="M0 -9c-3 4-5 7-5 10a5 5 0 0 0 10 0c0-3-2-6-5-10z" fill="${CREAM}"/>
    <rect x="-20" y="15" width="40" height="6" rx="3" fill="${dark}" transform="rotate(-10 0 18)"/>
    <rect x="-20" y="15" width="40" height="6" rx="3" fill="${dark}" transform="rotate(10 0 18)"/>
  </g>`,
  compass: (ink) => `<g>
    <circle cx="0" cy="0" r="21" fill="none" stroke="${ink}" stroke-width="3.5"/>
    <path d="M0 -19 L8 0 L0 19 L-8 0 Z" fill="${ink}"/>
    <circle cx="0" cy="0" r="3.4" fill="${CREAM}"/>
  </g>`,
  star: (ink) => `<g>
    <circle cx="0" cy="0" r="22" fill="none" stroke="${ink}" stroke-width="2.4" stroke-dasharray="4 4.5"/>
    ${star(0, 0, 17, ink)}
  </g>`,
  sun: (ink) => `<g>
    ${Array.from({ length: 8 }, (_, i) => `<rect x="-1.7" y="-21" width="3.4" height="9" rx="1.7" fill="${ink}" transform="rotate(${i * 45} 0 3)"/>`).join("")}
    <circle cx="0" cy="3" r="11" fill="${ink}"/>
    ${star(-15, -17, 4, GOLD)}
    ${star(0, -21, 4, GOLD)}
    ${star(15, -17, 4, GOLD)}
  </g>`,
  staves: (ink, dark) => `<g>
    <g stroke="${ink}" stroke-width="6" stroke-linecap="round">
      <line x1="-17" y1="-17" x2="17" y2="17"/>
      <line x1="17" y1="-17" x2="-17" y2="17"/>
    </g>
    <circle cx="0" cy="0" r="6.4" fill="${GOLD}" stroke="${dark}" stroke-width="2"/>
  </g>`,
  signpost: (ink, dark) => `<g>
    <rect x="-2.5" y="-8" width="5" height="29" rx="2.5" fill="${dark}"/>
    <path d="M-20 -7h26l9 8-9 8h-26z" fill="${ink}"/>
    <path d="M20 8h-24l-9 7 9 7h24z" fill="${ink}" opacity="0.72"/>
  </g>`,
  mountains: (ink) => `<g>
    <path d="M-22 18 L-2 -14 L18 18 Z" fill="${ink}"/>
    <path d="M2 18 L18 -6 L34 18 Z" fill="${ink}" opacity="0.72"/>
    <circle cx="21" cy="-15" r="6.5" fill="${GOLD}"/>
  </g>`,
  peak: (ink, dark) => `<g>
    <path d="M-24 20 L0 -12 L24 20 Z" fill="${ink}"/>
    <rect x="-1.6" y="-30" width="3.2" height="20" fill="${dark}"/>
    <path d="M1.6 -30 L19 -25 L1.6 -20 Z" fill="${dark}"/>
  </g>`,
  eagle: (ink) => `<g transform="scale(0.78)" fill="${ink}">
    <path d="M0 -7c-4.5 0-7.5 3-7.5 7.5 0 7 4.5 13 7.5 19.5 3-6.5 7.5-12.5 7.5-19.5C7.5 -4 4.5 -7 0 -7z"/>
    <path d="M-6.5 -1C-16 -9 -26 -11 -34 -8c7 7 15 11 24 13z"/>
    <path d="M6.5 -1C16 -9 26 -11 34 -8c-7 7-15 11-24 13z"/>
    <path d="M0 19 L-6 31 L0 26 L6 31 Z"/>
  </g>`,
  sprout: (ink) => `<g>
    <rect x="-2" y="-2" width="4" height="24" rx="2" fill="#1b6b3a"/>
    <path d="M0 6C-12 6 -20 -1 -21 -11 -9 -12 -1 -5 0 6Z" fill="${ink}"/>
    <path d="M0 13C12 13 20 6 21 -4 9 -5 1 2 0 13Z" fill="${ink}" opacity="0.78"/>
    <circle cx="0" cy="-17" r="7" fill="${GOLD}"/>
  </g>`,
};

const DEVICE_SCALE = {
  footprint: 1,
  campfire: 1,
  compass: 0.92,
  star: 0.92,
  sun: 0.9,
  staves: 1,
  signpost: 0.92,
  mountains: 0.82,
  peak: 0.9,
  eagle: 1,
  sprout: 0.95,
};

function pipRow(count) {
  const gap = 10;
  const start = -((count - 1) * gap) / 2;
  return `<g>${Array.from({ length: count }, (_, i) =>
    star(100 + start + i * gap, 152, 4.3, GOLD, 'stroke="#8a6d00" stroke-width="0.8"'),
  ).join("")}</g>`;
}

function patch({ title, section, device, pips = 0, emblemOnly = false }) {
  const colors = SECTIONS[section];
  const body = emblemOnly
    ? emblem(100, 100, 1.3, colors)
    : `${emblem(100, 60, 0.66, colors)}
  <g transform="translate(100 106) scale(${DEVICE_SCALE[device]})">${DEVICES[device](colors.dark, colors.dark)}</g>`;

  return `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 200 200" width="200" height="200" role="img" aria-label="${title} rank patch, ${colors.label}">
  <title>${title} — ${colors.label} rank patch</title>
  <circle cx="100" cy="105" r="94" fill="#0b2e1c" opacity="0.16"/>
  <circle cx="100" cy="100" r="94" fill="${colors.dark}"/>
  <circle cx="100" cy="100" r="86" fill="${colors.main}"/>
  <circle cx="100" cy="100" r="79" fill="none" stroke="#ffffff" stroke-width="2" stroke-dasharray="5 6" opacity="0.55"/>
  <circle cx="100" cy="100" r="62" fill="${CREAM}" stroke="${colors.dark}" stroke-width="2" stroke-opacity="0.3"/>
  ${body}
  <text x="100" y="142" text-anchor="middle" font-family="Georgia, 'Times New Roman', serif" font-size="11.5" font-weight="700" letter-spacing="0.6" fill="${colors.dark}" textLength="60" lengthAdjust="spacingAndGlyphs">${title}</text>
  ${pips ? pipRow(pips) : ""}
</svg>
`;
}

const FILES = [
  { file: "membership-badge.svg", title: "MEMBERSHIP", section: "boy", emblemOnly: true },
  { file: "tenderfoot-scout.svg", title: "TENDERFOOT", section: "boy", device: "footprint", pips: 1 },
  { file: "second-class-scout.svg", title: "SECOND CLASS", section: "boy", device: "campfire", pips: 2 },
  { file: "first-class-scout.svg", title: "FIRST CLASS", section: "boy", device: "compass", pips: 3 },
  { file: "scout-service.svg", title: "SERVICE", section: "boy", device: "star", pips: 4 },
  { file: "scout-citizen.svg", title: "CITIZEN", section: "boy", device: "sun", pips: 5 },
  { file: "senior-membership.svg", title: "MEMBERSHIP", section: "senior", emblemOnly: true },
  { file: "senior-scout.svg", title: "SENIOR SCOUT", section: "senior", device: "staves", pips: 1 },
  { file: "explorer-scout.svg", title: "EXPLORER", section: "senior", device: "compass", pips: 2 },
  { file: "pathfinder-scout.svg", title: "PATHFINDER", section: "senior", device: "signpost", pips: 3 },
  { file: "outdoor-scout.svg", title: "OUTDOOR", section: "senior", device: "mountains", pips: 4 },
  { file: "venturer-scout.svg", title: "VENTURER", section: "senior", device: "peak", pips: 5 },
  { file: "eagle-scout.svg", title: "EAGLE", section: "senior", device: "eagle", pips: 6 },
  { file: "kid-membership.svg", title: "MEMBERSHIP", section: "kid", emblemOnly: true },
  { file: "kid-scout.svg", title: "KID SCOUT", section: "kid", device: "sprout", pips: 1 },
];

for (const entry of FILES) {
  writeFileSync(path.join(OUT, entry.file), patch(entry), "utf8");
}
console.log(`wrote ${FILES.length} rank patches to public/images/badges`);

// Optional preview sheet — only if sharp happens to be available.
try {
  const { default: sharp } = await import("sharp");
  const CELL = 200;
  const COLS = 5;
  const ROWS = Math.ceil(FILES.length / COLS);
  const sheet = sharp({
    create: { width: COLS * CELL, height: ROWS * CELL, channels: 4, background: "#eef3ee" },
  });
  const composites = [];
  for (const [index, entry] of FILES.entries()) {
    const png = await sharp(path.join(OUT, entry.file)).resize(CELL, CELL).png().toBuffer();
    composites.push({ input: png, left: (index % COLS) * CELL, top: Math.floor(index / COLS) * CELL });
  }
  await sheet.composite(composites).png().toFile(path.join(OUT, "_rank-preview.png"));
  console.log("preview sheet: public/images/badges/_rank-preview.png");
} catch {
  console.log("(preview sheet skipped — sharp is not installed)");
}
