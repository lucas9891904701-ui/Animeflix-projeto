# AnimeFlix

App de streaming de anime e mangá para Android — tema escuro, capas
arredondadas, navegação inferior. Arquitetura em duas partes:

```
animeflix/
├── app/
│   └── AnimeFlix.jsx      → front-end (React + Tailwind), mobile-first
└── backend/
    ├── README.md          → rotas da API e como rodar
    ├── package.json
    ├── .env.example
    └── src/
        ├── db.js           → schema SQLite (BANCO)
        ├── server.js       → junta as rotas
        ├── seed.js         → catálogo fictício de demonstração
        ├── import-jikan.js → importa um catálogo real e grande (todos os tipos, com capa)
        ├── middleware/auth.js
        └── routes/
            ├── auth.routes.js      → /api/auth/*
            ├── animes.routes.js    → /api/animes/*
            ├── mangas.routes.js    → /api/mangas/*
            ├── generos.routes.js   → /api/generos
            └── me.routes.js        → /api/me/* (favoritos, histórico, leitura)
```

## Como rodar tudo

**1. Backend**
```bash
cd backend
cp .env.example .env
npm install
npm run seed               # catálogo fictício de demonstração (rápido)
npm run import:jikan       # catálogo real e grande, todos os tipos, com capa (~10-15 min)
npm start                  # sobe em http://localhost:3333
```

**2. App**
Abra `app/AnimeFlix.jsx` no seu ambiente React (ou cole como artifact).
Ele já tenta falar com `http://localhost:3333/api` automaticamente — se o
backend não estiver rodando, cai sozinho para um catálogo de demonstração
embutido, então o app nunca quebra mesmo sem a API de pé.

Se for publicar em outro endereço, ajuste a constante `API_BASE` no topo
de `AnimeFlix.jsx`.

## O que já está pronto
- Telas: Inicial, Explorar, Mangás, Pesquisa, Detalhes, Temporadas/Episódios,
  Player, Leitor de mangá, Favoritos, Histórico, Login/Cadastro, Perfil
- Backend: autenticação (JWT, login por email ou usuário), API de Animes,
  API de Mangás, gêneros, favoritos e histórico/leitura por usuário
- Conta do dono do app pré-cadastrada (usuário `ls_dev`), com emblema 👑
  exclusivo ao lado do nome — em qualquer outra conta o emblema não aparece
- Catálogo grande e real (opcional): importador via Jikan API, cobrindo
  todos os tipos de anime (TV, Filme, OVA, ONA, Especial) e de mangá
  (Mangá, Novel, Manhwa — inclui webtoons —, Manhua, One-shot), com
  **nome completo e capa oficial** de cada título, filtráveis por tipo
  e gênero no app
- Banco: SQLite em arquivo único, sem infraestrutura externa
- Vídeos de demonstração usam apenas fontes de licença aberta
  (Blender Foundation / Google sample bucket); sinopses de títulos
  importados não são copiadas de fontes protegidas (o app mostra uma
  mensagem padrão nesse caso) — só título, ano, tipo, gênero, nota e
  capa oficial (dado factual/promocional, servido pela própria API)

## Próximos passos possíveis
- Aumentar `JIKAN_PAGINAS_POR_TIPO` para importar ainda mais títulos
  (com cuidado: o carregamento inicial do catálogo no app fica mais lento
  quanto maior o catálogo, já que ele carrega tudo de uma vez no login)
- Substituir os placeholders de página do leitor de mangá por imagens reais
  (quando houver conteúdo licenciado para isso)
- Empacotar o front-end como app Android de verdade (Capacitor ou WebView)
- Trocar SQLite por Postgres/MySQL em produção (só muda `backend/src/db.js`)
