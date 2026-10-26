const { test, after } = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const os = require('node:os');
const path = require('node:path');

const storageDirectory = fs.mkdtempSync(path.join(os.tmpdir(), 'dms-test-'));
process.env.STORAGE_DIR = storageDirectory;
process.env.MAX_FILE_SIZE = '16';

const app = require('../src/app');

after(() => fs.rmSync(storageDirectory, { recursive: true, force: true }));

async function withServer(callback) {
  const server = app.listen(0);
  await new Promise((resolve) => server.once('listening', resolve));
  const address = server.address();

  try {
    await callback(`http://127.0.0.1:${address.port}`);
  } finally {
    await new Promise((resolve, reject) => {
      server.close((error) => error ? reject(error) : resolve());
    });
  }
}

test('o app backend é exportado e responde ao health check', async () => {
  assert.ok(app, 'o app deve estar definido');
  assert.equal(typeof app, 'function', 'o app Express deve ser uma função');

  await withServer(async (baseUrl) => {
    const response = await fetch(`${baseUrl}/health`);
    assert.equal(response.status, 200);
    assert.deepEqual(await response.json(), { status: 'ok' });
  });
});

test('faz upload, lista e baixa documentos somente para o usuário proprietário', async () => {
  await withServer(async (baseUrl) => {
    const form = new FormData();
    form.append('file', new Blob(['conteudo']), '../relatorio.txt');

    const uploadResponse = await fetch(`${baseUrl}/upload`, {
      method: 'POST',
      headers: { 'X-User-Id': 'usuario-a' },
      body: form,
    });
    assert.equal(uploadResponse.status, 201);

    const { document } = await uploadResponse.json();
    assert.equal(document.originalName, 'relatorio.txt');
    assert.equal(document.size, 8);
    assert.equal(document.owner, 'usuario-a');
    assert.equal(Number.isNaN(Date.parse(document.uploadedAt)), false);
    assert.equal(Object.hasOwn(document, 'storageName'), false);

    const listResponse = await fetch(`${baseUrl}/documents`, {
      headers: { 'X-User-Id': 'usuario-a' },
    });
    assert.deepEqual((await listResponse.json()).documents, [document]);

    const otherUserResponse = await fetch(`${baseUrl}/documents`, {
      headers: { 'X-User-Id': 'usuario-b' },
    });
    assert.deepEqual((await otherUserResponse.json()).documents, []);

    const downloadResponse = await fetch(
      `${baseUrl}/documents/${document.id}/download`,
      { headers: { 'X-User-Id': 'usuario-a' } },
    );
    assert.equal(downloadResponse.status, 200);
    assert.match(downloadResponse.headers.get('content-disposition'), /relatorio\.txt/);
    assert.equal(await downloadResponse.text(), 'conteudo');

    const deniedResponse = await fetch(
      `${baseUrl}/documents/${document.id}/download`,
      { headers: { 'X-User-Id': 'usuario-b' } },
    );
    assert.equal(deniedResponse.status, 404);
    assert.equal((await deniedResponse.json()).error.code, 'DOCUMENT_NOT_FOUND');
  });
});

test('rejeita upload sem arquivo e arquivo acima do limite', async () => {
  await withServer(async (baseUrl) => {
    const missingFileResponse = await fetch(`${baseUrl}/upload`, { method: 'POST' });
    assert.equal(missingFileResponse.status, 400);
    assert.equal((await missingFileResponse.json()).error.code, 'FILE_REQUIRED');

    const form = new FormData();
    form.append('file', new Blob(['conteudo maior que dezesseis bytes']), 'grande.txt');
    const largeFileResponse = await fetch(`${baseUrl}/upload`, {
      method: 'POST',
      body: form,
    });
    assert.equal(largeFileResponse.status, 413);
    assert.equal((await largeFileResponse.json()).error.code, 'FILE_TOO_LARGE');
  });
});
