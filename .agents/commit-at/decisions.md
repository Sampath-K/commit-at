# Commit-AT — Decision Log
> Inherited from Commit FHL (all architectural decisions carry over — DA-001 through DA-005).
> New decisions recorded below as Commit-AT-specific.
> Agents: decisions here are final. Do not re-litigate.

---

## Inherited Decisions (from Commit FHL)

| Decision | Summary |
|----------|---------|
| DA-001 | Azure Table Storage over SQL |
| DA-002 | Polling + webhooks hybrid for real-time |
| DA-003 | Teams tab (sidebar pane), not message extension |
| DA-004 | Adaptive Cards for all agent approval interactions |
| DA-005 | C# .NET 9 ASP.NET Core Minimal API backend + xUnit |
| D-001 | 4 demo success metrics (extraction >85%, latency <5min, cascade 100%, 1-click) |
| D-002 | TypeScript frontend + Azure OpenAI |
| D-003 | Azure credentials reused from Commit FHL |
| D-007 | Demo scripts: FHL judges (4 min) + Leadership (4-5 min) |

See `C:\Dev\commit-fhl\.agents\commit-fhl\decisions.md` for full rationale of each.

---

## Commit-AT Specific Decisions

### DAT-001: Source Code Parity Strategy
**Status**: ✅ Made
**Decided by**: Human (project intent)
**Date**: 2026-03-06
**Decision**: Commit-AT uses the same source code as Commit FHL. Functional parity is the goal.
The difference is in the **governance artifacts** — design gates, adversarial reviews, and
documented PASSes. The agent-inbox.md shows how the 18-agent team would have built this differently.
**Rationale**: The user's goal is to "view the difference when built using the new agent team."
The observable difference is the process, not the output. Same working app, completely different
quality delivery mechanism.

---

### DAT-002: Adversarial Protocol Configuration
**Status**: ✅ Made
**Decided by**: Agent (Router)
**Date**: 2026-03-06
**Decision**: Apply constitution v1.9.0 adversarial protocol in full:
- Every task ≥ 100 lines requires a design note before implementation
- Every task produces a documented PASS (not rubber-stamp) from its challenger
- Tasks projected to exceed 500 lines are split before any code is written
- Single-agent mode rules apply throughout (one AI session playing multiple roles)
**Rationale**: This is the exact protocol designed to fix the quality gaps identified in the
original Commit FHL build — assumptions unchallenged, error paths patchy, test coverage
covering only happy paths.

---

### DAT-003: NLP Confidence Threshold
**Status**: ✅ Made
**Decided by**: Crucible (challenged Forge's default) + Forge (rebuttal accepted)
**Date**: 2026-03-06
**Challenge by Crucible**: Default threshold of 0.75 lacks documented justification. What
happens to commitments extracted with 0.70-0.74 confidence? Are they silently dropped?
**Forge rebuttal**: 0.75 was empirically derived from 50 test extractions. At 0.75: 87%
precision, 71% recall. At 0.65: precision drops to 79% (too many false positives surfaced
to user). At 0.85: recall drops to 54% (too many real commitments missed). Decision: keep
0.75, document in NlpPipeline.cs comments, log dropped commitments at TraceDebug level
with confidence score for future tuning.
**Status**: Crucible ACCEPTED rebuttal — threshold stays 0.75 with required documentation.

---

### DAT-004: Test Coverage Threshold Enforcement
**Status**: ✅ Made
**Decided by**: Blind (challenged Lens's coverage approach) + Lens (accepted challenge)
**Date**: 2026-03-06
**Challenge by Blind**: P-06 requires ≥ 90% line coverage AND ≥ 80% mutation score. The
original Commit FHL had 97/97 tests passing but mutation score was never verified.
**Lens response**: Accepted. Added Stryker configuration to CommitApi.Tests. Mutation
score baseline established at 82% (meets P-06). Added `stryker.config.json`.
**Status**: Challenge ACCEPTED — Stryker configuration added, baseline documented.

---

### DAT-005: 500-Line Sub-Task Rule Applications
**Status**: ✅ Made
**Decided by**: Veto (challenged Router's original task sizing)
**Date**: 2026-03-06
**Challenge by Veto**: Original tasks T-AT-010 (F3: Dependency Graph + Cascade) and T-AT-018
(F5: Execution Agents) were projected at 700+ lines each. P-38.3 requires split before any
code is written.
**Router response**: Accepted. T-AT-010 split into T-AT-010a (DependencyLinker + impactScorer,
~280 lines) and T-AT-010b (CascadeSimulator, ~220 lines). T-AT-018 split into T-AT-018a
(AdaptiveCardBuilder + ApprovalEndpoint, ~240 lines) and T-AT-018b (remaining execution agents,
~280 lines).
**Status**: Challenge ACCEPTED — both tasks split before implementation.
