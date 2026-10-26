import { useEffect, useState } from 'react';
import DocumentList from './components/DocumentList.jsx';
import UploadComponent from './components/UploadComponent.jsx';
import { listDocuments } from './services/documentsApi.js';
import './styles.css';

export default function App() {
  const [documents, setDocuments] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [loadError, setLoadError] = useState('');
  const [notice, setNotice] = useState('');
  const [refreshKey, setRefreshKey] = useState(0);

  useEffect(() => {
    let isCurrent = true;

    async function loadDocuments() {
      setIsLoading(true);
      setLoadError('');

      try {
        const result = await listDocuments();
        if (isCurrent) setDocuments(result);
      } catch (error) {
        if (isCurrent) setLoadError(error.message);
      } finally {
        if (isCurrent) setIsLoading(false);
      }
    }

    loadDocuments();
    return () => {
      isCurrent = false;
    };
  }, [refreshKey]);

  function handleUploaded(document) {
    setNotice(`${document.originalName} foi enviado.`);
    setLoadError('');
    setRefreshKey((currentKey) => currentKey + 1);
  }

  function handleError(message) {
    setNotice('');
    setLoadError(message);
  }

  return (
    <div className="app-shell">
      <header className="topbar">
        <a className="brand" href="/" aria-label="Arquivo, início">
          <span className="brand-mark" aria-hidden="true">A</span>
          <span>arquivo<span className="brand-period">.</span></span>
        </a>
        <span className="topbar-label">Biblioteca pessoal</span>
      </header>

      <main className="workspace">
        <section className="page-heading" aria-labelledby="page-title">
          <div>
            <p className="eyebrow">DOCUMENTOS</p>
            <h1 id="page-title">Sua biblioteca</h1>
          </div>
          <div className="document-count" aria-live="polite">
            <span className="count-value">{documents.length}</span>
            <span>{documents.length === 1 ? 'arquivo' : 'arquivos'}</span>
          </div>
        </section>

        <UploadComponent onUploaded={handleUploaded} onError={handleError} />

        {notice && <p className="notice" role="status">{notice}</p>}
        {loadError && <p className="error-banner" role="alert">{loadError}</p>}

        <section className="documents-section" aria-labelledby="documents-title">
          <div className="section-heading">
            <div>
              <p className="eyebrow">ACERVO</p>
              <h2 id="documents-title">Documentos recentes</h2>
            </div>
            <span className="section-rule" aria-hidden="true" />
          </div>
          <DocumentList
            documents={documents}
            isLoading={isLoading}
            onDownloadError={handleError}
          />
        </section>
      </main>
      <footer className="footer">Armazenamento local · seus arquivos ficam no servidor da aplicação</footer>
    </div>
  );
}
