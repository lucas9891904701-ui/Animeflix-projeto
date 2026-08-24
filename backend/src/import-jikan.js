// src/import-jikan.js
//
// Importa um catálogo GRANDE e REAL de animes e mangás — de todos os
// tipos (TV, Filme, OVA, ONA, Especial / Mangá, Novel, Manhwa — inclui
// webtoons, que no MyAnimeList entram como "manhwa" —, Manhua, One-shot)
// — a partir da Jikan API (https://jikan.moe), um wrapper público e
// não-oficial e gratuito do MyAnimeList. Não exige chave de API.
//
// "Absolutamente todos" os títulos do MyAnimeList (dezenas de milhares)
// não é algo que dá pra puxar de verdade aqui: a API pública tem limite
// de requisições, e baixar tudo levaria dias além de sobrecarregar um
// serviço gratuito e compartilhado. Este script traz um catálogo bem
// grande (milhares de títulos, todos os tipos) por padrão, e o volume é
// ajustável via JIKAN_PAGINAS_POR_TIPO no .env se você quiser mais.
//
// O que é importado: título completo, ano, tipo, gêneros, nota e a
// CAPA OFICIAL (imagem que a própria API já devolve, hospedada no CDN
// do MyAnimeList — o uso normal desse tipo de app de catálogo).
// O que NÃO é importado, de propósito: sinopses originais (evita
// reproduzir em massa texto protegido por direitos autorais). Os
// vídeos dos episódios continuam sendo só as amostras de licença
// aberta já usadas em todo o app — nenhum conteúdo audiovisual real
// e protegido é referenciado.
//
// Uso:  npm run import:jikan
// Requer Node 18+ (fetch nativo) e acesso à internet. Respeita o
// limite de requisições da API pública (roda devagar de propósito —
// com o volume padrão, leva uns 20-30 minutos).

require("dotenv").config();
const db = require("./db");

const JIKAN_BASE = "https://api.jikan.moe/v4";
const ANIME_TYPES = ["tv", "movie", "ova", "ona", "special"];
const MANGA_TYPES = ["manga", "novel", "manhwa", "manhua", "oneshot"];
const PAGINAS_POR_TIPO = Number(process.env.JIKAN_PAGINAS_POR_TIPO) || 40; // 40 páginas x 25 = até 1.000 por tipo (~5.000 animes + ~5.000 mangás)
const ATRASO_MS = 900; // ~1 requisição/segundo — dentro do limite público da Jikan

const SAMPLE_VIDEOS = [
  "https://commondatastorage.googleapis.com/gtv-videos-bucket/sample/BigBuckBunny.mp4",
  "https://commondatastorage.googleapis.com/gtv-videos-bucket/sample/ElephantsDream.mp4",
];

const PALETA = [
  ["#ff4d6d", "#7c5cff"], ["#ff9d4d", "#ff4d6d"], ["#7c5cff", "#4dd9ff"],
  ["#4dd9ff", "#7c5cff"], ["#ff4d9e", "#7c5cff"], ["#ffd24d", "#ff8a4d"],
  ["#4dffb0", "#4dd9ff"], ["#ff4d4d", "#7c5cff"], ["#9490ab", "#4dd9ff"],
];

function esperar(ms) {
  return new Promise((r) => setTimeout(r, ms));
}

async function buscarJikan(caminho) {
  const res = await fetch(`${JIKAN_BASE}${caminho}`);
  if (res.status === 429) {
    // limite de taxa atingido — espera mais um pouco e tenta de novo
    await esperar(3000);
    return buscarJikan(caminho);
  }
  if (!res.ok) throw new Error(`Jikan respondeu ${res.status} em ${caminho}`);
  return res.json();
}

function capaDe(item) {
  return item.images?.webp?.image_url || item.images?.jpg?.image_url || null;
}

function generoId(cache, nome) {
  if (cache.has(nome)) return cache.get(nome);
  db.prepare("INSERT OR IGNORE INTO generos (nome) VALUES (?)").run(nome);
  const { id } = db.prepare("SELECT id FROM generos WHERE nome = ?").get(nome);
  cache.set(nome, id);
  return id;
}

function limparCatalogoImportadoAnterior() {
  db.exec(`
    DELETE FROM episodios WHERE temporada_id IN (SELECT id FROM temporadas WHERE anime_id IN (SELECT id FROM animes WHERE origem = 'jikan'));
    DELETE FROM temporadas WHERE anime_id IN (SELECT id FROM animes WHERE origem = 'jikan');
    DELETE FROM anime_generos WHERE anime_id IN (SELECT id FROM animes WHERE origem = 'jikan');
    DELETE FROM animes WHERE origem = 'jikan';
    DELETE FROM capitulos WHERE manga_id IN (SELECT id FROM mangas WHERE origem = 'jikan');
    DELETE FROM manga_generos WHERE manga_id IN (SELECT id FROM mangas WHERE origem = 'jikan');
    DELETE FROM mangas WHERE origem = 'jikan';
  `);
}

