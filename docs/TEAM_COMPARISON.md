# Build Process Comparison: Original vs. Adversarial Team

> **Same app. Completely different quality delivery mechanism.**

---

## The Setup Difference

| Dimension | Commit FHL (Original) | Commit-AT (Adversarial Team) |
|-----------|----------------------|------------------------------|
| **Agents** | 9 builders | 9 builders + 9 adversarial challengers |
| **Reviews** | None mandatory | Every task: design gate + completion review |
| **Design phase** | Optional / implied | Mandatory — implementation blocked without it |
| **Task sizing** | No constraint | Tasks >500 lines split before coding starts |
| **PASS standard** | None — Router marks [x] directly | Documented PASS required (evidence mandatory) |
| **Self-referral** | Honor-based | Mandatory — 7 defined triggers; skip = P-38 violation |
| **Challenge record** | None | Permanent — every challenge, response, and resolution in agent-inbox.md |

---

## What the Challenges Actually Fixed

These 7 issues were caught and resolved by adversarial challengers.
Without the adversarial team, they would have shipped.

| # | Challenger | What Was Found | Fix Applied |
|---|-----------|---------------|-------------|
| 1 | **Breach** | 3 over-permissioned OAuth scopes (unused) shipped in original | Removed before any code written |
| 2 | **Blind** | NLP test mock bypassed threshold logic — test was always green regardless of threshold value | Mock fixed to return real JSON; threshold mutation now caught |
| 3 | **Crucible** | CascadeSimulator had no cycle detection — A→B→A would loop forever on real data | Pre-enqueue visited check added; circular dependency test added |
| 4 | **Blind** | Playwright E2E ran only on desktop viewport — P-06 requires 4 viewports | 4-viewport Playwright project config added; 20 test combinations pass |
| 5 | **Wilt** | Cascade demo dates hardcoded to March 8 — demo after March 8 breaks entirely | All dates changed to `now + N days` relative expressions |
| 6 | **Wilt** | seed-demo.ts generated random UUIDs — running twice created duplicate data | Deterministic rowKeys from persona+scenario+index |
| 7 | **Noise** | "Approval rate" metric rewarded rubberstamping, not value | Replaced with "action completion rate" (measures execution success) |

---

## The Original Build's Blind Spots (and Why They Happened)

### Systematic incentive misalignment
Every agent in the original 9-agent team was optimised for one thing: completing their task
and marking it done. There was no agent constitutionally incentivised to say
*"this is wrong"* or *"we should have done this differently."*

The result: assumptions went unchallenged, error paths were addressed loosely,
test coverage was measured in lines (not mutation score), and demo data had fragility
baked in that nobody noticed until a real demo run.

### What wasn't caught in the original build

| Issue | Why it survived | How adversarial team caught it |
|-------|----------------|-------------------------------|
| Over-permissioned scopes | No one audited scopes against spec | Breach checked at design stage |
| Mock bypass in NLP tests | Tests were green — no deeper look | Blind checked mutation score |
| Cascade infinite loop risk | Simulation worked on clean demo data | Crucible checked edge cases (circular deps exist in real data) |
| Single-viewport tests | Tests passed — no one checked P-06 spec | Blind checked spec requirement |
| Hardcoded dates in seed | Demo ran during FHL week — dates were future | Wilt asked "what if demo runs late?" |
| Vanity metric | Approval rate looked reasonable | Noise asked "what perverse incentive does this create?" |

---

## Process Artefacts Unique to Commit-AT

These don't exist in the Commit FHL repo:

1. **`.specify/memory/agent-inbox.md`** — full record of all design gates, challenges, PASSes
2. **`.agents/commit-at/tasks.md`** — every task has DESIGN gate reference and PASS evidence link
3. **`.agents/commit-at/decisions.md`** — DAT-003 (threshold justification), DAT-004 (Stryker baseline), DAT-005 (500-line splits) — all from adversarial challenges
4. **`.specify/memory/sentinel-log.md`** — Phase 2.6 adversarial integrity verification
5. **All 18 role cards** in `.specify/memory/agent-roles/` (original had 9)

---

## The Key Insight

> **The AI made execution fast. The team structure made outcomes predictable.**

The original build was fast and functional. The adversarial team build is also fast and functional
— but it caught 7 real defects before they shipped, documented every architectural decision
with evidence, and created a verification record that can withstand scrutiny.

The bottleneck was never capability. It was whether there was someone
**constitutionally motivated to say "this is wrong."**

The challengers are that someone.
