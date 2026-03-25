# Промпт: SRE Advanced — продвинутые SRE практики

## Основной промпт для LMS

```
Знаю основы SRE, умею работать с SLO, мониторингом, incident management.
Хочу углубить знания и стать Senior SRE.

Цель: освоить продвинутые SRE практики: observability, chaos engineering, platform engineering.

Покрыть:
- Distributed tracing (OpenTelemetry, Jaeger)
- Chaos Engineering (принципы, инструменты)
- Observability deep dive (metrics, logs, traces)
- Service Level Objectives в масштабе
- Capacity planning и scalability
- Cost optimization для reliability
- Multi-region и disaster recovery
- Incident automation
- SRE в kubernetes окружении
- Building SRE culture
- Tooling и automation

Формат: advanced курс с фокусом на масштабирование SRE практик.
```

---

## Параметры генерации

```json
{
  "user_prompt": "Знаю основы SRE, умею работать с SLO...",
  "difficulty": "advanced",
  "depth_limit": 3
}
```

---

## Ожидаемая структура курса

```
📁 Observability Deep Dive
   📁 Three Pillars
      📖 Metrics, Logs, Traces
      📖 Why you need all three
      📖 Correlation между пиларсами

   📁 Distributed Tracing
      📖 OpenTelemetry architecture
      📖 Instrumentation (auto vs manual)
      📖 Context propagation
      📖 Sampling strategies
      💻 Practice: Trace your application

   📁 Metrics Advanced
      📖 Prometheus high cardinality
      📖 tsdb и remote storage
      📖 Recording rules
      📖 Mimir, Thanos

   📁 Logging Advanced
      📖 Structured logging
      📖 Log correlation with traces
      📖 Sampling логов
      📖 Loki architecture

   📁 Alerting Advanced
      📖 Multi-window alerting
      📖 Alert naming conventions
      📖 Runbook linking
      📖 Incident prediction

📁 Chaos Engineering
   📁 Principles
      📖 Chaos Engineering history
      📖 Steady state hypothesis
      📖 Experiments и scope
      📖 blast radius

   📁 Tools
      📖 LitmusChaos
      📖 Gremlin
      📖 Chaos Mesh
      📖 AWS Fault Injection Simulator

   📁 Experiments
      📖 Pod kill
      📖 Network latency
      📖 Resource exhaustion
      📖 AWS AZ failures
      💻 Practice: First chaos experiment

   📁 GameDay
      📖 What is GameDay
      📖 Preparation
      📖 Running GameDay
      📖 Learning from GameDay

📁 SLO Engineering
   📁 SLO lifecycle
      📖 Defining SLOs
      📖 SLO vs targets
      📖 SLO consumption

   📁 Error Budget Policies
      📖 Burn rate alerts
      📖 Multi-window burn rate
      📖 Error budget policy automation

   📁 SLO Reporting
      📖 SLO dashboard
      📖 Error budget burn down
      📖 SLO status reports
      💻 Practice: SLO reporting setup

📁 Capacity Planning
   📁 Forecasting
      📖 Historical analysis
      📖 Growth projections
      📖 Capacity planning tools

   📁 Autoscaling
      📖 Horizontal Pod Autoscaler
      📖 Vertical Pod Autoscaler
      📖 KEDA
      📖 Cluster autoscaler

   📁 Cost Optimization
      📖 FinOps practices
      📖 Spot/preemptible instances
      📖 Right-sizing
      💻 Practice: Capacity planning

📁 Disaster Recovery
   📁 DR Strategies
      📖 RTO и RPO
      📖 Backup, pilot light, warm standby, multi-region
      📖 Active-active

   📁 DR Testing
      📖 Chaos testing for DR
      📖 Regular DR drills
      📖 Documentation

   📁 Database DR
      📖 PostgreSQL replication
      📖 Patroni для HA
      📖 Cross-region setup

📁 Incident Automation
   📁 Runbook Automation
      📖 From manual to automated
      📖 Auto-remediation
      📖 Guardrails

   📁 Incident Tools
      📖 PagerDuty automation
      📖 Slack integrations
      📖 Status page automation

   📁 AI for SRE
      📖 AIOps basics
      📖 Anomaly detection
      📖 Root cause analysis

📁 Kubernetes SRE
   📁 K8s Reliability
      📖 Pod disruption budgets
      📖 Pod priority
      📖 Resource quotas
      📖 Limit ranges

   📁 K8s Operations
      📖 Upgrade strategies
      📖 Cluster autoscaling
      📖 Multi-cluster management

   📁 K8s Monitoring
      📖 kube-state-metrics
      📖 node-problem-detector
      📖 Prometheus Operator
      💻 Practice: K8s SRE dashboard

📁 SRE Platform
   📁 Platform Team
      📖 Building SRE platform
      📖 Golden paths
      📖 Self-service

   📁 Developer Experience
      📖 Backstage
      📖 Service catalog
      📖 API portals

   📁 Tooling
      📖 CI/CD для SRE
      📖 GitOps
      📖 Infrastructure as Code

📁 SRE Culture
   📁 Building SRE culture
      📖 Hiring SRE
      📖 SRE в организации
      📖 Collaboration с Dev

   📁 SRE Metrics
      📖 SRE scoring
      📖 DORA metrics
      📖 Measuring SRE success

   📁 Learning и Development
      📖 SRE certifications
      📖 Communities
      📖 Книги и ресурсы
```

---

*Дата создания: 2026-03-24*