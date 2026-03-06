# Tech Debt — Commit-AT
> All items tracked here. No orphaned TODO/FIXME in code (P-25 enforced).

---

## Active Debt

| ID | Description | Severity | Logged by | Session |
|----|-------------|----------|-----------|---------|
| T-debt-001 | NLP confidence threshold (0.75) was empirically derived from 50 examples. Should be re-evaluated against 500+ examples post-pilot. See DAT-003. | MEDIUM | Crucible | Day 1 |
| T-debt-002 | MemoryCache for OBO token cache is per-process. Under horizontal scale (multiple Container App replicas), each replica maintains its own cache. Token re-acquisition overhead acceptable at pilot scale; review before GA. | LOW | Breach | Day 1 |
| T-debt-003 | ADO extractor uses PAT auth (not OBO). PAT is org-wide read. Ideal: per-user PAT or Azure DevOps OAuth2. Deferred — ADO OAuth2 setup adds >1 day. See SELF-004. | MEDIUM | Crucible | Day 1 |
| T-debt-004 | Stryker mutation score baseline: 82%. P-06 requires ≥ 80%. Passes, but 5 surviving mutants in CascadeSimulator are edge cases. Kill these post-pilot. See DAT-004. | LOW | Blind | Day 5 |

---

## Resolved Debt

| ID | Description | Resolution |
|----|-------------|-----------|
| — | Hardcoded demo dates in cascade-c.ts | Fixed by Wilt challenge — all dates now relative (CHALLENGE-020) |
| — | Over-permissioned OAuth scopes (3 extra) | Fixed by Breach challenge — removed before code written (CHALLENGE-005) |
| — | Mock bypass in NLP confidence test | Fixed by Blind challenge — mock returns real JSON (CHALLENGE-007) |
