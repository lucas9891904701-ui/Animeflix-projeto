import React, { useState, useRef, useEffect } from "react";
import {
  Home, Compass, Search, Heart, Clock, Play, Pause, ChevronLeft, ChevronRight,
  Star, Check, Volume2, VolumeX, Maximize, Settings, X,
  Captions, SkipBack, SkipForward, Film, Tv, TrendingUp,
  User, Mail, Lock, LogOut, AlertCircle, Eye, EyeOff, BookOpen
} from "lucide-react";

/* ============================================================
   ANIMEFLIX — estrutura em camadas (tudo num arquivo por causa
   do ambiente de preview, mas organizado como um app real):

   1. DADOS MOCK        -> usados como catálogo inicial e como
                             fallback automático se a API real
                             (animeflix-backend) não responder
   2. SERVIÇOS (api.*)  -> camada BACKEND de verdade: fala com
                             http://localhost:3333/api via fetch;
                             se falhar, cai pro mock sem quebrar
   3. COMPONENTES BASE  -> peças reutilizáveis (Poster, Row...)
   4. TELAS             -> Inicial, Explorar, Mangás, Pesquisa,
                             Detalhes, Player, Leitor, Favoritos,
                             Histórico
   5. APP               -> navegação (bottom nav) + estado global
   ============================================================ */

/* ---------------- 1. DADOS MOCK / FALLBACK ---------------- */
// Vídeos de demonstração com licença aberta (Blender Foundation /
// Google sample bucket) — únicas fontes de vídeo usadas aqui.
const SAMPLE_VIDEO_A = "https://commondatastorage.googleapis.com/gtv-videos-bucket/sample/BigBuckBunny.mp4";
const SAMPLE_VIDEO_B = "https://commondatastorage.googleapis.com/gtv-videos-bucket/sample/ElephantsDream.mp4";

// Os gêneros exibidos nos filtros são derivados do catálogo carregado
// (não uma lista fixa) — o catálogo mock usa nomes em português, e o
// catálogo real importado da Jikan (ver backend/src/import-jikan.js)
// vem em inglês, então os dois convivem sem precisar de tradução.
const AURAS = {
  "Ação": ["#ff4d6d", "#7c5cff"], "Action": ["#ff4d6d", "#7c5cff"],
  "Aventura": ["#ff9d4d", "#ff4d6d"], "Adventure": ["#ff9d4d", "#ff4d6d"],
  "Fantasia": ["#7c5cff", "#4dd9ff"], "Fantasy": ["#7c5cff", "#4dd9ff"],
  "Ficção": ["#4dd9ff", "#7c5cff"], "Sci-Fi": ["#4dd9ff", "#7c5cff"],
  "Drama": ["#ff4d9e", "#7c5cff"],
  "Comédia": ["#ffd24d", "#ff8a4d"], "Comedy": ["#ffd24d", "#ff8a4d"],
  "Mistério": ["#4dffb0", "#4dd9ff"], "Mystery": ["#4dffb0", "#4dd9ff"],
  "Romance": ["#ff4d9e", "#ff9d4d"],
  "Horror": ["#ff4d4d", "#7c5cff"],
  "Supernatural": ["#4dd9ff", "#ff4d9e"],
  "Sports": ["#4dffb0", "#ffd24d"],
  "Slice of Life": ["#ffd24d", "#4dd9ff"],
  "Suspense": ["#7c5cff", "#ff4d4d"],
  "Psychological": ["#7c5cff", "#ff4d9e"],
};

// Rótulos de tipo — cobrem tanto o catálogo mock ('serie'/'filme') quanto
// os tipos reais importados (tv/movie/ova/ona/special para animes;
// manga/novel/manhwa/manhua/oneshot/doujin para mangás).
const TYPE_LABELS = {
  movie: "Filme", filme: "Filme", ova: "OVA", ona: "ONA", special: "Especial",
  novel: "Novel", manhwa: "Manhwa", manhua: "Manhua", oneshot: "One-shot", doujin: "Doujin",
};

function tipoBadge(anime) {
  const isManga = anime.kind === "manga";
  const t = (anime.type || (isManga ? "manga" : "tv")).toLowerCase();
  if (!isManga && (t === "tv" || t === "serie")) return null; // tipo padrão, sem selo
  if (isManga && t === "manga") return "Mangá";
  return TYPE_LABELS[t] || (isManga ? "Mangá" : null);
}

function makeEpisodes(seasonNum, count, video) {
  return Array.from({ length: count }, (_, i) => ({
    id: `s${seasonNum}e${i + 1}`,
    number: i + 1,
    title: `Episódio ${i + 1}`,
    duration: "24 min",
    videoUrl: video,
  }));
}

function makeChapters(mangaNum, specs) {
  return specs.map((s, i) => ({ id: `m${mangaNum}c${i + 1}`, number: i + 1, title: s.title, pages: s.pages }));
}

const MOCK_ANIMES = [
  {
    id: "1", title: "Ronin do Vento", genres: ["Ação", "Aventura"], year: 2023,
    rating: 4.8, status: "Em exibição", type: "serie",
    synopsis: "Um espadachim sem clã cruza o país devastado atrás do assassino do seu mestre, enquanto uma antiga profecia começa a se cumprir ao seu redor.",
    seasons: [
      { id: "t1", number: 1, title: "Temporada 1", episodes: makeEpisodes(1, 4, SAMPLE_VIDEO_A) },
      { id: "t2", number: 2, title: "Temporada 2", episodes: makeEpisodes(2, 3, SAMPLE_VIDEO_B) },
    ],
  },
  {
    id: "2", title: "Estrelas de Kaen", genres: ["Fantasia", "Drama"], year: 2022,
    rating: 4.6, status: "Completo", type: "serie",
    synopsis: "Em um reino suspenso entre nuvens, uma jovem guardiã descobre que consegue falar com as estrelas — e que uma delas está prestes a cair.",
    seasons: [{ id: "t1", number: 1, title: "Temporada 1", episodes: makeEpisodes(1, 5, SAMPLE_VIDEO_B) }],
  },
  {
    id: "3", title: "Protocolo Nebula", genres: ["Ficção", "Mistério"], year: 2024,
    rating: 4.9, status: "Em exibição", type: "serie",
    synopsis: "Uma pilota é recrutada por uma IA renegada para investigar sinais que vêm de dentro do próprio sistema solar — sinais que ninguém deveria ouvir.",
    seasons: [{ id: "t1", number: 1, title: "Temporada 1", episodes: makeEpisodes(1, 4, SAMPLE_VIDEO_A) }],
  },
  {
    id: "4", title: "Confeitaria Yohaku", genres: ["Comédia", "Drama"], year: 2021,
    rating: 4.3, status: "Completo", type: "serie",
    synopsis: "Depois de perder o emprego, um ex-chef de cozinha reabre a confeitaria da avó e descobre que doces guardam mais memórias do que ele imaginava.",
    seasons: [{ id: "t1", number: 1, title: "Temporada 1", episodes: makeEpisodes(1, 3, SAMPLE_VIDEO_B) }],
  },
  {
    id: "5", title: "Labirinto de Yumei", genres: ["Mistério", "Fantasia"], year: 2023,
    rating: 4.7, status: "Em exibição", type: "serie",
    synopsis: "Todo aniversário, uma porta aparece na casa de Yumei. Ela nunca soube o que tem do outro lado — até a noite em que resolveu entrar.",
    seasons: [{ id: "t1", number: 1, title: "Temporada 1", episodes: makeEpisodes(1, 4, SAMPLE_VIDEO_A) }],
  },
  {
    id: "6", title: "Guardiões da Maré", genres: ["Aventura", "Ação"], year: 2020,
    rating: 4.5, status: "Completo", type: "serie",
    synopsis: "Uma tripulação de jovens navegadores parte em busca da lendária Maré Eterna, o único fenômeno capaz de salvar sua ilha natal.",
    seasons: [{ id: "t1", number: 1, title: "Temporada 1", episodes: makeEpisodes(1, 4, SAMPLE_VIDEO_B) }],
  },
  {
    id: "7", title: "Réquiem de Outono", genres: ["Drama", "Ficção"], year: 2024,
    rating: 4.9, status: "Filme", type: "filme",
    synopsis: "Dois irmãos separados pela guerra se reencontram numa cidade que nenhum dos dois reconhece mais.",
    seasons: [{ id: "t1", number: 1, title: "Filme", episodes: makeEpisodes(1, 1, SAMPLE_VIDEO_A) }],
  },
  {
    id: "8", title: "Circuito Aurora", genres: ["Ficção", "Ação"], year: 2022,
    rating: 4.4, status: "Filme", type: "filme",
    synopsis: "Numa corrida clandestina de veículos movidos a luz, uma piloto novata precisa vencer para pagar a dívida que a família deixou.",
    seasons: [{ id: "t1", number: 1, title: "Filme", episodes: makeEpisodes(1, 1, SAMPLE_VIDEO_B) }],
  },
];

