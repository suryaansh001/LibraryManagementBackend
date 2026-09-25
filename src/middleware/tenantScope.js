import prisma from '../config/db.js';

export async function tenantScope(req, res, next) {
  if (req.user && req.user.libraryId) {
    req.libraryId = req.user.libraryId;
    if (req.user.role !== 'ADMIN') {
      const library = await prisma.library.findUnique({ where: { id: req.user.libraryId }, select: { isActive: true, subscriptionStatus: true, trialEndsAt: true, paymentDueAt: true } });
      const now = new Date();
      const expiredTrial = library?.subscriptionStatus === 'TRIAL' && library.trialEndsAt && library.trialEndsAt < now;
      const expiredPayment = library?.subscriptionStatus === 'PAYMENT_PENDING' && library.paymentDueAt && library.paymentDueAt < now;
      if (!library?.isActive || library?.subscriptionStatus === 'SUSPENDED' || expiredTrial || expiredPayment) {
        return res.status(402).json({ error: { code: 'SERVICE_SUSPENDED', message: 'This library service is suspended. Please complete payment to continue.' } });
      }
    }
  }
  next();
}
