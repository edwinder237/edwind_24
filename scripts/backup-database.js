/**
 * Database Backup Script
 * Creates a JSON backup of all critical tables before schema migration
 * Uses raw SQL to avoid Prisma client schema conflicts
 */

const { PrismaClient } = require('@prisma/client');
const fs = require('fs');
const path = require('path');

const prisma = new PrismaClient();

async function backupDatabase() {
  console.log('🔄 Starting database backup...');

  const timestamp = new Date().toISOString().replace(/:/g, '-').split('.')[0];
  const backupDir = path.join(__dirname, '..', 'backups');

  // Create backups directory if it doesn't exist
  if (!fs.existsSync(backupDir)) {
    fs.mkdirSync(backupDir, { recursive: true });
  }

  const backupFile = path.join(backupDir, `backup-${timestamp}.json`);

  try {
    // Backup critical tables using raw SQL (avoids schema mismatch)
    const backup = {
      timestamp,
      users: await prisma.$queryRaw`SELECT * FROM users`,
      organizations: await prisma.$queryRaw`SELECT * FROM organizations`,
      sub_organizations: await prisma.$queryRaw`SELECT * FROM sub_organizations`,
      projects: await prisma.$queryRaw`SELECT * FROM projects`,
      participants: await prisma.$queryRaw`SELECT * FROM participants`,
      instructors: await prisma.$queryRaw`SELECT * FROM instructors`,
      courses: await prisma.$queryRaw`SELECT * FROM courses`,
    };

    // Write backup to file
    fs.writeFileSync(backupFile, JSON.stringify(backup, null, 2));

    console.log('✅ Backup completed successfully!');
    console.log(`📁 Backup file: ${backupFile}`);
    console.log(`📊 Backed up:`);
    console.log(`   - ${backup.users.length} users`);
    console.log(`   - ${backup.organizations.length} organizations`);
    console.log(`   - ${backup.sub_organizations.length} sub_organizations`);
    console.log(`   - ${backup.projects.length} projects`);
    console.log(`   - ${backup.participants.length} participants`);
    console.log(`   - ${backup.instructors.length} instructors`);
    console.log(`   - ${backup.courses.length} courses`);

    return backupFile;
  } catch (error) {
    console.error('❌ Backup failed:', error);
    throw error;
  } finally {
    await prisma.$disconnect();
  }
}

// Run backup
backupDatabase()
  .then((file) => {
    console.log('\n✨ Backup process completed successfully!');
    process.exit(0);
  })
  .catch((error) => {
    console.error('\n💥 Backup process failed:', error);
    process.exit(1);
  });
