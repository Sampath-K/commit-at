# Commit-AT — Task List
> Tasks follow constitution v1.9.0 adversarial protocol.
> Every task: DESIGN gate → implementation → adversarial PASS → [x]
> Tasks >500 lines: split BEFORE implementation (P-38.3)
> Format: [x] done / [ ] pending / [~] in-progress / [!] blocked

---

## Day 0 — Governance Setup

- [x] **T-AT-000** `[Agent: Router + Veto]` Set up Commit-AT governance structure
  - Design: N/A (setup task)
  - Veto PASS: ✅ See agent-inbox.md #PASS-000
  - Output: .agents/commit-at/, .specify/memory/, constitution v1.9.0, 18 role cards

---

## Day 1 — Backend Foundation (F1: Commitment Discovery)

- [x] **T-AT-001** `[Agent: Forge + Crucible]` Design review: NLP Pipeline architecture
  - DESIGN note posted, Crucible approved: ✅ See agent-inbox.md #DESIGN-001
  - Output: NlpPipeline.cs design approved with error path documentation requirement

- [x] **T-AT-002** `[Agent: Forge + Crucible]` Implement NLP pipeline (Azure OpenAI extraction)
  - Lines: ~180 (within limit)
  - Design-approved: ✅ DESIGN-001
  - Crucible PASS: ✅ See agent-inbox.md #PASS-002
  - Output: `src/api/Services/NlpPipeline.cs`

- [x] **T-AT-003** `[Agent: Forge + Crucible]` Implement CommitmentRepository (Azure Table Storage)
  - Lines: ~160 (within limit)
  - Design note: DESIGN-003
  - Crucible PASS: ✅ See agent-inbox.md #PASS-003
  - Output: `src/api/Repositories/CommitmentRepository.cs`

- [x] **T-AT-004** `[Agent: Forge + Crucible]` Implement extractors (Transcript, Chat, Email, ADO)
  - Lines: ~280 across 4 files (~70 each — within limit per file)
  - Design note: DESIGN-004
  - Mid-task self-referral: #SELF-004 (new ADO Extractor pattern not in design)
  - Crucible PASS: ✅ See agent-inbox.md #PASS-004
  - Output: `src/api/Extractors/`

- [x] **T-AT-005** `[Agent: Shield + Breach]` Design review: Auth architecture (MSAL OBO + Graph)
  - DESIGN note, Breach reviewed: ✅ See agent-inbox.md #DESIGN-005
  - Breach CHALLENGE: ❌→✅ See agent-inbox.md #CHALLENGE-005 (OAuth scopes over-specified)
  - Output: Scope list reduced from 12 to 9 (removed 3 unused admin-consent scopes)

- [x] **T-AT-006** `[Agent: Shield + Breach]` Implement GraphClientFactory + Auth middleware
  - Lines: ~120 (within limit)
  - Design-approved: ✅ DESIGN-005 (amended after challenge)
  - Breach PASS: ✅ See agent-inbox.md #PASS-006
  - Output: `src/api/Auth/GraphClientFactory.cs`

- [x] **T-AT-007** `[Agent: Lens + Blind]` Unit tests: NlpPipeline + CommitmentRepository
  - Lines: ~240 (within limit)
  - Design note: DESIGN-007
  - Blind CHALLENGE: ❌→✅ See agent-inbox.md #CHALLENGE-007 (mock returning any confidence always passes)
  - Blind PASS: ✅ See agent-inbox.md #PASS-007
  - Output: `src/api/CommitApi.Tests/Services/NlpPipelineTests.cs`

---

## Day 2 — Frontend + F2: Commitment Pane

- [x] **T-AT-008** `[Agent: Canvas + Friction]` Design review: Teams pane architecture
  - DESIGN note posted: ✅ See agent-inbox.md #DESIGN-008
  - Friction review: ✅ Psychology layer verified (SDT, Progress Principle — P-27 spec)
  - Output: CommitPane + psychology hook design approved

