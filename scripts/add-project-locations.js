const { PrismaClient } = require('@prisma/client');

const prisma = new PrismaClient();

// Sample locations for different projects
const sampleLocations = [
  {
    lat: 45.5017,
    lng: -73.5673,
    address: "Montreal, QC, Canada"
  },
  {
    lat: 43.6532,
    lng: -79.3832,
    address: "Toronto, ON, Canada"
  },
  {
    lat: 49.2827,
    lng: -123.1207,
    address: "Vancouver, BC, Canada"
  },
  {
    lat: 51.0447,
    lng: -114.0719,
    address: "Calgary, AB, Canada"
  },
  {
    lat: 46.8139,
    lng: -71.2080,
    address: "Quebec City, QC, Canada"
  },
  {
    lat: 44.6488,
    lng: -63.5752,
    address: "Halifax, NS, Canada"
  }
];

async function addProjectLocations() {
  try {
    console.log('Adding location data to existing projects...');
    
    // Get all projects that don't have location data
    const projects = await prisma.projects.findMany({
      where: {
        location: null
      },
      select: {
        id: true,
        title: true,
        location: true
      }
    });

    console.log(`Found ${projects.length} projects without location data`);

    if (projects.length === 0) {
      console.log('No projects need location updates');
      return;
    }

    // Add random locations to projects
    for (let i = 0; i < projects.length; i++) {
      const project = projects[i];
      const locationIndex = i % sampleLocations.length;
      const location = sampleLocations[locationIndex];

      await prisma.projects.update({
        where: { id: project.id },
        data: {
          location: location
        }
      });

      console.log(`Updated project "${project.title}" with location: ${location.address}`);
    }

    console.log('✅ Successfully added location data to all projects');
    
  } catch (error) {
    console.error('❌ Error adding project locations:', error);
  } finally {
    await prisma.$disconnect();
  }
}

// Run the script
addProjectLocations();