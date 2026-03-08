/**
 * SCENARIO: CommitPane — commitment card rendering, team affiliation pills,
 *           feedback flow (thumbs up/down + comment dialog), Mark Done,
 *           view mode switching, and all 6 source type icons.
 *
 * Key broken scenario documented here:
 *   KNOWN DESIGN GAP: Team pills (green/purple) do NOT appear on Alex's own board
 *   because ALL 9 seeded commitments are owned by Alex (owner === currentUserId).
 *   Pills only render for commitment.owner !== currentUserId.
 *   Cross-team labels ARE visible in CascadeView chain items (teamFromTaskId).
 */
import React from 'react';
import { render, screen, fireEvent, waitFor, act } from '@testing-library/react';
import { CommitPane } from '../components/core/CommitPane';
import { makeCommitment, ALEX_OID, MARCUS_OID, SARAH_OID } from './helpers';

// ─── Module mocks ─────────────────────────────────────────────────────────────

jest.mock('react-i18next', () => ({
  useTranslation: () => ({
    t: (key: string, opts?: Record<string, unknown>) =>
      opts ? `${key}:${JSON.stringify(opts)}` : key,
    i18n: { language: 'en' },
  }),
}));

jest.mock('@fluentui/react-components', () => {
  const React = require('react');
  const el = (tag: string) =>
    ({ children, ...props }: Record<string, unknown>) =>
      React.createElement(tag, props, children);

  // Dialog renders children inline when open=true
  const Dialog = ({ children, open }: { children: unknown; open?: boolean }) =>
    open ? React.createElement('div', { 'data-dialog': 'true' }, children) : null;
  const DialogSurface  = el('div');
  const DialogTitle    = el('div');
  const DialogBody     = el('div');
  const DialogActions  = el('div');
  const Textarea = ({
    value, onChange, placeholder, ...props
  }: { value?: string; onChange?: (e: unknown, d: { value: string }) => void; placeholder?: string; [k: string]: unknown }) =>
    React.createElement('textarea', {
      value,
      placeholder,
      onChange: (e: React.ChangeEvent<HTMLTextAreaElement>) => onChange?.(e, { value: e.target.value }),
      ...props,
    });

  return {
    makeStyles:   () => () => ({}),
    tokens:       new Proxy({}, { get: () => '' }),
    Card:         ({ onClick, children, ...props }: Record<string, unknown>) =>
                    React.createElement('div', { onClick, ...props }, children),
    CardHeader:   ({ header, description, action }: Record<string, unknown>) =>
                    React.createElement('div', {}, header, description, action),
    Text:         ({ children, truncate: _t, ...props }: Record<string, unknown>) =>
                    React.createElement('span', props, children),
    Badge:        ({ children, ...props }: Record<string, unknown>) =>
                    React.createElement('span', { 'data-badge': 'true', ...props }, children),
    Button:       ({ onClick, children, href, disabled, ...props }: Record<string, unknown>) =>
                    React.createElement(href ? 'a' : 'button', { onClick, href, disabled, ...props }, children),
    Divider:      el('hr'),
    Skeleton:     el('div'),
    SkeletonItem: el('div'),
    Tooltip:      ({ children }: { children: unknown }) => children,
    Dialog,
    DialogSurface,
    DialogTitle,
    DialogBody,
    DialogActions,
    Textarea,
  };
});

jest.mock('@react-spring/web', () => {
  const React = require('react');
  return {
    useSpring: () => ({}),
    animated:  new Proxy({}, {
      get: (_: unknown, tag: string) =>
        ({ children, style: _s, ...rest }: Record<string, unknown>) =>
          React.createElement(tag as string, rest, children),
    }),
  };
});

