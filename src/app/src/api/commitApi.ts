/**
 * Commit-AT — API client functions
 * Centralised fetch helpers for all API calls.
 */

import { API_BASE } from '../config/api.config';
import type { ApiResponse } from '../types/api';

// ─── Feedback ─────────────────────────────────────────────────────────────────

export type FeedbackType = 'Confirm' | 'FalsePositive' | 'WrongOwner' | 'Duplicate';

/**
 * Record thumbs-up / thumbs-down feedback for an extracted commitment.
 * POST /api/v1/commitments/{id}/feedback?userId=X
 */
export async function recordFeedback(
  userId: string,
  commitmentId: string,
  type: FeedbackType,
  authToken?: string,
  comment?: string
): Promise<void> {
  const headers: Record<string, string> = { 'Content-Type': 'application/json' };
  if (authToken) headers['Authorization'] = `Bearer ${authToken}`;
  await fetch(
    `${API_BASE}/api/v1/commitments/${encodeURIComponent(commitmentId)}/feedback?userId=${encodeURIComponent(userId)}`,
    {
      method: 'POST',
      headers,
      body: JSON.stringify({ commitmentId, type, comment: comment ?? null }),
    }
  );
}

// ─── Rescan / Preview Extraction ──────────────────────────────────────────────

export interface RescanResult {
  extracted: number;
  sources:   string[];
}

export async function runRescan(
  userId: string,
  days: number,
  sources: string[],
  authToken?: string
): Promise<RescanResult> {
  const headers: Record<string, string> = { 'Content-Type': 'application/json' };
  if (authToken) headers['Authorization'] = `Bearer ${authToken}`;
  const res = await fetch(
    `${API_BASE}/api/v1/extract?userId=${encodeURIComponent(userId)}`,
    {
      method: 'POST',
      headers,
      body: JSON.stringify({ days, sources }),
    }
  );
  if (!res.ok) throw new Error(`Rescan failed: ${res.status}`);
  const body = (await res.json()) as ApiResponse<RescanResult>;
  return body.data ?? { extracted: 0, sources: [] };
}

// ─── Admin ─────────────────────────────────────────────────────────────────────

export interface AdminMetrics {
  totalCommitments:  number;
  totalFeedback:     number;
  avgConfidence:     number;
  falsePositiveRate: number;
}

export async function getAdminMetrics(authToken?: string): Promise<AdminMetrics> {
  const headers: Record<string, string> = {};
  if (authToken) headers['Authorization'] = `Bearer ${authToken}`;
  const res = await fetch(`${API_BASE}/api/v1/admin/metrics`, { headers });
  if (!res.ok) throw new Error(`Admin metrics failed: ${res.status}`);
  const body = (await res.json()) as ApiResponse<AdminMetrics>;
  return body.data ?? { totalCommitments: 0, totalFeedback: 0, avgConfidence: 0, falsePositiveRate: 0 };
}

export async function getAdminInsights(authToken?: string): Promise<{ insights: string }> {
  const headers: Record<string, string> = {};
  if (authToken) headers['Authorization'] = `Bearer ${authToken}`;
  const res = await fetch(`${API_BASE}/api/v1/admin/insights`, { headers });
  if (!res.ok) throw new Error(`Admin insights failed: ${res.status}`);
  const body = (await res.json()) as { insights: string };
  return body;
}

// ─── Admin — Feedback list ──────────────────────────────────────────────────

export interface FeedbackItem {
  type:       string;
  sourceType: string;
  recordedAt: string;
  idRef:      string;
  confidence: number;
  comment?:   string;
}

export interface FeedbackBreakdown {
  byType:   Record<string, number>;
  bySource: Record<string, number>;
}

export interface FeedbackListResult {
  items:     FeedbackItem[];
  total:     number;
  breakdown: FeedbackBreakdown;
}

export async function getAdminFeedback(
  type?: string,
  source?: string,
  limit = 200,
  authToken?: string
): Promise<FeedbackListResult> {
  const headers: Record<string, string> = {};
  if (authToken) headers['Authorization'] = `Bearer ${authToken}`;
  const params = new URLSearchParams({ limit: String(limit) });
  if (type)   params.set('type',   type);
  if (source) params.set('source', source);
  const res = await fetch(`${API_BASE}/api/v1/admin/feedback?${params}`, { headers });
  if (!res.ok) throw new Error(`Admin feedback failed: ${res.status}`);
  const body = (await res.json()) as ApiResponse<FeedbackListResult>;
  return body.data ?? { items: [], total: 0, breakdown: { byType: {}, bySource: {} } };
}

// ─── Admin — Signal profiles ────────────────────────────────────────────────

export interface SignalProfileUser {
  userRef:              string;
  totalFeedback:        number;
  fpRate:               number;
  suppressedCount:      number;
  confidenceAdjustment: number;
  lastFeedbackAt:       string;
}

export interface SignalProfilesResult {
  users:     SignalProfileUser[];
  aggregate: {
    userCount:               number;
    avgFpRate:               number;
    avgConfidenceAdjustment: number;
    totalSuppressed:         number;
  };
}

export async function getAdminSignalProfiles(authToken?: string): Promise<SignalProfilesResult> {
  const headers: Record<string, string> = {};
  if (authToken) headers['Authorization'] = `Bearer ${authToken}`;
  const res = await fetch(`${API_BASE}/api/v1/admin/signal-profiles`, { headers });
  if (!res.ok) throw new Error(`Admin signal profiles failed: ${res.status}`);
  const body = (await res.json()) as ApiResponse<SignalProfilesResult>;
  return body.data ?? { users: [], aggregate: { userCount: 0, avgFpRate: 0, avgConfidenceAdjustment: 0, totalSuppressed: 0 } };
}
