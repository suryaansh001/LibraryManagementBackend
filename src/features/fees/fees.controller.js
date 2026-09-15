import prisma from '../../config/db.js';
import { NotFoundError, getLibraryId, ConflictError } from '../../lib/errors.js';
import { feeQuerySchema, payFeeSchema, generateFeesSchema } from './fees.schema.js';

export async function listFees(req, res, next) {
  try {
    const { status, studentId, month, page, limit } = req.query;
    const pageNum = parseInt(page || '1', 10);
    const limitNum = Math.min(parseInt(limit || '20', 10), 100);
    const skip = (pageNum - 1) * limitNum;

    const where = { libraryId: getLibraryId(req) };
    if (status) where.status = status;
    if (studentId) where.studentId = studentId;
    if (month) where.billingMonth = { gte: new Date(`${month}-01`), lt: new Date(`${month}-01`).setMonth(new Date(`${month}-01`).getMonth() + 1) };

    const [fees, total] = await Promise.all([
      prisma.feeRecord.findMany({
        where, skip, take: limitNum, orderBy: { dueDate: 'asc' },
        include: { student: { select: { name: true, phone: true, qrToken: true } }, recordedBy: { select: { name: true } } },
      }),
      prisma.feeRecord.count({ where }),
    ]);

    res.json({ fees, pagination: { total, page: pageNum, limit: limitNum, pages: Math.ceil(total / limitNum) } });
  } catch (e) { next(e); }
}

export async function listOverdue(req, res, next) {
  try {
    const today = new Date();
    const where = {
      libraryId: getLibraryId(req),
      status: { in: ['PENDING', 'OVERDUE'] },
      dueDate: { lt: today },
    };

    const fees = await prisma.feeRecord.findMany({
      where, orderBy: { dueDate: 'asc' },
      include: { student: { select: { name: true, phone: true } }, recordedBy: { select: { name: true } } },
    });

    const result = fees.map(f => ({
      ...f,
      outstanding: Number(f.amount) - Number(f.amountPaid),
    }));

    res.json({ fees: result });
  } catch (e) { next(e); }
}

export async function payFee(req, res, next) {
  try {
    const data = payFeeSchema.parse(req.body);
    const fee = await prisma.feeRecord.findFirst({
      where: { id: req.params.id, libraryId: getLibraryId(req) },
    });
    if (!fee) throw new NotFoundError('Fee record not found');

    const newPaid = Number(fee.amountPaid) + data.amount;
    const newStatus = newPaid >= Number(fee.amount) ? 'PAID' : 'PARTIAL';

    const updated = await prisma.feeRecord.update({
      where: { id: fee.id },
      data: {
        amountPaid: newPaid,
        status: newStatus,
        paidDate: newPaid >= Number(fee.amount) ? new Date() : fee.paidDate,
        paymentMethod: data.method,
        transactionRef: data.method ? `txn_${Date.now()}` : undefined,
      },
    });

    res.json({ fee: updated });
  } catch (e) { next(e); }
}

export async function generateFees(req, res, next) {
  try {
    const { month } = generateFeesSchema.parse(req.body);
    const [year, mon] = month.split('-').map(Number);
    const billingMonth = new Date(year, mon - 1, 1);
    const nextMonth = new Date(year, mon, 1);
    const dueDate = new Date(year, mon, 1);

    const students = await prisma.student.findMany({
      where: { libraryId: getLibraryId(req), status: 'ACTIVE' },
      select: { id: true, name: true, monthlyFeeOverride: true },
    });

    const existingCount = await prisma.feeRecord.count({
      where: { libraryId: getLibraryId(req), billingMonth },
    });
    if (existingCount > 0) throw new ConflictError(`Fees for ${month} already generated`);

    const library = await prisma.library.findUnique({
      where: { id: getLibraryId(req) },
      select: { defaultMonthlyFee: true },
    });
    if (!library) throw new NotFoundError('Library not found');

    const feeRecords = students.map(s => ({
      studentId: s.id,
      libraryId: getLibraryId(req),
      billingMonth,
      amount: s.monthlyFeeOverride ?? Number(library.defaultMonthlyFee),
      amountPaid: 0,
      dueDate,
      status: 'PENDING',
    }));

    await prisma.feeRecord.createMany({ data: feeRecords, skipDuplicates: true });
    res.json({ generated: feeRecords.length, month });
  } catch (e) { next(e); }
}

export async function studentFees(req, res, next) {
  try {
    const student = await prisma.student.findFirst({
      where: { id: req.params.id, libraryId: getLibraryId(req) },
    });
    if (!student) throw new NotFoundError('Student not found');

    const fees = await prisma.feeRecord.findMany({
      where: { studentId: student.id, libraryId: getLibraryId(req) },
      orderBy: { billingMonth: 'desc' },
      include: { recordedBy: { select: { name: true } } },
    });

    res.json({ fees, student: { name: student.name } });
  } catch (e) { next(e); }
}
