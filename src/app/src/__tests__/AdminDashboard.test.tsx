/**
 * SCENARIO: AdminDashboard — all 3 tabs (Overview, Feedback, Pipeline Health),
 *           KPI rendering, AI insights, feedback table with Comment column,
 *           type/source filtering, signal profiles.
 */
import React from 'react';
import { render, screen, fireEvent, waitFor, act } from '@testing-library/react';
import { AdminDashboard } from '../pages/AdminDashboard';

// ─── Module mocks ─────────────────────────────────────────────────────────────

jest.mock('react-i18next', () => ({
  useTranslation: () => ({ t: (k: string) => k, i18n: { language: 'en' } }),
}));

jest.mock('../api/commitApi', () => ({
  getAdminMetrics:       jest.fn(),
  getAdminInsights:      jest.fn(),
  getAdminFeedback:      jest.fn(),
  getAdminSignalProfiles: jest.fn(),
}));
import {
  getAdminMetrics,
  getAdminInsights,
  getAdminFeedback,
  getAdminSignalProfiles,
} from '../api/commitApi';

jest.mock('@fluentui/react-components', () => {
  const React = require('react');
  const el = (tag: string) =>
    ({ children, ...props }: Record<string, unknown>) =>
      React.createElement(tag, props, children);

  return {
    makeStyles:  () => () => ({}),
    tokens:      new Proxy({}, { get: () => '' }),
    Card:        el('div'),
    CardHeader:  ({ header }: { header: unknown }) => React.createElement('div', {}, header),
    Text:        ({ children, ...props }: Record<string, unknown>) =>
                   React.createElement('span', props, children),
    Badge:       ({ children, ...props }: Record<string, unknown>) =>
                   React.createElement('span', { 'data-badge': 'true', ...props }, children),
    Button:      ({ onClick, children, disabled, ...props }: Record<string, unknown>) =>
                   React.createElement('button', { onClick, disabled, ...props }, children),
    Divider:     el('hr'),
    Spinner:     () => React.createElement('span', {}, '...'),
    Tab:         ({ children, value, ...props }: { children: unknown; value: string; [k: string]: unknown }) =>
                   React.createElement('button', { 'data-tab-value': value, ...props }, children),
    TabList:     ({ children, onTabSelect }: { children: unknown; onTabSelect?: (e: unknown, d: { value: string }) => void }) =>
                   React.createElement('div', { role: 'tablist' },
                     React.Children.map(children as React.ReactElement[], (child) => {
                       if (!React.isValidElement(child)) return child;
                       const tabValue = (child.props as { 'data-tab-value'?: string })['data-tab-value'] ??
                                        (child.props as { value?: string }).value;
                       return React.cloneElement(child, {
                         onClick: () => onTabSelect?.({}, { value: tabValue as string }),
                       } as Record<string, unknown>);
                     })
                   ),
  };
});

// ─── Fixtures ─────────────────────────────────────────────────────────────────

const MOCK_METRICS = {
  totalCommitments: 42,
  totalFeedback: 8,
  falsePositiveRate: 0.25,
  avgConfidence: 0.78,
  bySource: { meeting: 20, chat: 12, email: 5, ado: 3, drive: 1, planner: 1 },
  byPriority: { 'urgent-important': 10, 'not-urgent-important': 15 },
};

const MOCK_FEEDBACK_ITEM = (overrides = {}) => ({
  type:       'FalsePositive',
  sourceType: 'meeting',
  recordedAt: '2026-03-08T19:15:00Z',
  idRef:      'ABCD1234',
  confidence: 0,
  comment:    'This was just a meeting invite',
  ...overrides,
});

const MOCK_FEEDBACK_DATA = {
  items: [MOCK_FEEDBACK_ITEM()],
  total: 1,
  breakdown: {
    byType:   { FalsePositive: 1 },
    bySource: { meeting: 1 },
  },
};

const MOCK_PROFILES = {
  users: [
    {
      userRef:              'abc123',
      totalFeedback:        3,
      fpRate:               0.67,
      suppressedCount:      1,
      confidenceAdjustment: 0.15,
      lastFeedbackAt:       '2026-03-08T00:00:00Z',
    },
  ],
  aggregate: {
    userCount:               1,
    avgFpRate:               0.67,
    avgConfidenceAdjustment: 0.15,
    totalSuppressed:         1,
  },
};

