import prisma from '../../config/db.js';
import { NotFoundError, getLibraryId } from '../../lib/errors.js';
import { validate } from '../../middleware/validate.js';
import { roleGuard } from '../../middleware/roleGuard.js';
import { settingsSchema, staffSchema } from './settings.schema.js';

export async function getSettings(req, res, next) {
  try {
    const library = await prisma.library.findUnique({
      where: { id: getLibraryId(req) },
      select: { id: true, name: true, capacity: true, defaultMonthlyFee: true, address: true, phone: true, email: true, isActive: true, timezone: true },
    });
    if (!library) throw new NotFoundError('Library not found');
    res.json({ library });
  } catch (e) { next(e); }
}

export async function updateSettings(req, res, next) {
  try {
    const { name, capacity, defaultMonthlyFee } = req.body;
    const libraryId = getLibraryId(req);
    const library = await prisma.library.findUnique({ where: { id: libraryId } });
    if (!library) throw new NotFoundError('Library not found');

    const updateData = {};
    if (name !== undefined) updateData.name = name;
    if (capacity !== undefined) updateData.capacity = capacity;
    if (defaultMonthlyFee !== undefined) updateData.defaultMonthlyFee = defaultMonthlyFee;

    const updated = await prisma.library.update({ where: { id: libraryId }, data: updateData });
    res.json({ library: updated });
  } catch (e) { next(e); }
}

export async function listStaff(req, res, next) {
  try {
    const users = await prisma.user.findMany({
      where: { libraryId: getLibraryId(req) },
      select: { id: true, name: true, email: true, role: true, phone: true, isActive: true, createdAt: true },
    });
    res.json({ staff: users });
  } catch (e) { next(e); }
}

export async function createStaff(req, res, next) {
  try {
    const { name, email } = req.body;
    const libraryId = getLibraryId(req);
    const library = await prisma.library.findUnique({ where: { id: libraryId } });
    if (!library) throw new NotFoundError('Library not found');

    const existingUser = await prisma.user.findUnique({ where: { email } });
    if (existingUser) throw new (await import('../../lib/errors.js')).ConflictError('User with this email already exists');

    const bcrypt = await import('bcrypt');
    const passwordHash = await bcrypt.hash('temp1234', 10);

    const user = await prisma.user.create({
      data: { name, email, passwordHash, role: 'STAFF', libraryId },
    });
    res.status(201).json({ user: { id: user.id, name: user.name, email: user.email, role: user.role } });
  } catch (e) { next(e); }
}

export async function deleteStaff(req, res, next) {
  try {
    const libraryId = getLibraryId(req);
    const user = await prisma.user.findFirst({
      where: { id: req.params.id, libraryId },
    });
    if (!user) throw new NotFoundError('Staff member not found');
    await prisma.user.delete({ where: { id: user.id } });
    res.json({ message: 'Staff removed' });
  } catch (e) { next(e); }
}
