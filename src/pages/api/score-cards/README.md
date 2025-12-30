# Score Cards API Documentation

This folder contains all API routes for the Course Assessment System (Score Cards).

## Overview

The assessment system allows:
- Creating multiple assessments per course
- Recording participant scores with flexible formats (10/25, 85/100, etc.)
- Managing retakes with configurable limits
- Manual pass/fail overrides by instructors
- Deactivating assessments at curriculum or project levels
- Tracking complete attempt history

---

## API Routes

### 1. Assessment Management

#### **POST /api/score-cards/createAssessment**
Create a new assessment for a course.

**Request Body:**
```json
{
  "courseId": 42,
  "title": "Final Exam",
  "description": "Comprehensive final examination",
  "maxScore": 100,
  "passingScore": 70,
  "isActive": true,
  "assessmentOrder": 1,
  "allowRetakes": true,
  "maxAttempts": 3,
  "scoreStrategy": "highest",
  "createdBy": "user123"
}
```

**Response:**
```json
{
  "success": true,
  "message": "Assessment created successfully",
  "assessment": { ... }
}
```

**Score Strategies:**
- `"latest"` - Use most recent attempt
- `"highest"` - Use best score achieved
- `"average"` - Average of all attempts
- `"first"` - Use first attempt only

---

#### **PUT /api/score-cards/updateAssessment**
Update an existing assessment.

**Request Body:**
```json
{
  "id": 1,
  "title": "Updated Title",
  "maxScore": 100,
  "passingScore": 75,
  "allowRetakes": false,
  "updatedBy": "user123"
}
```

**Response:**
```json
{
  "success": true,
  "message": "Assessment updated successfully",
  "assessment": { ... }
}
```

---

#### **DELETE /api/score-cards/deleteAssessment?id=1**
Delete an assessment (only if no scores exist).

**Query Parameters:**
- `id` - Assessment ID

**Response:**
```json
{
  "success": true,
  "message": "Assessment deleted successfully"
}
```

**Note:** Will fail if participant scores exist. Consider deactivating instead.

---

### 2. Participant Scoring

#### **POST /api/score-cards/recordScore**
Record a participant's score for an assessment. Handles retakes automatically.

**Request Body:**
```json
{
  "courseAssessmentId": 1,
  "participantId": 123,
  "instructorId": 5,
  "scoreEarned": 10,
  "scoreMaximum": 25,
  "feedback": "Good effort, needs improvement on section 3",
  "assessmentDate": "2024-01-20T10:00:00Z",
  "createdBy": "instructor5"
}
```

**Response:**
```json
{
  "success": true,
  "message": "Score recorded successfully (Attempt 1)",
  "score": { ... },
  "attemptNumber": 1,
  "totalAttempts": 1,
  "allAttempts": [ ... ]
}
```

**Auto-calculations:**
- `scorePercentage`: (10/25) * 100 = 40%
- `passed`: 40% >= 70% ? false
- `isCurrent`: Updated based on scoreStrategy

---

#### **PUT /api/score-cards/overrideScore**
Manually override the pass/fail status (with reason required).

**Request Body:**
```json
{
  "scoreId": 15,
  "passed": true,
  "overrideReason": "Demonstrated mastery in practical application despite lower test score",
  "updatedBy": "instructor5"
}
```

**Response:**
```json
{
  "success": true,
  "message": "Pass/fail status manually overridden to PASSED",
  "score": { ... },
  "override": {
    "previousStatus": "FAILED",
    "newStatus": "PASSED",
    "reason": "Demonstrated mastery..."
  }
}
```

---

### 3. Query Routes

#### **GET /api/score-cards/getCourseAssessments**
Get all assessments for a course with statistics.

**Query Parameters:**
- `courseId` (required) - Course ID
- `includeInactive` - Set to `"true"` to include inactive assessments

**Example:** `/api/score-cards/getCourseAssessments?courseId=42`

