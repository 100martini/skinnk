# Skinny link? skinnk ↔

url shortener that actually shortens things.

## quickest start (docker)

```bash
make up
```

that's it. open `http://localhost:3001`.

## features

- REST API with full CRUD for links
- 301 redirects with click tracking
- 7-day analytics with daily breakdown and top referrers
- QR code generation (png and svg)
- server-side url and slug validation
- auto-generated 6-char slugs (nanoid)
- link expiry with configurable TTL (1-90 days)
- graveyard cron that auto-deletes expired links after 7 day grace period
- click deduplication (same IP, same link, 60 second window)
- per-IP creation rate limit (10 links/minute)
- global API rate limiting (100 req/15min)
- optional API key authentication (x-api-key header)
- branded 404/410 error pages for dead and expired links
- bulk delete (up to 50 at once)

## manual start

### backend

```bash
npm install
cp .env.example .env
npx prisma migrate dev --name init
npm run db:seed
npm run dev
```

### frontend

```bash
cd client
npm install
npm run dev
```

## api key (optional)

set `API_KEY` in your `.env` or docker-compose environment. all `/api` routes will require `x-api-key` header. leave it unset for open access.

## makefile commands

| command | what it does |
|---|---|
| `make up` | build and start everything |
| `make down` | stop and remove containers |
| `make restart` | restart the api |
| `make logs` | tail api logs |
| `make seed` | seed test data |
| `make test` | create a link and list all links |
| `make health` | check if the api is alive |
| `make shell` | open a shell in the api container |
| `make db-shell` | open psql in the database |
| `make clean` | nuke everything including data |
| `make status` | show container status |

## api

| method | endpoint | what |
|---|---|---|
| POST | /api/links | create a link (10/min per IP) |
| GET | /api/links | list links (paginated, searchable) |
| GET | /api/links/:slug | get one link |
| GET | /api/links/:slug/stats | analytics (clicks, referrers, 7d breakdown) |
| GET | /api/links/:slug/qr | qr code (png or svg) |
| PATCH | /api/links/:slug | update destination or expiry |
| DELETE | /api/links/:slug | delete a link |
| POST | /api/links/bulk-delete | delete multiple links |
| GET | /api/stats | global stats |
| GET | /:slug | redirect (301) + track click |
| GET | /health | health check |

## tech

express, prisma, postgresql, react, vite, nanoid, qrcode, helmet, docker

---

But the question is, does size really matter?