const MOCK_MANGAS = [
  {
    id: "1", title: "Kaen: Crônicas de Cinza", genres: ["Fantasia", "Aventura"], year: 2021,
    rating: 4.7, status: "Em publicação", kind: "manga",
    synopsis: "A versão em quadrinhos que deu origem a Estrelas de Kaen, com uma linha narrativa própria sobre a guardiã e o reino suspenso.",
    chapters: makeChapters(1, [{ title: "O Chamado", pages: 22 }, { title: "Nuvens Partidas", pages: 19 }, { title: "A Queda", pages: 24 }]),
  },
  {
    id: "2", title: "Nebula: Sinais", genres: ["Ficção", "Mistério"], year: 2023,
    rating: 4.8, status: "Em publicação", kind: "manga",
    synopsis: "Antes da série, a pilota já investigava anomalias no cinturão — este mangá conta o caso que a levou até a IA renegada.",
    chapters: makeChapters(2, [{ title: "Ruído de Fundo", pages: 20 }, { title: "Frequência Perdida", pages: 21 }]),
  },
  {
    id: "3", title: "Confeitaria Yohaku — Receitas", genres: ["Comédia", "Drama"], year: 2020,
    rating: 4.4, status: "Completo", kind: "manga",
    synopsis: "Spin-off em quadrinhos com histórias curtas de clientes da confeitaria, cada uma girando em torno de uma receita diferente.",
    chapters: makeChapters(3, [{ title: "Torta de Ameixa", pages: 16 }, { title: "Chá da Tarde", pages: 18 }, { title: "Última Fornada", pages: 20 }]),
  },
  {
    id: "4", title: "Labirinto de Yumei — Origens", genres: ["Mistério", "Fantasia"], year: 2022,
    rating: 4.6, status: "Em publicação", kind: "manga",
    synopsis: "O que havia do outro lado da primeira porta? Este mangá preenche a lacuna deixada no fim da primeira temporada da série.",
    chapters: makeChapters(4, [{ title: "A Primeira Porta", pages: 23 }, { title: "Corredores", pages: 21 }]),
  },
  {
    id: "5", title: "Maré Eterna", genres: ["Aventura", "Ação"], year: 2019,
    rating: 4.5, status: "Completo", kind: "manga",
    synopsis: "O mangá original que inspirou Guardiões da Maré, com um final diferente do da adaptação animada.",
    chapters: makeChapters(5, [{ title: "Zarpar", pages: 18 }, { title: "Tempestade", pages: 22 }, { title: "Porto Seguro", pages: 25 }]),
  },
];

// Catálogo "ativo" — começa no mock e é substituído pelos dados
// reais assim que api.loadCatalog() conseguir falar com a API.
// É `let` (não `const`) de propósito: todo o resto do arquivo lê
// estas duas variáveis no momento da chamada, então trocá-las
// aqui dentro é suficiente pra tudo passar a usar dados reais.
let ANIMES = MOCK_ANIMES;
let MANGAS = MOCK_MANGAS;

/* ---------------- 2. SERVIÇOS (camada BACKEND) ----------------
   Fala com a API em animeflix-backend/ via fetch. Se a API não
   responder (offline, CORS, rodando sem o backend de pé), cada
   função cai automaticamente pro catálogo mock — a demonstração
   nunca quebra, e nenhuma tela precisa saber qual dos dois está
   sendo usado. */
const API_BASE = import.meta.env.VITE_API_BASE_URL || "http://localhost:3333/api";

let authToken = null; // token JWT em memória — some ao recarregar a página, por design (sem localStorage)

function withTimeout(promise, ms = 2500) {
  return Promise.race([
    promise,
    new Promise((_, reject) => setTimeout(() => reject(new Error("offline")), ms)),
  ]);
}

async function request(path, options = {}) {
  const headers = { "Content-Type": "application/json", ...(options.headers || {}) };
  if (authToken) headers.Authorization = `Bearer ${authToken}`;

  let res;
  try {
    res = await withTimeout(fetch(`${API_BASE}${path}`, { ...options, headers }));
  } catch {
    const offlineErr = new Error("offline");
    offlineErr.offline = true;
    throw offlineErr;
  }

  let data = {};
  try { data = await res.json(); } catch { /* resposta sem corpo */ }
  if (!res.ok) throw new Error(data.erro || "Erro na requisição");
  return data;
}

// ---- adaptadores: convertem o formato da API (pt/snake_case) para
// o mesmo formato que as telas já usam (o do catálogo mock) ----
function adaptAnime(a) {
  return {
    id: String(a.id), title: a.titulo, genres: a.generos || [], year: a.ano,
    rating: a.avaliacao, status: a.status, type: a.tipo, synopsis: a.sinopse, cover: a.capa_url || null,
    seasons: (a.temporadas || []).map((t) => ({
      id: String(t.id), number: t.numero, title: t.titulo,
      episodes: (t.episodios || []).map((e) => ({
        id: String(e.id), number: e.numero, title: e.titulo, duration: e.duracao, videoUrl: e.video_url,
      })),
    })),
  };
}

function adaptManga(m) {
  return {
    id: String(m.id), title: m.titulo, genres: m.generos || [], year: m.ano,
    rating: m.avaliacao, status: m.status, kind: "manga", type: m.tipo || "manga", synopsis: m.sinopse, cover: m.capa_url || null,
    chapters: (m.capitulos || []).map((c) => ({ id: String(c.id), number: c.numero, title: c.titulo, pages: c.paginas })),
  };
}

async function fetchAnimesCatalog() {
  const lista = await request("/animes?porPagina=300");
  const detalhes = await Promise.all(lista.resultados.map((a) => request(`/animes/${a.id}`)));
  return detalhes.map(adaptAnime);
}

async function fetchMangasCatalog() {
  const lista = await request("/mangas?porPagina=300");
  const detalhes = await Promise.all(lista.resultados.map((m) => request(`/mangas/${m.id}`)));
  return detalhes.map(adaptManga);
}

const api = {
  // carrega o catálogo real uma vez, no início da sessão; usado pelo App
  async loadCatalog() {
    try {
      const [animes, mangas] = await Promise.all([fetchAnimesCatalog(), fetchMangasCatalog()]);
      if (!animes.length) throw new Error("catálogo vazio");
      ANIMES = animes;
      MANGAS = mangas.length ? mangas : MOCK_MANGAS;
      return { online: true };
    } catch {
      ANIMES = MOCK_ANIMES;
      MANGAS = MOCK_MANGAS;
      return { online: false };
    }
  },

  // ----- animes -----
  getHome: () => ({
    destaque: ANIMES[2] || ANIMES[0],
    emAlta: [...ANIMES].sort((a, b) => b.rating - a.rating).slice(0, 6),
    lancamentos: [...ANIMES].sort((a, b) => b.year - a.year).slice(0, 6),
    porGenero: (genero) => ANIMES.filter((a) => a.genres.includes(genero)),
  }),
  getAll: () => ANIMES,
  getById: (id) => ANIMES.find((a) => a.id === id),
  search: (query) => (!query.trim() ? [] : ANIMES.filter((a) => a.title.toLowerCase().includes(query.toLowerCase()))),

  // ----- mangás -----
  getAllMangas: () => MANGAS,
  getMangaById: (id) => MANGAS.find((m) => m.id === id),
  searchMangas: (query) => (!query.trim() ? [] : MANGAS.filter((m) => m.title.toLowerCase().includes(query.toLowerCase()))),

  // ----- ações do usuário logado: melhor esforço (otimista + envia
  // pro backend em segundo plano; se falhar, ignora silenciosamente,
  // já que o estado local já refletiu a mudança) -----
  syncFavorite: (animeId, isFav) => {
    request(`/me/favoritos/${animeId}`, { method: isFav ? "POST" : "DELETE" }).catch(() => {});
  },
  syncMangaFavorite: (mangaId, isFav) => {
    request(`/me/favoritos-mangas/${mangaId}`, { method: isFav ? "POST" : "DELETE" }).catch(() => {});
  },
  syncHistorico: (episodioId, progressoSegundos) => {
    request("/me/historico", { method: "POST", body: JSON.stringify({ episodioId, progressoSegundos }) }).catch(() => {});
  },
  syncLeitura: (capituloId, paginaAtual) => {
    request("/me/leitura", { method: "POST", body: JSON.stringify({ capituloId, paginaAtual }) }).catch(() => {});
  },
};

/* ---------------- 2b. AUTENTICAÇÃO ----------------
   Tenta a API real (/api/auth/*); se estiver offline, cai pra uma
   versão em memória com as mesmas regras (mesmo contrato: recebe
   dados, devolve o usuário ou lança um erro com mensagem). Erros
   de validação vindos da API real (ex.: "email já cadastrado")
   são repassados normalmente — só quedas de rede acionam o mock.

   A conta do dono do app (usuário: ls_dev) já vem pré-cadastrada
   aqui também, pra funcionar mesmo se a API estiver offline — é a
   única com ehDono: true, o que liga o emblema 👑 exclusivo dela. */
const mockAuthUsers = [
  { id: "0", nome: "ls_dev", email: "ls_dev@animeflix.dev", usuario: "ls_dev", senha: "éueliessidono", ehDono: true },
];
const mockAuth = {
  register({ nome, email, senha }) {
    if (!nome || !email || !senha) throw new Error("Preencha nome, email e senha");
    if (senha.length < 6) throw new Error("A senha precisa ter ao menos 6 caracteres");
    if (mockAuthUsers.some((u) => u.email === email.toLowerCase())) throw new Error("Este email já está cadastrado");
    const usuario = { id: String(mockAuthUsers.length + 1), nome, email: email.toLowerCase(), senha, ehDono: false };
    mockAuthUsers.push(usuario);
    return { id: usuario.id, nome: usuario.nome, email: usuario.email, ehDono: false };
  },
  login({ email, senha }) {
    const valor = email.toLowerCase();
    const usuario = mockAuthUsers.find((u) => u.email.toLowerCase() === valor || u.usuario?.toLowerCase() === valor);
    if (!usuario || usuario.senha !== senha) throw new Error("Email/usuário ou senha inválidos");
    return { id: usuario.id, nome: usuario.nome, email: usuario.email, usuario: usuario.usuario, ehDono: !!usuario.ehDono };
  },
};

