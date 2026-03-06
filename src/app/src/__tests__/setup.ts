import '@testing-library/jest-dom';
import { act } from '@testing-library/react';

// Default global fetch mock — individual tests override per scenario
global.fetch = jest.fn(() =>
  Promise.resolve({
    ok: true,
    json: () => Promise.resolve({}),
  } as Response)
);

// jsdom doesn't implement ResizeObserver — stub it so Fluent components don't crash
global.ResizeObserver = jest.fn().mockImplementation(() => ({
  observe:   jest.fn(),
  unobserve: jest.fn(),
  disconnect: jest.fn(),
}));

// Reset fetch mock between tests
beforeEach(() => {
  (global.fetch as jest.Mock).mockClear();
});

// Flush any pending React state updates (effects, promises) after each test.
// Prevents act() warnings from async fetch callbacks that settle after assertion.
afterEach(async () => {
  await act(async () => {});
});
