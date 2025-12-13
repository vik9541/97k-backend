# 🚀 GRAND REORGANIZATION PLAN (2025-12-13)

## ВИЗИЯ: super-brain-digital-twin (97v.ru) как главный проект

**Текущее состояние:** Путаница между двумя проектами (super-brain vs 97k-backend)  
**Целевое состояние:** Единая иерархия с super-brain v5.0 как корневым архитектурным документом  
**Сроки:** СРОЧНО (пока еще можно просто переорганизовать)

---

## 📊 ТЕКУЩАЯ ИЕРАРХИЯ ПРОЕКТОВ

```
❌ НЕПРАВИЛЬНО (СЕЙЧАС):

super-brain-digital-twin/          ← 150+ docs, v5.0 (Python)
├─ MASTER_README.md
├─ SUPER_BRAIN_v5.0_GLOBAL_EDITION.md
└─ ... 150+ файлов

97k-backend/                       ← 12 PHASE docs, 5500 LOC NestJS
├─ PHASE_1_*
├─ PHASE_12_FINAL_REPORT.md
└─ src/ (auth, users, products, orders, apple-contacts, google-contacts, outlook-contacts)

97k-frontend/                      ← ❌ ПУСТО (только README)
97k-database/                      ← ❌ НЕПОЛНАЯ (нет PHASE 10-12)
97k-infrastructure/                ← Минимальная документация
97k-n8n-workflows/                 ← 4 workflow, минимальная документация
97k-97v-specs/                     ← ❌ УСТАРЕВШИЕ (4 фазы vs реальные 12)


✅ ПРАВИЛЬНО (ЦЕЛЕВОЕ СОСТОЯНИЕ):

super-brain-digital-twin (97v.ru) - ГЛАВНЫЙ ПРОЕКТ
│
├─── MASTER_README.md (APEX - источник истины)
├─── SUPER_BRAIN_v5.0_GLOBAL_EDITION.md
├─── STRUCTURE.md (ВСЯ иерархия проектов)
├─── INDEX.md (индекс всех документов)
│
├─── MODULES/ (основные компоненты v5.0)
│    ├─ PRIMARY_ANALYZER/
│    ├─ ORGANIZER/
│    └─ MASTER_TEACHER/
│
├─── PROJECTS/ (связанные проекты)
│    ├─ 97k-backend/ (BACKEND MODULE)
│    │   ├─ PHASE_1_AUTH.md
│    │   ├─ PHASE_2_USERS.md
│    │   ├─ ...
│    │   ├─ PHASE_12_OUTLOOK.md
│    │   └─ src/ (Production Code)
│    │
│    ├─ 97k-frontend/ (FRONTEND MODULE - PHASE 13)
│    │   └─ (React 18 + TailwindCSS + React Query)
│    │
│    ├─ 97k-database/ (SHARED DATABASE)
│    │   └─ Единая Prisma schema для всех проектов
│    │
│    ├─ 97k-infrastructure/ (DEVOPS)
│    │   └─ Docker, Nginx, K8s, CI/CD
│    │
│    └─ 97k-n8n-workflows/ (AUTOMATION)
│        └─ 4 основных workflow'а
│
└─── LINKS/ (cross-repo навигация)
     ├─ api-endpoints.md
     ├─ data-flow.md
     └─ deployment-checklist.md
```

---

## 🎯 ФАЗОВАЯ АРХИТЕКТУРА (ЕДИНАЯ)

### PHASE Model: 4+12 = Единая система

