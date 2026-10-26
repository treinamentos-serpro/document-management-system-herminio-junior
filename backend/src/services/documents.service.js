const { randomUUID } = require('node:crypto');
const documentsRepository = require('../repositories/documents.repository');

const DEFAULT_OWNER = process.env.DEFAULT_OWNER || 'local-user';
const MAX_OWNER_LENGTH = 128;

function resolveOwner(ownerHeader) {
  const owner = typeof ownerHeader === 'string' ? ownerHeader.trim() : '';
  const resolvedOwner = owner || DEFAULT_OWNER;

  if (resolvedOwner.length > MAX_OWNER_LENGTH) {
    const error = new Error(`O identificador do usuário deve ter até ${MAX_OWNER_LENGTH} caracteres.`);
    error.statusCode = 400;
    error.code = 'INVALID_OWNER';
    throw error;
  }

  return resolvedOwner;
}

function toPublicDocument(document) {
  return {
    id: document.id,
    originalName: document.originalName,
    size: document.size,
    uploadedAt: document.uploadedAt,
    owner: document.owner,
  };
}

function createDocument(file, owner) {
  const originalName = file.originalname.replace(/\\/g, '/').split('/').pop() || 'document';
  const document = {
    id: randomUUID(),
    originalName,
    size: file.size,
    uploadedAt: new Date().toISOString(),
    owner,
    storageName: file.filename,
    filePath: file.path,
  };

  documentsRepository.save(document);
  return toPublicDocument(document);
}

function listDocuments(owner) {
  return documentsRepository.findAllByOwner(owner).map(toPublicDocument);
}

function findDocumentForDownload(id, owner) {
  const document = documentsRepository.findById(id);
  return document && document.owner === owner ? document : null;
}

module.exports = {
  resolveOwner,
  createDocument,
  listDocuments,
  findDocumentForDownload,
};