import Report from '../models/Report.js';
import Comment from '../models/Comment.js';
import StatusHistory from '../models/StatusHistory.js';
import { asyncHandler } from '../utils/asyncHandler.js';
import { nextReferenceId, isValidObjectId } from '../utils/referenceId.js';
import { normalizeUploadedFiles } from '../config/uploads.js';
import { calculateSeverity, scoreReport } from '../services/severity.js';

async function refreshOpenReportScores() {
  const openReports = await Report.find({ status: { $nin: ['resolved', 'rejected'] } });
  for (const report of openReports) {
    const severity = calculateSeverity(report, report.severity?.nearbyReportsCount || 0);
    await Report.updateOne({ _id: report._id }, { $set: { severity } }, { timestamps: false });
  }
}

const populate = (query) => query.populate('reportedBy', 'name email');
const parsePoint = (body) => {
  const lat = Number(body.latitude);
  const lng = Number(body.longitude);
  if (!Number.isFinite(lat) || !Number.isFinite(lng) || lat < -90 || lat > 90 || lng < -180 || lng > 180) throw Object.assign(new Error('A valid map location is required.'), { status: 400 });
  return { type: 'Point', coordinates: [lng, lat], address: String(body.address || '').trim(), locality: String(body.locality || 'Bengaluru').trim(), ward: 'Pending assignment' };
};

export const listReports = asyncHandler(async (req, res) => {
  const { q, category, status, severity, page = 1, limit = 100 } = req.query;
  if (severity) await refreshOpenReportScores();
  const filter = {};
  if (category) filter.category = category;
  if (status) filter.status = status;
  if (severity) filter['severity.level'] = severity;
  if (q) filter.$or = [ { title: new RegExp(escapeRegex(q), 'i') }, { description: new RegExp(escapeRegex(q), 'i') }, { 'location.address': new RegExp(escapeRegex(q), 'i') }, { 'location.locality': new RegExp(escapeRegex(q), 'i') }, { referenceId: new RegExp(escapeRegex(q), 'i') } ];
  const pageNum = Math.max(1, Number(page) || 1);
  const pageSize = Math.min(100, Math.max(1, Number(limit) || 100));
  const [reports, total] = await Promise.all([
    populate(Report.find(filter).sort({ createdAt: -1 }).skip((pageNum - 1) * pageSize).limit(pageSize)),
    Report.countDocuments(filter)
  ]);
  reports.forEach((report) => { report.severity = calculateSeverity(report, report.severity?.nearbyReportsCount || 0); });
  res.json({ reports, pagination: { page: pageNum, limit: pageSize, total, pages: Math.ceil(total / pageSize) } });
});
function escapeRegex(s) { return String(s).replace(/[.*+?^${}()|[\]\\]/g, '\\$&'); }

export const getReport = asyncHandler(async (req, res) => {
  const report = await populate(Report.findOne({ $or: [{ _id: isValidObjectId(req.params.id) ? req.params.id : null }, { referenceId: req.params.id }] }));
  if (!report) return res.status(404).json({ message: 'Issue not found.' });
  report.severity = calculateSeverity(report, report.severity?.nearbyReportsCount || 0);
  const [comments, history] = await Promise.all([
    Comment.find({ report: report._id }).sort({ createdAt: 1 }).populate('user', 'name'),
    StatusHistory.find({ report: report._id }).sort({ createdAt: 1 }).populate('updatedBy', 'name')
  ]);
  res.json({ report, comments, history });
});

export const createReport = asyncHandler(async (req, res) => {
  const { title, description, category, impactLevel, peopleAffected, criticalLocation } = req.body;
  if (!title?.trim() || title.trim().length < 6) return res.status(400).json({ message: 'Title must be at least 6 characters.' });
  if (!description?.trim() || description.trim().length < 20) return res.status(400).json({ message: 'Description must be at least 20 characters.' });
  if (!['footpath', 'blocked', 'crossing', 'pothole', 'accessibility'].includes(category)) return res.status(400).json({ message: 'Choose a valid issue category.' });
  const location = parsePoint(req.body);
  if (!location.address) return res.status(400).json({ message: 'Street or landmark is required.' });
  const photos = await normalizeUploadedFiles(req.files || []);
  if (!photos.length) return res.status(400).json({ message: 'Upload at least one issue photo.' });
  const report = await Report.create({
    referenceId: await nextReferenceId(Report), title: title.trim(), description: description.trim(), category,
    location, photos, reportedBy: req.user?._id || null, reporterName: req.user?.name || String(req.body.reporterName || 'Community member').trim(),
    impactLevel: ['low', 'moderate', 'high', 'critical'].includes(impactLevel) ? impactLevel : 'moderate',
    peopleAffected: Math.max(1, Math.min(1000000, Number(peopleAffected) || 10)),
    criticalLocation: ['none', 'residential', 'market', 'school', 'transit', 'hospital', 'emergency'].includes(criticalLocation) ? criticalLocation : 'none'
  });
  await scoreReport(report, Report);
  await report.save();
  await StatusHistory.create({ report: report._id, previousStatus: 'new', newStatus: 'reported', updatedBy: req.user?._id || null, remarks: 'Issue submitted.' });
  res.status(201).json({ report });
});