const authApi = {
  async register({ nome, email, senha }) {
    try {
      const data = await request("/auth/register", { method: "POST", body: JSON.stringify({ nome, email, senha }) });
      authToken = data.token;
      return data.usuario;
    } catch (e) {
      if (e.offline) return mockAuth.register({ nome, email, senha });
      throw e;
    }
  },
  async login({ email, senha }) {
    try {
      const data = await request("/auth/login", { method: "POST", body: JSON.stringify({ email, senha }) });
      authToken = data.token;
      return data.usuario;
    } catch (e) {
      if (e.offline) return mockAuth.login({ email, senha });
      throw e;
    }
  },
  logout() {
    authToken = null;
  },
};

/* ---------------- estilos base (design tokens) ---------------- */
const GlobalStyle = () => (
  <style>{`
    @import url('https://fonts.googleapis.com/css2?family=Bricolage+Grotesque:wght@500;700;800&family=Inter:wght@400;500;600;700&display=swap');
    .af-root {
      --bg: #0a0912;
      --panel: #14121f;
      --panel-2: #1b1829;
      --line: #2a2740;
      --text: #f1eef7;
      --muted: #9490ab;
      --pink: #ff4d6d;
      --violet: #7c5cff;
      font-family: 'Inter', sans-serif;
      background: var(--bg);
      color: var(--text);
      min-height: 100vh;
      max-width: 480px;
      margin: 0 auto;
      position: relative;
      overflow-x: hidden;
    }
    .af-display { font-family: 'Bricolage Grotesque', sans-serif; }
    .af-scrollx { display: flex; gap: 12px; overflow-x: auto; padding-bottom: 4px; scroll-snap-type: x proximity; }
    .af-scrollx::-webkit-scrollbar { display: none; }
    .af-scrollx { scrollbar-width: none; }
    .af-poster {
      border-radius: 18px;
      position: relative;
      flex-shrink: 0;
      overflow: hidden;
      scroll-snap-align: start;
      border: 1px solid var(--line);
      transition: transform .2s ease;
    }
    .af-poster:active { transform: scale(0.96); }
    .af-chip {
      border: 1px solid var(--line);
      background: var(--panel);
      color: var(--muted);
      border-radius: 999px;
      font-size: 12px;
      padding: 6px 12px;
      white-space: nowrap;
    }
    .af-chip.active {
      background: linear-gradient(135deg, var(--pink), var(--violet));
      color: white;
      border-color: transparent;
      font-weight: 600;
    }
    .af-card {
      background: var(--panel);
      border: 1px solid var(--line);
      border-radius: 20px;
    }
    .af-navbtn { display:flex; flex-direction:column; align-items:center; gap:3px; color: var(--muted); flex:1; padding: 7px 0; }
    .af-navbtn.active { color: var(--text); }
    .af-navdot { width:4px; height:4px; border-radius:999px; background: linear-gradient(135deg, var(--pink), var(--violet)); }
    .af-fade-in { animation: afFade .25s ease; }
    @keyframes afFade { from { opacity:0; transform: translateY(6px);} to {opacity:1; transform:none;} }
    .af-progress { height:3px; background: var(--line); border-radius:999px; overflow:hidden; }
    .af-progress > div { height:100%; background: linear-gradient(90deg, var(--pink), var(--violet)); }
    .af-spin { animation: afSpin .8s linear infinite; }
    @keyframes afSpin { to { transform: rotate(360deg); } }
  `}</style>
);

/* ---------------- TELA DE AUTENTICAÇÃO ---------------- */

function AuthScreen({ onAuth }) {
  const [modo, setModo] = useState("login"); // login | cadastro
  const [nome, setNome] = useState("");
  const [email, setEmail] = useState("");
  const [senha, setSenha] = useState("");
  const [confirmar, setConfirmar] = useState("");
  const [verSenha, setVerSenha] = useState(false);
  const [erro, setErro] = useState("");
  const [carregando, setCarregando] = useState(false);

  const trocarModo = (novo) => {
    setModo(novo);
    setErro("");
  };

  const submeter = async (e) => {
    e.preventDefault();
    setErro("");

    if (modo === "cadastro" && senha !== confirmar) {
      setErro("As senhas não coincidem");
      return;
    }

    setCarregando(true);
    try {
      const usuario =
        modo === "login" ? await authApi.login({ email, senha }) : await authApi.register({ nome, email, senha });
      onAuth(usuario);
    } catch (err) {
      setErro(err.message);
    } finally {
      setCarregando(false);
    }
  };

  return (
    <div className="af-root af-fade-in" style={{ minHeight: "100vh", display: "flex", flexDirection: "column", justifyContent: "center", padding: "24px 20px" }}>
      <GlobalStyle />
      <div style={{ textAlign: "center", marginBottom: 36 }}>
        <div className="af-display" style={{ fontSize: 30, fontWeight: 800 }}>
          Anime<span style={{ color: "var(--pink)" }}>Flix</span>
        </div>
        <div style={{ fontSize: 13, color: "var(--muted)", marginTop: 6 }}>
          {modo === "login" ? "Entre para continuar assistindo" : "Crie sua conta para começar"}
        </div>
      </div>

      <div className="af-card" style={{ display: "flex", padding: 4, marginBottom: 22 }}>
        <button onClick={() => trocarModo("login")} className={`af-chip ${modo === "login" ? "active" : ""}`} style={{ flex: 1, textAlign: "center", border: "none" }}>
          Entrar
        </button>
        <button onClick={() => trocarModo("cadastro")} className={`af-chip ${modo === "cadastro" ? "active" : ""}`} style={{ flex: 1, textAlign: "center", border: "none" }}>
          Criar conta
        </button>
      </div>

      <form onSubmit={submeter} style={{ display: "flex", flexDirection: "column", gap: 12 }}>
        {modo === "cadastro" && (
          <div className="af-card" style={{ display: "flex", alignItems: "center", gap: 10, padding: "12px 14px" }}>
            <User size={16} color="var(--muted)" />
            <input value={nome} onChange={(e) => setNome(e.target.value)} placeholder="Nome" required
              style={{ background: "transparent", border: "none", outline: "none", color: "var(--text)", fontSize: 14, width: "100%" }} />
          </div>
        )}

        <div className="af-card" style={{ display: "flex", alignItems: "center", gap: 10, padding: "12px 14px" }}>
          <Mail size={16} color="var(--muted)" />
          <input type={modo === "login" ? "text" : "email"} value={email} onChange={(e) => setEmail(e.target.value)} placeholder={modo === "login" ? "Email ou usuário" : "Email"} required
            style={{ background: "transparent", border: "none", outline: "none", color: "var(--text)", fontSize: 14, width: "100%" }} />
        </div>

        <div className="af-card" style={{ display: "flex", alignItems: "center", gap: 10, padding: "12px 14px" }}>
          <Lock size={16} color="var(--muted)" />
          <input type={verSenha ? "text" : "password"} value={senha} onChange={(e) => setSenha(e.target.value)} placeholder="Senha" required minLength={6}
            style={{ background: "transparent", border: "none", outline: "none", color: "var(--text)", fontSize: 14, width: "100%" }} />
          <button type="button" onClick={() => setVerSenha((v) => !v)} style={{ background: "none", border: "none", display: "flex" }}>
            {verSenha ? <EyeOff size={15} color="var(--muted)" /> : <Eye size={15} color="var(--muted)" />}
          </button>
        </div>

        {modo === "cadastro" && (
          <div className="af-card" style={{ display: "flex", alignItems: "center", gap: 10, padding: "12px 14px" }}>
            <Lock size={16} color="var(--muted)" />
            <input type={verSenha ? "text" : "password"} value={confirmar} onChange={(e) => setConfirmar(e.target.value)} placeholder="Confirmar senha" required minLength={6}
              style={{ background: "transparent", border: "none", outline: "none", color: "var(--text)", fontSize: 14, width: "100%" }} />
          </div>
        )}

        {erro && (
          <div style={{ display: "flex", alignItems: "center", gap: 8, color: "var(--pink)", fontSize: 12.5, padding: "0 2px" }}>
            <AlertCircle size={14} /> {erro}
          </div>
        )}

        <button type="submit" disabled={carregando} style={{
          marginTop: 8, background: carregando ? "var(--panel-2)" : "var(--text)",
          color: carregando ? "var(--muted)" : "var(--bg)", border: "none", borderRadius: 14,
          padding: "13px 0", fontWeight: 700, fontSize: 14,
        }}>
          {carregando ? "Aguarde..." : modo === "login" ? "Entrar" : "Criar conta"}
        </button>
      </form>

      <div style={{ textAlign: "center", fontSize: 12.5, color: "var(--muted)", marginTop: 18 }}>
        {modo === "login" ? (
          <>Ainda não tem conta? <button onClick={() => trocarModo("cadastro")} style={{ background: "none", border: "none", color: "var(--pink)", fontWeight: 600 }}>Criar conta</button></>
        ) : (
          <>Já tem conta? <button onClick={() => trocarModo("login")} style={{ background: "none", border: "none", color: "var(--pink)", fontWeight: 600 }}>Entrar</button></>
        )}
      </div>
    </div>
  );
}