- [x] **T-AT-009** `[Agent: Canvas + Friction]` Implement CommitPane.tsx + EisenhowerBoard
  - Lines: ~320 (within limit — split was NOT needed, verified pre-task)
  - Design-approved: ✅ DESIGN-008
  - Mid-task self-referral: #SELF-009 (new psychology hook created, not in design)
  - Friction PASS: ✅ See agent-inbox.md #PASS-009
  - Output: `src/app/src/components/core/CommitPane.tsx`

- [x] **T-AT-010a** `[Agent: Forge + Crucible]` Implement DependencyLinker + ImpactScorer
  - Lines: ~280 (split from original T-AT-010 per DAT-005)
  - Design-approved: ✅ DESIGN-010
  - Crucible PASS: ✅ See agent-inbox.md #PASS-010a
  - Output: `src/api/Graph/DependencyLinker.cs`, `ImpactScorer.cs`

- [x] **T-AT-010b** `[Agent: Forge + Crucible]` Implement CascadeSimulator
  - Lines: ~220 (split from original T-AT-010 per DAT-005)
  - Design-approved: ✅ DESIGN-010b
  - Crucible CHALLENGE: ❌→✅ See agent-inbox.md #CHALLENGE-010b (infinite loop edge case)
  - Crucible PASS: ✅ See agent-inbox.md #PASS-010b
  - Output: `src/api/Graph/CascadeSimulator.cs`

- [x] **T-AT-011** `[Agent: Canvas + Friction]` Implement CascadeView.tsx (dependency graph UI)
  - Lines: ~290 (within limit)
  - Design-approved: ✅ DESIGN-011
  - Friction PASS: ✅ See agent-inbox.md #PASS-011
  - Output: `src/app/src/components/core/CascadeView.tsx`

---

## Day 3 — F4: Replan Engine + F3 API Routes

- [x] **T-AT-012** `[Agent: Forge + Crucible]` Implement ReplanGenerator (3 options)
  - Lines: ~190 (within limit)
  - Design-approved: ✅ DESIGN-012
  - Crucible PASS: ✅ See agent-inbox.md #PASS-012
  - Output: `src/api/Replan/ReplanGenerator.cs`

- [x] **T-AT-013** `[Agent: Forge + Crucible]` Wire API routes: commitments, cascade, replan
  - Lines: ~160 (within limit)
  - Design-approved: ✅ DESIGN-013
  - Crucible PASS: ✅ See agent-inbox.md #PASS-013
  - Output: `src/api/Program.cs` (route wiring)

- [x] **T-AT-014** `[Agent: Canvas + Friction]` Implement psychology components (8 components)
  - Lines: ~380 across 8 files (~47 each — within limit)
  - Design note: DESIGN-014 (P-27 psychology spec fully mapped to components)
  - Friction PASS: ✅ See agent-inbox.md #PASS-014
  - Output: `src/app/src/components/psychology/`

---

## Day 4 — F5: Execution Agents + F6: Capacity

- [x] **T-AT-015** `[Agent: Forge + Crucible]` Design review: execution agents architecture
  - DESIGN note + Crucible review: ✅ See agent-inbox.md #DESIGN-015
  - Output: 5 agent types identified, error paths documented, Adaptive Card schema locked

- [x] **T-AT-018a** `[Agent: Forge + Crucible]` Implement AdaptiveCardBuilder + approval endpoint
  - Lines: ~240 (split from T-AT-018 per DAT-005)
  - Design-approved: ✅ DESIGN-015
  - Crucible PASS: ✅ See agent-inbox.md #PASS-018a
  - Output: `src/api/Agents/AdaptiveCardBuilder.cs`

- [x] **T-AT-018b** `[Agent: Forge + Crucible]` Implement remaining execution agents
  - Lines: ~280 (split from T-AT-018 per DAT-005)
  - Design-approved: ✅ DESIGN-015
  - Crucible PASS: ✅ See agent-inbox.md #PASS-018b
  - Output: `src/api/Agents/` (CalendarBlocker, OvercommitFirewall, PrReviewDrafter, StatusUpdateDrafter)

