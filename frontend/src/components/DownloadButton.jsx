import { useState } from 'react';
import { downloadDocument } from '../services/documentsApi.js';

export default function DownloadButton({ document, onError }) {
  const [isLoading, setIsLoading] = useState(false);

  async function handleClick() {
    setIsLoading(true);
    try {
      await downloadDocument(document);
    } catch (error) {
      onError(error.message);
    } finally {
      setIsLoading(false);
    }
  }

  return (
    <button
      className="download-button"
      type="button"
      onClick={handleClick}
      disabled={isLoading}
      aria-label={`Baixar ${document.originalName}`}
    >
      {isLoading ? 'Baixando...' : 'Baixar'}
    </button>
  );
}