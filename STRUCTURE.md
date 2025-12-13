# 🏗️ STRUCTURE.md — Project Hierarchy (v5.0)

**Дата**: 13 декабря 2025  
**Статус**: 🟢 ACTIVE REORGANIZATION  
**Источник**: super-brain-digital-twin v5.0

---

## 📊 Иерархия проектов

```
super-brain-digital-twin (97v.ru) ← ГЛАВНЫЙ ПРОЕКТ
│
├─── 📄 MASTER_README.md (v5.0) ← НАЧНИ ОТСЮДА!
├─── 📄 SUPER_BRAIN_v5.0_GLOBAL_EDITION.md ← Детальная спецификация
├─── 📄 STRUCTURE.md (этот файл) ← Архитектура всех модулей
├─── 📄 MODULES_MANIFEST.md ← Список всех компонентов
├─── 📄 CHECKLIST.md ← Статус задач
│
├─── 🤖 MODULES/ (v5.0 Core Systems)
│    ├─ PRIMARY_ANALYZER ← Реал-тайм анализ файлов
│    ├─ ORGANIZER ← Организация связей и событий
│    └─ MASTER_TEACHER ← Ночное обучение (01:00 CronJob)
│
├─── 🛠️ PROJECTS/ (Связанные проекты)
│    │
│    ├─ 97k-backend/ ← BACKEND MODULE
│    │  ├─ Status: ✅ PHASE 12 COMPLETE
│    │  ├─ Stack: NestJS (TypeScript)
│    │  ├─ Code: 5500+ LOC
│    │  ├─ Tests: 117+ passing
│    │  ├─ Domain: api.97k.ru
│    │  │
│    │  ├─ PHASES:
│    │  │  ├─ PHASE 1: Authentication (JWT, OAuth)
│    │  │  ├─ PHASE 2: User Management
│    │  │  ├─ PHASE 3: Products Catalog
│    │  │  ├─ PHASE 4: Orders System
│    │  │  ├─ PHASE 5: B2B Pricing
│    │  │  ├─ PHASE 6: Contracts & Legal
│    │  │  ├─ PHASE 7: Gmail Integration
│    │  │  ├─ PHASE 8: Analytics & Events
│    │  │  ├─ PHASE 9: GDPR & Privacy
│    │  │  ├─ PHASE 10: Apple Contacts (iOS)
│    │  │  ├─ PHASE 11: Google Contacts (Android)
│    │  │  └─ PHASE 12: Outlook Contacts (Web)
│    │  │
│    │  ├─ Key Files:
│    │  │  ├─ src/auth/ → JWT, Passport, OAuth
│    │  │  ├─ src/users/ → User profiles, RLS
│    │  │  ├─ src/products/ → Catalog, filters
│    │  │  ├─ src/orders/ → Order processing
│    │  │  ├─ src/apple-contacts/ → iOS sync
│    │  │  ├─ src/google-contacts/ → Android sync
│    │  │  ├─ src/outlook-contacts/ → Web sync
│    │  │  ├─ src/analytics/ → Event tracking
│    │  │  ├─ src/gdpr/ → Data privacy
│    │  │  ├─ src/integrations/ → 1C, EDO, Payments
│    │  │  └─ prisma/schema.prisma ← SOURCE OF TRUTH
│    │  │
│    │  └─ Documentation:
│    │     ├─ PHASE_1_AUTH.md through PHASE_12_OUTLOOK.md
│    │     ├─ IOS_IMPLEMENTATION_GUIDE.md
│    │     ├─ PHASE_11_ANDROID_CODE.md
│    │     ├─ README.md (этот модуль)
│    │     └─ SETUP.md (локальная разработка)
│    │
│    │
│    ├─ 97k-frontend/ ← FRONTEND MODULE
│    │  ├─ Status: 🟡 PHASE 13 PLANNED
│    │  ├─ Stack: React 18 + Next.js + TailwindCSS
│    │  ├─ Domain: www.97k.ru
│    │  ├─ Features:
│    │  │  ├─ B2B Dashboard
│    │  │  ├─ B2C Shop
│    │  │  ├─ User Profiles
│    │  │  ├─ Order Management
│    │  │  ├─ Contact Sync UI
│    │  │  └─ Analytics Dashboard
│    │  │
│    │  └─ Integration:
│    │     └─ REST API → 97k-backend (/api/*)
│    │
│    │
│    ├─ 97k-database/ ← SHARED DATABASE
│    │  ├─ Status: 🔄 SYNCING
│    │  ├─ Database: PostgreSQL 15 (via Supabase)
│    │  ├─ ORM: Prisma 5.x
│    │  ├─ Schema: prisma/schema.prisma
│    │  │           (replicated from 97k-backend)
│    │  │
│    │  ├─ Tables (17+):
│    │  │  ├─ User (Profiles, auth data)
│    │  │  ├─ Product (Catalog items)
│    │  │  ├─ Order (Order history)
│    │  │  ├─ AppleContact, AppleContactSync
│    │  │  ├─ GoogleContact, GoogleContactSync
│    │  │  ├─ OutlookContact, OutlookContactSync
│    │  │  ├─ Analytics (Event tracking)
│    │  │  ├─ GDPRLog (Privacy logs)
│    │  │  └─ ... (others)
│    │  │
│    │  ├─ Security:
│    │  │  ├─ RLS Policies (B2B/B2C separation)
│    │  │  ├─ Encryption at rest
│    │  │  └─ Audit logs
│    │  │
│    │  └─ Source of Truth:
│    │     └─ 97k-backend/prisma/schema.prisma ← MASTER
│    │        (synced daily via GitHub Actions)
│    │
│    │
│    ├─ 97k-infrastructure/ ← DEVOPS MODULE
│    │  ├─ Status: ✅ DEPLOYED
│    │  ├─ Infrastructure:
│    │  │  ├─ DigitalOcean DOKS (K8s cluster)
│    │  │  ├─ VPS Backup (45.129.141.198)
│    │  │  ├─ PostgreSQL (Supabase)
│    │  │  ├─ Redis (Caching)
│    │  │  └─ NGINX (Reverse proxy)
│    │  │
│    │  ├─ Domains:
│    │  │  ├─ 97v.ru → super-brain-digital-twin
│    │  │  ├─ api.97k.ru → 97k-backend (port 3000)
│    │  │  ├─ www.97k.ru → 97k-frontend (port 3001)
│    │  │  └─ storage.97k.ru → File uploads
│    │  │
│    │  ├─ Services:
│    │  │  ├─ docker-compose.yml
│    │  │  ├─ nginx.conf (NGINX config)
│    │  │  ├─ k8s/ (Kubernetes manifests)
│    │  │  ├─ GitHub Actions (CI/CD)
│    │  │  └─ Monitoring (Prometheus + Grafana)
│    │  │
│    │  └─ Deployment:
│    │     ├─ scripts/deploy-to-droplet.sh
│    │     ├─ .github/workflows/ (automated tests)
│    │     └─ Health checks + auto-recovery
│    │
│    │
│    ├─ 97k-n8n-workflows/ ← AUTOMATION MODULE
│    │  ├─ Status: ✅ 4 WORKFLOWS ACTIVE
│    │  ├─ Platform: n8n (open-source)
│    │  │
│    │  ├─ Workflows:
│    │  │  ├─ Order Processing
│    │  │  │  └─ Trigger: New order → 97k-backend
│    │  │  │     Action: Validation → 1C sync → Notification
│    │  │  │
│    │  │  ├─ Payment Gateway
│    │  │  │  └─ Trigger: Payment attempt
│    │  │  │     Action: Verify → Process → Confirm
│    │  │  │
│    │  │  ├─ EDO Integration (ЭДО)
│    │  │  │  └─ Trigger: Invoice generated
│    │  │  │     Action: Send to portal → Track status
│    │  │  │
│    │  │  └─ Inventory Sync
│    │  │     └─ Trigger: Daily schedule (08:00)
│    │  │        Action: Fetch from 1C → Update DB → Notify
│    │  │
│    │  └─ Integration:
│    │     └─ Webhooks → 97k-backend API
│    │
│    │
│    └─ 97k-97v-specs/ ← TECHNICAL SPECIFICATIONS
│       ├─ Status: 🟡 BEING UPDATED
│       ├─ Purpose: Planning & requirements documentation
│       │
│       ├─ Documents:
│       │  ├─ docs/TZ.md ← Main technical spec
│       │  ├─ docs/functional-requirements.md
│       │  ├─ docs/database-architecture.md
│       │  ├─ docs/n8n-workflows.md
│       │  ├─ docs/infrastructure.md
│       │  └─ docs/phases/ (4-phase strategic plan)
│       │
│       └─ NOTE: Being aligned with actual 12-PHASE
│          implementation from 97k-backend
│
│
├─── 📊 DOCUMENTATION/
│    ├─ docs/INDEX.md ← Master index (all documents)
│    ├─ ARCHITECTURE.md ← System design
│    ├─ API.md ← REST API reference
│    ├─ DATABASE.md ← Schema documentation
│    ├─ DEPLOYMENT.md ← How to deploy
│    └─ CONTRIBUTING.md ← Development guide
│
│
└─── 🔗 LINKS/ (Cross-repo connections)
     ├─ PHASE_MAPPING.md ← How PHASE 1-12 relate to TASK-v5
     ├─ ARCHITECTURE_ALIGNMENT.md ← 97k integration with super-brain
     ├─ CROSS_REPO_ISSUES.md ← GitHub issues linking all repos
     └─ API_ENDPOINTS.md ← All API documentation

```

