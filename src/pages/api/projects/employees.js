

const employees = [
    {
        id: "1001",
        firstName: "John",
        lastName: "Doe",
        role: "Instructor",
        department: "Human Resources",
        status: "Active",
        email: "john.doe@example.com",
        group: "Group A",
        parentGroup: "Montreal Honda",
        courses: ["Introduction to HR", "Employee Training"]
    },
    {
        id: "1002",
        firstName: "Jane",
        lastName: "Smith",
        role: "Administrator",
        department: "Finance",
        status: "Inactive",
        email: "jane.smith@example.com",
        group: "Group B",
        parentGroup: "Montreal Honda",
        courses: ["Financial Management"]
    },
    {
        id: "1003",
        firstName: "Michael",
        lastName: "Johnson",
        role: "Support Staff",
        department: "IT",
        status: "Active",
        email: "michael.johnson@example.com",
        group: "Group A",
        parentGroup: "Montreal Honda",
        courses: ["IT Essentials", "Troubleshooting 101"]
    },
    {
        id: "1004",
        firstName: "Emily",
        lastName: "Williams",
        role: "Instructor",
        department: "Operations",
        status: "Active",
        email: "emily.williams@example.com",
        group: "Group C",
        parentGroup: "Montreal Honda",
        courses: ["Operations Management", "Logistics"]
    },
    {
        id: "1005",
        firstName: "David",
        lastName: "Brown",
        role: "Administrator",
        department: "Marketing",
        status: "On Leave",
        email: "david.brown@example.com",
        group: "Group B",
        parentGroup: "Montreal Honda",
        courses: ["Digital Marketing Strategies"]
    },
    {
        id: "1006",
        firstName: "Sarah",
        lastName: "Johnson",
        role: "Instructor",
        department: "Human Resources",
        status: "Active",
        email: "sarah.johnson@example.com",
        group: "Group A",
        parentGroup: "Montreal Honda",
        courses: ["Training and Development"]
    },
    {
        id: "1007",
        firstName: "Robert",
        lastName: "Lee",
        role: "Support Staff",
        department: "IT",
        status: "Active",
        email: "robert.lee@example.com",
        group: "Group B",
        parentGroup: "Montreal Honda",
        courses: ["IT Security Fundamentals"]
    },
    {
        id: "1008",
        firstName: "Laura",
        lastName: "Miller",
        role: "Administrator",
        department: "Finance",
        status: "Active",
        email: "laura.miller@example.com",
        group: "Group C",
        parentGroup: "Montreal Honda",
        courses: ["Financial Analysis"]
    },
    {
        id: "1009",
        firstName: "James",
        lastName: "Wilson",
        role: "Instructor",
        department: "Operations",
        status: "Inactive",
        email: "james.wilson@example.com",
        group: "Group A",
        parentGroup: "Montreal Honda",
        courses: ["Supply Chain Management"]
    },
    {
        id: "1010",
        firstName: "Emma",
        lastName: "Thompson",
        role: "Support Staff",
        department: "Marketing",
        status: "Active",
        email: "emma.thompson@example.com",
        group: "Group C",
        parentGroup: "Montreal Honda",
        courses: ["Social Media Marketing"]
    }
];


export default function handler(req, res) {
    return res.status(200).json({ employees: employees });
  };