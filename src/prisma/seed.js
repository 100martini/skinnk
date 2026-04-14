const { PrismaClient } = require("@prisma/client");

const prisma = new PrismaClient();

const specimens = [
  { slug: "ax7k", original: "https://developer.mozilla.org/en-US/docs/Web/JavaScript", days: 30 },
  { slug: "bz9q", original: "https://www.postgresql.org/docs/current/tutorial.html", days: 14 },
  { slug: "cv3m", original: "https://expressjs.com/en/starter/installing.html", days: 7 },
];

async function main() {
  for (const s of specimens) {
    await prisma.link.upsert({
      where: { slug: s.slug },
      update: {},
      create: {
        slug: s.slug,
        original: s.original,
        expiresAt: new Date(Date.now() + s.days * 86400000),
      },
    });
  }
  console.log("seeded 3 links into the database. they seem happy.");
}

main()
  .catch((e) => { console.error("seed failed:", e); process.exit(1); })
  .finally(() => prisma.$disconnect());