jest.mock('../hooks/useReducedMotion', () => ({ useReducedMotion: () => true }));
jest.mock('../config/psychology.config', () => ({
  SPRING_CONFIGS: { smooth: {}, gentle: {}, bounce: {} },
  STAGGER_DELAYS:  { cascadeItems: 0 },
}));
jest.mock('../config/api.config', () => ({ API_BASE: 'https://test-api.example.com' }));
// Mock React Query hooks used by psychology sub-components so tests don't need QueryClientProvider
jest.mock('../hooks/useDeliveryScore', () => ({ useDeliveryScore: () => ({ data: undefined }) }));
jest.mock('../hooks/useStreak',        () => ({ useStreak:        () => ({ data: undefined }) }));
jest.mock('../hooks/useCompetencyLevel', () => ({ useCompetencyLevel: () => ({ level: 1, xp: 0, nextLevelXp: 100 }) }));

// ─── Loading state ────────────────────────────────────────────────────────────

describe('CommitPane — loading state', () => {
  it('renders the pane container while loading', () => {
    render(<CommitPane commitments={[]} isLoading={true} />);
    expect(screen.getByTestId('commit-pane')).toBeInTheDocument();
  });

  it('does not render empty-state while loading', () => {
    render(<CommitPane commitments={[]} isLoading={true} />);
    expect(screen.queryByTestId('empty-state')).not.toBeInTheDocument();
  });
});

// ─── Empty state ──────────────────────────────────────────────────────────────

describe('CommitPane — empty state', () => {
  it('renders empty-state when no commitments and not loading', () => {
    render(<CommitPane commitments={[]} isLoading={false} />);
    expect(screen.getByTestId('empty-state')).toBeInTheDocument();
  });
});

// ─── Card rendering ───────────────────────────────────────────────────────────

describe('CommitPane — card rendering', () => {
  it('renders a card for each commitment by data-testid', () => {
    const c1 = makeCommitment({ id: 'rbs-001', title: 'Ship the SDK' });
    const c2 = makeCommitment({ id: 'rbs-002', title: 'Foundry accuracy gate' });

    render(<CommitPane commitments={[c1, c2]} isLoading={false} />);

    expect(screen.getByTestId('commit-card-rbs-001')).toBeInTheDocument();
    expect(screen.getByTestId('commit-card-rbs-002')).toBeInTheDocument();
  });

  it('renders commitment titles', () => {
    const c = makeCommitment({ title: 'SEVAL re-review' });
    render(<CommitPane commitments={[c]} isLoading={false} />);
    expect(screen.getByText('SEVAL re-review')).toBeInTheDocument();
  });

  it('calls onCommitmentClick with the commitment when card is clicked', () => {
    const onClick = jest.fn();
    const c = makeCommitment({ id: 'rbs-click-001' });
    render(<CommitPane commitments={[c]} isLoading={false} onCommitmentClick={onClick} />);

    fireEvent.click(screen.getByTestId('commit-card-rbs-click-001'));
    expect(onClick).toHaveBeenCalledTimes(1);
    expect(onClick).toHaveBeenCalledWith(c);
  });

  it('shows total count badge', () => {
    const commitments = [makeCommitment({ id: 'a' }), makeCommitment({ id: 'b' })];
    render(<CommitPane commitments={commitments} isLoading={false} />);
    expect(screen.getByText('2')).toBeInTheDocument();
  });
});

// ─── Impact score chip ────────────────────────────────────────────────────────

describe('CommitPane — impact score chip', () => {
  it('renders impact score badge when impactScore > 0', () => {
    const c = makeCommitment({ impactScore: 75 });
    render(<CommitPane commitments={[c]} isLoading={false} />);
    // The badge text includes the key and value
    expect(screen.getByText(/commitPane\.card\.impactScore/)).toBeInTheDocument();
  });

  it('does not render impact score badge when impactScore = 0', () => {
    const c = makeCommitment({ impactScore: 0 });
    render(<CommitPane commitments={[c]} isLoading={false} />);
    expect(screen.queryByText(/commitPane\.card\.impactScore/)).not.toBeInTheDocument();
  });
});

// ─── Blocking count ───────────────────────────────────────────────────────────

describe('CommitPane — blocking indicator', () => {
  it('shows blocking text when commitment.blocks has entries', () => {
    const c = makeCommitment({ blocks: ['rbs-dep-001', 'rbs-dep-002'] });
    render(<CommitPane commitments={[c]} isLoading={false} />);
    expect(screen.getByText(/commitPane\.card\.blocking/)).toBeInTheDocument();
  });

  it('does not show blocking text when blocks is empty', () => {
    const c = makeCommitment({ blocks: [] });
    render(<CommitPane commitments={[c]} isLoading={false} />);
    expect(screen.queryByText(/commitPane\.card\.blocking/)).not.toBeInTheDocument();
  });
});

