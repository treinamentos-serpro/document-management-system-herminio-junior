import { useState } from 'react';
import { uploadDocument } from '../services/documentsApi.js';

export default function UploadComponent({ onUploaded, onError }) {
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [selectedFileName, setSelectedFileName] = useState('');

  async function handleSubmit(event) {
    event.preventDefault();
    const form = event.currentTarget;
    const file = new FormData(form).get('file');
    if (!(file instanceof File) || !file.name) {
      onError('Selecione um arquivo para enviar.');
      return;
    }

    setIsSubmitting(true);
    try {
      const document = await uploadDocument(file);
      form.reset();
      setSelectedFileName('');
      onUploaded(document);
    } catch (error) {
      onError(error.message);
    } finally {
      setIsSubmitting(false);
    }
  }

  return (
    <section className="upload-panel" aria-labelledby="upload-title">
      <div className="upload-copy">
        <span className="upload-symbol" aria-hidden="true">+</span>
        <div>
          <h2 id="upload-title">Adicionar documento</h2>
          <p>Escolha um arquivo para guardar na sua biblioteca.</p>
        </div>
      </div>
      <form className="upload-form" onSubmit={handleSubmit}>
        <label className="file-picker">
          <span>Selecionar arquivo</span>
          <input
            aria-label="Selecionar arquivo para upload"
            name="file"
            type="file"
            required
            disabled={isSubmitting}
            onChange={(event) => setSelectedFileName(event.target.files?.[0]?.name || '')}
          />
        </label>
        {selectedFileName && <span className="selected-file" title={selectedFileName}>{selectedFileName}</span>}
        <button className="primary-button" type="submit" disabled={isSubmitting}>
          {isSubmitting ? 'Enviando...' : 'Enviar arquivo'}
        </button>
      </form>
    </section>
  );
}