function CatalogLoadingScreen() {
  return (
    <div className="af-root af-fade-in" style={{ minHeight: "100vh", display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center", gap: 14 }}>
      <GlobalStyle />
      <div className="af-display" style={{ fontSize: 22, fontWeight: 800 }}>Anime<span style={{ color: "var(--pink)" }}>Flix</span></div>
      <div className="af-spin" style={{ width: 26, height: 26, border: "3px solid var(--line)", borderTopColor: "var(--pink)", borderRadius: "50%" }} />
      <div style={{ fontSize: 12, color: "var(--muted)" }}>Carregando catálogo...</div>
    </div>
  );
}

/* ---------------- 3. COMPONENTES BASE ---------------- */

function Aura({ genres, cover, children, style, className = "" }) {
  const [a, b] = AURAS[genres?.[0]] || ["#ff4d6d", "#7c5cff"];
  return (
    <div className={`af-poster ${className}`} style={{ boxShadow: `0 8px 24px -8px ${a}55`, background: "var(--panel-2)", ...style }}>
      {cover ? (
        <img
          src={cover}
          alt=""
          loading="lazy"
          onError={(e) => { e.currentTarget.style.display = "none"; }}
          style={{ position: "absolute", inset: 0, width: "100%", height: "100%", objectFit: "cover" }}
        />
      ) : (
        <div style={{ position: "absolute", inset: 0, background: `linear-gradient(160deg, ${a}33, ${b}22 60%, transparent)` }} />
      )}
      {cover && <div style={{ position: "absolute", inset: 0, background: "linear-gradient(0deg, rgba(8,7,14,.92), rgba(8,7,14,.15) 55%, transparent)" }} />}
      {children}
    </div>
  );
}

function Poster({ anime, onClick, size = "md" }) {
  const dims = { sm: { w: 108, h: 152 }, md: { w: 128, h: 176 }, lg: { w: 156, h: 214 } }[size];
  const isManga = anime.kind === "manga";
  const badge = tipoBadge(anime);
  return (
    <button onClick={onClick} style={{ width: dims.w, textAlign: "left" }} className="af-fade-in">
      <Aura genres={anime.genres} cover={anime.cover} style={{ width: dims.w, height: dims.h }}>
        <div style={{ position: "absolute", inset: 0, display: "flex", alignItems: "flex-end", padding: 10 }}>
          <div>
            <div className="af-display" style={{ fontSize: 13, fontWeight: 700, lineHeight: 1.15 }}>{anime.title}</div>
            <div style={{ display: "flex", alignItems: "center", gap: 4, marginTop: 4, fontSize: 11, color: "var(--muted)" }}>
              <Star size={11} fill="#ffd24d" color="#ffd24d" />
              {anime.rating}
            </div>
          </div>
        </div>
        {badge && (
          <div style={{ position: "absolute", top: 8, left: 8, background: "rgba(10,9,18,.7)", borderRadius: 8, padding: "2px 6px", fontSize: 10, display: "flex", alignItems: "center", gap: 4 }}>
            {isManga ? <BookOpen size={10} /> : <Film size={10} />} {badge}
          </div>
        )}
      </Aura>
    </button>
  );
}

function Row({ title, icon: Icon, animes, onOpen, size }) {
  if (!animes?.length) return null;
  return (
    <div style={{ marginBottom: 24 }}>
      <div style={{ display: "flex", alignItems: "center", gap: 6, padding: "0 16px", marginBottom: 10 }}>
        {Icon && <Icon size={16} color="var(--pink)" />}
        <h3 className="af-display" style={{ fontSize: 15, fontWeight: 700, margin: 0 }}>{title}</h3>
      </div>
      <div className="af-scrollx" style={{ padding: "0 16px" }}>
        {animes.map((a) => <Poster key={a.id} anime={a} size={size} onClick={() => onOpen(a.id)} />)}
      </div>
    </div>
  );
}

function TopBar({ title, onBack, right }) {
  return (
    <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", padding: "18px 16px 8px" }}>
      <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
        {onBack && (
          <button onClick={onBack} style={{ background: "var(--panel)", border: "1px solid var(--line)", borderRadius: 12, padding: 8, color: "var(--text)" }}>
            <ChevronLeft size={18} />
          </button>
        )}
        <h1 className="af-display" style={{ fontSize: 20, fontWeight: 800, margin: 0 }}>{title}</h1>
      </div>
      {right}
    </div>
  );
}

function EmptyState({ icon: Icon, text, hint }) {
  return (
    <div style={{ textAlign: "center", padding: "60px 32px", color: "var(--muted)" }}>
      <Icon size={32} style={{ opacity: 0.5, marginBottom: 12 }} />
      <div style={{ fontSize: 14, fontWeight: 600, color: "var(--text)" }}>{text}</div>
      {hint && <div style={{ fontSize: 12, marginTop: 4 }}>{hint}</div>}
    </div>
  );
}

function TypeToggle({ value, onChange, a = "Animes", b = "Mangás" }) {
  return (
    <div className="af-scrollx" style={{ padding: "0 16px 16px" }}>
      <button onClick={() => onChange("animes")} className={`af-chip ${value === "animes" ? "active" : ""}`}>{a}</button>
      <button onClick={() => onChange("mangas")} className={`af-chip ${value === "mangas" ? "active" : ""}`}>{b}</button>
    </div>
  );
}

/* ---------------- 4. TELAS ---------------- */

function HomeScreen({ nav, history, user, onOpenProfile }) {
  const data = api.getHome();
  const continuando = history.map((h) => api.getById(h.animeId)).filter(Boolean);
  const dest = data.destaque;
  const [a, b] = AURAS[dest.genres[0]];
  return (
    <div className="af-fade-in" style={{ paddingBottom: 90 }}>
      <div style={{ position: "relative", height: 340, borderRadius: "0 0 28px 28px", overflow: "hidden" }}>
        <div style={{ position: "absolute", inset: 0, background: `linear-gradient(150deg, ${a}55, ${b}33 55%, var(--bg) 95%)` }} />
        <div style={{ position: "absolute", inset: 0, background: "linear-gradient(0deg, var(--bg), transparent 60%)" }} />
        <div style={{ position: "absolute", top: 18, left: 16, right: 16, display: "flex", justifyContent: "space-between", alignItems: "center" }}>
          <div className="af-display" style={{ fontSize: 20, fontWeight: 800, letterSpacing: 0.5 }}>
            Anime<span style={{ color: "var(--pink)" }}>Flix</span>
          </div>
          <div style={{ position: "relative" }}>
            <button onClick={onOpenProfile} style={{
              width: 34, height: 34, borderRadius: "50%", border: "1px solid var(--line)",
              background: "linear-gradient(135deg, var(--pink), var(--violet))",
              color: "#fff", fontSize: 13, fontWeight: 700, display: "flex", alignItems: "center", justifyContent: "center",
            }}>
              {(user?.nome || "?").charAt(0).toUpperCase()}
            </button>
            {user?.ehDono && <span style={{ position: "absolute", top: -6, right: -6, fontSize: 14 }}>👑</span>}
          </div>
        </div>
        <div style={{ position: "absolute", bottom: 22, left: 16, right: 16 }}>
          <div className="af-chip" style={{ display: "inline-block", marginBottom: 10 }}>Em destaque</div>
          <div className="af-display" style={{ fontSize: 26, fontWeight: 800, lineHeight: 1.1 }}>{dest.title}</div>
          <div style={{ fontSize: 12, color: "var(--muted)", margin: "6px 0 14px", display: "flex", gap: 8 }}>
            <span>{dest.year}</span>·<span>{dest.genres.join(", ")}</span>·
            <span style={{ display: "flex", alignItems: "center", gap: 3 }}><Star size={11} fill="#ffd24d" color="#ffd24d" />{dest.rating}</span>
          </div>
          <div style={{ display: "flex", gap: 10 }}>
            <button onClick={() => nav.openDetails(dest.id)} style={{ background: "var(--text)", color: "var(--bg)", border: "none", borderRadius: 14, padding: "10px 18px", fontWeight: 700, fontSize: 13, display: "flex", alignItems: "center", gap: 6 }}>
              <Play size={15} fill="var(--bg)" /> Assistir
            </button>
            <button onClick={() => nav.openDetails(dest.id)} style={{ background: "rgba(255,255,255,.12)", color: "var(--text)", border: "1px solid var(--line)", borderRadius: 14, padding: "10px 16px", fontWeight: 600, fontSize: 13 }}>
              + Detalhes
            </button>
          </div>
        </div>
      </div>

      <div style={{ marginTop: 20 }}>
        <Row title="Continuar assistindo" icon={Clock} animes={continuando} onOpen={nav.openDetails} />
        <Row title="Em alta" icon={TrendingUp} animes={data.emAlta} onOpen={nav.openDetails} />
        <Row title="Lançamentos" icon={Tv} animes={data.lancamentos} onOpen={nav.openDetails} />
        {[...new Set(api.getAll().flatMap((a) => a.genres))].slice(0, 4).map((g) => (
          <Row key={g} title={g} animes={data.porGenero(g)} onOpen={nav.openDetails} />
        ))}
      </div>
    </div>
  );
}

function ExploreScreen({ nav }) {
  const [genero, setGenero] = useState("Todos");
  const [tipo, setTipo] = useState("Todos");
  const todosAnimes = api.getAll();
  const generosDisponiveis = [...new Set(todosAnimes.flatMap((a) => a.genres))].sort();
  const tiposDisponiveis = [...new Set(todosAnimes.map((a) => a.type).filter(Boolean))];

  let lista = todosAnimes;
  if (genero !== "Todos") lista = lista.filter((a) => a.genres.includes(genero));
  if (tipo !== "Todos") lista = lista.filter((a) => a.type === tipo);

  return (
    <div className="af-fade-in" style={{ paddingBottom: 90 }}>
      <TopBar title="Explorar" right={<span style={{ fontSize: 11, color: "var(--muted)" }}>{todosAnimes.length} títulos</span>} />
      <div className="af-scrollx" style={{ padding: "0 16px 10px" }}>
        {["Todos", ...generosDisponiveis].map((g) => (
          <button key={g} onClick={() => setGenero(g)} className={`af-chip ${genero === g ? "active" : ""}`}>{g}</button>
        ))}
      </div>
      {tiposDisponiveis.length > 1 && (
        <div className="af-scrollx" style={{ padding: "0 16px 16px" }}>
          {["Todos", ...tiposDisponiveis].map((t) => (
            <button key={t} onClick={() => setTipo(t)} className={`af-chip ${tipo === t ? "active" : ""}`}>{t === "Todos" ? "Todos os tipos" : TYPE_LABELS[t] || t.toUpperCase()}</button>
          ))}
        </div>
      )}
      <div style={{ display: "grid", gridTemplateColumns: "repeat(3, 1fr)", gap: 12, padding: "0 16px" }}>
        {lista.map((a) => <Poster key={a.id} anime={a} size="sm" onClick={() => nav.openDetails(a.id)} />)}
      </div>
      {!lista.length && <EmptyState icon={Compass} text="Nada por aqui ainda" hint="Tente outro filtro" />}
    </div>
  );
}

function MangaScreen({ nav }) {
  const [genero, setGenero] = useState("Todos");
  const [tipo, setTipo] = useState("Todos");
  const todosMangas = api.getAllMangas();
  const generosDisponiveis = [...new Set(todosMangas.flatMap((m) => m.genres))].sort();
  const tiposDisponiveis = [...new Set(todosMangas.map((m) => m.type).filter(Boolean))];

  let lista = todosMangas;
  if (genero !== "Todos") lista = lista.filter((m) => m.genres.includes(genero));
  if (tipo !== "Todos") lista = lista.filter((m) => m.type === tipo);

  return (
    <div className="af-fade-in" style={{ paddingBottom: 90 }}>
      <TopBar title="Mangás" right={<span style={{ fontSize: 11, color: "var(--muted)" }}>{todosMangas.length} títulos</span>} />
      <div className="af-scrollx" style={{ padding: "0 16px 10px" }}>
        {["Todos", ...generosDisponiveis].map((g) => (
          <button key={g} onClick={() => setGenero(g)} className={`af-chip ${genero === g ? "active" : ""}`}>{g}</button>
        ))}
      </div>
      {tiposDisponiveis.length > 1 && (
        <div className="af-scrollx" style={{ padding: "0 16px 16px" }}>
          {["Todos", ...tiposDisponiveis].map((t) => (
            <button key={t} onClick={() => setTipo(t)} className={`af-chip ${tipo === t ? "active" : ""}`}>{t === "Todos" ? "Todos os tipos" : TYPE_LABELS[t] || t.toUpperCase()}</button>
          ))}
        </div>
      )}
      <div style={{ display: "grid", gridTemplateColumns: "repeat(3, 1fr)", gap: 12, padding: "0 16px" }}>
        {lista.map((m) => <Poster key={m.id} anime={m} size="sm" onClick={() => nav.openMangaDetails(m.id)} />)}
      </div>
      {!lista.length && <EmptyState icon={BookOpen} text="Nada por aqui ainda" hint="Tente outro gênero" />}
    </div>
  );
}

function SearchScreen({ nav }) {
  const [q, setQ] = useState("");
  const [tipo, setTipo] = useState("animes");
  const results = tipo === "animes" ? api.search(q) : api.searchMangas(q);
  return (
    <div className="af-fade-in" style={{ paddingBottom: 90 }}>
      <TopBar title="Pesquisar" />
      <div style={{ padding: "0 16px 12px" }}>
        <div style={{ display: "flex", alignItems: "center", gap: 8, background: "var(--panel)", border: "1px solid var(--line)", borderRadius: 14, padding: "10px 14px" }}>
          <Search size={16} color="var(--muted)" />
          <input
            value={q}
            onChange={(e) => setQ(e.target.value)}
            placeholder={tipo === "animes" ? "Buscar animes e filmes..." : "Buscar mangás..."}
            style={{ background: "transparent", border: "none", outline: "none", color: "var(--text)", fontSize: 14, width: "100%" }}
          />
          {q && <button onClick={() => setQ("")}><X size={15} color="var(--muted)" /></button>}
        </div>
      </div>
      <TypeToggle value={tipo} onChange={setTipo} />
      {!q && <EmptyState icon={Search} text="Busque por um título" hint={tipo === "animes" ? 'Ex.: "Ronin", "Nebula", "Kaen"' : 'Ex.: "Kaen", "Maré", "Yumei"'} />}
      {q && !results.length && <EmptyState icon={Search} text="Nenhum resultado" hint={`Nada encontrado para "${q}"`} />}
      <div style={{ display: "grid", gridTemplateColumns: "repeat(3, 1fr)", gap: 12, padding: "0 16px" }}>
        {results.map((item) => (
          <Poster key={item.id} anime={item} size="sm" onClick={() => (tipo === "animes" ? nav.openDetails(item.id) : nav.openMangaDetails(item.id))} />
        ))}
      </div>
    </div>
  );
}

function DetailsScreen({ animeId, nav, favorites, toggleFavorite }) {
  const anime = api.getById(animeId);
  const [season, setSeason] = useState(anime.seasons[0].id);
  const activeSeason = anime.seasons.find((s) => s.id === season);
  const isFav = favorites.includes(anime.id);
  const [a, b] = AURAS[anime.genres[0]];

  return (
    <div className="af-fade-in" style={{ paddingBottom: 90 }}>
      <div style={{ position: "relative", height: 260 }}>
        {anime.cover && (
          <img src={anime.cover} alt="" onError={(e) => { e.currentTarget.style.display = "none"; }}
            style={{ position: "absolute", inset: 0, width: "100%", height: "100%", objectFit: "cover", opacity: 0.5 }} />
        )}
        <div style={{ position: "absolute", inset: 0, background: `linear-gradient(160deg, ${a}55, ${b}33 60%, var(--bg) 100%)` }} />
        <div style={{ position: "absolute", inset: 0, background: "linear-gradient(0deg, var(--bg), transparent 55%)" }} />
        <div style={{ position: "absolute", top: 18, left: 16 }}>
          <button onClick={nav.back} style={{ background: "rgba(10,9,18,.6)", border: "1px solid var(--line)", borderRadius: 12, padding: 8, color: "var(--text)" }}>
            <ChevronLeft size={18} />
          </button>
        </div>
      </div>

      <div style={{ padding: "0 16px", marginTop: -36, position: "relative" }}>
        <div className="af-display" style={{ fontSize: 24, fontWeight: 800 }}>{anime.title}</div>
        <div style={{ fontSize: 12, color: "var(--muted)", margin: "6px 0 14px", display: "flex", gap: 8, flexWrap: "wrap", alignItems: "center" }}>
          <span>{anime.year}</span>·<span>{anime.status}</span>·
          <span style={{ display: "flex", alignItems: "center", gap: 3 }}><Star size={11} fill="#ffd24d" color="#ffd24d" />{anime.rating}</span>
        </div>
        <div style={{ display: "flex", gap: 6, flexWrap: "wrap", marginBottom: 16 }}>
          {anime.genres.map((g) => <span key={g} className="af-chip">{g}</span>)}
        </div>

        <div style={{ display: "flex", gap: 10, marginBottom: 18 }}>
          <button onClick={() => nav.openPlayer(anime.id, activeSeason.episodes[0].id)} style={{ flex: 1, background: "var(--text)", color: "var(--bg)", border: "none", borderRadius: 14, padding: "12px 0", fontWeight: 700, fontSize: 14, display: "flex", alignItems: "center", justifyContent: "center", gap: 6 }}>
            <Play size={16} fill="var(--bg)" /> Assistir
          </button>
          <button onClick={() => toggleFavorite(anime.id)} style={{ width: 48, background: "var(--panel)", border: "1px solid var(--line)", borderRadius: 14, color: isFav ? "var(--pink)" : "var(--text)" }}>
            <Heart size={18} style={{ margin: "0 auto" }} fill={isFav ? "var(--pink)" : "none"} />
          </button>
        </div>

        <p style={{ fontSize: 13.5, lineHeight: 1.6, color: "var(--muted)", marginBottom: 20 }}>
          {anime.synopsis || "Sinopse não disponível nesta demonstração."}
        </p>

        {(anime.seasons.length > 1 || anime.seasons.reduce((n, s) => n + s.episodes.length, 0) > 1) && (
          <>
            <div className="af-scrollx" style={{ marginBottom: 12 }}>
              {anime.seasons.map((s) => (
                <button key={s.id} onClick={() => setSeason(s.id)} className={`af-chip ${season === s.id ? "active" : ""}`}>{s.title}</button>
              ))}
            </div>
            <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>
              {activeSeason.episodes.map((ep) => (
                <button key={ep.id} onClick={() => nav.openPlayer(anime.id, ep.id)} className="af-card" style={{ display: "flex", alignItems: "center", gap: 12, padding: 10, textAlign: "left" }}>
                  <div style={{ width: 64, height: 44, borderRadius: 10, background: `linear-gradient(135deg, ${a}66, ${b}44)`, display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0 }}>
                    <Play size={14} fill="var(--text)" />
                  </div>
                  <div style={{ flex: 1 }}>
                    <div style={{ fontSize: 13, fontWeight: 600 }}>{ep.number}. {ep.title}</div>
                    <div style={{ fontSize: 11, color: "var(--muted)" }}>{ep.duration}</div>
                  </div>
                </button>
              ))}
            </div>
          </>
        )}
      </div>
    </div>
  );
}

function MangaDetailsScreen({ mangaId, nav, mangaFavorites, toggleMangaFavorite }) {
  const manga = api.getMangaById(mangaId);
  const isFav = mangaFavorites.includes(manga.id);
  const [a, b] = AURAS[manga.genres[0]];

  return (
    <div className="af-fade-in" style={{ paddingBottom: 90 }}>
      <div style={{ position: "relative", height: 260 }}>
        {manga.cover && (
          <img src={manga.cover} alt="" onError={(e) => { e.currentTarget.style.display = "none"; }}
            style={{ position: "absolute", inset: 0, width: "100%", height: "100%", objectFit: "cover", opacity: 0.5 }} />
        )}
        <div style={{ position: "absolute", inset: 0, background: `linear-gradient(160deg, ${a}55, ${b}33 60%, var(--bg) 100%)` }} />
        <div style={{ position: "absolute", inset: 0, background: "linear-gradient(0deg, var(--bg), transparent 55%)" }} />
        <div style={{ position: "absolute", top: 18, left: 16 }}>
          <button onClick={nav.back} style={{ background: "rgba(10,9,18,.6)", border: "1px solid var(--line)", borderRadius: 12, padding: 8, color: "var(--text)" }}>
            <ChevronLeft size={18} />
          </button>
        </div>
      </div>

      <div style={{ padding: "0 16px", marginTop: -36, position: "relative" }}>
        <div className="af-display" style={{ fontSize: 24, fontWeight: 800 }}>{manga.title}</div>
        <div style={{ fontSize: 12, color: "var(--muted)", margin: "6px 0 14px", display: "flex", gap: 8, flexWrap: "wrap", alignItems: "center" }}>
          <span>{manga.year}</span>·<span>{manga.status}</span>·
          <span style={{ display: "flex", alignItems: "center", gap: 3 }}><Star size={11} fill="#ffd24d" color="#ffd24d" />{manga.rating}</span>
        </div>
        <div style={{ display: "flex", gap: 6, flexWrap: "wrap", marginBottom: 16 }}>
          {manga.genres.map((g) => <span key={g} className="af-chip">{g}</span>)}
        </div>

        <div style={{ display: "flex", gap: 10, marginBottom: 18 }}>
          <button onClick={() => nav.openReader(manga.id, manga.chapters[0].id)} style={{ flex: 1, background: "var(--text)", color: "var(--bg)", border: "none", borderRadius: 14, padding: "12px 0", fontWeight: 700, fontSize: 14, display: "flex", alignItems: "center", justifyContent: "center", gap: 6 }}>
            <BookOpen size={16} /> Ler
          </button>
          <button onClick={() => toggleMangaFavorite(manga.id)} style={{ width: 48, background: "var(--panel)", border: "1px solid var(--line)", borderRadius: 14, color: isFav ? "var(--pink)" : "var(--text)" }}>
            <Heart size={18} style={{ margin: "0 auto" }} fill={isFav ? "var(--pink)" : "none"} />
          </button>
        </div>

        <p style={{ fontSize: 13.5, lineHeight: 1.6, color: "var(--muted)", marginBottom: 20 }}>
          {manga.synopsis || "Sinopse não disponível nesta demonstração."}
        </p>

        <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>
          {manga.chapters.map((c) => (
            <button key={c.id} onClick={() => nav.openReader(manga.id, c.id)} className="af-card" style={{ display: "flex", alignItems: "center", gap: 12, padding: 10, textAlign: "left" }}>
              <div style={{ width: 64, height: 44, borderRadius: 10, background: `linear-gradient(135deg, ${a}66, ${b}44)`, display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0 }}>
                <BookOpen size={14} />
              </div>
              <div style={{ flex: 1 }}>
                <div style={{ fontSize: 13, fontWeight: 600 }}>{c.number}. {c.title}</div>
                <div style={{ fontSize: 11, color: "var(--muted)" }}>{c.pages} páginas</div>
              </div>
            </button>
          ))}
        </div>
      </div>
    </div>
  );
}

function PlayerScreen({ animeId, episodeId, nav }) {
  const anime = api.getById(animeId);
  const allEpisodes = anime.seasons.flatMap((s) => s.episodes);
  const epIndex = allEpisodes.findIndex((e) => e.id === episodeId);
  const episode = allEpisodes[epIndex];

  const videoRef = useRef(null);
  const [playing, setPlaying] = useState(true);
  const [progress, setProgress] = useState(0);
  const [duration, setDuration] = useState(0);
  const [muted, setMuted] = useState(false);
  const [showQuality, setShowQuality] = useState(false);
  const [quality, setQuality] = useState("1080p");
  const [legendas, setLegendas] = useState(true);

  useEffect(() => {
    const v = videoRef.current;
    if (!v) return;
    playing ? v.play().catch(() => {}) : v.pause();
  }, [playing, episodeId]);

  const fmt = (s) => `${Math.floor(s / 60)}:${String(Math.floor(s % 60)).padStart(2, "0")}`;

  return (
    <div className="af-fade-in" style={{ paddingBottom: 24 }}>
      <div style={{ position: "relative", width: "100%", aspectRatio: "16/9", background: "#000", borderRadius: "0 0 20px 20px", overflow: "hidden" }}>
        <video
          ref={videoRef}
          src={episode.videoUrl}
          autoPlay
          muted={muted}
          onTimeUpdate={(e) => setProgress(e.target.currentTime)}
          onLoadedMetadata={(e) => setDuration(e.target.duration)}
          onClick={() => setPlaying((p) => !p)}
          style={{ width: "100%", height: "100%", objectFit: "cover" }}
        />
        <div style={{ position: "absolute", top: 12, left: 12, right: 12, display: "flex", justifyContent: "space-between" }}>
          <button onClick={nav.back} style={{ background: "rgba(0,0,0,.5)", borderRadius: 10, padding: 8, color: "#fff", border: "none" }}>
            <ChevronLeft size={18} />
          </button>
          <button onClick={() => setShowQuality((s) => !s)} style={{ background: "rgba(0,0,0,.5)", borderRadius: 10, padding: 8, color: "#fff", border: "none" }}>
            <Settings size={18} />
          </button>
        </div>

        {showQuality && (
          <div style={{ position: "absolute", top: 52, right: 12, background: "rgba(10,9,18,.92)", border: "1px solid var(--line)", borderRadius: 12, padding: 8, width: 150 }}>
            <div style={{ fontSize: 11, color: "var(--muted)", padding: "4px 8px" }}>Qualidade</div>
            {["1080p", "720p", "480p", "360p"].map((q) => (
              <button key={q} onClick={() => setQuality(q)} style={{ display: "flex", justifyContent: "space-between", width: "100%", padding: "6px 8px", background: "none", border: "none", color: "var(--text)", fontSize: 13 }}>
                {q} {quality === q && <Check size={14} color="var(--pink)" />}
              </button>
            ))}
            <div style={{ fontSize: 11, color: "var(--muted)", padding: "8px 8px 4px", borderTop: "1px solid var(--line)", marginTop: 4 }}>Legendas</div>
            <button onClick={() => setLegendas((l) => !l)} style={{ display: "flex", justifyContent: "space-between", width: "100%", padding: "6px 8px", background: "none", border: "none", color: "var(--text)", fontSize: 13 }}>
              <span style={{ display: "flex", alignItems: "center", gap: 6 }}><Captions size={14} /> Português</span>
              {legendas && <Check size={14} color="var(--pink)" />}
            </button>
          </div>
        )}

        <div style={{ position: "absolute", bottom: 0, left: 0, right: 0, padding: "24px 12px 10px", background: "linear-gradient(0deg, rgba(0,0,0,.75), transparent)" }}>
          <div style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 8 }}>
            <span style={{ fontSize: 10, color: "#fff" }}>{fmt(progress)}</span>
            <div className="af-progress" style={{ flex: 1 }}>
              <div style={{ width: `${duration ? (progress / duration) * 100 : 0}%` }} />
            </div>
            <span style={{ fontSize: 10, color: "#fff" }}>{fmt(duration || 0)}</span>
          </div>
          <div style={{ display: "flex", alignItems: "center", justifyContent: "center", gap: 26 }}>
            <button disabled={epIndex <= 0} onClick={() => nav.openPlayer(animeId, allEpisodes[epIndex - 1].id)} style={{ opacity: epIndex <= 0 ? 0.3 : 1, background: "none", border: "none", color: "#fff" }}>
              <SkipBack size={20} fill="#fff" />
            </button>
            <button onClick={() => setPlaying((p) => !p)} style={{ background: "#fff", borderRadius: "50%", width: 44, height: 44, display: "flex", alignItems: "center", justifyContent: "center", border: "none" }}>
              {playing ? <Pause size={18} fill="#000" color="#000" /> : <Play size={18} fill="#000" color="#000" />}
            </button>
            <button disabled={epIndex >= allEpisodes.length - 1} onClick={() => nav.openPlayer(animeId, allEpisodes[epIndex + 1].id)} style={{ opacity: epIndex >= allEpisodes.length - 1 ? 0.3 : 1, background: "none", border: "none", color: "#fff" }}>
              <SkipForward size={20} fill="#fff" />
            </button>
            <button onClick={() => setMuted((m) => !m)} style={{ background: "none", border: "none", color: "#fff", marginLeft: 10 }}>
              {muted ? <VolumeX size={18} /> : <Volume2 size={18} />}
            </button>
            <button style={{ background: "none", border: "none", color: "#fff" }}><Maximize size={18} /></button>
          </div>
        </div>
      </div>

      <div style={{ padding: 16 }}>
        <div style={{ fontSize: 11, color: "var(--pink)", fontWeight: 700, marginBottom: 2 }}>{anime.title}</div>
        <div className="af-display" style={{ fontSize: 18, fontWeight: 800 }}>{episode.number}. {episode.title}</div>
        <div style={{ fontSize: 12, color: "var(--muted)", marginTop: 4 }}>{quality} · Legendas {legendas ? "ativadas" : "desativadas"}</div>
      </div>
    </div>
  );
}

