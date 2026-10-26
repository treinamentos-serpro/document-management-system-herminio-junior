const express = require('express');
const multer = require('multer');
const documentsRouter = require('./routes/documents.routes');

const app = express();
const PORT = process.env.PORT || 3000;

app.use(express.json());

// Endpoint de verificação de saúde. As demais rotas (/upload, /documents,
// /documents/:id/download) serão implementadas durante o Passo 2.
app.get('/health', (req, res) => {
  res.json({ status: 'ok' });
});
app.use('/', documentsRouter);

app.use((req, res) => {
  res.status(404).json({
    error: { code: 'NOT_FOUND', message: 'Recurso não encontrado.' },
  });
});

app.use((error, req, res, next) => {
  if (res.headersSent) {
    return next(error);
  }

  const isMulterError = error instanceof multer.MulterError;
  const statusCode = isMulterError
    ? error.code === 'LIMIT_FILE_SIZE' ? 413 : 400
    : error.statusCode || 500;
  const code = isMulterError
    ? error.code === 'LIMIT_FILE_SIZE' ? 'FILE_TOO_LARGE' : 'INVALID_UPLOAD'
    : error.code || 'INTERNAL_ERROR';
  const message = statusCode >= 500
    ? 'Não foi possível processar a solicitação.'
    : isMulterError && error.code === 'LIMIT_FILE_SIZE'
      ? 'O arquivo excede o tamanho máximo permitido.'
      : isMulterError
        ? 'O upload é inválido.'
        : error.message;

  return res.status(statusCode).json({ error: { code, message } });
});

if (require.main === module) {
  app.listen(PORT, () => {
    console.log(`DMS backend ouvindo na porta ${PORT}`);
  });
}

module.exports = app;
