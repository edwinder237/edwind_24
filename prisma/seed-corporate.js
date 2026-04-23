require('dotenv').config({ path: '.env.local' });
const { PrismaClient } = require('@prisma/client');

const prisma = new PrismaClient();

// Helper: returns a future date N days from now at a given hour
function futureDate(daysFromNow, hour = 9, minute = 0) {
  const d = new Date();
  d.setDate(d.getDate() + daysFromNow);
  d.setHours(hour, minute, 0, 0);
  return d;
}

// ── Existing IDs to link to ──────────────────────────────────
const ORG_ID = 'a62716e3-dd9c-402c-a457-a6ba45f9fb83';
const SUB_ORG_ID = 29;

async function main() {
  console.log('🏢 Starting corporate training seed...');
  console.log(`  Using existing org: ${ORG_ID}, sub-org: ${SUB_ORG_ID}`);

  // Fetch existing records
  const subOrg1 = { id: SUB_ORG_ID };

  const systemUser = await prisma.user.findFirst({
    where: { sub_organizationId: SUB_ORG_ID }
  });
  if (!systemUser) throw new Error('No user found for sub-org ' + SUB_ORG_ID);
  console.log(`  ✓ Using user: ${systemUser.name} (${systemUser.email})`);

  const employeeRole = await prisma.sub_organization_participant_role.findFirst({
    where: { sub_organizationId: SUB_ORG_ID }
  });
  if (!employeeRole) throw new Error('No participant role found for sub-org ' + SUB_ORG_ID);
  console.log(`  ✓ Using role: ${employeeRole.title}`);

  // ── Training Recipient ────────────────────────────────────────
  const trainingRecipient = await prisma.training_recipients.create({
    data: {
      name: 'Vertex Corporate Training - Internal',
      description: 'Internal corporate training cohort',
      contactPerson: 'Margaret Chen',
      email: 'training@vertexcorp.com',
      phone: '+1-416-555-8802',
      industry: 'Professional Services',
      status: 'active',
      sub_organizationId: SUB_ORG_ID,
      createdBy: systemUser.id
    }
  });

  // ════════════════════════════════════════════════════════════════
  // COURSE 1: Corporate Communication & Presentation Skills
  // ════════════════════════════════════════════════════════════════
  console.log('📚 Creating courses...');

  const course1 = await prisma.courses.create({
    data: {
      title: 'Corporate Communication & Presentation Skills',
      summary: 'Master the art of professional communication — from crisp business writing to confident boardroom presentations. This course equips employees with the skills to influence stakeholders, lead meetings, and communicate across cultures.',
      language: 'English',
      deliveryMethod: 'Blended',
      cost: 1200.00,
      level: 'Intermediate',
      certification: 'Professional Communication Certificate',
      CourseType: 'Soft Skills',
      courseCategory: 'Communication',
      courseStatus: 'Published',
      isActive: true,
      targetAudience: 'Managers, Team Leads, Client-Facing Staff',
      published: true,
      code: 'CORP-101',
      version: '2.0',
      rating: 4.8,
      createdBy: systemUser.id,
      sub_organizationId: SUB_ORG_ID,
      modules: {
        create: [
          {
            title: 'Business Writing Essentials',
            summary: 'Write clear, concise, and professional emails, reports, and proposals.',
            content: 'Covers email etiquette, executive summaries, proposal structure, and tone calibration for different audiences.',
            moduleStatus: 'Published',
            published: true,
            moduleOrder: 1,
            duration: 90,
            activities: {
              create: [
                {
                  title: 'Email Makeover Exercise',
                  summary: 'Rewrite poorly written corporate emails to be clear and actionable',
                  content: 'Given 5 real-world email scenarios, rewrite each to improve clarity, tone, and call-to-action.',
                  duration: 25,
                  activityType: 'Exercise',
                  activityCategory: 'Exercise',
                  activityStatus: 'Published',
                  published: true,
                  ActivityOrder: 1
                },
                {
                  title: 'Executive Summary Workshop',
                  summary: 'Craft a one-page executive summary from a complex report',
                  content: 'Practice distilling a 20-page business report into a compelling one-page executive summary.',
                  duration: 35,
                  activityType: 'Workshop',
                  activityCategory: 'Exercise',
                  activityStatus: 'Published',
                  published: true,
                  ActivityOrder: 2
                },
                {
                  title: 'Tone & Audience Quiz',
                  summary: 'Identify appropriate tone for different business contexts',
                  content: 'Multiple choice quiz on matching communication style to audience: C-suite, peers, clients, vendors.',
                  duration: 15,
                  activityType: 'Quiz',
                  activityCategory: 'Quiz',
                  activityStatus: 'Published',
                  published: true,
                  ActivityOrder: 3
                }
              ]
            }
          },
          {
            title: 'Presentation Design & Storytelling',
            summary: 'Design visually compelling slide decks that tell a story.',
            content: 'Learn slide design principles, data visualization for presentations, and the narrative arc framework.',
            moduleStatus: 'Published',
            published: true,
            moduleOrder: 2,
            duration: 120,
            activities: {
              create: [
                {
                  title: 'Slide Deck Redesign',
                  summary: 'Transform a text-heavy deck into a visual story',
                  content: 'Take a 15-slide text-heavy presentation and redesign it using visual storytelling principles.',
                  duration: 40,
                  activityType: 'Exercise',
                  activityCategory: 'Project',
                  activityStatus: 'Published',
                  published: true,
                  ActivityOrder: 1
                },
                {
                  title: 'Data Visualization Workshop',
                  summary: 'Choose the right chart type and design data slides',
                  content: 'Practice selecting appropriate visualizations for different data types and audiences.',
                  duration: 35,
                  activityType: 'Workshop',
                  activityCategory: 'Exercise',
                  activityStatus: 'Published',
                  published: true,
                  ActivityOrder: 2
                },
                {
                  title: 'Narrative Arc Exercise',
                  summary: 'Structure a presentation using the narrative arc framework',
                  content: 'Build a presentation outline using: hook, context, tension, resolution, call-to-action.',
                  duration: 25,
                  activityType: 'Exercise',
                  activityCategory: 'Exercise',
                  activityStatus: 'Published',
                  published: true,
                  ActivityOrder: 3
                },
                {
                  title: 'Peer Deck Review',
                  summary: 'Exchange decks with a partner and provide structured feedback',
                  content: 'Use the provided rubric to evaluate a peer\'s slide deck on clarity, design, and narrative flow.',
                  duration: 20,
                  activityType: 'Interactive',
                  activityCategory: 'Exercise',
                  activityStatus: 'Published',
                  published: true,
                  ActivityOrder: 4
                }
              ]
            }
          },
          {
            title: 'Public Speaking & Delivery',
            summary: 'Build confidence and presence when speaking to groups of any size.',
            content: 'Techniques for managing nerves, using body language, vocal variety, and handling Q&A sessions.',
            moduleStatus: 'Published',
            published: true,
            moduleOrder: 3,
            duration: 100,
            activities: {
              create: [
                {
                  title: '2-Minute Elevator Pitch',
                  summary: 'Deliver a concise, compelling pitch on a business topic',
                  content: 'Prepare and deliver a 2-minute pitch to the group. Receive feedback on clarity, confidence, and impact.',
                  duration: 30,
                  activityType: 'Exercise',
                  activityCategory: 'Exercise',
                  activityStatus: 'Published',
                  published: true,
                  ActivityOrder: 1
                },
                {
                  title: 'Body Language Workshop',
                  summary: 'Practice power poses, eye contact, and stage movement',
                  content: 'Interactive workshop with video recording to analyze and improve non-verbal communication.',
                  duration: 40,
                  activityType: 'Workshop',
                  activityCategory: 'Exercise',
                  activityStatus: 'Published',
                  published: true,
                  ActivityOrder: 2
                },
                {
                  title: 'Q&A Simulation',
                  summary: 'Handle tough questions under pressure',
                  content: 'Role-play exercise where participants field difficult questions from a simulated audience.',
                  duration: 30,
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
            title: 'Stakeholder Communication',
            summary: 'Tailor your message for executives, clients, and cross-functional teams.',
            content: 'Learn stakeholder mapping, managing up, client communication frameworks, and influencing without authority.',
            moduleStatus: 'Published',
            published: true,
            moduleOrder: 4,
            duration: 90,
            activities: {
              create: [
                {
                  title: 'Stakeholder Mapping Exercise',
                  summary: 'Map stakeholders by influence and interest for a project scenario',
                  content: 'Given a project brief, identify all stakeholders and position them on a power/interest grid.',
                  duration: 25,
                  activityType: 'Exercise',
                  activityCategory: 'Exercise',
                  activityStatus: 'Published',
                  published: true,
                  ActivityOrder: 1
                },
                {
                  title: 'Managing Up Role-Play',
                  summary: 'Practice delivering difficult news to a senior leader',
                  content: 'Role-play scenario: present a project delay to a VP with a proposed recovery plan.',
                  duration: 30,
                  activityType: 'Simulation',
                  activityCategory: 'Exercise',
                  activityStatus: 'Published',
                  published: true,
                  ActivityOrder: 2
                },
                {
                  title: 'Client Update Email Draft',
                  summary: 'Write a professional project status update for a client',
                  content: 'Draft a client-facing status update that balances transparency with confidence.',
                  duration: 20,
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
            title: 'Cross-Cultural Communication',
            summary: 'Navigate communication differences across cultures and regions.',
            content: 'Understand high-context vs low-context cultures, virtual meeting etiquette across time zones, and inclusive language practices.',
            moduleStatus: 'Published',
            published: true,
            moduleOrder: 5,
            duration: 80,
            activities: {
              create: [
                {
                  title: 'Cultural Dimensions Assessment',
                  summary: 'Assess your own cultural communication preferences',
                  content: 'Complete the Hofstede-based assessment to understand your default communication style.',
                  duration: 20,
                  activityType: 'Assessment',
                  activityCategory: 'Self-Assessment',
                  activityStatus: 'Published',
                  published: true,
                  ActivityOrder: 1
                },
                {
                  title: 'Global Team Meeting Simulation',
                  summary: 'Run a virtual meeting with participants from different cultural backgrounds',
                  content: 'Facilitate a simulated cross-cultural meeting, navigating different communication norms.',
                  duration: 35,
                  activityType: 'Simulation',
                  activityCategory: 'Exercise',
                  activityStatus: 'Published',
                  published: true,
                  ActivityOrder: 2
                },
                {
                  title: 'Inclusive Language Quiz',
                  summary: 'Identify and correct non-inclusive language in business communications',
                  content: 'Review 10 business communication samples and flag or rewrite non-inclusive phrasing.',
                  duration: 15,
                  activityType: 'Quiz',
                  activityCategory: 'Quiz',
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

  // ════════════════════════════════════════════════════════════════
  // COURSE 2: Project Management Fundamentals
  // ════════════════════════════════════════════════════════════════
  const course2 = await prisma.courses.create({
    data: {
      title: 'Project Management Fundamentals',
      summary: 'A comprehensive introduction to project management methodologies, tools, and best practices. From traditional waterfall to agile and hybrid approaches, learn to plan, execute, and deliver projects on time and on budget.',
      language: 'English',
      deliveryMethod: 'In-Person',
      cost: 1500.00,
      level: 'Beginner',
      certification: 'Project Management Foundations Certificate',
      CourseType: 'Professional',
      courseCategory: 'Project Management',
      courseStatus: 'Published',
      isActive: true,
      targetAudience: 'New Project Managers, Team Leads, Business Analysts',
      published: true,
      code: 'PM-201',
      version: '3.1',
      rating: 4.7,
      createdBy: systemUser.id,
      sub_organizationId: SUB_ORG_ID,
      modules: {
        create: [
          {
            title: 'The Project Management Lifecycle',
            summary: 'Understand the five process groups: Initiating, Planning, Executing, Monitoring & Controlling, Closing.',
            content: 'Overview of PMBOK process groups, project charter development, and the role of the project manager.',
            moduleStatus: 'Published',
            published: true,
            moduleOrder: 1,
            duration: 90,
            activities: {
              create: [
                {
                  title: 'Project Charter Workshop',
                  summary: 'Draft a project charter for a sample initiative',
                  content: 'Given a business case, create a complete project charter including objectives, scope, stakeholders, and success criteria.',
                  duration: 35,
                  activityType: 'Workshop',
                  activityCategory: 'Exercise',
                  activityStatus: 'Published',
                  published: true,
                  ActivityOrder: 1
                },
                {
                  title: 'Process Group Matching Quiz',
                  summary: 'Match project activities to the correct process group',
                  content: 'Interactive quiz to reinforce understanding of which activities belong in each process group.',
                  duration: 15,
                  activityType: 'Quiz',
                  activityCategory: 'Quiz',
                  activityStatus: 'Published',
                  published: true,
                  ActivityOrder: 2
                },
                {
                  title: 'PM Role Discussion',
                  summary: 'Group discussion on the evolving role of the project manager',
                  content: 'Facilitated discussion comparing traditional PM roles with modern servant-leadership approaches.',
                  duration: 25,
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
            title: 'Scope & Requirements Management',
            summary: 'Define, document, and control project scope to prevent scope creep.',
            content: 'Work Breakdown Structure (WBS), requirements gathering techniques, scope baseline, and change control.',
            moduleStatus: 'Published',
            published: true,
            moduleOrder: 2,
            duration: 100,
            activities: {
              create: [
                {
                  title: 'WBS Construction Exercise',
                  summary: 'Build a Work Breakdown Structure for a real-world project',
                  content: 'Decompose a project into work packages using the WBS technique. Present and defend your structure.',
                  duration: 40,
                  activityType: 'Exercise',
                  activityCategory: 'Exercise',
                  activityStatus: 'Published',
                  published: true,
                  ActivityOrder: 1
                },
                {
                  title: 'Requirements Elicitation Role-Play',
                  summary: 'Practice interviewing a stakeholder to gather requirements',
                  content: 'Pairs role-play: one person is the stakeholder, the other the PM. Gather and document requirements.',
                  duration: 30,
                  activityType: 'Simulation',
                  activityCategory: 'Exercise',
                  activityStatus: 'Published',
                  published: true,
                  ActivityOrder: 2
                },
                {
                  title: 'Scope Creep Case Study',
                  summary: 'Analyze a failed project and identify scope management failures',
                  content: 'Review a case study of a project that suffered massive scope creep. Identify root causes and propose controls.',
                  duration: 25,
                  activityType: 'Case Study',
                  activityCategory: 'Analysis',
                  activityStatus: 'Published',
                  published: true,
                  ActivityOrder: 3
                }
              ]
            }
          },
          {
            title: 'Scheduling & Resource Planning',
            summary: 'Create realistic project schedules and allocate resources effectively.',
            content: 'Gantt charts, critical path method, resource leveling, and estimation techniques (analogous, parametric, three-point).',
            moduleStatus: 'Published',
            published: true,
            moduleOrder: 3,
            duration: 110,
            activities: {
              create: [
                {
                  title: 'Gantt Chart Construction',
                  summary: 'Build a Gantt chart with dependencies and milestones',
                  content: 'Using provided task data, create a Gantt chart, identify the critical path, and calculate total project duration.',
                  duration: 40,
                  activityType: 'Exercise',
                  activityCategory: 'Exercise',
                  activityStatus: 'Published',
                  published: true,
                  ActivityOrder: 1
                },
                {
                  title: 'Estimation Techniques Workshop',
                  summary: 'Practice three estimation methods on the same project',
                  content: 'Apply analogous, parametric, and three-point estimation to a set of work packages. Compare results.',
                  duration: 35,
                  activityType: 'Workshop',
                  activityCategory: 'Exercise',
                  activityStatus: 'Published',
                  published: true,
                  ActivityOrder: 2
                },
                {
                  title: 'Resource Allocation Simulation',
                  summary: 'Balance resource demand against availability constraints',
                  content: 'Given resource calendars and task assignments, resolve over-allocations using leveling and fast-tracking.',
                  duration: 30,
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
            title: 'Risk Management',
            summary: 'Identify, assess, and mitigate project risks before they become issues.',
            content: 'Risk identification techniques, qualitative and quantitative risk analysis, risk response strategies, and risk registers.',
            moduleStatus: 'Published',
            published: true,
            moduleOrder: 4,
            duration: 90,
            activities: {
              create: [
                {
                  title: 'Risk Register Workshop',
                  summary: 'Build a comprehensive risk register for a project scenario',
                  content: 'Identify at least 10 risks, assess probability and impact, and define response strategies for each.',
                  duration: 35,
                  activityType: 'Workshop',
                  activityCategory: 'Exercise',
                  activityStatus: 'Published',
                  published: true,
                  ActivityOrder: 1
                },
                {
                  title: 'Risk Response Strategy Quiz',
                  summary: 'Match risk scenarios to appropriate response strategies',
                  content: 'Quiz covering avoid, transfer, mitigate, accept, escalate, and exploit strategies.',
                  duration: 15,
                  activityType: 'Quiz',
                  activityCategory: 'Quiz',
                  activityStatus: 'Published',
                  published: true,
                  ActivityOrder: 2
                },
                {
                  title: 'Monte Carlo Estimation Demo',
                  summary: 'See how Monte Carlo simulation quantifies schedule risk',
                  content: 'Instructor-led demonstration of Monte Carlo analysis applied to a project schedule.',
                  duration: 25,
                  activityType: 'Interactive',
                  activityCategory: 'Exercise',
                  activityStatus: 'Published',
                  published: true,
                  ActivityOrder: 3
                },
                {
                  title: 'Lessons Learned Discussion',
                  summary: 'Share risk management lessons from past projects',
                  content: 'Group discussion: each participant shares a risk that materialized and how it was (or should have been) handled.',
                  duration: 20,
                  activityType: 'Interactive',
                  activityCategory: 'Exercise',
                  activityStatus: 'Published',
                  published: true,
                  ActivityOrder: 4
                }
              ]
            }
          },
          {
            title: 'Agile & Hybrid Methods',
            summary: 'Blend agile practices with traditional PM for the best of both worlds.',
            content: 'Scrum framework, Kanban basics, sprint planning, retrospectives, and when to use hybrid approaches.',
            moduleStatus: 'Published',
            published: true,
            moduleOrder: 5,
            duration: 100,
            activities: {
              create: [
                {
                  title: 'Sprint Planning Simulation',
                  summary: 'Run a simulated sprint planning session',
                  content: 'As a team, estimate user stories, set sprint goals, and commit to a sprint backlog.',
                  duration: 35,
                  activityType: 'Simulation',
                  activityCategory: 'Exercise',
                  activityStatus: 'Published',
                  published: true,
                  ActivityOrder: 1
                },
                {
                  title: 'Kanban Board Setup',
                  summary: 'Design a Kanban board for a support team scenario',
                  content: 'Define columns, WIP limits, and policies for a Kanban board. Simulate flow with sticky notes.',
                  duration: 25,
                  activityType: 'Exercise',
                  activityCategory: 'Exercise',
                  activityStatus: 'Published',
                  published: true,
                  ActivityOrder: 2
                },
                {
                  title: 'Retrospective Facilitation',
                  summary: 'Facilitate a sprint retrospective using the Sailboat method',
                  content: 'Each participant takes a turn facilitating a 10-minute retrospective for their table group.',
                  duration: 30,
                  activityType: 'Workshop',
                  activityCategory: 'Exercise',
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

  // ════════════════════════════════════════════════════════════════
  // COURSE 3: Data-Driven Decision Making
  // ════════════════════════════════════════════════════════════════
  const course3 = await prisma.courses.create({
    data: {
      title: 'Data-Driven Decision Making',
      summary: 'Empower non-technical professionals to leverage data for smarter business decisions. From reading dashboards to building business cases backed by evidence, this course bridges the gap between data and action.',
      language: 'English',
      deliveryMethod: 'Blended',
      cost: 1350.00,
      level: 'Beginner',
      certification: 'Data Literacy Certificate',
      CourseType: 'Professional',
      courseCategory: 'Analytics',
      courseStatus: 'Published',
      isActive: true,
      targetAudience: 'Managers, Analysts, Operations Staff',
      published: true,
      code: 'DATA-301',
      version: '1.5',
      rating: 4.6,
      createdBy: systemUser.id,
      sub_organizationId: SUB_ORG_ID,
      modules: {
        create: [
          {
            title: 'Data Literacy Foundations',
            summary: 'Understand what data is, where it comes from, and how to think critically about it.',
            content: 'Types of data, data quality, bias recognition, correlation vs. causation, and reading data visualizations.',
            moduleStatus: 'Published',
            published: true,
            moduleOrder: 1,
            duration: 80,
            activities: {
              create: [
                {
                  title: 'Spot the Misleading Chart',
                  summary: 'Identify common tricks used to misrepresent data visually',
                  content: 'Review 8 real-world charts and identify how each one misleads the reader. Propose corrections.',
                  duration: 20,
                  activityType: 'Exercise',
                  activityCategory: 'Exercise',
                  activityStatus: 'Published',
                  published: true,
                  ActivityOrder: 1
                },
                {
                  title: 'Correlation vs. Causation Quiz',
                  summary: 'Distinguish correlation from causation in business scenarios',
                  content: 'Given 10 business scenarios, determine whether the relationship is causal, correlational, or coincidental.',
                  duration: 15,
                  activityType: 'Quiz',
                  activityCategory: 'Quiz',
                  activityStatus: 'Published',
                  published: true,
                  ActivityOrder: 2
                },
                {
                  title: 'Data Source Mapping',
                  summary: 'Map the data sources available in a typical organization',
                  content: 'Create a data source inventory for a fictional company: CRM, ERP, HR, finance, web analytics.',
                  duration: 25,
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
            title: 'Excel & Spreadsheet Analytics',
            summary: 'Use spreadsheets as a powerful analysis tool beyond basic formulas.',
            content: 'Pivot tables, VLOOKUP/INDEX-MATCH, conditional formatting, data validation, and basic statistical functions.',
            moduleStatus: 'Published',
            published: true,
            moduleOrder: 2,
            duration: 120,
            activities: {
              create: [
                {
                  title: 'Pivot Table Deep Dive',
                  summary: 'Build pivot tables to analyze sales data by region and product',
                  content: 'Using a provided dataset of 10,000 sales records, create pivot tables to answer 5 business questions.',
                  duration: 40,
                  activityType: 'Lab',
                  activityCategory: 'Exercise',
                  activityStatus: 'Published',
                  published: true,
                  ActivityOrder: 1
                },
                {
                  title: 'Lookup Functions Challenge',
                  summary: 'Solve data matching problems using VLOOKUP and INDEX-MATCH',
                  content: 'Merge data from two separate worksheets using lookup functions. Compare accuracy and performance.',
                  duration: 30,
                  activityType: 'Exercise',
                  activityCategory: 'Exercise',
                  activityStatus: 'Published',
                  published: true,
                  ActivityOrder: 2
                },
                {
                  title: 'Dashboard Mockup in Excel',
                  summary: 'Create a simple management dashboard using charts and conditional formatting',
                  content: 'Build a one-page dashboard summarizing KPIs from a raw dataset. Use charts, sparklines, and color coding.',
                  duration: 45,
                  activityType: 'Project',
                  activityCategory: 'Project',
                  activityStatus: 'Published',
                  published: true,
                  ActivityOrder: 3
                }
              ]
            }
          },
          {
            title: 'Dashboards & Data Visualization',
            summary: 'Design dashboards that drive action, not just display numbers.',
            content: 'Dashboard design principles, choosing the right chart type, KPI selection, and storytelling with data.',
            moduleStatus: 'Published',
            published: true,
            moduleOrder: 3,
            duration: 100,
            activities: {
              create: [
                {
                  title: 'KPI Selection Workshop',
                  summary: 'Define meaningful KPIs for different business functions',
                  content: 'For each of 4 departments (Sales, Marketing, Operations, HR), define 3 KPIs that drive behavior.',
                  duration: 30,
                  activityType: 'Workshop',
                  activityCategory: 'Exercise',
                  activityStatus: 'Published',
                  published: true,
                  ActivityOrder: 1
                },
                {
                  title: 'Chart Type Decision Tree',
                  summary: 'Practice choosing the right visualization for different data scenarios',
                  content: 'Given 12 data scenarios, select and justify the best chart type (bar, line, scatter, pie, heatmap, etc.).',
                  duration: 20,
                  activityType: 'Exercise',
                  activityCategory: 'Exercise',
                  activityStatus: 'Published',
                  published: true,
                  ActivityOrder: 2
                },
                {
                  title: 'Dashboard Critique',
                  summary: 'Evaluate existing dashboards and propose improvements',
                  content: 'Review 3 real-world dashboards. Score each on clarity, actionability, and design. Propose improvements.',
                  duration: 25,
                  activityType: 'Interactive',
                  activityCategory: 'Analysis',
                  activityStatus: 'Published',
                  published: true,
                  ActivityOrder: 3
                },
                {
                  title: 'Build Your Own Dashboard',
                  summary: 'Design a dashboard layout for your department',
                  content: 'Sketch a dashboard wireframe for your real department. Present and get peer feedback.',
                  duration: 35,
                  activityType: 'Project',
                  activityCategory: 'Project',
                  activityStatus: 'Published',
                  published: true,
                  ActivityOrder: 4
                }
              ]
            }
          },
          {
            title: 'Statistical Thinking for Business',
            summary: 'Apply basic statistical concepts to everyday business decisions.',
            content: 'Averages and distributions, A/B testing basics, confidence intervals, and sample size considerations.',
            moduleStatus: 'Published',
            published: true,
            moduleOrder: 4,
            duration: 90,
            activities: {
              create: [
                {
                  title: 'A/B Test Design Exercise',
                  summary: 'Design an A/B test for a marketing campaign',
                  content: 'Define hypothesis, control/variant groups, sample size, and success metrics for a campaign test.',
                  duration: 30,
                  activityType: 'Exercise',
                  activityCategory: 'Exercise',
                  activityStatus: 'Published',
                  published: true,
                  ActivityOrder: 1
                },
                {
                  title: 'Reading Statistical Reports',
                  summary: 'Interpret statistical findings in business reports',
                  content: 'Review 3 business reports with statistical claims. Identify whether conclusions are well-supported.',
                  duration: 25,
                  activityType: 'Exercise',
                  activityCategory: 'Analysis',
                  activityStatus: 'Published',
                  published: true,
                  ActivityOrder: 2
                },
                {
                  title: 'Statistics in Plain English Quiz',
                  summary: 'Translate statistical jargon into business language',
                  content: 'Given statistical statements, rewrite them in plain English that a non-technical executive would understand.',
                  duration: 15,
                  activityType: 'Quiz',
                  activityCategory: 'Quiz',
                  activityStatus: 'Published',
                  published: true,
                  ActivityOrder: 3
                }
              ]
            }
          },
          {
            title: 'Building the Business Case',
            summary: 'Use data to build compelling business cases that get funded.',
            content: 'ROI analysis, cost-benefit frameworks, presenting data to executives, and overcoming objections with evidence.',
            moduleStatus: 'Published',
            published: true,
            moduleOrder: 5,
            duration: 110,
            activities: {
              create: [
                {
                  title: 'ROI Calculator Exercise',
                  summary: 'Calculate ROI for a proposed business initiative',
                  content: 'Given cost and benefit projections, calculate ROI, payback period, and NPV for a technology investment.',
                  duration: 30,
                  activityType: 'Exercise',
                  activityCategory: 'Exercise',
                  activityStatus: 'Published',
                  published: true,
                  ActivityOrder: 1
                },
                {
                  title: 'Business Case Presentation',
                  summary: 'Present a data-backed business case to a simulated leadership panel',
                  content: 'Each participant presents a 5-minute business case. Panel asks challenging questions about the data.',
                  duration: 45,
                  activityType: 'Simulation',
                  activityCategory: 'Exercise',
                  activityStatus: 'Published',
                  published: true,
                  ActivityOrder: 2
                },
                {
                  title: 'Objection Handling Workshop',
                  summary: 'Practice responding to data skeptics with evidence',
                  content: 'Role-play exercise: defend your analysis against common objections (sample size, bias, outliers).',
                  duration: 30,
                  activityType: 'Workshop',
                  activityCategory: 'Exercise',
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

  console.log(`  ✓ Course: ${course1.title} (${course1.code})`);
  console.log(`  ✓ Course: ${course2.title} (${course2.code})`);
  console.log(`  ✓ Course: ${course3.title} (${course3.code})`);

  // ── Curriculum ────────────────────────────────────────────────
  console.log('📖 Creating curriculum...');
  const curriculum = await prisma.curriculums.create({
    data: {
      title: 'Corporate Excellence Accelerator',
      description: 'A comprehensive 3-course curriculum designed to uplift core professional competencies across the organization — communication, project execution, and data-driven thinking.',
      status: 'active',
      sub_organizationId: SUB_ORG_ID,
      curriculum_courses: {
        create: [
          { courseId: course1.id },
          { courseId: course2.id },
          { courseId: course3.id }
        ]
      }
    }
  });
  console.log(`  ✓ Curriculum: ${curriculum.title}`);

  // ── Project ───────────────────────────────────────────────────
  console.log('📋 Creating project...');
  const project = await prisma.projects.create({
    data: {
      cuid: 'proj-corp-excellence-2026',
      sub_organizationId: SUB_ORG_ID,
      CreatedBy: systemUser.id,
      published: true,
      title: 'Q2 2026 Corporate Excellence Program',
      summary: 'Intensive 3-day professional development bootcamp for mid-level managers and senior individual contributors. Covers communication, project management, and data literacy in a fast-paced immersive format.',
      duration: 3,
      tags: JSON.stringify([
        { label: 'corporate-training' },
        { label: 'professional-development' },
        { label: 'Q2-2026' }
      ]),
      projectType: 'Training Program',
      projectCategory: 'Professional Development',
      projectStatus: 'ongoing',
      color: '#1565C0',
      language: 'english',
      location: {
        type: 'hybrid',
        address: '200 Bay Street, Suite 3400, Toronto, ON',
        virtual_link: 'https://teams.vertexsolutions.com/corporate-excellence',
        room: 'Training Center - Floor 34'
      },
      trainingRecipientId: trainingRecipient.id
    }
  });

  // Project settings
  await prisma.project_settings.create({
    data: {
      projectId: project.id,
      startDate: futureDate(1),
      endDate: futureDate(3),
      startOfDayTime: '09:00',
      endOfDayTime: '17:00',
      lunchTime: '12:00-13:00',
      timezone: 'America/Toronto',
      workingDays: ['monday', 'tuesday', 'wednesday', 'thursday', 'friday'],
      createdBy: systemUser.id
    }
  });

  // Link curriculum to project
  await prisma.project_curriculums.create({
    data: {
      projectId: project.id,
      curriculumId: curriculum.id
    }
  });
  console.log(`  ✓ Project: ${project.title}`);

  // ── Instructors ───────────────────────────────────────────────
  console.log('👨‍🏫 Creating instructors...');
  const instructors = await Promise.all([
    prisma.instructors.create({
      data: {
        firstName: 'Patricia',
        lastName: 'Holloway',
        email: 'patricia.holloway@vertexsolutions.com',
        phone: '+1-416-555-8810',
        bio: 'Senior corporate trainer with 14 years of experience in Fortune 500 learning & development. Specializes in leadership communication and executive presence.',
        expertise: ['Corporate Communication', 'Presentation Skills', 'Executive Coaching', 'Facilitation'],
        instructorType: 'main',
        status: 'active',
        qualifications: {
          degrees: ['M.A. Organizational Communication', 'B.A. English Literature'],
          certifications: ['Certified Professional in Talent Development (CPTD)', 'DDI Certified Facilitator'],
          experience: '14 years'
        },
        hourlyRate: 185.0,
        availability: {
          timezone: 'America/Toronto',
          preferred_days: ['Monday', 'Tuesday', 'Wednesday', 'Thursday'],
          preferred_times: ['09:00-17:00']
        },
        sub_organizationId: SUB_ORG_ID,
        createdBy: systemUser.id,
        updatedBy: systemUser.id
      }
    }),
    prisma.instructors.create({
      data: {
        firstName: 'James',
        lastName: 'Okafor',
        email: 'james.okafor@vertexsolutions.com',
        phone: '+1-416-555-8811',
        bio: 'PMP-certified project management instructor and former program director. Combines hands-on industry experience with engaging classroom delivery. Also teaches data analytics for business leaders.',
        expertise: ['Project Management', 'Agile/Scrum', 'Data Analytics', 'Risk Management', 'Business Intelligence'],
        instructorType: 'main',
        status: 'active',
        qualifications: {
          degrees: ['MBA Operations Management', 'B.Eng. Industrial Engineering'],
          certifications: ['PMP', 'PMI-ACP', 'Certified Scrum Master', 'Google Data Analytics Certificate'],
          experience: '11 years'
        },
        hourlyRate: 175.0,
        availability: {
          timezone: 'America/Toronto',
          preferred_days: ['Tuesday', 'Wednesday', 'Thursday', 'Friday'],
          preferred_times: ['09:00-17:00']
        },
        sub_organizationId: SUB_ORG_ID,
        createdBy: systemUser.id,
        updatedBy: systemUser.id
      }
    })
  ]);

  // Assign instructors to project
  await Promise.all([
    prisma.project_instructors.create({
      data: {
        projectId: project.id,
        instructorId: instructors[0].id,
        instructorType: 'main'
      }
    }),
    prisma.project_instructors.create({
      data: {
        projectId: project.id,
        instructorId: instructors[1].id,
        instructorType: 'main'
      }
    })
  ]);

  // Assign instructors to courses
  await Promise.all([
    prisma.course_instructors.create({
      data: { courseId: course1.id, instructorId: instructors[0].id, role: 'main' }
    }),
    prisma.course_instructors.create({
      data: { courseId: course2.id, instructorId: instructors[1].id, role: 'main' }
    }),
    prisma.course_instructors.create({
      data: { courseId: course3.id, instructorId: instructors[1].id, role: 'main' }
    })
  ]);

  // ── Participants ──────────────────────────────────────────────
  console.log('👥 Creating participants...');
  const participants = await Promise.all([
    prisma.participants.create({
      data: {
        firstName: 'Rachel',
        lastName: 'Drummond',
        email: 'rachel.drummond@vertexsolutions.com',
        participantStatus: 'active',
        participantType: 'learner',
        derpartement: 'Human Resources',
        roleId: employeeRole.id,
        notes: 'HR Business Partner, 6 years at Vertex. Strong communicator looking to sharpen data skills.',
        profilePrefs: { notification_email: true, notification_sms: false, timezone: 'America/Toronto' },
        credentials: { certifications: ['SHRM-CP', 'Certified Coach'] },
        createdBy: systemUser.id,
        updatedby: systemUser.id,
        sub_organization: SUB_ORG_ID,
        trainingRecipientId: trainingRecipient.id
      }
    }),
    prisma.participants.create({
      data: {
        firstName: 'Kevin',
        lastName: 'Tran',
        email: 'kevin.tran@vertexsolutions.com',
        participantStatus: 'active',
        participantType: 'learner',
        derpartement: 'Finance',
        roleId: employeeRole.id,
        notes: 'Senior Financial Analyst, 4 years at Vertex. Excel power user, wants to improve presentation skills.',
        profilePrefs: { notification_email: true, notification_sms: true, timezone: 'America/Toronto' },
        credentials: { certifications: ['CFA Level II', 'Advanced Excel'] },
        createdBy: systemUser.id,
        updatedby: systemUser.id,
        sub_organization: SUB_ORG_ID,
        trainingRecipientId: trainingRecipient.id
      }
    }),
    prisma.participants.create({
      data: {
        firstName: 'Samantha',
        lastName: 'Reyes',
        email: 'samantha.reyes@vertexsolutions.com',
        participantStatus: 'active',
        participantType: 'learner',
        derpartement: 'Marketing',
        roleId: employeeRole.id,
        notes: 'Marketing Manager, 5 years at Vertex. Creative thinker, needs PM fundamentals for campaign management.',
        profilePrefs: { notification_email: true, notification_sms: false, timezone: 'America/Toronto' },
        credentials: { certifications: ['Google Analytics Certified', 'HubSpot Inbound'] },
        createdBy: systemUser.id,
        updatedby: systemUser.id,
        sub_organization: SUB_ORG_ID,
        trainingRecipientId: trainingRecipient.id
      }
    }),
    prisma.participants.create({
      data: {
        firstName: 'Daniel',
        lastName: 'Ostrowski',
        email: 'daniel.ostrowski@vertexsolutions.com',
        participantStatus: 'active',
        participantType: 'learner',
        derpartement: 'Operations',
        roleId: employeeRole.id,
        notes: 'Operations Supervisor, 8 years at Vertex. Recently promoted, first formal management training.',
        profilePrefs: { notification_email: true, notification_sms: true, timezone: 'America/Toronto' },
        credentials: { certifications: ['Six Sigma Green Belt', 'OSHA Safety'] },
        createdBy: systemUser.id,
        updatedby: systemUser.id,
        sub_organization: SUB_ORG_ID,
        trainingRecipientId: trainingRecipient.id
      }
    }),
    prisma.participants.create({
      data: {
        firstName: 'Aisha',
        lastName: 'Patel',
        email: 'aisha.patel@vertexsolutions.com',
        participantStatus: 'active',
        participantType: 'learner',
        derpartement: 'Sales',
        roleId: employeeRole.id,
        notes: 'Regional Sales Lead, 3 years at Vertex. High performer, identified as future leadership pipeline.',
        profilePrefs: { notification_email: true, notification_sms: true, timezone: 'America/Toronto' },
        credentials: { certifications: ['Salesforce Certified', 'Sandler Sales Training'] },
        createdBy: systemUser.id,
        updatedby: systemUser.id,
        sub_organization: SUB_ORG_ID,
        trainingRecipientId: trainingRecipient.id
      }
    })
  ]);

  // Enroll participants in project
  const projectParticipants = await Promise.all(
    participants.map(p =>
      prisma.project_participants.create({
        data: {
          projectId: project.id,
          participantId: p.id,
          trainingRecipientId: trainingRecipient.id,
          status: 'active'
        }
      })
    )
  );
  console.log(`  ✓ ${participants.length} participants enrolled`);

  // ── Events (Sessions) ────────────────────────────────────────
  // 3 sessions per course, at 7/14/21 days from now
  console.log('📅 Creating sessions (events)...');

  // Day 1: 4 sessions | Day 2: 3 sessions | Day 3: 2 sessions
  const courseSessionData = [
    {
      course: course1,
      instructor: instructors[0],
      sessions: [
        { title: 'Communication Skills — Session 1: Writing & Storytelling', desc: 'Business writing essentials and presentation design fundamentals. Covers email makeover exercise and slide deck redesign.', dayOffset: 1, startHour: 9, endHour: 11, color: '#1565C0' },
        { title: 'Communication Skills — Session 2: Speaking & Stakeholders', desc: 'Public speaking techniques and stakeholder communication strategies. Includes elevator pitch practice and managing-up role-play.', dayOffset: 1, startHour: 13, endHour: 15, color: '#1565C0' },
        { title: 'Communication Skills — Session 3: Cross-Cultural & Capstone', desc: 'Cross-cultural communication workshop and capstone presentations. Final assessment and peer feedback.', dayOffset: 3, startHour: 9, endHour: 12, color: '#1565C0' }
      ]
    },
    {
      course: course2,
      instructor: instructors[1],
      sessions: [
        { title: 'Project Management — Session 1: Foundations & Scope', desc: 'PM lifecycle overview, project charter workshop, and scope/requirements management. Includes WBS construction exercise.', dayOffset: 1, startHour: 15, endHour: 17, color: '#2E7D32' },
        { title: 'Project Management — Session 2: Planning & Risk', desc: 'Scheduling techniques, resource planning, and risk management. Gantt chart construction and risk register workshop.', dayOffset: 2, startHour: 9, endHour: 12, color: '#2E7D32' },
        { title: 'Project Management — Session 3: Agile & Integration', desc: 'Agile and hybrid methods, sprint planning simulation, and course integration exercise.', dayOffset: 2, startHour: 13, endHour: 15, color: '#2E7D32' }
      ]
    },
    {
      course: course3,
      instructor: instructors[1],
      sessions: [
        { title: 'Data-Driven Decisions — Session 1: Literacy & Excel', desc: 'Data literacy foundations and hands-on Excel analytics. Pivot table deep dive and dashboard mockup exercise.', dayOffset: 1, startHour: 11, endHour: 12, color: '#E65100' },
        { title: 'Data-Driven Decisions — Session 2: Visualization & Statistics', desc: 'Dashboard design principles and statistical thinking for business. KPI workshop and A/B test design.', dayOffset: 2, startHour: 15, endHour: 17, color: '#E65100' },
        { title: 'Data-Driven Decisions — Session 3: Business Case Capstone', desc: 'Building and presenting data-backed business cases. Final ROI presentations and objection handling workshop.', dayOffset: 3, startHour: 13, endHour: 16, color: '#E65100' }
      ]
    }
  ];

  const allEvents = [];

  for (const courseData of courseSessionData) {
    for (const session of courseData.sessions) {
      const event = await prisma.events.create({
        data: {
          title: session.title,
          description: session.desc,
          eventType: 'course',
          projectId: project.id,
          courseId: courseData.course.id,
          start: futureDate(session.dayOffset, session.startHour, 0),
          end: futureDate(session.dayOffset, session.endHour, 0),
          allDay: false,
          color: session.color,
          backgroundColor: session.color,
          editable: true,
          eventStatus: 'scheduled',
          deliveryMode: 'hybrid',
          meetingLink: 'https://teams.vertexsolutions.com/corporate-excellence',
          extendedProps: {
            location: 'Training Center - Floor 34',
            instructor: `${courseData.instructor.firstName} ${courseData.instructor.lastName}`,
            capacity: 15,
            materials: 'Laptop required, printed workbook provided'
          }
        }
      });
      allEvents.push({ event, instructor: courseData.instructor });
    }
  }
  console.log(`  ✓ ${allEvents.length} sessions created (all future-dated)`);

  // ── Event Attendees & Instructors ─────────────────────────────
  console.log('📝 Adding attendees and instructors to sessions...');

  const attendeePromises = [];
  const instructorPromises = [];

  for (const { event, instructor } of allEvents) {
    // Add all 5 participants to every session
    for (const pp of projectParticipants) {
      attendeePromises.push(
        prisma.event_attendees.create({
          data: {
            eventsId: event.id,
            enrolleeId: pp.id,
            attendance_status: 'scheduled',
            createdBy: systemUser.id
          }
        })
      );
    }
    // Add instructor to event
    instructorPromises.push(
      prisma.event_instructors.create({
        data: {
          eventId: event.id,
          instructorId: instructor.id,
          role: 'main'
        }
      })
    );
  }

  await Promise.all([...attendeePromises, ...instructorPromises]);
  console.log(`  ✓ ${attendeePromises.length} attendee records created`);
  console.log(`  ✓ ${instructorPromises.length} instructor assignments created`);

  // ── Daily Training Notes (Session Notes) ──────────────────────
  console.log('📝 Creating session notes...');

  const today = new Date();
  const noteDate1 = new Date(today);
  noteDate1.setDate(today.getDate() - 2);
  const noteDate2 = new Date(today);
  noteDate2.setDate(today.getDate() - 1);
  const noteDate3 = new Date(today);

  await Promise.all([
    prisma.daily_training_notes.create({
      data: {
        projectId: project.id,
        date: noteDate1,
        keyHighlights: [
          'Kicked off the Corporate Excellence Accelerator with strong attendance — all 5 participants present and engaged.',
          'Pre-assessment results show communication skills as the top development area across the cohort.',
          'Patricia Holloway delivered an energizing opening session on the importance of executive presence.',
          'Participants responded well to the email makeover exercise — real examples drove great discussion.'
        ],
        challenges: [
          'Two participants initially reluctant to participate in the elevator pitch exercise — resolved through smaller breakout groups.',
          'Video conferencing setup in the training room had audio lag for remote segments — IT to resolve before next session.',
          'Kevin Tran mentioned he already has strong Excel skills — need to ensure DATA-301 sessions challenge him appropriately.'
        ],
        sessionNotes: 'Day 1 focused on building rapport within the cohort and establishing a safe learning environment. We used the "professional journey map" icebreaker which surfaced interesting cross-departmental connections — Rachel (HR) and Daniel (Ops) discovered they\'d worked on the same onboarding improvement project without ever meeting. The communication pre-assessment revealed that public speaking confidence is the weakest area for 4 out of 5 participants, while business writing is the strongest. Adjusted the Session 2 agenda to allocate more time to the speaking practice module. Overall energy and engagement were high. Patricia noted this is one of the more motivated cohorts she\'s seen.',
        author: 'Patricia Holloway',
        authorRole: 'Lead Instructor',
        createdBy: systemUser.id,
        updatedBy: systemUser.id
      }
    }),
    prisma.daily_training_notes.create({
      data: {
        projectId: project.id,
        date: noteDate2,
        keyHighlights: [
          'Project Management foundations session went exceptionally well — James Okafor\'s project charter workshop was the highlight.',
          'Samantha Reyes made an excellent connection between PM scope management and her marketing campaign planning challenges.',
          'The WBS construction exercise sparked productive debate about decomposition levels — great critical thinking from the group.',
          'Daniel Ostrowski showed natural PM instincts despite no formal training — flagged as potential PMP candidate.'
        ],
        challenges: [
          'Aisha Patel had a client call conflict and joined 45 minutes late — need to reinforce the importance of protected training time with her manager.',
          'The risk management section felt rushed — will extend it in Session 2 to include more hands-on practice.',
          'Some participants struggled with the Gantt chart dependencies — added supplementary practice materials for self-study.'
        ],
        sessionNotes: 'Day 2 transitioned to the PM Fundamentals track with James Okafor leading. The group dynamics are maturing nicely — participants are more comfortable challenging each other\'s ideas. The project charter workshop was particularly effective: each participant drafted a charter for a real initiative in their department. Kevin\'s charter for a finance automation project was especially well-structured. The scope creep case study generated the best discussion of the program so far — everyone had personal examples of scope creep in their work. We\'re ahead of schedule on the PM track which gives us room to spend more time on risk management in Session 2. Action item: send Gantt chart practice workbook to all participants before the next session.',
        author: 'James Okafor',
        authorRole: 'Lead Instructor',
        createdBy: systemUser.id,
        updatedBy: systemUser.id
      }
    }),
    prisma.daily_training_notes.create({
      data: {
        projectId: project.id,
        date: noteDate3,
        keyHighlights: [
          'Data Literacy session opened with the "Spot the Misleading Chart" exercise — participants were surprised how easily data can be manipulated.',
          'Kevin Tran stepped up as a peer mentor during the Excel pivot table segment, helping Rachel and Aisha with formula logic.',
          'The KPI selection workshop produced genuinely useful output — Samantha plans to implement her marketing KPI framework immediately.',
          'All participants completed the data source mapping exercise and identified 3+ data sources they didn\'t know existed in their departments.'
        ],
        challenges: [
          'Wide variance in Excel proficiency levels made pacing difficult — Kevin is advanced while Rachel is at beginner level.',
          'Need to provide differentiated materials: foundational guides for beginners, challenge problems for advanced users.',
          'The afternoon energy dip was noticeable — considering adding a hands-on activity right after lunch to keep momentum.'
        ],
        sessionNotes: 'Day 3 was the first Data-Driven Decision Making session. The biggest takeaway was how engaged non-technical participants became once they saw the immediate applicability to their work. Rachel\'s "aha moment" with pivot tables — where she realized she could automate a manual HR report that takes her 4 hours each month — was the highlight. The cohort is developing a supportive dynamic where stronger participants naturally help others without being asked. Kevin\'s peer mentoring is particularly valuable and I\'ve asked him to continue in this role. For the next data session, I\'m preparing tiered exercises (foundational, intermediate, advanced) to address the skill variance. The dashboard design module will be especially important for this group as several of them present data to senior leadership regularly.',
        author: 'James Okafor',
        authorRole: 'Lead Instructor',
        createdBy: systemUser.id,
        updatedBy: systemUser.id
      }
    })
  ]);
  console.log('  ✓ 3 session notes created');

  // ── Summary ───────────────────────────────────────────────────
  console.log('\n🎉 Corporate training seed completed successfully!');
  console.log('\n📊 Summary:');
  console.log(`  • Linked to org: ${ORG_ID}, sub-org: ${SUB_ORG_ID}`);
  console.log(`  • 3 Courses: ${course1.code}, ${course2.code}, ${course3.code} (5 modules each)`);
  console.log(`  • 1 Curriculum: ${curriculum.title}`);
  console.log(`  • 1 Project: ${project.title}`);
  console.log(`  • 2 Instructors: ${instructors.map(i => `${i.firstName} ${i.lastName}`).join(', ')}`);
  console.log(`  • 5 Participants: ${participants.map(p => `${p.firstName} ${p.lastName}`).join(', ')}`);
  console.log(`  • 9 Sessions (events) — all future-dated`);
  console.log(`  • 45 Event attendee records`);
  console.log(`  • 9 Event instructor assignments`);
  console.log(`  • 3 Daily training notes with session highlights`);
}

main()
  .catch((e) => {
    console.error('❌ Error during corporate seed:', e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