// ─── Team affiliation pills ───────────────────────────────────────────────────
//
// DESIGN DECISION: Team pills are intentionally HIDDEN for self-owned cards.
// This means Alex's board (all 9 cards owned by Alex) shows NO team pills.
// Cross-team labels appear only on cascade chain items via teamFromTaskId.

describe('CommitPane — team affiliation pills', () => {
  describe('KNOWN DESIGN GAP: self-owned cards have no team pill', () => {
    it('does NOT show team pill when commitment.owner === currentUserId (Alex on Alex board)', () => {
      const c = makeCommitment({ owner: ALEX_OID });
      render(<CommitPane commitments={[c]} isLoading={false} currentUserId={ALEX_OID} />);
      expect(screen.queryByText('Reschedule Crew')).not.toBeInTheDocument();
    });

    it('does NOT show BizChat Platform pill on a cross-team card if currentUserId is also that user', () => {
      // Edge case: viewing someone else's board as them — no self-pill
      const c = makeCommitment({ owner: MARCUS_OID });
      render(<CommitPane commitments={[c]} isLoading={false} currentUserId={MARCUS_OID} />);
      expect(screen.queryByText('BizChat Platform')).not.toBeInTheDocument();
    });
  });

  describe('positive path: cross-team pills appear for foreign owners', () => {
    it('shows "BizChat Platform" (purple) for Marcus-owned card on Alex board', () => {
      const c = makeCommitment({ owner: MARCUS_OID, title: 'BizChat Plugin Slot' });
      render(<CommitPane commitments={[c]} isLoading={false} currentUserId={ALEX_OID} />);
      expect(screen.getByText('BizChat Platform')).toBeInTheDocument();
    });

    it('shows "Scheduling Skill" (green) for Sarah-owned card on Alex board', () => {
      const c = makeCommitment({ owner: SARAH_OID, title: 'SDK Delivery' });
      render(<CommitPane commitments={[c]} isLoading={false} currentUserId={ALEX_OID} />);
      expect(screen.getByText('Scheduling Skill')).toBeInTheDocument();
    });

    it('shows no pill if currentUserId is not provided (undefined)', () => {
      // Without currentUserId, owner !== undefined is always true so pill DOES show
      const c = makeCommitment({ owner: MARCUS_OID });
      render(<CommitPane commitments={[c]} isLoading={false} />);
      // ownerTeam is defined for Marcus, currentUserId is undefined → pill should show
      expect(screen.getByText('BizChat Platform')).toBeInTheDocument();
    });

    it('shows no pill for an owner not in TEAM_BY_USER', () => {
      const c = makeCommitment({ owner: 'unknown-oid-xyz' });
      render(<CommitPane commitments={[c]} isLoading={false} currentUserId={ALEX_OID} />);
      expect(screen.queryByText('Reschedule Crew')).not.toBeInTheDocument();
      expect(screen.queryByText('Scheduling Skill')).not.toBeInTheDocument();
      expect(screen.queryByText('BizChat Platform')).not.toBeInTheDocument();
    });
  });
});

// ─── Quadrant grouping ────────────────────────────────────────────────────────

describe('CommitPane — Eisenhower quadrant grouping', () => {
  it('groups cards by priority quadrant', () => {
    const urgent    = makeCommitment({ id: 'u1', priority: 'urgent-important' });
    const notUrgent = makeCommitment({ id: 'n1', priority: 'not-urgent-important' });

    render(<CommitPane commitments={[urgent, notUrgent]} isLoading={false} />);

    expect(screen.getByTestId('commit-card-u1')).toBeInTheDocument();
    expect(screen.getByTestId('commit-card-n1')).toBeInTheDocument();
    expect(screen.getByText('commitPane.quadrants.urgentImportant')).toBeInTheDocument();
    expect(screen.getByText('commitPane.quadrants.notUrgentImportant')).toBeInTheDocument();
  });

  it('does not render quadrant label when no cards exist for it', () => {
    const c = makeCommitment({ priority: 'urgent-important' });
    render(<CommitPane commitments={[c]} isLoading={false} />);
    expect(screen.queryByText('commitPane.quadrants.notUrgentNotImportant')).not.toBeInTheDocument();
  });
});

// ─── View mode switching ──────────────────────────────────────────────────────

describe('CommitPane — view mode switching', () => {
  it('renders Priority, Project, Progress tab buttons', () => {
    render(<CommitPane commitments={[makeCommitment()]} isLoading={false} />);
    expect(screen.getByText('Priority')).toBeInTheDocument();
    expect(screen.getByText('Project')).toBeInTheDocument();
    expect(screen.getByText(/Progress/)).toBeInTheDocument();
  });

  it('switching to Project view groups by projectContext', () => {
    const c1 = makeCommitment({ id: 'p1', projectContext: 'Alpha', priority: 'urgent-important' });
    const c2 = makeCommitment({ id: 'p2', projectContext: 'Beta',  priority: 'not-urgent-important' });
    render(<CommitPane commitments={[c1, c2]} isLoading={false} />);
    fireEvent.click(screen.getByText('Project'));
    // Both cards still render in project view
    expect(screen.getByTestId('commit-card-p1')).toBeInTheDocument();
    expect(screen.getByTestId('commit-card-p2')).toBeInTheDocument();
  });

  it('switching back to Priority view shows quadrant headers', () => {
    const c = makeCommitment({ priority: 'urgent-important' });
    render(<CommitPane commitments={[c]} isLoading={false} />);
    fireEvent.click(screen.getByText('Project'));
    fireEvent.click(screen.getByText('Priority'));
    expect(screen.getByText('commitPane.quadrants.urgentImportant')).toBeInTheDocument();
  });
});

// ─── Feedback — thumbs up (Confirm) ──────────────────────────────────────────

describe('CommitPane — thumbs up feedback', () => {
  beforeEach(() => {
    global.fetch = jest.fn().mockResolvedValue({ ok: true, json: async () => ({ success: true }) });
  });

  it('renders the Mark as useful button', () => {
    const c = makeCommitment({ status: 'pending' });
    render(<CommitPane commitments={[c]} isLoading={false} currentUserId={ALEX_OID} />);
    expect(screen.getByRole('button', { name: 'Mark as useful' })).toBeInTheDocument();
  });

  it('clicking thumbs up calls feedback API with Confirm type', async () => {
    const c = makeCommitment({ id: 'rbs-up-001', status: 'pending' });
    render(<CommitPane commitments={[c]} isLoading={false} currentUserId={ALEX_OID} />);
    await act(async () => {
      fireEvent.click(screen.getByRole('button', { name: 'Mark as useful' }));
    });
    await waitFor(() =>
      expect(global.fetch).toHaveBeenCalledWith(
        expect.stringContaining('/api/v1/commitments/rbs-up-001/feedback'),
        expect.objectContaining({
          method: 'POST',
          body: expect.stringContaining('"type":"Confirm"'),
        })
      )
    );
  });

  it('hides feedback buttons on done cards', () => {
    const c = makeCommitment({ status: 'done' });
    render(<CommitPane commitments={[c]} isLoading={false} currentUserId={ALEX_OID} />);
    expect(screen.queryByTitle('Mark as useful')).not.toBeInTheDocument();
    expect(screen.queryByTitle('Not a real task')).not.toBeInTheDocument();
  });
});

// ─── Feedback — thumbs down (FalsePositive + comment dialog) ─────────────────

