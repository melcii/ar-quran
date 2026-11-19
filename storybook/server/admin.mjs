// Jobs only the person running the server can do (they cannot be done over
// the network): make the first Super Admin, reset a password or an
// authenticator. Run from storybook/:
//
//   node server/admin.mjs first-admin you@example.org
//   node server/admin.mjs reset-password someone@example.org
//   node server/admin.mjs reset-authenticator someone@example.org
//
// Uses the same STUDIO_DATA folder as the server.
import { join, resolve } from 'node:path';
import { openDb, tx } from './db.mjs';
import { createUser, hashPassword, tempPassword } from './auth.mjs';

const [cmd, emailArg] = process.argv.slice(2);
const email = String(emailArg ?? '').trim().toLowerCase();
const db = openDb(join(resolve(process.env.STUDIO_DATA ?? './studio-data'), 'studio.db'));
const user = () => db.prepare('select id from users where email = ?').get(email)?.id;
const now = () => new Date().toISOString();

function done(msg) {
  console.log(msg);
  process.exit(0);
}
if (!email.includes('@')) {
  console.log('Usage: node server/admin.mjs first-admin|reset-password|reset-authenticator <email>');
  process.exit(1);
}

if (cmd === 'first-admin') {
  const pw = tempPassword();
  const out = tx(db, () => {
    let id = user();
    const made = !id;
    if (made) id = createUser(db, email, pw, { mustChange: true });
    db.prepare("insert or ignore into staff_roles (user_id, role, granted_at) values (?, 'super_admin', ?)").run(id, now());
    db.prepare("insert into audit_log (at, actor, action, detail) values (?, null, 'staff.bootstrap', ?)").run(now(), JSON.stringify({ user: id }));
    return made;
  });
  done(
    out
      ? `${email} is now a Super Admin.\nOne-time password: ${pw}\nSign in at /admin, choose a new password, then set up an authenticator app.`
      : `${email} is now a Super Admin. Sign in at /admin with their existing password.`,
  );
} else if (cmd === 'reset-password') {
  if (!user()) done('No account with that email.');
  const pw = tempPassword();
  tx(db, () => {
    db.prepare('update users set pw = ?, must_change_password = 1 where id = ?').run(hashPassword(pw), user());
    db.prepare('delete from sessions where user_id = ?').run(user());
    db.prepare("insert into audit_log (at, actor, action, detail) values (?, null, 'staff.password_reset', ?)").run(now(), JSON.stringify({ user: user() }));
  });
  done(`New one-time password for ${email}: ${pw}`);
} else if (cmd === 'reset-authenticator') {
  if (!user()) done('No account with that email.');
  tx(db, () => {
    db.prepare('delete from mfa_factors where user_id = ?').run(user());
    db.prepare('delete from sessions where user_id = ?').run(user());
    db.prepare("insert into audit_log (at, actor, action, detail) values (?, null, 'staff.mfa_reset', ?)").run(now(), JSON.stringify({ user: user() }));
  });
  done(`${email} will set up a new authenticator at their next sign-in.`);
} else {
  console.log('Unknown command. Use first-admin, reset-password or reset-authenticator.');
  process.exit(1);
}
