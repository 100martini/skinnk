const { customAlphabet } = require("nanoid");

const alphabet = "abcdefghijklmnopqrstuvwxyz0123456789";
const generate = customAlphabet(alphabet, 6);

async function generateUniqueSlug(prisma) {
  let attempts = 0;
  while (attempts < 10) {
    const slug = generate();
    const existing = await prisma.link.findUnique({ where: { slug } });
    if (!existing) return slug;
    attempts++;
  }
  throw new Error("slug generation failed after 10 attempts. the universe is full.");
}

module.exports = { generateUniqueSlug };
