# Установка проекта 97k Backend

## ✅ Что уже сделано

### 1. Структура проекта
```
src/
├── auth/              ✅ JWT аутентификация (register, login)
├── users/             ✅ Управление пользователями
├── products/          ✅ Каталог товаров (CRUD, пагинация)
├── orders/            ✅ Заказы (создание, B2B/B2C цены)
├── database/          ✅ Prisma service & module
├── common/
│   ├── guards/        ✅ JwtAuthGuard, RolesGuard
│   └── decorators/    ✅ @CurrentUser, @Roles
└── main.ts            ✅ CORS, ValidationPipe, /api prefix
```

### 2. Database Schema (Prisma)
✅ **Модели созданы:**
- `User` - с поддержкой B2B/B2C (role, companyName, inn, creditLimit)
- `Product` - priceRetail + priceB2B, stock, category
- `Order` - автоматический расчет цен, orderNumber генерация
- `Category` - древовидная структура
- `Address` - адреса доставки

### 3. API Endpoints
```
POST   /api/auth/register    - Регистрация
POST   /api/auth/login       - Вход
GET    /api/users/me         - Профиль
PATCH  /api/users/me         - Обновление профиля
GET    /api/products         - Список товаров (пагинация, поиск)
GET    /api/products/:id     - Товар по ID
POST   /api/products         - Создать товар (ADMIN/MANAGER)
PATCH  /api/products/:id     - Обновить товар (ADMIN/MANAGER)
DELETE /api/products/:id     - Удалить товар (ADMIN)
GET    /api/orders           - Мои заказы
GET    /api/orders/:id       - Заказ по ID
POST   /api/orders           - Создать заказ
PATCH  /api/orders/:id       - Обновить статус (ADMIN/MANAGER)
```

## 🔧 Следующие шаги для запуска

### Вариант 1: С Docker (Рекомендуется)
```powershell
# Установить Docker Desktop for Windows
# https://www.docker.com/products/docker-desktop/

# Запустить PostgreSQL и Redis
docker compose up -d postgres redis

# Применить миграции
npx prisma migrate dev --name init

# Запустить dev server
npm run start:dev
```

### Вариант 2: Без Docker
```powershell
# Установить PostgreSQL 15
# https://www.postgresql.org/download/windows/

# Создать базу данных
createdb 97k_db

# Обновить DATABASE_URL в .env
# DATABASE_URL="postgresql://postgres:password@localhost:5432/97k_db"

# Применить миграции
npx prisma migrate dev --name init

# Запустить dev server
npm run start:dev
```

## ⚠️ Известные ограничения

### bcrypt не скомпилирован
**Проблема:** Для компиляции bcrypt требуется Visual Studio C++ Build Tools.

**Временное решение:** В `auth.service.ts` пароли пока не хешируются (только для dev!).

**Полное решение:**
1. Установить [Visual Studio Build Tools](https://visualstudio.microsoft.com/downloads/#build-tools-for-visual-studio-2022)
2. Выбрать "Desktop development with C++"
3. `npm rebuild bcrypt`
4. Раскомментировать строки с bcrypt в `src/auth/auth.service.ts`

## 📊 Prisma Commands

```powershell
# Генерация клиента после изменения schema
npx prisma generate

# Создание и применение миграции
npx prisma migrate dev --name migration_name

# Production миграция
npx prisma migrate deploy

# Prisma Studio (GUI для БД)
npx prisma studio
```

## 🧪 Тестирование API

После запуска сервера (`http://localhost:3000/api`):

```powershell
# Регистрация B2C пользователя
curl -X POST http://localhost:3000/api/auth/register `
  -H "Content-Type: application/json" `
  -d '{"email":"test@example.com","password":"password123","firstName":"Test","lastName":"User"}'

# Вход
curl -X POST http://localhost:3000/api/auth/login `
  -H "Content-Type: application/json" `
  -d '{"email":"test@example.com","password":"password123"}'

# Получить профиль (используйте accessToken из ответа выше)
curl http://localhost:3000/api/users/me `
  -H "Authorization: Bearer YOUR_ACCESS_TOKEN"
```

## 📝 Что осталось сделать

- [ ] Настроить PostgreSQL (локально или Docker)
- [ ] Применить миграции Prisma
- [ ] Установить Visual Studio Build Tools для bcrypt (опционально)
- [ ] Создать модули `b2b/` и `b2c/` для специфичных фич
- [ ] Добавить модуль `documents/` (УПД, акты, счета)
- [ ] Интеграции (`integrations/1c`, `integrations/edo`, `integrations/payments`)
- [ ] Настроить n8n для workflow automation
- [ ] Написать тесты (unit + e2e)

## 🚀 Текущий статус

✅ **Готово:** Базовая архитектура, auth, users, products, orders
⚠️ **Требует БД:** Сервер запускается, но падает без PostgreSQL
📦 **Модулей:** 4 из ~9 планируемых (MVP core готов)
