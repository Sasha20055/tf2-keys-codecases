import test from 'node:test';
import assert from 'node:assert/strict';
import { buildOrderMetricsPipeline } from '../src/reporting/order-metrics-pipeline.js';

test('report pipeline creates paid and refunded metrics for every definition', () => {
  const pipeline = buildOrderMetricsPipeline({ startDate: '2026-01-01', endDate: '2026-01-31' });
  const group = pipeline[1].$group;
  assert.equal(pipeline.length, 2);
  assert.ok(group.cardRubPaidAmount);
  assert.ok(group.cardRubRefundedCount);
  assert.ok(group.cryptoUsdPaidCount);
});

test('report pipeline rejects an inverted date range', () => {
  assert.throws(() => buildOrderMetricsPipeline({ startDate: '2026-02-01', endDate: '2026-01-01' }));
});