**Response:**
```json
{
  "success": true,
  "assessments": [
    {
      "id": 1,
      "title": "Final Exam",
      "maxScore": 100,
      "passingScore": 70,
      "allowRetakes": true,
      "maxAttempts": 3,
      "scoreStrategy": "highest",
      "statistics": {
        "totalParticipants": 25,
        "passedCount": 18,
        "failedCount": 7,
        "passRate": "72.0",
        "totalAttempts": 45,
        "averageAttempts": "1.8"
      }
    }
  ],
  "count": 1
}
```

---

#### **GET /api/score-cards/getParticipantScores**
Get scores for a specific participant.

**Query Parameters:**
- `participantId` (required) - Participant ID
- `courseId` (optional) - Filter by course
- `currentOnly` - Set to `"true"` to only show current scores

**Example:** `/api/score-cards/getParticipantScores?participantId=123&currentOnly=true`

**Response:**
```json
{
  "success": true,
  "scores": [ ... ],
  "groupedByAssessment": [
    {
      "assessment": { ... },
      "attempts": [ ... ],
      "currentScore": { ... },
      "statistics": {
        "totalAttempts": 3,
        "bestScore": 85,
        "averageScore": "75.33",
        "latestAttempt": { ... }
      }
    }
  ],
  "totalScores": 5
}
```

---

#### **GET /api/score-cards/getAttemptHistory**
Get complete attempt history for a participant on an assessment.

**Query Parameters:**
- `assessmentId` (required) - Assessment ID
- `participantId` (required) - Participant ID

**Example:** `/api/score-cards/getAttemptHistory?assessmentId=1&participantId=123`

**Response:**
```json
{
  "success": true,
  "assessment": { ... },
  "participant": { ... },
  "attempts": [
    {
      "attemptNumber": 1,
      "scoreEarned": 10,
      "scoreMaximum": 25,
      "scorePercentage": 40,
      "passed": false,
      "isOverridden": false,
      "isCurrent": false,
      "feedback": "Needs improvement",
      "assessmentDate": "2024-01-15T10:00:00Z"
    },
    {
      "attemptNumber": 2,
      "scoreEarned": 22,
      "scoreMaximum": 25,
      "scorePercentage": 88,
      "passed": true,
      "isOverridden": false,
      "isCurrent": true,
      "feedback": "Excellent improvement!",
      "assessmentDate": "2024-01-20T10:00:00Z"
    }
  ],
  "statistics": {
    "totalAttempts": 2,
    "passedAttempts": 1,
    "failedAttempts": 1,
    "overriddenAttempts": 0,
    "bestScore": 88,
    "worstScore": 40,
    "averageScore": "64.00",
    "improvement": "48.00",
    "currentAttempt": { ... },
    "canRetake": true,
    "remainingAttempts": 1
  }
}
```

---

### 4. Override Configuration

#### **POST /api/score-cards/configureCurriculumOverride**
Enable/disable an assessment for a specific curriculum.

**Request Body:**
```json
{
  "curriculumId": 10,
  "courseAssessmentId": 1,
  "isActive": false,
  "createdBy": "admin123"
}
```

**Response:**
```json
{
  "success": true,
  "message": "Assessment deactivated for curriculum",
  "override": { ... },
  "action": "created"
}
```

**Note:** Defaults to active. Set `isActive: false` to disable for a curriculum.

---

#### **POST /api/score-cards/configureProjectOverride**
Enable/disable an assessment for a specific project (highest precedence).

**Request Body:**
```json
{
  "projectId": 5,
  "courseAssessmentId": 1,
  "isActive": false,
  "createdBy": "admin123"
}
```

**Response:**
```json
{
  "success": true,
  "message": "Assessment deactivated for project",
  "override": { ... },
  "action": "updated"
}
```

**Note:** Project-level overrides take precedence over curriculum-level.

---

#### **GET /api/score-cards/getAssessmentStatus**
Check if an assessment is active for a specific project/curriculum.

