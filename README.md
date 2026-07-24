# OntDekker — Travel Social Media Platform

OntDekker (Dutch for *Discoverer*) is a premium, community-driven travel social media and expedition planning platform. This repository is configured as a monorepo containing Next.js frontend applications, independent FastAPI microservices, shared packages, and local docker infrastructure configurations.

---

## 👥 Developer Ownership Matrix

To minimize merge conflicts and ensure clear ownership, the codebase is divided among three developers as follows:

| Developer | Service Ownership | Shared Area Responsibilities |
|---|---|---|
| **Developer 1** | 🔐 `authentication-service`<br>👤 `user-service` | Shared Packages (`shared/`) code design and schemas. |
| **Developer 2** | 📖 `feed-service`<br>🏔 `community-service` | Platform Gateway (`traefik`) and REST API Routing. |
| **Developer 3** | 🥾 `expedition-service`<br>🗺 `guide-service` | Infrastructure configs (PostgreSQL, MinIO, Redis, Docker). |
| **Shared** | 🧠 `recommendation-service`<br>💬 `chat-service`<br>🔔 `notification-service`<br>🛡 `moderation-service` | CI/CD Github workflows, monitoring stack, and monorepo root configs. |

---

## 🛠 Project Structure

- `apps/web/`: React/Next.js frontend application.
- `services/`: Independent backend microservices (FastAPI + SQLALchemy + Postgres).
- `shared/`: Shared common code package (exceptions, logging, constants, database base classes).
- `platform/`: Unified API Gateway (Traefik) and observability configuration.
- `infrastructure/`: Local third-party services (Kafka, Postgres, Redis, MinIO) setup.
- `docs/`: Technical manuals, team workflows, and visual design assets.
- `scripts/`: Automation, setup, and initialization utilities.

---

## 🚀 Getting Started

### Prerequisites
- Docker and Docker Compose installed locally.
- Python 3.12 (for local development outside containers).

### Run the Entire Platform
To start the Gateway, databases, Redis, Kafka, MinIO, and all microservices in the background:
```bash
make run
```
or
```bash
docker compose up -d --build
```

### Accessing APIs
Once running, Traefik exposes microservices on port `80` using the `/api/v1/{service-name}/*` prefix standard (see [Team Guidelines](Docs/team_guidelines.md)):
- Authentication API: `http://localhost/api/v1/authentication/*`
- User Profile API: `http://localhost/api/v1/user/*`
- Discover Feed API: `http://localhost/api/v1/feed/*` *(Dev 2)*
- Community API: `http://localhost/api/v1/communities/*` *(Dev 2)*
- Expedition API: `http://localhost/api/v1/expeditions/*` *(Dev 3)*
- Guide API: `http://localhost/api/v1/guides/*` *(Dev 3)*
- Chat API: `http://localhost/api/v1/chat/*` *(Shared)*

> **Direct service ports** (Phase 1 only, while Traefik is being validated):
> Authentication Service: `http://localhost:8000/auth/*` · User Service: `http://localhost:8001/users/*`

---

## 📜 Git Branch Strategy

OntDekker follows a **GitFlow Branching Strategy** to enable parallel development:

1. **`main`:** Production-stable branch. Deploys are tagged (e.g., `v1.0.0`). Direct commits are blocked.
2. **`develop`:** Integration branch. All features merge here first. Direct commits are blocked.
3. **`feature/*`:** Developer branch. Branches are named `feature/<service-name>-<brief-desc>` (e.g. `feature/auth-jwt-refresh`).
4. **`hotfix/*`:** Hotfixes for production. Branches branch from `main` and merge to both `main` and `develop`.

*Refer to the full [Team Guidelines](Docs/team_guidelines.md) for Pull Request templates, review checklists, and the Definition of Done.*
