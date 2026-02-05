/**
 * Internal API - Cloudflare R2 Storage Analytics
 * GET /api/internal/usage/r2
 *
 * Returns R2 storage metrics for the dashboard:
 * - Storage usage
 * - Object counts
 * - Estimated costs
 */

import prisma from '../../../../lib/prisma';
import { S3Client, ListObjectsV2Command } from '@aws-sdk/client-s3';

// R2 Pricing (as of 2024)
// Storage: $0.015 per GB/month
// Class A operations (writes): $4.50 per million
// Class B operations (reads): $0.36 per million
// Egress: Free to Internet
const R2_PRICING = {
  storagePerGBMonth: 0.015,
  classAPerMillion: 4.50, // Writes (PUT, POST, DELETE, LIST)
  classBPerMillion: 0.36, // Reads (GET, HEAD)
  egressPerGB: 0 // Free egress
};

const CLOUDFLARE_ACCOUNT_ID = process.env.CLOUDFLARE_ACCOUNT_ID || '923f49e1995e9f5e3f85d8b7ea48047a';
const R2_TOKEN = process.env.R2_TOKEN;
const BUCKET_NAME = 'edwindblobs';

// S3-compatible credentials for R2
const R2_ACCESS_KEY_ID = process.env.R2_ACCESS_KEY_ID;
const R2_SECRET_ACCESS_KEY = process.env.R2_SECRET_ACCESS_KEY;
const R2_ENDPOINT = `https://${CLOUDFLARE_ACCOUNT_ID}.r2.cloudflarestorage.com`;

