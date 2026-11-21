// Where uploaded audio files live.
//
// disk: a folder on this machine (STUDIO_DATA/files), served by the server.
// blob: Vercel Blob (when BLOB_READ_WRITE_TOKEN is set). Vercel functions take
//       request bodies of at most about 4.5 MB, so the browser sends the file
//       straight to Blob with a short-lived token that only allows that one
//       path, one content type and 10 MB; the server then checks what arrived.
import crypto from 'node:crypto';
import { createReadStream, createWriteStream, existsSync, mkdirSync, statSync } from 'node:fs';
import { rename, rm } from 'node:fs/promises';
import { join, resolve, sep } from 'node:path';
import { E } from './errors.mjs';

export const MAX_AUDIO = 10 * 1024 * 1024;
export const AUDIO_TYPES = new Set(['audio/mpeg', 'audio/mp4', 'audio/ogg', 'audio/wav', 'audio/x-wav', 'audio/webm', 'audio/aac']);
export const FILE_PATH = /^[0-9a-f-]{36}\/[A-Za-z0-9._-]{1,120}$/;

/** Read a request body of at most `limit` bytes (rejects bigger ones). */
export function readBody(req, limit) {
  return new Promise((ok, no) => {
    let size = 0;
    const parts = [];
    req.on('data', (c) => {
      size += c.length;
      if (size > limit) {
        no(new E(`files are at most ${Math.round(limit / 1048576)} MB`, 'PT413', 413));
        req.destroy();
      } else parts.push(c);
    });
    req.on('end', () => ok(Buffer.concat(parts)));
    req.on('error', no);
  });
}

export function diskStorage(root) {
  const base = resolve(root, 'studio-audio');
  mkdirSync(base, { recursive: true });
  const inside = (p) => {
    const full = resolve(base, '.' + sep + p);
    return full.startsWith(base + sep) ? full : null;
  };
  return {
    kind: 'disk',
    /** Stream the request body into rel; returns the size. */
    async save(req, rel) {
      const dir = join(base, rel.split('/')[0]);
      mkdirSync(dir, { recursive: true });
      const tmp = join(dir, `.${crypto.randomUUID()}.part`);
      let size = 0;
      await new Promise((ok, no) => {
        const out = createWriteStream(tmp, { flags: 'wx' });
        req.on('data', (c) => {
          size += c.length;
          if (size > MAX_AUDIO) {
            req.destroy();
            out.destroy();
            no(new E('files are at most 10 MB', 'PT413', 413));
          }
        });
        req.pipe(out);
        out.on('finish', ok);
        out.on('error', no);
        req.on('error', no);
      }).catch(async (e) => {
        await rm(tmp, { force: true });
        throw e;
      });
      if (!size) {
        await rm(tmp, { force: true });
        throw new E('the file is empty');
      }
      await rename(tmp, join(base, rel));
      return { size, url: null };
    },
    /** Send the file, or false if there is none. */
    send(res, rel, type = 'application/octet-stream') {
      const full = FILE_PATH.test(rel) ? inside(rel) : null;
      if (!full || !existsSync(full)) return false;
      const st = statSync(full);
      res.writeHead(200, { 'Content-Type': type, 'Content-Length': st.size, 'Cache-Control': 'public, max-age=31536000, immutable' });
      createReadStream(full).pipe(res);
      return true;
    },
  };
}

export async function blobStorage(token = process.env.BLOB_READ_WRITE_TOKEN) {
  const blob = await import('@vercel/blob');
  const client = await import('@vercel/blob/client');
  const key = (rel) => `studio-audio/${rel}`;
  return {
    kind: 'blob',
    // Small files can still come through the server (the 4.5 MB request limit applies on Vercel).
    async save(req, rel, mime) {
      const buf = await readBody(req, MAX_AUDIO);
      if (!buf.length) throw new E('the file is empty');
      const out = await blob.put(key(rel), buf, { access: 'public', contentType: mime, addRandomSuffix: false, allowOverwrite: false, token });
      return { size: buf.length, url: out.url };
    },
    /** A token that lets the browser upload exactly this one file. */
    async ticket(rel, mime) {
      const clientToken = await client.generateClientTokenFromReadWriteToken({
        token,
        pathname: key(rel),
        allowedContentTypes: [mime],
        maximumSizeInBytes: MAX_AUDIO,
        addRandomSuffix: false,
        allowOverwrite: false,
        validUntil: Date.now() + 15 * 60e3,
      });
      return { pathname: key(rel), clientToken };
    },
    /** What actually arrived at rel: { size, mime, url } or null. */
    async look(rel) {
      try {
        const h = await blob.head(key(rel), { token });
        return { size: h.size, mime: String(h.contentType ?? '').split(';')[0].trim(), url: h.url };
      } catch {
        return null;
      }
    },
    async remove(rel) {
      await blob.del(key(rel), { token }).catch(() => {});
    },
  };
}