describe('CommitPane — thumbs down feedback with comment dialog', () => {
  beforeEach(() => {
    global.fetch = jest.fn().mockResolvedValue({ ok: true, json: async () => ({ success: true }) });
  });

  it('renders the Not a real task button', () => {
    const c = makeCommitment({ status: 'pending' });
    render(<CommitPane commitments={[c]} isLoading={false} currentUserId={ALEX_OID} />);
    expect(screen.getByRole('button', { name: 'Not a real task' })).toBeInTheDocument();
  });

  it('clicking thumbs down opens the comment dialog', () => {
    const c = makeCommitment({ status: 'pending' });
    render(<CommitPane commitments={[c]} isLoading={false} currentUserId={ALEX_OID} />);
    fireEvent.click(screen.getByRole('button', { name: 'Not a real task' }));
    expect(screen.getByText("Why isn't this a real task?")).toBeInTheDocument();
  });

  it('dialog has a textarea for entering a comment', () => {
    const c = makeCommitment({ status: 'pending' });
    render(<CommitPane commitments={[c]} isLoading={false} currentUserId={ALEX_OID} />);
    fireEvent.click(screen.getByRole('button', { name: 'Not a real task' }));
    expect(screen.getByPlaceholderText(/helps improve extraction/i)).toBeInTheDocument();
  });

  it('Cancel closes the dialog without calling the API', () => {
    const c = makeCommitment({ status: 'pending' });
    render(<CommitPane commitments={[c]} isLoading={false} currentUserId={ALEX_OID} />);
    fireEvent.click(screen.getByRole('button', { name: 'Not a real task' }));
    fireEvent.click(screen.getByText('Cancel'));
    expect(screen.queryByText("Why isn't this a real task?")).not.toBeInTheDocument();
    expect(global.fetch).not.toHaveBeenCalled();
  });

  it('Submit calls feedback API with FalsePositive type and the entered comment', async () => {
    const c = makeCommitment({ id: 'rbs-down-001', status: 'pending' });
    render(<CommitPane commitments={[c]} isLoading={false} currentUserId={ALEX_OID} />);
    fireEvent.click(screen.getByRole('button', { name: 'Not a real task' }));
    fireEvent.change(screen.getByPlaceholderText(/helps improve extraction/i), {
      target: { value: 'This is just a meeting invite' },
    });
    await act(async () => {
      fireEvent.click(screen.getByText('Submit'));
    });
    await waitFor(() =>
      expect(global.fetch).toHaveBeenCalledWith(
        expect.stringContaining('/api/v1/commitments/rbs-down-001/feedback'),
        expect.objectContaining({
          method: 'POST',
          body: expect.stringContaining('"type":"FalsePositive"'),
        })
      )
    );
    expect((global.fetch as jest.Mock).mock.calls[0][1].body).toContain('This is just a meeting invite');
  });

  it('Submit with blank comment still calls API (comment is optional)', async () => {
    const c = makeCommitment({ id: 'rbs-down-002', status: 'pending' });
    render(<CommitPane commitments={[c]} isLoading={false} currentUserId={ALEX_OID} />);
    fireEvent.click(screen.getByRole('button', { name: 'Not a real task' }));
    await act(async () => {
      fireEvent.click(screen.getByText('Submit'));
    });
    await waitFor(() =>
      expect(global.fetch).toHaveBeenCalledWith(
        expect.stringContaining('/api/v1/commitments/rbs-down-002/feedback'),
        expect.anything()
      )
    );
  });

  it('dialog closes after Submit', async () => {
    const c = makeCommitment({ status: 'pending' });
    render(<CommitPane commitments={[c]} isLoading={false} currentUserId={ALEX_OID} />);
    fireEvent.click(screen.getByRole('button', { name: 'Not a real task' }));
    await act(async () => {
      fireEvent.click(screen.getByText('Submit'));
    });
    expect(screen.queryByText("Why isn't this a real task?")).not.toBeInTheDocument();
  });
});

// ─── Mark Done ────────────────────────────────────────────────────────────────

