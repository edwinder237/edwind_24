#!/usr/bin/env node
/**
 * Fix Project Tags Utility
 * 
 * This script fixes projects that have object-based tags stored in the database
 * and converts them to simple string arrays.
 */

const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function fixProjectTags() {
  try {
    console.log('🔍 Fetching projects with tags...');
    
    const projectsWithTags = await prisma.projects.findMany({
      where: {
        tags: {
          not: null
        }
      },
      select: {
        id: true,
        title: true,
        tags: true
      }
    });

    console.log(`Found ${projectsWithTags.length} projects with tags`);

    for (const project of projectsWithTags) {
      console.log(`\n📋 Processing project: "${project.title}" (ID: ${project.id})`);
      console.log(`Current tags:`, project.tags);
      
      let parsedTags;
      let needsUpdate = false;
      
      try {
        // Parse the tags
        parsedTags = typeof project.tags === 'string' 
          ? JSON.parse(project.tags) 
          : project.tags;
        
        if (Array.isArray(parsedTags)) {
          // Convert any object tags to strings
          const stringTags = parsedTags.map(tag => {
            if (typeof tag === 'string') {
              return tag;
            } else if (tag && typeof tag === 'object') {
              needsUpdate = true;
              // Extract string value from object
              const title = tag.title || tag.label || tag.name || tag.text;
              if (title) return title;
              
              // Try to find first string value in object
              const stringValues = Object.values(tag).filter(v => typeof v === 'string' && v.length > 0);
              return stringValues[0] || 'Unknown';
            } else {
              needsUpdate = true;
              return String(tag || 'Unknown');
            }
          });
          
          if (needsUpdate) {
            console.log(`✅ Updating tags to:`, stringTags);
            
            await prisma.projects.update({
              where: { id: project.id },
              data: {
                tags: JSON.stringify(stringTags)
              }
            });
            
            console.log(`✅ Updated project "${project.title}"`);
          } else {
            console.log(`✅ No update needed for project "${project.title}"`);
          }
        }
      } catch (error) {
        console.error(`❌ Error processing project "${project.title}":`, error);
      }
    }

    console.log('\n🎉 Tag fixing complete!');

  } catch (error) {
    console.error('❌ Error fixing project tags:', error);
  } finally {
    await prisma.$disconnect();
  }
}

// Run the fix
fixProjectTags();