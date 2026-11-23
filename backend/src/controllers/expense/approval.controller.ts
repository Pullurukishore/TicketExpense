import { Response } from 'express';
import { AuthenticatedRequest } from '../../middleware/auth.middleware';
import prisma from '../../config/db';

export async function getPendingApprovals(req: any, res: Response) {
  try {
    const user = req.user;
    if (!user) return res.status(401).json({ error: 'Unauthorized' });

    const [pendingClaims, pendingAdvances] = await Promise.all([
      (prisma as any).expenseClaim.findMany({
        where: { status: 'PENDING' },
        include: {
          submitter: {
            select: { id: true, name: true, employeeCode: true, email: true },
          },
          ticket: {
            select: { id: true, ticketNumber: true, title: true },
          },
          items: true,
          approvals: {
            include: {
              approver: {
                select: { id: true, name: true },
              },
            },
          },
        },
        orderBy: { submittedAt: 'desc' },
      }),
      (prisma as any).advance.findMany({
        where: { status: 'PENDING' },
        include: {
          requester: {
            select: { id: true, name: true, employeeCode: true, email: true },
          },
          ticket: {
            select: { id: true, ticketNumber: true, title: true },
          },
          approvals: {
            include: {
              approver: {
                select: { id: true, name: true },
              },
            },
          },
        },
        orderBy: { submittedAt: 'desc' },
      }),
    ]);

    res.json({ claims: pendingClaims, advances: pendingAdvances });
  } catch (error: any) {
    console.error('getPendingApprovals error:', error);
    res.status(500).json({ error: error.message || 'Internal server error' });
  }
}

export async function approveExpense(req: any, res: Response) {
  try {
    const { id } = req.params;
    const user = req.user;
    if (!user) return res.status(401).json({ error: 'Unauthorized' });
    const { comments } = req.body;

    const claim = await (prisma as any).expenseClaim.findUnique({
      where: { id: parseInt(id) },
    });
    if (!claim) return res.status(404).json({ error: 'Claim not found' });
    if (claim.status !== 'PENDING') return res.status(400).json({ error: 'Claim is not in PENDING state' });

    const updated = await (prisma as any).expenseClaim.update({
      where: { id: parseInt(id) },
      data: { status: 'APPROVED' },
    });

    await (prisma as any).expenseApproval.create({
      data: {
        claimId: claim.id,
        approverId: user.id,
        action: 'APPROVED',
        comments: comments || 'Approved',
        actionDate: new Date(),
      },
    });

    res.json({ message: 'Expense claim approved', claim: updated });
  } catch (error: any) {
    console.error('approveExpense error:', error);
    res.status(500).json({ error: error.message || 'Failed to approve expense' });
  }
}

export async function rejectExpense(req: any, res: Response) {
  try {
    const { id } = req.params;
    const user = req.user;
    if (!user) return res.status(401).json({ error: 'Unauthorized' });
    const { comments } = req.body;

    const claim = await (prisma as any).expenseClaim.findUnique({
      where: { id: parseInt(id) },
    });
    if (!claim) return res.status(404).json({ error: 'Claim not found' });
    if (claim.status !== 'PENDING') return res.status(400).json({ error: 'Claim is not in PENDING state' });

    const updated = await (prisma as any).expenseClaim.update({
      where: { id: parseInt(id) },
      data: { status: 'REJECTED' },
    });

    await (prisma as any).expenseApproval.create({
      data: {
        claimId: claim.id,
        approverId: user.id,
        action: 'REJECTED',
        comments: comments || 'Rejected',
        actionDate: new Date(),
      },
    });

    res.json({ message: 'Expense claim rejected', claim: updated });
  } catch (error: any) {
    console.error('rejectExpense error:', error);
    res.status(500).json({ error: error.message || 'Failed to reject expense' });
  }
}

export async function approveAdvance(req: any, res: Response) {
  try {
    const { id } = req.params;
    const user = req.user;
    if (!user) return res.status(401).json({ error: 'Unauthorized' });
    const { comments } = req.body;

    const advance = await (prisma as any).advance.findUnique({ where: { id: parseInt(id) } });
    if (!advance) return res.status(404).json({ error: 'Advance not found' });
    if (advance.status !== 'PENDING') return res.status(400).json({ error: 'Advance is not in PENDING state' });

    const updated = await (prisma as any).advance.update({
      where: { id: parseInt(id) },
      data: { status: 'APPROVED' },
    });

    await (prisma as any).expenseApproval.create({
      data: {
        advanceId: advance.id,
        approverId: user.id,
        action: 'APPROVED',
        comments: comments || 'Approved',
        actionDate: new Date(),
      },
    });

    res.json({ message: 'Advance request approved', advance: updated });
  } catch (error: any) {
    console.error('approveAdvance error:', error);
    res.status(500).json({ error: error.message || 'Failed to approve advance' });
  }
}

export async function rejectAdvance(req: any, res: Response) {
  try {
    const { id } = req.params;
    const user = req.user;
    if (!user) return res.status(401).json({ error: 'Unauthorized' });
    const { comments } = req.body;

    const advance = await (prisma as any).advance.findUnique({ where: { id: parseInt(id) } });
    if (!advance) return res.status(404).json({ error: 'Advance not found' });
    if (advance.status !== 'PENDING') return res.status(400).json({ error: 'Advance is not in PENDING state' });

    const updated = await (prisma as any).advance.update({
      where: { id: parseInt(id) },
      data: { status: 'REJECTED' },
    });

    await (prisma as any).expenseApproval.create({
      data: {
        advanceId: advance.id,
        approverId: user.id,
        action: 'REJECTED',
        comments: comments || 'Rejected',
        actionDate: new Date(),
      },
    });

    res.json({ message: 'Advance request rejected', advance: updated });
  } catch (error: any) {
    console.error('rejectAdvance error:', error);
    res.status(500).json({ error: error.message || 'Failed to reject advance' });
  }
}
