// src/routes/me.routes.js
// Todas as rotas aqui exigem login (middleware `auth` é aplicado
// uma vez em server.js para o prefixo /api/me).
const { Router } = require("express");
const db = require("../db");

const router = Router();

// GET /api/me/favoritos
router.get("/favoritos", (req, res) => {
  const favoritos = db
    .prepare(
      `SELECT a.* FROM favoritos f
       JOIN animes a ON a.id = f.anime_id
       WHERE f.user_id = ? ORDER BY f.criado_em DESC`
    )
    .all(req.userId);
  res.json(favoritos);
});

// POST /api/me/favoritos/:animeId
router.post("/favoritos/:animeId", (req, res) => {
  const anime = db.prepare("SELECT id FROM animes WHERE id = ?").get(req.params.animeId);
  if (!anime) return res.status(404).json({ erro: "Anime não encontrado" });

  db.prepare("INSERT OR IGNORE INTO favoritos (user_id, anime_id) VALUES (?, ?)").run(
    req.userId,
    req.params.animeId
  );
  res.status(201).json({ ok: true });
});

// DELETE /api/me/favoritos/:animeId
router.delete("/favoritos/:animeId", (req, res) => {
  db.prepare("DELETE FROM favoritos WHERE user_id = ? AND anime_id = ?").run(
    req.userId,
    req.params.animeId
  );
  res.json({ ok: true });
});

// GET /api/me/historico
router.get("/historico", (req, res) => {
  const historico = db
    .prepare(
      `SELECT h.progresso_segundos, h.atualizado_em, e.id AS episodio_id, e.numero, e.titulo,
              t.anime_id, a.titulo AS anime_titulo
       FROM historico h
       JOIN episodios e ON e.id = h.episodio_id
       JOIN temporadas t ON t.id = e.temporada_id
       JOIN animes a ON a.id = t.anime_id
       WHERE h.user_id = ?
       ORDER BY h.atualizado_em DESC`
    )
    .all(req.userId);
  res.json(historico);
});

// POST /api/me/historico  { episodioId, progressoSegundos }
router.post("/historico", (req, res) => {
  const { episodioId, progressoSegundos } = req.body;
  const episodio = db.prepare("SELECT id FROM episodios WHERE id = ?").get(episodioId);
  if (!episodio) return res.status(404).json({ erro: "Episódio não encontrado" });

  db.prepare(
    `INSERT INTO historico (user_id, episodio_id, progresso_segundos, atualizado_em)
     VALUES (?, ?, ?, datetime('now'))
     ON CONFLICT(user_id, episodio_id)
     DO UPDATE SET progresso_segundos = excluded.progresso_segundos, atualizado_em = excluded.atualizado_em`
  ).run(req.userId, episodioId, progressoSegundos || 0);

  res.status(201).json({ ok: true });
});

// DELETE /api/me/historico  -> limpa todo o histórico do usuário
router.delete("/historico", (req, res) => {
  db.prepare("DELETE FROM historico WHERE user_id = ?").run(req.userId);
  res.json({ ok: true });
});

// ===== Favoritos e progresso de leitura — MANGÁS (mesmo padrão acima) =====

// GET /api/me/favoritos-mangas
router.get("/favoritos-mangas", (req, res) => {
  const favoritos = db
    .prepare(
      `SELECT m.* FROM favoritos_mangas f
       JOIN mangas m ON m.id = f.manga_id
       WHERE f.user_id = ? ORDER BY f.criado_em DESC`
    )
    .all(req.userId);
  res.json(favoritos);
});

// POST /api/me/favoritos-mangas/:mangaId
router.post("/favoritos-mangas/:mangaId", (req, res) => {
  const manga = db.prepare("SELECT id FROM mangas WHERE id = ?").get(req.params.mangaId);
  if (!manga) return res.status(404).json({ erro: "Mangá não encontrado" });

  db.prepare("INSERT OR IGNORE INTO favoritos_mangas (user_id, manga_id) VALUES (?, ?)").run(
    req.userId,
    req.params.mangaId
  );
  res.status(201).json({ ok: true });
});

// DELETE /api/me/favoritos-mangas/:mangaId
router.delete("/favoritos-mangas/:mangaId", (req, res) => {
  db.prepare("DELETE FROM favoritos_mangas WHERE user_id = ? AND manga_id = ?").run(
    req.userId,
    req.params.mangaId
  );
  res.json({ ok: true });
});

// GET /api/me/leitura -> histórico de leitura de mangás
router.get("/leitura", (req, res) => {
  const leitura = db
    .prepare(
      `SELECT l.pagina_atual, l.atualizado_em, c.id AS capitulo_id, c.numero, c.titulo, c.paginas,
              m.id AS manga_id, m.titulo AS manga_titulo
       FROM leitura l
       JOIN capitulos c ON c.id = l.capitulo_id
       JOIN mangas m ON m.id = c.manga_id
       WHERE l.user_id = ?
       ORDER BY l.atualizado_em DESC`
    )
    .all(req.userId);
  res.json(leitura);
});

// POST /api/me/leitura  { capituloId, paginaAtual }
router.post("/leitura", (req, res) => {
  const { capituloId, paginaAtual } = req.body;
  const capitulo = db.prepare("SELECT id FROM capitulos WHERE id = ?").get(capituloId);
  if (!capitulo) return res.status(404).json({ erro: "Capítulo não encontrado" });

  db.prepare(
    `INSERT INTO leitura (user_id, capitulo_id, pagina_atual, atualizado_em)
     VALUES (?, ?, ?, datetime('now'))
     ON CONFLICT(user_id, capitulo_id)
     DO UPDATE SET pagina_atual = excluded.pagina_atual, atualizado_em = excluded.atualizado_em`
  ).run(req.userId, capituloId, paginaAtual || 1);

  res.status(201).json({ ok: true });
});

module.exports = router;