---

## ✅ Source of Truth (Источники истины)

| Component | Master Location | Purpose |
|-----------|-----------------|---------|
| **Database Schema** | `97k-backend/prisma/schema.prisma` | Single source for DB structure |
| **API Specification** | `97k-backend/src/` + Swagger docs | REST API definition |
| **Project Architecture** | `super-brain-digital-twin/MASTER_README.md` | Overall system design |
| **Infrastructure** | `97k-infrastructure/` | Deployment & DevOps |
| **Automation** | `97k-n8n-workflows/` | Business process automation |
| **Frontend** | `97k-frontend/` | Web UI (React) |
| **Backend** | `97k-backend/` | API & business logic |

---

## 🔄 Data Flow

```
User Request
    ↓
[NGINX Reverse Proxy] (97k-infrastructure)
    ↓
[97k-backend API] (NestJS)
    ├─ Auth → JWT validation
    ├─ Logic → Service layer
    ├─ DB → Prisma ORM
    └─ Integrations → 1C, EDO, n8n
    ↓
[PostgreSQL Database] (97k-database)
    ├─ User data
    ├─ Orders, Products
    ├─ Contact sync logs
    └─ Analytics events
    ↓
[n8n Workflows] (97k-n8n-workflows)
    ├─ Payment processing
    ├─ EDO document flow
    ├─ Inventory updates
    └─ Notifications
    ↓
[External Systems]
    ├─ 1C (Accounting)
    ├─ EDO Portal (Documents)
    └─ Payment Gateway
```

