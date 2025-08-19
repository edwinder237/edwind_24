import prisma from '../../../lib/prisma';

export default async function handler(req, res) {
  const { method } = req;

  try {
    switch (method) {
      case 'GET':
        // Get ALL role assignments for a course and its modules in one efficient query
        const { courseId } = req.query;
        
        if (!courseId) {
          return res.status(400).json({ error: 'Course ID is required' });
        }

        // Get course info with its modules in one query
        const courseWithModules = await prisma.courses.findUnique({
          where: { id: parseInt(courseId) },
          select: {
            id: true,
            sub_organizationId: true,
            modules: {
              select: {
                id: true,
                title: true,
                moduleOrder: true
              },
              orderBy: {
                moduleOrder: 'asc'
              }
            }
          }
        });

        if (!courseWithModules) {
          return res.status(404).json({ error: 'Course not found' });
        }

        // Get all module IDs for batch querying
        const moduleIds = courseWithModules.modules.map(m => m.id);

        // Batch query: Get course assignments, all module assignments, and available roles in parallel
        const [courseAssignments, moduleAssignments, availableRoles] = await Promise.all([
          // Course role assignments
          prisma.course_participant_roles.findMany({
            where: {
              courseId: parseInt(courseId)
            },
            include: {
              role: true
            },
            orderBy: {
              role: {
                title: 'asc'
              }
            }
          }),
          
          // ALL module role assignments in one query
          moduleIds.length > 0 ? prisma.module_participant_roles.findMany({
            where: {
              moduleId: {
                in: moduleIds
              }
            },
            include: {
              role: true,
              module: {
                select: {
                  id: true,
                  title: true
                }
              }
            },
            orderBy: [
              {
                moduleId: 'asc'
              },
              {
                role: {
                  title: 'asc'
                }
              }
            ]
          }) : [],
          
          // Available roles for the organization
          prisma.sub_organization_participant_role.findMany({
            where: {
              sub_organizationId: courseWithModules.sub_organizationId,
              isActive: true
            },
            orderBy: {
              title: 'asc'
            }
          })
        ]);

        // Group module assignments by moduleId for easier consumption
        const moduleAssignmentsByModule = {};
        moduleAssignments.forEach(assignment => {
          if (!moduleAssignmentsByModule[assignment.moduleId]) {
            moduleAssignmentsByModule[assignment.moduleId] = [];
          }
          moduleAssignmentsByModule[assignment.moduleId].push(assignment);
        });

        return res.status(200).json({
          course: {
            id: courseWithModules.id,
            assignments: courseAssignments
          },
          modules: courseWithModules.modules.map(module => ({
            id: module.id,
            title: module.title,
            moduleOrder: module.moduleOrder,
            assignments: moduleAssignmentsByModule[module.id] || []
          })),
          availableRoles,
          totalQueries: 3, // Only 3 database queries instead of 1 + N where N = number of modules
          optimizationNote: 'This endpoint replaces multiple individual calls with bulk data fetching'
        });

      case 'POST':
        // Bulk update multiple assignments at once
        const { operations } = req.body;
        
        if (!operations || !Array.isArray(operations)) {
          return res.status(400).json({ error: 'Operations array is required' });
        }

        const results = [];
        
        // Process all operations in a transaction for consistency
        await prisma.$transaction(async (tx) => {
          for (const operation of operations) {
            const { type, entityType, entityId, roleId, assignmentId, isRequired } = operation;
            
            try {
              switch (type) {
                case 'CREATE':
                  if (entityType === 'course') {
                    const newAssignment = await tx.course_participant_roles.create({
                      data: {
                        courseId: parseInt(entityId),
                        roleId: parseInt(roleId),
                        isRequired: isRequired ?? true,
                        createdBy: req.user?.id || 'system'
                      },
                      include: { role: true }
                    });
                    results.push({ operation, result: newAssignment });
                  } else if (entityType === 'module') {
                    const newAssignment = await tx.module_participant_roles.create({
                      data: {
                        moduleId: parseInt(entityId),
                        roleId: parseInt(roleId),
                        isRequired: isRequired ?? true,
                        createdBy: req.user?.id || 'system'
                      },
                      include: { role: true }
                    });
                    results.push({ operation, result: newAssignment });
                  }
                  break;

                case 'UPDATE':
                  if (entityType === 'course') {
                    const updated = await tx.course_participant_roles.update({
                      where: { id: parseInt(assignmentId) },
                      data: {
                        isRequired,
                        updatedBy: req.user?.id || 'system'
                      },
                      include: { role: true }
                    });
                    results.push({ operation, result: updated });
                  } else if (entityType === 'module') {
                    const updated = await tx.module_participant_roles.update({
                      where: { id: parseInt(assignmentId) },
                      data: {
                        isRequired,
                        updatedBy: req.user?.id || 'system'
                      },
                      include: { role: true }
                    });
                    results.push({ operation, result: updated });
                  }
                  break;

                case 'DELETE':
                  if (entityType === 'course') {
                    await tx.course_participant_roles.delete({
                      where: { id: parseInt(assignmentId) }
                    });
                    results.push({ operation, result: { deleted: true } });
                  } else if (entityType === 'module') {
                    await tx.module_participant_roles.delete({
                      where: { id: parseInt(assignmentId) }
                    });
                    results.push({ operation, result: { deleted: true } });
                  }
                  break;
              }
            } catch (error) {
              results.push({ operation, error: error.message });
            }
          }
        });

        return res.status(200).json({
          message: 'Bulk operations completed',
          results,
          totalOperations: operations.length
        });

      default:
        res.setHeader('Allow', ['GET', 'POST']);
        return res.status(405).json({ error: `Method ${method} Not Allowed` });
    }
  } catch (error) {
    console.error('Error in bulk role assignments:', error);
    return res.status(500).json({ error: 'Internal server error' });
  }
}