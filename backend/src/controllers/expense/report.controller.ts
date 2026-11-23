import { Response } from 'express';
import { AuthenticatedRequest } from '../../middleware/auth.middleware';
import prisma from '../../config/db';

export async function getDashboardStats(req: any, res: Response) {
  try {
    const user = req.user;
    if (!user) return res.status(401).json({ error: 'Unauthorized' });

    let claimWhere: any = {};
    let advanceWhere: any = {};

    if (user.role === 'SERVICE_PERSON') {
      claimWhere.submittedBy = user.id;
      advanceWhere.requestedBy = user.id;
    }

    const [totalClaims, pendingClaims, approvedClaims, totalAdvances, pendingAdvances] = await Promise.all([
      (prisma as any).expenseClaim.count({ where: claimWhere }),
      (prisma as any).expenseClaim.count({ where: { ...claimWhere, status: 'PENDING' } }),
      (prisma as any).expenseClaim.count({ where: { ...claimWhere, status: 'APPROVED' } }),
      (prisma as any).advance.count({ where: advanceWhere }),
      (prisma as any).advance.count({ where: { ...advanceWhere, status: 'PENDING' } }),
    ]);

    const approvedClaimSums = await (prisma as any).expenseClaim.aggregate({
      where: { ...claimWhere, status: 'APPROVED' },
      _sum: { totalAmount: true },
    });

    res.json({
      totalClaims,
      pendingClaims,
      approvedClaims,
      totalAdvances,
      pendingAdvances,
      approvedAmount: approvedClaimSums._sum.totalAmount || 0,
    });
  } catch (error: any) {
    console.error('getDashboardStats error:', error);
    res.status(500).json({ error: error.message || 'Internal server error' });
  }
}

export async function getPoSoCostingReport(req: any, res: Response) {
  try {
    const { poSoNo, customer, status } = req.query as any;

    let where: any = {};
    if (poSoNo) where.poSoNo = { contains: poSoNo, mode: 'insensitive' };
    if (customer) where.customer = { contains: customer, mode: 'insensitive' };
    if (status) where.status = status;

    const claims = await (prisma as any).expenseClaim.findMany({
      where,
      include: {
        items: true,
        submitter: { select: { id: true, name: true, employeeCode: true } },
        ticket: { select: { id: true, ticketNumber: true, title: true } },
      },
      orderBy: { claimDate: 'desc' },
    });

    // Group by poSoNo
    const grouped: { [key: string]: any } = {};
    for (const c of claims) {
      const key = c.poSoNo || 'NO_PO_SO';
      if (!grouped[key]) {
        grouped[key] = {
          poSoNo: key,
          customer: c.customer,
          totalAmount: 0,
          claimsCount: 0,
          claims: [],
        };
      }
      grouped[key].totalAmount += c.totalAmount;
      grouped[key].claimsCount += 1;
      grouped[key].claims.push(c);
    }

    res.json(Object.values(grouped));
  } catch (error: any) {
    console.error('getPoSoCostingReport error:', error);
    res.status(500).json({ error: error.message || 'Internal server error' });
  }
}