async function importarAnimes(cacheGeneros) {
  const insAnime = db.prepare(
    "INSERT INTO animes (titulo, sinopse, ano, status, tipo, avaliacao, cor_a, cor_b, capa_url, origem) VALUES (?, NULL, ?, ?, ?, ?, ?, ?, ?, 'jikan')"
  );
  const insGeneroLink = db.prepare("INSERT OR IGNORE INTO anime_generos (anime_id, genero_id) VALUES (?, ?)");
  const insTemporada = db.prepare("INSERT INTO temporadas (anime_id, numero, titulo) VALUES (?, 1, 'Temporada 1')");
  const insEpisodio = db.prepare("INSERT INTO episodios (temporada_id, numero, titulo, duracao, video_url) VALUES (?, ?, ?, ?, ?)");
  const vistos = new Set(); // evita duplicar títulos que aparecem em mais de uma página/ordenação

  let total = 0;
  for (const tipo of ANIME_TYPES) {
    for (let pagina = 1; pagina <= PAGINAS_POR_TIPO; pagina++) {
      console.log(`  animes/${tipo} — página ${pagina}/${PAGINAS_POR_TIPO}`);
      const dados = await buscarJikan(`/anime?type=${tipo}&order_by=popularity&page=${pagina}&limit=25`);
      if (!dados.data?.length) break; // acabaram os resultados desse tipo, não precisa continuar paginando

      for (const item of dados.data) {
        const titulo = item.title_english || item.title;
        if (!titulo || vistos.has(`${titulo}|${tipo}`)) continue;
        vistos.add(`${titulo}|${tipo}`);

        const ano = item.year || item.aired?.prop?.from?.year || null;
        const numEpisodios = Math.max(1, Math.min(item.episodes || 1, 12)); // limita placeholders por título
        const cores = PALETA[total % PALETA.length];

        const animeId = insAnime.run(titulo, ano, item.status || null, tipo, item.score || 0, cores[0], cores[1], capaDe(item)).lastInsertRowid;

        for (const g of item.genres || []) insGeneroLink.run(animeId, generoId(cacheGeneros, g.name));

        const temporadaId = insTemporada.run(animeId).lastInsertRowid;
        for (let i = 1; i <= numEpisodios; i++) {
          insEpisodio.run(temporadaId, i, `Episódio ${i}`, "24 min", SAMPLE_VIDEOS[i % 2]);
        }

        total++;
      }
      await esperar(ATRASO_MS);
    }
  }
  return total;
}

async function importarMangas(cacheGeneros) {
  const insManga = db.prepare(
    "INSERT INTO mangas (titulo, sinopse, ano, status, tipo, avaliacao, cor_a, cor_b, capa_url, origem) VALUES (?, NULL, ?, ?, ?, ?, ?, ?, ?, 'jikan')"
  );
  const insGeneroLink = db.prepare("INSERT OR IGNORE INTO manga_generos (manga_id, genero_id) VALUES (?, ?)");
  const insCapitulo = db.prepare("INSERT INTO capitulos (manga_id, numero, titulo, paginas) VALUES (?, ?, ?, ?)");
  const vistos = new Set();

  let total = 0;
  for (const tipo of MANGA_TYPES) {
    for (let pagina = 1; pagina <= PAGINAS_POR_TIPO; pagina++) {
      console.log(`  mangas/${tipo} — página ${pagina}/${PAGINAS_POR_TIPO}`);
      const dados = await buscarJikan(`/manga?type=${tipo}&order_by=popularity&page=${pagina}&limit=25`);
      if (!dados.data?.length) break;

      for (const item of dados.data) {
        const titulo = item.title_english || item.title;
        if (!titulo || vistos.has(`${titulo}|${tipo}`)) continue;
        vistos.add(`${titulo}|${tipo}`);

        const ano = item.published?.prop?.from?.year || null;
        const numCapitulos = Math.max(1, Math.min(item.chapters || 1, 8)); // limita placeholders por título
        const cores = PALETA[total % PALETA.length];

        const mangaId = insManga.run(titulo, ano, item.status || null, tipo, item.score || 0, cores[0], cores[1], capaDe(item)).lastInsertRowid;

        for (const g of item.genres || []) insGeneroLink.run(mangaId, generoId(cacheGeneros, g.name));

        for (let i = 1; i <= numCapitulos; i++) {
          insCapitulo.run(mangaId, i, `Capítulo ${i}`, 16 + ((i * 3) % 12));
        }

        total++;
      }
      await esperar(ATRASO_MS);
    }
  }
  return total;
}

async function main() {
  console.log("Importando catálogo real da Jikan API — com o volume padrão, leva uns 20-30 minutos (respeitando o limite de requisições)...\n");

  limparCatalogoImportadoAnterior(); // reexecutável: não duplica nem mexe no catálogo mock

  const cacheGeneros = new Map();
  const totalAnimes = await importarAnimes(cacheGeneros);
  const totalMangas = await importarMangas(cacheGeneros);

  console.log(`\nConcluído: ${totalAnimes} animes e ${totalMangas} mangás importados, cobrindo todos os tipos configurados, com capa oficial e nome completo.`);
  console.log("Fonte: Jikan API (https://jikan.moe), dados públicos do MyAnimeList.");
  console.log("Ajuste JIKAN_PAGINAS_POR_TIPO no .env para importar ainda mais (ou menos) por tipo.");
}

main().catch((e) => {
  console.error("Falha na importação:", e.message);
  process.exit(1);
});
