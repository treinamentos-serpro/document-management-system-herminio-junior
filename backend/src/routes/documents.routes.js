const crypto = require('node:crypto');
const fs = require('node:fs');
const path = require('node:path');
const express = require('express');
const multer = require('multer');
const documentsController = require('../controllers/documents.controller');

const router = express.Router();
const storageDirectory = path.resolve(
  process.env.STORAGE_DIR || path.join(__dirname, '../../storage'),
);
const configuredMaxSize = Number.parseInt(process.env.MAX_FILE_SIZE, 10);
const maxFileSize = Number.isInteger(configuredMaxSize) && configuredMaxSize > 0
  ? configuredMaxSize
  : 10 * 1024 * 1024;

fs.mkdirSync(storageDirectory, { recursive: true });

const upload = multer({
  storage: multer.diskStorage({
    destination: (req, file, callback) => callback(null, storageDirectory),
    filename: (req, file, callback) => callback(null, crypto.randomUUID()),
  }),
  limits: { fileSize: maxFileSize },
});

router.post('/upload', documentsController.setOwner, upload.single('file'), documentsController.upload);
router.get('/documents', documentsController.setOwner, documentsController.list);
router.get('/documents/:id/download', documentsController.setOwner, documentsController.download);

module.exports = router;