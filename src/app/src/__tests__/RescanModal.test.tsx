/**
 * SCENARIO: RescanModal — open/close, source toggles, days slider,
 *           rescan API call, success/error messages, disabled state.
 */
import React from 'react';
import { render, screen, fireEvent, waitFor, act } from '@testing-library/react';
import { RescanModal } from '../components/core/RescanModal';

// ─── Module mocks ─────────────────────────────────────────────────────────────

jest.mock('react-i18next', () => ({
  useTranslation: () => ({ t: (k: string) => k, i18n: { language: 'en' } }),
}));

jest.mock('../api/commitApi', () => ({
  runRescan: jest.fn(),
}));
import { runRescan } from '../api/commitApi';

jest.mock('@fluentui/react-components', () => {
  const React = require('react');
  const el = (tag: string) =>
    ({ children, ...props }: Record<string, unknown>) =>
      React.createElement(tag, props, children);

  // Dialog always renders children (so trigger is visible); Surface only renders when open
  const DialogContext = React.createContext({ open: false });
  const Dialog = ({ children, open = false }: { children: unknown; open?: boolean }) =>
    React.createElement(DialogContext.Provider, { value: { open } }, children);
  const DialogSurface = ({ children }: { children: unknown }) => {
    const { open } = React.useContext(DialogContext);
    return open ? React.createElement('div', { 'data-dialog': 'true' }, children) : null;
  };

  return {
    makeStyles:     () => () => ({}),
    tokens:         new Proxy({}, { get: () => '' }),
    Dialog,
    DialogTrigger:  ({ children }: { children: unknown }) => children,
    DialogSurface,
    DialogTitle:    el('div'),
    DialogBody:     el('div'),
    DialogContent:  el('div'),
    DialogActions:  el('div'),
    Button:         ({ onClick, children, disabled, ...props }: Record<string, unknown>) =>
                      React.createElement('button', { onClick, disabled, ...props }, children),
    Checkbox:       ({ label, checked, onChange }: { label?: string; checked?: boolean; onChange?: () => void }) =>
                      React.createElement('label', {},
                        React.createElement('input', { type: 'checkbox', checked, onChange, readOnly: !onChange }),
                        label
                      ),
    Text:           ({ children, ...props }: Record<string, unknown>) =>
                      React.createElement('span', props, children),
    Spinner:        () => React.createElement('span', {}, '...'),
  };
});

// ─── Helpers ──────────────────────────────────────────────────────────────────

function renderModal(props: Partial<React.ComponentProps<typeof RescanModal>> = {}) {
  return render(
    <RescanModal userId="test-user-001" {...props} />
  );
}

function openModal() {
  fireEvent.click(screen.getByText('🔄 Rescan'));
}

// ─── Trigger button ───────────────────────────────────────────────────────────

describe('RescanModal — trigger button', () => {
  it('renders the Rescan button', () => {
    renderModal();
    expect(screen.getByText('🔄 Rescan')).toBeInTheDocument();
  });

  it('dialog is not visible before clicking Rescan', () => {
    renderModal();
    expect(screen.queryByText('Rescan for Tasks')).not.toBeInTheDocument();
  });
});

// ─── Open dialog ──────────────────────────────────────────────────────────────

describe('RescanModal — opening the dialog', () => {
  it('clicking Rescan opens the dialog', () => {
    renderModal();
    openModal();
    expect(screen.getByText('Rescan for Tasks')).toBeInTheDocument();
  });

  it('dialog shows all 6 source checkboxes checked by default', () => {
    renderModal();
    openModal();
    const checkboxes = screen.getAllByRole('checkbox');
    expect(checkboxes).toHaveLength(6);
    checkboxes.forEach(cb => expect(cb).toBeChecked());
  });

  it('dialog shows the days slider with default value 7', () => {
    renderModal();
    openModal();
    const slider = screen.getByRole('slider');
    expect(slider).toHaveValue('7');
  });

  it('all 6 source labels are shown', () => {
    renderModal();
    openModal();
    expect(screen.getByText(/Meetings & Transcripts/)).toBeInTheDocument();
    expect(screen.getByText(/Teams Chat/)).toBeInTheDocument();
    expect(screen.getByText(/Email/)).toBeInTheDocument();
    expect(screen.getByText(/Azure DevOps/)).toBeInTheDocument();
    expect(screen.getByText(/OneDrive \/ SharePoint/)).toBeInTheDocument();
    expect(screen.getByText(/Planner/)).toBeInTheDocument();
  });
});

// ─── Close dialog ─────────────────────────────────────────────────────────────

describe('RescanModal — closing the dialog', () => {
  it('Cancel button closes the dialog', () => {
    renderModal();
    openModal();
    fireEvent.click(screen.getByText('Cancel'));
    expect(screen.queryByText('Rescan for Tasks')).not.toBeInTheDocument();
  });
});

// ─── Days slider ─────────────────────────────────────────────────────────────

describe('RescanModal — days slider', () => {
  it('changing the slider updates the displayed day count', () => {
    renderModal();
    openModal();
    const slider = screen.getByRole('slider');
    fireEvent.change(slider, { target: { value: '14' } });
    expect(screen.getByText('14 days')).toBeInTheDocument();
  });

  it('slider value of 1 shows singular "day"', () => {
    renderModal();
    openModal();
    const slider = screen.getByRole('slider');
    fireEvent.change(slider, { target: { value: '1' } });
    expect(screen.getByText('1 day')).toBeInTheDocument();
  });
});

