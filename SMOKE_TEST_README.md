# 🔥 SMOKE TEST — Проверка рабочих компонентов

**Дата:** 15 декабря 2025  
**Статус:** ✅ READY FOR EXECUTION  
**Версия:** v1.0

---

## 📋 Что проверяет Smoke Test?

Этот набор тестов проверяет ВСЕ критические компоненты после развёртывания:

| Компонент | Статус | Описание |
|-----------|--------|----------|
| 🟢 API Health | ✅ | Liveness & Readiness probes |
| 🔴 Telegram Bot | ✅ | Подключение к Telegram API |
| ⚡ Redis | ✅ | Connection, Write, Read, TTL (TZ-001) |
| 🗄️ PostgreSQL | ✅ | Подключение, запросы, производительность |
| 📁 File Upload | ✅ | Загрузка файлов (TZ-001) |
| 📋 File List | ✅ | Получение списка файлов |
| ⚙️ Batch Processing | ✅ | Массовая обработка файлов |
| 📊 Performance | ✅ | API response time < 1s |
| 💾 DB Performance | ✅ | Query time < 2s |
| 📤 Telegram Send | ✅ | Отправка сообщений в Telegram |

---

## 🚀 Быстрый старт

### 1️⃣ Установить зависимости

```bash
pip install -r requirements.txt

# Или если есть requirements-test.txt:
pip install -r requirements-test.txt
```

### 2️⃣ Настроить переменные окружения

Создать `.env` файл в корне проекта:

```bash
# API
API_URL=http://localhost:8000

# Telegram
TELEGRAM_BOT_TOKEN=YOUR_BOT_TOKEN_HERE
TELEGRAM_CHAT_ID=YOUR_CHAT_ID_HERE

# Database
DATABASE_URL=postgresql://user:password@localhost:5432/dbname
SUPABASE_URL=https://xxx.supabase.co
SUPABASE_KEY=your-supabase-key

# Redis
REDIS_URL=redis://localhost:6379

# JWT
JWT_SECRET=your-secret-key-min-32-chars-long
```

### 3️⃣ Запустить API локально (если не запущен)

```bash
# Вариант 1: FastAPI с Uvicorn
uvicorn main:app --reload --port 8000

# Вариант 2: NestJS
npm run start:dev

# Вариант 3: Docker
docker-compose up
```

### 4️⃣ Запустить Smoke Test

```bash
# Все тесты
pytest tests/smoke_test.py -v -s

# Конкретный тест
pytest tests/smoke_test.py::test_api_health_live -v -s

# С выводом лога
pytest tests/smoke_test.py -v -s --tb=short

# С покрытием (если нужно)
pytest tests/smoke_test.py --cov=. --cov-report=html
```

---

## 📊 Примеры вывода

### ✅ Успешный запуск

```
╔═══════════════════════════════════════════════════════════╗
║          SMOKE TEST ЗАПУЩЕНЕН                             ║
╠═══════════════════════════════════════════════════════════╣
║ API: http://localhost:8000                                ║
║ Bot Token: ✅ Configured                                  ║
║ Redis: redis://localhost:6379                             ║
║ DB: ✅ Configured                                          ║
╚═══════════════════════════════════════════════════════════╝

tests/smoke_test.py::test_api_health_live PASSED           [ 10%]
✅ Health/live: PASSED

tests/smoke_test.py::test_api_health_ready PASSED          [ 20%]
✅ Health/ready: PASSED (components: {'database': 'up', 'redis': 'up'})

tests/smoke_test.py::test_redis_connection PASSED          [ 30%]
✅ Redis: PASSED (connection, write, read)

tests/smoke_test.py::test_database_connection PASSED       [ 40%]
✅ Database: PASSED (files table accessible)

tests/smoke_test.py::test_telegram_bot_connection PASSED   [ 50%]
✅ Telegram Bot: PASSED (Bot: @astra_VIK_bot)

tests/smoke_test.py::test_telegram_send_message PASSED     [ 60%]
✅ Telegram Send: PASSED (message_id: 12345)

tests/smoke_test.py::test_file_upload_endpoint PASSED      [ 70%]
✅ File upload: PASSED (file_id: uuid-12345)

tests/smoke_test.py::test_file_list_endpoint PASSED        [ 80%]
✅ File list: PASSED (count: 15)

tests/smoke_test.py::test_redis_file_storage PASSED        [ 90%]
✅ Redis File Storage (TZ-001): PASSED (TTL: 12h)

tests/smoke_test.py::test_api_response_time PASSED         [100%]
✅ API Response Time: PASSED (245ms)

╔═══════════════════════════════════════════════════════════╗
║          SMOKE TEST ЗАВЕРШЁН ✅                            ║
╠═══════════════════════════════════════════════════════════╣
║                                                           ║
║  📅 Дата: 2025-12-15 13:15:30                            ║
║  🔗 API: http://localhost:8000                           ║
║  🤖 Bot: ✅ Ready                                          ║
║  🗄️  Database: ✅ Connected                               ║
║  ⚡ Redis: ✅ Connected                                    ║
║                                                           ║
║  ✅ Все критичные компоненты работают!                   ║
║                                                           ║
║  Следующие шаги:                                         ║
║  1. Запустить TZ-004 (Health Checks)                     ║
║  2. Запустить TZ-009 (JWT Auth)                          ║
║  3. Запустить TZ-002 (Redis Cache)                       ║
║                                                           ║
╚═══════════════════════════════════════════════════════════╝
```

