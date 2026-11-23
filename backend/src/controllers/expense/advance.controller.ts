import { Response } from 'express';
import { AuthenticatedRequest } from '../../middleware/auth.middleware';
import prisma from '../../config/db';
import { generateAdvanceNumber } from '../../utils/advanceNumber';

export async function getAdvances(req: any, res: Response) {
  try {
    const user = req.user;
    if (!user) return res.status(401).json({ error: 'Unauthorized' });

    const { status, page = 1, limit = 20, ticketId } = req.query as any;
    const skip = (parseInt(page) - 1) * parseInt(limit);

    let where: any = {};
    if (ticketId) where.ticketId = parseInt(ticketId);

    if (user.role === 'SERVICE_PERSON') {
      where.requestedBy = user.id;
    }

    if (status) {
      where.status = status;
    }

    const [advances, total] = await Promise.all([
      (prisma as any).advance.findMany({
        where,
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
        orderBy: { requestedDate: 'desc' },
        skip,
        take: parseInt(limit),
      }),
      (prisma as any).advance.count({ where }),
    ]);

    res.json({
      advances,
      pagination: {
        page: parseInt(page),
        limit: parseInt(limit),
        total,
        totalPages: Math.ceil(total / parseInt(limit)),
      },
    });
  } catch (error: any) {
    console.error('getAdvances error:', error);
    res.status(500).json({ error: error.message || 'Internal server error' });
  }
}

export async function getAdvance(req: any, res: Response) {
  try {
    const { id } = req.params;
    const user = req.user;
    if (!user) return res.status(401).json({ error: 'Unauthorized' });

    const advance = await (prisma as any).advance.findUnique({
      where: { id: parseInt(id) },
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
    });

    if (!advance) return res.status(404).json({ error: 'Advance not found' });
    if (user.role === 'SERVICE_PERSON' && advance.requestedBy !== user.id) {
      return res.status(403).json({ error: 'Forbidden' });
    }

    res.json(advance);
  } catch (error: any) {
    console.error('getAdvance error:', error);
    res.status(500).json({ error: error.message || 'Internal server error' });
  }
}

export async function createAdvance(req: any, res: Response) {
  try {
    const user = req.user;
    if (!user) return res.status(401).json({ error: 'Unauthorized' });

    const { amount, purpose, customer, location, ticketNo, ticketId, customerId, poSoNo, notes, requestedDate } = req.body;

    if (!amount || !purpose) {
      return res.status(400).json({ error: 'Amount and purpose are required.' });
    }

    const advanceNumber = await generateAdvanceNumber();

    const advance = await (prisma as any).advance.create({
      data: {
        advanceNumber,
        requestedBy: user.id,
        amount: parseFloat(amount),
        purpose,
        customer,
        location,
        ticketNo,
        ticketId: ticketId ? parseInt(ticketId) : null,
        customerId: customerId ? parseInt(customerId) : null,
        poSoNo,
        notes,
        requestedDate: requestedDate ? new Date(requestedDate) : new Date(),
        status: 'DRAFT',
      },
    });

    res.status(201).json(advance);
  } catch (error: any) {
    console.error('createAdvance error:', error);
    res.status(500).json({ error: error.message || 'Failed to create advance request' });
  }
}

export async function updateAdvance(req: any, res: Response) {
  try {
    const { id } = req.params;
    const user = req.user;
    if (!user) return res.status(401).json({ error: 'Unauthorized' });

    const existing = await (prisma as any).advance.findUnique({ where: { id: parseInt(id) } });
    if (!existing) return res.status(404).json({ error: 'Advance not found' });
    if (existing.requestedBy !== user.id && user.role !== 'ADMIN') {
      return res.status(403).json({ error: 'Forbidden' });
    }
    if (existing.status !== 'DRAFT' && existing.status !== 'REJECTED' && user.role !== 'ADMIN') {
      return res.status(400).json({ error: 'Only draft or rejected advances can be modified' });
    }

    const { amount, purpose, customer, location, ticketNo, ticketId, poSoNo, notes, requestedDate } = req.body;

    const updated = await (prisma as any).advance.update({
      where: { id: parseInt(id) },
      data: {
        amount: amount !== undefined ? parseFloat(amount) : existing.amount,
        purpose: purpose !== undefined ? purpose : existing.purpose,
        customer: customer !== undefined ? customer : existing.customer,
        location: location !== undefined ? location : existing.location,
        ticketNo: ticketNo !== undefined ? ticketNo : existing.ticketNo,
        ticketId: ticketId ? parseInt(ticketId) : existing.ticketId,
        poSoNo: poSoNo !== undefined ? poSoNo : existing.poSoNo,
        notes: notes !== undefined ? notes : existing.notes,
        requestedDate: requestedDate ? new Date(requestedDate) : existing.requestedDate,
      },
    });

    res.json(updated);
  } catch (error: any) {
    console.error('updateAdvance error:', error);
    res.status(500).json({ error: error.message || 'Failed to update advance' });
  }
}

export async function deleteAdvance(req: any, res: Response) {
  try {
    const { id } = req.params;
    const user = req.user;
    if (!user) return res.status(401).json({ error: 'Unauthorized' });

    const existing = await (prisma as any).advance.findUnique({ where: { id: parseInt(id) } });
    if (!existing) return res.status(404).json({ error: 'Advance not found' });
    if (existing.requestedBy !== user.id && user.role !== 'ADMIN') return res.status(403).json({ error: 'Forbidden' });
    if (existing.status !== 'DRAFT' && user.role !== 'ADMIN') {
      return res.status(400).json({ error: 'Only draft advances can be deleted' });
    }

    await (prisma as any).advance.delete({ where: { id: parseInt(id) } });
    res.json({ message: 'Advance deleted successfully' });
  } catch (error: any) {
    console.error('deleteAdvance error:', error);
    res.status(500).json({ error: error.message || 'Failed to delete advance' });
  }
}

export async function submitAdvance(req: any, res: Response) {
  try {
    const { id } = req.params;
    const user = req.user;
    if (!user) return res.status(401).json({ error: 'Unauthorized' });

    const existing = await (prisma as any).advance.findUnique({ where: { id: parseInt(id) } });
    if (!existing) return res.status(404).json({ error: 'Advance not found' });
    if (existing.requestedBy !== user.id) return res.status(403).json({ error: 'Forbidden' });
    if (existing.status !== 'DRAFT' && existing.status !== 'REJECTED') {
      return res.status(400).json({ error: 'Only draft or rejected advances can be submitted' });
    }

    const updated = await (prisma as any).advance.update({
      where: { id: parseInt(id) },
      data: {
        status: 'PENDING',
        submittedAt: new Date(),
      },
    });

    await (prisma as any).expenseApproval.create({
      data: {
        advanceId: updated.id,
        approverId: user.id,
        action: 'PENDING',
      },
    });

    res.json({ message: 'Advance request submitted for approval', advance: updated });
  } catch (error: any) {
    console.error('submitAdvance error:', error);
    res.status(500).json({ error: error.message || 'Failed to submit advance' });
  }
}
