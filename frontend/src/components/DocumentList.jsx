import DownloadButton from './DownloadButton.jsx';

function formatSize(size) {
  if (size < 1024) return `${size} B`;
  if (size < 1024 * 1024) return `${(size / 1024).toFixed(1)} KB`;
  return `${(size / (1024 * 1024)).toFixed(1)} MB`;
}

export default function DocumentList({ documents, isLoading, onDownloadError }) {
  if (isLoading) {
    return <p className="list-message" role="status">Carregando documentos...</p>;
  }

  if (!documents.length) {
    return <p className="list-message">Nenhum documento enviado ainda.</p>;
  }

  return (
    <div className="table-wrap">
      <table className="document-table">
        <thead>
          <tr>
            <th scope="col">Nome</th>
            <th scope="col">Data de envio</th>
            <th scope="col">Tamanho</th>
            <th scope="col"><span className="visually-hidden">Ações</span></th>
          </tr>
        </thead>
        <tbody>
          {documents.map((document) => (
            <tr key={document.id}>
              <td>
                <span className="file-type" aria-hidden="true">DOC</span>
                <span className="file-name">{document.originalName}</span>
              </td>
              <td>{new Date(document.uploadedAt).toLocaleString('pt-BR')}</td>
              <td>{formatSize(document.size)}</td>
              <td className="action-cell">
                <DownloadButton
                  document={document}
                  onError={onDownloadError}
                />
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}