```
STRATEGIC PHASES (4 шага - планирование):
  1. MVP (PHASE 1-3) ← Auth, Users, Basic Products
  2. B2B Features (PHASE 4-6) ← Orders, B2B pricing
  3. Mobile Integration (PHASE 7-9) ← Gmail, Analytics
  4. Cross-Platform Contacts (PHASE 10-12) ← iOS, Android, Web
  
  ↓ (Связь с super-brain v5.0)
  
TECHNICAL IMPLEMENTATION (12 фаз - разработка):
  PHASE 1: AUTH → PHASE 4: ORDERS → PHASE 7: GMAIL → PHASE 10: APPLE
  PHASE 2: USERS → PHASE 5: PRICING → PHASE 8: ANALYTICS → PHASE 11: GOOGLE
  PHASE 3: PRODUCTS → PHASE 6: CONTRACTS → PHASE 9: GDPR → PHASE 12: OUTLOOK
  
  ↓ (Сопоставление с TASK-v5 из super-brain)
  
SUPER-BRAIN TASKS (v5.0):
  TASK-v5-001: Rewrite PRIMARY ANALYZER ← может быть помощь из PHASE 10-12
  TASK-v5-002: Upgrade ORGANIZER
  TASK-v5-003: Implement MASTER TEACHER
  ... и т.д.
```

---

## 📋 8 КРИТИЧЕСКИХ ЗАДАЧ ПЕРЕОРГАНИЗАЦИИ

### TASK 1️⃣: Создать STRUCTURE.md

**Цель:** Единственный документ, описывающий ВСЮ иерархию  
**Где:** `super-brain-digital-twin/STRUCTURE.md` (создать)  
**Содержит:**
- Иерархию всех 7 проектов
- Версионирование (super-brain v5.0, 97k-backend PHASE 12, и т.д.)
- Зависимости между проектами
- Источники истины для каждого компонента
- Диаграммы связей

**Файл:** 
```markdown
# super-brain-digital-twin: Project Structure v5.0

## Root: super-brain-digital-twin (97v.ru)
- Master documentation: MASTER_README.md
- Architecture: SUPER_BRAIN_v5.0_GLOBAL_EDITION.md
- 3-Agent System: PRIMARY ANALYZER, ORGANIZER, MASTER TEACHER

## Module 1: 97k-backend (NestJS API)
- Status: ✅ PHASE 12 COMPLETE
- Domain: api.97k.ru
- Source of Truth: prisma/schema.prisma
- Documentation: PHASE_1-12_*.md
- Tests: 117+ passing

## Module 2: 97k-frontend (React App)
- Status: 🟡 PHASE 13 PLANNED
- Domain: www.97k.ru
- Architecture: Next.js 15 + React 18 + TailwindCSS
- Integration: REST API calls to 97k-backend

## Shared: 97k-database
- Source of Truth: prisma/schema.prisma (REPLICATED from 97k-backend)
- 17+ tables: User, Product, Order, AppleContact, GoogleContact, OutlookContact
- RLS Policies: B2B/B2C separation

## Infrastructure: 97k-infrastructure
- Deployment: DigitalOcean K8s, VPS backup
- NGINX Config: 97v.ru, 97k.ru, api.97k.ru routing

## Automation: 97k-n8n-workflows
- 4 Core Workflows: Orders, Payments, EDO, Inventory
```

---

### TASK 2️⃣: Создать единый INDEX.md

**Цель:** Наведение в лабиринте всех документов  
**Где:** `super-brain-digital-twin/docs/INDEX.md` (создать)  
**Структура:**
```markdown
# Complete Documentation Index

## 🌟 ARCHITECTURE (Start Here)
- MASTER_README.md ← Main entry point
- STRUCTURE.md ← Project hierarchy
- SUPER_BRAIN_v5.0_GLOBAL_EDITION.md ← Detailed spec

## 🔧 IMPLEMENTATION
### Backend (97k-backend)
- PHASE 1-12 Reports (links to all documents)
- API Endpoints Documentation
- Database Schema (prisma/schema.prisma)

### Frontend (97k-frontend)
- Coming Soon: PHASE 13 Plan
- Component Architecture
- Styling Guide

### Database (97k-database)
- Schema Documentation
- RLS Policies
- Seed Data

### Infrastructure (97k-infrastructure)
- Docker Setup
- Kubernetes Configuration
- Deployment Checklist

### Automation (97k-n8n-workflows)
- Workflow 1: Order Processing
- Workflow 2: Payment Gateway
- Workflow 3: EDO Integration
- Workflow 4: Inventory Sync

## 🚀 DEVELOPMENT
- How to Run Locally
- Contributing Guide
- Code Style Guide
- Testing Strategy

## 📊 MONITORING
- Health Checks
- Metrics & Dashboards
- Alerting Setup
```

