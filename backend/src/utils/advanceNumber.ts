import prisma from '../config/db';

/**
 * Generate a unique advance number in format: ADV-YYYY-NNNN
 */
export async function generateAdvanceNumber(db: any = prisma): Promise<string> {
  const year = new Date().getFullYear();
  const prefix = `ADV-${year}-`;

  const lastAdvance = await db.advance.findFirst({
    where: {
      advanceNumber: {
        startsWith: prefix,
      },
    },
    orderBy: {
      advanceNumber: 'desc',
    },
  });

  let nextNumber = 1;
  if (lastAdvance) {
    const parts = lastAdvance.advanceNumber.split('-');
    if (parts.length >= 3) {
      const lastNumber = parseInt(parts[2], 10);
      if (!isNaN(lastNumber)) {
        nextNumber = lastNumber + 1;
      }
    }
  }

  return `${prefix}${String(nextNumber).padStart(4, '0')}`;
}
