# Промпт: SysAdmin Junior → Middle — рост системного администратора

## Основной промпт для LMS

```
Работаю Junior SysAdmin, администрирую Linux-серверы, настраиваю базовые сервисы, 
умею писать простые скрипты.

Цель: стать Middle SysAdmin с навыками автоматизации, безопасности и production-практиками.

Покрыть:
- Продвинутый Bash/Python скриптинг
- Docker и Docker Compose для сервисов
- Nginx как reverse proxy и load balancer
- CI/CD basics для инфраструктуры
- Мониторинг (Prometheus, Grafana, Alertmanager)
- Логирование централизованное (ELK/EFK stack)
- Резервное копирование и disaster recovery
- High Availability (keepalived, HAProxy)
- Безопасность серверов (hardening)
- Infrastructure as Code (Ansible basics)
- Автоматизация рутинных задач
- VLAN, VPN, сетевая безопасность
- LDAP/Active Directory интеграция

Формат: production-oriented курс с акцентом на надёжность и автоматизацию.
```

---

## Параметры генерации

```json
{
  "user_prompt": "Работаю Junior SysAdmin...",
  "difficulty": "intermediate",
  "depth_limit": 3
}
```

---

## Ожидаемая структура курса

```
📁 Продвинутый скриптинг
   📁 Bash
      📖 Функции и аргументы
      📖 Массивы и словари
      📖 Обработка ошибок
      📖 Debugging скриптов
      💻 Practice: Скрипт для деплоя

   📁 Python для админов
      📖 Python basics (для тех, кто не знает)
      📖 Работа с файлами и JSON
      📖 Запросы к API (requests)
      📖 Параллельное выполнение
      💻 Practice: Автоматизация с Python

📁 Контейнеризация
   📁 Docker
      📖 Docker deep dive (чем отличается от VM)
      📖 Images, containers, volumes, networks
      📖 Dockerfile best practices
      📖 Multi-stage builds
      💻 Practice: Контейнеризировать приложение

   📁 Docker Compose
      📖 docker-compose.yml синтаксис
      📖 Запуск связанных сервисов
      📖 Переменные окружения
      💻 Practice: Развернуть стек (DB + App + Nginx)

   📁 Registry и CI
      📖 Docker Registry (свой)
      📖 GitHub Actions для Docker
      💻 Practice: Автоматический билд образов

📁 Reverse Proxy и Load Balancing
   📁 Nginx
      📖 nginx.conf структура
      📖 Virtual hosts
      📖 Reverse proxy
      📖 SSL/TLS termination
      📖 Caching
      💻 Practice: Настроить reverse proxy

   📁 High Availability
      📖 Keepalived для VIP
      📖 HAProxy basics
      💻 Practice: Настроить HA Nginx

📁 Мониторинг
   📁 Prometheus
      📖 Архитектура Prometheus
      📖 Exporters (node, nginx, postgres)
      📖 PromQL — запросы
      📖 Alerts — настройка
      💻 Practice: Мониторинг своего сервера

   📁 Grafana
      📖 Dashboards — создание и шаблоны
      📖 Alerts через Grafana
      📖 Data sources (Prometheus, InfluxDB)
      💻 Practice: Dashboard для своего сервиса

📁 Логирование
   📁 ELK Stack
      📖 Elasticsearch — что и как
      📖 Logstash/Grok — парсинг логов
      📖 Kibana — визуализация
      💻 Practice: Собрать логи в ELK

   📁 EFK Alternative
      📖 Fluentd/Fluent Bit
      📖 Loki basics
      💻 Practice: Loki + Grafana для логов

📁 Резервное копирование
   📁 Backup Strategy
      📖 3-2-1 правило
      📖 Что бэкапить
      📖 RTO и RPO

   📁 Backup Tools
      📖 rsync + snapshot (BTRFS/ZFS)
      📖 Restic — deduplication backup
      📖 Bacula basics
      💻 Practice: Настроить бэкапы с Restic

   📁 Disaster Recovery
      📖 Планы восстановления
      📖 Репликация баз данных
      📖 Failover процедуры

📁 Безопасность
   📁 Server Hardening
      📖 SSH hardening
      📖 Kernel parameters (sysctl)
      📖 Pam и auth
      📖 Auditd — аудит

   📁 Container Security
      📖 Не запускать от root
      📖 Scan images (Trivy)
      📖 Seccomp и AppArmor

   📁 Vulnerability Management
      📖 Сканирование (Lynis, OpenVAS)
      📖 Патчинг
      💻 Practice: Провести аудит своего сервера

📁 Infrastructure as Code
   📁 Ansible
      📖 Inventory
      📖 Ad-hoc commands
      📖 Playbooks
      📖 Roles
      💻 Practice: Ansible для конфигурации сервера

   📁 Terraform basics
      📖 HCL синтаксис
      📖 Providers
      📖 Resources
      💻 Practice: Провижионить VM через Terraform

📁 Сети для админов
   📁 VLAN
      📖 Что такое VLAN
      📖 Настройка на Linux (vconfig)
      💻 Practice: Изолированная сеть

   📁 VPN
      📖 WireGuard basics
      📖 OpenVPN
      💻 Practice: Настроить VPN

   📁 Firewall Advanced
      📖 nftables
      📖 Fail2ban
      💻 Practice: Настроить firewall

📁 Identity Management
   📁 LDAP basics
      📖 OpenLDAP
      📖 Directory structure
      💻 Practice: Интеграция с LDAP

   📁 SSSD и PAM
      📖 Аутентификация через AD/LDAP
```

---

*Дата создания: 2026-03-24*