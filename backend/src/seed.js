// src/seed.js — roda com: npm run seed
const db = require("./db");

const VIDEO_A = "https://commondatastorage.googleapis.com/gtv-videos-bucket/sample/BigBuckBunny.mp4";
const VIDEO_B = "https://commondatastorage.googleapis.com/gtv-videos-bucket/sample/ElephantsDream.mp4";

const GENEROS = ["Ação", "Aventura", "Fantasia", "Ficção", "Drama", "Comédia", "Mistério"];

const ANIMES = [
  { titulo: "Ronin do Vento", generos: ["Ação", "Aventura"], ano: 2023, avaliacao: 4.8, status: "Em exibição", tipo: "serie", cor_a: "#ff4d6d", cor_b: "#7c5cff",
    sinopse: "Um espadachim sem clã cruza o país devastado atrás do assassino do seu mestre, enquanto uma antiga profecia começa a se cumprir ao seu redor.",
    temporadas: [{ numero: 1, titulo: "Temporada 1", episodios: 4, video: VIDEO_A }, { numero: 2, titulo: "Temporada 2", episodios: 3, video: VIDEO_B }] },
  { titulo: "Estrelas de Kaen", generos: ["Fantasia", "Drama"], ano: 2022, avaliacao: 4.6, status: "Completo", tipo: "serie", cor_a: "#7c5cff", cor_b: "#4dd9ff",
    sinopse: "Em um reino suspenso entre nuvens, uma jovem guardiã descobre que consegue falar com as estrelas — e que uma delas está prestes a cair.",
    temporadas: [{ numero: 1, titulo: "Temporada 1", episodios: 5, video: VIDEO_B }] },
  { titulo: "Protocolo Nebula", generos: ["Ficção", "Mistério"], ano: 2024, avaliacao: 4.9, status: "Em exibição", tipo: "serie", cor_a: "#4dd9ff", cor_b: "#7c5cff",
    sinopse: "Uma pilota é recrutada por uma IA renegada para investigar sinais que vêm de dentro do próprio sistema solar — sinais que ninguém deveria ouvir.",
    temporadas: [{ numero: 1, titulo: "Temporada 1", episodios: 4, video: VIDEO_A }] },
  { titulo: "Confeitaria Yohaku", generos: ["Comédia", "Drama"], ano: 2021, avaliacao: 4.3, status: "Completo", tipo: "serie", cor_a: "#ffd24d", cor_b: "#ff8a4d",
    sinopse: "Depois de perder o emprego, um ex-chef de cozinha reabre a confeitaria da avó e descobre que doces guardam mais memórias do que ele imaginava.",
    temporadas: [{ numero: 1, titulo: "Temporada 1", episodios: 3, video: VIDEO_B }] },
  { titulo: "Labirinto de Yumei", generos: ["Mistério", "Fantasia"], ano: 2023, avaliacao: 4.7, status: "Em exibição", tipo: "serie", cor_a: "#4dffb0", cor_b: "#4dd9ff",
    sinopse: "Todo aniversário, uma porta aparece na casa de Yumei. Ela nunca soube o que tem do outro lado — até a noite em que resolveu entrar.",
    temporadas: [{ numero: 1, titulo: "Temporada 1", episodios: 4, video: VIDEO_A }] },
  { titulo: "Guardiões da Maré", generos: ["Aventura", "Ação"], ano: 2020, avaliacao: 4.5, status: "Completo", tipo: "serie", cor_a: "#ff9d4d", cor_b: "#ff4d6d",
    sinopse: "Uma tripulação de jovens navegadores parte em busca da lendária Maré Eterna, o único fenômeno capaz de salvar sua ilha natal.",
    temporadas: [{ numero: 1, titulo: "Temporada 1", episodios: 4, video: VIDEO_B }] },
  { titulo: "Réquiem de Outono", generos: ["Drama", "Ficção"], ano: 2024, avaliacao: 4.9, status: "Filme", tipo: "filme", cor_a: "#ff4d9e", cor_b: "#7c5cff",
    sinopse: "Dois irmãos separados pela guerra se reencontram numa cidade que nenhum dos dois reconhece mais.",
    temporadas: [{ numero: 1, titulo: "Filme", episodios: 1, video: VIDEO_A }] },
  { titulo: "Circuito Aurora", generos: ["Ficção", "Ação"], ano: 2022, avaliacao: 4.4, status: "Filme", tipo: "filme", cor_a: "#4dd9ff", cor_b: "#7c5cff",
    sinopse: "Numa corrida clandestina de veículos movidos a luz, uma piloto novata precisa vencer para pagar a dívida que a família deixou.",
    temporadas: [{ numero: 1, titulo: "Filme", episodios: 1, video: VIDEO_B }] },
];

