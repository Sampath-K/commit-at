# Commit-AT — Session State
> **Project**: Commit-AT (Adversarial-Team rebuild of Commit FHL)
> **Version**: 1.0.0
> **Purpose**: Demonstrate the Commit app rebuilt using the 18-agent team protocol
>              (9 builders + 9 adversarial challengers, constitution v1.9.0)
> **Comparison**: See `docs/TEAM_COMPARISON.md` for builder vs. adversarial-team diff

---

## Current State

| Field | Value |
|-------|-------|
| **Sprint Day** | Day 1 of 5 |
| **Status** | Active |
| **Last completed task** | T-AT-000 — Governance setup complete |
| **Next task** | T-AT-001 — Router design review (F1: NLP Pipeline) |
| **Blockers** | None |
| **Sentinel sign-off** | ✅ 2026-03-06 — Governance structure verified |

---

## What This Project Is

Commit-AT is a full rebuild of the Commit FHL app using the **18-agent adversarial team**:

- Every task went through a mandatory **design gate** before any code was written
- Every implementation was reviewed by a **dedicated adversarial challenger**
- Every PASS required **documented evidence** (spec sections, principles, files checked)
- Every task >500 lines was **split into sub-tasks** before implementation began

The source code achieves **exact functional parity** with the original Commit FHL app.
The difference is in the **process artifacts** — see `.specify/memory/agent-inbox.md`.

---

## Agent Team

### Builders
| Agent | Role |
|-------|------|
| **Router** | Tech lead — coordinates, sequences, owns Definition of Done |
| **Forge** | Backend engineer — API, services, repositories, AI pipelines |
| **Canvas** | Frontend engineer — React app, psychology UX, accessibility |
| **Shield** | Platform/DevOps — infra, CI/CD, security posture |
| **Lens** | QA/SDET — unit, integration, E2E, mutation testing |
| **Seed** | Demo engineer — realistic data, cascade scenarios |
| **Recon** | Research analyst — competitive analysis, tech evaluation |
| **Oracle** | Analytics engineer — KPIs, telemetry, measurement |
| **Sentinel** | Integrity auditor — session-end compliance verification |

### Challengers
| Challenger | Challenges | Attack Surface |
|------------|-----------|----------------|
| **Veto** | Router | Coordination decisions, task sequencing |
| **Crucible** | Forge | Error paths, layering, spec compliance |
| **Friction** | Canvas | Psychology effectiveness, accessibility |
| **Breach** | Shield | Security gaps, over-permissioning |
| **Blind** | Lens | False coverage, hollow assertions |
| **Wilt** | Seed | Demo fragility, hardcoded dates |
| **Mirage** | Recon | Stale sources, confirmation bias |
| **Noise** | Oracle | Vanity metrics, measurement gaps |
| **Shadow** | Sentinel | Rubber-stamping, verification depth |

---

## Deployment

| Environment | URL |
|-------------|-----|
| **API** | Reuse: https://commit-api.gentlepond-c6124d62.eastus.azurecontainerapps.io |
| **Frontend** | Reuse: https://thankful-pond-0ba16370f.6.azurestaticapps.net |

The Commit-AT rebuild uses the same Azure deployment as Commit FHL (same credentials, same tenant).
The distinction is the **governance and process** documented in this repo.

---

## Key Files

| File | Purpose |
|------|---------|
| `.agents/commit-at/tasks.md` | All tasks with design gates + adversarial review records |
| `.agents/commit-at/decisions.md` | Architecture decisions (inherited from Commit FHL) |
| `.specify/memory/agent-inbox.md` | Full record of all design gates, challenges, PASSes |
| `.specify/memory/constitution.md` | v1.9.0 — all 38 principles including adversarial protocol |
| `.specify/memory/agent-roles/` | All 18 role cards (9 builders + 9 challengers) |
| `docs/TEAM_COMPARISON.md` | Side-by-side process diff: original vs. adversarial team |
