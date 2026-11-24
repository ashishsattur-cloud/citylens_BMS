export const CENTER = [12.9716, 77.5946];
export const CATEGORIES = {
  footpath: { label: 'Damaged footpath', short: 'Footpath', color: '#bd7b28' },
  blocked: { label: 'Blocked walkway', short: 'Blocked', color: '#c45b45' },
  crossing: { label: 'Unsafe crossing', short: 'Crossing', color: '#4779ad' },
  pothole: { label: 'Pothole / open drain', short: 'Pothole', color: '#525b55' },
  accessibility: { label: 'Accessibility barrier', short: 'Access', color: '#3f8061' }
};
export const STATUSES = { reported: 'Reported', in_progress: 'In progress', resolved: 'Resolved', rejected: 'Rejected' };
export const SEVERITIES = { low: 'Low', moderate: 'Moderate', high: 'High', critical: 'Critical' };
export function normalizeReport(report) {
  const coords = report.location?.coordinates || [77.5946, 12.9716];
  return { ...report, id: report.referenceId || report._id, lat: coords[1], lng: coords[0], address: report.location?.address || '', locality: report.location?.locality || 'Bengaluru', ward: report.location?.ward || 'Pending assignment', reporter: report.reporterName || report.reportedBy?.name || 'Community member', photos: (report.photos || []).map((p) => typeof p === 'string' ? p : p.url), reportedAt: report.createdAt, updatedAt: report.updatedAt };
}
export function formatDate(value) {
  if (!value) return '—';
  return new Date(value).toLocaleDateString('en-IN', { day: 'numeric', month: 'short', year: 'numeric' });
}
export function severityTone(level) { return `severity-${level || 'low'}`; }
export function statusTone(status) { return `status-${status || 'reported'}`; }
