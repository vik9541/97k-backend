# 🎯 VICTOR-CENTRIC SYSTEM ARCHITECTURE

**Версия**: 1.0.0  
**Дата**: 13 декабря 2025  
**Статус**: ✅ PRODUCTION READY

---

## 👤 ГЛАВНЫЙ АДМИНИСТРАТОР

```
┌─────────────────────────────────────────────────────────────┐
│                 ЛАВРЕНТЬЕВ ВИКТОР ПЕТРОВИЧ                  │
│                    Руководитель города                      │
├─────────────────────────────────────────────────────────────┤
│  📧 Email:     info@97v.ru                                  │
│  🤖 Telegram:  @97v_bot (ввод наблюдений)                   │
│  📱 Устройство: iPhone (iCloud Contacts Sync)               │
│  🔑 Role:      PRIMARY_ADMIN                                │
│  📊 Access:    Level 100 (Full System Access)               │
│  🏢 Позиция:   Главный источник всех данных                 │
└─────────────────────────────────────────────────────────────┘
```

---

## 🌐 СИСТЕМНЫЕ ПАРАМЕТРЫ

| Параметр | Значение |
|----------|----------|
| **Главный Email** | `info@97v.ru` |
| **Telegram Bot** | `@97v_bot` |
| **Домен системы** | `97v.ru` |
| **API домен** | `api.97v.ru` |
| **Устройство синхронизации** | iPhone (iCloud) |
| **Роль пользователя** | `PRIMARY_ADMIN` |
| **Уровень доступа** | `100` (максимальный) |

---

## 📊 VICTOR-CENTRIC DATA FLOW

```
┌─────────────────────────────────────────────────────────────────────┐
│                    ИСТОЧНИКИ ДАННЫХ ВИКТОРА                         │
├─────────────────────────────────────────────────────────────────────┤
│                                                                      │
│   📱 iPhone                 🤖 Telegram Bot              📧 Email    │
│   ┌─────────┐               ┌─────────────┐             ┌────────┐  │
│   │ iCloud  │               │  @97v_bot   │             │info@   │  │
│   │Contacts │               │ Наблюдения  │             │97v.ru  │  │
│   └────┬────┘               └──────┬──────┘             └───┬────┘  │
│        │                           │                        │       │
│        │    ┌──────────────────────┼────────────────────────┤       │
│        │    │                      │                        │       │
│        ▼    ▼                      ▼                        ▼       │
│   ┌─────────────────────────────────────────────────────────────┐   │
│   │              97k-backend (NestJS API)                       │   │
│   │  ┌───────────────┐  ┌──────────────┐  ┌─────────────────┐   │   │
│   │  │Apple Contacts │  │ Telegram Bot │  │ Email Processor │   │   │
│   │  │   Service     │  │   Handler    │  │    Service      │   │   │
│   │  └───────┬───────┘  └──────┬───────┘  └────────┬────────┘   │   │
│   │          │                 │                   │            │   │
│   │          └─────────────────┼───────────────────┘            │   │
│   │                            ▼                                │   │
│   │              ┌─────────────────────────┐                    │   │
│   │              │   VICTOR DATA STORE     │                    │   │
│   │              │   (PostgreSQL/Prisma)   │                    │   │
│   │              └────────────┬────────────┘                    │   │
│   └───────────────────────────┼─────────────────────────────────┘   │
│                               │                                     │
│                               ▼                                     │
│              ┌────────────────────────────────────┐                 │
│              │     3 АГЕНТА АНАЛИЗА (24/7)        │                 │
│              │  ┌──────────┐ ┌──────────┐ ┌──────────┐             │
│              │  │ PRIMARY  │ │ORGANIZER │ │ MASTER   │             │
│              │  │ ANALYZER │ │          │ │ TEACHER  │             │
│              │  └────┬─────┘ └────┬─────┘ └────┬─────┘             │
│              │       │            │            │                   │
│              │       └────────────┼────────────┘                   │
│              │                    ▼                                │
│              │        ┌───────────────────────┐                    │
│              │        │ INSIGHTS & ANALYTICS  │                    │
│              │        │  для Виктора          │                    │
│              │        └───────────────────────┘                    │
│              └────────────────────────────────────┘                 │
└─────────────────────────────────────────────────────────────────────┘
```

---

## 🗄️ DATABASE SCHEMA (Victor-Centric)

### Главные таблицы

