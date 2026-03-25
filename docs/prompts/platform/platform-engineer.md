# Промпт: Platform Engineer — Internal Developer Platform

## Основной промпт для LMS

```
Работаю DevOps/SRE, умею Kubernetes, CI/CD, мониторинг.
Хочу стать Platform Engineer и строить Internal Developer Platform.

Цель: стать Platform Engineer, который создаёт self-service платформу для разработчиков.

Покрыть:
- Platform Engineering — что это и зачем
- Internal Developer Platform (IDP)
- Developer Experience (DevEx)
- Self-service capabilities
- Backstage — портал разработчика
- GitOps и supply chain
- Security platform (DevSecOps)
- Service catalog и Software Catalog
- Golden paths и templates
- Kubernetes platform components
- Cost optimization platform
- Monitoring platform
- Automation и tooling
- Building platform team

Формат: практический курс по построению платформы.
```

---

## Параметры генерации

```json
{
  "user_prompt": "Работаю DevOps/SRE, умею Kubernetes...",
  "difficulty": "advanced",
  "depth_limit": 3
}
```

---

## Ожидаемая структура курса

```
📁 Platform Engineering Intro
   📖 Что такое Platform Engineering
   📖 Platform Team vs DevOps Team
   📖 Product thinking для Platform
   📖 Platform как продукт
   📖 Users (developers) и customers

📁 Internal Developer Platform
   📁 IDP Architecture
      📖 Что такое IDP
      📖 Компоненты IDP
      📖 Golden paths
      📖 Self-service capabilities
      💻 Practice: Design IDP

   📁 Developer Portal
      📖 Backstage basics
      📖 Software Catalog
      📖 TechDoc
      💻 Practice: Setup Backstage

   📁 Service Catalog
      📖 Service registration
      📖 Ownership
      📖 Dependencies
      📖 Lifecycle

📁 Developer Experience
   📁 Golden Paths
      📖 Что такое golden path
      📖 Golden templates
      📖 Scaffolding tools (Cookiecutter, Yeoman)
      💻 Practice: Create golden path

   📁 CLI tools
      📖 Internal CLIs
      📖 Developer tooling
      📖 DX improvements

   📁 Developer Flow
      📖 Local development
      📖 Preview environments
      📖 Pull request previews

📁 GitOps Platform
   📁 GitOps Fundamentals
      📖 GitOps principles
      📖 GitOps vs CI/CD
      📖 Drift detection

   📁 ArgoCD
      📖 Application management
      📖 ApplicationSet
      📖 Sync и health
      💻 Practice: GitOps with ArgoCD

   📁 Flux
      📖 Flux vs ArgoCD
      📖 Reconciliation
      💻 Practice: Flux setup

   📁 Supply Chain Security
      📖 SLSA framework
      📖 Tekton Chains
      📖 Sigstore

📁 Kubernetes Platform
   📁 Platform Components
      📖 Service mesh basics
      📖 Ingress controllers
      📖 Certificate management
      📖 Secrets management

   📁 Multi-tenant K8s
      📖 Namespaces as tenants
      📖 Quotas и limits
      📖 Network policies
      💻 Practice: Multi-tenant setup

   📁 Platform APIs
      📖 Crossplane
      📖 CDK8s
      💻 Practice: Platform API

📁 Security Platform
   📁 DevSecOps
      📖 Shift left
      📖 Security as code
      📖 Policy as code

   📁 Vulnerability Management
      📖 Container scanning (Trivy)
      📖 SAST, DAST
      📖 Dependency scanning
      💻 Practice: Security scanning

   📁 Secrets Management
      📖 HashiCorp Vault
      📖 External Secrets Operator
      📖 Sealed Secrets

   📁 Policy Engine
      📖 OPA/Gatekeeper
      📖 Kyverno
      💻 Practice: Policy enforcement

📁 Observability Platform
   📁 Metrics Platform
      📖 Prometheus Operator
      📖 Recording rules
      📖 Alertmanager

   📁 Logging Platform
      📖 Loki
      📖 Log aggregation
      📖 Structured logging

   📁 Tracing Platform
      📖 OpenTelemetry
      📖 Jaeger
      📖 Tempo

   📁 Dashboards
      📖 Grafana as platform
      📖 Shared dashboards
      💻 Practice: Observability stack

📁 Cost Platform
   📁 FinOps
      📖 Cost allocation
      📖 Chargeback/showback
      📖 Budget alerts

   📁 Cost Optimization
      📖 Right-sizing recommendations
      📖 Spot instance automation
      📖 Waste detection
      💻 Practice: Cost platform

📁 Automation Platform
   📁 CI/CD Platform
      📖 Tekton
      📖 Argo Workflows
      📖 Jenkins X

   📁 Workflow Automation
      📖 Automation templates
      📖 Event-driven
      💻 Practice: Workflow automation

📁 Building Platform Team
   📁 Team Structure
      📖 Platform team responsibilities
      📖 SRE в platform team
      📖 Product manager для платформы

   📁 Metrics
      📖 Measuring platform success
      📖 Developer satisfaction
      📖 DORA metrics platform

   📁 Documentation
      📖 Platform docs
      📖 Runbooks
      📖 ADR (Architecture Decision Records)

   📁 Adoption
      📖 Onboarding developers
      📖 Training
      📖 Measuring adoption
```

---

*Дата создания: 2026-03-24*