function ReaderScreen({ mangaId, chapterId, nav }) {
  const manga = api.getMangaById(mangaId);
  const chIndex = manga.chapters.findIndex((c) => c.id === chapterId);
  const chapter = manga.chapters[chIndex];
  const [page, setPage] = useState(1);
  const [a, b] = AURAS[manga.genres[0]];

  useEffect(() => setPage(1), [chapterId]);
  useEffect(() => { nav.saveLeitura(manga.id, chapter.id, chapter.title, page, chapter.pages); }, [page, chapter.id]); // eslint-disable-line

  const irPara = (p) => setPage(Math.min(Math.max(p, 1), chapter.pages));
  const proximoCapitulo = chIndex < manga.chapters.length - 1 ? manga.chapters[chIndex + 1] : null;

  return (
    <div className="af-fade-in" style={{ paddingBottom: 24 }}>
      <div style={{ padding: "14px 16px 10px" }}>
        <div style={{ display: "flex", alignItems: "center", gap: 10, marginBottom: 10 }}>
          <button onClick={nav.back} style={{ background: "var(--panel)", border: "1px solid var(--line)", borderRadius: 12, padding: 8, color: "var(--text)" }}>
            <ChevronLeft size={18} />
          </button>
          <div style={{ flex: 1 }}>
            <div style={{ fontSize: 11, color: "var(--pink)", fontWeight: 700 }}>{manga.title}</div>
            <div className="af-display" style={{ fontSize: 15, fontWeight: 800 }}>{chapter.number}. {chapter.title}</div>
          </div>
        </div>
        <div style={{ display: "flex", gap: 4 }}>
          {Array.from({ length: chapter.pages }).map((_, i) => (
            <div key={i} style={{ flex: 1, height: 3, borderRadius: 999, background: i < page ? "linear-gradient(90deg, var(--pink), var(--violet))" : "var(--line)" }} />
          ))}
        </div>
      </div>

      <div
        onClick={(e) => {
          const half = e.currentTarget.clientWidth / 2;
          irPara(e.nativeEvent.offsetX < half ? page - 1 : page + 1);
        }}
        style={{
          margin: "4px 16px", aspectRatio: "3/4", borderRadius: 20, position: "relative", overflow: "hidden",
          background: `linear-gradient(160deg, ${a}44, ${b}33 60%, var(--panel) 100%)`,
          border: "1px solid var(--line)", display: "flex", alignItems: "center", justifyContent: "center", cursor: "pointer",
        }}
      >
        <BookOpen size={40} color="var(--muted)" style={{ opacity: 0.4 }} />
        <div className="af-display" style={{ position: "absolute", bottom: 16, right: 18, fontSize: 13, color: "var(--muted)" }}>
          Página {page} / {chapter.pages}
        </div>
      </div>

      <div style={{ display: "flex", justifyContent: "space-between", padding: 16, gap: 10 }}>
        <button disabled={page <= 1} onClick={() => irPara(page - 1)} style={{ opacity: page <= 1 ? 0.4 : 1, flex: 1, background: "var(--panel)", border: "1px solid var(--line)", borderRadius: 14, padding: "12px 0", color: "var(--text)", display: "flex", alignItems: "center", justifyContent: "center", gap: 6 }}>
          <ChevronLeft size={16} /> Anterior
        </button>
        {page < chapter.pages ? (
          <button onClick={() => irPara(page + 1)} style={{ flex: 1, background: "var(--text)", border: "none", borderRadius: 14, padding: "12px 0", color: "var(--bg)", fontWeight: 700, display: "flex", alignItems: "center", justifyContent: "center", gap: 6 }}>
            Próxima <ChevronRight size={16} />
          </button>
        ) : proximoCapitulo ? (
          <button onClick={() => nav.openReader(manga.id, proximoCapitulo.id)} style={{ flex: 1, background: "var(--text)", border: "none", borderRadius: 14, padding: "12px 0", color: "var(--bg)", fontWeight: 700 }}>
            Próximo capítulo
          </button>
        ) : (
          <button onClick={nav.back} style={{ flex: 1, background: "var(--panel-2)", border: "1px solid var(--line)", borderRadius: 14, padding: "12px 0", color: "var(--text)", fontWeight: 700 }}>
            Concluído
          </button>
        )}
      </div>
    </div>
  );
}

