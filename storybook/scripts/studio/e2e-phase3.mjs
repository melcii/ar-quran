// Phase 3 acceptance run, in Chromium against a real local Supabase (start
// both as described in e2e.mjs):
//  - add an activity from a template (guide animals home), place it on the
//    map, link it in the logic editor, and play-test it in the draft;
//  - change the Nuh's Ark giraffe-guiding settings, run the guiding check,
//    publish with approval, and see the game use them; then unpublish;
//  - upload narration audio, have another audio editor approve it, assign it
//    to its line and hear the game fetch it in a play test; recitation needs
//    a Quran reviewer, a confirmed licence and a human reciter;
//  - preview characters and change which options children are offered;
//  - server refusals for roles that may not do these things; no AI calls.
import fs from 'node:fs';
import { APP, AI_HOSTS, SHOTS, account, browser, check, failures, resetScope, sharing, signIn, sql, until } from './lib.mjs';

for (const s of ['surah:19', 'ark:slice', 'catalog:avatar']) resetScope(s);
const owner = await account('p3-owner');
const world = await account('p3-world');
const story = await account('p3-story');
const audioA = await account('p3-audio-a');
const audioB = await account('p3-audio-b');
const quran = await account('p3-quran');
sql(`select public.studio_bootstrap_super_admin('${owner.email}')`);
for (const [who, role] of [[world, 'world_editor'], [story, 'story_editor'], [audioA, 'audio_editor'], [audioB, 'audio_editor'], [quran, 'quran_reviewer']])
  await owner.c.rpc('studio_set_role', { p_email: who.email, p_role: role, p_on: true });

const { b, page, requests } = await browser();

/* ------------------------------ 1. activity from a template ------------------------------ */
const w = await page();
await signIn(w, world);
await w.goto(`${APP}/admin/surah/19`);
await w.getByTestId('tab-activities').last().click();
await w.getByTestId('tpl-lead').last().click();
await w.getByTestId('act-title').last().fill('Bring the goats to the grove');
await w.getByTestId('act-goal').last().fill('Lead the goats to the fold by the palms');
await w.getByTestId('act-adaptation').last().fill('Leading goats is a game idea; the surah does not describe it.');
await w.getByTestId('act-animal-goat').last().click();
// Place the herd by clicking the map.
await w.getByTestId('act-herd-pick').last().click();
const map = w.getByTestId('spot-map').last();
const box = await map.boundingBox();
await w.mouse.click(box.x + box.width * 0.7, box.y + box.height * 0.35);
const herd = [await w.getByTestId('act-herd-x').last().inputValue(), await w.getByTestId('act-herd-z').last().inputValue()].map(Number);
check('a place is chosen by clicking the map', herd[0] > 0 && herd[1] < 0, String(herd));
await w.getByTestId('act-add').last().click();
const added = await until(w, () => document.querySelector('[data-testid^="added-x-lead-"]')?.getAttribute('data-testid')?.slice(6), 10000);
check('the activity from the template is added to the draft', !!added, String(added));
await w.screenshot({ path: `${SHOTS}/p3-1-activity-builder.png`, fullPage: false });
// Logic editor: make the new activity wait for the first chapter.
const firstId = await w.evaluate(() => document.querySelector('[data-testid^="node-"]')?.getAttribute('data-testid')?.slice(5));
await w.getByTestId(`node-${added}`).last().click();
await w.getByTestId(`wait-${added}-${firstId}`).last().click();
await w.getByTestId(`wait-${added}-${firstId}`).last().waitFor();
const saved1 = await until(w, () => /Draft saved/.test(document.querySelector('[data-testid="save-state"]')?.textContent ?? ''), 20000);
check('the change autosaves as a draft', !!saved1);
const draft1 = sql(`select doc::text from public.content_drafts where scope = 'surah:19'`);
const d1 = JSON.parse(draft1);
check('the draft holds the new activity and its new link', d1.add?.tasks?.some((t) => t.id === added && t.kind === 'lead' && t.animal === 'goat') && d1.links?.[added]?.includes(firstId), draft1.slice(0, 200));
await w.evaluate(() => window.scrollTo(0, 0));
await w.screenshot({ path: `${SHOTS}/p3-2-logic.png` });
// Play test: the game has the activity, waiting for the first chapter, and goats in the world.
const pt = await sharing(page, w);
await pt.goto(`${APP}/adventure/19?studio=draft&q=low`);
const t = await until(pt, (id) => globalThis.__adv?.def?.tasks?.find((x) => x.id === id), 120000, added);
check('the play test of the draft has the activity, waiting for the first chapter too', !!t && t.requires?.includes(firstId), JSON.stringify(t)?.slice(0, 160));
const goats = await until(pt, () => globalThis.__adv?.game?.animals?.filter?.((a) => a.kind === 'goat').length, 20000);
check('the goats are in the world to be guided', goats >= 3, String(goats));
await pt.close();