- [x] **T-AT-016** `[Agent: Canvas + Friction]` Implement ApprovalCard.tsx + TeamsMessageSender
  - Lines: ~280 (within limit)
  - Design-approved: ✅ DESIGN-016
  - Mid-task self-referral: #SELF-016 (Graph scope added mid-task for Chat.ReadWrite)
  - Breach PASS (escalated): ✅ See agent-inbox.md #PASS-016-breach
  - Friction PASS: ✅ See agent-inbox.md #PASS-016
  - Output: `src/app/src/components/core/ApprovalCard.tsx`

- [x] **T-AT-017** `[Agent: Shield + Breach]` Implement Dockerfile + Bicep IaC + CI config
  - Lines: ~180 (within limit)
  - Design note: DESIGN-017
  - Breach PASS: ✅ See agent-inbox.md #PASS-017
  - Output: `src/api/Dockerfile`, `infra/main.bicep`

---

## Day 5 — Testing, Demo Data, Sign-Off

- [x] **T-AT-019** `[Agent: Lens + Blind]` Full test suite: integration + E2E
  - Lines: ~320 across test files
  - Design note: DESIGN-019 (5 critical journeys × 4 viewports defined upfront)
  - Blind CHALLENGE: ❌→✅ See agent-inbox.md #CHALLENGE-019 (Playwright tests only ran on one viewport)
  - Blind PASS: ✅ See agent-inbox.md #PASS-019
  - Output: `src/app/src/tests/` (Playwright E2E)

- [x] **T-AT-020** `[Agent: Seed + Wilt]` Create demo seed data (3 cascade chains, 6 personas)
  - Design note: DESIGN-020 (date-relative, idempotent, cross-persona consistent)
  - Wilt CHALLENGE: ❌→✅ See agent-inbox.md #CHALLENGE-020 (hardcoded dates in cascade chain)
  - Wilt PASS: ✅ See agent-inbox.md #PASS-020
  - Output: `scripts/seed-demo.ts`, `scripts/personas/index.ts`

- [x] **T-AT-021** `[Agent: Oracle + Noise]` Define telemetry + KPIs
  - Design note: DESIGN-021 (5 KPIs, 3 event types, cohort >5 rule enforced)
  - Noise CHALLENGE: ❌→✅ See agent-inbox.md #CHALLENGE-021 (approval rate is vanity metric)
  - Noise PASS: ✅ See agent-inbox.md #PASS-021
  - Output: `src/api/Config/AppInsightsExtensions.cs`

- [x] **T-AT-022** `[Agent: Sentinel + Shadow]` Final session verification
  - Phase 1-4 complete: ✅
  - Shadow spot-check: ✅ See agent-inbox.md #SHADOW-022
  - Sentinel sign-off: ✅ See sentinel-log.md
  - Output: All governance documents current, deployment verified

---

## Summary

| Day | Tasks | Adversarial Events |
|-----|-------|--------------------|
| Day 0 | 1 | Veto PASS (governance) |
| Day 1 | 7 | 2 challenges (Breach: scopes, Blind: mock fidelity) |
| Day 2 | 5 | 1 challenge (Crucible: infinite loop) + 2 self-referrals |
| Day 3 | 3 | All PASSed first review |
| Day 4 | 6 | 2 challenges (Blind: viewport, Wilt: hardcoded dates) + 1 self-referral + 1 Breach escalation |
| Day 5 | 4 | 2 challenges (Noise: vanity metric) + Shadow spot-check |
| **Total** | **26** | **7 CHALLENGES raised, all resolved; 3 mid-task self-referrals** |

### What the Challenges Fixed
1. **Breach #CHALLENGE-005** → Removed 3 unused over-permissioned OAuth scopes
2. **Blind #CHALLENGE-007** → Fixed mock that accepted any confidence value (was masking real bugs)
3. **Crucible #CHALLENGE-010b** → Added cycle detection to CascadeSimulator (would have caused infinite loop with circular deps)
4. **Blind #CHALLENGE-019** → Playwright tests now run all 4 viewports, not just desktop
5. **Wilt #CHALLENGE-020** → Cascade chain dates changed from hardcoded to relative (demo won't break at 9PM)
6. **Noise #CHALLENGE-021** → Replaced approval-rate metric with action-completion-rate (measures value, not activity)
7. **Mid-task #SELF-016** → New Graph scope (Chat.ReadWrite) escalated to Breach for security review before adding
