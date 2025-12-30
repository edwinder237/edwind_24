import { addDays, subDays } from 'date-fns';

// Mock Instructors Data
export const mockInstructors = [
  {
    id: '1',
    name: 'John Smith',
    email: 'john.smith@example.com',
    specialization: 'Web Development',
    avatar: 'https://i.pravatar.cc/150?img=1',
    availability: 'available'
  },
  {
    id: '2',
    name: 'Sarah Johnson',
    email: 'sarah.johnson@example.com',
    specialization: 'Data Science',
    avatar: 'https://i.pravatar.cc/150?img=2',
    availability: 'available'
  },
  {
    id: '3',
    name: 'Michael Chen',
    email: 'michael.chen@example.com',
    specialization: 'Cloud Computing',
    avatar: 'https://i.pravatar.cc/150?img=3',
    availability: 'available'
  },
  {
    id: '4',
    name: 'Emily Davis',
    email: 'emily.davis@example.com',
    specialization: 'UI/UX Design',
    avatar: 'https://i.pravatar.cc/150?img=4',
    availability: 'available'
  },
  {
    id: '5',
    name: 'Robert Wilson',
    email: 'robert.wilson@example.com',
    specialization: 'DevOps',
    avatar: 'https://i.pravatar.cc/150?img=5',
    availability: 'available'
  }
];

// Mock Projects Data - Updated for October 31, 2025
export const mockProjects = [
  {
    id: '1',
    name: 'Advanced React Development',
    description: 'Comprehensive training on React.js including hooks, state management, and performance optimization',
    startDate: new Date(2025, 9, 15).toISOString(), // Oct 15, 2025
    endDate: new Date(2025, 11, 28).toISOString(), // Dec 28, 2025
    status: 'in-progress',
    projectStatus: 'ongoing',
    title: 'Advanced React Development',
    instructorId: '1',
    color: '#3498db',
    participants: ['Alice Brown', 'Bob Green', 'Charlie White', 'Diana Black'],
    progress: 65,
    location: JSON.stringify({
      lat: 40.7128,
      lng: -74.0060,
      address: 'New York, NY, USA',
      description: 'New York, NY'
    }),
    budget: 25000,
    tags: ['React', 'JavaScript', 'Frontend']
  },
  {
    id: '2',
    name: 'Python for Data Science',
    description: 'Introduction to Python programming with focus on data analysis and visualization',
    startDate: new Date(2025, 10, 1).toISOString(), // Nov 1, 2025
    endDate: new Date(2025, 11, 15).toISOString(), // Dec 15, 2025
    status: 'upcoming',
    projectStatus: 'pending',
    title: 'Python for Data Science',
    instructorId: '2',
    color: '#2ecc71',
    participants: ['Eva Martinez', 'Frank Lee', 'Grace Kim'],
    progress: 0,
    location: JSON.stringify({
      lat: 37.7749,
      lng: -122.4194,
      address: 'San Francisco, CA, USA',
      description: 'San Francisco, CA'
    }),
    budget: 30000,
    tags: ['Python', 'Data Science', 'ML']
  },
  {
    id: '3',
    name: 'AWS Cloud Architecture',
    description: 'Enterprise-level AWS cloud infrastructure design and implementation',
    startDate: new Date(2025, 8, 1).toISOString(), // Sep 1, 2025
    endDate: new Date(2025, 9, 31).toISOString(), // Oct 31, 2025
    status: 'completed',
    projectStatus: 'completed',
    title: 'AWS Cloud Architecture',
    instructorId: '3',
    color: '#e74c3c',
    participants: ['Henry Wilson', 'Isabel Garcia', 'Jack Thompson'],
    progress: 100,
    location: JSON.stringify({
      lat: 47.6062,
      lng: -122.3321,
      address: 'Seattle, WA, USA',
      description: 'Remote - Seattle, WA'
    }),
    budget: 35000,
    tags: ['AWS', 'Cloud', 'DevOps']
  },
  {
    id: '4',
    name: 'UI/UX Design Fundamentals',
    description: 'Complete guide to user interface and user experience design principles',
    startDate: new Date(2025, 11, 1).toISOString(), // Dec 1, 2025
    endDate: new Date(2026, 0, 30).toISOString(), // Jan 30, 2026
    status: 'upcoming',
    projectStatus: 'pending',
    title: 'UI/UX Design Fundamentals',
    instructorId: '4',
    color: '#9b59b6',
    participants: ['Kelly Adams', 'Leo Rodriguez', 'Maya Patel', 'Nathan Scott'],
    progress: 0,
    location: JSON.stringify({
      lat: 42.3601,
      lng: -71.0589,
      address: 'Boston, MA, USA',
      description: 'Boston, MA'
    }),
    budget: 20000,
    tags: ['Design', 'UX', 'Figma']
  },
  {
    id: '5',
    name: 'DevOps Pipeline Implementation',
    description: 'Building and maintaining CI/CD pipelines with modern DevOps tools',
    startDate: new Date(2025, 9, 20).toISOString(), // Oct 20, 2025
    endDate: new Date(2025, 11, 10).toISOString(), // Dec 10, 2025
    status: 'in-progress',
    projectStatus: 'ongoing',
    title: 'DevOps Pipeline Implementation',
    instructorId: '5',
    color: '#f39c12',
    participants: ['Olivia Brown', 'Peter Zhang'],
    progress: 45,
    location: JSON.stringify({
      lat: 41.8781,
      lng: -87.6298,
      address: 'Chicago, IL, USA',
      description: 'Chicago, IL'
    }),
    budget: 28000,
    tags: ['DevOps', 'CI/CD', 'Docker']
  },
  {
    id: '6',
    name: 'Mobile App Development with React Native',
    description: 'Cross-platform mobile application development using React Native',
    startDate: new Date(2026, 0, 15).toISOString(), // Jan 15, 2026
    endDate: new Date(2026, 2, 30).toISOString(), // Mar 30, 2026
    status: 'upcoming',
    instructorId: '1',
    color: '#1abc9c',
    participants: ['Quinn Davis', 'Rachel Miller', 'Sam Wilson'],
    progress: 0,
    location: 'Seattle, WA',
    budget: 32000,
    tags: ['React Native', 'Mobile', 'JavaScript']
  },
  {
    id: '7',
    name: 'Machine Learning Basics',
    description: 'Introduction to machine learning algorithms and applications',
    startDate: new Date(2025, 7, 15).toISOString(), // Aug 15, 2025
    endDate: new Date(2025, 8, 30).toISOString(), // Sep 30, 2025
    status: 'completed',
    instructorId: '2',
    color: '#34495e',
    participants: ['Tom Anderson', 'Uma Sharma', 'Victor Lee', 'Wendy Chen'],
    progress: 100,
    location: 'Austin, TX',
    budget: 40000,
    tags: ['ML', 'AI', 'Python']
  },
  {
    id: '8',
    name: 'Kubernetes Orchestration',
    description: 'Container orchestration with Kubernetes for scalable applications',
    startDate: new Date(2025, 10, 10).toISOString(), // Nov 10, 2025
    endDate: new Date(2026, 0, 5).toISOString(), // Jan 5, 2026
    status: 'in-progress',
    instructorId: '3',
    color: '#e67e22',
    participants: ['Xavier Brown', 'Yuki Tanaka', 'Zoe Williams'],
    progress: 30,
    location: 'Denver, CO',
    budget: 27000,
    tags: ['Kubernetes', 'Docker', 'Cloud']
  },
  {
    id: '9',
    name: 'Agile Project Management',
    description: 'Scrum and Agile methodologies for effective project management',
    startDate: new Date(2025, 9, 5).toISOString(), // Oct 5, 2025
    endDate: new Date(2025, 9, 25).toISOString(), // Oct 25, 2025
    status: 'completed',
    instructorId: '5',
    color: '#16a085',
    participants: ['Alex Morgan', 'Bailey Cooper'],
    progress: 100,
    location: 'Miami, FL',
    budget: 15000,
    tags: ['Agile', 'Scrum', 'Management']
  },
  {
    id: '10',
    name: 'Database Design and SQL',
    description: 'Relational database design principles and advanced SQL queries',
    startDate: new Date(2025, 11, 20).toISOString(), // Dec 20, 2025
    endDate: new Date(2026, 1, 10).toISOString(), // Feb 10, 2026
    status: 'upcoming',
    instructorId: '1',
    color: '#8e44ad',
    participants: ['Cameron Lee', 'Dakota Johnson', 'Eden Smith'],
    progress: 0,
    location: 'Portland, OR',
    budget: 22000,
    tags: ['SQL', 'Database', 'PostgreSQL']
  },
  {
    id: '11',
    name: 'Cybersecurity Essentials',
    description: 'Fundamentals of information security and threat prevention',
    startDate: new Date(2025, 10, 5).toISOString(), // Nov 5, 2025
    endDate: new Date(2025, 11, 25).toISOString(), // Dec 25, 2025
    status: 'in-progress',
    instructorId: null,
    color: '#c0392b',
    participants: ['Finn O\'Brien', 'Gina Martinez'],
    progress: 40,
    location: 'Remote',
    budget: 26000,
    tags: ['Security', 'Network', 'Ethical Hacking']
  },
  {
    id: '12',
    name: 'Blockchain Development',
    description: 'Smart contract development and blockchain architecture',
    startDate: new Date(2025, 6, 1).toISOString(), // Jul 1, 2025
    endDate: new Date(2025, 7, 15).toISOString(), // Aug 15, 2025
    status: 'cancelled',
    instructorId: '3',
    color: '#7f8c8d',
    participants: [],
    progress: 0,
    location: 'Los Angeles, CA',
    budget: 35000,
    tags: ['Blockchain', 'Solidity', 'Web3']
  }
];

