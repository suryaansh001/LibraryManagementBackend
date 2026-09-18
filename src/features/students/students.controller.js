import prisma from '../../config/db.js';
import { generateQrImage } from '../../lib/qr.js';
import bcrypt from 'bcrypt';
import crypto from 'crypto';
import { NotFoundError, getLibraryId, ConflictError } from '../../lib/errors.js';
import { createStudentSchema, updateStudentSchema } from './students.schema.js';

function generatePassword() {
  return Math.random().toString(36).slice(-10) + 'A1!';
}

function buildWhere(libraryId, query) {
  const where = { libraryId };
  if (query.search) {
    where.OR = [
      { name: { contains: query.search, mode: 'insensitive' } },
      { phone: { contains: query.search, mode: 'insensitive' } },
    ];
  }
  if (query.status) where.status = query.status;
  return where;
}

export async function listStudents(req, res, next) {
  try {
    const { search, status, page, limit } = req.query;
    const pageNum = parseInt(page || '1', 10);
    const limitNum = Math.min(parseInt(limit || '20', 10), 100);
    const skip = (pageNum - 1) * limitNum;
    const where = buildWhere(getLibraryId(req), req.query);

    const [students, total] = await Promise.all([
      prisma.student.findMany({
        where, skip, take: limitNum, orderBy: { createdAt: 'desc' },
        select: { id: true, name: true, phone: true, email: true, status: true, monthlyFeeOverride: true, createdAt: true, joinDate: true, seatNumber: true, isGuest: true },
      }),
      prisma.student.count({ where }),
    ]);

    res.json({ students, pagination: { total, page: pageNum, limit: limitNum, pages: Math.ceil(total / limitNum) } });
  } catch (e) { next(e); }
}

export async function createStudent(req, res, next) {
  try {
    const data = createStudentSchema.parse(req.body);
    const library = await prisma.library.findUnique({ where: { id: getLibraryId(req) } });
    if (!library) throw new NotFoundError('Library not found');

    const existingEmail = data.email && await prisma.student.findFirst({ where: { email: data.email } });
    if (existingEmail) throw new ConflictError('A student with this email already exists');

const qrToken = crypto.randomUUID();
    const monthlyFee = data.monthlyFeeOverride ?? Number(library.defaultMonthlyFee);
    const plainPassword = data.password || generatePassword();
    const passwordHash = await bcrypt.hash(plainPassword, 10);

    const [student, user] = await prisma.$transaction(async (tx) => {
      const s = await tx.student.create({
        data: {
          libraryId: getLibraryId(req),
          name: data.name,
          phone: data.phone,
          email: data.email || null,
          passwordHash,
          qrToken,
          monthlyFeeOverride: data.monthlyFeeOverride ?? null,
          seatNumber: data.seatNumber || `T-${String(Math.floor(Math.random() * 900) + 100)}`,
          isGuest: data.isGuest || false,
          dateOfBirth: data.dateOfBirth ? new Date(data.dateOfBirth) : null,
          address: data.address,
          gender: data.gender,
          emergencyContactName: data.emergencyContactName,
          emergencyContactPhone: data.emergencyContactPhone,
          notes: data.notes,
        },
      });
      const u = await tx.user.create({
        data: {
          libraryId: getLibraryId(req),
          name: data.name,
          email: data.email,
          passwordHash,
          role: 'STAFF',
        },
      });
      return [s, u];
    });
    const { passwordHash: _ph, ...studentWithoutPassword } = student;
    res.status(201).json({ student: studentWithoutPassword, password: plainPassword });
  } catch (e) { next(e); }
}

export async function getStudent(req, res, next) {
  try {
    const student = await prisma.student.findFirst({
      where: { id: req.params.id, libraryId: getLibraryId(req) },
    });
    if (!student) throw new NotFoundError('Student not found');
    const { passwordHash, ...studentSafe } = student;
    res.json({ student: studentSafe });
  } catch (e) { next(e); }
}

export async function updateStudent(req, res, next) {
  try {
    const data = updateStudentSchema.parse(req.body);
    const student = await prisma.student.findFirst({
      where: { id: req.params.id, libraryId: getLibraryId(req) },
    });
    if (!student) throw new NotFoundError('Student not found');

    const updateData = {};
    for (const [key, val] of Object.entries(data)) {
      if (key === 'password' && val) { updateData.passwordHash = await bcrypt.hash(val, 10); }
      else if (val !== undefined && key !== 'password') updateData[key] = val;
    }
    if (data.dateOfBirth) updateData.dateOfBirth = new Date(data.dateOfBirth);

    const updated = await prisma.student.update({ where: { id: student.id }, data: updateData });
    const { passwordHash, ...updatedSafe } = updated;
    res.json({ student: updatedSafe });
  } catch (e) { next(e); }
}

export async function updateStudentStatus(req, res, next) {
  try {
    const student = await prisma.student.findFirst({
      where: { id: req.params.id, libraryId: getLibraryId(req) },
    });
    if (!student) throw new NotFoundError('Student not found');

    const newStatus = student.status === 'ACTIVE' ? 'INACTIVE' : 'ACTIVE';
    const updated = await prisma.student.update({
      where: { id: student.id },
      data: { status: newStatus, deactivatedAt: newStatus === 'INACTIVE' ? new Date() : null },
    });
    res.json({ student: updated });
  } catch (e) { next(e); }
}

export async function getStudentQr(req, res, next) {
  try {
    const student = await prisma.student.findFirst({
      where: { id: req.params.id, libraryId: getLibraryId(req) },
    });
    if (!student) throw new NotFoundError('Student not found');

    const qrImage = await generateQrImage(student.qrToken);
    res.json({ qrImage, qrToken: student.qrToken });
  } catch (e) { next(e); }
}

export async function getMeStudent(req, res, next) {
  try {
    const user = await prisma.user.findUnique({ where: { id: req.user.userId } });
    if (!user) {
      const { passwordHash, ...studentSafe } = {};
      return res.json({ student: null, library: null });
    }
    const student = await prisma.student.findFirst({
      where: { libraryId: user.libraryId, email: user.email },
    });
    if (!student) return res.json({ student: null, library: null });
    const { passwordHash: _ph, ...studentSafe } = student;
    res.json({ student: studentSafe, library: user.library });
  } catch (e) { next(e); }
}
