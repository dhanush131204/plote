const prisma = require('./server/prisma');
const db = require('./server/db');

async function test() {
  try {
    const layoutId = null;
    const page = 1;
    const limit = 5;
    const offset = 0;

    // Let's assume req.userId is 1 (or we can query the first user)
    const firstUser = await prisma.user.findFirst();
    if (!firstUser) {
      console.log("No users found.");
      return;
    }
    const userId = firstUser.id;
    const isSuperAdmin = firstUser.role === 'super_admin';

    console.log("Testing leads for User ID:", userId, "Role:", firstUser.role);

    let whereObj = {};
    if (layoutId) {
      whereObj.layoutId = layoutId;
    }
    
    if (!isSuperAdmin) {
      whereObj.layout = { userId: userId };
    }

    console.log("whereObj:", JSON.stringify(whereObj));

    const total = await prisma.lead.count({ where: whereObj });
    console.log("Total leads count:", total);

    const rows = await prisma.lead.findMany({
      where: whereObj,
      include: {
        layout: {
          select: { name: true, slug: true },
        },
      },
      orderBy: { createdAt: 'desc' },
      take: limit,
      skip: offset,
    });

    console.log("Rows found:", rows.length);
    console.log("Rows details:", JSON.stringify(rows.slice(0, 2)));

  } catch (err) {
    console.error("TEST FAILED WITH ERROR:", err);
  } finally {
    await prisma.$disconnect();
  }
}

test();
