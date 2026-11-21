// The Admin Studio's connection to its own server (storybook/server): sign-in
// with an authenticator app, and thin wrappers around the server's checked
// actions. Every permission is decided by the server, not by this code.
// Nothing in this file (or anywhere in the studio) calls an AI model.
import { useEffect, useState } from 'react';
import { STUDIO_URL, studioConfigured } from './live';
import type { Overlay } from './overlay';

export type Role = 'super_admin' | 'world_editor' | 'story_editor' | 'quran_reviewer' | 'audio_editor' | 'game_tester' | 'moderator';
export const ROLES: { id: Role; label: string; can: string }[] = [
  { id: 'super_admin', label: 'Super Admin', can: 'Everything, staff management, publishing and rollback' },
  { id: 'world_editor', label: 'World Editor', can: 'Positions, sizes, colours, scenery, activities' },
  { id: 'story_editor', label: 'Story Editor', can: 'Wording, narration, chapters, references, surah records' },
  { id: 'quran_reviewer', label: 'Quran Content Reviewer', can: 'Approves Quran-linked changes' },
  { id: 'audio_editor', label: 'Audio Editor', can: 'Narration and recitation files and their assignments' },
  { id: 'game_tester', label: 'Game Tester', can: 'Runs and records tests, files bugs' },
  { id: 'moderator', label: 'Moderator', can: 'Player safety and multiplayer settings only' },
];
export const roleLabel = (r: string) => ROLES.find((x) => x.id === r)?.label ?? r;

/* ------------------------------ talking to the server ------------------------------ */

const TOKEN_KEY = 'quran-studio.session';
let memToken: string | null = null;
const store = () => (typeof localStorage !== 'undefined' ? localStorage : null);
const getToken = () => memToken ?? store()?.getItem(TOKEN_KEY) ?? null;
function setToken(t: string | null) {
  memToken = t;
  if (t) store()?.setItem(TOKEN_KEY, t);
  else store()?.removeItem(TOKEN_KEY);
}

type Res<T> = { data: T; error: null } | { data: null; error: { code?: string; message: string } };
async function call<T>(method: 'GET' | 'POST' | 'PUT', path: string, body?: unknown, headers: Record<string, string> = {}): Promise<Res<T>> {
  if (!studioConfigured()) throw new Error('The studio is not connected to its server yet.');
  const t = getToken();
  const raw = body instanceof Blob;
  try {
    const r = await fetch(`${STUDIO_URL}${path}`, {
      method,
      headers: { ...(t ? { Authorization: `Bearer ${t}` } : {}), ...(body !== undefined && !raw ? { 'Content-Type': 'application/json' } : {}), ...headers },
      body: body === undefined ? undefined : raw ? (body as Blob) : JSON.stringify(body),
    });
    const j = await r.json().catch(() => null);
    return r.ok ? { data: j as T, error: null } : { data: null, error: j?.error ?? { message: `The server answered ${r.status}.` } };
  } catch {
    return { data: null, error: { message: 'Could not reach the studio server. Check your connection.' } };
  }
}
const rpc = <T = unknown,>(name: string, args: Record<string, unknown> = {}) => call<T>('POST', `/api/rpc/${name}`, args);
const read = <T = unknown,>(table: string, params: Record<string, string | number | undefined> = {}) => {
  const q = new URLSearchParams(Object.entries(params).flatMap(([k, v]) => (v === undefined ? [] : [[k, String(v)]])));
  return call<T>('GET', `/api/read/${table}?${q}`);
};

type Me = { user: string; email: string; aal: string; must_change_password: boolean; factors: { id: string; status: string }[] } | null;

export type Who = { user: string | null; email: string | null; aal: string; roles: Role[]; staff: boolean };
export type Gate = { state: 'not-configured' | 'loading' | 'signed-out' | 'needs-password' | 'needs-mfa-enrol' | 'needs-mfa' | 'not-staff' | 'staff'; who?: Who };