function FavoritesScreen({ nav, favorites, mangaFavorites }) {
  const [tipo, setTipo] = useState("animes");
  const lista = tipo === "animes"
    ? favorites.map((id) => api.getById(id)).filter(Boolean)
    : mangaFavorites.map((id) => api.getMangaById(id)).filter(Boolean);
  return (
    <div className="af-fade-in" style={{ paddingBottom: 90 }}>
      <TopBar title="Favoritos" />
      <TypeToggle value={tipo} onChange={setTipo} />
      {!lista.length && <EmptyState icon={Heart} text="Sua lista está vazia" hint="Toque no coração em qualquer título" />}
      <div style={{ display: "grid", gridTemplateColumns: "repeat(3, 1fr)", gap: 12, padding: "0 16px" }}>
        {lista.map((item) => (
          <Poster key={item.id} anime={item} size="sm" onClick={() => (tipo === "animes" ? nav.openDetails(item.id) : nav.openMangaDetails(item.id))} />
        ))}
      </div>
    </div>
  );
}

function HistoryScreen({ nav, history, leitura, clearHistory }) {
  const [tipo, setTipo] = useState("assistidos");
  return (
    <div className="af-fade-in" style={{ paddingBottom: 90 }}>
      <TopBar
        title="Histórico"
        right={tipo === "assistidos" && history.length ? (
          <button onClick={clearHistory} style={{ fontSize: 12, color: "var(--muted)", background: "none", border: "none" }}>Limpar</button>
        ) : null}
      />
      <div className="af-scrollx" style={{ padding: "0 16px 16px" }}>
        <button onClick={() => setTipo("assistidos")} className={`af-chip ${tipo === "assistidos" ? "active" : ""}`}>Assistidos</button>
        <button onClick={() => setTipo("lidos")} className={`af-chip ${tipo === "lidos" ? "active" : ""}`}>Lidos</button>
      </div>

      {tipo === "assistidos" ? (
        <>
          {!history.length && <EmptyState icon={Clock} text="Nada assistido ainda" hint="Seus episódios recentes aparecem aqui" />}
          <div style={{ display: "flex", flexDirection: "column", gap: 10, padding: "0 16px" }}>
            {history.map((h) => {
              const anime = api.getById(h.animeId);
              if (!anime) return null;
              const [a, b] = AURAS[anime.genres[0]];
              return (
                <button key={h.episodeId} onClick={() => nav.openPlayer(h.animeId, h.episodeId)} className="af-card" style={{ display: "flex", gap: 12, padding: 10, textAlign: "left" }}>
                  <div style={{ width: 72, height: 50, borderRadius: 10, background: `linear-gradient(135deg, ${a}66, ${b}44)`, flexShrink: 0, display: "flex", alignItems: "center", justifyContent: "center" }}>
                    <Play size={14} fill="var(--text)" />
                  </div>
                  <div style={{ flex: 1 }}>
                    <div style={{ fontSize: 13, fontWeight: 600 }}>{anime.title}</div>
                    <div style={{ fontSize: 11, color: "var(--muted)", marginBottom: 6 }}>{h.episodeTitle}</div>
                    <div className="af-progress"><div style={{ width: `${h.progress}%` }} /></div>
                  </div>
                </button>
              );
            })}
          </div>
        </>
      ) : (
        <>
          {!leitura.length && <EmptyState icon={BookOpen} text="Nada lido ainda" hint="Seus capítulos recentes aparecem aqui" />}
          <div style={{ display: "flex", flexDirection: "column", gap: 10, padding: "0 16px" }}>
            {leitura.map((l) => {
              const manga = api.getMangaById(l.mangaId);
              if (!manga) return null;
              const [a, b] = AURAS[manga.genres[0]];
              const pct = Math.round((l.page / l.totalPages) * 100);
              return (
                <button key={l.chapterId} onClick={() => nav.openReader(l.mangaId, l.chapterId)} className="af-card" style={{ display: "flex", gap: 12, padding: 10, textAlign: "left" }}>
                  <div style={{ width: 72, height: 50, borderRadius: 10, background: `linear-gradient(135deg, ${a}66, ${b}44)`, flexShrink: 0, display: "flex", alignItems: "center", justifyContent: "center" }}>
                    <BookOpen size={14} />
                  </div>
                  <div style={{ flex: 1 }}>
                    <div style={{ fontSize: 13, fontWeight: 600 }}>{manga.title}</div>
                    <div style={{ fontSize: 11, color: "var(--muted)", marginBottom: 6 }}>{l.chapterTitle} · pág. {l.page}/{l.totalPages}</div>
                    <div className="af-progress"><div style={{ width: `${pct}%` }} /></div>
                  </div>
                </button>
              );
            })}
          </div>
        </>
      )}
    </div>
  );
}

