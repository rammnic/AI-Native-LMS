# AI-Native LMS — DevOps Guide

## Описание

Руководство по развёртыванию и эксплуатации AI-Native LMS на локальной машине.

---

## Требования к окружению

### Обязательные компоненты

| Компонент | Версия | Назначение |
|-----------|--------|------------|
| Docker Desktop | 24.0+ | Контейнеризация |
| Docker Compose | 2.20+ | Оркестрация сервисов |
| Git | 2.40+ | Контроль версий |

### Опциональные компоненты

| Компонент | Версия | Назначение |
|-----------|--------|------------|
| Node.js | 20.x | Локальная разработка frontend |
| Python | 3.11+ | Локальная разработка backend |
| PostgreSQL Client | 16.x | Отладка БД |

---

## Переменные окружения

### Корневой `.env` файл

Создайте файл `.env` в корне проекта:

```env
# ============================================
# JWT Configuration
# ============================================
# Секретный ключ для подписи JWT токенов
# В продакшене использовать сложный случайный ключ
JWT_SECRET=dev-secret-key-change-in-production

# ============================================
# AI Configuration
# ============================================
# Включить mock-режим AI (без реальных API вызовов)
AI_MOCK_ENABLED=true

# API ключ OpenRouter (если AI_MOCK_ENABLED=false)
# Получить на https://openrouter.ai/settings
OPENROUTER_API_KEY=your_openrouter_api_key_here

# ============================================
# Database Configuration
# ============================================
# Формируется автоматически в docker-compose.yml
# DATABASE_URL=postgresql+asyncpg://lms_user:lms_password@postgres:5432/ai_lms
```

### Backend `.env` файл

```env
# Backend/.env (опционально, значения по умолчанию)
DATABASE_URL=postgresql+asyncpg://lms_user:lms_password@localhost:5432/ai_lms
JWT_SECRET=dev-secret-key-change-in-production
AI_API_URL=http://localhost:8000
AI_MOCK_ENABLED=true
```

---

## Команды управления

### Запуск всех сервисов

```bash
# Запуск в фоновом режиме
docker-compose up -d

# Запуск с просмотром логов
docker-compose up

# Запуск с пересборкой образов
docker-compose up --build
```

### Остановка сервисов

```bash
# Остановка всех сервисов
docker-compose down

# Остановка с удалением томов (БД будет очищена)
docker-compose down -v
```

### Просмотр статуса

```bash
# Статус всех контейнеров
docker-compose ps

# Статус конкретного сервиса
docker-compose ps backend
docker-compose ps frontend
docker-compose ps postgres
```

### Просмотр логов

```bash
# Логи всех сервисов
docker-compose logs -f

# Логи конкретного сервиса
docker-compose logs -f backend
docker-compose logs -f frontend
docker-compose logs -f postgres
docker-compose logs -f ai-framework

# Логи с временными метками
docker-compose logs -f -t backend
```

### Перезапуск сервисов

```bash
# Перезапуск всех сервисов
docker-compose restart

# Перезапуск конкретного сервиса
docker-compose restart backend
docker-compose restart frontend
```

---

## Проверка работоспособности

### Health Checks

| Сервис | URL | Ожидаемый ответ |
|--------|-----|-----------------|
| Frontend | http://localhost:3000 | Next.js страница |
| Backend | http://localhost:8001 | `{"status":"ok",...}` |
| Backend Health | http://localhost:8001/health | `{"status":"healthy",...}` |
| AI Framework | http://localhost:8000 | FastAPI ответ |
| PostgreSQL | localhost:5432 | Подключение установлено |

### Проверка через curl

```bash
# Проверка backend
curl http://localhost:8001/health

# Проверка frontend
curl -I http://localhost:3000

# Проверка PostgreSQL
docker exec ai-lms-postgres pg_isready -U lms_user -d ai_lms
```

---

## Доступ к сервисам

### База данных PostgreSQL

```bash
# Подключение через docker exec
docker exec -it ai-lms-postgres psql -U lms_user -d ai_lms

# Подключение извне (например, DBeaver)
# Host: localhost
# Port: 5432
# Database: ai_lms
# User: lms_user
# Password: lms_password
```

### Backend API

```bash
# Base URL
http://localhost:8001

# Документация API (Swagger UI)
http://localhost:8001/docs

# Альтернативная документация (ReDoc)
http://localhost:8001/redoc
```

### Frontend

```bash
# URL
http://localhost:3000

# Hot Reload включён в режиме разработки
```

---

## Backup и Restore

### Backup базы данных

```bash
# Создание дампа
docker exec ai-lms-postgres pg_dump -U lms_user ai_lms > backup_$(date +%Y%m%d_%H%M%S).sql

# Создание дампа со сжатием
docker exec ai-lms-postgres pg_dump -U lms_user ai_lms | gzip > backup_$(date +%Y%m%d).sql.gz
```

