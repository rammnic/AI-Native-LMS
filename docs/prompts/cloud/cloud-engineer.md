# Промпт: Cloud Engineer — облачные инженеры

## Основной промпт для LMS

```
Хочу стать Cloud Engineer. Знаю основы Linux, сетей, немного DevOps практик.

Цель: устроиться Cloud Engineer и уверенно работать с облаками (AWS, GCP, Azure).

Покрыть:
- Облачные концепции (IaaS, PaaS, SaaS)
- AWS (EC2, S3, RDS, VPC, IAM)
- GCP основы
- Azure основы
- Networking в облаке (VPC, subnets, VPN)
- Security в облаке (IAM, policies)
- Storage (object storage, block storage)
- Databases as a Service
- Serverless basics (Lambda, Cloud Functions)
- Infrastructure as Code (Terraform)
- Cost management
- Best practices и well-architected framework

Формат: vendor-agnostic курс с фокусом на AWS как основную платформу.
```

---

## Параметры генерации

```json
{
  "user_prompt": "Хочу стать Cloud Engineer...",
  "difficulty": "intermediate",
  "depth_limit": 3
}
```

---

## Ожидаемая структура курса

```
📁 Облачные основы
   📖 Что такое облако
   📖 IaaS, PaaS, SaaS — сравнение
   📖 Public, private, hybrid cloud
   📖 Regions, zones, edge locations
   📖 Cloud providers overview (AWS, GCP, Azure)

📁 AWS Core Services
   📁 Compute
      📖 EC2 — виртуальные машины
      📖 EC2 instances types
      📖 AMIs и storage (EBS)
      📖 Auto Scaling Groups
      📖 Lambda — serverless
      💻 Practice: Launch EC2 instance

   📁 Storage
      📖 S3 — object storage
      📖 S3 tiers (Standard, IA, Glacier)
      📖 EBS vs Instance Store
      📖 EFS — shared file system
      💻 Practice: S3 lifecycle policies

   📁 Databases
      📖 RDS — managed databases
      📖 DynamoDB — NoSQL
      📖 ElastiCache
      📖 Aurora basics
      💻 Practice: Setup RDS

   📁 Networking
      📖 VPC — virtual private cloud
      📖 Subnets (public/private)
      📖 Internet Gateway
      📖 NAT Gateway
      📖 Security Groups
      💻 Practice: VPC architecture

   📁 Identity
      📖 IAM basics
      📖 Users, Groups, Roles
      📖 Policies
      📖 MFA
      💻 Practice: IAM best practices

📁 GCP основы
   📁 Compute Engine
      📖 GCE vs EC2
      📖 Persistent disks
      📖 Managed instance groups

   📁 Cloud Storage
      📖 Cloud Storage
      📖 BigQuery basics

   📁 Networking
      📖 VPC в GCP
      📖 Cloud DNS
      📖 Cloud Load Balancing

   📁 IAM
      📖 Service accounts
      📖 Roles

📁 Azure основы
   📁 Compute
      📖 Azure VMs
      📖 Azure Functions

   📁 Storage
      📖 Blob Storage
      📖 Azure Disks

   📁 Networking
      📖 Azure VNet
      📖 Azure Load Balancer

   📁 Identity
      📖 Azure AD
      📖 RBAC

📁 Networking Deep Dive
   📁 VPC Architecture
      📖 Multi-tier architecture
      📖 Bastion hosts
      📖 VPN connections
      📖 Direct Connect basics

   📁 DNS
      📖 Route 53 basics
      📖 Records types
      📖 Health checks
      💻 Practice: Route 53 setup

   📁 Load Balancing
      📖 ALB, NLB, CLB
      📖 Target groups
      📖 Path-based routing
      💻 Practice: Load balancer setup

   📁 CDN
      📖 CloudFront basics
      📖 Caching strategies

📁 Security
   📁 IAM Advanced
      📖 SCPs (Service Control Policies)
      📖 Resource-based policies
      📖 Cross-account access

   📁 Encryption
      📖 At-rest encryption
      📖 In-transit encryption
      📖 KMS basics

   📁 Network Security
      📖 NACLs vs Security Groups
      📖 WAF basics
      📖 DDoS protection

📁 Serverless
   📁 Lambda
      📖 How Lambda works
      📖 Triggers (S3, API Gateway, etc.)
      📖 Layers
      📖 Cold starts

   📁 Serverless Patterns
      📖 Lambda + API Gateway
      📖 Event-driven architecture
      💻 Practice: Serverless API

📁 Infrastructure as Code
   📁 Terraform
      📖 HCL syntax
      📖 Providers
      📖 State management
      📖 Modules
      💻 Practice: Terraform AWS resources

   📁 CloudFormation
      📖 Template structure
      📖 Intrinsic functions
      💻 Practice: CloudFormation stack

📁 Databases в облаке
   📁 RDS Deep Dive
      📖 Multi-AZ
      📖 Read replicas
      📖 Backups и point-in-time recovery
      💻 Practice: RDS failover

   📁 NoSQL
      📖 DynamoDB tables
      📖 GSI, LSI
      📖 Provisioned vs on-demand

📁 Cost Management
   📁 AWS Pricing
      📖 On-demand vs Reserved
      📖 Spot instances
      📖 Savings Plans

   📁 Cost Optimization
      📖 Right-sizing
      📖 Cost Explorer
      📖 Budgets и alerts
      💻 Practice: Cost optimization

📁 Well-Architected Framework
   📁 Pillars
      📖 Operational Excellence
      📖 Security
      📖 Reliability
      📖 Performance Efficiency
      📖 Cost Optimization
      📖 Sustainability

   📁 Best Practices
      📖 Architecture patterns
      📖 Trade-offs
      💻 Practice: Review architecture

📁 Monitoring и Logging
   📁 CloudWatch
      📖 Metrics
      📖 Logs
      📖 Alarms
      📖 Dashboards

   📁 CloudTrail
      📖 API logging
      📖 Event history
```

---

*Дата создания: 2026-03-24*