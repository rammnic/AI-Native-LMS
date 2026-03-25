# Промпт: SRE Basics — Site Reliability Engineering Fundamentals

## Основной промпт для LMS

```
Хочу изучить Site Reliability Engineering (SRE). Знаю основы DevOps, Linux, немного Kubernetes и Docker.

Цель: понять SRE-подход к надежности и начать применять SRE-практики.

Покрыть:
- Что такое SRE и чем отличается от DevOps
- SLI, SLO, SLA — что это и как определять
- Error budgets — как использовать для релизов
- Мониторинг — что и как мониторить
- Alerting — когда слать алерты, чтобы не было fatigue
- Incident management — от обнаружения до postmortem
- Toil — что это, как измерять и сокращать
- Runbooks — как писать и зачем
- On-call — как организовать дежурства
- Безопасность и надежность

Формат: практический курс с примерами из реальных компаний.
```

---

## Параметры генерации

```json
{
  "user_prompt": "Хочу изучить Site Reliability Engineering (SRE)...",
  "difficulty": "intermediate",
  "depth_limit": 3
}
```

---

## Ожидаемая структура курса

```
📁 Введение в SRE
   📖 Что такое SRE
   📖 История SRE (Google)
   📖 SRE vs DevOps — в чём разница
   📖 Роль SRE-инженера
   📖 Core responsibilities

📁 SLI, SLO, SLA
   📖 Что такое SLI (Service Level Indicator)
   📖 Что такое SLO (Service Level Objective)
   📖 Что такое SLA (Service Level Agreement)
   📖 Как выбрать правильные метрики
   📖 Dashboard и reporting
   💻 Practice: Определить SLO для своего сервиса

📁 Error Budgets
   📖 Что такое error budget
   📖 Как вычислять
   📖 Error budget policy — что делать когда заканчивается
   📖 Error budget как инструмент для релизов
   💻 Practice: Посчитать error budget

📁 Мониторинг
   📖 Что мониторить (RED method, USE method)
   📖 Метрики vs логи vs трассировка
   📖 Prometheus — структура метрик
   📖 Grafana — дашборды для SRE
   💻 Practice: Создать SRE dashboard

📁 Alerting
   📖 Принципы алертинга
   📖 Alert fatigue — как избежать
   📖 Severity levels
   📖 PagerDuty / OpsGenie basics
   📖 Alerting rules (Prometheus rules)
   💻 Practice: Написать alerting rules

📁 Incident Management
   📖 Жизненный цикл инцидента
   📖 Severity levels (SEV1, SEV2, etc.)
   📖 Роли: Incident Commander, Communications Lead
   📖 Status page и коммуникации
   📖 War room
   💻 Practice: Провести incident drill

📁 Postmortems
   📖 Что такое postmortem
   📖 Blameless culture
   📖 Структура postmortem
   📖 5 Whys метод
   📖 Action items и follow-up
   💻 Practice: Написать postmortem

📁 Toil
   📖 Что такое toil
   📖 Как измерять toil
   📖 Toil budget (50%)
   📖 Автоматизация вместо ручной работы
   💻 Practice: Найти toil в своей работе

📁 Runbooks
   📖 Что такое runbook
   📖 Как писать хорошие runbooks
   📖 Automation vs manual
   📖 Runbook templates
   💻 Practice: Написать runbook

📁 On-Call
   📖 Как организовать on-call
   📖 Rotation и escalation
   📖 Compensation и burn-out
   📖 Нужные инструменты
   💻 Practice: Настроить on-call rotation

📁 Reliability Patterns
   📖 Circuit breaker
   📖 Retry patterns
   📖 Fallback strategies
   📖 Graceful degradation
   💻 Practice: Implement circuit breaker

📁 Security для SRE
   📖 Безопасность как часть reliability
   📖 Secrets management
   📖 Vulnerability management
   📖 Incident response

📁 SRE и команда
   📖 Как работать с разработчиками
   📖 SLO negotiation
   📖 Error budget reviews
   📖 Книги: SRE book, Implementing SRE
```

---

*Дата создания: 2026-03-24*