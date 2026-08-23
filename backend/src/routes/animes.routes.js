// src/routes/animes.routes.js — API dedicada de Animes (público)
const { Router } = require("express");
const db = require("../db");

const router = Router();

function generosDoAnime(animeId) {
  return db
    .prepare(
      `SELECT g.nome FROM generos g
       JOIN anime_generos ag ON ag.genero_id = g.id
       WHERE ag.anime_id = ?`
    )
    .all(animeId)
    .map((r) => r.nome);
}

function montarAnimeResumido(row) {
  return { ...row, generos: generosDoAnime(row.id) };
}

// GET /api/animes?genero=Ação&tipo=movie&busca=ronin&pagina=1&porPagina=20
router.get("/", (req, res) => {
  const { genero, busca, tipo } = req.query;
  const pagina = Math.max(1, parseInt(req.query.pagina) || 1);
  const porPagina = Math.min(300, parseInt(req.query.porPagina) || 20);

  let sql = `SELECT DISTINCT a.* FROM animes a`;
  const where = [];
  const params = [];

  if (genero) {
    sql += ` JOIN anime_generos ag ON ag.anime_id = a.id JOIN generos g ON g.id = ag.genero_id`;
    where.push("g.nome = ?");
    params.push(genero);
  }
  if (tipo) {
    where.push("a.tipo = ?");
    params.push(tipo);
  }
  if (busca) {
    where.push("a.titulo LIKE ?");
    params.push(`%${busca}%`);
  }
  if (where.length) sql += " WHERE " + where.join(" AND ");
  sql += " ORDER BY a.id LIMIT ? OFFSET ?";
  params.push(porPagina, (pagina - 1) * porPagina);

  const animes = db.prepare(sql).all(...params).map(montarAnimeResumido);
  res.json({ pagina, porPagina, resultados: animes });
});

// GET /api/animes/tipos -> tipos disponíveis no catálogo (tv, movie, ova...)
router.get("/tipos", (req, res) => {
  res.json(db.prepare("SELECT DISTINCT tipo FROM animes ORDER BY tipo").all().map((r) => r.tipo));
});

// GET /api/animes/destaques  -> dados prontos para a tela Inicial
router.get("/destaques", (req, res) => {
  const emAlta = db.prepare("SELECT * FROM animes ORDER BY avaliacao DESC LIMIT 8").all().map(montarAnimeResumido);
  const lancamentos = db.prepare("SELECT * FROM animes ORDER BY ano DESC LIMIT 8").all().map(montarAnimeResumido);
  const destaque = emAlta[0] || null;
  res.json({ destaque, emAlta, lancamentos });
});

// GET /api/animes/:id  -> detalhes + temporadas + episódios
router.get("/:id", (req, res) => {
  const anime = db.prepare("SELECT * FROM animes WHERE id = ?").get(req.params.id);
  if (!anime) return res.status(404).json({ erro: "Anime não encontrado" });

  const temporadas = db
    .prepare("SELECT * FROM temporadas WHERE anime_id = ? ORDER BY numero")
    .all(anime.id)
    .map((temp) => ({
      ...temp,
      episodios: db
        .prepare("SELECT id, numero, titulo, duracao, video_url, thumb_url FROM episodios WHERE temporada_id = ? ORDER BY numero")
        .all(temp.id),
    }));

  res.json({ ...montarAnimeResumido(anime), temporadas });
});

module.exports = router;
