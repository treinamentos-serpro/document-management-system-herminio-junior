const { test, before, after } = require('node:test');
const assert = require('node:assert');
const { once } = require('node:events');
const { unlink } = require('node:fs/promises');
const path = require('node:path');
const app = require('../src/app');

let server;
let baseUrl;
const uploadedIds = [];

before(async () => {
  server = app.listen(0, '127.0.0.1');
  await once(server, 'listening');
  baseUrl = `http://127.0.0.1:${server.address().port}`;
});

after(async () => {
  await new Promise((resolve, reject) => {
    server.close((error) => error ? reject(error) : resolve());
  });
  await Promise.all(uploadedIds.map((id) => (
    unlink(path.join(__dirname, '../storage', id))
  )));
});

test('o app backend é exportado', () => {
  assert.ok(app, 'o app deve estar definido');
  assert.strictEqual(typeof app, 'function', 'o app Express deve ser uma função');
});

test('a listagem começa vazia', async () => {
  const response = await fetch(`${baseUrl}/documents`);

  assert.strictEqual(response.status, 200);
  assert.deepStrictEqual(await response.json(), []);
});

test('upload, listagem e download preservam os metadados e o conteúdo', async () => {
  const content = Buffer.from('Documento de teste\n');
  const form = new FormData();
  form.append('file', new Blob([content], { type: 'text/plain' }), 'documento.txt');
  form.append('owner', 'test-user');

  const uploadResponse = await fetch(`${baseUrl}/upload`, {
    method: 'POST',
    body: form,
  });

  assert.strictEqual(uploadResponse.status, 201);
  const document = await uploadResponse.json();
  assert.match(document.id, /^[0-9a-f-]{36}$/);
  uploadedIds.push(document.id);
  assert.strictEqual(document.originalName, 'documento.txt');
  assert.strictEqual(document.size, content.length);
  assert.strictEqual(document.owner, 'test-user');
  assert.ok(Number.isFinite(Date.parse(document.createdAt)));
  assert.strictEqual(document.path, undefined);

  const listResponse = await fetch(`${baseUrl}/documents`);
  assert.strictEqual(listResponse.status, 200);
  assert.deepStrictEqual(await listResponse.json(), [document]);

  const downloadResponse = await fetch(`${baseUrl}/documents/${document.id}/download`);
  assert.strictEqual(downloadResponse.status, 200);
  assert.match(downloadResponse.headers.get('content-disposition'), /attachment;.*documento\.txt/);
  assert.deepStrictEqual(Buffer.from(await downloadResponse.arrayBuffer()), content);
});

test('upload sem arquivo retorna 400', async () => {
  const response = await fetch(`${baseUrl}/upload`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ owner: 'test-user' }),
  });

  assert.strictEqual(response.status, 400);
  assert.ok((await response.json()).error);
});

test('download de documento inexistente retorna 404', async () => {
  const response = await fetch(`${baseUrl}/documents/inexistente/download`);

  assert.strictEqual(response.status, 404);
  assert.ok((await response.json()).error);
});
