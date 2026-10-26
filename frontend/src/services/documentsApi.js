async function ensureSuccess(response) {
  if (response.ok) return response;

  let message = 'Não foi possível concluir a solicitação.';
  try {
    const payload = await response.json();
    message = payload.error?.message || message;
  } catch {
    // Mantém a mensagem padrão quando a resposta não contém JSON.
  }

  throw new Error(message);
}

export async function listDocuments() {
  const response = await ensureSuccess(await fetch('/api/documents'));
  const payload = await response.json();
  return payload.documents;
}

export async function uploadDocument(file) {
  const formData = new FormData();
  formData.append('file', file);

  const response = await ensureSuccess(await fetch('/api/upload', {
    method: 'POST',
    body: formData,
  }));
  const payload = await response.json();
  return payload.document;
}

export async function downloadDocument(document) {
  const response = await ensureSuccess(await fetch(
    `/api/documents/${encodeURIComponent(document.id)}/download`,
  ));
  const objectUrl = URL.createObjectURL(await response.blob());
  const link = window.document.createElement('a');
  link.href = objectUrl;
  link.download = document.originalName;
  link.click();
  window.setTimeout(() => URL.revokeObjectURL(objectUrl), 1000);
}