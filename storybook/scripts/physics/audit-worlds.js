// Missing-collider audit across worlds: for each, every drawn part that stands
// on the ground taller than a step and has no collider under it.
//   WORLDS="1 2 19 ark" node scripts/physics/audit-worlds.js   (server on :8090)
const { chromium } = require('playwright');
const BASE = process.env.BASE || 'http://localhost:8090';
const worlds = (process.env.WORLDS || '1 2 3 4 5 6 7 8 9 10 12 13 14 15 16 17 18 19 20 21 22 23 24 25 26 27 28 29 30 31 32 33 34 35 36 37 38 39 ark').split(/\s+/);
(async () => {
  const b = await chromium.launch({ args: ['--use-gl=angle', '--use-angle=swiftshader', '--enable-unsafe-swiftshader'] });
  for (const w of worlds) {
    const p = await (await b.newContext({ viewport: { width: 700, height: 450 } })).newPage();
    const ark = w === 'ark';
    const H = ark ? '__ark' : '__adv';
    try {
      await p.goto(ark ? `${BASE}/ark?q=low` : `${BASE}/adventure/${w}?q=low`, { timeout: 180000 });
      await p.waitForFunction((h) => !!globalThis[h] && globalThis[h].game.clock > 1.2, H, { timeout: 400000 });
      const r = await p.evaluate((h) => {
        const A = globalThis[h];
        const a = A.audit();
        const ex = A.game.space.extra?.get('props');
        // Name each gap by the nearest structure or activity, to find it in the world file.
        const things = [...(A.def?.structures ?? []).map((s) => ({ n: s.type, x: s.x, z: s.z })), ...(A.def?.tasks ?? []).filter((k) => k.at).map((k) => ({ n: `task ${k.id}`, x: k.at[0], z: k.at[1] }))];
        const near = (x, z) => things.map((k) => ({ ...k, d: Math.hypot(k.x - x, k.z - z) })).sort((p, q) => p.d - q.d)[0];
        const uncovered = a.uncovered.map((u) => { const k = near(u.x, u.z); return { ...u, near: k ? `${k.n} ${k.d.toFixed(1)} m` : '' }; });
        return { parts: a.parts, trees: a.trees, props: ex ? ex.solids.length : 0, uncovered };
      }, H);
      console.log(JSON.stringify({ world: w, ...r }));
    } catch (e) {
      console.log(JSON.stringify({ world: w, error: String(e).slice(0, 200) }));
    }
    await p.context().close();
  }
  await b.close();
})();
