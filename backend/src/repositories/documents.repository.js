const documents = new Map();

function save(document) {
  documents.set(document.id, document);
}

function findAllByOwner(owner) {
  return [...documents.values()].filter((document) => document.owner === owner);
}

function findById(id) {
  return documents.get(id) || null;
}

module.exports = { save, findAllByOwner, findById };