```prisma
// ============================================
// VICTOR CORE - Профиль главного администратора
// ============================================
model VictorProfile {
  id              String    @id @default(uuid())
  email           String    @unique @default("info@97v.ru")
  fullName        String    @default("Лаврентьев Виктор Петрович")
  title           String    @default("Руководитель города")
  role            String    @default("PRIMARY_ADMIN")
  accessLevel     Int       @default(100)
  telegramUserId  String?   @unique
  iPhoneDeviceId  String?
  settings        Json?
  createdAt       DateTime  @default(now())
  updatedAt       DateTime  @updatedAt

  observations    VictorObservation[]
  contacts        VictorContact[]
  meetings        VictorMeeting[]
  projects        VictorProject[]
  documents       VictorDocument[]

  @@map("victor_profile")
}

// ============================================
// НАБЛЮДЕНИЯ ВИКТОРА (из Telegram Bot @97v_bot)
// ============================================
model VictorObservation {
  id              BigInt    @id @default(autoincrement())
  victorId        String
  source          String    @default("telegram_bot") // telegram_bot, email, manual
  category        String    // meeting, task, idea, note, decision
  content         String    @db.Text
  metadata        Json?     // дополнительные данные
  attachments     Json?     // фото, файлы
  sentiment       String?   // positive, neutral, negative
  priority        Int       @default(5) // 1-10
  processed       Boolean   @default(false)
  processedBy     String?   // agent name
  insights        Json?     // результаты анализа
  createdAt       DateTime  @default(now())
  updatedAt       DateTime  @updatedAt

  victor          VictorProfile @relation(fields: [victorId], references: [id])
  
  @@index([victorId])
  @@index([category])
  @@index([createdAt])
  @@map("victor_observations")
}

// ============================================
// КОНТАКТЫ ВИКТОРА (из iPhone iCloud)
// ============================================
model VictorContact {
  id                BigInt    @id @default(autoincrement())
  victorId          String
  appleContactId    String?   @unique
  googleContactId   String?   @unique
  outlookContactId  String?   @unique
  
  // Основная информация
  firstName         String?
  lastName          String?
  fullName          String
  company           String?
  jobTitle          String?
  
  // Контактные данные
  phoneNumbers      Json?     // [{type: "mobile", number: "+7999..."}]
  emails            Json?     // [{type: "work", email: "..."}]
  addresses         Json?     // [{type: "work", street: "...", city: "..."}]
  
  // Социальные сети
  socialProfiles    Json?
  
  // Фото
  photoUrl          String?
  photoData         Bytes?
  
  // Метаданные синхронизации
  lastSyncedAt      DateTime?
  syncSource        String?   // apple, google, outlook, manual
  syncVersion       Int       @default(1)
  
  // Аналитика
  engagementScore   Int       @default(0)
  lastInteractionAt DateTime?
  totalInteractions Int       @default(0)
  notes             String?   @db.Text
  tags              String[]
  
  createdAt         DateTime  @default(now())
  updatedAt         DateTime  @updatedAt

  victor            VictorProfile @relation(fields: [victorId], references: [id])
  activities        ContactActivity[]
  deals             Deal[]

  @@index([victorId])
  @@index([fullName])
  @@index([company])
  @@map("victor_contacts")
}

// ============================================
// ВСТРЕЧИ ВИКТОРА
// ============================================
model VictorMeeting {
  id              BigInt    @id @default(autoincrement())
  victorId        String
  title           String
  description     String?   @db.Text
  location        String?
  startTime       DateTime
  endTime         DateTime?
  participants    Json?     // [{contactId, name, role}]
  notes           String?   @db.Text
  actionItems     Json?     // [{task, assignee, deadline}]
  status          String    @default("scheduled") // scheduled, completed, cancelled
  sourceObservation BigInt? // ссылка на наблюдение из Telegram
  createdAt       DateTime  @default(now())
  updatedAt       DateTime  @updatedAt

  victor          VictorProfile @relation(fields: [victorId], references: [id])

  @@index([victorId])
  @@index([startTime])
  @@map("victor_meetings")
}

// ============================================
// ПРОЕКТЫ ВИКТОРА
// ============================================
model VictorProject {
  id              BigInt    @id @default(autoincrement())
  victorId        String
  name            String
  description     String?   @db.Text
  status          String    @default("active") // active, paused, completed, archived
  priority        Int       @default(5)
  startDate       DateTime?
  endDate         DateTime?
  budget          Decimal?  @db.Decimal(15, 2)
  progress        Int       @default(0) // 0-100
  team            Json?     // [{contactId, name, role}]
  milestones      Json?     // [{name, date, status}]
  relatedObservations BigInt[] // связанные наблюдения
  createdAt       DateTime  @default(now())
  updatedAt       DateTime  @updatedAt

  victor          VictorProfile @relation(fields: [victorId], references: [id])

  @@index([victorId])
  @@index([status])
  @@map("victor_projects")
}

// ============================================
// ДОКУМЕНТЫ ВИКТОРА
// ============================================
model VictorDocument {
  id              BigInt    @id @default(autoincrement())
  victorId        String
  title           String
  type            String    // report, memo, letter, contract, note
  content         String?   @db.Text
  fileUrl         String?
  fileSize        Int?
  mimeType        String?
  tags            String[]
  sourceObservation BigInt? // если создан из наблюдения
  createdAt       DateTime  @default(now())
  updatedAt       DateTime  @updatedAt

  victor          VictorProfile @relation(fields: [victorId], references: [id])

  @@index([victorId])
  @@index([type])
  @@map("victor_documents")
}
```

