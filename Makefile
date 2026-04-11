NAME = skinnk

all: up

up:
	docker compose up -d --build
	@echo ""
	@echo "  skinnk is running"
	@echo "  ui:       http://localhost:3001"
	@echo "  api:      http://localhost:3001/api/links"
	@echo "  health:   http://localhost:3001/health"
	@echo ""

down:
	docker compose down

stop:
	docker compose stop

restart:
	docker compose restart api

logs:
	docker compose logs -f api

logs-db:
	docker compose logs -f db

seed:
	docker compose exec api node prisma/seed.js

status:
	@docker compose ps

clean:
	docker compose down -v --rmi local
	@echo "everything wiped. fresh start."

rebuild:
	docker compose down
	docker compose up -d --build

shell:
	docker compose exec api sh

db-shell:
	docker compose exec db psql -U skinnk -d skinnk

health:
	@curl -s http://localhost:3001/health | python3 -m json.tool 2>/dev/null || echo "api is not responding"

test:
	@echo "creating a test link..."
	@curl -s -X POST http://localhost:3001/api/links \
		-H "Content-Type: application/json" \
		-d '{"url":"https://github.com/100martini","expiresInDays":7}' | python3 -m json.tool
	@echo ""
	@echo "listing all links..."
	@curl -s http://localhost:3001/api/links | python3 -m json.tool

.PHONY: all up down stop restart logs logs-db seed status clean rebuild shell db-shell health test
