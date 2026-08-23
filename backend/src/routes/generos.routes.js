// src/routes/generos.routes.js — lista de gêneros, usada por animes e mangás
const { Router } = require("express");
const db = require("../db");

const router = Router();

router.get("/", (req, res) => {
  res.json(db.prepare("SELECT nome FROM generos ORDER BY nome").all().map((r) => r.nome));
});

module.exports = router;