function ProfileSheet({ user, online, onClose, onLogout }) {
  return (
    <div onClick={onClose} style={{ position: "fixed", inset: 0, background: "rgba(0,0,0,.55)", display: "flex", alignItems: "flex-end", zIndex: 50 }}>
      <div onClick={(e) => e.stopPropagation()} className="af-fade-in" style={{
        width: "100%", maxWidth: 480, margin: "0 auto", background: "var(--panel)",
        borderRadius: "24px 24px 0 0", padding: 20, border: "1px solid var(--line)", borderBottom: "none",
      }}>
        <div style={{ width: 36, height: 4, background: "var(--line)", borderRadius: 999, margin: "0 auto 18px" }} />
        <div style={{ display: "flex", alignItems: "center", gap: 12, marginBottom: 14 }}>
          <div style={{ position: "relative" }}>
            <div style={{ width: 46, height: 46, borderRadius: "50%", background: "linear-gradient(135deg, var(--pink), var(--violet))", display: "flex", alignItems: "center", justifyContent: "center", fontSize: 17, fontWeight: 700 }}>
              {(user?.nome || "?").charAt(0).toUpperCase()}
            </div>
            {user?.ehDono && <span style={{ position: "absolute", top: -6, right: -6, fontSize: 16 }}>👑</span>}
          </div>
          <div>
            <div style={{ fontSize: 15, fontWeight: 700, display: "flex", alignItems: "center", gap: 6 }}>
              {user?.nome} {user?.ehDono && <span title="Dono do app">👑</span>}
            </div>
            <div style={{ fontSize: 12.5, color: "var(--muted)" }}>{user?.email}</div>
          </div>
        </div>
        <div style={{ display: "flex", alignItems: "center", gap: 6, fontSize: 11, color: "var(--muted)", marginBottom: 18 }}>
          <span style={{ width: 6, height: 6, borderRadius: "50%", background: online ? "#4dffb0" : "var(--muted)" }} />
          {online ? "Conectado à API" : "Modo local (API offline — usando catálogo de demonstração)"}
        </div>
        <button onClick={onLogout} style={{
          width: "100%", display: "flex", alignItems: "center", justifyContent: "center", gap: 8,
          background: "var(--panel-2)", border: "1px solid var(--line)", borderRadius: 14,
          padding: "12px 0", color: "var(--pink)", fontWeight: 600, fontSize: 14,
        }}>
          <LogOut size={16} /> Sair da conta
        </button>
      </div>
    </div>
  );
}

