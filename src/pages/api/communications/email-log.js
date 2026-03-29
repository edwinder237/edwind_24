import { createHandler } from '../../../lib/api/createHandler';
import { getOrgSubscription } from '../../../lib/features/subscriptionService';
import { hasResourceCapacity, RESOURCES } from '../../../lib/features/featureAccess';

export default createHandler({
  GET: async (req, res) => {
    const {
      page = 1,
      pageSize = 50,
      emailType,
      status,
      deliveryStatus,
      search,
      projectId,
      startDate,
      endDate,
      sortBy = 'createdAt',
      sortOrder = 'desc'
    } = req.query;

    // Build where clause
    const where = {};
    if (emailType) where.emailType = emailType;
    if (status) where.status = status;
    if (deliveryStatus) {
      where.deliveryStatus = deliveryStatus === 'pending' ? null : deliveryStatus;
    }
    if (projectId) where.projectId = parseInt(projectId);
    if (startDate || endDate) {
      where.createdAt = {};
      if (startDate) where.createdAt.gte = new Date(startDate);
      if (endDate) {
        const end = new Date(endDate);
        end.setHours(23, 59, 59, 999);
        where.createdAt.lte = end;
      }
    }
    if (search) {
      where.OR = [
        { recipientEmail: { contains: search, mode: 'insensitive' } },
        { recipientName: { contains: search, mode: 'insensitive' } },
        { subject: { contains: search, mode: 'insensitive' } }
      ];
    }

    // Whitelist sort fields
    const allowedSortFields = ['createdAt', 'recipientEmail', 'emailType', 'status', 'deliveryStatus', 'subject'];
    const safeSortBy = allowedSortFields.includes(sortBy) ? sortBy : 'createdAt';
    const safeSortOrder = sortOrder === 'asc' ? 'asc' : 'desc';

    const skip = (parseInt(page) - 1) * parseInt(pageSize);
    const take = Math.min(parseInt(pageSize), 100);

    // Count sent emails this month from email_logs (matches what the table shows)
    const now = new Date();
    const monthStart = new Date(now.getFullYear(), now.getMonth(), 1);
    const organizationId = req.orgContext?.organizationId;

    const [emails, total, subscription, sentThisMonth] = await Promise.all([
      req.db.email_logs.findMany({
        where,
        orderBy: { [safeSortBy]: safeSortOrder },
        skip,
        take
      }),
      req.db.email_logs.count({ where }),
      organizationId ? getOrgSubscription(organizationId) : null,
      req.db.email_logs.count({
        where: { status: 'sent', createdAt: { gte: monthStart } }
      })
    ]);

    // Build email usage info
    let emailUsage = null;
    if (subscription) {
      const capacity = hasResourceCapacity({
        subscription,
        resource: RESOURCES.EMAILS_PER_MONTH,
        currentUsage: sentThisMonth,
        requestedAmount: 0
      });
      emailUsage = {
        used: capacity.current,
        limit: capacity.limit,
        available: capacity.available,
        planName: subscription.plan?.name || subscription.planId
      };
    }

    res.status(200).json({
      emails,
      pagination: {
        page: parseInt(page),
        pageSize: take,
        total,
        totalPages: Math.ceil(total / take)
      },
      emailUsage
    });
  }
});
