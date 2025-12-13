# 🎯 QUICK FIX GUIDE - ОРГАНИЗАЦИЯ ДОКУМЕНТАЦИИ

**Применить в этом порядке:**

---

## ✅ ШАГИ РЕОРГАНИЗАЦИИ

### ШАГИ 1-2: ГЛАВНЫЕ ХАБЫ (Обновить)

#### 1️⃣ super-brain-digital-twin/MASTER_README.md
**Проверка:** Нужна ли строка про архитектуру слоев?

**Нужно добавить:**
```markdown
## 🏗️ АРХИТЕКТУРА СИСТЕМЫ

### Layer 0: GOVERNANCE & HUB
- **Репо:** super-brain-digital-twin
- **Назначение:** Управление версиями, архитектура экосистемы
- **Главные документы:** MASTER_README.md, MODULES_MANIFEST.md, DEPLOYMENT_GUIDE.md

### Layer 1: SPECIFICATIONS
- **Репо:** 97k-97v-specs, super-brain-ai-ml-specs (future)
- **Назначение:** ТЗ и спецификации
- **Главные документы:** docs/TZ.md, docs/PHASES/

### Layer 2: IMPLEMENTATION  
- **Репо:** 97k-backend, 97k-frontend, 97k-database, 97k-infrastructure, 97k-n8n-workflows
- **Назначение:** Реальная реализация
- **Главные документы:** README.md, docs/ARCHITECTURE.md

### Layer 3: DOMAINS (Future)
- **Репо:** 04o-vpn, 78o-shop, 61v-services
- **Назначение:** Специфичные домены
- **Статус:** В планах на Q1-Q2 2026
```

#### 2️⃣ super-brain-digital-twin/README.md
**Статус:** ❌ УДАЛИТЬ (это v4.1, устарело)
**Команда:**
```bash
git rm README.md
git commit -m "Remove old v4.1 README (moved to MASTER_README.md)"
```

---

### ШАГИ 3-5: BACKEND ДОКУМЕНТАЦИЯ (Переорганизовать)

#### 3️⃣ 97k-backend/docs/ (создать папку)

**Файлы для переноса:**
```
97k-backend/PHASE_10_APPLE_CONTACTS_INTEGRATION.md → docs/PHASE_10_12_CONTACTS/
97k-backend/PHASE_10_FINAL_SUMMARY_RU.md → docs/PHASE_10_12_CONTACTS/
97k-backend/PHASE_10_QUICK_START_RU.md → docs/PHASE_10_12_CONTACTS/
97k-backend/PHASE_11_ANDROID_CODE.md → docs/PHASE_10_12_CONTACTS/
97k-backend/PHASE_11_ANDROID_TZ_COMPLETE.md → docs/PHASE_10_12_CONTACTS/
97k-backend/PHASE_11_BACKEND_COMPLETE_REPORT.md → docs/PHASE_10_12_CONTACTS/
97k-backend/PHASE_11_COMPLETE_REPORT.md → docs/PHASE_10_12_CONTACTS/
97k-backend/PHASE_11_DEPLOYMENT_GUIDE.md → docs/PHASE_10_12_CONTACTS/
97k-backend/PHASE_11_TZ_SUMMARY_RU.md → docs/PHASE_10_12_CONTACTS/
97k-backend/PHASE_12_COMPLETE_TZ_RUSSIAN.md → docs/PHASE_10_12_CONTACTS/
97k-backend/PHASE_12_FINAL_REPORT.md → docs/PHASE_10_12_CONTACTS/
97k-backend/PHASE_12_IMPLEMENTATION_GUIDE.md → docs/PHASE_10_12_CONTACTS/
97k-backend/IOS_IMPLEMENTATION_GUIDE.md → docs/PHASE_10_12_CONTACTS/
```

**Создать индекс:**
```bash
mkdir -p 97k-backend/docs/PHASE_10_12_CONTACTS
cat > 97k-backend/docs/PHASE_10_12_CONTACTS/README.md << 'EOF'
# 📱 PHASE 10-12: CONTACTS INTEGRATION

Синхронизация контактов с Apple, Google, Outlook и Android.

**Главные документы:**
- [PHASE 10: Apple Contacts](./PHASE_10_APPLE_CONTACTS_INTEGRATION.md)
- [PHASE 11: Google Contacts + Android](./PHASE_11_COMPLETE_REPORT.md)
- [PHASE 12: Outlook Integration](./PHASE_12_FINAL_REPORT.md)
- [Android Implementation](./PHASE_11_ANDROID_CODE.md)
- [iOS Implementation](./IOS_IMPLEMENTATION_GUIDE.md)

**Статус:** ✅ COMPLETE (Phase 12)
EOF
```

#### 4️⃣ 97k-backend/docs/ARCHITECTURE.md (создать)