---

### TASK 3️⃣: Обновить все README.md файлы

**Цель:** Каждый проект указывает на главный документ  
**Где:** Во всех 7 репозиториях

**97k-backend/README.md (обновить начало):**
```markdown
# 97k-backend - Module of super-brain-digital-twin

> 🌍 **Main Project:** [super-brain-digital-twin v5.0](https://github.com/vik9541/super-brain-digital-twin)  
> 📚 **Architecture:** [MASTER_README.md](https://github.com/vik9541/super-brain-digital-twin/blob/main/MASTER_README.md)  
> 🗂️ **Full Structure:** [STRUCTURE.md](https://github.com/vik9541/super-brain-digital-twin/blob/main/STRUCTURE.md)

## This Module: B2B/B2C API (NestJS)
- ✅ Status: PHASE 12 COMPLETE
- 📦 Code: 5500+ LOC, 117+ tests
- 🔌 Endpoints: 50+ REST API endpoints
- 🗄️ Database: PostgreSQL (17 tables)
- 🔐 Security: OAuth 2.0, JWT, RLS policies

### Quick Links
- [Phase Reports](./PHASE_12_FINAL_REPORT.md)
- [API Documentation](./src/README.md)
- [Database Schema](../97k-database/prisma/schema.prisma)
- [Deployment](../97k-infrastructure/README.md)
```

**97k-frontend/README.md (создать):**
```markdown
# 97k-frontend - Module of super-brain-digital-twin

> 🌍 **Main Project:** [super-brain-digital-twin v5.0](https://github.com/vik9541/super-brain-digital-twin)  
> 🔗 **Backend API:** [97k-backend](https://github.com/vik9541/97k-backend)

## This Module: Web Application (React 18 + Next.js)
- 🟡 Status: PHASE 13 PLANNED
- 🎨 Stack: React 18 + TailwindCSS + React Query
- 📱 Responsive: Mobile-first design
- 🌐 Integration: REST API to 97k-backend

### Development
```
npm install
npm run dev        # http://localhost:3000
```

### Architecture
[Coming from super-brain-digital-twin MASTER_README.md]
```

**Аналогично для остальных 5 проектов**

---

### TASK 4️⃣: Синхронизировать prisma/schema.prisma

**Цель:** Одна истина для всех проектов  
**Где:** 97k-backend/prisma/schema.prisma как MASTER

**Действия:**
1. ✅ 97k-backend/prisma/schema.prisma имеет все таблицы (PHASE 1-12)
2. 🔄 Скопировать в 97k-database/prisma/schema.prisma
3. 📌 Добавить коммент: "SOURCE OF TRUTH: See 97k-backend/prisma/schema.prisma"
4. ✅ Убедиться, что PHASE 10-12 таблицы синхронизированы:
   - AppleContact, AppleContactSync
   - GoogleContact, GoogleContactSync
   - OutlookContact, OutlookContactSync

---

### TASK 5️⃣: Организовать PHASE документы

**Цель:** Ясная линия от спецификации к реализации к результатам

**Структура в super-brain-digital-twin:**
```
super-brain-digital-twin/
├─ PROJECTS/
│  └─ 97K_BACKEND_PHASES/
│     ├─ OVERVIEW.md (Что такое PHASE система?)
│     ├─ PHASE_MAPPING.md (Как PHASE-1-12 связаны с TASK-v5?)
│     ├─ PHASE_1_AUTH.md (ссылка на 97k-backend)
│     ├─ PHASE_2_USERS.md
│     ├─ ...
│     └─ PHASE_12_OUTLOOK.md
```

