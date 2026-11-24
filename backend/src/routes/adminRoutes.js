import { Router } from 'express';
import { dashboardStats, listReports } from '../controllers/reportController.js';
import { adminOnly, protect } from '../middleware/auth.js';
const router = Router();
router.use(protect, adminOnly);
router.get('/dashboard', dashboardStats);
router.get('/reports', listReports);
export default router;
