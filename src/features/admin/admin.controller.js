import bcrypt from 'bcrypt';
import prisma from '../../config/db.js';
import { ConflictError, NotFoundError } from '../../lib/errors.js';
import { createLibrarySchema, updateLibrarySchema } from './admin.schema.js';

const librarySelect = {
  id: true,
  name: true,
  address: true,
  phone: true,
  email: true,
  capacity: true,
  defaultMonthlyFee: true,
  timezone: true,
  isActive: true,
  subscriptionStatus: true,
  trialEndsAt: true,
  paymentDueAt: true,
  suspendedAt: true,
  createdAt: true,
};

function subscriptionState(library) {
  const now = new Date();
  if (library.subscriptionStatus === 'TRIAL' && library.trialEndsAt && library.trialEndsAt < now) return 'SUSPENDED';
  if (library.subscriptionStatus === 'PAYMENT_PENDING' && library.paymentDueAt && library.paymentDueAt < now) return 'SUSPENDED';
  return library.subscriptionStatus;
}

export async function listLibraries(req, res, next) {
  try {
    const libraries = await prisma.library.findMany({
      orderBy: { createdAt: 'desc' },
      select: {
        ...librarySelect,
        _count: { select: { users: true, students: true } },
        students: { where: { status: 'ACTIVE' }, select: { id: true } },
        feeRecords: { where: { status: { in: ['PENDING', 'PARTIAL', 'OVERDUE'] } }, select: { amount: true, amountPaid: true, dueDate: true } },
      },
    });
    const enriched = libraries.map((library) => {
      const overdueFees = library.feeRecords.filter((fee) => fee.dueDate < new Date());
      const outstanding = library.feeRecords.reduce((sum, fee) => sum + Number(fee.amount) - Number(fee.amountPaid), 0);
      const { students, feeRecords, ...safeLibrary } = library;
      return { ...safeLibrary, subscriptionStatus: subscriptionState(library), activeStudents: students.length, pendingPayments: feeRecords.length, overduePayments: overdueFees.length, outstandingAmount: outstanding };
    });
    res.json({ libraries: enriched });
  } catch (e) { next(e); }
}

export async function createLibrary(req, res, next) {
  try {
    const data = createLibrarySchema.parse(req.body);
    const existingOwner = await prisma.user.findUnique({ where: { email: data.ownerEmail } });
    if (existingOwner) throw new ConflictError('An account with the owner email already exists');

    const passwordHash = await bcrypt.hash(data.ownerPassword, 10);
    const library = await prisma.$transaction(async (tx) => {
      const created = await tx.library.create({
        data: {
          name: data.name,
          address: data.address,
          phone: data.phone,
          email: data.email || null,
          capacity: data.capacity,
          defaultMonthlyFee: data.defaultMonthlyFee,
          trialEndsAt: new Date(Date.now() + data.trialDays * 24 * 60 * 60 * 1000),
          subscriptionStatus: data.trialDays > 0 ? 'TRIAL' : 'PAYMENT_PENDING',
        },
      });
      await tx.user.create({
        data: { libraryId: created.id, name: data.ownerName, email: data.ownerEmail, passwordHash, role: 'OWNER' },
      });
      return created;
    });

    res.status(201).json({ library });
  } catch (e) { next(e); }
}

export async function updateLibrary(req, res, next) {
  try {
    const data = updateLibrarySchema.parse(req.body);
    const existing = await prisma.library.findUnique({ where: { id: req.params.id } });
    if (!existing) throw new NotFoundError('Library not found');
    const library = await prisma.library.update({ where: { id: existing.id }, data });
    res.json({ library });
  } catch (e) { next(e); }
}

export async function setLibraryStatus(req, res, next) {
  try {
    const existing = await prisma.library.findUnique({ where: { id: req.params.id } });
    if (!existing) throw new NotFoundError('Library not found');
    const library = await prisma.library.update({ where: { id: existing.id }, data: { isActive: !existing.isActive } });
    res.json({ library });
  } catch (e) { next(e); }
}

export async function updateSubscription(req, res, next) {
  try {
    const { subscriptionStatus, paymentDueAt, trialEndsAt } = req.body;
    if (!['TRIAL', 'ACTIVE', 'PAYMENT_PENDING', 'SUSPENDED'].includes(subscriptionStatus)) throw new ConflictError('Invalid subscription status');
    const existing = await prisma.library.findUnique({ where: { id: req.params.id } });
    if (!existing) throw new NotFoundError('Library not found');
    const library = await prisma.library.update({
      where: { id: existing.id },
      data: { subscriptionStatus, paymentDueAt: paymentDueAt ? new Date(paymentDueAt) : null, trialEndsAt: trialEndsAt ? new Date(trialEndsAt) : existing.trialEndsAt, suspendedAt: subscriptionStatus === 'SUSPENDED' ? new Date() : null, isActive: subscriptionStatus !== 'SUSPENDED' },
      select: librarySelect,
    });
    res.json({ library });
  } catch (e) { next(e); }
}
