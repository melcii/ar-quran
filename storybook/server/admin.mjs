// Jobs only the person running the server can do (they cannot be done over
// the network): make the first Super Admin, reset a password or an
// authenticator. Run from storybook/server:
//
//   npm run admin -- first-admin you@example.org
//   npm run admin -- reset-password someone@example.org
//   npm run admin -- reset-authenticator someone@example.org
//
// Uses the same database as the server: the STUDIO_DATA folder, or the hosted
// Turso database when TURSO_DATABASE_URL and TURSO_AUTH_TOKEN are set (copy
// them from Vercel to run these jobs against the online studio).
import { openStudioDb } from './config.mjs';
import { tx } from './db.mjs';
import { createUser, hashPassword, tempPassword } from './auth.mjs';

const now = () => new Date().toISOString();

/** Make (or promote) a Super Admin. Returns the one-time password, or null if the account already existed. */
export async function firstAdmin(db, email) {
  const pw = tempPassword();
  const made = await tx(db, async () => {
    let id = (await db.prepare('select id from users where email = ?').get(email))?.id;
    const created = !id;
    if (created) id = await createUser(db, email, pw, { mustChange: true });
    await db.prepare("insert or ignore into staff_roles (user_id, role, granted_at) values (?, 'super_admin', ?)").run(id, now());
    await db.prepare("insert into audit_log (at, actor, action, detail) values (?, null, 'staff.bootstrap', ?)").run(now(), JSON.stringify({ user: id }));
    return created;
  });
  return made ? pw : null;
}

async function main() {
  const [cmd, emailArg] = process.argv.slice(2);
  const email = String(emailArg ?? '').trim().toLowerCase();
  if (!email.includes('@')) {
    console.log('Usage: npm run admin -- first-admin|reset-password|reset-authenticator <email>');
    return 1;
  }
  const db = openStudioDb();
  const user = async () => (await db.prepare('select id from users where email = ?').get(email))?.id;

  if (cmd === 'first-admin') {
    const pw = await firstAdmin(db, email);
    console.log(
      pw
        ? `${email} is now a Super Admin.\nOne-time password: ${pw}\nSign in at /admin, choose a new password, then set up an authenticator app.`
        : `${email} is now a Super Admin. Sign in at /admin with their existing password.`,
    );
  } else if (cmd === 'reset-password') {
    const id = await user();
    if (!id) return console.log('No account with that email.'), 0;
    const pw = tempPassword();
    await tx(db, async () => {
      await db.prepare('update users set pw = ?, must_change_password = 1 where id = ?').run(hashPassword(pw), id);
      await db.prepare('delete from sessions where user_id = ?').run(id);
      await db.prepare("insert into audit_log (at, actor, action, detail) values (?, null, 'staff.password_reset', ?)").run(now(), JSON.stringify({ user: id }));
    });
    console.log(`New one-time password for ${email}: ${pw}`);
  } else if (cmd === 'reset-authenticator') {
    const id = await user();
    if (!id) return console.log('No account with that email.'), 0;
    await tx(db, async () => {
      await db.prepare('delete from mfa_factors where user_id = ?').run(id);
      await db.prepare('delete from sessions where user_id = ?').run(id);
      await db.prepare("insert into audit_log (at, actor, action, detail) values (?, null, 'staff.mfa_reset', ?)").run(now(), JSON.stringify({ user: id }));
    });
    console.log(`${email} will set up a new authenticator at their next sign-in.`);
  } else {
    console.log('Unknown command. Use first-admin, reset-password or reset-authenticator.');
    return 1;
  }
  return 0;
}

if (import.meta.url === `file://${process.argv[1]}`) process.exit(await main());