---

## 🤖 TELEGRAM BOT INTEGRATION (@97v_bot)

### Команды бота для Виктора

```
/start        - Начать работу с ботом
/observe      - Записать наблюдение
/meeting      - Создать запись о встрече
/task         - Добавить задачу
/idea         - Записать идею
/contacts     - Синхронизация контактов
/report       - Получить отчёт
/insights     - AI-инсайты за период
/help         - Справка
```

### Пример взаимодействия

```
Виктор: Встреча с Петровым по проекту реконструкции. 
        Обсудили бюджет 15 млн, сроки - март 2026.
        
@97v_bot: ✅ Наблюдение записано!
         📝 Категория: meeting
         👤 Участник: Петров (найден в контактах)
         💰 Бюджет: 15,000,000 ₽
         📅 Срок: март 2026
         
         🔄 Создать встречу в календаре?
         📊 Добавить в проект "Реконструкция"?
```

---

## 📱 PHASE 10: APPLE CONTACTS FOR VICTOR

### Шаг 1: Авторизация Виктора

```bash
POST /api/auth/login
{
  "email": "info@97v.ru",
  "password": "secure-password"
}

ОТВЕТ:
{
  "accessToken": "eyJhbGc...",
  "user": {
    "id": "victor-primary-admin",
    "name": "Лаврентьев Виктор Петрович",
    "email": "info@97v.ru",
    "role": "PRIMARY_ADMIN",
    "accessLevel": 100
  }
}
```

### Шаг 2: Синхронизация iPhone контактов

```bash
POST /api/apple-contacts/sync
Authorization: Bearer {accessToken}

ОТВЕТ:
{
  "status": "syncing",
  "message": "Подтвердите доступ на вашем iPhone",
  "authUrl": "https://auth.apple.com/authorize?...",
  "syncId": "victor-sync-2025-12-13"
}
```

### Шаг 3: Получение контактов Виктора

```bash
GET /api/apple-contacts?status=synced
Authorization: Bearer {accessToken}

ОТВЕТ:
{
  "contacts": [
    {
      "id": "contact-123",
      "fullName": "Петров Иван Сергеевич",
      "company": "Администрация города",
      "jobTitle": "Заместитель главы",
      "phoneNumbers": [
        { "type": "mobile", "number": "+79991234567" },
        { "type": "work", "number": "+74951234567" }
      ],
      "emails": [
        { "type": "work", "email": "petrov@city-admin.ru" }
      ],
      "photo": {
        "url": "https://cdn.97v.ru/contacts/photos/petrov.jpg"
      },
      "engagementScore": 85,
      "lastInteractionAt": "2025-12-10T15:30:00Z",
      "syncedAt": "2025-12-13T14:30:00Z"
    },
    ...
  ],
  "totalCount": 247,
  "syncStatus": "complete",
  "owner": {
    "name": "Лаврентьев Виктор Петрович",
    "email": "info@97v.ru"
  }
}
```

### Шаг 4: Экспорт данных

```bash
# JSON формат
GET /api/apple-contacts/export
Authorization: Bearer {accessToken}
Accept: application/json

# CSV для Excel
GET /api/apple-contacts/export
Authorization: Bearer {accessToken}
Accept: text/csv

# PDF отчёт
GET /api/apple-contacts/export
Authorization: Bearer {accessToken}
Accept: application/pdf
```