```markdown
# 🏗️ 97k Backend Architecture

## Модули

### 1. Auth Module
- JWT аутентификация
- Роли и права
- Token refresh mechanism

### 2. Users Module
- User profiles (B2B + B2C)
- Personal data management
- User preferences

### 3. Products Module
- Product catalog
- Categories
- Inventory management
- B2B pricing (special prices per client)

### 4. Orders Module
- Order creation and management
- Order items
- Shipping addresses
- Status tracking

### 5. B2B Module
- Корпоративные клиенты
- Персональные цены
- Кредиты
- Контракты

### 6. B2C Module
- Обычные клиенты
- Корзина
- Розница

### 7. Documents Module
- Счета (invoices)
- Акты (acts)
- УПД (unified documents)

### 8. Integrations Module
- 1C integration
- EDO (Electronic Document Flow)
- Payment providers
- n8n webhooks

### 9. Contacts Module (PHASE 10-12)
- Apple Contacts Sync
- Google Contacts Sync
- Outlook Integration
- Android app integration

## Database

See [97k-database](../../../97k-database/docs/SCHEMA.md)
```

#### 5️⃣ 97k-backend/README.md (обновить)

**Заменить содержимое на:**
```markdown
# 🔧 97k Backend API

> **Part of Super Brain Digital Twin — Type: Domain (97k.ru)**

NestJS Backend для сайта-поставщика строительных материалов.

**Статус:** MVP (PHASE 4) + Contacts Integration (PHASE 12) ✅

## 🚀 Quick Start

```bash
# Install dependencies
npm install

# Setup environment
cp .env.example .env

# Generate Prisma client
npx prisma generate

# Run migrations
npx prisma migrate dev

# Start development server
npm run start:dev
```

**Server:** http://localhost:3000

## 📚 Documentation

- [Architecture](./docs/ARCHITECTURE.md) - Module structure
- [API Endpoints](./docs/API.md) - REST API specification
- [Database](../97k-database) - PostgreSQL schema, RLS, migrations
- [Contacts Integration](./docs/PHASE_10_12_CONTACTS/) - Apple, Google, Outlook sync
- [Setup Guide](./SETUP.md) - Complete setup instructions

## 🏗️ Tech Stack

- **Framework:** NestJS 10.x
- **Language:** TypeScript
- **Database:** PostgreSQL (Supabase)
- **ORM:** Prisma 5.x
- **Testing:** Jest
- **Auth:** JWT + Passport
- **Validation:** class-validator, class-transformer

## 📱 Modules

| Module | Status | Purpose |
|--------|--------|---------|
| Auth | ✅ | JWT authentication |
| Users | ✅ | User management |
| Products | ✅ | Product catalog |
| Orders | ✅ | Order management |
| B2B | ✅ | B2B pricing, contracts |
| B2C | ✅ | Retail, cart |
| Documents | ✅ | Invoices, acts |
| Integrations | ✅ | 1C, EDO, payments, n8n |
| Contacts | ✅ | Apple, Google, Outlook (PHASE 10-12) |

## 🧪 Testing

```bash
npm run test          # Unit tests
npm run test:cov      # With coverage
npm run test:e2e      # E2E tests
```

## 🐳 Docker

```bash
# Build image
docker build -t 97k-backend:latest .

# Run container
docker run -p 3000:3000 --env-file .env 97k-backend:latest

# Docker Compose (with PostgreSQL)
docker-compose up -d
```

## 📋 Related Repositories

- 🎨 [Frontend](https://github.com/vik9541/97k-frontend)
- 💾 [Database](https://github.com/vik9541/97k-database)
- 🏗️ [Infrastructure](https://github.com/vik9541/97k-infrastructure)
- ⚙️ [n8n Workflows](https://github.com/vik9541/97k-n8n-workflows)
- 📋 [Specifications](https://github.com/vik9541/97k-97v-specs)
- 🧠 [Master Hub](https://github.com/vik9541/super-brain-digital-twin)

## 📧 Support

For issues and questions, see [97k-97v-specs Issues](https://github.com/vik9541/97k-97v-specs/issues)

---

**Last Updated:** 13 December 2025  
**Version:** 1.0 (MVP) + Phase 12 (Contacts)
```

---

### ШАГИ 6-7: FRONTEND (Написать документацию)

#### 6️⃣ 97k-frontend/README.md (написать)

```markdown
# 🎨 97k Frontend

> **Part of Super Brain Digital Twin — Type: Domain (97k.ru)**

Next.js Frontend для сайта-поставщика строительных материалов.

**Статус:** MVP Development

## 🚀 Quick Start

```bash
npm install
npm run dev
```

**App:** http://localhost:3001

## 📚 Documentation

- [Architecture](./docs/ARCHITECTURE.md) - Pages, components structure
- [Components](./docs/COMPONENTS.md) - Component library
- [State Management](./docs/STATE_MANAGEMENT.md) - Data flow
- [Styling](./docs/STYLING.md) - TailwindCSS setup

## 🏗️ Tech Stack

- **Framework:** Next.js 14.x
- **Language:** TypeScript
- **Styling:** TailwindCSS
- **State:** React Query, Context API
- **UI:** Headless UI + Tailwind
- **Testing:** Jest, React Testing Library

## 📁 Project Structure

```
src/
├── app/              # Next.js 14 app directory
├── components/       # Reusable components
├── pages/           # Page components
├── hooks/           # Custom React hooks
├── lib/             # Utilities, helpers
├── styles/          # Global styles
└── types/           # TypeScript types
```

## 🧪 Testing

```bash
npm run test
npm run test:cov
```

## 🐳 Docker

```bash
docker build -t 97k-frontend:latest .
docker run -p 3001:3000 97k-frontend:latest
docker-compose up -d  # with backend
```

## 🔗 API Integration

Connected to Backend: http://localhost:3000/api

See [Backend API Docs](../97k-backend/docs/API.md)

---

**Last Updated:** 13 December 2025
```

#### 7️⃣ 97k-frontend/docs/ARCHITECTURE.md

```markdown
# 🏗️ Frontend Architecture

## Pages Structure

### Public Pages
- `/` - Главная страница (каталог товаров)
- `/products/:id` - Карточка товара
- `/auth/login` - Вход
- `/auth/register` - Регистрация

### Authenticated Pages
- `/dashboard` - Главная панель
- `/orders` - Мои заказы
- `/cart` - Корзина
- `/profile` - Профиль пользователя

### B2B Pages
- `/b2b/pricing` - Специальные цены
- `/b2b/contracts` - Контракты
- `/b2b/credit` - Кредит

## Components Hierarchy

```
<App>
  ├─ <Header />
  ├─ <Navigation />
  ├─ <MainContent />
  │  ├─ <ProductCard />
  │  ├─ <OrderList />
  │  └─ <Cart />
  └─ <Footer />
```

## State Management

- **React Query:** Server state (products, orders, users)
- **Context API:** Authentication state
- **localStorage:** User preferences

## Styling

- TailwindCSS for styling
- CSS Modules for component-scoped styles
- Design System: [Headless UI](https://headlessui.com/)
```

---

### ШАГИ 8-9: СПЕЦИФИКАЦИИ (Обновить)

#### 8️⃣ 97k-97v-specs/docs/ (добавить PHASE 10-12)

**Создать символические ссылки или копии:**
```bash
ln -s ../../97k-backend/docs/PHASE_10_12_CONTACTS 97k-97v-specs/docs/PHASE_10_12_CONTACTS
```

**Или:** Обновить 97k-97v-specs/README.md:
```markdown
## Фазы разработки

| Фаза | Сроки | Документ | Статус | Репо |
|------|-------|----------|--------|------|
| **MVP** | Недели 1-6 | [Phase 1: MVP](./docs/phases/phase1-mvp.md) | ✅ COMPLETE | 97k-backend |
| **B2B** | Недели 7-10 | [Phase 2: B2B](./docs/phases/phase2-b2b.md) | ✅ COMPLETE | 97k-backend |
| **Маркетинг** | Недели 11-14 | [Phase 3: Marketing](./docs/phases/phase3-marketing.md) | ✅ COMPLETE | 97k-marketing (TBD) |
| **Масштаб** | Недели 15-24 | [Phase 4: Scale](./docs/phases/phase4-scaling.md) | ✅ COMPLETE | 97k-* |
| **Контакты (Apple)** | - | [Phase 10: Contacts](../97k-backend/docs/PHASE_10_12_CONTACTS/PHASE_10_APPLE_CONTACTS_INTEGRATION.md) | ✅ COMPLETE | 97k-backend |
| **Контакты (Google+Android)** | - | [Phase 11: Google+Android](../97k-backend/docs/PHASE_10_12_CONTACTS/PHASE_11_COMPLETE_REPORT.md) | ✅ COMPLETE | 97k-backend |
| **Контакты (Outlook)** | - | [Phase 12: Outlook](../97k-backend/docs/PHASE_10_12_CONTACTS/PHASE_12_FINAL_REPORT.md) | ✅ COMPLETE | 97k-backend |
```

#### 9️⃣ 97k-database/docs/SCHEMA.md (создать ERD)

```markdown
# Database Schema

## Entity Relationship Diagram

[ASCII ERD here or link to Mermaid diagram]

## Core Tables

### users
- id (UUID)
- email
- password_hash
- name
- role (B2B/B2C/Admin)
- created_at

### products
- id (UUID)
- name
- description
- price
- category_id
- inventory_count
- created_at

### orders
- id (UUID)
- user_id
- status
- total_amount
- created_at

### contacts (PHASE 10-12)
- id (UUID)
- user_id
- source_type (apple/google/outlook)
- external_id
- name
- email
- phone
- created_at

[etc...]
```

---

## ⏱️ ВРЕМЯ РЕАЛИЗАЦИИ

```
Шаг 1-2: super-brain cleanup           [15 min]
Шаг 3-5: 97k-backend reorganization    [45 min]
Шаг 6-7: 97k-frontend docs             [60 min]
Шаг 8-9: specs update                  [30 min]

ВСЕГО: ~2.5 часа работы
```

---

## 🎯 РЕЗУЛЬТАТ

После этих шагов:
- ✅ Единая иерархия репо (Layer 0-3)
- ✅ Все документы в /docs/
- ✅ PHASE 10-12 в одном месте
- ✅ Frontend документирован
- ✅ 4x более понятная архитектура

**Используй этот гайд как чек-лист!**
