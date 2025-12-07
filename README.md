# 🔧 97k Backend API

**NestJS Backend для сайта-поставщика строительных материалов**

> Версия: 1.0 | Статус: MVP разработка

## 📋 Содержание

- [Быстрый старт](#быстрый-старт)
- [Архитектура](#архитектура)
- [API Endpoints](#api-endpoints)
- [Окружение](#окружение)
- [Docker](#docker)
- [Тестирование](#тестирование)

---

## 🚀 Быстрый старт

### Предварительные требования

- Node.js 18.x LTS+
- npm или yarn
- PostgreSQL (или используем Supabase)
- Docker (опционально)

### Установка

```bash
# Клонируем репозиторий
git clone https://github.com/vik9541/97k-backend.git
cd 97k-backend

# Устанавливаем зависимости
npm install

# Копируем .env файл
cp .env.example .env

# Генерируем Prisma клиент
npx prisma generate

# Запускаем миграции
npx prisma migrate dev
```

### Запуск

```bash
# Development mode (с hot reload)
npm run start:dev

# Production mode
npm run build
npm run start:prod

# Запуск на порту 3000
http://localhost:3000
```

---

## 🏗️ Архитектура

```
src/
├── auth/              # Модуль аутентификации (JWT)
├── users/             # Управление пользователями
├── products/          # Каталог товаров
├── orders/            # Заказы
├── b2b/               # B2B специфичный функционал
├── b2c/               # B2C специфичный функционал
├── documents/         # Счета, акты, УПД
├── integrations/      # 1С, ЭДО, платежи
├── common/            # Guards, filters, interceptors
├── database/          # Prisma schema
└── main.ts            # Entry point
```

## 🔌 API Endpoints (MVP)

### Auth
- `POST /api/auth/register` - Регистрация
- `POST /api/auth/login` - Вход
- `POST /api/auth/refresh` - Обновление токена
- `POST /api/auth/logout` - Выход

### Users
- `GET /api/users/me` - Профиль текущего пользователя
- `PATCH /api/users/me` - Обновление профиля
- `GET /api/users/:id` - Профиль пользователя (админ)

### Products
- `GET /api/products` - Список товаров (с фильтрацией)
- `GET /api/products/:id` - Товар по ID
- `POST /api/products` - Создать товар (админ)

### Orders
- `POST /api/orders` - Создать заказ
- `GET /api/orders` - Мои заказы
- `GET /api/orders/:id` - Заказ по ID
- `PATCH /api/orders/:id` - Обновить заказ

## 🔐 Окружение

Создайте `.env` файл:

```env
# Database
DATABASE_URL="postgresql://user:password@localhost:5432/97k_db"
DATABASE_URL_SHADOW="postgresql://user:password@localhost:5432/97k_db_shadow"

# JWT
JWT_SECRET="your-super-secret-key"
JWT_EXPIRATION="24h"

# Supabase (опционально)
SUPABASE_URL="https://xxx.supabase.co"
SUPABASE_KEY="xxx"

# CORS
CORS_ORIGIN="http://localhost:3001,https://97k.ru"

# Environment
NODE_ENV="development"
PORT=3000
```

## 🐳 Docker

```bash
# Сборка образа
docker build -t 97k-backend:latest .

# Запуск контейнера
docker run -p 3000:3000 --env-file .env 97k-backend:latest

# Docker Compose
docker-compose up -d
```

## 🧪 Тестирование

```bash
# Unit tests
npm run test

# Coverage
npm run test:cov

# E2E tests
npm run test:e2e
```

---

**Связанные репозитории:**
- 🎨 [Frontend](https://github.com/vik9541/97k-frontend)
- 🔧 [Infrastructure](https://github.com/vik9541/97k-infrastructure)
- ⚙️ [n8n Workflows](https://github.com/vik9541/97k-n8n-workflows)
- 💾 [Database](https://github.com/vik9541/97k-database)
- 📋 [Specs](https://github.com/vik9541/97k-97v-specs)