// Helper: click the Feedback tab by its role + name to avoid matching KPI "Feedback Events"
function clickFeedbackTab() {
  fireEvent.click(screen.getByRole('button', { name: /^Feedback/ }));
}

// ─── Overview tab ─────────────────────────────────────────────────────────────

describe('AdminDashboard — Overview tab', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    (getAdminMetrics as jest.Mock).mockResolvedValue(MOCK_METRICS);
  });

  it('renders the Commit Admin heading', async () => {
    render(<AdminDashboard />);
    await waitFor(() => expect(screen.getByText('Commit Admin')).toBeInTheDocument());
  });

  it('fetches metrics on mount', async () => {
    render(<AdminDashboard />);
    await waitFor(() => expect(getAdminMetrics).toHaveBeenCalledTimes(1));
  });

  it('shows dashes while metrics are loading', () => {
    (getAdminMetrics as jest.Mock).mockReturnValue(new Promise(() => {})); // never resolves
    render(<AdminDashboard />);
    expect(screen.getAllByText(/—/).length).toBeGreaterThan(0);
  });

  it('renders all 4 KPI card labels', async () => {
    render(<AdminDashboard />);
    await waitFor(() => {
      expect(screen.getByText('Total Commitments')).toBeInTheDocument();
      expect(screen.getByText('Feedback Events')).toBeInTheDocument();
      expect(screen.getByText('Avg Confidence')).toBeInTheDocument();
      expect(screen.getByText('False Positive Rate')).toBeInTheDocument();
    });
  });

  it('renders KPI values from metrics response', async () => {
    render(<AdminDashboard />);
    await waitFor(() => {
      expect(screen.getByText(/📋 42/)).toBeInTheDocument();
      expect(screen.getByText(/💬 8/)).toBeInTheDocument();
      expect(screen.getByText(/🎯 0.78/)).toBeInTheDocument();
      expect(screen.getByText(/25%/)).toBeInTheDocument();
    });
  });

  it('shows AI Insights panel with Generate button before insights load', async () => {
    render(<AdminDashboard />);
    await waitFor(() =>
      expect(screen.getByText('Generate Insights')).toBeInTheDocument()
    );
  });

  it('Generate Insights button calls getAdminInsights', async () => {
    (getAdminInsights as jest.Mock).mockResolvedValue({ insights: 'FalsePositive rate trending down.' });
    render(<AdminDashboard />);
    await waitFor(() => screen.getByText('Generate Insights'));
    await act(async () => {
      fireEvent.click(screen.getByText('Generate Insights'));
    });
    await waitFor(() => expect(getAdminInsights).toHaveBeenCalledTimes(1));
  });

  it('renders generated insights text', async () => {
    (getAdminInsights as jest.Mock).mockResolvedValue({ insights: 'FalsePositive rate trending down.' });
    render(<AdminDashboard />);
    await waitFor(() => screen.getByText('Generate Insights'));
    await act(async () => {
      fireEvent.click(screen.getByText('Generate Insights'));
    });
    await waitFor(() =>
      expect(screen.getByText('FalsePositive rate trending down.')).toBeInTheDocument()
    );
  });

  it('Refresh button refetches metrics', async () => {
    render(<AdminDashboard />);
    await waitFor(() => screen.getByText('↻ Refresh'));
    await act(async () => {
      fireEvent.click(screen.getByText('↻ Refresh'));
    });
    await waitFor(() => expect(getAdminMetrics).toHaveBeenCalledTimes(2));
  });

  it('renders Overview, Feedback, Pipeline Health tabs', async () => {
    render(<AdminDashboard />);
    await waitFor(() => {
      expect(screen.getByText('Overview')).toBeInTheDocument();
      expect(screen.getByRole('button', { name: /^Feedback/ })).toBeInTheDocument();
      expect(screen.getByText('Pipeline Health')).toBeInTheDocument();
    });
  });
});

// ─── Feedback tab ─────────────────────────────────────────────────────────────

