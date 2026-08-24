# AnimeFlix — APK via GitHub Actions

O workflow em `.github/workflows/build-apk.yml`:
1. instala o backend;
2. executa `npm run seed` para garantir a conta de dono no banco criado durante o build;
3. instala o frontend;
4. gera o build web;
5. cria o projeto Android com Capacitor;
6. compila `app-debug.apk`;
7. publica o APK como artefato do GitHub Actions.

A conta de dono já é garantida pelo `backend/src/seed.js` existente.

Importante: o `npm run seed` executado pelo GitHub roda no banco temporário do runner.
Para ativar a conta no banco do servidor que realmente atende o aplicativo, é necessário
executar `npm run seed` dentro da pasta `backend` desse servidor uma vez.

O frontend aceita `VITE_API_BASE_URL` para apontar para a API publicada. Sem essa variável,
ele continua usando `http://localhost:3333/api`.
