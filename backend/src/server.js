// src/server.js
require("dotenv").config();
const express = require("express");
const cors = require("cors");

const auth = require("./middleware/auth");
const authRoutes = require("./routes/auth.routes");
const animesRoutes = require("./routes/animes.routes");
const mangasRoutes = require("./routes/mangas.routes");
const generosRoutes = require("./routes/generos.routes");
const meRoutes = require("./routes/me.routes");

const app = express();
app.use(cors());
app.use(express.json());

app.get("/api/health", (req, res) => res.json({ status: "ok" }));

app.use("/api/auth", authRoutes);
app.use("/api/animes", animesRoutes);      // público (não exige login)
app.use("/api/mangas", mangasRoutes);      // público (não exige login)
app.use("/api/generos", generosRoutes);    // público — compartilhado
app.use("/api/me", auth, meRoutes);        // exige login (favoritos/histórico/leitura)

app.use((req, res) => res.status(404).json({ erro: "Rota não encontrada" }));

// tratador de erro genérico, pra nunca vazar stack trace pro cliente
app.use((err, req, res, next) => {
  console.error(err);
  res.status(500).json({ erro: "Erro interno do servidor" });
});

const PORT = process.env.PORT || 3333;
app.listen(PORT, () => console.log(`AnimeFlix API rodando em http://localhost:${PORT}`));
