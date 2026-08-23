// src/routes/mangas.routes.js — API dedicada de Mangás (público)
const { Router } = require("express");
const db = require("../db");

const router = Router();

function generosDoManga(mangaId) {
  return db
    .prepare(
      `SELECT g.nome FROM generos g
       JOIN manga_generos mg ON mg.genero_id = g.id
       WHERE mg.manga_id = ?`
    )
    .all(mangaId)
    .map((r) => r.nome);
}

function montarMangaResumido(row) {
  return { ...row, generos: generosDoManga(row.id) };
}

// GET /api/mangas?genero=Ação&tipo=manhwa&busca=kaen&pagina=1&porPagina=20
router.get("/", (req, res) => {
  const { genero, busca, tipo } = req.query;
  const pagina = Math.max(1, parseInt(req.query.pagina) || 1);
  const porPagina = Math.min(300, parseInt(req.query.porPagina) || 20);

  let sql = `SELECT DISTINCT m.* FROM mangas m`;
  const where = [];
  const params = [];

  if (genero) {
    sql += ` JOIN manga_generos mg ON mg.manga_id = m.id JOIN generos g ON g.id = mg.genero_id`;
    where.push("g.nome = ?");
    params.push(genero);
  }
  if (tipo) {
    where.push("m.tipo = ?");
    params.push(tipo);
  }
  if (busca) {
    where.push("m.titulo LIKE ?");
    params.push(`%${busca}%`);
  }
  if (where.length) sql += " WHERE " + where.join(" AND ");
  sql += " ORDER BY m.id LIMIT ? OFFSET ?";
  params.push(porPagina, (pagina - 1) * porPagina);

  const mangas = db.prepare(sql).all(...params).map(montarMangaResumido);
  res.json({ pagina, porPagina, resultados: mangas });
});

// GET /api/mangas/tipos -> tipos disponíveis no catálogo (manga, novel, manhwa...)
router.get("/tipos", (req, res) => {
  res.json(db.prepare("SELECT DISTINCT tipo FROM mangas ORDER BY tipo").all().map((r) => r.tipo));
});

// GET /api/mangas/destaques -> dados prontos para a aba Mangás
router.get("/destaques", (req, res) => {
  const emAlta = db.prepare("SELECT * FROM mangas ORDER BY avaliacao DESC LIMIT 8").all().map(montarMangaResumido);
  const lancamentos = db.prepare("SELECT * FROM mangas ORDER BY ano DESC LIMIT 8").all().map(montarMangaResumido);
  res.json({ destaque: emAlta[0] || null, emAlta, lancamentos });
});

// GET /api/mangas/:id -> detalhes + capítulos
router.get("/:id", (req, res) => {
  const manga = db.prepare("SELECT * FROM mangas WHERE id = ?").get(req.params.id);
  if (!manga) return res.status(404).json({ erro: "Mangá não encontrado" });

  const capitulos = db
    .prepare("SELECT id, numero, titulo, paginas FROM capitulos WHERE manga_id = ? ORDER BY numero")
    .all(manga.id);

  res.json({ ...montarMangaResumido(manga), capitulos });
});

module.exports = router;