### ⚠️ Если что-то не работает

```bash
# Тест с подробной информацией об ошибке
pytest tests/smoke_test.py -v -s --tb=long

# Только ошибки
pytest tests/smoke_test.py -v --tb=short -x  # остановиться на первой ошибке
```

---

## 🔧 Диагностика проблем

### ❌ "API не отвечает"

```bash
# Проверить что API запущен
curl http://localhost:8000/health/live

# Если не работает, запустить API
uvicorn main:app --reload
```

### ❌ "Redis connection refused"

```bash
# Проверить Redis
redis-cli ping

# Если не работает, запустить Redis
redis-server

# Или через Docker
docker run -d -p 6379:6379 redis:alpine
```

### ❌ "Database connection failed"

```bash
# Проверить переменные окружения
echo $DATABASE_URL
echo $SUPABASE_URL

# Проверить подключение
psql $DATABASE_URL -c "SELECT 1"
```

### ❌ "Telegram bot not authenticated"

```bash
# Проверить токен
echo $TELEGRAM_BOT_TOKEN

# Получить info о боте
curl https://api.telegram.org/bot$TELEGRAM_BOT_TOKEN/getMe
```

---

## 📈 CI/CD Integration

### GitHub Actions

Этот тест может работать в GitHub Actions перед деплоем:

```yaml
# .github/workflows/smoke-test.yml
name: Smoke Test

on:
  push:
    branches: [main]
  pull_request:
    branches: [main]

jobs:
  smoke-test:
    runs-on: ubuntu-latest
    
    services:
      postgres:
        image: postgres:15
        env:
          POSTGRES_PASSWORD: postgres
        options: >-
          --health-cmd pg_isready
          --health-interval 10s
          --health-timeout 5s
          --health-retries 5
      
      redis:
        image: redis:alpine
        options: >-
          --health-cmd "redis-cli ping"
          --health-interval 10s
          --health-timeout 5s
          --health-retries 5
    
    steps:
      - uses: actions/checkout@v3
      
      - name: Set up Python
        uses: actions/setup-python@v4
        with:
          python-version: '3.11'
      
      - name: Install dependencies
        run: |
          pip install pytest pytest-asyncio httpx
          pip install -r requirements.txt
      
      - name: Run smoke tests
        env:
          API_URL: http://localhost:8000
          TELEGRAM_BOT_TOKEN: ${{ secrets.TELEGRAM_BOT_TOKEN }}
          DATABASE_URL: ${{ secrets.DATABASE_URL }}
          REDIS_URL: redis://localhost:6379
        run: |
          pytest tests/smoke_test.py -v -s
```

---

## 📊 Метрики успеха

После успешного запуска Smoke Test должны выполниться все 10 тестов:

```
✅ test_api_health_live
✅ test_api_health_ready
✅ test_redis_connection
✅ test_database_connection
✅ test_telegram_bot_connection
✅ test_telegram_send_message
✅ test_file_upload_endpoint (TZ-001)
✅ test_file_list_endpoint
✅ test_redis_file_storage (TZ-001)
✅ test_api_response_time
✅ test_database_query_time
```

**Успех = 11/11 тестов PASSED ✅**

---

## 🎯 Что делать дальше?

Если все тесты прошли успешно:

### 1️⃣ Запустить TZ-004 (Health Checks)
- Добавить `/health/live` и `/health/ready` эндпоинты
- Добавить K8s probes

### 2️⃣ Запустить TZ-009 (JWT Auth)
- Добавить аутентификацию на все `/api/*` маршруты
- Добавить token refresh

### 3️⃣ Запустить TZ-002 (Redis Cache)
- Добавить кэширование ответов
- Добавить cache invalidation

### 4️⃣ Запустить TZ-003 (Vector DB)
- Интегрировать pgvector
- Добавить семантический поиск

### 5️⃣ Запустить TZ-005 (Batch Processing)
- Добавить `/api/files/batch/analyze`
- Добавить параллельную обработку

---

## 📞 Поддержка

Если возникли проблемы:

1. **Проверить логи:** `docker logs <container>`
2. **Проверить env:** `cat .env`
3. **Проверить статус:** `curl http://localhost:8000/health/live`
4. **Создать issue:** https://github.com/vik9541/97k-backend/issues

---

**Автор:** vik9541  
**Последнее обновление:** 15 декабря 2025  
**Статус:** 🟢 PRODUCTION READY
