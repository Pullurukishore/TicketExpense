import prisma from '../config/db';

/**
 * Generate a unique claim number in format: RDO-YYYY-NNNN
 */
export async function generateClaimNumber(db: any = prisma): Promise<string> {
  const [claimNumber] = await generateClaimNumbersBatch(1, db);
  return claimNumber;
}

/**
 * Generate `count` sequential unique claim numbers in format: RDO-YYYY-NNNN
 */
export async function generateClaimNumbersBatch(count: number, db: any = prisma): Promise<string[]> {
  if (count <= 0) return [];
  const year = new Date().getFullYear();
  const prefix = `RDO-${year}-`;

  const lastClaim = await db.expenseClaim.findFirst({
    where: {
      claimNumber: {
        startsWith: prefix,
      },
    },
    orderBy: {
      claimNumber: 'desc',
    },
  });

  let nextNumber = 1;
  if (lastClaim) {
    const parts = lastClaim.claimNumber.split('-');
    if (parts.length >= 3) {
      const lastNumber = parseInt(parts[2], 10);
      if (!isNaN(lastNumber)) {
        nextNumber = lastNumber + 1;
      }
    }
  }

  const numbers: string[] = [];
  for (let i = 0; i < count; i++) {
    numbers.push(`${prefix}${String(nextNumber + i).padStart(4, '0')}`);
  }
  return numbers;
}
