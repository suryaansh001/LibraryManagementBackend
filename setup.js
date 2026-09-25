import prisma from './src/config/db.js';
import bcrypt from 'bcrypt';
import crypto from 'crypto';

async function main() {
  const libraries = [
    { name: 'Central Library', capacity: 80, defaultMonthlyFee: 1500, address: '123 Main St', phone: '+1-555-0100', email: 'central@libman.local' },
    { name: 'North Branch', capacity: 60, defaultMonthlyFee: 1200, address: '456 North Ave', phone: '+1-555-0101', email: 'north@libman.local' },
    { name: 'South Branch', capacity: 50, defaultMonthlyFee: 1200, address: '789 South Blvd', phone: '+1-555-0102', email: 'south@libman.local' },
    { name: 'East Branch', capacity: 40, defaultMonthlyFee: 1000, address: '321 East Rd', phone: '+1-555-0103', email: 'east@libman.local' },
    { name: 'West Branch', capacity: 45, defaultMonthlyFee: 1000, address: '654 West Way', phone: '+1-555-0104', email: 'west@libman.local' },
    { name: 'University Library', capacity: 120, defaultMonthlyFee: 1500, address: 'Campus Dr', phone: '+1-555-0105', email: 'uni@libman.local' },
    { name: 'Community Library', capacity: 30, defaultMonthlyFee: 800, address: '999 Community Ln', phone: '+1-555-0106', email: 'community@libman.local' },
  ];

  for (const lib of libraries) {
    const existing = await prisma.library.findFirst({ where: { name: lib.name } });
    if (existing) {
      await prisma.library.update({ where: { id: existing.id }, data: lib });
    } else {
      await prisma.library.create({ data: { ...lib, isActive: true, timezone: 'Asia/Kolkata' } });
    }
  }

  const owner = await prisma.user.findUnique({ where: { email: 'owner@libman.local' } });
  if (!owner) {
    const hash = await bcrypt.hash('admin123', 10);
    const lib = await prisma.library.findFirst();
    await prisma.user.create({
      data: {
        email: 'owner@libman.local',
        passwordHash: hash,
        name: 'Library Owner',
        role: 'OWNER',
        libraryId: lib?.id,
      },
    });
    console.log('Default owner created: owner@libman.local / admin123');
  }

  const admin = await prisma.user.findUnique({ where: { email: 'admin@libman.local' } });
  if (!admin) {
    const hash = await bcrypt.hash('admin123', 10);
    const lib = await prisma.library.findFirst();
    await prisma.user.create({
      data: {
        email: 'admin@libman.local',
        passwordHash: hash,
        name: 'Platform Admin',
        role: 'ADMIN',
        libraryId: lib.id,
      },
    });
    console.log('Default admin created: admin@libman.local / admin123');
  }

  console.log('Database initialized successfully');
  await prisma.$disconnect();
}

main().catch(console.error);