export const myReports = asyncHandler(async (req, res) => {
  const reports = await Report.find({ reportedBy: req.user._id }).sort({ createdAt: -1 });
  res.json({ reports });
});

export const updateReport = asyncHandler(async (req, res) => {
  const report = await Report.findById(req.params.id);
  if (!report) return res.status(404).json({ message: 'Issue not found.' });
  if (req.user.role !== 'admin' && String(report.reportedBy) !== String(req.user._id)) return res.status(403).json({ message: 'You can only edit your own reports.' });
  const allowed = ['title', 'description'];
  for (const key of allowed) if (typeof req.body[key] === 'string') report[key] = req.body[key].trim();
  await report.save();
  res.json({ report });
});

export const deleteReport = asyncHandler(async (req, res) => {
  const report = await Report.findById(req.params.id);
  if (!report) return res.status(404).json({ message: 'Issue not found.' });
  if (req.user.role !== 'admin' && String(report.reportedBy) !== String(req.user._id)) return res.status(403).json({ message: 'You can only delete your own reports.' });
  await Promise.all([report.deleteOne(), Comment.deleteMany({ report: report._id }), StatusHistory.deleteMany({ report: report._id })]);
  res.json({ message: 'Report deleted.' });
});

export const addComment = asyncHandler(async (req, res) => {
  const report = await Report.findById(req.params.id);
  if (!report) return res.status(404).json({ message: 'Issue not found.' });
  const message = String(req.body.message || '').trim();
  if (message.length < 2) return res.status(400).json({ message: 'Comment is too short.' });
  const comment = await Comment.create({ report: report._id, user: req.user?._id || null, authorName: req.user?.name || 'Community member', message });
  res.status(201).json({ comment });
});

export const updateStatus = asyncHandler(async (req, res) => {
  const { status, remarks = '' } = req.body;
  if (!['reported', 'in_progress', 'resolved', 'rejected'].includes(status)) return res.status(400).json({ message: 'Invalid status.' });
  const report = await Report.findById(req.params.id);
  if (!report) return res.status(404).json({ message: 'Issue not found.' });
  const previousStatus = report.status;
  report.status = status;
  report.resolvedAt = status === 'resolved' ? new Date() : null;
  await scoreReport(report, Report);
  await report.save();
  await StatusHistory.create({ report: report._id, previousStatus, newStatus: status, updatedBy: req.user._id, remarks: String(remarks).slice(0, 500) });
  res.json({ report });
});

export const dashboardStats = asyncHandler(async (_req, res) => {
  await refreshOpenReportScores();
  const [total, grouped, recent] = await Promise.all([
    Report.countDocuments(),
    Report.aggregate([{ $group: { _id: '$status', count: { $sum: 1 } } }]),
    Report.find().sort({ createdAt: -1 }).limit(5).select('referenceId title status severity category location createdAt')
  ]);
  const statusCounts = Object.fromEntries(grouped.map((g) => [g._id, g.count]));
  const highSeverity = await Report.countDocuments({ 'severity.score': { $gte: 50 }, status: { $nin: ['resolved', 'rejected'] } });
  res.json({ stats: { total, reported: statusCounts.reported || 0, inProgress: statusCounts.in_progress || 0, resolved: statusCounts.resolved || 0, highSeverity }, recent });
});

export const publicStats = asyncHandler(async (_req, res) => {
  await refreshOpenReportScores();
  const [total, grouped] = await Promise.all([
    Report.countDocuments(),
    Report.aggregate([{ $group: { _id: '$status', count: { $sum: 1 } } }])
  ]);
  const statusCounts = Object.fromEntries(grouped.map((g) => [g._id, g.count]));
  const highSeverity = await Report.countDocuments({ 'severity.score': { $gte: 50 }, status: { $nin: ['resolved', 'rejected'] } });
  const localities = await Report.distinct('location.locality');
  res.json({ stats: { total, reported: statusCounts.reported || 0, inProgress: statusCounts.in_progress || 0, resolved: statusCounts.resolved || 0, highSeverity, localities: localities.length } });
});