// ─── Source checkboxes ────────────────────────────────────────────────────────

describe('RescanModal — source checkboxes', () => {
  it('unchecking a source removes it from selection', () => {
    renderModal();
    openModal();
    const checkboxes = screen.getAllByRole('checkbox');
    fireEvent.click(checkboxes[0]); // uncheck first (transcript)
    expect(checkboxes[0]).not.toBeChecked();
  });

  it('Rescan button is disabled when all sources are unchecked', () => {
    renderModal();
    openModal();
    const checkboxes = screen.getAllByRole('checkbox');
    checkboxes.forEach(cb => fireEvent.click(cb)); // uncheck all
    const rescanBtn = screen.getByText('Rescan');
    expect(rescanBtn).toBeDisabled();
  });

  it('Rescan button is enabled when at least one source is checked', () => {
    renderModal();
    openModal();
    // All checked by default — button should be enabled
    const rescanBtn = screen.getByText('Rescan');
    expect(rescanBtn).not.toBeDisabled();
  });
});

// ─── Rescan API call ──────────────────────────────────────────────────────────

describe('RescanModal — triggering rescan', () => {
  it('clicking Rescan calls runRescan with userId, days, and all sources', async () => {
    (runRescan as jest.Mock).mockResolvedValue({ newCount: 3, updatedCount: 1 });
    renderModal({ userId: 'user-xyz' });
    openModal();
    await act(async () => {
      fireEvent.click(screen.getByText('Rescan'));
    });
    expect(runRescan).toHaveBeenCalledWith(
      'user-xyz',
      7,
      expect.arrayContaining(['transcript', 'chat', 'email', 'ado', 'drive', 'planner']),
      undefined
    );
  });

  it('passes authToken to runRescan when provided', async () => {
    (runRescan as jest.Mock).mockResolvedValue({ newCount: 0, updatedCount: 0 });
    renderModal({ userId: 'user-xyz', authToken: 'bearer-token-abc' });
    openModal();
    await act(async () => {
      fireEvent.click(screen.getByText('Rescan'));
    });
    expect(runRescan).toHaveBeenCalledWith('user-xyz', 7, expect.any(Array), 'bearer-token-abc');
  });

  it('calls runRescan with selected days after slider change', async () => {
    (runRescan as jest.Mock).mockResolvedValue({ newCount: 0, updatedCount: 0 });
    renderModal({ userId: 'user-abc' });
    openModal();
    fireEvent.change(screen.getByRole('slider'), { target: { value: '14' } });
    await act(async () => {
      fireEvent.click(screen.getByText('Rescan'));
    });
    expect(runRescan).toHaveBeenCalledWith('user-abc', 14, expect.any(Array), undefined);
  });

  it('calls runRescan with only checked sources', async () => {
    (runRescan as jest.Mock).mockResolvedValue({ newCount: 0, updatedCount: 0 });
    renderModal({ userId: 'user-abc' });
    openModal();
    // Uncheck all except the first (transcript)
    const checkboxes = screen.getAllByRole('checkbox');
    for (let i = 1; i < checkboxes.length; i++) fireEvent.click(checkboxes[i]);
    await act(async () => {
      fireEvent.click(screen.getByText('Rescan'));
    });
    const calls = (runRescan as jest.Mock).mock.calls;
    const calledSources = calls[calls.length - 1][2] as string[];
    expect(calledSources).toEqual(['transcript']);
  });

  it('calls onRescanComplete callback after successful rescan', async () => {
    (runRescan as jest.Mock).mockResolvedValue({ newCount: 2, updatedCount: 0 });
    const onDone = jest.fn();
    renderModal({ userId: 'user-xyz', onRescanComplete: onDone });
    openModal();
    await act(async () => {
      fireEvent.click(screen.getByText('Rescan'));
    });
    await waitFor(() => expect(onDone).toHaveBeenCalledTimes(1));
  });
});

// ─── Result messages ──────────────────────────────────────────────────────────

describe('RescanModal — result messages', () => {
  it('shows success message after successful rescan', async () => {
    (runRescan as jest.Mock).mockResolvedValue({ newCount: 3, updatedCount: 1 });
    renderModal();
    openModal();
    await act(async () => {
      fireEvent.click(screen.getByText('Rescan'));
    });
    await waitFor(() =>
      expect(screen.getByText('Extraction complete — your task list has been refreshed.')).toBeInTheDocument()
    );
  });

  it('shows error message when rescan throws', async () => {
    (runRescan as jest.Mock).mockRejectedValue(new Error('Network error'));
    renderModal();
    openModal();
    await act(async () => {
      fireEvent.click(screen.getByText('Rescan'));
    });
    await waitFor(() =>
      expect(screen.getByText(/Rescan failed/)).toBeInTheDocument()
    );
  });

  it('clears result message when dialog is reopened', async () => {
    (runRescan as jest.Mock).mockResolvedValue({ newCount: 0, updatedCount: 0 });
    renderModal();
    openModal();
    await act(async () => { fireEvent.click(screen.getByText('Rescan')); });
    await waitFor(() => screen.getByText('Extraction complete — your task list has been refreshed.'));
    fireEvent.click(screen.getByText('Cancel'));
    // Reopen
    openModal();
    expect(screen.queryByText('Extraction complete — your task list has been refreshed.')).not.toBeInTheDocument();
  });
});