/** Where the signed-in person stands: signed out, needs a new password or MFA, not staff, or staff with these roles. */
export async function gate(): Promise<Gate> {
  if (!studioConfigured()) return { state: 'not-configured' };
  if (!getToken()) return { state: 'signed-out' };
  const m = await call<Me>('GET', '/api/auth/me');
  if (m.error || !m.data) return { state: 'signed-out' };
  const w = await rpc<Omit<Who, 'email'>>('studio_whoami');
  if (w.error) return { state: 'signed-out' };
  const who: Who = { ...w.data, email: m.data.email };
  if (m.data.must_change_password) return { state: 'needs-password', who };
  if (who.staff) return { state: 'staff', who };
  if (!who.roles.length) return { state: 'not-staff', who };
  return { state: m.data.factors.some((x) => x.status === 'verified') ? 'needs-mfa' : 'needs-mfa-enrol', who };
}

export function useGate(): [Gate, () => void] {
  const [g, setG] = useState<Gate>({ state: 'loading' });
  const [tick, setTick] = useState(0);
  useEffect(() => {
    let gone = false;
    gate().then((x) => !gone && setG(x)).catch(() => !gone && setG({ state: 'signed-out' }));
    return () => {
      gone = true;
    };
  }, [tick]);
  return [g, () => setTick((t) => t + 1)];
}

export const has = (who: Who | undefined, r: Role) => !!who?.staff && (who.roles.includes(r) || who.roles.includes('super_admin'));
export const hasExact = (who: Who | undefined, r: Role) => !!who?.staff && who.roles.includes(r);

export async function signIn(email: string, password: string) {
  setToken(null);
  const r = must(await call<{ token: string }>('POST', '/api/auth/signin', { email, password }));
  setToken(r.token);
}
export async function signOut() {
  await call('POST', '/api/auth/signout').catch(() => null);
  setToken(null);
}
export async function changePassword(password: string) {
  must(await call('POST', '/api/auth/password', { password }));
}
export async function enrolMfa(): Promise<{ id: string; qr: string; secret: string }> {
  return must(await call<{ id: string; qr: string; secret: string }>('POST', '/api/auth/mfa/enroll'));
}
export async function verifyMfa(code: string, factorId?: string) {
  must(await call('POST', '/api/auth/mfa/verify', { code: code.trim(), factorId }));
}

function must<T>(r: Res<T>): T {
  if (r.error) throw new Error(r.error.message ?? String(r.error));
  return r.data as T;
}

/* ------------------------------ content ------------------------------ */

export type Draft = { scope: string; doc: Overlay; revision: number; updated_at: string; updated_by: string | null; base_version: number | null };
export type Version = {
  id: number;
  scope: string;
  number: number;
  doc: Overlay;
  hash: string;
  note: string;
  quran_linked: boolean;
  changed: string[];
  state: 'submitted' | 'approved' | 'changes_requested' | 'published' | 'withdrawn';
  created_by: string | null;
  created_at: string;
  validation_ok: boolean | null;
  validation: any;
  reviewed_by: string | null;
  reviewer_roles: Role[] | null;
  reviewed_at: string | null;
  review_note: string | null;
};
export type Publication = { id: number; scope: string; version_id: number | null; action: 'publish' | 'rollback' | 'unpublish'; by: string | null; at: string; effective_at: string; note: string };

