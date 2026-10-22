const path = require("node:path");
const fs = require("node:fs");
const sharp = require(path.join(process.cwd(), "node_modules", "sharp"));

const OUT = path.join(process.cwd(), "public", "images");

const NAVY = "#1B365F";
const BLUE = "#1E4488";
const SKY = "#0076AF";
const GOLD = "#FFCF00";
const RED = "#AC242A";
const GREEN = "#00694B";
const CREAM = "#F7F9FD";

function svg(w, h, inner) {
  return `<svg xmlns="http://www.w3.org/2000/svg" width="${w}" height="${h}" viewBox="0 0 ${w} ${h}">${inner}</svg>`;
}
function grad(id, c1, c2) {
  return `<defs><linearGradient id="${id}" x1="0" y1="0" x2="1" y2="1"><stop offset="0" stop-color="${c1}"/><stop offset="1" stop-color="${c2}"/></linearGradient></defs>`;
}
function vgrad(id, c1, c2) {
  return `<defs><linearGradient id="${id}" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stop-color="${c1}"/><stop offset="1" stop-color="${c2}"/></linearGradient></defs>`;
}
const FONT = "Arial, Helvetica, sans-serif";
const SERIF = "Georgia, 'Times New Roman', serif";

async function render(name, body, format = "jpg") {
  const file = path.join(OUT, name);
  const pipeline = sharp(Buffer.from(body));
  const output = format === "png" ? pipeline.png({ compressionLevel: 9 }) : pipeline.jpeg({ quality: 92 });
  await output.toFile(file);
  console.log("wrote", name);
}

async function avatar(name, initial, c1, c2, fg = "#ffffff") {
  await render(
    name,
    svg(512, 512, `
      ${grad("g", c1, c2)}
      <rect width="512" height="512" fill="url(#g)"/>
      <circle cx="430" cy="90" r="150" fill="${GOLD}" opacity="0.15"/>
      <circle cx="40" cy="470" r="180" fill="#000000" opacity="0.10"/>
      <circle cx="256" cy="256" r="150" fill="#ffffff" opacity="0.10"/>
      <text x="256" y="336" font-family="${FONT}" font-size="240" font-weight="800" fill="${fg}" text-anchor="middle" opacity="0.98">${initial}</text>
    `),
  );
}

async function cover(name, c1, c2, label, sub, sunColor = GOLD) {
  await render(
    name,
    svg(1200, 400, `
      ${vgrad("c", c1, c2)}
      <rect width="1200" height="400" fill="url(#c)"/>
      <circle cx="1010" cy="80" r="66" fill="${sunColor}" opacity="0.9"/>
      <path d="M0 240 L280 150 L480 215 L730 128 L1200 240 L1200 400 L0 400 Z" fill="#0b1f3a" opacity="0.35"/>
      <path d="M0 290 L330 200 L680 275 L960 175 L1200 260 L1200 400 L0 400 Z" fill="#0b1f3a" opacity="0.55"/>
      <text x="84" y="230" font-family="${SERIF}" font-size="72" font-weight="700" fill="#ffffff">${label}</text>
      <text x="88" y="266" font-family="${FONT}" font-size="24" fill="#ffffff" opacity="0.78">${sub}</text>
    `),
  );
}

async function groupPhoto(name, c1, c2, initials) {
  await render(
    name,
    svg(600, 600, `
      ${grad("a", c1, c2)}
      <rect width="600" height="600" fill="url(#a)"/>
      <circle cx="540" cy="70" r="170" fill="${GOLD}" opacity="0.16"/>
      <circle cx="300" cy="300" r="185" fill="#ffffff" opacity="0.14"/>
      <circle cx="300" cy="300" r="150" fill="#fdfbf0"/>
      <text x="300" y="352" font-family="${FONT}" font-size="128" font-weight="800" fill="${NAVY}" text-anchor="middle">${initials}</text>
      <text x="300" y="398" font-family="${FONT}" font-size="26" font-weight="700" fill="${SKY}" text-anchor="middle" letter-spacing="6">DEMOLAY</text>
    `),
  );
}

async function product(name, c1, c2, label, icon) {
  await render(
    name,
    svg(600, 600, `
      ${vgrad("p", c1, c2)}
      <rect width="600" height="600" fill="url(#p)"/>
      <circle cx="510" cy="100" r="190" fill="#ffffff" opacity="0.10"/>
      <circle cx="90" cy="540" r="210" fill="#000000" opacity="0.10"/>
      <g transform="translate(300,265)">${icon}</g>
      <text x="300" y="520" font-family="${SERIF}" font-size="42" font-weight="700" fill="#ffffff" text-anchor="middle">${label}</text>
    `),
  );
}

const SHIRT = `<path d="M-4 -95 Q-4 -118 -22 -105 L-78 -78 L-112 -24 L-60 8 L-56 98 L56 98 L60 8 L112 -24 L78 -78 L22 -105 Q4 -118 4 -95 Z" fill="${NAVY}"/>
<path d="M-4 -95 L4 -95 L-2 -95" stroke="#ffffff" stroke-width="4" opacity="0.4"/>
<circle cx="0" cy="26" r="7" fill="${GOLD}"/>
<circle cx="0" cy="56" r="7" fill="${GOLD}"/>
<circle cx="0" cy="86" r="7" fill="${GOLD}"/>`;

