// An error the server sends back to the caller as { error: { code, message } }.
// code 42501 = not allowed (kept from the Postgres version so messages and
// tests read the same), PT409 = someone else saved first.
export class E extends Error {
  constructor(message, code = 'P0001', status) {
    super(message);
    this.code = code;
    this.status = status ?? (code === '42501' ? 403 : code === 'PT409' ? 409 : 400);
  }
}
export const deny = (message) => new E(message, '42501');