/* ------------------------------ 2. Nuh's Ark giraffe settings ------------------------------ */
await w.goto(`${APP}/admin/ark`);
await until(w, () => globalThis.__studioArk?.check, 60000);
await w.getByTestId('pair-giraffe').last().click();
await w.getByTestId('giraffe.speed').last().fill('2.6');
await w.getByTestId('giraffe.arrive').last().fill('5');
await w.getByTestId('giraffe.home-x').last().fill('34');
// A pad in the river is caught before anything is saved for review.
await w.getByTestId('giraffe.pad-z').last().fill('-45');
const bad = await until(w, () => globalThis.__studioArk.check.problems.find((p) => p.key === 'giraffe.pad')?.message, 5000);
check('a pad placed in the river is refused by the guiding check', /open ground|cannot walk/.test(bad ?? ''), bad);
await w.getByTestId('giraffe.pad-z').last().fill('-6.5');
await until(w, () => !globalThis.__studioArk.check.problems.some((p) => p.level === 'error'), 5000);
await w.getByTestId('ark-check').last().click();
await w.getByText('Guiding check passed').first().waitFor({ timeout: 20000 });
check('the guiding check passes and is recorded', +sql(`select count(*) from public.test_runs where scope = 'ark:slice' and kind = 'movement' and ok`) >= 1);
await until(w, () => /Draft saved/.test(document.querySelector('[data-testid="save-state"]')?.textContent ?? ''), 20000);
await w.screenshot({ path: `${SHOTS}/p3-3-ark-settings.png` });
// A World Editor cannot change the wording (server refuses: words are a Story Editor's).
const deny = await world.c.rpc('studio_save_draft', { p_scope: 'ark:slice', p_doc: { v: 1, set: { 'giraffe.instruction': 'Hurry!' } }, p_revision: 999 });
check('a World Editor cannot change the Ark wording (server refuses)', !!deny.error, deny.error?.message);
// The Story Editor writes the completion message.
const s = await page();
await signIn(s, story);
await s.goto(`${APP}/admin/ark`);
await until(s, () => globalThis.__studioArk?.check, 60000);
await s.getByTestId('giraffe.done').last().fill('The giraffes are safe in their stall. Well led!');
await until(s, () => /Draft saved/.test(document.querySelector('[data-testid="save-state"]')?.textContent ?? ''), 20000);
await s.getByTestId('submit-note').last().fill('Giraffes walk a little faster; new completion message');
await s.getByTestId('submit').last().click();
await s.getByText('Submitted for review').first().waitFor({ timeout: 20000 });
await s.close();
// Play test of the draft uses the settings.
const ap = await sharing(page, w);
await ap.goto(`${APP}/ark?studio=draft&q=low`);
const cfg = await until(ap, () => globalThis.__arkGame?.cfg?.giraffe, 120000);
check('the Ark play test uses the draft giraffe settings', cfg?.speed === 2.6 && cfg?.arrive === 5 && cfg?.home?.[0] === 34, JSON.stringify(cfg));
const ag = await until(ap, () => globalThis.__arkGame?.game?.agents?.filter((a) => a.kind === 'giraffe').map((a) => Math.round(a.home.x)), 20000);
check('the giraffes start from the new place', ag?.some((x) => Math.abs(x - 33) <= 2), JSON.stringify(ag));
await ap.waitForTimeout(3000);
await ap.screenshot({ path: `${SHOTS}/p3-4-ark-playtest.png` });
await ap.close();
// Super Admin: checks, approves, publishes; a player gets it; unpublish restores.
const o = await page();
await signIn(o, owner);
await o.goto(`${APP}/admin/ark`);
await o.getByTestId('tab-versions').last().click();
const vt = await o.locator('[data-testid^="version-"]').first().getAttribute('data-testid', { timeout: 20000 });
const num = vt.split('-')[1];
await o.getByTestId(`check-${num}`).last().click();
await o.getByText('Content checks passed').first().waitFor({ timeout: 20000 });
await o.getByTestId(`approve-${num}`).last().click();
await o.getByText(`Version ${num} approved`).first().waitFor({ timeout: 20000 });
await o.getByTestId(`publish-${num}`).last().click();
await o.getByText(`Version ${num} is live`).first().waitFor({ timeout: 20000 });
const g = await page();
await g.goto(`${APP}/ark?q=low`);
const live = await until(g, () => globalThis.__arkGame?.cfg?.giraffe, 120000);
check('players get the published giraffe settings', live?.speed === 2.6 && live?.done.startsWith('The giraffes are safe'), JSON.stringify(live));
await g.close();
await o.getByText('Unpublish: go back to the built-in Ark settings').first().click();
await o.getByText('Players now get the built-in Ark settings').first().waitFor({ timeout: 20000 });
const g2 = await page();
await g2.goto(`${APP}/ark?q=low`);
const back = await until(g2, () => globalThis.__arkGame?.cfg?.giraffe, 120000);
check('after unpublishing, players get the built-in settings again', back?.speed === 2.2 && back?.arrive === 4.2, JSON.stringify(back));
await g2.close();

