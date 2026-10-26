# Document Management System com GitHub Copilot

<img src="https://octodex.github.com/images/Professortocat_v2.png" align="right" height="200px" />

Hey herminiojunior!

Mona here. I'm done preparing your exercise. Hope you enjoy! 💚

Remember, it's self-paced so feel free to take a break! ☕️

[![](https://img.shields.io/badge/Go%20to%20Exercise-%E2%86%92-1f883d?style=for-the-badge&logo=github&labelColor=197935)](https://github.com/treinamentos-serpro/document-management-system-herminio-junior/issues/1)

---

## Executar a aplicação

Requer Node.js 24 ou superior. Em terminais separados:

```sh
cd backend
npm install
npm start
```

```sh
cd frontend
npm install
npm run dev
```

Acesse `http://localhost:5173` para enviar, listar e baixar documentos. A lista é
atualizada após cada upload; estados de carregamento e erros são exibidos na
interface.

O cliente em `frontend/src/services/documentsApi.js` usa `fetch` com o prefixo
`/api`. No desenvolvimento, o proxy do Vite encaminha as chamadas para
`http://localhost:3000`, removendo esse prefixo. Em produção, configure o servidor
web para encaminhar `/api` ao backend da mesma forma.

Os arquivos ficam no filesystem do servidor, em `backend/storage`; os metadados
ficam em memória e são perdidos ao reiniciar o backend. A interface usa o
proprietário padrão configurado no backend.

Para validar o frontend:

```sh
cd frontend
npm test
npm run build
```

&copy; 2025 GitHub &bull; [Code of Conduct](https://www.contributor-covenant.org/version/2/1/code_of_conduct/code_of_conduct.md) &bull; [MIT License](https://gh.io/mit)