---

## 🔐 БЕЗОПАСНОСТЬ

### Уровни доступа

| Уровень | Роль | Описание |
|---------|------|----------|
| 100 | PRIMARY_ADMIN | Лаврентьев В.П. - полный доступ |
| 80 | ADMIN | Администраторы системы |
| 60 | MANAGER | Менеджеры проектов |
| 40 | USER | Обычные пользователи |
| 20 | VIEWER | Только просмотр |

### GDPR Compliance

- ✅ Все данные принадлежат Виктору
- ✅ OAuth 2.0 авторизация для Apple/Google/Outlook
- ✅ Шифрование данных (AES-256)
- ✅ Право на удаление данных
- ✅ Аудит-логирование всех действий
- ✅ Двухфакторная аутентификация

---

## 📊 ЛОГИРОВАНИЕ

```
[2025-12-13 14:30:00] [PRIMARY_ADMIN] info@97v.ru
[2025-12-13 14:30:00] Action: LOGIN_SUCCESS
[2025-12-13 14:30:22] Action: APPLE_CONTACTS_SYNC_INITIATED
[2025-12-13 14:30:45] Action: DEVICE_AUTH_CONFIRMED (iPhone 15 Pro)
[2025-12-13 14:31:00] Status: 247 contacts synced
[2025-12-13 14:31:15] Action: PHOTOS_DOWNLOADED (245 MB)
[2025-12-13 14:31:45] Status: SYNC_COMPLETE
[2025-12-13 14:32:00] Action: TELEGRAM_OBSERVATION_RECEIVED
[2025-12-13 14:32:01] Agent: PRIMARY_ANALYZER processing...
[2025-12-13 14:32:05] Agent: ORGANIZER categorizing...
[2025-12-13 14:32:10] Agent: MASTER_TEACHER generating insights...
```

---

## 🚀 БЫСТРЫЙ СТАРТ

### 1. Клонировать проект

```bash
git clone https://github.com/vik9541/97k-backend
cd 97k-backend
npm install
```

### 2. Настроить environment

```bash
# .env файл
DATABASE_URL="postgresql://..."
JWT_SECRET="your-secret-key"
VICTOR_EMAIL="info@97v.ru"
TELEGRAM_BOT_TOKEN="your-bot-token"
APPLE_CLIENT_ID="your-apple-client-id"
APPLE_TEAM_ID="your-apple-team-id"
```

### 3. Запустить миграции

```bash
npx prisma migrate dev
npx prisma generate
```

### 4. Запустить сервер

```bash
npm run start:dev
# Server: http://localhost:3000
```

### 5. Создать профиль Виктора

```bash
curl -X POST http://localhost:3000/api/victor/init \
  -H "Content-Type: application/json" \
  -d '{
    "email": "info@97v.ru",
    "fullName": "Лаврентьев Виктор Петрович",
    "title": "Руководитель города",
    "telegramUserId": "123456789"
  }'
```

---

## 📋 СВЯЗАННЫЕ ДОКУМЕНТЫ

| Документ | Описание |
|----------|----------|
| [PHASE_10_APPLE_CONTACTS_INTEGRATION.md](./PHASE_10_APPLE_CONTACTS_INTEGRATION.md) | Apple Contacts API |
| [PHASE_11_COMPLETE_REPORT.md](./PHASE_11_COMPLETE_REPORT.md) | Google Contacts + Android |
| [PHASE_12_FINAL_REPORT.md](./PHASE_12_FINAL_REPORT.md) | Outlook Integration |
| [PHASE_13_ANALYTICS_REPORT.md](./PHASE_13_ANALYTICS_REPORT.md) | Analytics Dashboard |
| [README.md](./README.md) | Общая документация проекта |

---

## ✨ ИТОГО

**Система полностью настроена для Виктора:**

| Компонент | Статус |
|-----------|--------|
| Email: info@97v.ru | ✅ |
| Telegram Bot: @97v_bot | ✅ |
| iPhone Contacts Sync | ✅ |
| 3 AI Агента (24/7 анализ) | ✅ |
| Dashboard & Analytics | ✅ |
| GDPR Compliance | ✅ |
| Аудит-логирование | ✅ |

**Все данные крутятся вокруг Лаврентьева Виктора Петровича!** 🎯

---

*Документ создан: 13 декабря 2025*  
*Версия: 1.0.0*  
*Автор: GitHub Copilot (Claude Opus 4.5)*
