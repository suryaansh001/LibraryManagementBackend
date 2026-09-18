import prisma from '../../config/db.js';
import { getCache, setCache } from '../../lib/cache.js';
import { NotFoundError, getLibraryId, ConflictError } from '../../lib/errors.js';
import { scanSchema, manualSchema } from './attendance.schema.js';

function isToday(dt) {
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  const tomorrow = new Date(today);
  tomorrow.setDate(tomorrow.getDate() + 1);
  return dt >= today && dt < tomorrow;
}

export async function scanAttendance(req, res, next) {
  try {
    const { qrToken } = req.body;

    const result = await prisma.$transaction(async (tx) => {
      const student = await tx.student.findFirst({
        where: { qrToken, libraryId: getLibraryId(req) },
      });
      if (!student) throw new NotFoundError('Student not found');

      const lastEvent = await tx.attendanceEvent.findFirst({
        where: { studentId: student.id },
        orderBy: { timestamp: 'desc' },
      });

      let newType;
      if (lastEvent && lastEvent.type === 'ENTRY' && isToday(lastEvent.timestamp)) {
        newType = 'EXIT';
      } else {
        newType = 'ENTRY';
      }

      const event = await tx.attendanceEvent.create({
        data: {
          studentId: student.id,
          libraryId: getLibraryId(req),
          type: newType,
          method: 'QR',
        },
      });

      return { event, student, isInside: newType === 'ENTRY' };
    });

    const greeting = result.isInside ? `Welcome, ${result.student.name}` : `Bye Bye, ${result.student.name}`;
    res.json({ event: result.event, type: result.event.type, isInside: result.isInside, greeting, student: { id: result.student.id, name: result.student.name, qrToken: result.student.qrToken } });
  } catch (e) { next(e); }
}

export async function manualAttendance(req, res, next) {
  try {
    const { studentId, type } = req.body;

    const student = await prisma.student.findFirst({
      where: { id: studentId, libraryId: getLibraryId(req) },
    });
    if (!student) throw new NotFoundError('Student not found');

    const result = await prisma.$transaction(async (tx) => {
      const lastEvent = await tx.attendanceEvent.findFirst({
        where: { studentId: student.id },
        orderBy: { timestamp: 'desc' },
      });

      if (type === 'ENTRY' && lastEvent && lastEvent.type === 'ENTRY' && isToday(lastEvent.timestamp)) {
        throw new ConflictError('Already inside — scan exit first.');
      }

      if (type === 'EXIT' && (!lastEvent || lastEvent.type !== 'ENTRY')) {
        throw new ConflictError('No active entry found.');
      }

      const event = await tx.attendanceEvent.create({
        data: {
          studentId: student.id,
          libraryId: getLibraryId(req),
          type,
          method: 'MANUAL',
          recordedById: req.user.userId,
        },
      });

      return { event, student, isInside: type === 'ENTRY' };
    });

    const greeting = result.isInside ? `Welcome, ${result.student.name}` : `Bye Bye, ${result.student.name}`;
    res.json({ event: result.event, type: result.event.type, isInside: result.isInside, greeting, student: { id: result.student.id, name: result.student.name } });
  } catch (e) { next(e); }
}

export async function listAttendance(req, res, next) {
  try {
    const { date, studentId, page, limit } = req.query;
    const pageNum = parseInt(page || '1', 10);
    const limitNum = Math.min(parseInt(limit || '20', 10), 100);
    const skip = (pageNum - 1) * limitNum;

    const where = { libraryId: getLibraryId(req) };
    if (date) where.timestamp = { gte: new Date(date), lt: new Date(new Date(date).getTime() + 86400000) };
    if (studentId) where.studentId = studentId;

    const [events, total] = await Promise.all([
      prisma.attendanceEvent.findMany({
        where, skip, take: limitNum, orderBy: { timestamp: 'desc' },
        include: { student: { select: { name: true, phone: true, qrToken: true } }, recordedBy: { select: { name: true } } },
      }),
      prisma.attendanceEvent.count({ where }),
    ]);

    res.json({ events, pagination: { total, page: pageNum, limit: limitNum, pages: Math.ceil(total / limitNum) } });
  } catch (e) { next(e); }
}

export async function todayAttendance(req, res, next) {
  try {
    const today = new Date();
    today.setHours(0, 0, 0, 0);

    const events = await prisma.attendanceEvent.findMany({
      where: { libraryId: getLibraryId(req), timestamp: { gte: today } },
      include: { student: { select: { name: true, phone: true, qrToken: true } }, recordedBy: { select: { name: true } } },
      orderBy: { timestamp: 'desc' },
    });

    res.json({ events, date: today.toISOString().split('T')[0] });
  } catch (e) { next(e); }
}

export async function occupancy(req, res, next) {
  try {
    const cached = getCache(`occupancy_${getLibraryId(req)}`);
    if (cached !== null) return res.json({ occupancy: cached });

    const today = new Date();
    today.setHours(0, 0, 0, 0);

    const count = await prisma.attendanceEvent.count({
      where: { libraryId: getLibraryId(req), type: 'ENTRY', timestamp: { gte: today } },
    });

    setCache(`occupancy_${getLibraryId(req)}`, count);
    res.json({ occupancy: count });
  } catch (e) { next(e); }
}