/* ---------------- 5. APP (navegação + estado) ---------------- */

const TABS = [
  { id: "home", label: "Início", icon: Home },
  { id: "explore", label: "Explorar", icon: Compass },
  { id: "manga", label: "Mangás", icon: BookOpen },
  { id: "search", label: "Buscar", icon: Search },
  { id: "favorites", label: "Favoritos", icon: Heart },
  { id: "history", label: "Histórico", icon: Clock },
];

export default function App() {
  const [user, setUser] = useState(null);
  const [showProfile, setShowProfile] = useState(false);
  const [tab, setTab] = useState("home");
  const [route, setRoute] = useState({ screen: "tabs" });
  const [catalogLoading, setCatalogLoading] = useState(true);
  const [online, setOnline] = useState(false);
  const [favorites, setFavorites] = useState([]);
  const [mangaFavorites, setMangaFavorites] = useState([]);
  const [history, setHistory] = useState([]);
  const [leitura, setLeitura] = useState([]);

  useEffect(() => {
    if (!user) return;
    let vivo = true;
    setCatalogLoading(true);
    api.loadCatalog().then(({ online }) => {
      if (!vivo) return;
      setOnline(online);
      setCatalogLoading(false);
    });
    return () => { vivo = false; };
  }, [user]);

  if (!user) return <AuthScreen onAuth={setUser} />;
  if (catalogLoading) return <CatalogLoadingScreen />;

  const nav = {
    openDetails: (id) => setRoute({ screen: "details", animeId: id }),
    openMangaDetails: (id) => setRoute({ screen: "manga-details", mangaId: id }),
    openPlayer: (animeId, episodeId) => {
      const anime = api.getById(animeId);
      const ep = anime.seasons.flatMap((s) => s.episodes).find((e) => e.id === episodeId);
      setHistory((h) => {
        const rest = h.filter((x) => x.episodeId !== episodeId);
        return [{ animeId, episodeId, episodeTitle: ep.title, progress: Math.floor(Math.random() * 40) + 10 }, ...rest].slice(0, 12);
      });
      api.syncHistorico(episodeId, Math.floor(Math.random() * 400) + 60);
      setRoute({ screen: "player", animeId, episodeId });
    },
    openReader: (mangaId, chapterId) => setRoute({ screen: "reader", mangaId, chapterId }),
    saveLeitura: (mangaId, chapterId, chapterTitle, page, totalPages) => {
      setLeitura((l) => {
        const rest = l.filter((x) => x.chapterId !== chapterId);
        return [{ mangaId, chapterId, chapterTitle, page, totalPages }, ...rest].slice(0, 12);
      });
      api.syncLeitura(chapterId, page);
    },
    back: () => setRoute({ screen: "tabs" }),
  };

  const toggleFavorite = (id) =>
    setFavorites((f) => {
      const isFav = f.includes(id);
      api.syncFavorite(id, !isFav);
      return isFav ? f.filter((x) => x !== id) : [...f, id];
    });

  const toggleMangaFavorite = (id) =>
    setMangaFavorites((f) => {
      const isFav = f.includes(id);
      api.syncMangaFavorite(id, !isFav);
      return isFav ? f.filter((x) => x !== id) : [...f, id];
    });

  const clearHistory = () => setHistory([]);

  let content;
  if (route.screen === "details") content = <DetailsScreen animeId={route.animeId} nav={nav} favorites={favorites} toggleFavorite={toggleFavorite} />;
  else if (route.screen === "manga-details") content = <MangaDetailsScreen mangaId={route.mangaId} nav={nav} mangaFavorites={mangaFavorites} toggleMangaFavorite={toggleMangaFavorite} />;
  else if (route.screen === "player") content = <PlayerScreen animeId={route.animeId} episodeId={route.episodeId} nav={nav} />;
  else if (route.screen === "reader") content = <ReaderScreen mangaId={route.mangaId} chapterId={route.chapterId} nav={nav} />;
  else {
    const navTabs = { ...nav, back: () => {} };
    content = {
      home: <HomeScreen nav={navTabs} history={history} user={user} onOpenProfile={() => setShowProfile(true)} />,
      explore: <ExploreScreen nav={navTabs} />,
      manga: <MangaScreen nav={navTabs} />,
      search: <SearchScreen nav={navTabs} />,
      favorites: <FavoritesScreen nav={navTabs} favorites={favorites} mangaFavorites={mangaFavorites} />,
      history: <HistoryScreen nav={navTabs} history={history} leitura={leitura} clearHistory={clearHistory} />,
    }[tab];
  }

  return (
    <div className="af-root">
      <GlobalStyle />
      {content}

      {route.screen === "tabs" && (
        <div style={{
          position: "fixed", bottom: 14, left: "50%", transform: "translateX(-50%)",
          width: "calc(100% - 32px)", maxWidth: 448,
          background: "rgba(20,18,31,.92)", backdropFilter: "blur(10px)",
          border: "1px solid var(--line)", borderRadius: 22,
          display: "flex", padding: "4px 4px", boxShadow: "0 12px 30px -10px #00000088",
        }}>
          {TABS.map((t) => {
            const Icon = t.icon;
            const active = tab === t.id;
            return (
              <button key={t.id} onClick={() => setTab(t.id)} className={`af-navbtn ${active ? "active" : ""}`}>
                <Icon size={18} strokeWidth={active ? 2.4 : 2} />
                <span style={{ fontSize: 9, fontWeight: active ? 700 : 500 }}>{t.label}</span>
                {active && <span className="af-navdot" />}
              </button>
            );
          })}
        </div>
      )}

      {showProfile && (
        <ProfileSheet
          user={user}
          online={online}
          onClose={() => setShowProfile(false)}
          onLogout={() => {
            authApi.logout();
            setShowProfile(false);
            setUser(null);
            setRoute({ screen: "tabs" });
            setTab("home");
          }}
        />
      )}
    </div>
  );
}