export async function getDraft(scope: string): Promise<Draft | null> {
  return ((must(await read<Draft[]>('content_drafts', { scope })) ?? [])[0] ?? null) as Draft | null;
}
export async function liveDoc(scope: string): Promise<Overlay | null> {
  return must(await rpc('studio_live_doc', { p_scope: scope })) as Overlay | null;
}
/** What the studio edits: the draft if there is one, else a copy of what is published. */
export async function loadDraftDoc(scope: string): Promise<Overlay | null> {
  const d = await getDraft(scope);
  return d ? d.doc : await liveDoc(scope);
}
export async function saveDraft(scope: string, doc: Overlay, revision: number): Promise<number> {
  return must(await rpc('studio_save_draft', { p_scope: scope, p_doc: doc, p_revision: revision })) as number;
}
export async function discardDraft(scope: string) {
  must(await rpc('studio_discard_draft', { p_scope: scope }));
}
export async function submitDraft(scope: string, note: string): Promise<number> {
  return must(await rpc('studio_submit', { p_scope: scope, p_note: note })) as number;
}
export async function versions(scope?: string): Promise<Version[]> {
  return must(await read<Version[]>('content_versions', { scope, limit: 200 }));
}
export async function publications(scope?: string): Promise<Publication[]> {
  return must(await read<Publication[]>('publications', { scope, limit: 200 }));
}
export async function drafts(): Promise<Draft[]> {
  return must(await read<Draft[]>('content_drafts'));
}
export async function review(version: number, decision: 'approve' | 'changes', note: string) {
  must(await rpc('studio_review', { p_version: version, p_decision: decision, p_note: note }));
}
export async function publish(version: number, at: string | null, note: string) {
  return must(await rpc('studio_publish', { p_version: version, p_effective_at: at, p_note: note })) as number;
}
export async function rollback(scope: string, version: number | null, note: string) {
  return must(await rpc('studio_rollback', { p_scope: scope, p_version: version, p_note: note })) as number;
}
export async function recordTest(a: { scope: string; version?: number | null; kind: string; ok: boolean; summary: string; report: any; hash?: string | null }) {
  const env = typeof navigator !== 'undefined' ? { ua: navigator.userAgent, screen: typeof screen !== 'undefined' ? `${screen.width}x${screen.height}` : '' } : {};
  return must(
    await rpc('studio_record_test', { p_scope: a.scope, p_version: a.version ?? null, p_kind: a.kind, p_ok: a.ok, p_summary: a.summary, p_report: a.report, p_hash: a.hash ?? null, p_env: env }),
  ) as number;
}
export type TestRun = { id: number; scope: string; version_id: number | null; kind: string; ok: boolean; summary: string; report: any; source: string; ran_at: string; ran_by: string | null; environment: any };
export async function testRuns(scope?: string): Promise<TestRun[]> {
  return must(await read<TestRun[]>('test_runs', { scope, limit: 300 }));
}

/* ------------------------------ staff, audit, bugs ------------------------------ */

export type Staff = { user_id: string; email: string; roles: Role[]; mfa: boolean };
export async function staff(): Promise<Staff[]> {
  return must(await rpc('studio_staff')) as Staff[];
}
/** Give or take away a role. A new email gets an account and a one-time password (returned once). */
export async function setRole(email: string, role: Role, on: boolean): Promise<{ created: boolean; password?: string }> {
  return must(await rpc<{ created: boolean; password?: string }>('studio_set_role', { p_email: email, p_role: role, p_on: on }));
}
export type AuditRow = { id: number; at: string; actor: string | null; actor_roles: Role[]; action: string; scope: string | null; detail: any };
export async function audit(limit = 200): Promise<AuditRow[]> {
  return must(await read<AuditRow[]>('audit_log', { limit }));
}
export type Bug = {
  id: number; surah: number | null; scene: string; object: string; title: string; description: string; severity: 'low' | 'medium' | 'high' | 'critical';
  category: string; steps: string; device: any; diagnostics: any; status: string; needs_code: boolean; assigned_to: string | null;
  resolution: string; source: string; reported_by: string | null; discovered_at: string; resolved_at: string | null;
};
export async function bugs(): Promise<Bug[]> {
  return must(await read<Bug[]>('bug_reports', { limit: 500 }));
}
export async function fileBug(p: Partial<Bug> & { title: string }) {
  return must(await rpc('studio_file_bug', { p })) as number;
}
export async function updateBug(id: number, p: Partial<Bug>) {
  must(await rpc('studio_update_bug', { p_id: id, p }));
}
/** Group player reports into a new bug (bug null) or link them to an existing one. */
export async function bugFromProblems(ids: number[], bug: number | null, title: string) {
  return must(await rpc('studio_bug_from_problems', { p_ids: ids, p_bug: bug, p_title: title })) as number;
}
export type PlayerProblem = { id: number; surah: number | null; category: string; screen: string | null; created_at: string; bug_id: number | null };
export async function playerProblems(): Promise<PlayerProblem[]> {
  return must(await read<PlayerProblem[]>('player_problems', { limit: 300 }));
}

/* ------------------------------ audio ------------------------------ */