describe('CommitPane — Mark Done', () => {
  beforeEach(() => {
    global.fetch = jest.fn().mockResolvedValue({ ok: true, json: async () => ({}) });
  });

  it('renders the Done button on a pending card', () => {
    const c = makeCommitment({ status: 'pending' });
    render(<CommitPane commitments={[c]} isLoading={false} currentUserId={ALEX_OID} />);
    expect(screen.getByText('✓ Done')).toBeInTheDocument();
  });

  it('clicking Done calls PATCH endpoint with status=done', async () => {
    const c = makeCommitment({ id: 'rbs-done-001', status: 'pending', owner: ALEX_OID });
    render(<CommitPane commitments={[c]} isLoading={false} currentUserId={ALEX_OID} />);
    await act(async () => {
      fireEvent.click(screen.getByText('✓ Done'));
    });
    await waitFor(() =>
      expect(global.fetch).toHaveBeenCalledWith(
        expect.stringContaining(`/api/v1/commitments/${ALEX_OID}/rbs-done-001`),
        expect.objectContaining({
          method: 'PATCH',
          body: expect.stringContaining('"status":"done"'),
        })
      )
    );
  });

  it('does not render Done button on already-done cards', () => {
    const c = makeCommitment({ status: 'done' });
    render(<CommitPane commitments={[c]} isLoading={false} currentUserId={ALEX_OID} />);
    expect(screen.queryByText('✓ Done')).not.toBeInTheDocument();
  });
});

// ─── Source type icons (all 6 extraction sources) ────────────────────────────

describe('CommitPane — source type icons for all 6 intent-detection sources', () => {
  const SOURCES: Array<{ type: CommitmentRecord['source']['type']; icon: string }> = [
    { type: 'meeting',  icon: '📹' },
    { type: 'chat',     icon: '💬' },
    { type: 'email',    icon: '📧' },
    { type: 'ado',      icon: '🔧' },
    { type: 'drive',    icon: '📄' },
    { type: 'planner',  icon: '📋' },
  ];

  SOURCES.forEach(({ type, icon }) => {
    it(`renders ${icon} icon for source type "${type}"`, () => {
      const c = makeCommitment({
        source: { type, url: `https://example.com/${type}`, timestamp: '2026-03-01T09:00:00Z' },
      });
      render(<CommitPane commitments={[c]} isLoading={false} />);
      expect(screen.getByText(icon)).toBeInTheDocument();
    });
  });
});

// ─── Intent detection scenarios (source-driven extraction) ───────────────────

