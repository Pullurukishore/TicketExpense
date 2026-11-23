import { Response } from 'express';
import { AuthenticatedRequest } from '../../middleware/auth.middleware';
import prisma from '../../config/db';
import { generateClaimNumber } from '../../utils/claimNumber';

export const STANDARD_SITE_PURPOSES = [
  'Breakdown Maintenance',
  'Preventive Maintenance (AMC)',
  'Installation & Commissioning',
  'Relocation / Re-installation',
  'Software / PLC Upgrade',
  'Customer Training',
  'Warranty Service',
  'Site Survey & Inspection',
  'Spare Parts Replacement',
];

export async function getExpenses(req: any, res: Response) {
  try {
    const user = req.user;
    if (!user) return res.status(401).json({ error: 'Unauthorized' });

    const { status, from, to, page = 1, limit = 20, scope, ticketId } = req.query as any;
    const skip = (parseInt(page) - 1) * parseInt(limit);

    let where: any = {};
    const isExplicitAll = scope === 'all' || req.query.all === 'true';

    if (ticketId) {
      where.ticketId = parseInt(ticketId);
    }

    if (status) {
      if (status === 'DRAFT') {
        if (user.role === 'ADMIN' || user.role === 'ZONE_MANAGER') {
          return res.json({ expenses: [], total: 0 });
        }
        where.submittedBy = user.id;
        where.status = 'DRAFT';
      } else {
        where.status = status;
        if (!isExplicitAll || user.role === 'SERVICE_PERSON') {
          where.submittedBy = user.id;
        } else if (user.role === 'ADMIN') {
          where.status = { not: 'DRAFT' };
        } else if (user.role === 'ZONE_MANAGER' || user.role === 'ZONE_USER') {
          where.status = { not: 'DRAFT' };
        }
      }
    } else {
      if (!isExplicitAll || user.role === 'SERVICE_PERSON') {
        where.submittedBy = user.id;
      } else {
        where.status = { not: 'DRAFT' };
      }
    }

    if (from || to) {
      where.claimDate = {};
      if (from) where.claimDate.gte = new Date(from);
      if (to) where.claimDate.lte = new Date(to);
    }

    const [expenses, total] = await Promise.all([
      (prisma as any).expenseClaim.findMany({
        where,
        include: {
          submitter: {
            select: { id: true, name: true, employeeCode: true, email: true },
          },
          ticket: {
            select: { id: true, ticketNumber: true, title: true, status: true },
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
        orderBy: { claimDate: 'desc' },
        skip,
        take: parseInt(limit),
      }),
      (prisma as any).expenseClaim.count({ where }),
    ]);

    res.json({
      expenses,
      pagination: {
        page: parseInt(page),
        limit: parseInt(limit),
        total,
        totalPages: Math.ceil(total / parseInt(limit)),
      },
    });
  } catch (error: any) {
    console.error('getExpenses error:', error);
    res.status(500).json({ error: error.message || 'Internal server error' });
  }
}

export async function getExpense(req: any, res: Response) {
  try {
    const { id } = req.params;
    const user = req.user;
    if (!user) return res.status(401).json({ error: 'Unauthorized' });

    const expense = await (prisma as any).expenseClaim.findUnique({
      where: { id: parseInt(id) },
      include: {
        submitter: {
          select: { id: true, name: true, employeeCode: true, email: true },
        },
        ticket: {
          select: { id: true, ticketNumber: true, title: true, status: true },
        },
        items: true,
        approvals: {
          include: {
            approver: {
              select: { id: true, name: true },
            },
          },
          orderBy: { createdAt: 'desc' },
        },
      },
    });

    if (!expense) {
      return res.status(404).json({ error: 'Expense claim not found' });
    }

    if (expense.status === 'DRAFT' && expense.submittedBy !== user.id) {
      return res.status(403).json({ error: 'Access denied: drafts are private' });
    }

    res.json(expense);
  } catch (error: any) {
    console.error('getExpense error:', error);
    res.status(500).json({ error: error.message || 'Internal server error' });
  }
}

export async function createExpense(req: any, res: Response) {
  try {
    const user = req.user;
    if (!user) return res.status(401).json({ error: 'Unauthorized' });

    const {
      claimDate,
      purpose,
      poSoNo,
      zone,
      location,
      place,
      customer,
      ticketNo,
      ticketId,
      customerId,
      assetId,
      machineNo,
      receipts,
      items = [],
    } = req.body;

    const effectiveLocation = (place && place.trim()) || (location && location.trim()) || '';
    const effectiveReceipts = receipts ? (Array.isArray(receipts) ? receipts.join(',') : receipts.trim()) : null;

    const totalAmount = Array.isArray(items)
      ? items.reduce((sum: number, it: any) => sum + (parseFloat(it.amount) || 0), 0)
      : 0;

    const claimNumber = await generateClaimNumber();

    const claim = await (prisma as any).expenseClaim.create({
      data: {
        claimNumber,
        submittedBy: user.id,
        claimDate: claimDate ? new Date(claimDate) : new Date(),
        totalAmount,
        status: 'DRAFT',
        purpose,
        poSoNo,
        zone,
        location: effectiveLocation,
        customer,
        ticketNo,
        ticketId: ticketId ? parseInt(ticketId) : null,
        customerId: customerId ? parseInt(customerId) : null,
        assetId: assetId ? parseInt(assetId) : null,
        machineNo,
        receipts: effectiveReceipts,
        items: {
          create: items.map((it: any) => ({
            category: it.category || 'OTHERS',
            amount: parseFloat(it.amount) || 0,
            expenseDate: it.expenseDate ? new Date(it.expenseDate) : new Date(),
            description: it.description || '',
            receiptUrl: it.receiptUrl || null,
          })),
        },
      },
      include: { items: true },
    });

    res.status(201).json(claim);
  } catch (error: any) {
    console.error('createExpense error:', error);
    res.status(500).json({ error: error.message || 'Failed to create expense claim' });
  }
}

export async function updateExpense(req: any, res: Response) {
  try {
    const { id } = req.params;
    const user = req.user;
    if (!user) return res.status(401).json({ error: 'Unauthorized' });

    const existing = await (prisma as any).expenseClaim.findUnique({
      where: { id: parseInt(id) },
    });

    if (!existing) return res.status(404).json({ error: 'Expense claim not found' });
    if (existing.submittedBy !== user.id && user.role !== 'ADMIN') {
      return res.status(403).json({ error: 'Unauthorized to edit this claim' });
    }
    if (existing.status !== 'DRAFT' && existing.status !== 'REJECTED' && user.role !== 'ADMIN') {
      return res.status(400).json({ error: 'Only DRAFT or REJECTED claims can be updated' });
    }

    const {
      purpose,
      poSoNo,
      zone,
      location,
      place,
      customer,
      ticketNo,
      ticketId,
      customerId,
      assetId,
      machineNo,
      receipts,
      items,
      claimDate,
    } = req.body;

    const effectiveLocation = (place && place.trim()) || (location && location.trim()) || existing.location;
    const effectiveReceipts = receipts ? (Array.isArray(receipts) ? receipts.join(',') : receipts.trim()) : existing.receipts;

    let totalAmount = existing.totalAmount;
    if (Array.isArray(items)) {
      totalAmount = items.reduce((sum: number, it: any) => sum + (parseFloat(it.amount) || 0), 0);
      await (prisma as any).expenseItem.deleteMany({ where: { claimId: parseInt(id) } });
    }

    const updated = await (prisma as any).expenseClaim.update({
      where: { id: parseInt(id) },
      data: {
        purpose: purpose !== undefined ? purpose : existing.purpose,
        poSoNo: poSoNo !== undefined ? poSoNo : existing.poSoNo,
        zone: zone !== undefined ? zone : existing.zone,
        location: effectiveLocation,
        customer: customer !== undefined ? customer : existing.customer,
        ticketNo: ticketNo !== undefined ? ticketNo : existing.ticketNo,
        ticketId: ticketId ? parseInt(ticketId) : existing.ticketId,
        customerId: customerId ? parseInt(customerId) : existing.customerId,
        assetId: assetId ? parseInt(assetId) : existing.assetId,
        machineNo: machineNo !== undefined ? machineNo : existing.machineNo,
        receipts: effectiveReceipts,
        claimDate: claimDate ? new Date(claimDate) : existing.claimDate,
        totalAmount,
        ...(Array.isArray(items)
          ? {
              items: {
                create: items.map((it: any) => ({
                  category: it.category || 'OTHERS',
                  amount: parseFloat(it.amount) || 0,
                  expenseDate: it.expenseDate ? new Date(it.expenseDate) : new Date(),
                  description: it.description || '',
                  receiptUrl: it.receiptUrl || null,
                })),
              },
            }
          : {}),
      },
      include: { items: true },
    });

    res.json(updated);
  } catch (error: any) {
    console.error('updateExpense error:', error);
    res.status(500).json({ error: error.message || 'Failed to update expense claim' });
  }
}

export async function deleteExpense(req: any, res: Response) {
  try {
    const { id } = req.params;
    const user = req.user;
    if (!user) return res.status(401).json({ error: 'Unauthorized' });

    const existing = await (prisma as any).expenseClaim.findUnique({
      where: { id: parseInt(id) },
    });

    if (!existing) return res.status(404).json({ error: 'Claim not found' });
    if (existing.submittedBy !== user.id && user.role !== 'ADMIN') {
      return res.status(403).json({ error: 'Forbidden' });
    }
    if (existing.status !== 'DRAFT' && user.role !== 'ADMIN') {
      return res.status(400).json({ error: 'Only DRAFT claims can be deleted' });
    }

    await (prisma as any).expenseClaim.delete({ where: { id: parseInt(id) } });
    res.json({ message: 'Claim deleted successfully' });
  } catch (error: any) {
    console.error('deleteExpense error:', error);
    res.status(500).json({ error: error.message || 'Failed to delete expense claim' });
  }
}

export async function submitExpense(req: any, res: Response) {
  try {
    const { id } = req.params;
    const user = req.user;
    if (!user) return res.status(401).json({ error: 'Unauthorized' });

    const existing = await (prisma as any).expenseClaim.findUnique({
      where: { id: parseInt(id) },
      include: { items: true },
    });

    if (!existing) return res.status(404).json({ error: 'Claim not found' });
    if (existing.submittedBy !== user.id) return res.status(403).json({ error: 'Forbidden' });
    if (existing.status !== 'DRAFT' && existing.status !== 'REJECTED') {
      return res.status(400).json({ error: 'Only draft or rejected claims can be submitted' });
    }

    if (!existing.items || existing.items.length === 0) {
      return res.status(400).json({ error: 'Cannot submit a claim with no items' });
    }

    const updated = await (prisma as any).expenseClaim.update({
      where: { id: parseInt(id) },
      data: {
        status: 'PENDING',
        submittedAt: new Date(),
      },
      include: { items: true },
    });

    // Create approval record
    await (prisma as any).expenseApproval.create({
      data: {
        claimId: updated.id,
        approverId: user.id, // placeholder until reviewed
        action: 'PENDING',
      },
    });

    res.json({ message: 'Expense claim submitted for approval', claim: updated });
  } catch (error: any) {
    console.error('submitExpense error:', error);
    res.status(500).json({ error: error.message || 'Failed to submit expense claim' });
  }
}