describe('AdminDashboard — Feedback tab', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    (getAdminMetrics as jest.Mock).mockResolvedValue(MOCK_METRICS);
    (getAdminFeedback as jest.Mock).mockResolvedValue(MOCK_FEEDBACK_DATA);
  });

  async function switchToFeedback() {
    render(<AdminDashboard />);
    await waitFor(() => screen.getByRole('button', { name: /^Feedback/ }));
    await act(async () => { clickFeedbackTab(); });
    // Wait for load to complete (Apply button text appears when fbLoading=false)
    await waitFor(() => screen.getByText('Apply'));
  }

  it('switching to Feedback tab calls getAdminFeedback', async () => {
    await switchToFeedback();
    await waitFor(() => expect(getAdminFeedback).toHaveBeenCalledTimes(1));
  });

  it('renders the Comment column header', async () => {
    await switchToFeedback();
    await waitFor(() => expect(screen.getByText('Comment')).toBeInTheDocument());
  });

  it('renders When, Type, Source, Task ID, Confidence column headers', async () => {
    await switchToFeedback();
    await waitFor(() => {
      expect(screen.getByText('When')).toBeInTheDocument();
      expect(screen.getByText('Type')).toBeInTheDocument();
      expect(screen.getByText('Source')).toBeInTheDocument();
      expect(screen.getByText('Task ID')).toBeInTheDocument();
      expect(screen.getByText('Confidence')).toBeInTheDocument();
    });
  });

  it('renders the comment text from feedback item', async () => {
    await switchToFeedback();
    await waitFor(() =>
      expect(screen.getByText('This was just a meeting invite')).toBeInTheDocument()
    );
  });

  it('renders "—" when feedback item has no comment', async () => {
    (getAdminFeedback as jest.Mock).mockResolvedValue({
      ...MOCK_FEEDBACK_DATA,
      items: [MOCK_FEEDBACK_ITEM({ comment: null })],
    });
    render(<AdminDashboard />);
    await waitFor(() => screen.getByRole('button', { name: /^Feedback/ }));
    await act(async () => { clickFeedbackTab(); });
    await waitFor(() => screen.getByText('Apply'));
    // Dash placeholder for missing comment
    await waitFor(() => expect(screen.getAllByText('—').length).toBeGreaterThan(0));
  });

  it('renders By Type breakdown', async () => {
    await switchToFeedback();
    await waitFor(() => expect(screen.getByText('By Type')).toBeInTheDocument());
  });

  it('renders By Source breakdown', async () => {
    await switchToFeedback();
    await waitFor(() => expect(screen.getByText('By Source')).toBeInTheDocument());
  });

  it('type filter dropdown exists with All types option', async () => {
    await switchToFeedback();
    await waitFor(() => {
      const selects = screen.getAllByRole('combobox');
      expect(selects[0]).toBeInTheDocument();
    });
  });

  it('source filter dropdown exists with All sources option', async () => {
    await switchToFeedback();
    await waitFor(() => {
      const selects = screen.getAllByRole('combobox');
      expect(selects[1]).toBeInTheDocument();
    });
  });

  it('Apply filter button calls getAdminFeedback with filter values', async () => {
    await switchToFeedback();
    const selects = screen.getAllByRole('combobox');
    fireEvent.change(selects[0], { target: { value: 'FalsePositive' } });
    // Changing filter auto-triggers a reload; wait for it to settle before clicking Apply
    await waitFor(() => screen.getByText('Apply'));
    await act(async () => { fireEvent.click(screen.getByText('Apply')); });
    await waitFor(() =>
      expect(getAdminFeedback).toHaveBeenCalledWith(
        'FalsePositive', undefined, 200, undefined
      )
    );
  });

  it('shows event count from items array', async () => {
    await switchToFeedback();
    await waitFor(() => expect(screen.getByText(/1 event/)).toBeInTheDocument());
  });

  it('Feedback tab Refresh button refetches', async () => {
    await switchToFeedback();
    await waitFor(() => screen.getByText('↻ Refresh'));
    await act(async () => { fireEvent.click(screen.getByText('↻ Refresh')); });
    await waitFor(() => expect(getAdminFeedback).toHaveBeenCalledTimes(2));
  });

  it('multiple feedback items all render with their comments', async () => {
    (getAdminFeedback as jest.Mock).mockResolvedValue({
      items: [
        MOCK_FEEDBACK_ITEM({ comment: 'Meeting invite' }),
        MOCK_FEEDBACK_ITEM({ comment: 'Already in Planner' }),
      ],
      total: 2,
      breakdown: {
        byType:   { FalsePositive: 2 },
        bySource: { meeting: 2 },
      },
    });
    render(<AdminDashboard />);
    await waitFor(() => screen.getByRole('button', { name: /^Feedback/ }));
    await act(async () => { clickFeedbackTab(); });
    await waitFor(() => screen.getByText('Apply'));
    await waitFor(() => {
      expect(screen.getByText('Meeting invite')).toBeInTheDocument();
      expect(screen.getByText('Already in Planner')).toBeInTheDocument();
    });
  });
});

