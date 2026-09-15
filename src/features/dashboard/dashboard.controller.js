import prisma from '../../config/db.js';
import { getCache, setCache } from '../../lib/cache.js';
import { getLibraryId } from '../../lib/errors.js';

export async function dashboardSummary(req, res, next) {
  try {
    const cached = getCache(`dashboard_${getLibraryId(req)}`);
    if (cached !== null) return res.json(cached);

    const today = new Date();
    today.setHours(0, 0, 0, 0);

    const [occupancy, todayAttendance, overdueCount] = await Promise.all([
      prisma.attendanceEvent.count({
        where: { libraryId: getLibraryId(req), type: 'ENTRY', timestamp: { gte: today } },
      }),
      prisma.attendanceEvent.count({
        where: { libraryId: getLibraryId(req), timestamp: { gte: today } },
      }),
      prisma.feeRecord.count({
        where: { libraryId: getLibraryId(req), status: { in: ['PENDING', 'OVERDUE'] }, dueDate: { lt: today } },
      }),
    ]);

    const result = { occupancy, todayAttendance, overdueCount };
    setCache(`dashboard_${getLibraryId(req)}`, result, 10_000);
    res.json(result);
  } catch (e) { next(e); }
}