const CAP = `<path d="M-104 -22 Q-104 -102 0 -102 Q104 -102 104 -22 Z" fill="${BLUE}"/>
<path d="M-104 -22 L104 -22" stroke="${GOLD}" stroke-width="10"/>
<path d="M-104 -10 Q0 18 104 -10 L104 -22 Q0 8 -104 -22 Z" fill="${BLUE}"/>
<path d="M78 -46 Q118 -58 104 -84" stroke="${GOLD}" stroke-width="12" fill="none" stroke-linecap="round"/>`;

const TOTE = `<rect x="-72" y="-55" width="144" height="130" rx="16" fill="#9db16f"/>
<path d="M-42 -55 Q-42 -88 0 -88 Q42 -88 42 -55" stroke="#9db16f" stroke-width="14" fill="none"/>
<rect x="-72" y="-42" width="144" height="22" fill="${GOLD}" opacity="0.9"/>
<rect x="-72" y="-55" width="144" height="130" rx="16" fill="none" stroke="#6f8150" stroke-width="4"/>`;

const TICKET = `<g transform="translate(0,-8)">
<rect x="-124" y="-62" width="248" height="124" rx="18" fill="#fff8e1"/>
<circle cx="0" cy="-62" r="16" fill="${SKY}"/>
<circle cx="0" cy="62" r="16" fill="${SKY}"/>
<rect x="-124" y="18" width="248" height="18" fill="${SKY}" opacity="0.85"/>
<text x="0" y="12" font-family="${FONT}" font-size="30" font-weight="800" fill="${NAVY}" text-anchor="middle">WORKSHOP</text>
<circle cx="-80" cy="20" r="8" fill="${NAVY}" opacity="0.25"/>
<circle cx="-50" cy="20" r="8" fill="${NAVY}" opacity="0.25"/>
<circle cx="-20" cy="20" r="8" fill="${NAVY}" opacity="0.25"/>
<circle cx="80" cy="20" r="8" fill="${NAVY}" opacity="0.25"/>
<circle cx="50" cy="20" r="8" fill="${NAVY}" opacity="0.25"/>
<circle cx="20" cy="20" r="8" fill="${NAVY}" opacity="0.25"/>
</g>`;

async function main() {
  fs.mkdirSync(OUT, { recursive: true });

  await render(
    "logo-mark.png",
    svg(512, 512, `
      ${grad("lg", BLUE, NAVY)}
      <rect width="512" height="512" rx="120" fill="url(#lg)"/>
      <circle cx="256" cy="256" r="158" fill="none" stroke="${GOLD}" stroke-width="9" opacity="0.9"/>
      <circle cx="256" cy="256" r="118" fill="${GOLD}" opacity="0.12"/>
      <text x="256" y="330" font-family="${SERIF}" font-size="215" font-weight="800" fill="${GOLD}" text-anchor="middle">D</text>
      <circle cx="398" cy="118" r="14" fill="#ffffff" opacity="0.85"/>
    `),
    "png",
  );

  await avatar("member-alex.jpg", "A", BLUE, SKY);
  await avatar("profile-mateo.jpg", "M", BLUE, SKY);
  await avatar("profile-daniel.jpg", "D", "#0E5F6E", "#16A085");
  await avatar("profile-isaiah.jpg", "I", GREEN, "#3FA34D");
  await avatar("profile-liam.jpg", "L", NAVY, "#7A5C2E");
  await avatar("profile-caleb.jpg", "C", "#0076AF", "#4FB3E0");
  await avatar("profile-noah.jpg", "N", "#283593", "#5C6BC0");
  await avatar("profile-ethan.jpg", "E", "#0B1F3A", BLUE);
  await avatar("profile-marcus.jpg", "M", RED, "#E0655F");
  await avatar("profile-owen.jpg", "O", "#33415C", "#5D6D8A");
  await avatar("profile-council.jpg", "D", GOLD, "#F5B700", NAVY);

  await cover("community.jpg", BLUE, SKY, "DeMolay Leadership Pathway", "Chapter life, service, and brotherhood", GOLD);
  await cover("cover-default.jpg", NAVY, BLUE, "DeMolay Leadership Pathway", "Character. Leadership. Brotherhood. Service.");

  await groupPhoto("group-service-photo.jpg", GREEN, "#3FA34D", "SC");
  await groupPhoto("group-book-photo.jpg", "#7A5C2E", GOLD, "BC");
  await groupPhoto("group-lab-photo.jpg", BLUE, NAVY, "LL");
  await cover("group-service-cover.jpg", "#0F3D2E", GREEN, "Service Project Crew", "Planning service, together", GOLD);
  await cover("group-book-cover.jpg", "#5A4630", "#7A5C2E", "Leadership Book Circle", "Monthly reading and discussion", "#FFF3C4");
  await cover("group-lab-cover.jpg", "#0B1F3A", BLUE, "Chapter Leadership Lab", "Mentorship and practice", GOLD);

  await product("product-polo.jpg", BLUE, NAVY, "Chapter Polo", SHIRT);
  await product("product-cap.jpg", SKY, BLUE, "Pathway Cap", CAP);
  await product("product-tote.jpg", "#3E4A2F", GREEN, "Service Day Tote", TOTE);
  await product("product-ticket.jpg", "#005B8C", SKY, "Workshop Ticket", TICKET);

  console.log("done");
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});