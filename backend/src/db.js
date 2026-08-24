// src/db.js
// Camada BANCO: uma única conexão SQLite (arquivo local, zero servidor
// externo para configurar) + criação do schema se ainda não existir.
// Trocar por Postgres/MySQL no futuro muda só este arquivo — as rotas
// continuam iguais, pois só chamam métodos do "db".

const Database = require("better-sqlite3");
require("dotenv").config();

const db = new Database(process.env.DB_PATH || "./animeflix.db");
db.pragma("journal_mode = WAL");
db.pragma("foreign_keys = ON");

db.exec(`
  CREATE TABLE IF NOT EXISTS users (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    nome TEXT NOT NULL,
    email TEXT NOT NULL UNIQUE,
    usuario TEXT UNIQUE,        -- login alternativo (opcional); a maioria dos usuários entra só com email
    senha_hash TEXT NOT NULL,
    eh_dono INTEGER DEFAULT 0,  -- 1 só para a conta do dono do app (mostra o emblema 👑)
    criado_em TEXT NOT NULL DEFAULT (datetime('now'))
  );

  CREATE TABLE IF NOT EXISTS generos (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    nome TEXT NOT NULL UNIQUE
  );

  CREATE TABLE IF NOT EXISTS animes (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    titulo TEXT NOT NULL,
    sinopse TEXT,
    ano INTEGER,
    status TEXT,               -- 'Em exibição' | 'Completo' | 'Filme'
    tipo TEXT NOT NULL,        -- 'tv' | 'movie' | 'ova' | 'ona' | 'special' (ou 'serie'/'filme' no catálogo de demonstração)
    avaliacao REAL DEFAULT 0,
    cor_a TEXT DEFAULT '#ff4d6d',
    cor_b TEXT DEFAULT '#7c5cff',
    capa_url TEXT,              -- capa oficial (vem pronta da API de importação); NULL no catálogo fictício
    origem TEXT DEFAULT 'mock'  -- 'mock' (catálogo fictício de demonstração) | 'jikan' (importado, título real)
  );

  CREATE TABLE IF NOT EXISTS anime_generos (
    anime_id INTEGER NOT NULL REFERENCES animes(id) ON DELETE CASCADE,
    genero_id INTEGER NOT NULL REFERENCES generos(id) ON DELETE CASCADE,
    PRIMARY KEY (anime_id, genero_id)
  );

  CREATE TABLE IF NOT EXISTS temporadas (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    anime_id INTEGER NOT NULL REFERENCES animes(id) ON DELETE CASCADE,
    numero INTEGER NOT NULL,
    titulo TEXT NOT NULL
  );

  CREATE TABLE IF NOT EXISTS episodios (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    temporada_id INTEGER NOT NULL REFERENCES temporadas(id) ON DELETE CASCADE,
    numero INTEGER NOT NULL,
    titulo TEXT NOT NULL,
    duracao TEXT,
    video_url TEXT NOT NULL,    -- sempre uma fonte autorizada/licenciada
    thumb_url TEXT
  );

  CREATE TABLE IF NOT EXISTS favoritos (
    user_id INTEGER NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    anime_id INTEGER NOT NULL REFERENCES animes(id) ON DELETE CASCADE,
    criado_em TEXT NOT NULL DEFAULT (datetime('now')),
    PRIMARY KEY (user_id, anime_id)
  );

  CREATE TABLE IF NOT EXISTS historico (
    user_id INTEGER NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    episodio_id INTEGER NOT NULL REFERENCES episodios(id) ON DELETE CASCADE,
    progresso_segundos INTEGER DEFAULT 0,
    atualizado_em TEXT NOT NULL DEFAULT (datetime('now')),
    PRIMARY KEY (user_id, episodio_id)
  );

  -- ===== MANGÁS (mesmo padrão de animes/temporadas/episódios) =====

  CREATE TABLE IF NOT EXISTS mangas (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    titulo TEXT NOT NULL,
    sinopse TEXT,
    ano INTEGER,
    status TEXT,               -- 'Em publicação' | 'Completo'
    tipo TEXT DEFAULT 'manga', -- 'manga' | 'novel' | 'manhwa' | 'manhua' | 'oneshot' | 'doujin'
    avaliacao REAL DEFAULT 0,
    cor_a TEXT DEFAULT '#ff4d6d',
    cor_b TEXT DEFAULT '#7c5cff',
    capa_url TEXT,              -- capa oficial (vem pronta da API de importação); NULL no catálogo fictício
    origem TEXT DEFAULT 'mock'  -- 'mock' (catálogo fictício de demonstração) | 'jikan' (importado, título real)
  );

  CREATE TABLE IF NOT EXISTS manga_generos (
    manga_id INTEGER NOT NULL REFERENCES mangas(id) ON DELETE CASCADE,
    genero_id INTEGER NOT NULL REFERENCES generos(id) ON DELETE CASCADE,
    PRIMARY KEY (manga_id, genero_id)
  );

  CREATE TABLE IF NOT EXISTS capitulos (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    manga_id INTEGER NOT NULL REFERENCES mangas(id) ON DELETE CASCADE,
    numero INTEGER NOT NULL,
    titulo TEXT NOT NULL,
    paginas INTEGER NOT NULL DEFAULT 1   -- nº de páginas do capítulo
  );

  CREATE TABLE IF NOT EXISTS favoritos_mangas (
    user_id INTEGER NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    manga_id INTEGER NOT NULL REFERENCES mangas(id) ON DELETE CASCADE,
    criado_em TEXT NOT NULL DEFAULT (datetime('now')),
    PRIMARY KEY (user_id, manga_id)
  );

  CREATE TABLE IF NOT EXISTS leitura (
    user_id INTEGER NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    capitulo_id INTEGER NOT NULL REFERENCES capitulos(id) ON DELETE CASCADE,
    pagina_atual INTEGER DEFAULT 1,
    atualizado_em TEXT NOT NULL DEFAULT (datetime('now')),
    PRIMARY KEY (user_id, capitulo_id)
  );
`);

// migração leve: adiciona colunas novas em bancos criados antes delas
// existirem (quem já rodou `npm run seed` numa versão anterior não
// precisa apagar o banco).
function adicionarColunaSeNaoExiste(tabela, coluna, definicao) {
  const colunas = db.prepare(`PRAGMA table_info(${tabela})`).all().map((c) => c.name);
  if (!colunas.includes(coluna)) db.exec(`ALTER TABLE ${tabela} ADD COLUMN ${coluna} ${definicao}`);
}
adicionarColunaSeNaoExiste("animes", "origem", "TEXT DEFAULT 'mock'");
adicionarColunaSeNaoExiste("animes", "capa_url", "TEXT");
adicionarColunaSeNaoExiste("mangas", "origem", "TEXT DEFAULT 'mock'");
adicionarColunaSeNaoExiste("mangas", "tipo", "TEXT DEFAULT 'manga'");
adicionarColunaSeNaoExiste("mangas", "capa_url", "TEXT");
adicionarColunaSeNaoExiste("users", "usuario", "TEXT");
adicionarColunaSeNaoExiste("users", "eh_dono", "INTEGER DEFAULT 0");

module.exports = db;