// Helper function to generate timeline data for Gantt chart
export const generateTimelineData = (projects, viewMode = 'month') => {
  const now = new Date();
  let startDate, endDate;
  
  switch(viewMode) {
    case 'day':
      startDate = subDays(now, 7);
      endDate = addDays(now, 7);
      break;
    case 'week':
      startDate = subDays(now, 30);
      endDate = addDays(now, 30);
      break;
    case 'month':
    default:
      startDate = subDays(now, 90);
      endDate = addDays(now, 90);
      break;
  }
  
  return {
    startDate,
    endDate,
    projects: projects.map(project => ({
      ...project,
      start: new Date(project.startDate),
      end: new Date(project.endDate)
    }))
  };
};

// Helper function to check instructor availability
export const checkInstructorAvailability = (instructorId, startDate, endDate, projects, excludeProjectId = null) => {
  const conflicts = projects.filter(project => {
    if (project.id === excludeProjectId) return false;
    if (project.instructorId !== instructorId) return false;
    
    const projectStart = new Date(project.startDate);
    const projectEnd = new Date(project.endDate);
    const checkStart = new Date(startDate);
    const checkEnd = new Date(endDate);
    
    return (
      (checkStart >= projectStart && checkStart <= projectEnd) ||
      (checkEnd >= projectStart && checkEnd <= projectEnd) ||
      (checkStart <= projectStart && checkEnd >= projectEnd)
    );
  });
  
  return conflicts.length === 0;
};