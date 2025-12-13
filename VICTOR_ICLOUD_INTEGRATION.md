# Victor iCloud System Integration

## Архитектура системы Виктора Лаврентьева

```
┌─────────────────────────────────────────────────────────────────────────────┐
│                        VICTOR SYSTEM ARCHITECTURE                           │
│                      info@97v.ru | PRIMARY_ADMIN                           │
└─────────────────────────────────────────────────────────────────────────────┘

                              ┌─────────────────┐
                              │   iPhone 📱     │
                              │   Виктора       │
                              └────────┬────────┘
                                       │
                    ┌──────────────────┼──────────────────┐
                    │                  │                  │
                    ▼                  ▼                  ▼
        ┌───────────────────┐ ┌───────────────┐ ┌───────────────────┐
        │   Apple iCloud    │ │  Telegram     │ │   Voice/Notes     │
        │   Contacts        │ │  @97v_bot     │ │                   │
        └─────────┬─────────┘ └───────┬───────┘ └─────────┬─────────┘
                  │                   │                   │
                  │    Apple OAuth    │    Webhook        │  (Future)
                  │                   │                   │
                  ▼                   ▼                   ▼
┌─────────────────────────────────────────────────────────────────────────────┐
│                           97K BACKEND (NestJS)                              │
│                                                                             │
│  ┌─────────────────────────────────────────────────────────────────────┐   │
│  │                     VICTOR SYSTEM CONNECTOR                          │   │
│  │                  (Central Integration Hub)                           │   │
│  └─────────────────────────────────────────────────────────────────────┘   │
│         │                       │                        │                 │
│         ▼                       ▼                        ▼                 │
│  ┌─────────────┐        ┌──────────────┐        ┌──────────────────┐      │
│  │   Apple     │        │   Telegram   │        │   Victor iCloud  │      │
│  │   Auth      │        │   Bot        │        │   Service        │      │
│  │   Service   │        │   Service    │        │                  │      │
│  └─────────────┘        └──────────────┘        └──────────────────┘      │
│         │                       │                        │                 │
│         └───────────────────────┼────────────────────────┘                 │
│                                 │                                          │
│                                 ▼                                          │
│                    ┌────────────────────────┐                              │
│                    │     Event Emitter      │                              │
│                    │  (System Events Bus)   │                              │
│                    └────────────────────────┘                              │
│                                 │                                          │
└─────────────────────────────────┼──────────────────────────────────────────┘
                                  │
                                  ▼
                    ┌────────────────────────┐
                    │   PostgreSQL (Prisma)  │
                    │                        │
                    │  ┌──────────────────┐  │
                    │  │     users        │  │
                    │  │     contacts     │  │
                    │  │  victor_observations │
                    │  │  victor_daily_summaries │
                    │  │  apple_contacts_sync │
                    │  └──────────────────┘  │
                    └────────────────────────┘
```

## API Endpoints

### Apple Sign-In Integration
```
GET  /api/apple/auth        → Redirect to Apple Sign-In
POST /api/apple/callback    → OAuth callback (form_post)
GET  /api/apple/callback    → OAuth callback (fallback)
GET  /api/apple/status      → Connection status [Auth]
POST /api/apple/disconnect  → Disconnect Apple [Auth]
POST /api/apple/refresh     → Refresh tokens [Auth]
```

### Telegram Bot (@97v_bot)
```
POST /api/telegram/webhook   → Telegram updates
GET  /api/telegram/health    → Bot health check
POST /api/telegram/notify    → Send notification to Victor
POST /api/telegram/set-webhook → Manual webhook setup
```

### Victor System
```
GET  /api/victor/system/status    → Full system status
POST /api/victor/system/sync      → Initiate full sync [Auth]
GET  /api/victor/system/summary   → Daily summary
POST /api/victor/system/connect/apple    → Connect Apple [Auth]
POST /api/victor/system/disconnect/apple → Disconnect Apple [Auth]
POST /api/victor/system/export    → Export data [Auth]
POST /api/victor/system/notify    → Send notification
GET  /api/victor/system/health    → System health
```

### Victor iCloud Contacts (from previous implementation)
```
POST /api/victor/icloud/init    → Initialize sync
POST /api/victor/icloud/sync    → Sync contacts
GET  /api/victor/contacts       → Get all contacts
GET  /api/victor/contacts/stats → Contact statistics
GET  /api/victor/contacts/export → Export contacts
```

## Telegram Bot Commands (@97v_bot)

| Команда | Описание |
|---------|----------|
| `/start` | Приветствие и инструкции |
| `/help` | Справка по командам |
| `/meeting [описание]` | Записать встречу |
| `/встреча [описание]` | Записать встречу (RU) |
| `/task [описание]` | Создать задачу |
| `/задача [описание]` | Создать задачу (RU) |
| `/idea [описание]` | Записать идею |
| `/идея [описание]` | Записать идею (RU) |
| `/contacts` | Показать контакты |
| `/контакты` | Показать контакты (RU) |
| `/sync` | Синхронизация с iCloud |
| `/синхр` | Синхронизация (RU) |
| `/stats` | Статистика системы |
| `/статистика` | Статистика (RU) |