**Файл PHASE_MAPPING.md:**
```markdown
# PHASE System: Mapping between 97k-backend and super-brain v5.0

## Strategic 4-Phase Plan vs Technical 12-Phase Implementation

| Phase | Type | Focus | super-brain TASK |
|-------|------|-------|------------------|
| 1-3 | MVP | Auth, Users, Products | Foundation (v4.1) |
| 4-6 | B2B | Orders, Pricing, Contracts | Integration (v4.1) |
| 7-9 | Mobile | Gmail, Analytics, GDPR | Data Pipeline |
| 10-12 | Cross-Platform | iOS, Android, Web Contacts | v5.0 Upgrade |

## Detailed Phase History

### PHASE 1: Authentication & JWT (COMPLETE)
- Status: ✅
- Code: src/auth/, tests/
- Report: [PHASE_1_AUTH.md](../97k-backend/...)
- Lessons: [...]

### PHASE 2: User Management (COMPLETE)
- Status: ✅
- Code: src/users/
- Report: [PHASE_2_USERS.md](../97k-backend/...)
- Lessons: [...]

... (и так для всех 12 фаз)
```

---

### TASK 6️⃣: Создать миграционный план (выполнение по шагам)

**Цель:** Пошаговая инструкция, как переорганизовать без потери данных/истории

**MIGRATION_STEPS.md:**
```markdown
# Migration Plan: Reorganizing around super-brain-digital-twin v5.0

## PHASE 0: Preparation (Day 1)
- [ ] Create branches: `feature/reorganization-v5` in all 7 repos
- [ ] Create this plan
- [ ] Get team approval

## PHASE 1: Documentation (Days 2-3)
- [ ] Create STRUCTURE.md in super-brain-digital-twin
- [ ] Create docs/INDEX.md in super-brain-digital-twin
- [ ] Update all README.md files (7 repos)
- [ ] Create cross-links between repos

## PHASE 2: Synchronization (Days 4-5)
- [ ] Sync prisma/schema.prisma across repos
- [ ] Update 97k-database with PHASE 10-12 tables
- [ ] Verify schema consistency with validation script

## PHASE 3: Integration (Days 6-7)
- [ ] Create PHASE_MAPPING.md linking PHASE 1-12 to TASK-v5
- [ ] Add GitHub topics: super-brain, module, phase-X
- [ ] Create GitHub issues linking all repos

## PHASE 4: Validation (Day 8)
- [ ] Cross-repo test suite passes
- [ ] CI/CD updated with validation
- [ ] Documentation links all working

## PHASE 5: Deployment (Day 9)
- [ ] Merge all branches to main
- [ ] Tag releases: super-brain v5.0.1
- [ ] Announce changes

## Rollback Plan
If anything breaks, checkout original branches and revert merge commits.
```

---

### TASK 7️⃣: Переорганизовать PHASE документы (связь с TASK-v5)

**Файл в super-brain-digital-twin/PROJECTS/97K_BACKEND_PHASES/ARCHITECTURE_ALIGNMENT.md:**

```markdown
# How 97k-backend PHASES align with super-brain v5.0 TASKS

## Executive Summary
- 97k-backend PHASE 1-12: Complete B2B/B2C implementation
- super-brain v5.0 TASK-v5-001-022: Advanced AI/ML enhancements
- Integration Point: 97k-backend can feed data to super-brain MASTER_TEACHER

## Data Flow Examples

### Example 1: GDPR Module → Vector DB
```
PHASE 9: GDPR Module (src/gdpr/)
  ↓ Extracts data deletion logs
  ↓
Feeds to: MASTER_TEACHER (v5.0)
  ↓ Learns compliance patterns
  ↓
Improves: TASK-v5-011 (Pattern Discovery)
```

### Example 2: Contact Integration → Knowledge Graph
```
PHASE 10-12: Apple/Google/Outlook Contacts
  ↓ Extracts contact metadata
  ↓
Feeds to: Neo4j Knowledge Graph
  ↓ Builds contact relationships
  ↓
Improves: TASK-v5-005 (Knowledge Graph Integration)
```

### Example 3: Order System → Vector Embeddings
```
PHASE 4-6: B2B Orders & Pricing
  ↓ Extracts order patterns
  ↓
Feeds to: Milvus Vector DB
  ↓ Creates order embeddings
  ↓