describe('CommitPane — intent detection scenarios', () => {
  it('meeting transcript commitment: renders title + meeting source icon', () => {
    const c = makeCommitment({
      title: 'Deliver BizChat Copilot Skill GA package by March 10',
      source: { type: 'meeting', url: 'https://teams.microsoft.com/l/meet/1', timestamp: '2026-03-01T09:00:00Z' },
      priority: 'urgent-important',
    });
    render(<CommitPane commitments={[c]} isLoading={false} />);
    expect(screen.getByText('Deliver BizChat Copilot Skill GA package by March 10')).toBeInTheDocument();
    expect(screen.getByText('📹')).toBeInTheDocument();
  });

  it('chat commitment: renders title + chat source icon', () => {
    const c = makeCommitment({
      title: 'Send final API contract diff to SDK team by EOD Friday',
      source: { type: 'chat', url: 'https://teams.microsoft.com/l/chat/0', timestamp: '2026-03-01T09:00:00Z' },
    });
    render(<CommitPane commitments={[c]} isLoading={false} />);
    expect(screen.getByText('Send final API contract diff to SDK team by EOD Friday')).toBeInTheDocument();
    expect(screen.getByText('💬')).toBeInTheDocument();
  });

  it('email commitment: renders title + email source icon', () => {
    const c = makeCommitment({
      title: 'Unblock dashboard by sharing Viva Insights capacity data',
      source: { type: 'email', url: 'https://outlook.office.com/mail/inbox/id/AAQk', timestamp: '2026-03-01T09:00:00Z' },
    });
    render(<CommitPane commitments={[c]} isLoading={false} />);
    expect(screen.getByText('Unblock dashboard by sharing Viva Insights capacity data')).toBeInTheDocument();
    expect(screen.getByText('📧')).toBeInTheDocument();
  });

  it('ADO work item commitment: renders title + ADO source icon', () => {
    const c = makeCommitment({
      title: 'Fix p99 latency regression in semantic ranking before GA',
      source: { type: 'ado', url: 'https://dev.azure.com/contoso/BizChat/_workitems/edit/18847', timestamp: '2026-03-01T09:00:00Z' },
    });
    render(<CommitPane commitments={[c]} isLoading={false} />);
    expect(screen.getByText('Fix p99 latency regression in semantic ranking before GA')).toBeInTheDocument();
    expect(screen.getByText('🔧')).toBeInTheDocument();
  });

  it('Drive/SharePoint commitment: renders title + drive source icon', () => {
    const c = makeCommitment({
      title: 'Update GA readiness checklist in SharePoint with latency test results',
      source: { type: 'drive', url: 'https://contoso.sharepoint.com/sites/BizChat', timestamp: '2026-03-01T09:00:00Z' },
    });
    render(<CommitPane commitments={[c]} isLoading={false} />);
    expect(screen.getByText('Update GA readiness checklist in SharePoint with latency test results')).toBeInTheDocument();
    expect(screen.getByText('📄')).toBeInTheDocument();
  });

  it('Planner task commitment: renders title + planner source icon', () => {
    const c = makeCommitment({
      title: 'Review and approve SDK integration PR before Thursday standup',
      source: { type: 'planner', url: 'https://tasks.office.com/contoso/en-US/Home/Planner', timestamp: '2026-03-01T09:00:00Z' },
    });
    render(<CommitPane commitments={[c]} isLoading={false} />);
    expect(screen.getByText('Review and approve SDK integration PR before Thursday standup')).toBeInTheDocument();
    expect(screen.getByText('📋')).toBeInTheDocument();
  });

  it('high-impact urgent commitment gets placed in Act Today (urgent-important) quadrant', () => {
    const c = makeCommitment({
      title: 'Fix critical P0 outage',
      priority: 'urgent-important',
      impactScore: 90,
    });
    render(<CommitPane commitments={[c]} isLoading={false} />);
    expect(screen.getByText('commitPane.quadrants.urgentImportant')).toBeInTheDocument();
    expect(screen.getByText('Fix critical P0 outage')).toBeInTheDocument();
  });

  it('planner task gets placed in Schedule (not-urgent-important) quadrant', () => {
    const c = makeCommitment({
      title: 'Review quarterly OKRs',
      priority: 'not-urgent-important',
      source: { type: 'planner', url: 'https://tasks.office.com/', timestamp: '2026-03-01T09:00:00Z' },
    });
    render(<CommitPane commitments={[c]} isLoading={false} />);
    expect(screen.getByText('commitPane.quadrants.notUrgentImportant')).toBeInTheDocument();
  });

  it('completion item (ItemKind=completion) still renders when status=done', () => {
    const c = makeCommitment({
      title: 'Merged BizChat PR #9201',
      status: 'done',
      source: { type: 'ado', url: 'https://dev.azure.com/contoso/BizChat/_git/BizChat/pullrequest/9201', timestamp: '2026-03-01T09:00:00Z' },
    });
    render(<CommitPane commitments={[c]} isLoading={false} />);
    // Done items appear in Progress view (as completionCard, not CommitCard)
    fireEvent.click(screen.getByText('Progress'));
    expect(screen.getByText('Merged BizChat PR #9201')).toBeInTheDocument();
  });

  it('overdue commitment shows overdue indicator', () => {
    const pastDate = new Date(Date.now() - 3 * 24 * 60 * 60 * 1000).toISOString();
    const c = makeCommitment({ dueAt: pastDate, status: 'pending' });
    render(<CommitPane commitments={[c]} isLoading={false} />);
    expect(screen.getByText(/commitPane\.card\.overdue/)).toBeInTheDocument();
  });

  it('future due date shows "due in X days"', () => {
    const futureDate = new Date(Date.now() + 3 * 24 * 60 * 60 * 1000).toISOString();
    const c = makeCommitment({ dueAt: futureDate, status: 'pending' });
    render(<CommitPane commitments={[c]} isLoading={false} />);
    expect(screen.getByText(/commitPane\.card\.dueIn/)).toBeInTheDocument();
  });
});

// ─── Type import for source scenarios ────────────────────────────────────────
import type { CommitmentRecord } from '../types/api';
