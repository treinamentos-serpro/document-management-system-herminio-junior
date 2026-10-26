# Especificação - Document Management System

## 1. Objetivo

Disponibilizar uma aplicação web para enviar, listar e baixar documentos armazenados localmente, associando cada documento a um identificador de usuário.

## 2. Escopo

### Dentro do escopo

- Upload de um documento por requisição.
- Listagem dos documentos associados ao usuário da requisição.
- Download de um documento pelo identificador, quando associado ao usuário.
- Metadados mantidos em memória.
- Arquivos armazenados no filesystem local.

### Fora do escopo

- Armazenamento em nuvem ou provedores externos.
- Versionamento, edição e exclusão de documentos.
- Cadastro, autenticação ou gestão de credenciais de usuários.
- Persistência durável dos metadados.

## 3. Requisitos funcionais

| ID | Requisito |
| --- | --- |
| RF-01 | O sistema aceita um arquivo no campo `file` de uma requisição `multipart/form-data`. |
| RF-02 | O sistema grava o arquivo localmente usando `multer` com `diskStorage`, em `backend/storage` por padrão. |
| RF-03 | O sistema gera um identificador único e um nome interno de armazenamento, sem usar o nome original como caminho. |
| RF-04 | O sistema registra em memória os metadados após um upload bem-sucedido. |
| RF-05 | O sistema lista somente os documentos associados ao usuário da requisição. |
| RF-06 | O sistema permite baixar um documento existente que pertença ao usuário da requisição. |
| RF-07 | O sistema rejeita upload sem arquivo e arquivos acima do limite configurado. |
| RF-08 | O sistema retorna erros consistentes para entrada inválida, documento indisponível e falha interna. |

## 4. Requisitos não funcionais

| ID | Requisito |
| --- | --- |
| RNF-01 | Os arquivos são armazenados exclusivamente no filesystem local, via `multer` e `diskStorage`. |
| RNF-02 | Os metadados permanecem em memória e são perdidos quando o processo é reiniciado. |
| RNF-03 | A configuração é feita por variáveis de ambiente com valores padrão documentados. |
| RNF-04 | O nome interno é gerado pelo servidor e não permite traversal de diretórios. |
| RNF-05 | O nome original serve para exibição e download, nunca para localizar o arquivo. |
| RNF-06 | O backend usa Node.js, Express CommonJS e testes com `node:test`. |
| RNF-07 | O frontend consome a API por `fetch` e pelo prefixo `/api`, usando o proxy existente do Vite. |
| RNF-08 | O identificador de usuário não é autenticação; a aplicação não deve ser exposta como sistema multiusuário seguro sem autenticação real. |

## 5. Modelo de dados

Metadados mantidos em memória:

| Campo | Tipo | Descrição |
| --- | --- | --- |
| `id` | string | Identificador único gerado pelo servidor. |
| `originalName` | string | Nome original normalizado do arquivo enviado. |
| `size` | number | Tamanho em bytes. |
| `uploadedAt` | string | Data e hora em ISO 8601 UTC. |
| `owner` | string | Identificador do usuário associado ao documento. |
| `storageName` | string | Nome interno gerado pelo servidor; campo privado, não retornado pela API. |
| `filePath` | string | Caminho local usado internamente para o download; campo privado. |

## 6. Contratos de API

Durante o desenvolvimento, o frontend usa o prefixo `/api`; o proxy Vite remove esse prefixo ao encaminhar a chamada ao backend. O cabeçalho opcional `X-User-Id` identifica o escopo do usuário. Na ausência do cabeçalho, é usado `DEFAULT_OWNER` (padrão `local-user`). Esse identificador não autentica o usuário.

### `POST /upload`

- Entrada: `multipart/form-data` com campo obrigatório `file`; cabeçalho opcional `X-User-Id`.
- Sucesso: `201 Created`, corpo `{ "document": { "id", "originalName", "size", "uploadedAt", "owner" } }`.
- Erros: `400` para arquivo ausente ou upload inválido; `413` para arquivo acima do limite; `500` para falha inesperada.

### `GET /documents`

- Entrada: cabeçalho opcional `X-User-Id`.
- Sucesso: `200 OK`, corpo `{ "documents": [ { "id", "originalName", "size", "uploadedAt", "owner" } ] }`.
- A lista contém somente documentos do usuário resolvido para a requisição; sem resultados, retorna lista vazia.

### `GET /documents/:id/download`

- Entrada: identificador na rota e cabeçalho opcional `X-User-Id`.
- Sucesso: `200 OK`, conteúdo binário com `Content-Disposition: attachment` usando o nome original.
- Erros: `404` se o documento não existir, não pertencer ao usuário ou o arquivo local estiver indisponível; `500` para falha inesperada.

### Erros e saúde

- Erros JSON seguem `{ "error": { "code": "CODIGO", "message": "Descrição" } }`, sem expor caminhos locais ou detalhes internos.
- `GET /health` permanece disponível e retorna `200 OK` com `{ "status": "ok" }`.

## 7. Decisões arquiteturais

- Backend organizado em `routes/`, `controllers/`, `services/` e `repositories/`, com fluxo `routes -> controllers -> services -> repositories`.
- Rotas conectam middleware e controllers; controllers validam a entrada HTTP e formatam respostas; services concentram regras de negócio; repositories mantêm os metadados e referências aos arquivos locais.
- `multer` com `diskStorage` grava os arquivos em `STORAGE_DIR` (padrão `backend/storage`). O nome interno é gerado pelo servidor.
- Variáveis de ambiente: `PORT` (padrão `3000`), `STORAGE_DIR`, `MAX_FILE_SIZE` (padrão `10485760`, 10 MiB) e `DEFAULT_OWNER` (padrão `local-user`).
- A identidade por cabeçalho é apenas um mecanismo de escopo para esta fase, não substitui autenticação.
- Reiniciar o processo limpa os metadados em memória e pode deixar arquivos sem registro no disco; recuperação e limpeza automática estão fora do escopo.

## 8. Plano de execução

1. **Especificação:** salvar este documento em `docs/specs/dms-spec.md`. Critério de aceite: requisitos, dados, contratos, decisões e etapas estão documentados antes da implementação.
2. **Backend:** implementar rotas, controllers, services e repository em `backend/src`, mantendo upload local via Multer. Critério de aceite: upload, listagem e download seguem os contratos e respeitam o proprietário.
3. **Testes do backend:** ampliar `backend/test/app.test.js` para cobrir sucesso, entradas inválidas, limites, isolamento por usuário e download. Critério de aceite: `npm test` passa e arquivos de teste ficam isolados em diretório temporário.
4. **Frontend:** criar componentes de upload, lista e download e o cliente API em `frontend/src/components/` e `frontend/src/services/`; integrar a aplicação React. Critério de aceite: o fluxo completo funciona via `/api`, incluindo estados de carregamento, vazio e erro.
5. **Validação integrada:** executar frontend e backend e verificar o fluxo no navegador. Critério de aceite: arquivo enviado aparece na lista do usuário e pode ser baixado, permanecendo no armazenamento local.