### Restore базы данных

```bash
# Восстановление из дампа
docker exec -i ai-lms-postgres psql -U lms_user ai_lms < backup_20240317.sql

# Восстановление из сжатого дампа
gunzip -c backup_20240317.sql.gz | docker exec -i ai-lms-postgres psql -U lms_user ai_lms
```

---

## Troubleshooting

### Частые проблемы

#### 1. Контейнеры не запускаются

```bash
# Проверить статус
docker-compose ps

# Проверить логи
docker-compose logs backend

# Частая причина: занят порт
# Проверить занятые порты
netstat -ano | findstr "3000 8000 8001 5432"
```

#### 2. Ошибка подключения к PostgreSQL

```bash
# Проверить статус PostgreSQL
docker-compose logs postgres

# Проверить здоровье
docker inspect ai-lms-postgres --format='{{.State.Health.Status}}'

# Подождать пока БД будет готова (healthcheck)
docker-compose up -d postgres
sleep 10
docker-compose up -d
```

#### 3. Frontend не загружается

```bash
# Проверить логи
docker-compose logs frontend

# Возможные причины:
# - Backend недоступен
# - Ошибки сборки

# Пересобрать frontend
docker-compose build frontend
docker-compose up -d frontend
```

#### 4. Ошибка "AI_MOCK_ENABLED"

```bash
# Если AI_MOCK_ENABLED=false, нужен API ключ
# Проверить .env файл
cat .env

# Перезапустить сервисы после изменения .env
docker-compose down
docker-compose up -d
```

#### 5. CORS ошибки

```bash
# Проверить настройки CORS в backend/main.py
# Должны быть разрешены:
# - http://localhost:3000
# - http://localhost:3001
```

### Очистка и пересоздание

```bash
# Полная очистка (удаляет все контейнеры, образы, тома, сети)
docker-compose down -v --rmi all

# Очистка только томов (БД)
docker-compose down -v

# Очистка неиспользуемых образов
docker image prune -f

# Очистка неиспользуемых томов
docker volume prune -f
```

---

## Структура сервисов

```
┌─────────────────────────────────────────────────────────────────┐
│                     AI-Native LMS                               │
├─────────────────────────────────────────────────────────────────┤
│                                                                  │
│  ┌──────────────┐    ┌──────────────┐    ┌──────────────┐      │
│  │   Frontend   │    │    Backend   │    │ AI Framework │      │
│  │  (Next.js)   │───▶│  (FastAPI)   │───▶│  (FastAPI)   │      │
│  │   :3000      │    │   :8001      │    │   :8000      │      │
│  └──────────────┘    └──────────────┘    └──────────────┘      │
│         │                   │                                    │
│         │                   ▼                                    │
│         │           ┌──────────────┐                             │
│         │           │  PostgreSQL  │                             │
│         │           │    :5432     │                             │
│         │           └──────────────┘                             │
│         │                                                       │
│         └─────────► (Browser LocalStorage)                      │
│                                                                  │
└─────────────────────────────────────────────────────────────────┘
```

### Портmap

| Сервис | Внутренний порт | Внешний порт | Протокол |
|--------|-----------------|--------------|----------|
| Frontend | 3000 | 3000 | HTTP |
| Backend | 8001 | 8001 | HTTP |
| AI Framework | 8000 | 8000 | HTTP |
| PostgreSQL | 5432 | 5432 | TCP |

---

## Мониторинг

### Ресурсы контейнеров

```bash
# Просмотр использования ресурсов
docker stats

# Просмотр с автоматическим обновлением
docker stats --no-stream
```

### Логи с фильтрацией

```bash
# Только ошибки
docker-compose logs --since=5m | grep -i error

# Только предупреждения
docker-compose logs --since=5m | grep -i warn
```

---

## Безопасность (для локальной разработки)

### Рекомендации

1. **Не использовать в публичных сетях** — сервисы слушают только localhost
2. **Сильные пароли** — в продакшене использовать сложные пароли
3. **JWT Secret** — в продакшене использовать случайный ключ
4. **HTTPS** — настроить в продакшене с TLS сертификатами

### Для прода (TODO)

- [ ] Настроить HTTPS (nginx reverse proxy)
- [ ] Настроить firewall
- [ ] Использовать secrets management
- [ ] Настроить backup по расписанию
- [ ] Настроить мониторинг (Prometheus/Grafana)

---

## Ссылки

- Docker: https://docs.docker.com/
- Docker Compose: https://docs.docker.com/compose/
- Next.js: https://nextjs.org/docs
- FastAPI: https://fastapi.tiangolo.com/
- PostgreSQL: https://www.postgresql.org/docs/