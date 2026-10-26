import assert from 'node:assert/strict';
import { test } from 'node:test';
import { downloadDocument, listDocuments, uploadDocument } from '../src/services/documentsApi.js';

test('lista documentos usando o prefixo /api', async (t) => {
  const documents = [{ id: '1', originalName: 'relatorio.txt' }];
  t.mock.method(globalThis, 'fetch', async (...args) => {
    assert.deepEqual(args, ['/api/documents']);
    return Response.json({ documents });
  });

  assert.deepEqual(await listDocuments(), documents);
});

test('envia o arquivo no campo file sem definir Content-Type manualmente', async (t) => {
  const file = new File(['conteudo'], 'relatorio.txt');
  const document = { id: '1', originalName: file.name, size: file.size };
  t.mock.method(globalThis, 'fetch', async (url, options) => {
    assert.equal(url, '/api/upload');
    assert.equal(options.method, 'POST');
    assert.equal(options.headers, undefined);
    assert.ok(options.body instanceof FormData);
    assert.equal(options.body.get('file'), file);
    return Response.json({ document }, { status: 201 });
  });

  assert.deepEqual(await uploadDocument(file), document);
});

test('permite enviar arquivos vazios', async (t) => {
  const file = new File([], 'vazio.txt');
  t.mock.method(globalThis, 'fetch', async (url, options) => {
    assert.equal(options.body.get('file').size, 0);
    return Response.json({ document: { size: 0 } }, { status: 201 });
  });

  assert.deepEqual(await uploadDocument(file), { size: 0 });
});

test('propaga a mensagem de erro do backend', async (t) => {
  t.mock.method(globalThis, 'fetch', async () => Response.json({
    error: { message: 'Arquivo excede o limite permitido.' },
  }, { status: 413 }));

  await assert.rejects(uploadDocument(new File(['x'], 'grande.txt')), {
    message: 'Arquivo excede o limite permitido.',
  });
});

test('informa erros HTTP mesmo quando a resposta não contém JSON', async (t) => {
  t.mock.method(globalThis, 'fetch', async () => new Response('Bad Gateway', { status: 502 }));

  await assert.rejects(listDocuments(), {
    message: 'Não foi possível concluir a solicitação.',
  });
});

test('propaga falhas de rede', async (t) => {
  t.mock.method(globalThis, 'fetch', async () => {
    throw new TypeError('Falha de conexão.');
  });

  await assert.rejects(listDocuments(), { message: 'Falha de conexão.' });
});

test('baixa via fetch, preserva o nome e libera a URL temporária', async (t) => {
  const document = { id: 'id/com espaço', originalName: 'relatorio.txt' };
  const link = { click: t.mock.fn() };
  t.mock.method(globalThis, 'fetch', async (url) => {
    assert.equal(url, '/api/documents/id%2Fcom%20espa%C3%A7o/download');
    return new Response('conteudo');
  });
  const createObjectURL = t.mock.method(URL, 'createObjectURL', (blob) => {
    assert.equal(blob.size, 8);
    return 'blob:documento';
  });
  const revokeObjectURL = t.mock.method(URL, 'revokeObjectURL', () => {});
  const originalWindow = Object.getOwnPropertyDescriptor(globalThis, 'window');
  t.after(() => {
    if (originalWindow) {
      Object.defineProperty(globalThis, 'window', originalWindow);
    } else {
      delete globalThis.window;
    }
  });
  globalThis.window = {
    document: {
      createElement(tag) {
        assert.equal(tag, 'a');
        return link;
      },
    },
    setTimeout(callback, delay) {
      assert.equal(delay, 1000);
      callback();
    },
  };

  await downloadDocument(document);

  assert.equal(createObjectURL.mock.callCount(), 1);
  assert.equal(link.href, 'blob:documento');
  assert.equal(link.download, document.originalName);
  assert.equal(link.click.mock.callCount(), 1);
  assert.deepEqual(revokeObjectURL.mock.calls[0].arguments, ['blob:documento']);
});

test('não inicia download quando o backend retorna erro', async (t) => {
  t.mock.method(globalThis, 'fetch', async () => Response.json({
    error: { message: 'Documento não encontrado.' },
  }, { status: 404 }));
  const createObjectURL = t.mock.method(URL, 'createObjectURL', () => {});

  await assert.rejects(downloadDocument({ id: 'inexistente', originalName: 'arquivo.txt' }), {
    message: 'Documento não encontrado.',
  });
  assert.equal(createObjectURL.mock.callCount(), 0);
});
