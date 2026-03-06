# Commit-AT

**Commit, rebuilt with the 18-agent adversarial team.**

Same app. Completely different quality delivery mechanism.

---

## What This Is

This repo is a full rebuild of [Commit FHL](https://github.com/Sampath-K/commit-fhl) using a
structured 18-agent team: 9 production builders paired with 9 adversarial challengers.

The **source code** achieves exact functional parity with Commit FHL.
The difference is in the **process** — see [`docs/TEAM_COMPARISON.md`](docs/TEAM_COMPARISON.md).

---

## The App

**Commit** is a Teams pane that:
1. Captures every commitment from meetings, chat, email, and ADO
2. Builds a live dependency graph with owners, ETAs, and watchers
3. Simulates cascade impact when any task is at risk — before it slips
4. Agents draft replans and communications
5. Humans approve with one click; agents execute

**Stack**: C# .NET 9 ASP.NET Core Minimal API · React/TypeScript · Fluent UI v9 · Azure Table Storage · MSAL OBO · Azure Container Apps + Static Web Apps

---

## The Team

### Builders
| Agent | Role |
|-------|------|
| Router | Tech lead — coordinates, sequences, owns Definition of Done |
| Forge | Backend — API, services, repositories, AI pipelines |
| Canvas | Frontend — React app, psychology UX, accessibility |
| Shield | Platform/DevOps — infra, CI/CD, security posture |
| Lens | QA/SDET — unit, integration, E2E, mutation testing |
| Seed | Demo — realistic data, cascade scenarios |
| Recon | Research — competitive analysis, tech evaluation |
| Oracle | Analytics — KPIs, telemetry, measurement |
| Sentinel | Integrity — session-end compliance verification |

### Challengers
| Challenger | Challenges | What They Caught |
|------------|-----------|-----------------|
| Veto | Router | Governance gaps in task sequencing |
| Crucible | Forge | Cycle detection missing in CascadeSimulator |
| Friction | Canvas | Psychology hook missing from design |
| Breach | Shield | 3 over-permissioned OAuth scopes |
| Blind | Lens | Mock bypass + single-viewport E2E |
| Wilt | Seed | Hardcoded demo dates + non-idempotent seed |
| Mirage | Recon | — |
| Noise | Oracle | Vanity metric (approval rate → action completion rate) |
| Shadow | Sentinel | Spot-check of session-end verification depth |

---

## What the Challengers Fixed

7 real defects caught before shipping — none existed in the original Commit FHL build:

1. **Over-permissioned OAuth scopes** → removed 3 unused scopes before any code written
2. **NLP test mock bypassed threshold logic** → tests were always green regardless of threshold
3. **CascadeSimulator infinite loop on circular deps** → would have crashed on real data
4. **Playwright E2E single-viewport** → P-06 requires 4 viewports; 20 combinations now pass
5. **Hardcoded demo dates** → demo would have broken after March 8
6. **Non-idempotent seed data** → double-seed created duplicates, corrupted demo state
7. **Vanity metric (approval rate)** → replaced with action completion rate (measures value)

---

## Key Files

| File | Purpose |
|------|---------|
| [`docs/TEAM_COMPARISON.md`](docs/TEAM_COMPARISON.md) | Side-by-side: original vs. adversarial team |
| [`.specify/memory/agent-inbox.md`](.specify/memory/agent-inbox.md) | Full record: design gates, challenges, PASSes |
| [`.agents/commit-at/tasks.md`](.agents/commit-at/tasks.md) | All 26 tasks with evidence links |
| [`.agents/commit-at/decisions.md`](.agents/commit-at/decisions.md) | Architectural decisions (inherited + new) |
| [`.specify/memory/constitution.md`](.specify/memory/constitution.md) | v1.9.0 — 38 principles |
| [`.specify/memory/agent-roles/`](.specify/memory/agent-roles/) | All 18 role cards |

---

## Running Locally

```bash
# Backend (C# .NET 9)
cd src/api
dotnet run

# Frontend (TypeScript + React)
cd src/app
npm install
npm run dev
```

Requires `.env` in `src/api/` — see `src/api/.env.example`.

---

## Deployment

Uses same Azure infrastructure as Commit FHL:
- **API**: Azure Container Apps
- **Frontend**: Azure Static Web Apps
- **IaC**: `infra/main.bicep`

---

## The Key Insight

> *"The AI made execution fast. The team structure made outcomes predictable."*

The bottleneck was never capability.
It was whether someone was **constitutionally motivated to say "this is wrong."**

See [`docs/TEAM_COMPARISON.md`](docs/TEAM_COMPARISON.md) for the full story.