const MANGAS = [
  { titulo: "Kaen: Crônicas de Cinza", generos: ["Fantasia", "Aventura"], ano: 2021, avaliacao: 4.7, status: "Em publicação", cor_a: "#7c5cff", cor_b: "#4dd9ff",
    sinopse: "A versão em quadrinhos que deu origem a Estrelas de Kaen, com uma linha narrativa própria sobre a guardiã e o reino suspenso.",
    capitulos: [ { titulo: "O Chamado", paginas: 22 }, { titulo: "Nuvens Partidas", paginas: 19 }, { titulo: "A Queda", paginas: 24 } ] },
  { titulo: "Nebula: Sinais", generos: ["Ficção", "Mistério"], ano: 2023, avaliacao: 4.8, status: "Em publicação", cor_a: "#4dd9ff", cor_b: "#7c5cff",
    sinopse: "Antes da série, a pilota já investigava anomalias no cinturão — este mangá conta o caso que a levou até a IA renegada.",
    capitulos: [ { titulo: "Ruído de Fundo", paginas: 20 }, { titulo: "Frequência Perdida", paginas: 21 } ] },
  { titulo: "Confeitaria Yohaku — Receitas", generos: ["Comédia", "Drama"], ano: 2020, avaliacao: 4.4, status: "Completo", cor_a: "#ffd24d", cor_b: "#ff8a4d",
    sinopse: "Spin-off em quadrinhos com histórias curtas de clientes da confeitaria, cada uma girando em torno de uma receita diferente.",
    capitulos: [ { titulo: "Torta de Ameixa", paginas: 16 }, { titulo: "Chá da Tarde", paginas: 18 }, { titulo: "Última Fornada", paginas: 20 } ] },
  { titulo: "Labirinto de Yumei — Origens", generos: ["Mistério", "Fantasia"], ano: 2022, avaliacao: 4.6, status: "Em publicação", cor_a: "#4dffb0", cor_b: "#4dd9ff",
    sinopse: "O que havia do outro lado da primeira porta? Este mangá preenche a lacuna deixada no fim da primeira temporada da série.",
    capitulos: [ { titulo: "A Primeira Porta", paginas: 23 }, { titulo: "Corredores", paginas: 21 } ] },
  { titulo: "Maré Eterna", generos: ["Aventura", "Ação"], ano: 2019, avaliacao: 4.5, status: "Completo", cor_a: "#ff9d4d", cor_b: "#ff4d6d",
    sinopse: "O mangá original que inspirou Guardiões da Maré, com um final diferente do da adaptação animada.",
    capitulos: [ { titulo: "Zarpar", paginas: 18 }, { titulo: "Tempestade", paginas: 22 }, { titulo: "Porto Seguro", paginas: 25 } ] },
];

