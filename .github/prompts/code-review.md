---
name: revisar-alteracoes-dms
description: Revisar alterações no DMS antes de finalizá-las.
---

Revise as alterações feitas no Document Management System.

Verifique:
- se o fluxo respeita a arquitetura `routes -> controllers -> services -> repositories`;
- se mantém o armazenamento local dos arquivos em `backend/storage`;
- se trata erros e valida entradas nos limites HTTP e de arquivos;
- se os testes cobrem o comportamento alterado;
- se há regressões ou mudanças fora do escopo.

Relate apenas problemas concretos, com arquivo, linha, impacto e uma sugestão de correção. Não altere o código. Se não encontrar problemas, informe isso e mencione eventuais lacunas de teste.