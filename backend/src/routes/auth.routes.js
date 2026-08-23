// src/routes/auth.routes.js
const { Router } = require("express");
const bcrypt = require("bcryptjs");
const jwt = require("jsonwebtoken");
const db = require("../db");
const auth = require("../middleware/auth");

const router = Router();

function gerarToken(userId) {
  return jwt.sign({ sub: userId }, process.env.JWT_SECRET, { expiresIn: "30d" });
}

// POST /api/auth/register
router.post("/register", (req, res) => {
  const { nome, email, senha } = req.body;

  if (!nome || !email || !senha) {
    return res.status(400).json({ erro: "Preencha nome, email e senha" });
  }
  if (senha.length < 6) {
    return res.status(400).json({ erro: "A senha precisa ter ao menos 6 caracteres" });
  }

  const existente = db.prepare("SELECT id FROM users WHERE email = ?").get(email.toLowerCase());
  if (existente) {
    return res.status(409).json({ erro: "Este email já está cadastrado" });
  }

  const senha_hash = bcrypt.hashSync(senha, 10);
  const info = db
    .prepare("INSERT INTO users (nome, email, senha_hash) VALUES (?, ?, ?)")
    .run(nome, email.toLowerCase(), senha_hash);

  const token = gerarToken(info.lastInsertRowid);
  res.status(201).json({
    token,
    usuario: { id: info.lastInsertRowid, nome, email: email.toLowerCase() },
  });
});

// POST /api/auth/login
router.post("/login", (req, res) => {
  const { email, senha } = req.body;
  if (!email || !senha) {
    return res.status(400).json({ erro: "Preencha email e senha" });
  }

  const usuario = db.prepare("SELECT * FROM users WHERE email = ?").get(email.toLowerCase());
  if (!usuario || !bcrypt.compareSync(senha, usuario.senha_hash)) {
    return res.status(401).json({ erro: "Email ou senha inválidos" });
  }

  const token = gerarToken(usuario.id);
  res.json({
    token,
    usuario: { id: usuario.id, nome: usuario.nome, email: usuario.email },
  });
});

// GET /api/auth/me
router.get("/me", auth, (req, res) => {
  const usuario = db
    .prepare("SELECT id, nome, email, criado_em FROM users WHERE id = ?")
    .get(req.userId);
  if (!usuario) return res.status(404).json({ erro: "Usuário não encontrado" });
  res.json(usuario);
});

module.exports = router;