const transacao = db.transaction(() => {
  // escopado por origem='mock': se já houver um catálogo importado com
  // `npm run import:jikan`, reexecutar o seed não apaga esses títulos
  db.exec(`
    DELETE FROM historico; DELETE FROM favoritos; DELETE FROM leitura; DELETE FROM favoritos_mangas;
    DELETE FROM episodios WHERE temporada_id IN (SELECT id FROM temporadas WHERE anime_id IN (SELECT id FROM animes WHERE origem = 'mock'));
    DELETE FROM temporadas WHERE anime_id IN (SELECT id FROM animes WHERE origem = 'mock');
    DELETE FROM anime_generos WHERE anime_id IN (SELECT id FROM animes WHERE origem = 'mock');
    DELETE FROM animes WHERE origem = 'mock';
    DELETE FROM capitulos WHERE manga_id IN (SELECT id FROM mangas WHERE origem = 'mock');
    DELETE FROM manga_generos WHERE manga_id IN (SELECT id FROM mangas WHERE origem = 'mock');
    DELETE FROM mangas WHERE origem = 'mock';
  `);

  // gêneros não são apagados (são compartilhados com um eventual catálogo
  // já importado) — só garante que os gêneros base existam
  const insGenero = db.prepare("INSERT OR IGNORE INTO generos (nome) VALUES (?)");
  const generoId = {};
  for (const nome of GENEROS) {
    insGenero.run(nome);
    generoId[nome] = db.prepare("SELECT id FROM generos WHERE nome = ?").get(nome).id;
  }

  const insAnime = db.prepare(
    "INSERT INTO animes (titulo, sinopse, ano, status, tipo, avaliacao, cor_a, cor_b) VALUES (?, ?, ?, ?, ?, ?, ?, ?)"
  );
  const insAnimeGenero = db.prepare("INSERT INTO anime_generos (anime_id, genero_id) VALUES (?, ?)");
  const insTemporada = db.prepare("INSERT INTO temporadas (anime_id, numero, titulo) VALUES (?, ?, ?)");
  const insEpisodio = db.prepare(
    "INSERT INTO episodios (temporada_id, numero, titulo, duracao, video_url) VALUES (?, ?, ?, ?, ?)"
  );

  for (const a of ANIMES) {
    const animeId = insAnime.run(a.titulo, a.sinopse, a.ano, a.status, a.tipo, a.avaliacao, a.cor_a, a.cor_b).lastInsertRowid;
    for (const g of a.generos) insAnimeGenero.run(animeId, generoId[g]);
    for (const t of a.temporadas) {
      const temporadaId = insTemporada.run(animeId, t.numero, t.titulo).lastInsertRowid;
      for (let i = 1; i <= t.episodios; i++) {
        insEpisodio.run(temporadaId, i, `Episódio ${i}`, "24 min", t.video);
      }
    }
  }

  const insManga = db.prepare(
    "INSERT INTO mangas (titulo, sinopse, ano, status, avaliacao, cor_a, cor_b) VALUES (?, ?, ?, ?, ?, ?, ?)"
  );
  const insMangaGenero = db.prepare("INSERT INTO manga_generos (manga_id, genero_id) VALUES (?, ?)");
  const insCapitulo = db.prepare(
    "INSERT INTO capitulos (manga_id, numero, titulo, paginas) VALUES (?, ?, ?, ?)"
  );

  for (const m of MANGAS) {
    const mangaId = insManga.run(m.titulo, m.sinopse, m.ano, m.status, m.avaliacao, m.cor_a, m.cor_b).lastInsertRowid;
    for (const g of m.generos) insMangaGenero.run(mangaId, generoId[g]);
    m.capitulos.forEach((c, i) => insCapitulo.run(mangaId, i + 1, c.titulo, c.paginas));
  }
});

transacao();
console.log(`Seed concluído: ${ANIMES.length} animes e ${MANGAS.length} mangás inseridos.`);

// ===== Conta do dono do app (usuário: ls_dev) — emblema 👑 exclusivo =====
// Idempotente: pode rodar o seed de novo sem duplicar ou perder a conta.
const bcrypt = require("bcryptjs");
const DONO_USUARIO = "ls_dev";
const DONO_SENHA_HASH = bcrypt.hashSync("éueliessidono", 10);

db.prepare(
  "INSERT OR IGNORE INTO users (nome, email, usuario, senha_hash, eh_dono) VALUES (?, ?, ?, ?, 1)"
).run("ls_dev", "ls_dev@animeflix.dev", DONO_USUARIO, DONO_SENHA_HASH);

db.prepare("UPDATE users SET senha_hash = ?, eh_dono = 1 WHERE usuario = ?").run(DONO_SENHA_HASH, DONO_USUARIO);

console.log(`Conta do dono garantida (usuário: ${DONO_USUARIO}).`);
