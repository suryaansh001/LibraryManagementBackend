import prisma from '../../config/db.js';
import { generateQrImage } from '../../lib/qr.js';
import crypto from 'crypto';
import { NotFoundError, getLibraryId, ConflictError } from '../../lib/errors.js';
import { createStudentSchema, updateStudentSchema } from './students.schema.js';

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
        select: { id: true, name: true, phone: true, email: true, status: true, monthlyFeeOverride: true, createdAt: true, joinDate: true },
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

    const student = await prisma.student.create({
      data: {
        libraryId: getLibraryId(req),
        name: data.name,
        phone: data.phone,
        email: data.email || null,
        qrToken,
        monthlyFeeOverride: data.monthlyFeeOverride ?? null,
        seatNumber: data.seatNumber,
        dateOfBirth: data.dateOfBirth ? new Date(data.dateOfBirth) : null,
        address: data.address,
        gender: data.gender,
        emergencyContactName: data.emergencyContactName,
        emergencyContactPhone: data.emergencyContactPhone,
        notes: data.notes,
      },
    });
    res.status(201).json({ student });
  } catch (e) { next(e); }
}

export async function getStudent(req, res, next) {
  try {
    const student = await prisma.student.findFirst({
      where: { id: req.params.id, libraryId: getLibraryId(req) },
    });
    if (!student) throw new NotFoundError('Student not found');
    res.json({ student });
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
      if (val !== undefined) updateData[key] = val;
    }
    if (data.dateOfBirth) updateData.dateOfBirth = new Date(data.dateOfBirth);

    const updated = await prisma.student.update({ where: { id: student.id }, data: updateData });
    res.json({ student: updated });
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
