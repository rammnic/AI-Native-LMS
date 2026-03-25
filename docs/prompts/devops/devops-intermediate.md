# Промпт: DevOps Intermediate — Junior → Middle DevOps

## Основной промпт для LMS

Скопируйте этот промпт в интерфейс LMS при создании нового курса:

---

```
Хочу пройти полноценный курс по DevOps для роста до Middle уровня.

Мой бэкграунд: работаю Junior DevOps-инженером, знаком с основами Linux, Git, Docker, базовым CI/CD. Умею писать простые скрипты на Bash/Python. Понимаю базовые концепции облаков (AWS/GCP).

Цель: стать уверенным Middle DevOps-инженером с глубокими навыками для production-работы.

Покрыть все ключевые области DevOps:
- Linux administration (продвинутый уровень)
- Git и работа с репозиториями (advanced)
- CI/CD (Jenkins, GitLab CI, GitHub Actions)
- Контейнеризация (Docker, Docker Compose)
- Оркестрация (Kubernetes — от основ до продвинутых тем)
- Infrastructure as Code (Terraform, Ansible)
- Мониторинг и логирование (Prometheus, Grafana, ELK)
- Cloud platforms (AWS/GCP/Azure — основы)
- Security (DevSecOps basics)

Формат: глубокий курс с теорией и практикой. Каждая тема должна раскрываться последовательно — от простого к сложному. Практические задания должны быть реалистичными и применимыми в работе.
```

---

## Параметры генерации

При вызове API используйте:

| Параметр | Значение | Описание |
|----------|----------|----------|
| `user_prompt` | Текст выше | Запрос пользователя |
| `difficulty` | `intermediate` | Учитывает имеющийся опыт |
| `depth_limit` | `3` | Структура: Тема → Подтема → Уроки |

```json
{
  "user_prompt": "Хочу пройти полноценный курс по DevOps для роста до Middle уровня...",
  "difficulty": "intermediate",
  "depth_limit": 3
}
```

---

## Ожидаемая структура курса

После генерации курс будет иметь следующую иерархию:

```
📁 Linux Administration
   📁 Advanced Shell & Scripting
      📖 Bash scripting fundamentals
      📖 Regular expressions & text processing
      📖 Process management
      📖 Cron и планировщики
      💻 Practice: Automation scripts
   
   📁 System Administration
      📖 Users, permissions, security
      📖 Systemd deep dive
      📖 Logs и syslog
      💻 Practice: Server hardening

📁 Version Control
   📁 Git Fundamentals
      📖 Git basics и концепции
      📖 Branching strategies (Git Flow)
      📖 Merge vs Rebase
      💻 Practice: Git workflow
   
   📁 Advanced Git
      📖 Submodules
      📖 Git hooks
      💻 Practice: Custom hooks

📁 CI/CD
   📁 GitHub Actions
      📖 Workflow basics
      📖 Jobs и steps
      📖 Secrets и environments
      💻 Practice: Build pipeline
   
   📁 GitLab CI
      📖 GitLab Runner
      📖 .gitlab-ci.yml
      💻 Practice: Deploy pipeline
   
   📁 Jenkins
      📖 Jenkinsfile
      📖 Pipelines as Code
      💻 Practice: Multi-stage pipeline

📁 Containerization
   📁 Docker Basics
      📖 Docker architecture
      📖 Images и containers
      📖 Dockerfile best practices
      📖 Docker Compose
      💻 Practice: Containerize an app
   
   📁 Docker Advanced
      📖 Multi-stage builds
      📖 Docker networking
      📖 Docker volumes
      📖 Docker security
      💻 Practice: Production-ready containers

📁 Kubernetes
   📁 K8s Fundamentals
      📖 Architecture overview
      📖 Pods, Deployments, Services
      📖 ConfigMaps и Secrets
      💻 Practice: Deploy first app
   
   📁 K8s Networking
      📖 Services deep dive
      📖 Ingress controllers
      📖 Network policies
      💻 Practice: Expose app
   
   📁 K8s Storage
      📖 Volumes
      📖 PersistentVolume
      📖 StorageClasses
      💻 Practice: Stateful app
   
   📁 K8s Advanced
      📖 Helm
      📖 Custom Resources
      📖 Operators
      💻 Practice: Deploy with Helm

📁 Infrastructure as Code
   📁 Terraform Basics
      📖 HCL syntax
      📖 Providers и resources
      📖 State management
      💻 Practice: Provision infrastructure
   
   📁 Terraform Advanced
      📖 Modules
      📖 Workspaces
      📖 Remote state
      💻 Practice: Multi-environment
   
   📁 Ansible
      📖 Inventory
      📖 Playbooks
      📖 Roles
      💻 Practice: Configuration management

📁 Monitoring & Observability
   📁 Metrics
      📖 Prometheus basics
      📖 PromQL
      📖 Exporters
      💻 Practice: Monitor app
   
   📁 Visualization
      📖 Grafana basics
      📖 Dashboards
      📖 Alerts
      💻 Practice: Create dashboard
   
   📁 Logging
      📖 ELK Stack
      📖 Log aggregation
      💻 Practice: Centralized logging

📁 Cloud Platforms
   📁 AWS Basics
      📖 EC2, S3, RDS
      📖 VPC fundamentals
      📖 IAM basics
      💻 Practice: Deploy to AWS
   
   📁 Multi-Cloud
      📖 GCP overview
      📖 Azure overview
      💻 Practice: Compare providers

📁 DevSecOps
   📁 Security Basics
      📖 Container security
      📖 Secret management
      📖 Vulnerability scanning
      💻 Practice: Security scan

📁 Дополнительные темы
   📁 Messaging
      📖 RabbitMQ basics
      📖 Kafka introduction
      💻 Practice: Message queue
   
   📁 Service Mesh
      📖 Istio basics
      📖 Traffic management
      💻 Practice: Configure mesh
```

---

## Рекомендуемый план обучения

### Этап 1: Основы (недели 1-3)
- Linux Administration (углублённый)
- Git и ветвление

### Этап 2: Контейнеризация (недели 4-6)
- Docker от основ до продвинутых
- Docker Compose

### Этап 3: CI/CD (недели 7-8)
- GitHub Actions
- Jenkins

### Этап 4: Kubernetes (недели 9-12)
- От Pods до Operators
- Helm

### Этап 5: IaC (недели 13-15)
- Terraform
- Ansible

### Этап 6: Observability (недели 16-17)
- Prometheus + Grafana
- ELK Stack

### Этап 7: Cloud & Security (недели 18-20)
- AWS/GCP основы
- DevSecOps практики

---

## Советы по прохождению

1. **Практика важнее теории** — не просто читай, а выполняй задания
2. **Делай заметки** — записывай команды и конфиги
3. **Создай свой стенд** — используй VirtualBox/Vagrant или облака
4. **Повторяй** — возвращайся к пройденным темам через время

---

*Дата создания: 2026-03-24*
*Обновлено: 2026-03-26*