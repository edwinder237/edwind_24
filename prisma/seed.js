require('dotenv').config({ path: '.env.local' });
const { PrismaClient } = require('@prisma/client');

const prisma = new PrismaClient();

async function main() {
  console.log('🌱 Starting database seeding...');

  // Create organization
  console.log('📋 Creating organization...');
  const organization = await prisma.organizations.create({
    data: {
      title: 'EDWIND Learning Organization',
      description: 'A comprehensive learning and development organization',
      createdBy: 'system',
      updatedby: 'system',
      published: true,
      status: 'active',
      type: 'educational',
      info: {
        contact_person: 'John Doe',
        email: 'contact@edwind.com',
        phone: '+1-555-0123',
        address: '123 Learning Street, Education City, EC 12345',
        industry: 'Education & Training',
        website: 'https://edwind.com',
        tax_id: 'EIN-123456789'
      }
    }
  });

  // Create sub-organization
  console.log('🏢 Creating sub-organization...');
  const subOrganization = await prisma.sub_organizations.create({
    data: {
      title: 'Training Department',
      description: 'Main training and curriculum department',
      createdBy: 'system',
      updatedby: 'system',
      organizationId: organization.id
    }
  });

  // Create system user
  console.log('👤 Creating system user...');
  const systemUser = await prisma.user.upsert({
    where: { email: 'admin@edwind.com' },
    update: {},
    create: {
      name: 'System Administrator',
      email: 'admin@edwind.com',
      username: 'sysadmin',
      password: 'system_managed',
      firstName: 'System',
      lastName: 'Administrator',
      isActive: true,
      info: {
        bio: 'System administrator account for course management',
        phone: '+1-555-0100'
      },
      sub_organizationId: subOrganization.id
    }
  });

  // Create tags for courses
  console.log('🏷️ Creating course tags...');
  const tags = await Promise.all([
    prisma.tags.create({ data: { title: 'Programming' } }),
    prisma.tags.create({ data: { title: 'Leadership' } }),
    prisma.tags.create({ data: { title: 'Design' } }),
    prisma.tags.create({ data: { title: 'Business' } }),
    prisma.tags.create({ data: { title: 'Technology' } }),
    prisma.tags.create({ data: { title: 'Beginner' } }),
    prisma.tags.create({ data: { title: 'Intermediate' } }),
    prisma.tags.create({ data: { title: 'Advanced' } })
  ]);

  // Create 5 courses
  console.log('📚 Creating 5 courses...');
  
  const course1 = await prisma.courses.create({
    data: {
      title: 'JavaScript Fundamentals',
      summary: 'Learn the basics of JavaScript programming language including variables, functions, and DOM manipulation.',
      language: 'English',
      deliveryMethod: 'Online',
      cost: 299.99,
      level: 'Beginner',
      certification: 'Certificate of Completion',
      CourseType: 'Technical',
      courseCategory: 'Programming',
      courseStatus: 'Published',
      isActive: true,
      targetAudience: 'Developers, Students',
      published: true,
      backgroundImg: 'https://images.unsplash.com/photo-1627398242454-45a1465c2479?w=800',
      code: 'FSEC01',
      version: '1.2.6.332',
      rating: 4.7,
      createdBy: systemUser.id,
      sub_organizationId: subOrganization.id,
      modules: {
        create: [
          {
            title: 'Introduction to JavaScript',
            summary: 'Getting started with JavaScript syntax and basic concepts',
            content: 'Learn about variables, data types, and basic operations in JavaScript.',
            moduleStatus: 'Published',
            published: true,
            moduleOrder: 1,
            activities: {
              create: [
                {
                  title: 'Variables and Data Types',
                  summary: 'Understanding different data types in JavaScript',
                  content: 'Practice with strings, numbers, booleans, and arrays.',
                  duration: 25,
                  activityType: 'Exercise',
                  activityCategory: 'Exercise',
                  activityStatus: 'Published',
                  published: true,
                  ActivityOrder: 1
                },
                {
                  title: 'Basic Operations Quiz',
                  summary: 'Test your knowledge of JavaScript operators',
                  content: 'Multiple choice quiz on arithmetic and logical operators.',
                  duration: 20,
                  activityType: 'Quiz',
                  activityCategory: 'Quiz',
                  activityStatus: 'Published',
                  published: true,
                  ActivityOrder: 2
                },
                {
                  title: 'Syntax Practice Lab',
                  summary: 'Hands-on practice with JavaScript syntax',
                  content: 'Interactive coding exercises for JavaScript basics.',
                  duration: 45,
                  activityType: 'Exercise',
                  activityCategory: 'Exercise',
                  activityStatus: 'Published',
                  published: true,
                  ActivityOrder: 3
                }
              ]
            }
          },
          {
            title: 'Functions and Scope',
            summary: 'Understanding JavaScript functions and variable scope',
            content: 'Learn how to create and use functions, understand scope and closures.',
            duration: 120,
            moduleStatus: 'Published',
            published: true,
            moduleOrder: 2,
            activities: {
              create: [
                {
                  title: 'Creating Functions',
                  summary: 'Practice creating different types of functions',
                  content: 'Learn function declarations, expressions, and arrow functions.',
                  duration: 35,
                  activityType: 'Interactive',
                  activityCategory: 'Exercise',
                  activityStatus: 'Published',
                  published: true,
                  ActivityOrder: 1
                },
                {
                  title: 'Scope and Closures Deep Dive',
                  summary: 'Advanced concepts in JavaScript scope management',
                  content: 'Master variable scope, lexical scoping, and closure patterns.',
                  duration: 40,
                  activityType: 'Reading',
                  activityCategory: 'Reading',
                  activityStatus: 'Published',
                  published: true,
                  ActivityOrder: 2
                },
                {
                  title: 'Function Practice Workshop',
                  summary: 'Build real-world functions with proper scope handling',
                  content: 'Hands-on workshop building utility functions and modules.',
                  duration: 30,
                  activityType: 'Workshop',
                  activityCategory: 'Exercise',
                  activityStatus: 'Published',
                  published: true,
                  ActivityOrder: 3
                }
              ]
            }
          },
          {
            title: 'DOM Manipulation & Events',
            summary: 'Working with the Document Object Model and event handling',
            content: 'Learn to interact with web pages dynamically through JavaScript.',
            moduleStatus: 'Published',
            published: true,
            moduleOrder: 3,
            activities: {
              create: [
                {
                  title: 'DOM Selectors and Manipulation',
                  summary: 'Select and modify HTML elements with JavaScript',
                  content: 'Practice using querySelector, getElementById, and element modification.',
                  duration: 60,
                  activityType: 'Interactive',
                  activityCategory: 'Exercise',
                  activityStatus: 'Published',
                  published: true,
                  ActivityOrder: 1
                },
                {
                  title: 'Event Handling Quiz',
                  summary: 'Test your understanding of JavaScript events',
                  content: 'Quiz covering event listeners, event propagation, and event objects.',
                  duration: 25,
                  activityType: 'Quiz',
                  activityCategory: 'Quiz',
                  activityStatus: 'Published',
                  published: true,
                  ActivityOrder: 2
                },
                {
                  title: 'Interactive Web Page Project',
                  summary: 'Build a dynamic web page with JavaScript',
                  content: 'Create an interactive to-do list application.',
                  duration: 50,
                  activityType: 'Project',
                  activityCategory: 'Project',
                  activityStatus: 'Published',
                  published: true,
                  ActivityOrder: 3
                }
              ]
            }
          }
        ]
      }
    }
  });

  const course2 = await prisma.courses.create({
    data: {
      title: 'Leadership Excellence',
      summary: 'Develop essential leadership skills for managing teams and driving organizational success.',
      language: 'English',
      deliveryMethod: 'Blended',
      cost: 599.99,
      level: 'Intermediate',
      certification: 'Leadership Certificate',
      CourseType: 'Soft Skills',
      courseCategory: 'Leadership',
      courseStatus: 'Published',
      isActive: true,
      targetAudience: 'Managers, Team Leaders',
      published: true,
      backgroundImg: 'https://images.unsplash.com/photo-1556761175-b413da4baf72?w=800',
      code: 'LEAD-201',
      version: '2.1',
      rating: 4.9,
      createdBy: systemUser.id,
      sub_organizationId: subOrganization.id,
      modules: {
        create: [
          {
            title: 'Leadership Fundamentals',
            summary: 'Core principles of effective leadership',
            content: 'Understanding leadership styles, emotional intelligence, and communication.',
            moduleStatus: 'Published',
            published: true,
            moduleOrder: 1,
            activities: {
              create: [
                {
                  title: 'Leadership Style Assessment',
                  summary: 'Discover your natural leadership style',
                  content: 'Complete a comprehensive assessment to understand your leadership approach.',
                  duration: 45,
                  activityType: 'Assessment',
                  activityCategory: 'Self-Assessment',
                  activityStatus: 'Published',
                  published: true,
                  ActivityOrder: 1
                },
                {
                  title: 'Communication Skills Workshop',
                  summary: 'Develop effective leadership communication',
                  content: 'Practice active listening, feedback delivery, and public speaking.',
                  duration: 60,
                  activityType: 'Workshop',
                  activityCategory: 'Exercise',
                  activityStatus: 'Published',
                  published: true,
                  ActivityOrder: 2
                },
                {
                  title: 'Team Management Simulation',
                  summary: 'Practice leadership in simulated scenarios',
                  content: 'Role-playing exercises with challenging team situations.',
                  duration: 45,
                  activityType: 'Simulation',
                  activityCategory: 'Exercise',
                  activityStatus: 'Published',
                  published: true,
                  ActivityOrder: 3
                }
              ]
            }
          },
          {
            title: 'Strategic Decision Making',
            summary: 'Advanced leadership techniques for strategic thinking',
            content: 'Learn frameworks for complex decision making and strategic planning.',
            duration: 200, // Override: calculated would be 180 from activities
            moduleStatus: 'Published',
            published: true,
            moduleOrder: 2,
            activities: {
              create: [
                {
                  title: 'Decision Framework Analysis',
                  summary: 'Study various decision-making frameworks',
                  content: 'Compare and contrast different strategic decision models.',
                  duration: 90,
                  activityType: 'Case Study',
                  activityCategory: 'Analysis',
                  activityStatus: 'Published',
                  published: true,
                  ActivityOrder: 1
                },
                {
                  title: 'Strategic Thinking Exercise',
                  summary: 'Apply strategic frameworks to real scenarios',
                  content: 'Work through complex business scenarios using strategic tools.',
                  duration: 90,
                  activityType: 'Exercise',
                  activityCategory: 'Case Study',
                  activityStatus: 'Published',
                  published: true,
                  ActivityOrder: 2
                }
              ]
            }
          }
        ]
      }
    }
  });

  const course3 = await prisma.courses.create({
    data: {
      title: 'UI/UX Design Principles',
      summary: 'Master the fundamentals of user interface and user experience design.',
      language: 'English',
      deliveryMethod: 'Online',
      cost: 449.99,
      level: 'Beginner',
      certification: 'Design Certificate',
      CourseType: 'Creative',
      courseCategory: 'Design',
      courseStatus: 'Published',
      isActive: true,
      targetAudience: 'Designers, Developers, Product Managers',
      published: true,
      backgroundImg: 'https://images.unsplash.com/photo-1561070791-2526d30994b5?w=800',
      code: 'UXUI-101',
      version: '1.5',
      rating: 4.6,
      createdBy: systemUser.id,
      sub_organizationId: subOrganization.id,
      modules: {
        create: [
          {
            title: 'Design Thinking Process',
            summary: 'Understanding the design thinking methodology',
            content: 'Learn the 5 stages of design thinking: Empathize, Define, Ideate, Prototype, Test.',
            moduleStatus: 'Published',
            published: true,
            moduleOrder: 1,
            activities: {
              create: [
                {
                  title: 'User Persona Creation',
                  summary: 'Create detailed user personas for your project',
                  content: 'Practice creating comprehensive user personas using real data.',
                  duration: 35,
                  activityType: 'Interactive',
                  activityCategory: 'Project',
                  activityStatus: 'Published',
                  published: true,
                  ActivityOrder: 1
                },
                {
                  title: 'Wireframing Workshop',
                  summary: 'Create low and high-fidelity wireframes',
                  content: 'Practice wireframing techniques using design tools.',
                  duration: 40,
                  activityType: 'Workshop',
                  activityCategory: 'Exercise',
                  activityStatus: 'Published',
                  published: true,
                  ActivityOrder: 2
                },
                {
                  title: 'Usability Testing Basics',
                  summary: 'Learn fundamentals of user testing',
                  content: 'Plan and conduct basic usability testing sessions.',
                  duration: 30,
                  activityType: 'Interactive',
                  activityCategory: 'Exercise',
                  activityStatus: 'Published',
                  published: true,
                  ActivityOrder: 3
                }
              ]
            }
          },
          {
            title: 'Prototyping & User Testing',
            summary: 'Advanced prototyping techniques and user validation',
            content: 'Create interactive prototypes and validate designs with users.',
            duration: 150, // Override: calculated would be 120 from activities
            moduleStatus: 'Published',
            published: true,
            moduleOrder: 2,
            activities: {
              create: [
                {
                  title: 'Interactive Prototype Creation',
                  summary: 'Build clickable prototypes with design tools',
                  content: 'Use Figma or similar tools to create interactive prototypes.',
                  duration: 75,
                  activityType: 'Project',
                  activityCategory: 'Project',
                  activityStatus: 'Published',
                  published: true,
                  ActivityOrder: 1
                },
                {
                  title: 'User Testing Session',
                  summary: 'Conduct real user testing with your prototype',
                  content: 'Organize and run user testing sessions to validate designs.',
                  duration: 45,
                  activityType: 'Workshop',
                  activityCategory: 'Exercise',
                  activityStatus: 'Published',
                  published: true,
                  ActivityOrder: 2
                }
              ]
            }
          }
        ]
      }
    }
  });

  const course4 = await prisma.courses.create({
    data: {
      title: 'Business Strategy & Analytics',
      summary: 'Learn to develop effective business strategies using data-driven insights and analytics.',
      language: 'English',
      deliveryMethod: 'In-Person',
      cost: 899.99,
      level: 'Advanced',
      certification: 'Strategic Business Certificate',
      CourseType: 'Business',
      courseCategory: 'Strategy',
      courseStatus: 'Inactive',
      isActive: false,
      targetAudience: 'Executives, Business Analysts, Consultants',
      published: true,
      backgroundImg: 'https://images.unsplash.com/photo-1460925895917-afdab827c52f?w=800',
      code: 'BIZ-301',
      version: '3.0',
      rating: 4.8,
      createdBy: systemUser.id,
      sub_organizationId: subOrganization.id,
      modules: {
        create: [
          {
            title: 'Strategic Framework Development',
            summary: 'Building comprehensive business strategies',
            content: 'Learn SWOT analysis, Porter\'s Five Forces, and strategic planning frameworks.',
            moduleStatus: 'Published',
            published: true,
            moduleOrder: 1,
            activities: {
              create: [
                {
                  title: 'SWOT Analysis Workshop',
                  summary: 'Conduct a real business SWOT analysis',
                  content: 'Apply SWOT methodology to analyze a real business case.',
                  duration: 120,
                  activityType: 'Workshop',
                  activityCategory: 'Case Study',
                  activityStatus: 'Published',
                  published: true,
                  ActivityOrder: 1
                },
                {
                  title: 'Competitive Analysis Deep Dive',
                  summary: 'Comprehensive market and competitor analysis',
                  content: 'Learn to analyze competitive landscapes and market positioning.',
                  duration: 60,
                  activityType: 'Analysis',
                  activityCategory: 'Case Study',
                  activityStatus: 'Published',
                  published: true,
                  ActivityOrder: 2
                }
              ]
            }
          }
        ]
      }
    }
  });

  const course5 = await prisma.courses.create({
    data: {
      title: 'Cloud Computing Essentials',
      summary: 'Introduction to cloud computing concepts, services, and implementation strategies.',
      language: 'English',
      deliveryMethod: 'Online',
      cost: 399.99,
      level: 'Intermediate',
      certification: 'Cloud Fundamentals Certificate',
      CourseType: 'Technical',
      courseCategory: 'Technology',
      courseStatus: 'Published',
      isActive: true,
      targetAudience: 'IT Professionals, System Administrators, Developers',
      published: true,
      backgroundImg: 'https://images.unsplash.com/photo-1451187580459-43490279c0fa?w=800',
      code: 'CLOUD-201',
      version: '2.0',
      rating: 4.5,
      createdBy: systemUser.id,
      sub_organizationId: subOrganization.id,
      modules: {
        create: [
          {
            title: 'Cloud Service Models',
            summary: 'Understanding IaaS, PaaS, and SaaS',
            content: 'Explore different cloud service models and their use cases.',
            moduleStatus: 'Published',
            published: true,
            moduleOrder: 1,
            activities: {
              create: [
                {
                  title: 'Cloud Service Comparison',
                  summary: 'Compare major cloud providers',
                  content: 'Analyze AWS, Azure, and Google Cloud Platform services.',
                  duration: 75,
                  activityType: 'Research',
                  activityCategory: 'Analysis',
                  activityStatus: 'Published',
                  published: true,
                  ActivityOrder: 1
                },
                {
                  title: 'Cloud Security Fundamentals',
                  summary: 'Understanding cloud security best practices',
                  content: 'Learn about cloud security models, compliance, and risk management.',
                  duration: 60,
                  activityType: 'Reading',
                  activityCategory: 'Reading',
                  activityStatus: 'Published',
                  published: true,
                  ActivityOrder: 2
                }
              ]
            }
          },
          {
            title: 'Cloud Migration & Implementation',
            summary: 'Practical cloud migration strategies and execution',
            content: 'Learn to plan and execute cloud migration projects effectively.',
            duration: 180, // Override: calculated would be 150 from activities
            moduleStatus: 'Published',
            published: true,
            moduleOrder: 2,
            activities: {
              create: [
                {
                  title: 'Migration Planning Workshop',
                  summary: 'Plan a complete cloud migration strategy',
                  content: 'Design migration timelines, resource requirements, and risk mitigation.',
                  duration: 90,
                  activityType: 'Workshop',
                  activityCategory: 'Exercise',
                  activityStatus: 'Published',
                  published: true,
                  ActivityOrder: 1
                },
                {
                  title: 'Hands-on Migration Lab',
                  summary: 'Practice migrating applications to the cloud',
                  content: 'Step-by-step migration of sample applications to cloud platforms.',
                  duration: 60,
                  activityType: 'Lab',
                  activityCategory: 'Exercise',
                  activityStatus: 'Published',
                  published: true,
                  ActivityOrder: 2
                }
              ]
            }
          }
        ]
      }
    }
  });

  // Create course tags relationships
  console.log('🔗 Creating course-tag relationships...');
  await Promise.all([
    // JavaScript Fundamentals - Programming, Technology, Beginner
    prisma.course_tags.create({
      data: {
        courseId: course1.id,
        tagId: tags[0].id, // Programming
        sub_organizationId: subOrganization.id
      }
    }),
    prisma.course_tags.create({
      data: {
        courseId: course1.id,
        tagId: tags[4].id, // Technology
        sub_organizationId: subOrganization.id
      }
    }),
    prisma.course_tags.create({
      data: {
        courseId: course1.id,
        tagId: tags[5].id, // Beginner
        sub_organizationId: subOrganization.id
      }
    }),

    // Leadership Excellence - Leadership, Intermediate
    prisma.course_tags.create({
      data: {
        courseId: course2.id,
        tagId: tags[1].id, // Leadership
        sub_organizationId: subOrganization.id
      }
    }),
    prisma.course_tags.create({
      data: {
        courseId: course2.id,
        tagId: tags[6].id, // Intermediate
        sub_organizationId: subOrganization.id
      }
    }),

    // UI/UX Design - Design, Beginner
    prisma.course_tags.create({
      data: {
        courseId: course3.id,
        tagId: tags[2].id, // Design
        sub_organizationId: subOrganization.id
      }
    }),
    prisma.course_tags.create({
      data: {
        courseId: course3.id,
        tagId: tags[5].id, // Beginner
        sub_organizationId: subOrganization.id
      }
    }),

    // Business Strategy - Business, Advanced
    prisma.course_tags.create({
      data: {
        courseId: course4.id,
        tagId: tags[3].id, // Business
        sub_organizationId: subOrganization.id
      }
    }),
    prisma.course_tags.create({
      data: {
        courseId: course4.id,
        tagId: tags[7].id, // Advanced
        sub_organizationId: subOrganization.id
      }
    }),

    // Cloud Computing - Technology, Intermediate
    prisma.course_tags.create({
      data: {
        courseId: course5.id,
        tagId: tags[4].id, // Technology
        sub_organizationId: subOrganization.id
      }
    }),
    prisma.course_tags.create({
      data: {
        courseId: course5.id,
        tagId: tags[6].id, // Intermediate
        sub_organizationId: subOrganization.id
      }
    })
  ]);

  // Create topics for the organization
  console.log('🏷️ Creating topics...');
  const topics = await Promise.all([
    prisma.topics.create({
      data: {
        title: 'JAVASCRIPT',
        description: 'Client-side and server-side JavaScript programming',
        color: '#F7DF1E',
        icon: '🟨',
        sub_organizationId: subOrganization.id,
        createdBy: systemUser.id,
        updatedBy: systemUser.id
      }
    }),
    prisma.topics.create({
      data: {
        title: 'REACT',
        description: 'Modern React.js library for building user interfaces',
        color: '#61DAFB',
        icon: '⚛️',
        sub_organizationId: subOrganization.id,
        createdBy: systemUser.id,
        updatedBy: systemUser.id
      }
    }),
    prisma.topics.create({
      data: {
        title: 'NODE.JS',
        description: 'Server-side JavaScript runtime environment',
        color: '#339933',
        icon: '🟢',
        sub_organizationId: subOrganization.id,
        createdBy: systemUser.id,
        updatedBy: systemUser.id
      }
    }),
    prisma.topics.create({
      data: {
        title: 'PYTHON',
        description: 'General-purpose programming language for various applications',
        color: '#3776AB',
        icon: '🐍',
        sub_organizationId: subOrganization.id,
        createdBy: systemUser.id,
        updatedBy: systemUser.id
      }
    }),
    prisma.topics.create({
      data: {
        title: 'LEADERSHIP',
        description: 'Leadership skills and management techniques',
        color: '#FF6B35',
        icon: '👑',
        sub_organizationId: subOrganization.id,
        createdBy: systemUser.id,
        updatedBy: systemUser.id
      }
    }),
    prisma.topics.create({
      data: {
        title: 'UI/UX DESIGN',
        description: 'User interface and user experience design principles',
        color: '#FF007F',
        icon: '🎨',
        sub_organizationId: subOrganization.id,
        createdBy: systemUser.id,
        updatedBy: systemUser.id
      }
    }),
    prisma.topics.create({
      data: {
        title: 'CLOUD COMPUTING',
        description: 'Cloud infrastructure and services (AWS, Azure, GCP)',
        color: '#0066CC',
        icon: '☁️',
        sub_organizationId: subOrganization.id,
        createdBy: systemUser.id,
        updatedBy: systemUser.id
      }
    }),
    prisma.topics.create({
      data: {
        title: 'DATA SCIENCE',
        description: 'Data analysis, machine learning, and statistical modeling',
        color: '#FF9500',
        icon: '📊',
        sub_organizationId: subOrganization.id,
        createdBy: systemUser.id,
        updatedBy: systemUser.id
      }
    }),
    prisma.topics.create({
      data: {
        title: 'AGILE METHODOLOGY',
        description: 'Agile project management and development practices',
        color: '#00CED1',
        icon: '🔄',
        sub_organizationId: subOrganization.id,
        createdBy: systemUser.id,
        updatedBy: systemUser.id
      }
    }),
    prisma.topics.create({
      data: {
        title: 'BUSINESS STRATEGY',
        description: 'Strategic planning and business development',
        color: '#800080',
        icon: '💼',
        sub_organizationId: subOrganization.id,
        createdBy: systemUser.id,
        updatedBy: systemUser.id
      }
    }),
    prisma.topics.create({
      data: {
        title: 'CYBERSECURITY',
        description: 'Information security and cyber threat protection',
        color: '#DC143C',
        icon: '🔒',
        sub_organizationId: subOrganization.id,
        createdBy: systemUser.id,
        updatedBy: systemUser.id
      }
    }),
    prisma.topics.create({
      data: {
        title: 'DEVOPS',
        description: 'Development operations and CI/CD practices',
        color: '#4169E1',
        icon: '⚙️',
        sub_organizationId: subOrganization.id,
        createdBy: systemUser.id,
        updatedBy: systemUser.id
      }
    })
  ]);

  // Create 2 curriculums
  console.log('📖 Creating 2 curriculums...');
  
  const curriculum1 = await prisma.curriculums.create({
    data: {
      title: 'Web Development Foundation Track',
      description: 'A comprehensive curriculum covering the fundamentals of web development, from basic programming to UI/UX design principles.',
      curriculum_courses: {
        create: [
          { courseId: course1.id }, // JavaScript Fundamentals
          { courseId: course3.id }  // UI/UX Design Principles
        ]
      }
    }
  });

  const curriculum2 = await prisma.curriculums.create({
    data: {
      title: 'Executive Leadership & Technology Track',
      description: 'An advanced curriculum designed for executives and senior leaders focusing on leadership excellence, business strategy, and modern technology adoption.',
      curriculum_courses: {
        create: [
          { courseId: course2.id }, // Leadership Excellence
          { courseId: course4.id }, // Business Strategy & Analytics
          { courseId: course5.id }  // Cloud Computing Essentials
        ]
      }
    }
  });

  // Create a third curriculum for testing
  const curriculum3 = await prisma.curriculums.create({
    data: {
      title: 'Full Stack Development Bootcamp',
      description: 'Complete full-stack development training covering programming, design, business strategy, and cloud technologies.',
      curriculum_courses: {
        create: [
          { courseId: course1.id }, // JavaScript Fundamentals
          { courseId: course3.id }, // UI/UX Design Principles
          { courseId: course4.id }, // Business Strategy & Analytics
          { courseId: course5.id }  // Cloud Computing Essentials
        ]
      }
    }
  });

  // Create training recipients first (need to be created before participants)
  console.log('🏢 Creating training recipients...');
  const trainingRecipients = await Promise.all([
    prisma.training_recipients.create({
      data: {
        name: 'Honda Montreal',
        description: 'Honda dealership in Montreal, Quebec',
        sub_organizationId: subOrganization.id,
        createdBy: systemUser.id
      }
    }),
    prisma.training_recipients.create({
      data: {
        name: 'Toyota Downtown',
        description: 'Toyota dealership in downtown area',
        sub_organizationId: subOrganization.id,
        createdBy: systemUser.id
      }
    }),
    prisma.training_recipients.create({
      data: {
        name: 'Ford West End',
        description: 'Ford dealership in west end location',
        sub_organizationId: subOrganization.id,
        createdBy: systemUser.id
      }
    })
  ]);

  // Create sample participants (now linked to training recipients)
  console.log('👥 Creating sample participants...');
  const participants = await Promise.all([
    prisma.participants.create({
      data: {
        firstName: 'Alice',
        lastName: 'Johnson',
        email: 'alice.johnson@company.com',
        participantStatus: 'active',
        participantType: 'learner',
        derpartement: 'Engineering',
        roleId: null,
        notes: 'Experienced frontend developer looking to expand skills',
        profilePrefs: {
          notification_email: true,
          notification_sms: false,
          timezone: 'UTC-5'
        },
        credentials: {
          certifications: ['React Developer', 'Agile Certified']
        },
        createdBy: systemUser.id,
        updatedby: systemUser.id,
        sub_organization: subOrganization.id
      }
    }),
    prisma.participants.create({
      data: {
        firstName: 'Bob',
        lastName: 'Smith',
        email: 'bob.smith@company.com',
        participantStatus: 'active',
        participantType: 'learner',
                derpartement: 'Management',
        roleId: null,
        notes: 'Team lead seeking leadership development',
        profilePrefs: {
          notification_email: true,
          notification_sms: true,
          timezone: 'UTC-8'
        },
        credentials: {
          certifications: ['PMP', 'Scrum Master']
        },
        createdBy: systemUser.id,
        updatedby: systemUser.id,
        sub_organization: subOrganization.id
      }
    }),
    prisma.participants.create({
      data: {
        firstName: 'Carol',
        lastName: 'Davis',
        email: 'carol.davis@company.com',
        participantStatus: 'active',
        participantType: 'learner',
        derpartement: 'Design',
        roleId: null,
        notes: 'UX designer interested in full-stack development',
        profilePrefs: {
          notification_email: true,
          notification_sms: false,
          timezone: 'UTC-5'
        },
        credentials: {
          certifications: ['Adobe Certified', 'UX Certified']
        },
        createdBy: systemUser.id,
        updatedby: systemUser.id,
        sub_organization: subOrganization.id
      }
    }),
    prisma.participants.create({
      data: {
        firstName: 'David',
        lastName: 'Wilson',
        email: 'david.wilson@company.com',
        participantStatus: 'active',
        participantType: 'learner',
                derpartement: 'Operations',
        roleId: null,
        notes: 'Business analyst transitioning to technical roles',
        profilePrefs: {
          notification_email: true,
          notification_sms: true,
          timezone: 'UTC-6'
        },
        credentials: {
          certifications: ['Business Analysis', 'Six Sigma']
        },
        createdBy: systemUser.id,
        updatedby: systemUser.id,
        sub_organization: subOrganization.id
      }
    }),
    prisma.participants.create({
      data: {
        firstName: 'Eva',
        lastName: 'Brown',
        email: 'eva.brown2@company.com',
        participantStatus: 'active',
        participantType: 'learner',
                derpartement: 'IT',
        roleId: null,
        notes: 'DevOps engineer expanding cloud knowledge',
        profilePrefs: {
          notification_email: true,
          notification_sms: false,
          timezone: 'UTC-7'
        },
        credentials: {
          certifications: ['AWS Certified', 'Docker Certified']
        },
        createdBy: systemUser.id,
        updatedby: systemUser.id,
        sub_organization: subOrganization.id
      }
    })
  ]);

  // Create tool access records for participants
  console.log('🔧 Creating tool access records...');
  const toolAccessRecords = await Promise.all([
    // Alice Johnson - Frontend developer
    prisma.toolAccesses.create({
      data: {
        tool: 'crm',
        toolType: 'Customer Relationship Management',
        toolUrl: 'https://crm.company.com',
        toolDescription: 'Customer relationship management system for tracking leads and clients',
        username: 'alice_j_dev',
        accessCode: 'ALC123XYZ',
        participantId: participants[0].id,
        isActive: true,
        createdBy: systemUser.id
      }
    }),
    prisma.toolAccesses.create({
      data: {
        tool: 'figma',
        toolType: 'Design Tool',
        toolUrl: 'https://figma.com',
        toolDescription: 'Collaborative design and prototyping tool',
        username: 'alice.johnson.dev',
        accessCode: 'FGM789ABC',
        participantId: participants[0].id,
        isActive: true,
        createdBy: systemUser.id
      }
    }),
    prisma.toolAccesses.create({
      data: {
        tool: 'github',
        toolType: 'Version Control',
        toolUrl: 'https://github.com',
        toolDescription: 'Git repository hosting and collaboration platform',
        username: 'alice_johnson_fe',
        accessCode: 'GH456DEF',
        participantId: participants[0].id,
        isActive: true,
        createdBy: systemUser.id
      }
    }),

    // Bob Smith - Manager
    prisma.toolAccesses.create({
      data: {
        tool: 'jira',
        toolType: 'Project Management',
        toolUrl: 'https://company.atlassian.net',
        toolDescription: 'Agile project management and issue tracking',
        username: 'bob_smith_mgr',
        accessCode: 'JRA101GHI',
        participantId: participants[1].id,
        isActive: true,
        createdBy: systemUser.id
      }
    }),
    prisma.toolAccesses.create({
      data: {
        tool: 'salesforce',
        toolType: 'CRM Platform',
        toolUrl: 'https://company.salesforce.com',
        toolDescription: 'Enterprise customer relationship management platform',
        username: 'b.smith.manager',
        accessCode: 'SF202JKL',
        participantId: participants[1].id,
        isActive: true,
        createdBy: systemUser.id
      }
    }),
    prisma.toolAccesses.create({
      data: {
        tool: 'slack',
        toolType: 'Communication',
        toolUrl: 'https://company.slack.com',
        toolDescription: 'Team communication and collaboration platform',
        username: 'bob.smith.lead',
        accessCode: 'SLK303MNO',
        participantId: participants[1].id,
        isActive: true,
        createdBy: systemUser.id
      }
    }),

    // Carol Davis - Designer
    prisma.toolAccesses.create({
      data: {
        tool: 'adobe-cc',
        toolType: 'Design Suite',
        toolUrl: 'https://creativecloud.adobe.com',
        toolDescription: 'Adobe Creative Cloud design applications suite',
        username: 'carol_davis_ux',
        accessCode: 'ADC404PQR',
        participantId: participants[2].id,
        isActive: true,
        createdBy: systemUser.id
      }
    }),
    prisma.toolAccesses.create({
      data: {
        tool: 'miro',
        toolType: 'Collaboration Board',
        toolUrl: 'https://miro.com',
        toolDescription: 'Visual collaboration and whiteboarding platform',
        username: 'carol.davis.designer',
        accessCode: 'MRO505STU',
        participantId: participants[2].id,
        isActive: true,
        createdBy: systemUser.id
      }
    }),
    prisma.toolAccesses.create({
      data: {
        tool: 'invision',
        toolType: 'Prototyping Tool',
        toolUrl: 'https://invisionapp.com',
        toolDescription: 'Digital product design and prototyping platform',
        username: 'c_davis_proto',
        accessCode: 'INV606VWX',
        participantId: participants[2].id,
        isActive: true,
        createdBy: systemUser.id
      }
    }),

    // David Wilson - Analyst
    prisma.toolAccesses.create({
      data: {
        tool: 'tableau',
        toolType: 'Data Visualization',
        toolUrl: 'https://tableau.company.com',
        toolDescription: 'Business intelligence and data visualization platform',
        username: 'david_wilson_ba',
        accessCode: 'TAB707YZA',
        participantId: participants[3].id,
        isActive: true,
        createdBy: systemUser.id
      }
    }),
    prisma.toolAccesses.create({
      data: {
        tool: 'sql-server',
        toolType: 'Database Management',
        toolUrl: 'sqlserver.company.local',
        toolDescription: 'Microsoft SQL Server database management system',
        username: 'dwilson_analyst',
        accessCode: 'SQL808BCD',
        participantId: participants[3].id,
        isActive: true,
        createdBy: systemUser.id
      }
    }),
    prisma.toolAccesses.create({
      data: {
        tool: 'power-bi',
        toolType: 'Business Intelligence',
        toolUrl: 'https://powerbi.microsoft.com',
        toolDescription: 'Microsoft Power BI business analytics platform',
        username: 'd.wilson.powerbi',
        accessCode: 'PBI909EFG',
        participantId: participants[3].id,
        isActive: true,
        createdBy: systemUser.id
      }
    }),

    // Eva Brown - DevOps Engineer
    prisma.toolAccesses.create({
      data: {
        tool: 'aws-console',
        toolType: 'Cloud Platform',
        toolUrl: 'https://console.aws.amazon.com',
        toolDescription: 'Amazon Web Services cloud management console',
        username: 'eva_brown_devops',
        accessCode: 'AWS100HIJ',
        participantId: participants[4].id,
        isActive: true,
        createdBy: systemUser.id
      }
    }),
    prisma.toolAccesses.create({
      data: {
        tool: 'docker-hub',
        toolType: 'Container Registry',
        toolUrl: 'https://hub.docker.com',
        toolDescription: 'Docker container image registry and repository',
        username: 'eva.brown.containers',
        accessCode: 'DCK111KLM',
        participantId: participants[4].id,
        isActive: true,
        createdBy: systemUser.id
      }
    }),
    prisma.toolAccesses.create({
      data: {
        tool: 'jenkins',
        toolType: 'CI/CD Pipeline',
        toolUrl: 'https://jenkins.company.com',
        toolDescription: 'Continuous integration and deployment automation server',
        username: 'e_brown_cicd',
        accessCode: 'JNK212NOP',
        participantId: participants[4].id,
        isActive: true,
        createdBy: systemUser.id
      }
    }),
    prisma.toolAccesses.create({
      data: {
        tool: 'kubernetes',
        toolType: 'Container Orchestration',
        toolUrl: 'https://k8s.company.com',
        toolDescription: 'Kubernetes container orchestration platform',
        username: 'eva.brown.k8s',
        accessCode: 'K8S313QRS',
        participantId: participants[4].id,
        isActive: true,
        createdBy: systemUser.id
      }
    })
  ]);

  // Create sample projects
  console.log('📋 Creating sample projects...');
  const project1 = await prisma.projects.create({
    data: {
      cuid: 'proj-web-dev-2024',
      sub_organizationId: subOrganization.id,
      CreatedBy: systemUser.id,
      published: true,
      title: 'Web Development Bootcamp 2024',
      summary: 'Comprehensive 12-week web development training program for new developers',
      duration: 12,
      tags: JSON.stringify([{label: 'web-development'}, {label: 'bootcamp'}, {label: '2024'}]),
      projectType: 'Training Program',
      projectCategory: 'Technical Skills',
      projectStatus: 'ongoing',
      backgroundImg: 'https://images.unsplash.com/photo-1498050108023-c5249f4df085?w=800',
      color: '#2196F3',
      language: 'english',
      location: {
        type: 'hybrid',
        address: '123 Tech Street, San Francisco, CA',
        virtual_link: 'https://meet.company.com/web-dev-bootcamp'
      },
    }
  });

  const project2 = await prisma.projects.create({
    data: {
      cuid: 'proj-leadership-2024',
      sub_organizationId: subOrganization.id,
      CreatedBy: systemUser.id,
      published: true,
      title: 'Leadership Excellence Program',
      summary: 'Executive leadership development program for senior managers',
      duration: 8,
      tags: JSON.stringify([{label: 'leadership'}, {label: 'management'}, {label: 'executive'}]),
      projectType: 'Leadership Development',
      projectCategory: 'Soft Skills',
      projectStatus: 'ongoing',
      backgroundImg: 'https://images.unsplash.com/photo-1552664730-d307ca884978?w=800',
      color: '#4CAF50',
      language: 'english',
      location: {
        type: 'in-person',
        address: '456 Business Ave, New York, NY',
        room: 'Executive Conference Room'
      },
    }
  });

  const project3 = await prisma.projects.create({
    data: {
      cuid: 'proj-design-thinking-2024',
      sub_organizationId: subOrganization.id,
      CreatedBy: systemUser.id,
      published: true,
      title: 'Design Thinking Workshop Series',
      summary: 'Creative problem-solving and innovation workshop for product teams',
      duration: 6,
      tags: JSON.stringify([{label: 'design'}, {label: 'innovation'}, {label: 'workshop'}]),
      projectType: 'Workshop Series',
      projectCategory: 'Creative Skills',
      projectStatus: 'completed',
      backgroundImg: 'https://images.unsplash.com/photo-1559028006-448665bd7c7f?w=800',
      color: '#FF9800',
      language: 'english',
      location: {
        type: 'hybrid',
        address: '789 Creative Blvd, Design City, DC'
      },
    }
  });

  const project4 = await prisma.projects.create({
    data: {
      cuid: 'proj-cloud-migration-2024',
      sub_organizationId: subOrganization.id,
      CreatedBy: systemUser.id,
      published: true,
      title: 'Cloud Migration Training Program',
      summary: 'Comprehensive training for infrastructure teams on cloud migration strategies',
      duration: 16,
      tags: JSON.stringify([{label: 'cloud'}, {label: 'migration'}, {label: 'infrastructure'}]),
      projectType: 'Technical Training',
      projectCategory: 'Technical Skills',
      projectStatus: 'pending',
      backgroundImg: 'https://images.unsplash.com/photo-1451187580459-43490279c0fa?w=800',
      color: '#9C27B0',
      language: 'english',
      location: {
        type: 'online',
        virtual_link: 'https://meet.company.com/cloud-migration'
      },
    }
  });

  const project5 = await prisma.projects.create({
    data: {
      cuid: 'proj-agile-transformation-2024',
      sub_organizationId: subOrganization.id,
      CreatedBy: systemUser.id,
      published: true,
      title: 'Agile Transformation Initiative',
      summary: 'Organization-wide agile methodology training and implementation',
      duration: 20,
      tags: JSON.stringify([{label: 'agile'}, {label: 'transformation'}, {label: 'methodology'}]),
      projectType: 'Organizational Change',
      projectCategory: 'Process Improvement',
      projectStatus: 'ongoing',
      backgroundImg: 'https://images.unsplash.com/photo-1552664730-d307ca884978?w=800',
      color: '#E91E63',
      language: 'english',
      location: {
        type: 'in-person',
        address: '321 Agile Way, Methodology City, MC'
      },
    }
  });

  const project6 = await prisma.projects.create({
    data: {
      cuid: 'proj-data-science-bootcamp-2024',
      sub_organizationId: subOrganization.id,
      CreatedBy: systemUser.id,
      published: true,
      title: 'Data Science & Analytics Bootcamp',
      summary: 'Intensive data science training covering Python, machine learning, and analytics',
      duration: 14,
      tags: JSON.stringify([{label: 'data-science'}, {label: 'python'}, {label: 'analytics'}]),
      projectType: 'Bootcamp',
      projectCategory: 'Technical Skills',
      projectStatus: 'cancelled',
      backgroundImg: 'https://images.unsplash.com/photo-1551288049-bebda4e38f71?w=800',
      color: '#607D8B',
      language: 'english',
      location: {
        type: 'hybrid',
        address: '555 Data Drive, Analytics City, AC'
      },
    }
  });

  // Create project participants
  console.log('⚙️ Creating project settings...');
  
  // Create project settings for each project
  const projectSettings = await Promise.all([
    prisma.project_settings.create({
      data: {
        projectId: project1.id,
        startDate: new Date('2024-01-15'),
        endDate: new Date('2024-04-15'),
        startOfDayTime: '09:00',
        endOfDayTime: '17:00',
        lunchTime: '12:00-13:00',
        timezone: 'America/Toronto',
        workingDays: ['monday', 'tuesday', 'wednesday', 'thursday', 'friday'],
        createdBy: systemUser.id
      }
    }),
    prisma.project_settings.create({
      data: {
        projectId: project2.id,
        startDate: new Date('2024-02-01'),
        endDate: new Date('2024-09-30'),
        startOfDayTime: '08:30',
        endOfDayTime: '17:30',
        lunchTime: '12:30-13:30',
        timezone: 'America/New_York',
        workingDays: ['monday', 'tuesday', 'wednesday', 'thursday', 'friday'],
        createdBy: systemUser.id
      }
    }),
    prisma.project_settings.create({
      data: {
        projectId: project3.id,
        startDate: new Date('2023-09-15'),
        endDate: new Date('2023-12-15'),
        startOfDayTime: '09:30',
        endOfDayTime: '16:30',
        lunchTime: '12:00-13:00',
        timezone: 'America/Toronto',
        workingDays: ['monday', 'tuesday', 'wednesday', 'thursday'],
        createdBy: systemUser.id
      }
    }),
    prisma.project_settings.create({
      data: {
        projectId: project4.id,
        startDate: new Date('2024-05-01'),
        endDate: new Date('2024-08-31'),
        startOfDayTime: '09:00',
        endOfDayTime: '18:00',
        lunchTime: '12:00-13:00',
        timezone: 'America/Toronto',
        workingDays: ['monday', 'tuesday', 'wednesday', 'thursday', 'friday'],
        createdBy: systemUser.id
      }
    }),
    prisma.project_settings.create({
      data: {
        projectId: project5.id,
        startDate: new Date('2024-03-01'),
        endDate: new Date('2024-10-31'),
        startOfDayTime: '08:00',
        endOfDayTime: '17:00',
        lunchTime: '11:30-12:30',
        timezone: 'America/Toronto',
        workingDays: ['monday', 'tuesday', 'wednesday', 'thursday', 'friday'],
        createdBy: systemUser.id
      }
    }),
    prisma.project_settings.create({
      data: {
        projectId: project6.id,
        startDate: new Date('2024-06-01'),
        endDate: new Date('2024-12-31'),
        startOfDayTime: '09:00',
        endOfDayTime: '17:00',
        lunchTime: '12:00-13:00',
        timezone: 'America/Toronto',
        workingDays: ['monday', 'tuesday', 'wednesday', 'thursday', 'friday'],
        createdBy: systemUser.id
      }
    })
  ]);

  console.log('👤 Enrolling participants in projects...');
  const projectParticipants = await Promise.all([
    // Web Development Bootcamp participants
    prisma.project_participants.create({
      data: {
        projectId: project1.id,
        participantId: participants[0].id,
        status: 'active'
      }
    }),
    prisma.project_participants.create({
      data: {
        projectId: project1.id,
        participantId: participants[2].id,
        status: 'active'
      }
    }),
    prisma.project_participants.create({
      data: {
        projectId: project1.id,
        participantId: participants[3].id,
        status: 'active'
      }
    }),
    // Leadership Program participants
    prisma.project_participants.create({
      data: {
        projectId: project2.id,
        participantId: participants[1].id,
        status: 'active'
      }
    }),
    prisma.project_participants.create({
      data: {
        projectId: project2.id,
        participantId: participants[4].id,
        status: 'active'
      }
    }),
    // Data Science Bootcamp participants (Project 6)
    prisma.project_participants.create({
      data: {
        projectId: project6.id,
        participantId: participants[0].id, // Alice Johnson
        status: 'active'
      }
    }),
    prisma.project_participants.create({
      data: {
        projectId: project6.id,
        participantId: participants[3].id, // David Wilson  
        status: 'active'
      }
    }),
    prisma.project_participants.create({
      data: {
        projectId: project6.id,
        participantId: participants[4].id, // Eva Brown
        status: 'active'
      }
    })
  ]);

  // Create groups for projects
  console.log('👥 Creating project groups...');
  const group1 = await prisma.groups.create({
    data: {
      groupName: 'Frontend Developers',
      projectId: project1.id,
      chipColor: '#FF5722'
    }
  });

  const group2 = await prisma.groups.create({
    data: {
      groupName: 'Backend Developers',
      projectId: project1.id,
      chipColor: '#009688'
    }
  });

  const group3 = await prisma.groups.create({
    data: {
      groupName: 'Senior Leadership',
      projectId: project2.id,
      chipColor: '#9C27B0'
    }
  });

  const group4 = await prisma.groups.create({
    data: {
      groupName: 'Data Scientists',
      projectId: project6.id,
      chipColor: '#3F51B5'
    }
  });

  const group5 = await prisma.groups.create({
    data: {
      groupName: 'Analytics Team',
      projectId: project6.id,
      chipColor: '#FF9800'
    }
  });

  // Add participants to groups
  await Promise.all([
    prisma.group_participants.create({
      data: {
        groupId: group1.id,
        participantId: projectParticipants[0].id // Alice - Frontend
      }
    }),
    prisma.group_participants.create({
      data: {
        groupId: group1.id,
        participantId: projectParticipants[1].id // Carol - Frontend
      }
    }),
    prisma.group_participants.create({
      data: {
        groupId: group2.id,
        participantId: projectParticipants[2].id // David - Backend
      }
    }),
    prisma.group_participants.create({
      data: {
        groupId: group3.id,
        participantId: projectParticipants[3].id // Bob - Leadership
      }
    }),
    prisma.group_participants.create({
      data: {
        groupId: group3.id,
        participantId: projectParticipants[4].id // Eva - Leadership
      }
    }),
    // Project 6 (Data Science Bootcamp) group assignments
    prisma.group_participants.create({
      data: {
        groupId: group4.id,
        participantId: projectParticipants[5].id // Alice - Data Scientists
      }
    }),
    prisma.group_participants.create({
      data: {
        groupId: group5.id,
        participantId: projectParticipants[6].id // David - Analytics Team
      }
    }),
    prisma.group_participants.create({
      data: {
        groupId: group4.id,
        participantId: projectParticipants[7].id // Eva - Data Scientists
      }
    })
  ]);

  // Add project curriculum relationships
  console.log('🔗 Creating project curriculum relationships...');
  const projectCurriculums = await Promise.all([
    prisma.project_curriculums.create({
      data: {
        projectId: project1.id,
        curriculumId: curriculum1.id
      }
    }),
    prisma.project_curriculums.create({
      data: {
        projectId: project1.id,
        curriculumId: curriculum3.id
      }
    }),
    prisma.project_curriculums.create({
      data: {
        projectId: project2.id,
        curriculumId: curriculum2.id
      }
    })
  ]);

  // Create sample events
  console.log('📅 Creating sample events...');
  const events = await Promise.all([
    prisma.events.create({
      data: {
        title: 'JavaScript Fundamentals - Week 1',
        description: 'Introduction to JavaScript programming concepts',
        eventType: 'class',
        projectId: project1.id,
        courseId: course1.id,
        start: new Date('2024-01-15T09:00:00'),
        end: new Date('2024-01-15T12:00:00'),
        allDay: false,
        color: '#2196F3',
        backgroundColor: '#2196F3',
        editable: true,
        eventStatus: 'scheduled',
        extendedProps: {
          location: 'Classroom A',
          instructor: 'John Doe',
          capacity: 20
        }
      }
    }),
    prisma.events.create({
      data: {
        title: 'Leadership Workshop - Session 1',
        description: 'Leadership styles and emotional intelligence',
        eventType: 'workshop',
        projectId: project2.id,
        courseId: course2.id,
        start: new Date('2024-02-01T14:00:00'),
        end: new Date('2024-02-01T17:00:00'),
        allDay: false,
        color: '#4CAF50',
        backgroundColor: '#4CAF50',
        editable: true,
        eventStatus: 'scheduled',
        extendedProps: {
          location: 'Executive Conference Room',
          facilitator: 'Jane Smith',
          materials: 'Leadership Assessment Toolkit'
        }
      }
    })
  ]);

  // Create event attendees
  console.log('📝 Creating event attendees...');
  await Promise.all([
    prisma.event_attendees.create({
      data: {
        eventsId: events[0].id,
        enrolleeId: projectParticipants[0].id,
        attendance_status: 'scheduled',
        createdBy: systemUser.id
      }
    }),
    prisma.event_attendees.create({
      data: {
        eventsId: events[0].id,
        enrolleeId: projectParticipants[1].id,
        attendance_status: 'scheduled',
        createdBy: systemUser.id
      }
    }),
    prisma.event_attendees.create({
      data: {
        eventsId: events[1].id,
        enrolleeId: projectParticipants[3].id,
        attendance_status: 'confirmed',
        createdBy: systemUser.id
      }
    })
  ]);

  // Create event groups
  await Promise.all([
    prisma.event_groups.create({
      data: {
        eventsId: events[0].id,
        groupId: group1.id
      }
    }),
    prisma.event_groups.create({
      data: {
        eventsId: events[1].id,
        groupId: group3.id
      }
    })
  ]);

  // Create daily focus entries
  console.log('🎯 Creating daily focus entries...');
  await Promise.all([
    prisma.daily_focus.create({
      data: {
        date: new Date('2024-01-15'),
        focus: 'Introduction to JavaScript syntax and variables',
        projectId: project1.id,
        createdBy: systemUser.id
      }
    }),
    prisma.daily_focus.create({
      data: {
        date: new Date('2024-02-01'),
        focus: 'Leadership assessment and personal style identification',
        projectId: project2.id,
        createdBy: systemUser.id
      }
    })
  ]);

  // Create sample instructors
  console.log('👨‍🏫 Creating sample instructors...');
  const instructors = await Promise.all([
    prisma.instructors.create({
      data: {
        firstName: 'Sarah',
        lastName: 'Martinez',
        email: 'sarah.martinez@edwind.com',
        phone: '+1-555-0234',
        bio: 'Senior JavaScript developer with 8+ years of experience in full-stack development. Passionate about teaching modern web technologies.',
        expertise: ['JavaScript', 'React', 'Node.js', 'Full-stack Development'],
        instructorType: 'main',
        status: 'active',
        qualifications: {
          degrees: ['B.S. Computer Science'],
          certifications: ['AWS Certified Developer', 'React Certified'],
          experience: '8 years'
        },
        hourlyRate: 125.0,
        availability: {
          timezone: 'UTC-5',
          preferred_days: ['Monday', 'Tuesday', 'Wednesday', 'Thursday'],
          preferred_times: ['09:00-17:00']
        },
        sub_organizationId: subOrganization.id,
        createdBy: systemUser.id,
        updatedBy: systemUser.id
      }
    }),
    prisma.instructors.create({
      data: {
        firstName: 'Michael',
        lastName: 'Chen',
        email: 'michael.chen@edwind.com',
        phone: '+1-555-0345',
        bio: 'Executive leadership coach and former Fortune 500 VP. Specializes in transformational leadership and organizational change.',
        expertise: ['Leadership Development', 'Executive Coaching', 'Change Management', 'Strategic Planning'],
        instructorType: 'main',
        status: 'active',
        qualifications: {
          degrees: ['MBA', 'M.S. Organizational Psychology'],
          certifications: ['ICF Certified Coach', 'Change Management Certified'],
          experience: '15 years'
        },
        hourlyRate: 200.0,
        availability: {
          timezone: 'UTC-8',
          preferred_days: ['Tuesday', 'Wednesday', 'Thursday', 'Friday'],
          preferred_times: ['10:00-16:00']
        },
        sub_organizationId: subOrganization.id,
        createdBy: systemUser.id,
        updatedBy: systemUser.id
      }
    }),
    prisma.instructors.create({
      data: {
        firstName: 'Emily',
        lastName: 'Rodriguez',
        email: 'emily.rodriguez@edwind.com',
        phone: '+1-555-0456',
        bio: 'UX/UI Design expert with experience at top design agencies. Focuses on user-centered design and design thinking methodologies.',
        expertise: ['UI/UX Design', 'Design Thinking', 'Prototyping', 'User Research'],
        instructorType: 'secondary',
        status: 'active',
        qualifications: {
          degrees: ['B.F.A. Graphic Design'],
          certifications: ['Adobe Certified Expert', 'Google UX Design Certificate'],
          experience: '6 years'
        },
        hourlyRate: 95.0,
        availability: {
          timezone: 'UTC-5',
          preferred_days: ['Monday', 'Wednesday', 'Friday'],
          preferred_times: ['13:00-18:00']
        },
        sub_organizationId: subOrganization.id,
        createdBy: systemUser.id,
        updatedBy: systemUser.id
      }
    }),
    prisma.instructors.create({
      data: {
        firstName: 'David',
        lastName: 'Kumar',
        email: 'david.kumar@edwind.com',
        phone: '+1-555-0567',
        bio: 'Cloud architecture specialist and AWS solutions architect. Expert in cloud migration strategies and DevOps practices.',
        expertise: ['Cloud Computing', 'AWS', 'DevOps', 'Infrastructure', 'Docker', 'Kubernetes'],
        instructorType: 'main',
        status: 'active',
        qualifications: {
          degrees: ['B.S. Information Systems'],
          certifications: ['AWS Solutions Architect Professional', 'Kubernetes Certified'],
          experience: '10 years'
        },
        hourlyRate: 150.0,
        availability: {
          timezone: 'UTC-7',
          preferred_days: ['Monday', 'Tuesday', 'Thursday', 'Friday'],
          preferred_times: ['09:00-17:00']
        },
        sub_organizationId: subOrganization.id,
        createdBy: systemUser.id,
        updatedBy: systemUser.id
      }
    }),
    prisma.instructors.create({
      data: {
        firstName: 'Jessica',
        lastName: 'Thompson',
        email: 'jessica.thompson@edwind.com',
        phone: '+1-555-0678',
        bio: 'Business strategy consultant and former McKinsey analyst. Specializes in data-driven decision making and strategic frameworks.',
        expertise: ['Business Strategy', 'Analytics', 'Data Analysis', 'Strategic Planning', 'KPIs'],
        instructorType: 'main',
        status: 'active',
        qualifications: {
          degrees: ['MBA Strategy', 'B.S. Business Administration'],
          certifications: ['Six Sigma Black Belt', 'PMP Certified'],
          experience: '12 years'
        },
        hourlyRate: 175.0,
        availability: {
          timezone: 'UTC-6',
          preferred_days: ['Tuesday', 'Wednesday', 'Thursday'],
          preferred_times: ['10:00-16:00']
        },
        sub_organizationId: subOrganization.id,
        createdBy: systemUser.id,
        updatedBy: systemUser.id
      }
    }),
    prisma.instructors.create({
      data: {
        firstName: 'Alex',
        lastName: 'Park',
        email: 'alex.park@edwind.com',
        phone: '+1-555-0789',
        bio: 'Teaching assistant and junior developer. Supports main instructors with hands-on exercises and student mentoring.',
        expertise: ['JavaScript', 'Frontend Development', 'Student Mentoring'],
        instructorType: 'assistant',
        status: 'active',
        qualifications: {
          degrees: ['B.S. Computer Science (In Progress)'],
          certifications: ['JavaScript Fundamentals'],
          experience: '2 years'
        },
        hourlyRate: 45.0,
        availability: {
          timezone: 'UTC-5',
          preferred_days: ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday'],
          preferred_times: ['14:00-20:00']
        },
        sub_organizationId: subOrganization.id,
        createdBy: systemUser.id,
        updatedBy: systemUser.id
      }
    })
  ]);

  // Assign instructors to events
  console.log('👨‍🏫 Assigning instructors to events...');
  await Promise.all([
    prisma.event_instructors.create({
      data: {
        eventId: events[0].id, // JavaScript Fundamentals event
        instructorId: instructors[0].id, // Sarah Martinez
        role: 'main'
      }
    }),
    prisma.event_instructors.create({
      data: {
        eventId: events[0].id, // JavaScript Fundamentals event
        instructorId: instructors[5].id, // Alex Park (assistant)
        role: 'assistant'
      }
    }),
    prisma.event_instructors.create({
      data: {
        eventId: events[1].id, // Leadership Workshop event
        instructorId: instructors[1].id, // Michael Chen
        role: 'main'
      }
    })
  ]);

  // Assign instructors to courses
  console.log('📚 Assigning instructors to courses...');
  await Promise.all([
    prisma.course_instructors.create({
      data: {
        courseId: course1.id, // JavaScript Fundamentals
        instructorId: instructors[0].id, // Sarah Martinez
        role: 'main'
      }
    }),
    prisma.course_instructors.create({
      data: {
        courseId: course1.id, // JavaScript Fundamentals
        instructorId: instructors[5].id, // Alex Park
        role: 'assistant'
      }
    }),
    prisma.course_instructors.create({
      data: {
        courseId: course2.id, // Leadership Excellence
        instructorId: instructors[1].id, // Michael Chen
        role: 'main'
      }
    }),
    prisma.course_instructors.create({
      data: {
        courseId: course3.id, // UI/UX Design
        instructorId: instructors[2].id, // Emily Rodriguez
        role: 'main'
      }
    }),
    prisma.course_instructors.create({
      data: {
        courseId: course4.id, // Business Strategy
        instructorId: instructors[4].id, // Jessica Thompson
        role: 'main'
      }
    }),
    prisma.course_instructors.create({
      data: {
        courseId: course5.id, // Cloud Computing
        instructorId: instructors[3].id, // David Kumar
        role: 'main'
      }
    })
  ]);

  // Create support activities for curriculums
  console.log('🎯 Creating support activities for curriculums...');
  
  // Support activities for Web Development Foundation Track (curriculum1)
  const webDevSupportActivities = await Promise.all([
    prisma.supportActivities.create({
      data: {
        title: 'Live Coding Walkthrough',
        description: 'Real-time coding demonstration with instructor guidance',
        activityType: 'Floor Support',
        duration: 30,
        curriculumId: curriculum1.id,
        createdBy: systemUser.id
      }
    }),
    prisma.supportActivities.create({
      data: {
        title: 'One-on-One Code Review',
        description: 'Individual session to review student code and provide feedback',
        activityType: 'One-on-one',
        duration: 45,
        curriculumId: curriculum1.id,
        createdBy: systemUser.id
      }
    }),
    prisma.supportActivities.create({
      data: {
        title: 'Debugging Workshop',
        description: 'Interactive session focusing on common debugging techniques',
        activityType: 'Workshop',
        duration: 60,
        curriculumId: curriculum1.id,
        createdBy: systemUser.id
      }
    }),
    prisma.supportActivities.create({
      data: {
        title: 'Design Critique Session',
        description: 'Group review and feedback on UI/UX design projects',
        activityType: 'Group Review',
        duration: 40,
        curriculumId: curriculum1.id,
        createdBy: systemUser.id
      }
    }),
    prisma.supportActivities.create({
      data: {
        title: 'Portfolio Development Coaching',
        description: 'Individual guidance on building a professional portfolio',
        activityType: 'One-on-one',
        duration: 50,
        curriculumId: curriculum1.id,
        createdBy: systemUser.id
      }
    })
  ]);

  // Support activities for Executive Leadership & Technology Track (curriculum2)
  const leadershipSupportActivities = await Promise.all([
    prisma.supportActivities.create({
      data: {
        title: 'Executive Coaching Session',
        description: 'Personalized leadership coaching for senior executives',
        activityType: 'One-on-one',
        duration: 90,
        curriculumId: curriculum2.id,
        createdBy: systemUser.id
      }
    }),
    prisma.supportActivities.create({
      data: {
        title: 'Strategic Planning Facilitation',
        description: 'Guided session for developing strategic initiatives',
        activityType: 'Floor Support',
        duration: 120,
        curriculumId: curriculum2.id,
        createdBy: systemUser.id
      }
    }),
    prisma.supportActivities.create({
      data: {
        title: 'Leadership Assessment Review',
        description: 'Individual review of leadership assessment results and development plan',
        activityType: 'One-on-one',
        duration: 60,
        curriculumId: curriculum2.id,
        createdBy: systemUser.id
      }
    }),
    prisma.supportActivities.create({
      data: {
        title: 'Cloud Migration Consultation',
        description: 'Technical consultation on specific cloud migration challenges',
        activityType: 'Consultation',
        duration: 75,
        curriculumId: curriculum2.id,
        createdBy: systemUser.id
      }
    }),
    prisma.supportActivities.create({
      data: {
        title: 'Business Case Development Workshop',
        description: 'Collaborative session to develop compelling business cases',
        activityType: 'Workshop',
        duration: 90,
        curriculumId: curriculum2.id,
        createdBy: systemUser.id
      }
    }),
    prisma.supportActivities.create({
      data: {
        title: 'Technology Leadership Roundtable',
        description: 'Peer discussion forum for technology leaders',
        activityType: 'Group Discussion',
        duration: 60,
        curriculumId: curriculum2.id,
        createdBy: systemUser.id
      }
    })
  ]);

  // Support activities for Full Stack Development Bootcamp (curriculum3)
  const fullStackSupportActivities = await Promise.all([
    prisma.supportActivities.create({
      data: {
        title: 'Code Pair Programming',
        description: 'Collaborative coding session with instructor or peer',
        activityType: 'Floor Support',
        duration: 60,
        curriculumId: curriculum3.id,
        createdBy: systemUser.id
      }
    }),
    prisma.supportActivities.create({
      data: {
        title: 'Technical Interview Prep',
        description: 'Mock technical interviews and feedback sessions',
        activityType: 'One-on-one',
        duration: 45,
        curriculumId: curriculum3.id,
        createdBy: systemUser.id
      }
    }),
    prisma.supportActivities.create({
      data: {
        title: 'Project Architecture Review',
        description: 'Individual review of project structure and best practices',
        activityType: 'One-on-one',
        duration: 50,
        curriculumId: curriculum3.id,
        createdBy: systemUser.id
      }
    }),
    prisma.supportActivities.create({
      data: {
        title: 'Agile Development Workshop',
        description: 'Hands-on workshop covering agile methodologies and tools',
        activityType: 'Workshop',
        duration: 90,
        curriculumId: curriculum3.id,
        createdBy: systemUser.id
      }
    }),
    prisma.supportActivities.create({
      data: {
        title: 'Career Transition Guidance',
        description: 'Personalized advice on transitioning to full-stack development career',
        activityType: 'One-on-one',
        duration: 40,
        curriculumId: curriculum3.id,
        createdBy: systemUser.id
      }
    }),
    prisma.supportActivities.create({
      data: {
        title: 'Cloud Deployment Lab',
        description: 'Hands-on practice deploying applications to cloud platforms',
        activityType: 'Lab Session',
        duration: 75,
        curriculumId: curriculum3.id,
        createdBy: systemUser.id
      }
    }),
    prisma.supportActivities.create({
      data: {
        title: 'Business Requirements Analysis',
        description: 'Training on translating business needs into technical requirements',
        activityType: 'Workshop',
        duration: 80,
        curriculumId: curriculum3.id,
        createdBy: systemUser.id
      }
    }),
    prisma.supportActivities.create({
      data: {
        title: 'Open Office Hours',
        description: 'Drop-in session for any questions or challenges students face',
        activityType: 'Office Hours',
        duration: 120,
        curriculumId: curriculum3.id,
        createdBy: systemUser.id
      }
    })
  ]);

  // Create sample course checklist items
  console.log('✅ Creating course checklist items...');
  
  const courseChecklistItems = await Promise.all([
    // JavaScript Fundamentals checklist items
    prisma.course_checklist_items.create({
      data: {
        courseId: course1.id,
        title: 'Complete Introduction to JavaScript module',
        description: 'Review core concepts including variables, data types, and basic syntax',
        category: 'content',
        priority: 'high',
        itemOrder: 1,
        createdBy: systemUser.id
      }
    }),
    prisma.course_checklist_items.create({
      data: {
        courseId: course1.id,
        title: 'Pass Variables and Data Types quiz',
        description: 'Achieve 80% or higher on the quiz covering variables and data types',
        category: 'review',
        priority: 'high',
        itemOrder: 2,
        createdBy: systemUser.id
      }
    }),
    prisma.course_checklist_items.create({
      data: {
        courseId: course1.id,
        title: 'Submit Syntax Practice Lab exercises',
        description: 'Complete and submit all coding exercises in the syntax practice lab',
        category: 'technical',
        priority: 'medium',
        itemOrder: 3,
        createdBy: systemUser.id
      }
    }),
    prisma.course_checklist_items.create({
      data: {
        courseId: course1.id,
        title: 'Complete Functions and Scope module',
        description: 'Master function declarations, expressions, and scope concepts',
        category: 'content',
        priority: 'high',
        itemOrder: 4,
        createdBy: systemUser.id
      }
    }),
    prisma.course_checklist_items.create({
      data: {
        courseId: course1.id,
        title: 'Build Interactive Web Page Project',
        description: 'Create a dynamic web page using DOM manipulation and event handling',
        category: 'technical',
        priority: 'high',
        itemOrder: 5,
        createdBy: systemUser.id
      }
    }),

    // Leadership Excellence checklist items
    prisma.course_checklist_items.create({
      data: {
        courseId: course2.id,
        title: 'Complete Leadership Style Assessment',
        description: 'Take the comprehensive leadership style assessment and review results',
        category: 'review',
        priority: 'high',
        itemOrder: 1,
        createdBy: systemUser.id
      }
    }),
    prisma.course_checklist_items.create({
      data: {
        courseId: course2.id,
        title: 'Participate in Communication Skills Workshop',
        description: 'Attend and actively participate in the communication skills workshop',
        category: 'instructor',
        priority: 'high',
        itemOrder: 2,
        createdBy: systemUser.id
      }
    }),
    prisma.course_checklist_items.create({
      data: {
        courseId: course2.id,
        title: 'Develop Personal Leadership Plan',
        description: 'Create a comprehensive personal leadership development plan',
        category: 'content',
        priority: 'medium',
        itemOrder: 3,
        createdBy: systemUser.id
      }
    }),
    prisma.course_checklist_items.create({
      data: {
        courseId: course2.id,
        title: 'Present Leadership Case Study',
        description: 'Prepare and deliver a presentation on a leadership case study',
        category: 'review',
        priority: 'high',
        itemOrder: 4,
        createdBy: systemUser.id
      }
    }),

    // UI/UX Design checklist items
    prisma.course_checklist_items.create({
      data: {
        courseId: course3.id,
        title: 'Complete User Research Phase',
        description: 'Conduct user interviews, surveys, and persona development',
        category: 'content',
        priority: 'high',
        itemOrder: 1,
        createdBy: systemUser.id
      }
    }),
    prisma.course_checklist_items.create({
      data: {
        courseId: course3.id,
        title: 'Create Wireframes and Prototypes',
        description: 'Design low-fidelity wireframes and interactive prototypes',
        category: 'technical',
        priority: 'high',
        itemOrder: 2,
        createdBy: systemUser.id
      }
    }),
    prisma.course_checklist_items.create({
      data: {
        courseId: course3.id,
        title: 'Conduct Usability Testing',
        description: 'Plan and execute usability testing sessions with real users',
        category: 'review',
        priority: 'medium',
        itemOrder: 3,
        createdBy: systemUser.id
      }
    }),
    prisma.course_checklist_items.create({
      data: {
        courseId: course3.id,
        title: 'Submit Final Design Portfolio',
        description: 'Compile and submit comprehensive design portfolio with all deliverables',
        category: 'review',
        priority: 'high',
        itemOrder: 4,
        createdBy: systemUser.id
      }
    }),

    // Business Strategy checklist items
    prisma.course_checklist_items.create({
      data: {
        courseId: course4.id,
        title: 'Complete Market Analysis',
        description: 'Conduct comprehensive market research and competitive analysis',
        category: 'content',
        priority: 'high',
        itemOrder: 1,
        createdBy: systemUser.id
      }
    }),
    prisma.course_checklist_items.create({
      data: {
        courseId: course4.id,
        title: 'Develop SWOT Analysis',
        description: 'Create detailed SWOT analysis for assigned case study',
        category: 'content',
        priority: 'medium',
        itemOrder: 2,
        createdBy: systemUser.id
      }
    }),
    prisma.course_checklist_items.create({
      data: {
        courseId: course4.id,
        title: 'Present Strategic Recommendations',
        description: 'Deliver final presentation with strategic recommendations',
        category: 'review',
        priority: 'high',
        itemOrder: 3,
        createdBy: systemUser.id
      }
    }),

    // Cloud Computing checklist items
    prisma.course_checklist_items.create({
      data: {
        courseId: course5.id,
        title: 'Deploy First Cloud Application',
        description: 'Successfully deploy a web application to a cloud platform',
        category: 'technical',
        priority: 'high',
        itemOrder: 1,
        createdBy: systemUser.id
      }
    }),
    prisma.course_checklist_items.create({
      data: {
        courseId: course5.id,
        title: 'Configure Cloud Security',
        description: 'Implement security best practices and access controls',
        category: 'technical',
        priority: 'high',
        itemOrder: 2,
        createdBy: systemUser.id
      }
    }),
    prisma.course_checklist_items.create({
      data: {
        courseId: course5.id,
        title: 'Complete Cloud Certification Exam',
        description: 'Pass the cloud platform certification exam',
        category: 'review',
        priority: 'medium',
        itemOrder: 3,
        createdBy: systemUser.id
      }
    })
  ]);

  // Final success message
  console.log('\n🎉 Database seeding completed successfully!');
  console.log('\n📊 Summary of created data:');
  console.log(`• 1 Organization: ${organization.title}`);
  console.log(`• 1 Sub-organization: ${subOrganization.title}`);
  console.log(`• 1 System user: ${systemUser.email}`);
  console.log(`• 5 Participants: Alice, Bob, Carol, David, Eva`);
  console.log(`• ${toolAccessRecords.length} Tool Access Records:`);
  console.log(`  - Alice: CRM, Figma, GitHub (3 tools)`);
  console.log(`  - Bob: Jira, Salesforce, Slack (3 tools)`);
  console.log(`  - Carol: Adobe CC, Miro, InVision (3 tools)`);
  console.log(`  - David: Tableau, SQL Server, Power BI (3 tools)`);
  console.log(`  - Eva: AWS Console, Docker Hub, Jenkins, Kubernetes (4 tools)`);
  console.log(`• 8 Tags for categorization`);
  console.log(`• ${topics.length} Topics:`);
  console.log(`  - ${topics[0].title} (${topics[0].icon} ${topics[0].description})`);
  console.log(`  - ${topics[1].title} (${topics[1].icon} ${topics[1].description})`);
  console.log(`  - ${topics[2].title} (${topics[2].icon} ${topics[2].description})`);
  console.log(`  - ${topics[3].title} (${topics[3].icon} ${topics[3].description})`);
  console.log(`  - ${topics[4].title} (${topics[4].icon} ${topics[4].description})`);
  console.log(`  - ${topics[5].title} (${topics[5].icon} ${topics[5].description})`);
  console.log(`  - ${topics[6].title} (${topics[6].icon} ${topics[6].description})`);
  console.log(`  - ${topics[7].title} (${topics[7].icon} ${topics[7].description})`);
  console.log(`  - ${topics[8].title} (${topics[8].icon} ${topics[8].description})`);
  console.log(`  - ${topics[9].title} (${topics[9].icon} ${topics[9].description})`);
  console.log(`  - ${topics[10].title} (${topics[10].icon} ${topics[10].description})`);
  console.log(`  - ${topics[11].title} (${topics[11].icon} ${topics[11].description})`);
  console.log(`• 5 Courses:`);
  console.log(`  - ${course1.title} (${course1.code})`);
  console.log(`  - ${course2.title} (${course2.code})`);
  console.log(`  - ${course3.title} (${course3.code})`);
  console.log(`  - ${course4.title} (${course4.code})`);
  console.log(`  - ${course5.title} (${course5.code})`);
  console.log(`• 3 Curriculums:`);
  console.log(`  - ${curriculum1.title} (2 courses, ${webDevSupportActivities.length} support activities)`);
  console.log(`  - ${curriculum2.title} (3 courses, ${leadershipSupportActivities.length} support activities)`);
  console.log(`  - ${curriculum3.title} (4 courses, ${fullStackSupportActivities.length} support activities)`);
  console.log(`• 6 Projects:`);
  console.log(`  - Honda Project (Training recipient: Honda Montreal)`);
  console.log(`  - Toyota Project (Training recipient: Toyota Downtown)`);
  console.log(`  - Ford Project (Training recipient: Ford West End)`);
  console.log(`  - JavaScript Bootcamp (Self-paced learning)`);
  console.log(`  - Leadership Workshop (Executive development)`);
  console.log(`  - Design Thinking Course (Creative problem solving)`);
  console.log(`• Event instructor assignments completed`);
  console.log(`• Course instructor assignments completed`);
  console.log(`• ${events.length} Sample events scheduled`);
  console.log(`• Event attendee registrations created`);
  console.log(`• 2 Daily focus entries`);
  console.log(`• 3 Training recipients: Honda Montreal, Toyota Downtown, Ford West End`);
  console.log(`• 6 Instructors:`);
  console.log(`  - ${instructors[0].firstName} ${instructors[0].lastName} (${instructors[0].instructorType}) - JavaScript/Full-stack`);
  console.log(`  - ${instructors[1].firstName} ${instructors[1].lastName} (${instructors[1].instructorType}) - Leadership/Executive Coaching`);
  console.log(`  - ${instructors[2].firstName} ${instructors[2].lastName} (${instructors[2].instructorType}) - UI/UX Design`);
  console.log(`  - ${instructors[3].firstName} ${instructors[3].lastName} (${instructors[3].instructorType}) - Cloud Computing/DevOps`);
  console.log(`  - ${instructors[4].firstName} ${instructors[4].lastName} (${instructors[4].instructorType}) - Business Strategy/Analytics`);
  console.log(`  - ${instructors[5].firstName} ${instructors[5].lastName} (${instructors[5].instructorType}) - Teaching Assistant`);
  console.log(`• ${webDevSupportActivities.length + leadershipSupportActivities.length + fullStackSupportActivities.length} Support Activities:`);
  console.log(`  - Web Dev Track: Live Coding, Code Review, Debugging, Design Critique, Portfolio Coaching`);
  console.log(`  - Leadership Track: Executive Coaching, Strategic Planning, Assessment Review, Cloud Consultation, Business Case Workshop, Tech Roundtable`);
  console.log(`  - Full Stack Track: Pair Programming, Interview Prep, Architecture Review, Agile Workshop, Career Guidance, Cloud Lab, Requirements Analysis, Office Hours`);
  console.log(`• Modules and activities for each course`);
  console.log(`• Course-tag relationships for proper categorization`);
  console.log(`• Project curriculum relationships established`);
  console.log(`• Instructor assignments to courses and events`);
  console.log(`• Project settings with working hours and schedules for all projects`);
  console.log(`• ${courseChecklistItems.length} Course checklist items:`);
  console.log(`  - JavaScript Fundamentals: 5 items (content, review, technical)`);
  console.log(`  - Leadership Excellence: 4 items (review, instructor, content)`);
  console.log(`  - UI/UX Design: 4 items (content, technical, review)`);
  console.log(`  - Business Strategy: 3 items (content, review)`);
  console.log(`  - Cloud Computing: 3 items (technical, review)`);
}

main()
  .catch((e) => {
    console.error('❌ Error during seeding:', e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });