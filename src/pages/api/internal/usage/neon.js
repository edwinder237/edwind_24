/**
 * Internal API - Neon Database Usage (Owner only)
 *
 * GET /api/internal/usage/neon
 * Fetches consumption metrics from Neon API
 */

import prisma from '../../../../lib/prisma';
import { WorkOS } from '@workos-inc/node';

const workos = new WorkOS(process.env.WORKOS_API_KEY);

// Neon API configuration
const NEON_API_BASE = 'https://console.neon.tech/api/v2';

// Neon pricing (USD) - Launch plan pricing for overages
const NEON_PRICING = {
  computePerHour: 0.0255,        // $0.0255 per compute-hour (after free tier)
  storagePerGBMonth: 0.12,       // $0.12 per GiB-month (after free tier)
  writtenDataPerGB: 0.096,       // $0.096 per GiB written
  dataTransferPerGB: 0.09        // $0.09 per GiB transfer
};

// Free tier limits (default)
const FREE_TIER_LIMITS = {
  computeHours: 100,             // 100 compute-hours/month
  storageGB: 0.5                 // 0.5 GiB storage
};

export default async function handler(req, res) {
  if (req.method !== 'GET') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  try {
    // Check authentication
    const userId = req.cookies.workos_user_id;

    if (!userId) {
      return res.status(401).json({ error: 'Not authenticated' });
    }

    // Get user from WorkOS and verify owner role
    const user = await workos.userManagement.getUser(userId);

    if (!user) {
      return res.status(401).json({ error: 'User not found' });
    }

    // Get user's organization membership
    const membership = await prisma.organization_memberships.findFirst({
      where: { userId: user.id },
      select: { workos_role: true }
    });

    // Only owners can access internal usage stats
    if (!membership || membership.workos_role !== 'owner') {
      return res.status(403).json({ error: 'Owner access required' });
    }

    // Check for Neon API key
    const neonApiKey = process.env.NEON_API_KEY;
    const neonProjectId = process.env.NEON_PROJECT_ID;

    if (!neonApiKey) {
      return res.status(200).json({
        configured: false,
        message: 'Neon API key not configured. Add NEON_API_KEY to your environment variables.',
        metrics: null
      });
    }

    // Default date range (current billing period - start of month to now)
    const now = new Date();
    const startOfMonth = new Date(now.getFullYear(), now.getMonth(), 1);

    let billingPeriodStart = startOfMonth.toISOString();
    let billingPeriodEnd = now.toISOString();

    // These will be used for consumption history query
    const from = startOfMonth.toISOString();
    const to = now.toISOString();

    // Fetch consumption data from Neon API
    let metrics = null;
    let projectMetrics = null;

    // Try to get project-specific metrics if project ID is available
    if (neonProjectId) {
      try {
        const projectResponse = await fetch(
          `${NEON_API_BASE}/projects/${neonProjectId}`,
          {
            headers: {
              'Authorization': `Bearer ${neonApiKey}`,
              'Accept': 'application/json'
            }
          }
        );

        if (projectResponse.ok) {
          const projectData = await projectResponse.json();
          projectMetrics = projectData.project;

          // Extract metrics directly from project data (this is the current billing period data)
          if (projectMetrics) {
            metrics = {
              activeTimeSeconds: projectMetrics.active_time_seconds || 0,
              computeTimeSeconds: projectMetrics.compute_time_seconds || 0,
              computeHours: ((projectMetrics.compute_time_seconds || 0) / 3600).toFixed(2),
              writtenDataBytes: projectMetrics.written_data_bytes || 0,
              writtenDataGB: ((projectMetrics.written_data_bytes || 0) / (1024 * 1024 * 1024)).toFixed(4),
              storageSizeBytes: projectMetrics.synthetic_storage_size || 0,
              storageSizeGB: ((projectMetrics.synthetic_storage_size || 0) / (1024 * 1024 * 1024)).toFixed(4),
              dataTransferBytes: projectMetrics.data_transfer_bytes || 0,
              dataTransferGB: ((projectMetrics.data_transfer_bytes || 0) / (1024 * 1024 * 1024)).toFixed(4)
            };

            // Use actual billing period from Neon API if available
            if (projectMetrics.consumption_period_start) {
              billingPeriodStart = projectMetrics.consumption_period_start;
            }
            if (projectMetrics.consumption_period_end) {
              billingPeriodEnd = projectMetrics.consumption_period_end;
            }
          }
        }
      } catch (err) {
        console.error('[Neon API] Error fetching project:', err);
      }
    }

    // Fetch consumption history
    try {
      const params = new URLSearchParams({
        from,
        to,
        granularity: 'daily'
      });

      // If we have an org_id, use org-level endpoint
      if (process.env.NEON_ORG_ID) {
        params.append('org_id', process.env.NEON_ORG_ID);
      }

      const consumptionUrl = neonProjectId
        ? `${NEON_API_BASE}/projects/${neonProjectId}/consumption`
        : `${NEON_API_BASE}/consumption_history/account?${params.toString()}`;

      const consumptionResponse = await fetch(consumptionUrl, {
        headers: {
          'Authorization': `Bearer ${neonApiKey}`,
          'Accept': 'application/json'
        }
      });

      if (consumptionResponse.ok) {
        const consumptionData = await consumptionResponse.json();

        // Extract metrics from consumption data
        if (consumptionData.periods && consumptionData.periods.length > 0) {
          // Aggregate all periods
          let totalActiveTime = 0;
          let totalComputeTime = 0;
          let totalWrittenData = 0;
          let latestStorageSize = 0;

          consumptionData.periods.forEach(period => {
            if (period.consumption) {
              period.consumption.forEach(c => {
                totalActiveTime += c.active_time_seconds || 0;
                totalComputeTime += c.compute_time_seconds || 0;
                totalWrittenData += c.written_data_bytes || 0;
                // Use the latest storage size
                if (c.synthetic_storage_size_bytes) {
                  latestStorageSize = c.synthetic_storage_size_bytes;
                }
              });
            }
          });

          metrics = {
            activeTimeSeconds: totalActiveTime,
            computeTimeSeconds: totalComputeTime,
            computeHours: (totalComputeTime / 3600).toFixed(2),
            writtenDataBytes: totalWrittenData,
            writtenDataGB: (totalWrittenData / (1024 * 1024 * 1024)).toFixed(4),
            storageSizeBytes: latestStorageSize,
            storageSizeGB: (latestStorageSize / (1024 * 1024 * 1024)).toFixed(4)
          };
        } else if (consumptionData.active_time_seconds !== undefined) {
          // Direct project consumption response
          metrics = {
            activeTimeSeconds: consumptionData.active_time_seconds || 0,
            computeTimeSeconds: consumptionData.compute_time_seconds || 0,
            computeHours: ((consumptionData.compute_time_seconds || 0) / 3600).toFixed(2),
            writtenDataBytes: consumptionData.written_data_bytes || 0,
            writtenDataGB: ((consumptionData.written_data_bytes || 0) / (1024 * 1024 * 1024)).toFixed(4),
            storageSizeBytes: consumptionData.synthetic_storage_size_bytes || 0,
            storageSizeGB: ((consumptionData.synthetic_storage_size_bytes || 0) / (1024 * 1024 * 1024)).toFixed(4)
          };
        }
      } else {
        const errorText = await consumptionResponse.text();
        console.error('[Neon API] Consumption error:', consumptionResponse.status, errorText);
      }
    } catch (err) {
      console.error('[Neon API] Error fetching consumption:', err);
    }

    // If we still don't have metrics, try the projects list endpoint
    if (!metrics) {
      try {
        const projectsResponse = await fetch(
          `${NEON_API_BASE}/projects`,
          {
            headers: {
              'Authorization': `Bearer ${neonApiKey}`,
              'Accept': 'application/json'
            }
          }
        );

        if (projectsResponse.ok) {
          const projectsData = await projectsResponse.json();

          if (projectsData.projects && projectsData.projects.length > 0) {
            // Aggregate across all projects
            let totalActiveTime = 0;
            let totalComputeTime = 0;
            let totalWrittenData = 0;
            let totalStorageSize = 0;

            projectsData.projects.forEach(project => {
              totalActiveTime += project.active_time_seconds || 0;
              totalComputeTime += project.compute_time_seconds || 0;
              totalWrittenData += project.written_data_bytes || 0;
              totalStorageSize += project.synthetic_storage_size_bytes || 0;
            });

            metrics = {
              activeTimeSeconds: totalActiveTime,
              computeTimeSeconds: totalComputeTime,
              computeHours: (totalComputeTime / 3600).toFixed(2),
              writtenDataBytes: totalWrittenData,
              writtenDataGB: (totalWrittenData / (1024 * 1024 * 1024)).toFixed(4),
              storageSizeBytes: totalStorageSize,
              storageSizeGB: (totalStorageSize / (1024 * 1024 * 1024)).toFixed(4),
              projectCount: projectsData.projects.length
            };

            // Get first project details if no specific project
            if (!projectMetrics && projectsData.projects[0]) {
              projectMetrics = projectsData.projects[0];
            }
          }
        }
      } catch (err) {
        console.error('[Neon API] Error fetching projects:', err);
      }
    }

    // Define limits based on plan (Free tier defaults)
    const limits = {
      computeHours: parseFloat(process.env.NEON_COMPUTE_LIMIT || '100'),
      storageGB: parseFloat(process.env.NEON_STORAGE_LIMIT || '0.5'),
      branches: parseInt(process.env.NEON_BRANCH_LIMIT || '10'),
      networkTransferGB: parseFloat(process.env.NEON_NETWORK_LIMIT || '5')
    };

    // Calculate costs (overage-based pricing)
    const costs = {
      compute: {
        used: parseFloat(metrics?.computeHours || 0),
        freeLimit: limits.computeHours,
        overage: Math.max(0, parseFloat(metrics?.computeHours || 0) - limits.computeHours),
        pricePerUnit: NEON_PRICING.computePerHour,
        unit: 'hour',
        cost: Math.max(0, parseFloat(metrics?.computeHours || 0) - limits.computeHours) * NEON_PRICING.computePerHour
      },
      storage: {
        used: parseFloat(metrics?.storageSizeGB || 0),
        freeLimit: limits.storageGB,
        overage: Math.max(0, parseFloat(metrics?.storageSizeGB || 0) - limits.storageGB),
        pricePerUnit: NEON_PRICING.storagePerGBMonth,
        unit: 'GB/month',
        cost: Math.max(0, parseFloat(metrics?.storageSizeGB || 0) - limits.storageGB) * NEON_PRICING.storagePerGBMonth
      },
      writtenData: {
        used: parseFloat(metrics?.writtenDataGB || 0),
        pricePerUnit: NEON_PRICING.writtenDataPerGB,
        unit: 'GB',
        cost: parseFloat(metrics?.writtenDataGB || 0) * NEON_PRICING.writtenDataPerGB
      },
      dataTransfer: {
        used: parseFloat(metrics?.dataTransferGB || 0),
        pricePerUnit: NEON_PRICING.dataTransferPerGB,
        unit: 'GB',
        cost: parseFloat(metrics?.dataTransferGB || 0) * NEON_PRICING.dataTransferPerGB
      }
    };

    // Calculate total estimated cost
    costs.total = costs.compute.cost + costs.storage.cost + costs.writtenData.cost + costs.dataTransfer.cost;

    return res.status(200).json({
      configured: true,
      metrics,
      limits,
      costs,
      pricing: NEON_PRICING,
      project: projectMetrics ? {
        id: projectMetrics.id,
        name: projectMetrics.name,
        region: projectMetrics.region_id,
        createdAt: projectMetrics.created_at,
        branchCount: projectMetrics.branch_count
      } : null,
      billingPeriod: {
        start: billingPeriodStart,
        end: billingPeriodEnd
      }
    });

  } catch (error) {
    console.error('[Neon Usage] Error:', error);
    return res.status(500).json({
      error: 'Failed to fetch Neon usage',
      details: error.message
    });
  }
}
