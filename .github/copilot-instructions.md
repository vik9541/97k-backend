# 97k Backend - AI Coding Agent Instructions

## Project Overview
NestJS backend для сайта-поставщика строительных материалов 97k. MVP разработка, комплексная система B2B/B2C с интеграциями 1С, ЭДО, платежей и n8n workflow automation.

## Architecture & Module Structure

### Planned Module Organization (from README)
```
src/
├── auth/              # JWT authentication
├── users/             # User management
├── products/          # Product catalog
├── orders/            # Order management
├── b2b/               # B2B-specific (pricing, contracts, credit)
├── b2c/               # B2C-specific (cart, retail)
├── documents/         # Invoice, acts, УПД generation
├── integrations/      # 1C, EDO, payment providers
├── common/            # Guards, filters, interceptors, decorators
├── database/          # Prisma schema & migrations
└── main.ts            # Application entry point
```

**Critical Pattern**: Разделяй B2B и B2C логику на уровне модулей, но используй общие entity через Prisma где возможно.

## Database & ORM

- **ORM**: Prisma 5.x
- **DB**: PostgreSQL 15 (через Supabase в проде или локально)
- **Schema location**: `prisma/schema.prisma` (будет создан)

### Prisma Workflow
```bash
npx prisma generate        # After schema changes
npx prisma migrate dev     # Create & apply migration
npx prisma studio          # DB GUI on :5555
npm run prisma:migrate:prod # Production migrations
```

**Pattern**: Always generate Prisma client after schema updates. Use shadow DB for dev migrations (DATABASE_URL_SHADOW).

## Authentication & Security

- **Strategy**: JWT with Passport (`@nestjs/passport`, `passport-jwt`)
- **Password hashing**: bcrypt
- **Token lifespan**: 24h (configurable via JWT_EXPIRATION)
- **Guards**: Create role-based guards in `common/guards/` for B2B vs B2C access control

## Environment Variables

Required variables (see `.env.example`):
- `DATABASE_URL`: PostgreSQL connection
- `JWT_SECRET`: Change in production!
- `SUPABASE_URL/KEY`: If using Supabase
- `N8N_URL/API_KEY`: For workflow automation hooks
- `CORS_ORIGIN`: Multi-domain support: `"http://localhost:3001,https://97k.ru,https://97v.ru"`

## Development Workflows

### Running the App
```bash
npm run start:dev          # Hot reload на :3000
docker-compose up -d       # Полный стек (Postgres + Redis + backend)
```

### Testing (Jest)
```bash
npm run test               # Unit tests
npm run test:cov           # With coverage
npm run test:e2e           # End-to-end tests
```

**CI**: GitHub Actions на Node 18.x и 20.x, автоматический запуск на push в main/develop.

## API Conventions

### Endpoint Patterns (from README)
- **Prefix**: `/api` для всех routes
- **Auth**: `/api/auth/*` - register, login, refresh, logout
- **Resources**: Стандартный RESTful - `GET /api/products`, `POST /api/orders`, etc.
- **User context**: `/api/users/me` для текущего юзера

### Validation
Use `class-validator` and `class-transformer` decorators in DTOs. NestJS автоматически валидирует через ValidationPipe.

## Integration Points

### External Systems
1. **1C**: Интеграция в `integrations/1c/` - синхронизация остатков, цен, документов
2. **ЭДО (Electronic Document Flow)**: Генерация УПД, актов, счетов в `documents/`
3. **n8n Workflows**: Webhook triggers для автоматизации (`N8N_URL` в .env)
4. **Payment providers**: Модуль в `integrations/payments/`

### Related Repositories
- Frontend: `vik9541/97k-frontend`
- Infrastructure: `vik9541/97k-infrastructure`
- n8n Workflows: `vik9541/97k-n8n-workflows`
- Database: `vik9541/97k-database`
- Specs: `vik9541/97k-97v-specs`

## Docker & Deployment

### Multi-stage Build
Dockerfile использует node:18-alpine, builder pattern для оптимизации размера образа.

### Docker Compose Services
- `postgres`: Port 5432, credentials `97k/97k_password/97k_db`
- `redis`: Port 6379 (для кеширования, сессий)
- `backend`: Port 3000, hot reload через volume mount в dev mode

**Health checks**: Postgres и Redis имеют healthcheck перед стартом backend.

## Code Style & Patterns

- **Formatting**: Prettier для TS файлов (`npm run format`)
- **Linting**: ESLint с TypeScript plugin (`npm run lint`)
- **Module pattern**: Каждый feature module с controller → service → repository слоями
- **DI**: Используй NestJS dependency injection, избегай прямых `new ClassName()`

## Key Decisions & Context

1. **Dual business model**: Система поддерживает B2B (кредиты, спецпрайсы, документы) и B2C (розница, корзина) одновременно
2. **Document generation**: Критичная фича - автоматическая генерация бухгалтерских документов (УПД, акты, счета)
3. **MVP focus**: Сейчас в стадии MVP - приоритет на core features (auth, products, orders) перед advanced интеграциями
4. **Redis optional**: Redis настроен в docker-compose, но может использоваться позже для кеша и rate limiting

## When Adding New Features

1. Generate module: `nest generate module <name>`
2. Add controller/service: `nest generate controller/service <name>`
3. Define DTOs with class-validator decorators
4. Update Prisma schema if new entities needed
5. Add tests (*.spec.ts) alongside implementation
6. Document API endpoints в README если public-facing
