# Промпт: DevOps Senior / SRE — рост до уровня Senior

## Основной промпт для LMS

```
Работаю DevOps-инженером, умею Kubernetes, Terraform, CI/CD, мониторинг.
Хочу перейти на Senior уровень / стать SRE.

Цель: Senior DevOps Engineer / Site Reliability Engineer с навыками архитектуры и reliability.

Покрыть:
- Kubernetes deep dive (internals, operators, CRDs)
- Service Mesh (Istio, Linkerd)
- GitOps (ArgoCD, Flux)
- Chaos Engineering
- SLO/SLI/SLA и error budgets
- Incident management и postmortems
- Platform Engineering / Internal Developer Platform
- Multi-cloud и гибридные решения
- Cost optimization
- Архитектурные паттерны для high availability
- Security advanced (DevSecOps, zero trust)
- observability deep dive (tracing, profiling)

Формат: архитектурный курс с фокусом на надёжность и масштабируемость.
```

---

## Параметры генерации

```json
{
  "user_prompt": "Работаю DevOps-инженером, умею Kubernetes, Terraform...",
  "difficulty": "advanced",
  "depth_limit": 3
}
```

---

## Ожидаемая структура курса

```
📁 Kubernetes Deep Dive
   📁 K8s Internals
      📖 Как работает control plane
      📖 etcd — хранилище состояния
      📖 kubelet, kube-proxy, container runtime
      📖 Networking (CNI, kube-dns)
      💻 Practice: Debug control plane

   📁 Advanced Resources
      📖 Pod Disruption Budgets
      📖 Priority Classes
      📖 Resource Quotas
      📖 LimitRange
      💻 Practice: Настроить ресурсы

   📁 Operators и CRDs
      📖 Что такое Custom Resource
      📖 Operator pattern
      📖 Kustomize
      📖 Helm deep dive
      💻 Practice: Написать Helm chart

📁 Service Mesh
   📁 Istio
      📖 Архитектура Istio
      📖 Traffic management
      📖 mTLS и security
      📖 Observability (Jaeger, Kiali)
      💻 Practice: Настроить service mesh

   📁 Linkerd
      📖 Linkerd vs Istio
      📖 Automatic mTLS
      💻 Practice: Перенести на Linkerd

📁 GitOps
   📁 ArgoCD
      📖 GitOps концепция
      📖 Application и ApplicationSet
      📖 Sync policies
      📖 Rollbacks
      💻 Practice: GitOps deployment

   📁 Flux
      📖 Flux vs ArgoCD
      📖 Reconciliation
      💻 Practice: Flux deployment

📁 SRE Fundamentals
   📁 SLI/SLO/SLA
      📖 Что такое SLI, SLO, SLA
      📖 Error budgets
      📖 Как выбирать метрики
      💻 Practice: Define SLOs

   📁 Service Level Objectives
      📖 Toil и как его минимизировать
      📖 Toil budget
      📖 Automation vs manual

📁 Incident Management
   📁 Incident Lifecycle
      📖 Detection → Response → Resolution → Postmortem
      📖 Severity levels
      📖 Roles (IC, Comms, SME)
      💻 Practice: Run incident drill

   📁 Postmortems
      📖 Без blame подход
      📖 5 Whys
      📖 Action items
      📖 Как внедрять в команду

   📁 On-call
      📖 PagerDuty, OpsGenie
      📖 Alert fatigue
      📖 Runbooks
      💻 Practice: On-call setup

📁 Chaos Engineering
   📁 Principles
      📖 Chaos Monkey
      📖 Steady state hypothesis
      📖 Experiments
      💻 Practice: First experiment

   📁 Tools
      📖 LitmusChaos
      📖 Gremlin
      📖 Chaos Mesh
      💻 Practice: Break something intentionally

📁 Platform Engineering
   📁 Internal Developer Platform
      📖 Что такое IDP
      📖 Backstage — портал разработчика
      📖 Self-service capabilities
      💻 Practice: Design IDP

   📁 Developer Experience
      📖 Golden paths
      📖 Scaffolding tools
      📖 Docs as code

📁 Multi-Cloud и Hybrid
   📁 Multi-Cloud Strategy
      📖 Зачем несколько облаков
      📖 Риски и сложности
      📖 Cost implications

   📁 Kubernetes Multi-Cloud
      📖 Cluster federation
      📖 Cross-cloud networking
      💻 Practice: Multi-cloud setup

📁 Cost Optimization
   📁 Cloud Costs
      📖 Right-sizing
      📖 Spot/Preemptible instances
      📖 Reserved capacity
      📖 FinOps practices

   📁 Kubernetes Costs
      📖 VPA, HPA, KEDA
      📖 Resource optimization
      📖 Karpenter
      💻 Practice: Reduce costs

📁 High Availability Architecture
   📁 Patterns
      📖 Active-active, active-passive
      📖 Geographic distribution
      📖 CDN и edge computing

   📁 Database HA
      📖 Replication
      📖 Patroni, Stolon
      📖 Vitess для шардинга
      💻 Practice: HA database

📁 Security Advanced
   📁 DevSecOps
      📖 Shift left security
      📖 SAST, DAST
      📖 Dependency scanning

   📁 Zero Trust
      📖 Принципы zero trust
      📖 Service identity
      📖 SPIFFE/SPIRE

   📁 Secrets Management
      📖 HashiCorp Vault
      📖 External secrets
      💻 Practice: Vault setup

📁 Observability Advanced
   📁 Distributed Tracing
      📖 OpenTelemetry
      📖 Jaeger, Zipkin
      💻 Practice: Tracing setup

   📁 Profiling
      📖 pprof
      📖 Parca

   📁 eBPF
      📖 Что такое eBPF
      📖 Cilium
      📖 Pixie
      💻 Practice: eBPF monitoring

📁 Career и Leadership
   📁 Senior Skills
      📖 Technical writing
      📖 Mentoring
      📖 Architecture decisions

   📁 Interview Prep
      📖 System design
      📖 Troubleshooting
      📖 Behavioral questions
```

---

*Дата создания: 2026-03-24*