export type AudioAsset = {
  id: string; kind: 'narration' | 'recitation' | 'effect'; title: string; language: string; path: string; mime: string; bytes: number; duration_s: number | null;
  voice: string; origin: 'human_recording' | 'licensed_tts' | 'sound_library'; licence: string; licence_confirmed: boolean; source: string;
  surah: number | null; ayah_from: number | null; ayah_to: number | null; line_text: string | null;
  status: 'uploaded' | 'approved' | 'rejected' | 'retired'; uploaded_by: string | null; uploaded_at: string;
  reviewed_by: string | null; reviewer_roles: Role[] | null; reviewed_at: string | null; review_note: string | null;
};
export async function audioAssets(): Promise<AudioAsset[]> {
  return must(await read<AudioAsset[]>('audio_assets', { limit: 500 }));
}
/** Upload a file into the caller's own folder of the studio's audio files; returns its path. */
// On Vercel the server keeps audio in Vercel Blob and the file goes straight
// there with a one-file token (Vercel functions refuse bodies over 4.5 MB);
// on an own server it goes through the server as before.
export async function uploadAudio(file: Blob & { name?: string; type: string }): Promise<string> {
  const ext = (file.name?.split('.').pop() ?? 'mp3').toLowerCase().replace(/[^a-z0-9]/g, '').slice(0, 5) || 'mp3';
  const start = must(await call<{ mode: 'server' } | { mode: 'blob'; path: string; pathname: string; clientToken: string }>('POST', '/api/upload/studio-audio/start', { type: file.type, ext }));
  if (start.mode === 'blob') {
    const { put } = await import('@vercel/blob/client');
    try {
      await put(start.pathname, file, { access: 'public', token: start.clientToken, contentType: file.type });
    } catch (e) {
      throw new Error(`The upload did not finish: ${e instanceof Error ? e.message : String(e)}`);
    }
    return must(await call<{ path: string }>('POST', '/api/upload/studio-audio/finish', { path: start.path })).path;
  }
  return must(await call<{ path: string }>('PUT', `/api/upload/studio-audio?ext=${ext}`, file, { 'Content-Type': file.type })).path;
}
export async function registerAudio(p: Record<string, unknown>): Promise<string> {
  return must(await rpc('studio_audio_register', { p })) as string;
}
export async function reviewAudio(id: string, decision: 'approve' | 'reject' | 'retire', note: string) {
  must(await rpc('studio_audio_review', { p_id: id, p_decision: decision, p_note: note }));
}

/* ------------------------------ moderation ------------------------------ */

/** A report as a moderator sees it: no grown-up, no friend code, no saves, not who reported. */
export type ModReport = {
  id: number; reason: 'unkind' | 'unsafe' | 'other'; created_at: string; status: 'open' | 'actioned' | 'dismissed'; action: string | null; note: string; handled_at: string | null;
  room: string | null; room_world: string | null; room_closed: boolean | null; about: string | null; about_nickname: string | null; about_reports: number; about_paused_until: string | null;
};
export async function modQueue(): Promise<ModReport[]> {
  return must(await rpc('studio_mod_queue')) as ModReport[];
}
export async function modAct(report: number, action: 'pause_online' | 'reset_nickname' | 'close_room' | 'dismiss', days: number | null, note: string) {
  must(await rpc('studio_mod_act', { p_report: report, p_action: action, p_days: days, p_note: note }));
}
export async function modUnpause(report: number) {
  must(await rpc('studio_mod_unpause', { p_report: report }));
}

/* ------------------------------ releases ------------------------------ */

export type Release = {
  id: number; title: string; notes: string; versions: number[]; state: 'planned' | 'published' | 'undone' | 'cancelled'; effective_at: string | null;
  previous: Record<string, number | null>; created_by: string | null; created_at: string; published_by: string | null; published_at: string | null; undone_at: string | null;
};
export async function releases(): Promise<Release[]> {
  return must(await read<Release[]>('releases', { limit: 100 }));
}
export async function createRelease(title: string, notes: string, versionIds: number[]) {
  return must(await rpc('studio_release_create', { p_title: title, p_notes: notes, p_versions: versionIds })) as number;
}
export async function publishRelease(id: number, at: string | null) {
  must(await rpc('studio_release_publish', { p_id: id, p_at: at }));
}
export async function undoRelease(id: number) {
  must(await rpc('studio_release_undo', { p_id: id }));
}
export async function cancelRelease(id: number) {
  must(await rpc('studio_release_cancel', { p_id: id }));
}
