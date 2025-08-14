# EDWIND - Roles Definition and Access Rights

## 🎭 User Roles Overview

The EDWIND learning management system implements a role-based access control (RBAC) system with the following primary roles:

---

## 👨‍💼 **ADMIN**
*System Administrator - Full access to all system features*

### Core Responsibilities:
- Complete system administration and configuration
- User management and role assignment
- Organization and sub-organization management
- System security and data integrity oversight

### Access Rights:

#### **Course Management**
- ✅ Create, edit, and update courses
- ✅ Activate/deactivate courses
- ✅ **Force delete courses** (⚠️ **ADMIN ONLY** - bypasses safety checks)
- ✅ Duplicate courses and bulk operations
- ✅ Manage course instructors and assignments
- ✅ View all course analytics and reports

#### **Curriculum Management**
- ✅ Create and modify curriculums
- ✅ Add/remove courses from curriculums
- ✅ Manage curriculum sequences and dependencies
- ✅ Configure curriculum settings and prerequisites

#### **Project Management**
- ✅ Create, edit, and delete projects
- ✅ Manage project settings and schedules
- ✅ Assign participants and instructors to projects
- ✅ View all project analytics and progress reports
- ✅ Configure project groups and enrollment rules

#### **User Management**
- ✅ Create, edit, and deactivate user accounts
- ✅ Assign and modify user roles
- ✅ Manage instructor profiles and qualifications
- ✅ Handle participant enrollment and group assignments
- ✅ Access all user activity logs and reports

#### **System Configuration**
- ✅ Configure system-wide settings
- ✅ Manage training recipients and organizations
- ✅ Set up email templates and notifications
- ✅ Configure integration settings and APIs
- ✅ Access system logs and audit trails

#### **Advanced Operations**
- ✅ Database maintenance and backups
- ✅ System monitoring and performance optimization
- ✅ Security configuration and access control
- ✅ Data export and import operations

---

## 👨‍🏫 **INSTRUCTOR**
*Course facilitator and content delivery specialist*

### Core Responsibilities:
- Course delivery and instruction
- Student progress monitoring and assessment
- Content creation and updates within assigned courses
- Student support and mentoring

### Access Rights:

#### **Course Management**
- ✅ Edit courses they are assigned to
- ✅ Create and modify course modules and activities
- ✅ Manage course materials and resources
- ✅ View course enrollment and participant lists
- ❌ Delete courses (can only deactivate with admin approval)
- ❌ Force delete courses

#### **Student Management**
- ✅ View student progress and performance
- ✅ Grade assignments and assessments
- ✅ Provide feedback and comments
- ✅ Manage attendance records
- ✅ Communicate with students through platform

#### **Content Creation**
- ✅ Create and edit learning materials
- ✅ Upload resources and multimedia content
- ✅ Design assessments and quizzes
- ✅ Create support activities and workshops

#### **Schedule Management**
- ✅ View teaching schedule and assignments
- ✅ Update availability and preferences
- ✅ Manage office hours and consultation times
- ✅ Create and manage events for their courses

#### **Reporting**
- ✅ Generate progress reports for their students
- ✅ View course completion statistics
- ✅ Access attendance and engagement metrics
- ❌ Access system-wide analytics

---

## 🎓 **LEARNER** (Participant)
*Student or trainee enrolled in courses*

### Core Responsibilities:
- Active participation in learning activities
- Completion of assignments and assessments
- Engagement with course materials and peers
- Following course schedules and requirements

### Access Rights:

#### **Course Access**
- ✅ View enrolled courses and curricula
- ✅ Access course materials and resources
- ✅ Submit assignments and take assessments
- ✅ Track personal progress and completion status
- ❌ Edit course content or structure

#### **Learning Activities**
- ✅ Participate in discussions and forums
- ✅ Join virtual sessions and webinars
- ✅ Complete interactive exercises and labs
- ✅ Access support activities and tutoring

#### **Progress Tracking**
- ✅ View personal dashboard and progress
- ✅ Track course completion and certificates
- ✅ Access grade reports and feedback
- ✅ Monitor learning goals and achievements

#### **Communication**
- ✅ Communicate with instructors
- ✅ Participate in peer discussions
- ✅ Request help and support
- ✅ Receive notifications and updates

#### **Profile Management**
- ✅ Update personal profile information
- ✅ Manage notification preferences
- ✅ View learning history and transcripts
- ❌ Access other students' information

---

## 👥 **PROJECT MANAGER**
*Oversees specific training projects and programs*

### Core Responsibilities:
- Project planning and execution oversight
- Coordination between instructors and participants
- Project timeline and resource management
- Stakeholder communication and reporting

### Access Rights:

#### **Project Administration**
- ✅ Create and manage assigned projects
- ✅ Configure project settings and schedules
- ✅ Manage project participants and groups
- ✅ Assign instructors to project activities

#### **Curriculum Management**
- ✅ Select and assign curricula to projects
- ✅ Customize curriculum sequences for projects
- ✅ Monitor curriculum delivery progress
- ❌ Modify course content directly

#### **Participant Management**
- ✅ Enroll and manage project participants
- ✅ Create and manage participant groups
- ✅ Track participant progress and attendance
- ✅ Handle participant communications

#### **Reporting and Analytics**
- ✅ Generate project progress reports
- ✅ View project completion statistics
- ✅ Access participant performance metrics
- ✅ Create executive summaries and dashboards

---

## 🏢 **ORGANIZATION ADMIN**
*Manages organization-specific settings and users*

### Core Responsibilities:
- Organization-level user management
- Sub-organization configuration
- Training recipient management
- Organization-specific reporting

### Access Rights:

#### **Organization Management**
- ✅ Manage sub-organization settings
- ✅ Configure training recipients
- ✅ Manage organization-specific branding
- ✅ Set organization policies and guidelines

#### **User Management (Organization Scope)**
- ✅ Manage users within their organization
- ✅ Assign roles within organization boundaries
- ✅ View organization user activity reports
- ❌ Manage system-wide users

#### **Project Oversight**
- ✅ View all projects within organization
- ✅ Access organization-wide analytics
- ✅ Generate organization performance reports
- ❌ Modify system-wide settings

---

## 🔐 **Security and Access Control Rules**

### **Critical Security Restrictions**

#### **Force Delete Operations**
- ⚠️ **ADMIN ONLY**: Only system administrators can perform force delete operations
- 🛡️ **Safety Checks**: All other roles must use safe deactivation methods
- 📋 **Audit Trail**: All force delete operations are logged and tracked
- 🔒 **Confirmation Required**: Multiple confirmation steps for destructive operations

#### **Data Access Boundaries**
- 👥 **Organization Scoping**: Users can only access data within their organization
- 🎯 **Role-Based Filtering**: Content filtered based on user role and permissions
- 🔍 **Audit Logging**: All access attempts are logged for security monitoring
- 🚫 **Privilege Escalation**: Users cannot modify their own role assignments

### **Permission Hierarchy**
```
ADMIN (System-wide access)
  └── ORGANIZATION ADMIN (Organization-scope access)
      ├── PROJECT MANAGER (Project-scope access)
      ├── INSTRUCTOR (Course-scope access)
      └── LEARNER (Personal-scope access)
```

---

## 🛡️ **Access Control Implementation**

### **Authentication Requirements**
- 🔐 All users must authenticate through WorkOS AuthKit
- 🎫 JWT tokens used for session management
- 🔄 Token refresh mechanism for extended sessions
- 🚪 Automatic logout after inactivity period

### **Authorization Checks**
- ✅ Role verification on every API request
- 🔍 Resource ownership validation
- 🏢 Organization boundary enforcement
- 📝 Action-specific permission validation

### **Data Protection Measures**
- 🛡️ Row-level security for sensitive data
- 🔒 Encrypted storage for personal information
- 📊 Anonymized analytics and reporting
- 🗑️ Secure data deletion and archival

---

## 📋 **Role Assignment Guidelines**

### **Default Role Assignment**
- 🆕 **New Users**: Assigned LEARNER role by default
- 👨‍🏫 **Instructors**: Must be manually promoted by ADMIN or ORG ADMIN
- 👥 **Project Managers**: Require ADMIN approval for assignment
- 🏢 **Organization Admins**: Only assigned by System ADMIN

### **Role Modification Rules**
- ⬆️ **Promotion**: Higher-level roles can promote lower-level roles
- ⬇️ **Demotion**: Requires same or higher level authorization
- 🔄 **Role Changes**: All role modifications are logged and auditable
- ⏰ **Temporary Roles**: Support for time-limited role assignments

---

## 🚨 **Emergency Procedures**

### **Account Lockout**
- 🔒 ADMIN can immediately lock any user account
- 🚨 Automatic lockout after failed login attempts
- 📞 Emergency contact procedures for locked accounts
- 🔓 Multi-factor authentication for account recovery

### **Data Breach Response**
- 🚨 Immediate access revocation capabilities
- 📋 Comprehensive audit trail generation
- 🔐 Emergency password reset procedures
- 📊 Incident reporting and documentation

---

## 📈 **Future Considerations**

### **Planned Role Enhancements**
- 🎯 **Granular Permissions**: More specific permission sets
- 🏷️ **Custom Roles**: Organization-defined custom roles
- 🤖 **Automated Role Assignment**: Rule-based role assignment
- 📱 **Mobile-Specific Permissions**: Device-based access control

### **Integration Possibilities**
- 🔗 **SSO Integration**: Enhanced single sign-on capabilities
- 📊 **Analytics Integration**: Role-based analytics dashboards
- 🔐 **External Auth**: Third-party authentication providers
- 📱 **Mobile Apps**: Role-aware mobile applications

---

**Last Updated**: January 2025  
**Document Version**: 1.0  
**Next Review**: March 2025

> ⚠️ **Important**: This document defines security-critical access controls. Any modifications must be reviewed by the system administrator and security team before implementation.