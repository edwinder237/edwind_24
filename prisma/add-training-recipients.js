require('dotenv').config({ path: '.env.local' });
const { PrismaClient } = require('@prisma/client');

const prisma = new PrismaClient();

async function addTrainingRecipients() {
  console.log('🏢 Adding training recipients...');

  try {
    // Get the first sub-organization
    const subOrg = await prisma.sub_organizations.findFirst();
    if (!subOrg) {
      console.log('❌ No sub-organization found. Please run the main seed script first.');
      return;
    }

    const recipients = [
      {
        name: 'TechCorp Solutions',
        description: 'Leading technology solutions provider',
        contactPerson: 'John Manager',
        email: 'contact@techcorp.com',
        phone: '+1-555-0123',
        industry: 'Technology',
        address: '123 Tech Street, Silicon Valley, CA',
        website: 'https://techcorp.com',
        taxId: 'TC-12345',
        notes: 'Preferred client for advanced technical training',
        sub_organizationId: subOrg.id,
        createdBy: 'system'
      },
      {
        name: 'Healthcare Innovations Inc',
        description: 'Medical technology and healthcare services',
        contactPerson: 'Dr. Sarah Williams',
        email: 'training@healthinnovations.com',
        phone: '+1-555-0456',
        industry: 'Healthcare',
        address: '456 Medical Center Dr, Boston, MA',
        website: 'https://healthinnovations.com',
        taxId: 'HI-67890',
        notes: 'Specializes in medical device training',
        sub_organizationId: subOrg.id,
        createdBy: 'system'
      },
      {
        name: 'Global Finance Group',
        description: 'International financial services corporation',
        contactPerson: 'Michael Chen',
        email: 'hr@globalfinance.com',
        phone: '+1-555-0789',
        industry: 'Finance',
        address: '789 Wall Street, New York, NY',
        website: 'https://globalfinance.com',
        taxId: 'GF-11111',
        notes: 'Regular quarterly compliance training sessions',
        sub_organizationId: subOrg.id,
        createdBy: 'system'
      },
      {
        name: 'Manufacturing Excellence Ltd',
        description: 'Automotive and industrial manufacturing',
        contactPerson: 'Lisa Rodriguez',
        email: 'training@mexcellence.com',
        phone: '+1-555-0321',
        industry: 'Manufacturing',
        address: '321 Industrial Blvd, Detroit, MI',
        website: 'https://mexcellence.com',
        taxId: 'ME-22222',
        notes: 'Safety and quality training focus',
        sub_organizationId: subOrg.id,
        createdBy: 'system'
      },
      {
        name: 'Educational Partners Network',
        description: 'Educational institution consortium',
        contactPerson: 'Prof. David Kumar',
        email: 'partnerships@edunetwork.org',
        phone: '+1-555-0654',
        industry: 'Education',
        address: '654 University Ave, Chicago, IL',
        website: 'https://edunetwork.org',
        taxId: 'EP-33333',
        notes: 'Focus on educator professional development',
        sub_organizationId: subOrg.id,
        createdBy: 'system'
      }
    ];

    for (const recipient of recipients) {
      // Check if recipient already exists
      const existing = await prisma.training_recipients.findFirst({
        where: { name: recipient.name }
      });

      if (!existing) {
        await prisma.training_recipients.create({ data: recipient });
        console.log(`✅ Created: ${recipient.name}`);
      } else {
        console.log(`⏭️  Skipped: ${recipient.name} (already exists)`);
      }
    }

    console.log('🎉 Training recipients setup complete!');
  } catch (error) {
    console.error('❌ Error adding training recipients:', error);
  } finally {
    await prisma.$disconnect();
  }
}

addTrainingRecipients();