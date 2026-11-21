// The Admin Studio server as one Vercel function. vercel.json sends every
// /api/* and /files/* address here, with the original path in ?__p=.
// Data: the Turso database in TURSO_DATABASE_URL / TURSO_AUTH_TOKEN, audio in
// Vercel Blob (BLOB_READ_WRITE_TOKEN). See server/README.md, "Vercel".
import { createApp } from '../server/index.mjs';

// Made once per function instance and reused by the requests it serves.
const { handler } = createApp();

export default handler;