**Дополнительные возможности:**
- 📱 Отправка контакта → автоматическое сохранение
- 📍 Отправка геолокации → запись места
- 🎤 Голосовое сообщение → сохранение (транскрипция в будущем)

## Database Schema (Victor-specific)

### New Enums
```prisma
enum UserRole {
  CUSTOMER_B2C
  CUSTOMER_B2B
  MANAGER
  ADMIN
  PRIMARY_ADMIN  // Лаврентьев В.П. (Level 100)
}

enum ObservationType {
  MEETING     // Встреча
  TASK        // Задача
  IDEA        // Идея
  CONTACT     // Новый контакт
  NOTE        // Заметка
  LOCATION    // Локация
  VOICE       // Голосовое
  REMINDER    // Напоминание
}
```

### New Models
```prisma
model VictorObservation {
  id                BigInt
  userId            String
  type              ObservationType
  content           String
  metadata          Json?
  relatedContactIds BigInt[]
  source            String    // 'telegram', 'icloud', 'manual'
  telegramMessageId BigInt?
  aiProcessed       Boolean
  aiSummary         String?
  aiActions         Json?
  createdAt         DateTime
  processedAt       DateTime?
}

model VictorDailySummary {
  id               BigInt
  userId           String
  date             DateTime
  contactsTotal    Int
  contactsNew      Int
  observationsTotal Int
  meetingsCount    Int
  tasksCompleted   Int
  tasksPending     Int
  summary          String?
  highlights       Json?
  appleSynced      Boolean
}
```

### User Model Extensions
```prisma
model User {
  // ... existing fields
  name        String?   // Full name
  appleUserId String?   @unique  // Apple Sign-In ID
  isVerified  Boolean   @default(false)
  appleContactsSync AppleContactsSync?
}
```

## Environment Variables

```env
# Apple Sign-In
APPLE_CLIENT_ID=ru.97v.contacts
APPLE_TEAM_ID=YOUR_TEAM_ID
APPLE_KEY_ID=YOUR_KEY_ID
APPLE_PRIVATE_KEY=-----BEGIN PRIVATE KEY-----...
APPLE_REDIRECT_URI=https://api.97v.ru/api/apple/callback

# Telegram Bot
TELEGRAM_BOT_TOKEN=your_bot_token_from_botfather
TELEGRAM_WEBHOOK_URL=https://api.97v.ru/api/telegram/webhook
VICTOR_TELEGRAM_ID=victor_telegram_numeric_id
```

## Data Flow

### 1. Apple Sign-In Flow
```
Victor opens 97v.ru
       │
       ▼
GET /api/apple/auth
       │
       ▼
Redirect to Apple Sign-In
       │
       ▼
User authorizes app
       │
       ▼
POST /api/apple/callback (code, state, user)
       │
       ▼
Exchange code for tokens
       │
       ▼
Create/Update Victor user
       │
       ▼
Save Apple credentials
       │
       ▼
Redirect to success page
```

### 2. Telegram Bot Flow
```
Victor sends message to @97v_bot
       │
       ▼
Telegram sends webhook to /api/telegram/webhook
       │
       ▼
TelegramBotService.handleUpdate()
       │
       ├─ Command? → handleCommand()
       │              ├─ /meeting → saveObservation(MEETING)
       │              ├─ /task → saveObservation(TASK)
       │              ├─ /idea → saveObservation(IDEA)
       │              └─ /sync → initializeFullSync()
       │
       ├─ Contact? → handleContactShare() → prisma.contact.create()
       │
       ├─ Location? → handleLocationShare() → saveObservation(LOCATION)
       │
       └─ Text? → saveObservation(NOTE)
```

### 3. System Sync Flow
```
POST /api/victor/system/sync
       │
       ▼
VictorSystemConnector.initializeFullSync()
       │
       ├─ Validate Apple token
       │       │
       │       ▼
       │  Sync iCloud contacts
       │
       ├─ Check Telegram status
       │
       └─ Emit 'sync.completed' event
              │
              ▼
        Notify Victor via Telegram
```

## Testing

```bash
# Run all integration tests
npm run test -- --testPathPattern="integrations"

# Run specific test suites
npm run test -- --testPathPattern="apple"
npm run test -- --testPathPattern="telegram"
npm run test -- --testPathPattern="system"

# Current test count: 38 tests passing
```

## Security Considerations

1. **Apple Sign-In**: Uses ES256 signed JWT for client_secret
2. **Telegram Bot**: Only responds to Victor (verified by VICTOR_TELEGRAM_ID)
3. **API Endpoints**: Protected by JwtAuthGuard where needed
4. **Password**: Auto-generated for Apple Sign-In users (not used)

## Next Steps

1. **Phase 14**: Calendar integration (Apple Calendar)
2. **Phase 15**: Reminders integration
3. **Voice transcription**: Whisper API integration
4. **AI Agents**: Process observations with 3 AI agents
5. **Real-time sync**: WebSocket notifications for contact changes

---

**Owner**: Лаврентьев Виктор Петрович  
**Email**: info@97v.ru  
**Role**: PRIMARY_ADMIN (Level 100)  
**Telegram**: @97v_bot