Improves: TASK-v5-004 (Vector DB Reindexing)
```

## Detailed Alignment Table

| PHASE | 97k-backend | Focus | TASK-v5 Connection |
|-------|-------------|-------|------------------|
| 1 | AUTH | JWT, OAuth | v5-010: Agent Memory (tokens) |
| 2 | USERS | Profiles, RLS | v5-011: Pattern Discovery (user behavior) |
| 3 | PRODUCTS | Catalog | v5-004: Vector DB (product search) |
| 4 | ORDERS | Order Processing | v5-022: Reports (order summaries) |
| 5 | PRICING | B2B Pricing | v5-012: Confidence Scoring (price accuracy) |
| 6 | CONTRACTS | Legal Docs | v5-013: Learning Logs (contract history) |
| 7 | GMAIL | Email Sync | v5-010: Memory System (email analysis) |
| 8 | ANALYTICS | Event Tracking | v5-011: Pattern Discovery (user actions) |
| 9 | GDPR | Data Privacy | v5-001: Analyzer (GDPR compliance) |
| 10 | APPLE CONTACTS | iOS Integration | v5-005: Knowledge Graph (contact relationships) |
| 11 | GOOGLE CONTACTS | Android Integration | v5-005: Knowledge Graph (contact sync) |
| 12 | OUTLOOK CONTACTS | Web Integration | v5-002: Organizer (contact organization) |

## MASTER_TEACHER (v5-003) Continuous Improvements

Every night at 01:00, MASTER_TEACHER runs analysis that can:
1. Detect errors in PHASE 1-12 implementations
2. Find performance bottlenecks
3. Suggest optimizations
4. Update patterns for TASK-v5-011

Example: "PHASE 12 Outlook sync has lower accuracy on corporate emails → Update contact classifier"
```

---

### TASK 8️⃣: Обновить GitHub Actions & CI/CD

**Файл: super-brain-digital-twin/.github/workflows/cross-repo-validation.yml**

```yaml
name: Cross-Repo Validation

on:
  push:
    branches: [main, develop]

jobs:
  validate-schemas:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v3
        with:
          repository: vik9541/97k-backend
      
      - name: Compare prisma schemas
        run: |
          BACKEND_SCHEMA=$(cat prisma/schema.prisma)
          curl -s https://raw.githubusercontent.com/vik9541/97k-database/main/prisma/schema.prisma > /tmp/db_schema.prisma
          diff <(echo "$BACKEND_SCHEMA") /tmp/db_schema.prisma || echo "⚠️ Schemas differ - sync needed"
      
      - name: Validate all README links
        run: |
          for repo in 97k-backend 97k-frontend 97k-database 97k-infrastructure 97k-n8n-workflows 97k-97v-specs; do
            echo "Checking $repo README links..."
            # Link validation script
          done
```

---

## 📅 TIMELINE

```
DAY 1 (сегодня):
  ✅ Approve reorganization plan
  ⏳ Create branches in all repos

DAYS 2-3:
  ⏳ Create STRUCTURE.md & INDEX.md
  ⏳ Update all README.md files

DAYS 4-5:
  ⏳ Sync prisma schemas
  ⏳ Update 97k-database

DAYS 6-7:
  ⏳ Create PHASE_MAPPING.md
  ⏳ Create ARCHITECTURE_ALIGNMENT.md

DAYS 8-9:
  ⏳ Validate everything
  ⏳ Merge & Deploy

RESULT:
  ✅ Single source of truth: super-brain-digital-twin v5.0
  ✅ Clear hierarchy: 7 projects properly linked
  ✅ Zero confusion: all documentation cross-referenced
  ✅ Maintainability: easy to add PHASE 13, 14, ...
```

---

## ✅ SUCCESS CRITERIA

- [ ] MASTER_README.md is apex - everything links to it
- [ ] All 7 repos have updated README.md pointing to super-brain-digital-twin
- [ ] STRUCTURE.md clearly shows hierarchy
- [ ] INDEX.md has working links to all 150+ documents
- [ ] prisma/schema.prisma synchronized across 97k-backend & 97k-database
- [ ] PHASE documents linked to TASK-v5 where applicable
- [ ] GitHub Actions validates cross-repo consistency
- [ ] Zero broken links in any documentation

---

**Status:** 🟢 READY FOR EXECUTION  
**Owner:** @vik9541  
**Started:** 2025-12-13  
**Target Completion:** 2025-12-22
