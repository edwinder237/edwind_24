require('dotenv').config({ path: '.env.local' });
const { PrismaClient } = require('@prisma/client');

const prisma = new PrismaClient();

async function addProjectCurriculums() {
  console.log('🔗 Adding project curriculum relationships for project 12...');
  
  try {
    // First, let's check if project 12 exists
    const project = await prisma.projects.findUnique({
      where: { id: 12 }
    });
    
    if (!project) {
      console.log('❌ Project 12 not found. Cannot add curriculum relationships.');
      return;
    }
    
    console.log(`✅ Found project: ${project.title}`);
    
    // Get all available curriculums
    const curriculums = await prisma.curriculums.findMany({
      include: {
        curriculum_courses: {
          include: {
            course: true
          }
        }
      }
    });
    
    console.log(`📚 Found ${curriculums.length} curriculums in database`);
    
    if (curriculums.length === 0) {
      console.log('❌ No curriculums found. Please run the main seed script first.');
      return;
    }
    
    // Check existing project curriculum relationships
    const existingRelationships = await prisma.project_curriculums.findMany({
      where: { projectId: 12 }
    });
    
    console.log(`🔍 Found ${existingRelationships.length} existing curriculum relationships for project 12`);
    
    // Add relationships for the newly seeded curriculums (skip existing ones)
    const newCurriculums = curriculums.filter(c => 
      c.title.includes('Web Development') || 
      c.title.includes('Executive Leadership') ||
      c.title.includes('Full Stack')
    );
    
    console.log(`🎯 Targeting ${newCurriculums.length} new curriculums for linking`);
    const curriculumsToLink = newCurriculums;
    const newRelationships = [];
    
    for (const curriculum of curriculumsToLink) {
      // Check if relationship already exists
      const exists = existingRelationships.find(rel => rel.curriculumId === curriculum.id);
      
      if (!exists) {
        try {
          const relationship = await prisma.project_curriculums.create({
            data: {
              projectId: 12,
              curriculumId: curriculum.id
            }
          });
          newRelationships.push(relationship);
          console.log(`✅ Linked curriculum "${curriculum.title}" to project 12`);
        } catch (error) {
          if (error.code === 'P2002') {
            console.log(`⚠️ Curriculum "${curriculum.title}" already linked to project 12`);
          } else {
            console.error(`❌ Error linking curriculum "${curriculum.title}":`, error.message);
          }
        }
      } else {
        console.log(`⚠️ Curriculum "${curriculum.title}" already linked to project 12`);
      }
    }
    
    // Verify final state
    const finalRelationships = await prisma.project_curriculums.findMany({
      where: { projectId: 12 },
      include: {
        curriculum: {
          include: {
            curriculum_courses: {
              include: {
                course: true
              }
            }
          }
        }
      }
    });
    
    console.log('\n📊 Final project curriculum relationships for project 12:');
    finalRelationships.forEach((rel, index) => {
      const courseCount = rel.curriculum.curriculum_courses.length;
      console.log(`${index + 1}. ${rel.curriculum.title} (${courseCount} courses)`);
      rel.curriculum.curriculum_courses.forEach(cc => {
        console.log(`   - ${cc.course.title}`);
      });
    });
    
    console.log(`\n✅ Successfully completed! Project 12 now has ${finalRelationships.length} curriculum relationships.`);
    
  } catch (error) {
    console.error('❌ Error adding project curriculum relationships:', error);
  }
}

addProjectCurriculums()
  .catch((e) => {
    console.error('❌ Unexpected error:', e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });