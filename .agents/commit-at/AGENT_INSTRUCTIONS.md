# Commit-AT — Agent Boot Protocol

> **Read this first. Every session. No exceptions.**

---

## Project Identity

**Commit-AT** is the Commit FHL app rebuilt using the 18-agent adversarial team protocol.
Its purpose is to demonstrate what predictable quality delivery looks like when:
- Every agent has a challenger
- Every task has a design gate
- Every PASS requires documented evidence

---

## On Boot — Always Do These

1. Read `SESSION.md` — current sprint state, last task, next task, blockers
2. Read `tasks.md` — find first `[ ]` or `[~]` task not blocked
3. Read `decisions.md` — understand all locked decisions before acting
4. Check `agent-inbox.md` — any unaddressed `[BLOCKING]` messages?
5. Read your role card — `../..specify/memory/agent-roles/{your-role}.md`
6. Read your challenger's role card — understand what they will check

---

## Resume Command

> "Read `.agents/commit-at/SESSION.md` — you are leading the Commit-AT project.
> Resume from the current state. Check tasks.md for next task and decisions.md
> for any pending human decisions before acting."

---

## The Adversarial Protocol (P-37 + P-38 Summary)

### Before every task
1. Post `[DESIGN]` note to `agent-inbox.md`
2. Challenger reviews and posts `[DESIGN-APPROVED]` or `[DESIGN-CHALLENGE]`
3. If CHALLENGE: resolve before writing any code
4. Only after `[DESIGN-APPROVED]`: begin implementation

### During every task
If you hit ANY of these — STOP and post `[DESIGN-REVIEW]` to agent-inbox.md:
- New architectural pattern not in approved design
- New dependency (npm/NuGet) not in original task
- Layering boundary crossed (business logic in wrong layer)
- Data model or API contract changed from spec
- New OAuth scope added
- New component/service created not in design
- Line count reaches 500 — MUST split into sub-tasks

### After every task
1. Announce task complete
2. Challenger activates (one substantive exchange per party)
3. Challenger posts `PASS` or `CHALLENGE`
4. PASS requires: spec sections checked, principles checked, files reviewed, evidence
5. Only after documented PASS: Router marks `[x]`

---

## Agent Roster

### Builders
Router · Forge · Canvas · Shield · Lens · Seed · Recon · Oracle · Sentinel

### Challengers
Veto (→Router) · Crucible (→Forge) · Friction (→Canvas) · Breach (→Shield)
Blind (→Lens) · Wilt (→Seed) · Mirage (→Recon) · Noise (→Oracle) · Shadow (→Sentinel)

---

## Single-Agent Session Rules

When one agent plays both a builder and challenger role:
1. Post `[ROLE: switching from X to Y for T-NNN review]` before the review
2. Write challenger reasoning as a distinct, labelled section
3. Write challenger reasoning as if seeing the work for the first time
4. Sentinel reviews at least one PASS per challenger in single-agent sessions
5. Shadow treats zero-violation Sentinel sign-offs from single-agent sessions with extra scrutiny