/* ------------------------------ 3. Audio Studio ------------------------------ */
// A one-second tone stands in for a narrator's recording.
const wav = (() => {
  const rate = 8000;
  const n = rate;
  const buf = Buffer.alloc(44 + n * 2);
  buf.write('RIFF', 0);
  buf.writeUInt32LE(36 + n * 2, 4);
  buf.write('WAVEfmt ', 8);
  buf.writeUInt32LE(16, 16);
  buf.writeUInt16LE(1, 20);
  buf.writeUInt16LE(1, 22);
  buf.writeUInt32LE(rate, 24);
  buf.writeUInt32LE(rate * 2, 28);
  buf.writeUInt16LE(2, 32);
  buf.writeUInt16LE(16, 34);
  buf.write('data', 36);
  buf.writeUInt32LE(n * 2, 40);
  for (let i = 0; i < n; i++) buf.writeInt16LE(Math.round(Math.sin((i / rate) * 2 * Math.PI * 440) * 8000), 44 + i * 2);
  const f = '/tmp/studio-narration-test.wav';
  fs.writeFileSync(f, buf);
  return f;
})();
const a = await page();
await signIn(a, audioA);
await a.goto(`${APP}/admin/audio`);
await a.getByTestId('au-kind-narration').last().click();
await a.getByTestId('au-file').last().setInputFiles(wav);
await a.getByTestId('au-title').last().fill('Maryam welcome, recorded');
await a.getByTestId('au-voice').last().fill('Studio test narrator');
await a.getByTestId('au-licence').last().fill('Recorded for Erguvan by our own narrator; all rights to use in the app.');
await a.getByTestId('au-confirmed').last().click();
const welcomeLine = await until(a, () => document.querySelector('[data-testid^="au-line-"]')?.getAttribute('data-testid')?.slice(8), 20000);
await a.getByTestId(`au-line-${welcomeLine}`).last().click();
await a.getByTestId('au-upload').last().click();
await a.getByText('Uploaded (').first().waitFor({ timeout: 30000 });
const asset = sql(`select id from public.audio_assets where title = 'Maryam welcome, recorded' order by uploaded_at desc limit 1`);
check('narration is uploaded with its licence record, waiting for review', !!asset && sql(`select status from public.audio_assets where id = '${asset}'`) === 'uploaded');
const self = await audioA.c.rpc('studio_audio_review', { p_id: asset, p_decision: 'approve', p_note: '' });
check('the uploader cannot approve their own file (server refuses)', !!self.error, self.error?.message);
await a.screenshot({ path: `${SHOTS}/p3-5-audio-upload.png`, fullPage: true });
await a.close();
const bb = await page();
await signIn(bb, audioB);
await bb.goto(`${APP}/admin/audio`);
await bb.getByTestId(`au-approve-${asset}`).last().click();
await bb.getByText('Approved.').first().waitFor({ timeout: 20000 });
await bb.getByTestId(`au-assign-${asset}`).last().click();
await bb.getByText('Assigned in the surah 19 draft').first().waitFor({ timeout: 20000 });
const d2 = JSON.parse(sql(`select doc::text from public.content_drafts where scope = 'surah:19'`));
check('approved narration is assigned to its line in the world draft', d2.audio?.[welcomeLine] === asset && d2.add?.tasks?.length === 1, JSON.stringify(d2.audio));
await bb.screenshot({ path: `${SHOTS}/p3-6-audio-library.png`, fullPage: true });
// The play test fetches the recording for the welcome line.
const before = requests.length;
const ap2 = await sharing(page, bb);
await ap2.goto(`${APP}/adventure/19?studio=draft&q=low`);
const heard = await until(ap2, () => performance.getEntriesByType('resource').some((e) => /studio-audio/.test(e.name)), 90000);
check('the play test plays the recorded narration file for the welcome line', !!heard || requests.slice(before).some((u) => /storage\/v1\/object\/public\/studio-audio\//.test(u)));
await ap2.close();
// Recitation rules.
const rec = await audioA.c.rpc('studio_audio_register', { p: { kind: 'recitation', title: 'x', path: 'nope/x.mp3', origin: 'licensed_tts', licence: 'abc' } });
check('recitation cannot be registered without an uploaded file', !!rec.error);
sql(`insert into storage.objects (bucket_id, name, owner, metadata) select 'studio-audio', id || '/rec-${Date.now()}.mp3', id, '{"size": 1000, "mimetype": "audio/mpeg"}' from auth.users where email = '${audioA.email}'`);
const recPath = sql(`select name from storage.objects o join auth.users u on u.id = o.owner where u.email = '${audioA.email}' and name like '%/rec-%' limit 1`);
const tts = await audioA.c.rpc('studio_audio_register', { p: { kind: 'recitation', title: 'Maryam 1-3', path: recPath, origin: 'licensed_tts', voice: 'Some voice', licence: 'licensed', surah: 19, ayah_from: 1, ayah_to: 3 } });
check('synthetic recitation is refused (only a named human reciter)', !!tts.error, tts.error?.message);
const human = await audioA.c.rpc('studio_audio_register', { p: { kind: 'recitation', title: 'Maryam 1-3', path: recPath, origin: 'human_recording', voice: 'Named Reciter', licence: 'licensed by the reciter', licence_confirmed: true, surah: 19, ayah_from: 1, ayah_to: 3 } });
check('a named human recitation is registered', !human.error && !!human.data, human.error?.message);
const byAudio = await audioB.c.rpc('studio_audio_review', { p_id: human.data, p_decision: 'approve', p_note: '' });
check('an audio editor cannot approve recitation (needs a Quran reviewer)', !!byAudio.error, byAudio.error?.message);
const byQuran = await quran.c.rpc('studio_audio_review', { p_id: human.data, p_decision: 'approve', p_note: 'checked against the text' });
check('a Quran Content Reviewer approves the recitation', !byQuran.error, byQuran.error?.message);
const music = await audioA.c.rpc('studio_audio_register', { p: { kind: 'music', title: 'bg', path: recPath, origin: 'sound_library', licence: 'licensed' } });
check('there is no way to add background music', !!music.error);
const stolen = await story.c.storage.from('studio-audio').upload(`${(await story.c.auth.getUser()).data.user.id}/x.mp3`, new Blob([new Uint8Array(100)], { type: 'audio/mpeg' }), { contentType: 'audio/mpeg' });
check('a Story Editor cannot upload audio files (storage refuses)', !!stolen.error, stolen.error?.message);

/* ------------------------------ 4. Character Studio ------------------------------ */
await w.goto(`${APP}/admin/characters`);
await w.getByTestId('character-preview').last().waitFor({ timeout: 30000 });
await w.getByTestId('try-head-hijab').last().click();
await w.waitForTimeout(2500);
await w.screenshot({ path: `${SHOTS}/p3-7-character-studio.png` });
const canvasOk = await w.evaluate(() => {
  const c = document.querySelector('[data-testid="character-preview"] canvas');
  if (!c) return false;
  const g = c.getContext('webgl2') ?? c.getContext('webgl');
  return !!g || c.width > 0;
});
check('the character preview shows the explorer in 3D', canvasOk);
await w.getByTestId('show-hair-shaved').last().click();
await w.getByTestId('label-hair-short').last().fill('Short and neat');
await until(w, () => /Draft saved/.test(document.querySelector('[data-testid="save-state"]')?.textContent ?? ''), 20000);
const cat = JSON.parse(sql(`select doc::text from public.content_drafts where scope = 'catalog:avatar'`));
check('the catalog draft hides an option and renames another', cat.hide?.hair?.includes('shaved') && cat.labels?.['hair.short'] === 'Short and neat', JSON.stringify(cat));
await w.getByTestId('show-hair-short').last().click({ force: true }).catch(() => {});
await w.waitForTimeout(3500);
const cat2 = JSON.parse(sql(`select doc::text from public.content_drafts where scope = 'catalog:avatar'`));
check("the default explorer's options cannot be hidden", !cat2.hide?.hair?.includes('short'), JSON.stringify(cat2.hide));
const dr = await sharing(page, w);
await dr.goto(`${APP}/dressing?studio=draft`);
await dr.getByRole('tab', { name: 'Hair' }).first().click({ timeout: 60000 }).catch(() => {});
await dr.getByText('Short and neat').first().waitFor({ timeout: 60000 }).catch(() => {});
const shows = await dr.evaluate(() => document.body.innerText);
check('the dressing room play test offers the renamed option and hides the hidden one', shows.includes('Short and neat') && !shows.includes('Very short'), shows.slice(0, 120));
await dr.close();

/* ------------------------------ no AI ------------------------------ */
const ai = requests.filter((u) => AI_HOSTS.test(u));
check('no request went to an AI model API', ai.length === 0, ai.slice(0, 2).join(' '));
console.log('  hosts:', [...new Set(requests.map((u) => new globalThis.URL(u).host))].join(', '));
await b.close();
console.log(failures() ? `\n${failures()} failed` : '\nall passed');
process.exit(failures() ? 1 : 0);
