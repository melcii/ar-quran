// Where the studio keeps its data, from environment variables.
//
//   TURSO_DATABASE_URL + TURSO_AUTH_TOKEN   a hosted Turso (libSQL) database:
//                                           needed on Vercel, which has no disk
//                                           that lasts between requests
//   STUDIO_DATA=./studio-data               otherwise: a folder on this machine
//                                           for studio.db and uploaded files
//   BLOB_READ_WRITE_TOKEN                   uploaded audio goes to Vercel Blob
//                                           (set by Vercel when a Blob store is
//                                           connected); otherwise STUDIO_DATA/files
import { join, resolve } from 'node:path';
import { openDb } from './db.mjs';

export const dataDir = (dir = process.env.STUDIO_DATA ?? './studio-data') => resolve(dir);

export function openStudioDb(dir) {
  const url = process.env.TURSO_DATABASE_URL ?? process.env.LIBSQL_URL;
  if (url && !dir) return openDb(url, process.env.TURSO_AUTH_TOKEN ?? process.env.LIBSQL_AUTH_TOKEN);
  return openDb(join(dataDir(dir), 'studio.db'));
}