export default async function handler(req, res) {
  if (req.method !== 'GET') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  try {
    // Check authentication (owner only)
    const userId = req.cookies.workos_user_id;
    if (!userId) {
      return res.status(401).json({ error: 'Not authenticated' });
    }

    const membership = await prisma.organization_memberships.findFirst({
      where: { userId },
      select: { workos_role: true }
    });

    if (!membership || membership.workos_role !== 'owner') {
      return res.status(403).json({ error: 'Owner access required' });
    }

    // Get R2 usage from usage_logs
    const now = new Date();
    const thirtyDaysAgo = new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000);
    const thisMonthStart = new Date(now.getFullYear(), now.getMonth(), 1);

    const [
      totalR2Operations,
      r2OperationsThisMonth,
      r2ByAction,
      totalR2Cost,
      allTimeUploads
    ] = await Promise.all([
      // Total R2 operations (all time)
      prisma.usage_logs.count({
        where: { provider: 'r2' }
      }),

      // R2 operations this month
      prisma.usage_logs.count({
        where: {
          provider: 'r2',
          createdAt: { gte: thisMonthStart }
        }
      }),

      // R2 operations by action
      prisma.usage_logs.groupBy({
        by: ['action'],
        where: {
          provider: 'r2',
          createdAt: { gte: thirtyDaysAgo }
        },
        _count: { id: true },
        _sum: { inputSize: true, estimatedCostUsd: true }
      }),

      // Total estimated cost (this month)
      prisma.usage_logs.aggregate({
        where: {
          provider: 'r2',
          createdAt: { gte: thisMonthStart }
        },
        _sum: { estimatedCostUsd: true, inputSize: true }
      }),

      // All time uploads (for storage estimate)
      prisma.usage_logs.aggregate({
        where: {
          provider: 'r2',
          success: true
        },
        _sum: { inputSize: true },
        _count: { id: true }
      })
    ]);

    // Try to get actual bucket stats using S3-compatible API
    let bucketStats = null;
    let cloudflareConfigured = false;

    // First try S3 API (more reliable for getting actual object list)
    if (R2_ACCESS_KEY_ID && R2_SECRET_ACCESS_KEY) {
      cloudflareConfigured = true;
      try {
        const s3Client = new S3Client({
          region: 'auto',
          endpoint: R2_ENDPOINT,
          credentials: {
            accessKeyId: R2_ACCESS_KEY_ID,
            secretAccessKey: R2_SECRET_ACCESS_KEY
          }
        });

        // List all objects in the bucket
        let totalBytes = 0;
        let objectCount = 0;
        let continuationToken = undefined;

        do {
          const command = new ListObjectsV2Command({
            Bucket: BUCKET_NAME,
            ContinuationToken: continuationToken
          });

          const response = await s3Client.send(command);

          if (response.Contents) {
            for (const obj of response.Contents) {
              totalBytes += obj.Size || 0;
              objectCount++;
            }
          }

          continuationToken = response.IsTruncated ? response.NextContinuationToken : undefined;
        } while (continuationToken);

        bucketStats = {
          name: BUCKET_NAME,
          objectCount,
          totalSizeBytes: totalBytes,
          totalSizeGB: totalBytes / (1024 * 1024 * 1024),
          totalSizeMB: totalBytes / (1024 * 1024),
          source: 's3_api'
        };

        console.log(`[R2 Usage] S3 API: Found ${objectCount} objects, ${(totalBytes / (1024 * 1024)).toFixed(2)} MB`);
      } catch (error) {
        console.warn('[R2 Usage] S3 API failed:', error.message);
      }
    }

    // Fallback to Cloudflare REST API for bucket info
    if (!bucketStats && R2_TOKEN && CLOUDFLARE_ACCOUNT_ID) {
      cloudflareConfigured = true;
      try {
        const bucketResponse = await fetch(
          `https://api.cloudflare.com/client/v4/accounts/${CLOUDFLARE_ACCOUNT_ID}/r2/buckets/${BUCKET_NAME}`,
          {
            headers: {
              'Authorization': `Bearer ${R2_TOKEN}`,
              'Content-Type': 'application/json'
            }
          }
        );

        if (bucketResponse.ok) {
          const bucketData = await bucketResponse.json();
          if (bucketData.success && bucketData.result) {
            bucketStats = {
              name: bucketData.result.name,
              location: bucketData.result.location || 'auto',
              createdAt: bucketData.result.creation_date,
              source: 'cloudflare_rest'
            };
          }
        }
      } catch (error) {
        console.warn('[R2 Usage] Failed to fetch Cloudflare bucket info:', error.message);
      }
    }

    // Calculate storage from all-time successful uploads
    const allTimeBytesUploaded = allTimeUploads._sum?.inputSize || 0;
    const allTimeObjectCount = allTimeUploads._count?.id || 0;
    const allTimeGBUploaded = allTimeBytesUploaded / (1024 * 1024 * 1024);

    // This month's uploads
    const monthBytesUploaded = totalR2Cost._sum?.inputSize || 0;
    const monthGBUploaded = monthBytesUploaded / (1024 * 1024 * 1024);

    // Estimate storage - prefer bucket stats from API, fallback to logged uploads
    const estimatedStorageGB = bucketStats?.totalSizeGB || allTimeGBUploaded;
    const estimatedObjectCount = bucketStats?.objectCount || allTimeObjectCount;
    const storageCost = estimatedStorageGB * R2_PRICING.storagePerGBMonth;

    // Operations cost
    const operationsCost = totalR2Cost._sum?.estimatedCostUsd || 0;

    // Format by action
    const byAction = r2ByAction.map(item => ({
      action: item.action,
      count: item._count.id,
      totalBytes: item._sum?.inputSize || 0,
      cost: item._sum?.estimatedCostUsd || 0
    }));

    // Also calculate MB for fallback
    const allTimeMBUploaded = allTimeBytesUploaded / (1024 * 1024);

    return res.status(200).json({
      configured: cloudflareConfigured,
      bucket: bucketStats ? {
        ...bucketStats,
        objectCount: bucketStats.objectCount || bucketStats.uploadCount || estimatedObjectCount
      } : {
        name: BUCKET_NAME,
        objectCount: estimatedObjectCount,
        totalSizeBytes: allTimeBytesUploaded,
        totalSizeGB: allTimeGBUploaded,
        totalSizeMB: allTimeMBUploaded,
        note: 'Estimated from upload logs (S3 API needed for exact count)'
      },
      usage: {
        totalOperations: totalR2Operations,
        operationsThisMonth: r2OperationsThisMonth,
        totalBytesUploaded: allTimeBytesUploaded,
        totalGBUploaded: Math.round(allTimeGBUploaded * 1000) / 1000,
        monthBytesUploaded,
        monthGBUploaded: Math.round(monthGBUploaded * 1000) / 1000
      },
      costs: {
        storage: Math.round(storageCost * 10000) / 10000,
        operations: Math.round(operationsCost * 10000) / 10000,
        total: Math.round((storageCost + operationsCost) * 10000) / 10000
      },
      byAction,
      pricing: R2_PRICING
    });

  } catch (error) {
    console.error('[R2 Usage] Error:', error);
    return res.status(500).json({ error: 'Failed to fetch R2 usage data' });
  }
}