**Query Parameters:**
- `assessmentId` (required) - Assessment ID
- `projectId` (optional) - Project ID to check
- `curriculumId` (optional) - Curriculum ID to check

**Example:** `/api/score-cards/getAssessmentStatus?assessmentId=1&projectId=5`

**Response:**
```json
{
  "success": true,
  "status": {
    "assessmentId": 1,
    "assessmentTitle": "Final Exam",
    "courseId": 42,
    "courseTitle": "Introduction to Project Management",
    "baseActive": true,
    "isActive": false,
    "overrideLevel": "project",
    "overrideDetails": {
      "projectId": 5,
      "projectTitle": "Summer Training 2024",
      "isActive": false,
      "configuredAt": "2024-01-10T08:00:00Z",
      "lastUpdated": "2024-01-15T10:30:00Z"
    }
  }
}
```

**Override Precedence:**
1. **Project-level** (highest)
2. **Curriculum-level** (medium)
3. **Base assessment** (lowest)

---

## Common Use Cases

### Use Case 1: Instructor Records Score (10/25)
```javascript
// POST /api/score-cards/recordScore
{
  "courseAssessmentId": 1,
  "participantId": 123,
  "instructorId": 5,
  "scoreEarned": 10,
  "scoreMaximum": 25,
  "feedback": "Needs more work on section 3"
}

// System auto-calculates:
// - scorePercentage: 40%
// - passed: false (40% < 70%)
// - attemptNumber: 1
```

### Use Case 2: Participant Retakes Assessment
```javascript
// First check if retakes allowed and within limits
// GET /api/score-cards/getAttemptHistory?assessmentId=1&participantId=123

// If allowed, record new score
// POST /api/score-cards/recordScore
{
  "courseAssessmentId": 1,
  "participantId": 123,
  "scoreEarned": 22,
  "scoreMaximum": 25
  // attemptNumber auto-increments to 2
}

// System recalculates current score based on scoreStrategy
```

### Use Case 3: Instructor Overrides Fail to Pass
```javascript
// PUT /api/score-cards/overrideScore
{
  "scoreId": 15,
  "passed": true,
  "overrideReason": "Exceptional practical demonstration despite test score"
}
```

### Use Case 4: Disable Assessment for Specific Project
```javascript
// POST /api/score-cards/configureProjectOverride
{
  "projectId": 5,
  "courseAssessmentId": 1,
  "isActive": false
}

// Participants in project 5 won't be scored on this assessment
```

---

## Error Codes

- **400** - Bad Request (validation errors)
- **404** - Resource Not Found
- **405** - Method Not Allowed
- **500** - Internal Server Error

---

## Data Models

### Scoring Example (10/25)
```json
{
  "scoreEarned": 10,
  "scoreMaximum": 25,
  "scorePercentage": 40.0,
  "passed": false,
  "isOverridden": false
}
```

### Display Format
- Raw: "10/25"
- Percentage: "40%"
- Combined: "10/25 (40%)"
- Status: "Failed"

---

## Notes

1. **Retake Logic**: System automatically handles attempt numbering and checks limits
2. **Score Strategy**: Determines which attempt counts as "current"
3. **Override Reason**: Required when manually changing pass/fail status
4. **Cascade Deletion**: Deleting assessment also removes all override configs
5. **Prevent Deletion**: Cannot delete assessment if participant scores exist
6. **Default Behavior**: Assessments default to active at all levels

---

## Database Tables

- `course_assessments` - Assessment configurations
- `participant_assessment_scores` - Actual scores with attempts
- `curriculum_assessment_config` - Curriculum-level overrides
- `project_assessment_config` - Project-level overrides

---

## Future Enhancements (Optional)

- Bulk import scores from CSV
- Assessment templates
- Score export to PDF
- Email notifications on score entry
- Analytics dashboard
- Grade curves and normalization
- Peer assessments
- Self-assessments