---

## 🌐 Domain Mapping

```
┌─────────────────────────────────────────────────────┐
│              PUBLIC INTERNET (Users)                 │
└─────────────────────────────────────────────────────┘
         ↓                    ↓                   ↓
    www.97k.ru         api.97k.ru          97v.ru
    (Frontend)          (Backend)      (super-brain)
       React 18         NestJS API      AI System
    (PORT 3001)         (PORT 3000)    (MASTER)
         ↓                    ↓              ↓
   ┌────────────┐      ┌──────────────┐  ┌──────────────┐
   │ 97k-frontend│     │97k-backend   │  │super-brain   │
   │  React 18   │     │NestJS        │  │Python/AI     │
   │  TailwindCSS│     │Prisma ORM    │  │3-Agent system│
   │React Query  │────→│Auth, Orders  │→ │MASTER_TEACHER│
   └────────────┘     │Contacts, etc │  │ANALYZER      │
        ↓             │Integrations  │  │ORGANIZER     │
   [Webpack Dev]      └──────────────┘  └──────────────┘
                           ↓
                      ┌────────────┐
                      │PostgreSQL  │
                      │  Database  │
                      │(Supabase)  │
                      └────────────┘
                           ↓
                      ┌────────────┐
                      │ n8n Engine │
                      │(Automation)│
                      │ Workflows  │
                      └────────────┘
```

---

## 📈 Версионирование

```
super-brain-digital-twin:
  v5.0 — Self-improving 3-agent system (11 Dec 2025)
  v4.1 — Previous version (archived)

97k-backend:
  1.0 (PHASE 12) — Complete with contact integrations (12 Dec 2025)
  Phases: 1-12 implemented, PHASE 13 (frontend) planned

97k-frontend:
  TBD (PHASE 13) — To be started

97k-database:
  Current: Syncing from 97k-backend

97k-infrastructure:
  v1.0 — Production ready (Docker, K8s, CI/CD)

97k-n8n-workflows:
  v1.0 — 4 core workflows active
```

---

## 🔐 Security & Access

```
Public Access:
  ✅ www.97k.ru (Frontend)
  ✅ api.97k.ru (API with auth)
  ✅ 97v.ru (super-brain — public docs)

Private Access:
  🔒 GitHub repos (private)
  🔒 Database (VPC, encrypted)
  🔒 K8s cluster (private network)
  🔒 n8n engine (internal only)

Authentication:
  - JWT tokens (24h expiration)
  - OAuth 2.0 (Google, Apple, Microsoft)
  - RLS policies (PostgreSQL)
  - HTTPS (all endpoints)
```

---

## 🚀 Quick Navigation

**I need to understand...**
- Architecture? → [`MASTER_README.md`](https://github.com/vik9541/super-brain-digital-twin/blob/main/MASTER_README.md)
- How to run locally? → [`97k-backend/SETUP.md`](https://github.com/vik9541/97k-backend/blob/main/SETUP.md)
- API endpoints? → [`97k-backend/README.md#api-endpoints`](https://github.com/vik9541/97k-backend/blob/main/README.md#-api-endpoints-mvp)
- Database schema? → [`97k-database/prisma/schema.prisma`](https://github.com/vik9541/97k-database/blob/main/prisma/schema.prisma)
- Deployment? → [`97k-infrastructure/README.md`](https://github.com/vik9541/97k-infrastructure/blob/main/README.md)
- PHASE history? → [`97k-backend/PHASE_*.md`](https://github.com/vik9541/97k-backend)
- super-brain v5.0? → [`SUPER_BRAIN_v5.0_GLOBAL_EDITION.md`](https://github.com/vik9541/super-brain-digital-twin/blob/main/SUPER_BRAIN_v5.0_GLOBAL_EDITION.md)

---

**Status**: 🟢 ACTIVE  
**Last Updated**: 13 декабря 2025  
**Maintained by**: @vik9541  
**License**: MIT