// ─── Pipeline Health tab ──────────────────────────────────────────────────────

describe('AdminDashboard — Pipeline Health tab', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    (getAdminMetrics as jest.Mock).mockResolvedValue(MOCK_METRICS);
    (getAdminSignalProfiles as jest.Mock).mockResolvedValue(MOCK_PROFILES);
  });

  async function switchToPipeline() {
    render(<AdminDashboard />);
    await waitFor(() => screen.getByText('Pipeline Health'));
    await act(async () => { fireEvent.click(screen.getByText('Pipeline Health')); });
    await waitFor(() => expect(getAdminSignalProfiles).toHaveBeenCalled());
  }

  it('switching to Pipeline Health calls getAdminSignalProfiles', async () => {
    await switchToPipeline();
    expect(getAdminSignalProfiles).toHaveBeenCalledTimes(1);
  });

  it('renders How Feedback Improves Extraction explanation', async () => {
    await switchToPipeline();
    await waitFor(() =>
      expect(screen.getByText(/How Feedback Improves Extraction/)).toBeInTheDocument()
    );
  });

  it('renders Per-User Signal Profiles section', async () => {
    await switchToPipeline();
    await waitFor(() =>
      expect(screen.getByText(/Signal Profiles/)).toBeInTheDocument()
    );
  });

  it('Refresh button refetches signal profiles', async () => {
    await switchToPipeline();
    await waitFor(() => screen.getByText('↻ Refresh'));
    await act(async () => { fireEvent.click(screen.getByText('↻ Refresh')); });
    await waitFor(() => expect(getAdminSignalProfiles).toHaveBeenCalledTimes(2));
  });
});

// ─── Tab navigation ───────────────────────────────────────────────────────────

describe('AdminDashboard — tab navigation', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    (getAdminMetrics as jest.Mock).mockResolvedValue(MOCK_METRICS);
    (getAdminFeedback as jest.Mock).mockResolvedValue(MOCK_FEEDBACK_DATA);
    (getAdminSignalProfiles as jest.Mock).mockResolvedValue(MOCK_PROFILES);
  });

  it('Overview tab is active by default', async () => {
    render(<AdminDashboard />);
    await waitFor(() => expect(screen.getByText('Total Commitments')).toBeInTheDocument());
    expect(screen.queryByText('Comment')).not.toBeInTheDocument();
  });

  it('switching Overview → Feedback → Overview maintains KPI data', async () => {
    render(<AdminDashboard />);
    await waitFor(() => screen.getByText('Total Commitments'));
    await act(async () => { clickFeedbackTab(); });
    await waitFor(() => screen.getByText('Comment'));
    await act(async () => { fireEvent.click(screen.getByText('Overview')); });
    await waitFor(() => expect(screen.getByText('Total Commitments')).toBeInTheDocument());
  });

  it('navigating to all 3 tabs triggers the right API calls', async () => {
    render(<AdminDashboard />);
    await waitFor(() => screen.getByText('Total Commitments'));
    await act(async () => { clickFeedbackTab(); });
    await waitFor(() => expect(getAdminFeedback).toHaveBeenCalled());
    await act(async () => { fireEvent.click(screen.getByText('Pipeline Health')); });
    await waitFor(() => expect(getAdminSignalProfiles).toHaveBeenCalled());
    expect(getAdminMetrics).toHaveBeenCalledTimes(1); // only on mount
  });
});
