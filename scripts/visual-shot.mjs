/**
 * Visual shot harness — drives the real app in headless Chromium (WebGL via
 * SwiftShader) so the 3D shot scene can be inspected without a human.
 *
 *   1. build + serve the app:   npm run build && PORT=3210 npm run start
 *   2. run the harness:         node scripts/visual-shot.mjs [outDir]
 *
 * Env:
 *   PW_URL   app url (default http://localhost:3210)
 *   PW_SHOTS comma list of aimX:aimY spots (x 0..1 across, y 0..1 height),
 *            default "0.5:0.25,0.1:0.85,0.9:0.85"
 *
 * For each spot it navigates Landing → Create → Hub → Practice, drags to that
 * spot, screenshots the dive + the result panel, and prints the debug readout
 * (GOAL/SAVED · tier · accuracy · aim · timing · curl · running conversion).
 * Aim/keeper math mirrors components/game/ShotScene3D.tsx (ANCHOR + AIM_RANGE_*).
 */
import { chromium } from "playwright";
import { mkdirSync } from "node:fs";

const URL = process.env.PW_URL ?? "http://localhost:3210";
const OUT = process.argv[2] ?? "./.shot-screens";
const SHOTS = (process.env.PW_SHOTS ?? "0.5:0.25,0.1:0.85,0.9:0.85")
  .split(",")
  .map((s) => s.split(":").map(Number));

mkdirSync(OUT, { recursive: true });

const browser = await chromium.launch({
  args: ["--use-gl=angle", "--use-angle=swiftshader", "--enable-unsafe-swiftshader", "--ignore-gpu-blocklist"],
});
const p = await browser.newPage({ viewport: { width: 440, height: 880 }, deviceScaleFactor: 2 });
p.on("pageerror", (e) => console.log("PAGEERR", e.message));

const click = async (re) => {
  await p.getByRole("button", { name: re }).first().click({ force: true });
  await p.waitForTimeout(450);
};

await p.goto(URL, { waitUntil: "networkidle" });
await click(/New Career/i);
await p.locator("input").first().fill("Tester");
await p.locator("input").nth(1).fill("Brazil");
await p.waitForTimeout(200);
await click(/Start Career/i);
await click(/Practice/i);
await p.waitForSelector("canvas", { timeout: 10000 });
await p.waitForTimeout(900);

async function shot(tag, aimX, aimY) {
  const box = await p.locator("canvas").first().boundingBox();
  const ax = box.x + box.width * 0.5;
  const ay = box.y + box.height * (64 / 80); // ANCHOR (50, 64) in local 100x80
  const tx = box.x + box.width * ((50 + (aimX - 0.5) * 56) / 100); // AIM_RANGE_X 56
  const ty = box.y + box.height * ((64 - aimY * 46) / 80); // AIM_RANGE_Y 46
  await p.mouse.move(ax, ay);
  await p.mouse.down();
  for (let i = 1; i <= 6; i++) {
    await p.mouse.move(ax + ((tx - ax) * i) / 6, ay + ((ty - ay) * i) / 6);
    await p.waitForTimeout(8);
  }
  await p.mouse.up();
  await p.waitForTimeout(520);
  await p.screenshot({ path: `${OUT}/${tag}-dive.png` });
  await p.waitForTimeout(700);
  await p.screenshot({ path: `${OUT}/${tag}-result.png` });
  const txt = (await p.locator("body").innerText())
    .split("\n")
    .filter((l) => /GOAL|SAVED|conversion/i.test(l))
    .join(" | ");
  console.log(`${tag} (aim ${aimX}, height ${aimY}): ${txt}`);
  const next = p.getByRole("button", { name: /Next shot/i });
  if (await next.count()) {
    await next.first().click({ force: true });
    await p.waitForTimeout(500);
  }
}

for (let i = 0; i < SHOTS.length; i++) {
  const [x, y] = SHOTS[i];
  await shot(`shot${i}-${x}x${y}`, x, y);
}

await browser.close();
console.log(`\nScreenshots in ${OUT}`);
