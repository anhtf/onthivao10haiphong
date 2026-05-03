require('dotenv').config();
const { PrismaClient } = require('@prisma/client');
const bcrypt = require('bcryptjs');

const prisma = new PrismaClient();

async function main() {
  console.log('🌱 Seeding database...');

  const adminEmail = process.env.ADMIN_EMAIL || 'admin@onthivao.edu.vn';
  const adminPassword = process.env.ADMIN_PASSWORD || 'Admin@123456';
  const adminName = process.env.ADMIN_NAME || 'Quản trị viên';

  // Create or update admin account
  const existing = await prisma.user.findUnique({ where: { email: adminEmail } });
  if (!existing) {
    const passwordHash = await bcrypt.hash(adminPassword, 12);
    await prisma.user.create({
      data: {
        email: adminEmail,
        passwordHash,
        fullName: adminName,
        role: 'ADMIN',
      },
    });
    console.log(`✅ Admin account created: ${adminEmail}`);
  } else {
    console.log(`ℹ️  Admin account already exists: ${adminEmail}`);
  }

  console.log('✅ Seeding complete.');
}

main()
  .catch((e) => {
    console.error('❌ Seed failed:', e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
