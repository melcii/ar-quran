// The Admin Studio's connection to Supabase: sign-in with multi-factor
// authentication, and thin wrappers around the checked server functions.
// Only the publishable key is used here; every permission is decided by the
// database (supabase/migrations/0002_admin_studio.sql), not by this code.
// Nothing in this file (or anywhere in the studio) calls an AI model.
import { createClient, type SupabaseClient } from '@supabase/supabase-js';
import { useEffect, useState } from 'react';
import { SUPABASE_KEY, SUPABASE_URL, studioConfigured } from './live';
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

let client: SupabaseClient | null = null;
export function sb(): SupabaseClient {
  if (!studioConfigured()) throw new Error('The studio is not connected to Supabase yet.');
  if (!client)
    client = createClient(SUPABASE_URL, SUPABASE_KEY, {
      auth: { persistSession: true, autoRefreshToken: true, storageKey: 'quran-studio.auth', detectSessionInUrl: false },
    });
  return client;
}

export type Who = { user: string | null; email: string | null; aal: string; roles: Role[]; staff: boolean };
export type Gate = { state: 'not-configured' | 'loading' | 'signed-out' | 'needs-mfa-enrol' | 'needs-mfa' | 'not-staff' | 'staff'; who?: Who };

/** Where the signed-in person stands: signed out, needs MFA, not staff, or staff with these roles. */
export async function gate(): Promise<Gate> {
  if (!studioConfigured()) return { state: 'not-configured' };
  const c = sb();
  const { data: s } = await c.auth.getSession();
  if (!s.session) return { state: 'signed-out' };
  const w = await c.rpc('studio_whoami');
  if (w.error) return { state: 'signed-out' };
  const who: Who = { ...(w.data as any), email: s.session.user.email ?? null };
  if (who.staff) return { state: 'staff', who };
  if (!who.roles.length) return { state: 'not-staff', who };
  const f = await c.auth.mfa.listFactors();
  const verified = (f.data?.totp ?? []).filter((x) => x.status === 'verified');
  return { state: verified.length ? 'needs-mfa' : 'needs-mfa-enrol', who };
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
  const r = await sb().auth.signInWithPassword({ email, password });
  if (r.error) throw r.error;
}
export async function signOut() {
  await sb().auth.signOut();
}
export async function enrolMfa(): Promise<{ id: string; qr: string; secret: string }> {
  const c = sb();
  // Drop half-finished enrolments first.
  const f = await c.auth.mfa.listFactors();
  for (const x of f.data?.all ?? []) if (x.status !== 'verified') await c.auth.mfa.unenroll({ factorId: x.id });
  const r = await c.auth.mfa.enroll({ factorType: 'totp', friendlyName: `studio-${Date.now().toString(36)}` });
  if (r.error) throw r.error;
  return { id: r.data.id, qr: r.data.totp.qr_code, secret: r.data.totp.secret };
}
export async function verifyMfa(code: string, factorId?: string) {
  const c = sb();
  let id = factorId;
  if (!id) {
    const f = await c.auth.mfa.listFactors();
    id = (f.data?.totp ?? []).find((x) => x.status === 'verified')?.id;
  }
  if (!id) throw new Error('No authenticator is set up for this account.');
  const ch = await c.auth.mfa.challenge({ factorId: id });
  if (ch.error) throw ch.error;
  const v = await c.auth.mfa.verify({ factorId: id, challengeId: ch.data.id, code: code.trim() });
  if (v.error) throw v.error;
}

const must = <T,>(r: { data: T; error: any }): T => {
  if (r.error) throw new Error(r.error.message ?? String(r.error));
  return r.data;
};

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
  return must(await sb().from('content_drafts').select('*').eq('scope', scope).maybeSingle()) as Draft | null;
}
export async function liveDoc(scope: string): Promise<Overlay | null> {
  return must(await sb().rpc('studio_live_doc', { p_scope: scope })) as Overlay | null;
}
/** What the studio edits: the draft if there is one, else a copy of what is published. */
export async function loadDraftDoc(scope: string): Promise<Overlay | null> {
  const d = await getDraft(scope);
  return d ? d.doc : await liveDoc(scope);
}
export async function saveDraft(scope: string, doc: Overlay, revision: number): Promise<number> {
  return must(await sb().rpc('studio_save_draft', { p_scope: scope, p_doc: doc, p_revision: revision })) as number;
}
export async function discardDraft(scope: string) {
  must(await sb().rpc('studio_discard_draft', { p_scope: scope }));
}
export async function submitDraft(scope: string, note: string): Promise<number> {
  return must(await sb().rpc('studio_submit', { p_scope: scope, p_note: note })) as number;
}
export async function versions(scope?: string): Promise<Version[]> {
  let q = sb().from('content_versions').select('*').order('id', { ascending: false }).limit(200);
  if (scope) q = q.eq('scope', scope);
  return must(await q) as Version[];
}
export async function publications(scope?: string): Promise<Publication[]> {
  let q = sb().from('publications').select('*').order('id', { ascending: false }).limit(200);
  if (scope) q = q.eq('scope', scope);
  return must(await q) as Publication[];
}
export async function drafts(): Promise<Draft[]> {
  return must(await sb().from('content_drafts').select('*').order('updated_at', { ascending: false })) as Draft[];
}
export async function review(version: number, decision: 'approve' | 'changes', note: string) {
  must(await sb().rpc('studio_review', { p_version: version, p_decision: decision, p_note: note }));
}
export async function publish(version: number, at: string | null, note: string) {
  return must(await sb().rpc('studio_publish', { p_version: version, p_effective_at: at, p_note: note })) as number;
}
export async function rollback(scope: string, version: number | null, note: string) {
  return must(await sb().rpc('studio_rollback', { p_scope: scope, p_version: version, p_note: note })) as number;
}
export async function recordTest(a: { scope: string; version?: number | null; kind: string; ok: boolean; summary: string; report: any; hash?: string | null }) {
  const env = typeof navigator !== 'undefined' ? { ua: navigator.userAgent, screen: typeof screen !== 'undefined' ? `${screen.width}x${screen.height}` : '' } : {};
  return must(
    await sb().rpc('studio_record_test', { p_scope: a.scope, p_version: a.version ?? null, p_kind: a.kind, p_ok: a.ok, p_summary: a.summary, p_report: a.report, p_hash: a.hash ?? null, p_env: env }),
  ) as number;
}
export type TestRun = { id: number; scope: string; version_id: number | null; kind: string; ok: boolean; summary: string; report: any; source: string; ran_at: string; ran_by: string | null; environment: any };
export async function testRuns(scope?: string): Promise<TestRun[]> {
  let q = sb().from('test_runs').select('*').order('id', { ascending: false }).limit(300);
  if (scope) q = q.eq('scope', scope);
  return must(await q) as TestRun[];
}

/* ------------------------------ staff, audit, bugs ------------------------------ */

export type Staff = { user_id: string; email: string; roles: Role[]; mfa: boolean };
export async function staff(): Promise<Staff[]> {
  return must(await sb().rpc('studio_staff')) as Staff[];
}
export async function setRole(email: string, role: Role, on: boolean) {
  must(await sb().rpc('studio_set_role', { p_email: email, p_role: role, p_on: on }));
}
export type AuditRow = { id: number; at: string; actor: string | null; actor_roles: Role[]; action: string; scope: string | null; detail: any };
export async function audit(limit = 200): Promise<AuditRow[]> {
  return must(await sb().from('audit_log').select('*').order('id', { ascending: false }).limit(limit)) as AuditRow[];
}
export type Bug = {
  id: number; surah: number | null; scene: string; object: string; title: string; description: string; severity: 'low' | 'medium' | 'high' | 'critical';
  category: string; steps: string; device: any; diagnostics: any; status: string; needs_code: boolean; assigned_to: string | null;
  resolution: string; source: string; reported_by: string | null; discovered_at: string; resolved_at: string | null;
};
export async function bugs(): Promise<Bug[]> {
  return must(await sb().from('bug_reports').select('*').order('id', { ascending: false }).limit(500)) as Bug[];
}
export async function fileBug(p: Partial<Bug> & { title: string }) {
  return must(await sb().rpc('studio_file_bug', { p })) as number;
}
export async function updateBug(id: number, p: Partial<Bug>) {
  must(await sb().rpc('studio_update_bug', { p_id: id, p }));
}
export type PlayerProblem = { id: number; surah: number | null; category: string; screen: string | null; created_at: string; bug_id: number | null };
export async function playerProblems(): Promise<PlayerProblem[]> {
  return must(await sb().from('player_problems').select('*').order('id', { ascending: false }).limit(300)) as PlayerProblem[];
}
