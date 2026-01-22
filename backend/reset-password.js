const bcrypt = require('bcryptjs');
const { PrismaClient } = require('@prisma/client');

const prisma = new PrismaClient();

async function resetPassword(email, newPassword) {
  const hashedPassword = await bcrypt.hash(newPassword, 12);

  const user = await prisma.user.update({
    where: { email },
    data: { password: hashedPassword }
  });

  console.log(`Password reset successful for ${user.name} (${email})`);
  await prisma.$disconnect();
}

resetPassword('mariem.mejbri@ext.i-hub.com', 'PAssword');
