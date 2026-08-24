# AnimeFlix — Backend

API REST simples (Express + SQLite) para o app AnimeFlix. Sem dependências
de infraestrutura externa: o banco é um único arquivo `.db` local.

## Como rodar

```bash
cd animeflix-backend
cp .env.example .env      # ajuste o JWT_SECRET
npm install
npm run seed               # popula o banco com o catálogo fictício de demonstração
npm start                  # sobe em http://localhost:3333
```

## Catálogo grande e real (opcional)

```bash
npm run import:jikan
```

Importa um catálogo **real e grande**, de **todos os tipos**, a partir da
[Jikan API](https://jikan.moe) (wrapper público e gratuito do MyAnimeList,
sem necessidade de chave):
- Animes: TV, Filme, OVA, ONA e Especial
- Mangás: Mangá, Novel, Manhwa (inclui webtoons — no MyAnimeList entram
  nessa categoria), Manhua e One-shot

Traz **nome completo, ano, tipo, gêneros, nota e a capa oficial** de cada
título (a imagem que a própria API já devolve). Por padrão importa até
~1.000 títulos por tipo — configurável em `JIKAN_PAGINAS_POR_TIPO` no `.env`
— totalizando uns 5.000 animes e 5.000 mangás. "Absolutamente todos" os
títulos do MyAnimeList (dezenas de milhares) não é algo que dá pra puxar de
verdade: a API pública tem limite de requisições, e baixar tudo levaria
dias além de sobrecarregar um serviço gratuito e compartilhado — mas o
volume padrão já cobre uma biblioteca bem ampla, e dá pra aumentar ainda
mais no `.env` se quiser.

**O que não é importado, de propósito:** sinopses originais (evita
reproduzir em massa texto protegido por direitos autorais — o app mostra
"Sinopse não disponível" para títulos importados). Os vídeos dos episódios
continuam sendo só as amostras de licença aberta já usadas em todo o app.

Pode ser executado de novo a qualquer momento — ele apaga só o que foi
importado antes (`origem = 'jikan'`), sem tocar no catálogo fictício de
demonstração. Precisa de Node 18+ e acesso à internet (respeita o limite de
requisições da API pública, então com o volume padrão leva uns 20-30
minutos).

## Rotas

### Autenticação (pública)
| Método | Rota | Descrição |
|---|---|---|
| POST | `/api/auth/register` | `{ nome, email, senha }` → cria conta e retorna token |
| POST | `/api/auth/login` | `{ email, senha }` → aceita email OU usuário; retorna token |
| GET | `/api/auth/me` | *(autenticada)* dados do usuário logado |

### Animes (pública)
| Método | Rota | Descrição |
|---|---|---|
| GET | `/api/animes` | lista paginada — filtros `?genero=` `?tipo=` `?busca=` `?pagina=` |
| GET | `/api/animes/tipos` | tipos disponíveis no catálogo (tv, movie, ova...) |
| GET | `/api/animes/destaques` | dados prontos para a tela Inicial |
| GET | `/api/animes/:id` | detalhes + temporadas + episódios |

### Mangás (pública)
| Método | Rota | Descrição |
|---|---|---|
| GET | `/api/mangas` | lista paginada — filtros `?genero=` `?tipo=` `?busca=` `?pagina=` |
| GET | `/api/mangas/tipos` | tipos disponíveis no catálogo (manga, novel, manhwa...) |
| GET | `/api/mangas/destaques` | dados prontos para a aba Mangás |
| GET | `/api/mangas/:id` | detalhes + capítulos |

### Gêneros (pública, compartilhada entre animes e mangás)
| Método | Rota | Descrição |
|---|---|---|
| GET | `/api/generos` | lista de gêneros |

### Autenticadas (header `Authorization: Bearer <token>`)
| Método | Rota | Descrição |
|---|---|---|
| GET | `/api/me/favoritos` | favoritos de animes |
| POST/DELETE | `/api/me/favoritos/:animeId` | adiciona/remove favorito |
| GET | `/api/me/historico` | histórico de episódios assistidos |
| POST | `/api/me/historico` | `{ episodioId, progressoSegundos }` |
| DELETE | `/api/me/historico` | limpa o histórico |
| GET | `/api/me/favoritos-mangas` | favoritos de mangás |
| POST/DELETE | `/api/me/favoritos-mangas/:mangaId` | adiciona/remove favorito |
| GET | `/api/me/leitura` | progresso de leitura de capítulos |
| POST | `/api/me/leitura` | `{ capituloId, paginaAtual }` |

## Ligado ao app

O `AnimeFlix.jsx` já consome esta API via `fetch` (camada `services` dentro
do componente). Se a API não responder — por exemplo, rodando só o preview
sem o backend de pé — o app cai automaticamente para os dados mock, então a
demonstração nunca quebra.
