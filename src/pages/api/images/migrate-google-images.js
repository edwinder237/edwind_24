import prisma from '../../../lib/prisma';
import { uploadImageToR2 } from '../../../lib/r2-client-cloudflare';
import { createHandler } from '../../../lib/api/createHandler';

export default createHandler({
  scope: 'org',
  POST: async (req, res) => {
    const { dryRun = true } = req.body;

    // Find all projects with Google Maps image URLs
    const projectsWithGoogleImages = await prisma.projects.findMany({
      where: {
        AND: [
          {
            backgroundImg: {
              not: null
            }
          },
          {
            OR: [
              {
                backgroundImg: {
                  contains: 'maps.googleapis.com'
                }
              },
              {
                backgroundImg: {
                  contains: 'places.googleapis.com'
                }
              },
              {
                backgroundImg: {
                  contains: 'googleusercontent.com'
                }
              }
            ]
          }
        ]
      },
      select: {
        id: true,
        title: true,
        backgroundImg: true,
        location: true
      }
    });

    const results = [];
    let successCount = 0;
    let failureCount = 0;

    for (const project of projectsWithGoogleImages) {
      const result = {
        projectId: project.id,
        projectTitle: project.title,
        originalUrl: project.backgroundImg,
        newUrl: null,
        success: false,
        error: null
      };

      try {
        if (!dryRun) {
          // Upload the image to R2
          const uploadResult = await uploadImageToR2(project.backgroundImg, 'projects');
          result.newUrl = uploadResult.url;
          
          // Update the project with the new R2 URL
          await prisma.projects.update({
            where: { id: project.id },
            data: { 
              backgroundImg: uploadResult.url,
              // Store original URL in a metadata field if it exists
              // originalBackgroundImg: project.backgroundImg 
            }
          });
          
          result.success = true;
          successCount++;
        } else {
          result.newUrl = '[DRY RUN - Would upload to R2]';
          result.success = true;
          successCount++;
        }
      } catch (error) {
        result.error = error.message;
        failureCount++;
        console.error(`✗ Failed to migrate project ${project.id}:`, error);
      }

      results.push(result);
    }

    const summary = {
      totalProjects: projectsWithGoogleImages.length,
      successful: successCount,
      failed: failureCount,
      dryRun
    };

    res.status(200).json({
      success: true,
      message: dryRun 
        ? `Dry run completed: ${projectsWithGoogleImages.length} projects found with Google Maps images`
        : `Migration completed: ${successCount} successful, ${failureCount} failed`,
      data: {
        summary,
        results
      }
    });
  }
});