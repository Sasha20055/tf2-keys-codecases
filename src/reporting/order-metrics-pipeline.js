const successfulStatuses = ['paid', 'fulfilled'];

export const metricDefinitions = Object.freeze([
  { id: 'cardRub', paymentMethod: 'card', currency: 'RUB' },
  { id: 'walletRub', paymentMethod: 'wallet', currency: 'RUB' },
  { id: 'cryptoUsd', paymentMethod: 'crypto', currency: 'USD' }
]);

const matchingOrder = ({ paymentMethod, currency }, statuses) => ({
  $and: [
    { $eq: ['$paymentMethod', paymentMethod] },
    { $eq: ['$currency', currency] },
    { $in: ['$status', statuses] }
  ]
});

const amount = (condition) => ({ $sum: { $cond: [condition, '$amount', 0] } });
const count = (condition) => ({ $sum: { $cond: [condition, 1, 0] } });

export function buildOrderMetricsPipeline({ startDate, endDate, definitions = metricDefinitions }) {
  const start = new Date(startDate);
  const end = new Date(endDate);
  if (Number.isNaN(start.valueOf()) || Number.isNaN(end.valueOf()) || start > end) {
    throw new TypeError('provide a valid date range where startDate is not after endDate');
  }

  const metrics = {};
  for (const definition of definitions) {
    const paid = matchingOrder(definition, successfulStatuses);
    const refunded = matchingOrder(definition, ['refunded']);
    metrics[`${definition.id}PaidAmount`] = amount(paid);
    metrics[`${definition.id}PaidCount`] = count(paid);
    metrics[`${definition.id}RefundedAmount`] = amount(refunded);
    metrics[`${definition.id}RefundedCount`] = count(refunded);
  }

  return [
    { $match: { createdAt: { $gte: start, $lte: end } } },
    { $group: { _id: null, ...metrics } }
  ];
}

