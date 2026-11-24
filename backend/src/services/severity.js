const WEIGHTS = { impact: 30, peopleAffected: 20, nearbyReports: 15, duration: 15, criticalLocation: 20 };
const impactValues = { low: 1, moderate: 2, high: 4, critical: 5 };
const locationValues = { none: 0, residential: 1, market: 2, school: 4, transit: 4, hospital: 5, emergency: 5 };

function peopleBand(n = 1) {
  if (n <= 10) return 1;
  if (n <= 50) return 2;
  if (n <= 200) return 3;
  if (n <= 1000) return 4;
  return 5;
}
function nearbyBand(n = 0) {
  if (n === 0) return 1;
  if (n <= 2) return 2;
  if (n <= 5) return 3;
  if (n <= 10) return 4;
  return 5;
}
function durationBand(days = 0) {
  if (days <= 1) return 1;
  if (days <= 3) return 2;
  if (days <= 7) return 3;
  if (days <= 14) return 4;
  return 5;
}

export function calculateSeverity(report, nearbyCount = 0, now = new Date()) {
  const ageDays = Math.max(0, Math.floor((now - new Date(report.createdAt || now)) / 86400000));
  const factors = {
    impact: impactValues[report.impactLevel] ?? 2,
    peopleAffected: peopleBand(Number(report.peopleAffected || 1)),
    nearbyReports: nearbyBand(nearbyCount),
    duration: ['resolved', 'rejected'].includes(report.status) ? 1 : durationBand(ageDays),
    criticalLocation: locationValues[report.criticalLocation] ?? 0
  };
  const explanation = [
    { factor: 'Reported danger / impact', contribution: factors.impact * WEIGHTS.impact / 5, detail: `${report.impactLevel || 'moderate'} impact selected by the reporter (${WEIGHTS.impact}% weight).` },
    { factor: 'People affected', contribution: factors.peopleAffected * WEIGHTS.peopleAffected / 5, detail: `Estimated ${Number(report.peopleAffected || 1).toLocaleString('en-IN')} people affected (${WEIGHTS.peopleAffected}% weight).` },
    { factor: 'Nearby reports', contribution: factors.nearbyReports * WEIGHTS.nearbyReports / 5, detail: `${nearbyCount} other report(s) within 500 metres in the last 30 days (${WEIGHTS.nearbyReports}% weight).` },
    { factor: 'Time unresolved', contribution: factors.duration * WEIGHTS.duration / 5, detail: ['resolved', 'rejected'].includes(report.status) ? 'Closed report; duration factor is reduced.' : `Open for ${ageDays} day(s) (${WEIGHTS.duration}% weight).` },
    { factor: 'Critical location', contribution: factors.criticalLocation * WEIGHTS.criticalLocation / 5, detail: `${report.criticalLocation || 'none'} location context (${WEIGHTS.criticalLocation}% weight).` }
  ];
  const score = Math.round(explanation.reduce((sum, item) => sum + item.contribution, 0));
  const level = score >= 75 ? 'critical' : score >= 50 ? 'high' : score >= 25 ? 'moderate' : 'low';
  return { score, level, factors, nearbyReportsCount: nearbyCount, explanation, calculatedAt: now };
}

export async function scoreReport(report, ReportModel) {
  const coords = report.location?.coordinates;
  let nearbyCount = 0;
  if (Array.isArray(coords) && coords.length === 2 && coords.every(Number.isFinite)) {
    nearbyCount = await ReportModel.countDocuments({
      _id: { $ne: report._id },
      createdAt: { $gte: new Date(Date.now() - 30 * 86400000) },
      location: { $geoWithin: { $centerSphere: [coords, 500 / 6378100] } }
    });
  }
  report.severity = calculateSeverity(report, nearbyCount);
  return report.severity;
}
