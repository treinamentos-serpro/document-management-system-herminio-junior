const documentsService = require('../services/documents.service');

function setOwner(req, res, next) {
  try {
    req.owner = documentsService.resolveOwner(req.get('X-User-Id'));
    return next();
  } catch (error) {
    return next(error);
  }
}

function upload(req, res, next) {
  try {
    if (!req.file) {
      return res.status(400).json({
        error: { code: 'FILE_REQUIRED', message: 'Envie um arquivo no campo "file".' },
      });
    }

    const document = documentsService.createDocument(req.file, req.owner);
    return res.status(201).json({ document });
  } catch (error) {
    return next(error);
  }
}

function list(req, res, next) {
  try {
    return res.json({ documents: documentsService.listDocuments(req.owner) });
  } catch (error) {
    return next(error);
  }
}

function download(req, res, next) {
  let document;
  try {
    document = documentsService.findDocumentForDownload(req.params.id, req.owner);
  } catch (error) {
    return next(error);
  }

  if (!document) {
    return res.status(404).json({
      error: { code: 'DOCUMENT_NOT_FOUND', message: 'Documento não encontrado.' },
    });
  }

  return res.download(document.filePath, document.originalName, (error) => {
    if (error && !res.headersSent) {
      if (error.code === 'ENOENT') {
        error.statusCode = 404;
        error.code = 'DOCUMENT_FILE_NOT_FOUND';
      }
      next(error);
    }
  });
}

module.exports = { setOwner, upload, list, download };