/**
 * ============================================
 * Multi-Organization Integration Test Suite
 * ============================================
 *
 * Manual integration testing script for validating organization scoping.
 * Run with: node tests/integration/multi-org-test-suite.js
 *
 * Prerequisites:
 * 1. Database seeded with test data (run seed script first)
 * 2. Development server running (npm run dev)
 * 3. Two test organizations with different users
 */

const axios = require('axios');

// Configuration
const BASE_URL = 'http://localhost:8081';
const COLORS = {
  GREEN: '\x1b[32m',
  RED: '\x1b[31m',
  YELLOW: '\x1b[33m',
  BLUE: '\x1b[34m',
  RESET: '\x1b[0m'
};

// Test Results Tracker
let testResults = {
  passed: 0,
  failed: 0,
  total: 0,
  failures: []
};

/**
 * Test Organization Contexts
 * These should be created by the seed script
 */
const TEST_ORGS = {
  ORG_A: {
    name: 'Test Organization A',
    sessionCookie: null, // Will be set after login
    projectId: null,
    participantId: null,
    groupId: null,
    curriculumId: null,
    courseId: null,
    instructorId: null,
    eventId: null
  },
  ORG_B: {
    name: 'Test Organization B',
    sessionCookie: null,
    projectId: null,
    participantId: null,
    groupId: null,
    curriculumId: null,
    courseId: null,
    instructorId: null,
    eventId: null
  }
};

/**
 * Logging Helpers
 */
function log(message, color = COLORS.RESET) {
  console.log(`${color}${message}${COLORS.RESET}`);
}

function logTest(testName) {
  console.log(`\n${COLORS.BLUE}▶ Testing: ${testName}${COLORS.RESET}`);
}

function logPass(message) {
  testResults.passed++;
  testResults.total++;
  log(`  ✓ PASS: ${message}`, COLORS.GREEN);
}

function logFail(testName, message, error = null) {
  testResults.failed++;
  testResults.total++;
  testResults.failures.push({ testName, message, error });
  log(`  ✗ FAIL: ${message}`, COLORS.RED);
  if (error) {
    console.error(`    Error: ${error.message || error}`);
  }
}

/**
 * HTTP Request Helper
 */
async function makeRequest(method, endpoint, data = null, cookies = null) {
  try {
    const config = {
      method,
      url: `${BASE_URL}${endpoint}`,
      headers: {
        'Content-Type': 'application/json'
      }
    };

    if (cookies) {
      config.headers['Cookie'] = cookies;
    }

    if (data && ['POST', 'PUT', 'PATCH'].includes(method)) {
      config.data = data;
    }

    const response = await axios(config);
    return { success: true, data: response.data, status: response.status };
  } catch (error) {
    return {
      success: false,
      error: error.response?.data || error.message,
      status: error.response?.status
    };
  }
}

/**
 * Test Suite: Cross-Organization Access Prevention
 */
async function testCrossOrgAccessPrevention() {
  log('\n========================================', COLORS.YELLOW);
  log('TEST SUITE: Cross-Organization Access Prevention', COLORS.YELLOW);
  log('========================================', COLORS.YELLOW);

  // Test 1: Org A cannot access Org B's projects
  logTest('Org A cannot fetch Org B\'s projects');
  const projectTest = await makeRequest(
    'POST',
    '/api/projects/fetchProjects',
    {},
    TEST_ORGS.ORG_A.sessionCookie
  );

  if (projectTest.success) {
    const orgBProjectInResults = projectTest.data.projects?.some(
      p => p.id === TEST_ORGS.ORG_B.projectId
    );

    if (orgBProjectInResults) {
      logFail('Cross-Org Projects', 'Org A can see Org B\'s projects - SECURITY VIOLATION!');
    } else {
      logPass('Org A cannot see Org B\'s projects');
    }
  } else {
    logFail('Cross-Org Projects', 'Failed to fetch projects', projectTest.error);
  }

  // Test 2: Org A cannot access Org B's project details
  logTest('Org A cannot access Org B\'s project by ID');
  const projectDetailTest = await makeRequest(
    'GET',
    `/api/projects/${TEST_ORGS.ORG_B.projectId}`,
    null,
    TEST_ORGS.ORG_A.sessionCookie
  );

  if (projectDetailTest.status === 404) {
    logPass('Org A gets 404 when accessing Org B\'s project (resource hidden)');
  } else if (projectDetailTest.success) {
    logFail('Cross-Org Project Access', 'Org A can access Org B\'s project - SECURITY VIOLATION!');
  } else {
    logFail('Cross-Org Project Access', 'Unexpected response', projectDetailTest.error);
  }

  // Test 3: Org A cannot modify Org B's project
  logTest('Org A cannot update Org B\'s project');
  const updateTest = await makeRequest(
    'POST',
    '/api/projects/updateProject',
    {
      id: TEST_ORGS.ORG_B.projectId,
      title: 'HACKED BY ORG A'
    },
    TEST_ORGS.ORG_A.sessionCookie
  );

  if (updateTest.status === 404) {
    logPass('Org A gets 404 when trying to update Org B\'s project');
  } else if (updateTest.success) {
    logFail('Cross-Org Project Update', 'Org A can update Org B\'s project - SECURITY VIOLATION!');
  } else {
    logFail('Cross-Org Project Update', 'Unexpected response', updateTest.error);
  }

  // Test 4: Org A cannot delete Org B's project
  logTest('Org A cannot delete Org B\'s project');
  const deleteTest = await makeRequest(
    'DELETE',
    `/api/projects/${TEST_ORGS.ORG_B.projectId}`,
    null,
    TEST_ORGS.ORG_A.sessionCookie
  );

  if (deleteTest.status === 404) {
    logPass('Org A gets 404 when trying to delete Org B\'s project');
  } else if (deleteTest.success) {
    logFail('Cross-Org Project Delete', 'Org A can delete Org B\'s project - SECURITY VIOLATION!');
  } else {
    logFail('Cross-Org Project Delete', 'Unexpected response', deleteTest.error);
  }
}

/**
 * Test Suite: Participant Isolation
 */
async function testParticipantIsolation() {
  log('\n========================================', COLORS.YELLOW);
  log('TEST SUITE: Participant Isolation', COLORS.YELLOW);
  log('========================================', COLORS.YELLOW);

  // Test 1: Org A cannot access Org B's participants
  logTest('Org A cannot access Org B\'s participant data');
  const participantTest = await makeRequest(
    'GET',
    `/api/participants/${TEST_ORGS.ORG_B.participantId}`,
    null,
    TEST_ORGS.ORG_A.sessionCookie
  );

  if (participantTest.status === 404) {
    logPass('Org A gets 404 when accessing Org B\'s participant');
  } else if (participantTest.success) {
    logFail('Cross-Org Participant', 'Org A can access Org B\'s participant - SECURITY VIOLATION!');
  } else {
    logFail('Cross-Org Participant', 'Unexpected response', participantTest.error);
  }

  // Test 2: Org A cannot modify Org B's participants
  logTest('Org A cannot update Org B\'s participant');
  const updateParticipantTest = await makeRequest(
    'POST',
    '/api/participants/updateParticipant',
    {
      id: TEST_ORGS.ORG_B.participantId,
      firstName: 'HACKED'
    },
    TEST_ORGS.ORG_A.sessionCookie
  );

  if (updateParticipantTest.status === 404) {
    logPass('Org A gets 404 when updating Org B\'s participant');
  } else if (updateParticipantTest.success) {
    logFail('Cross-Org Participant Update', 'Org A can update Org B\'s participant - SECURITY VIOLATION!');
  } else {
    logFail('Cross-Org Participant Update', 'Unexpected response', updateParticipantTest.error);
  }

  // Test 3: Org A cannot delete Org B's participants
  logTest('Org A cannot delete Org B\'s participant');
  const deleteParticipantTest = await makeRequest(
    'DELETE',
    '/api/participants/delete',
    { participantId: TEST_ORGS.ORG_B.participantId },
    TEST_ORGS.ORG_A.sessionCookie
  );

  if (deleteParticipantTest.status === 404) {
    logPass('Org A gets 404 when deleting Org B\'s participant');
  } else if (deleteParticipantTest.success) {
    logFail('Cross-Org Participant Delete', 'Org A can delete Org B\'s participant - SECURITY VIOLATION!');
  } else {
    logFail('Cross-Org Participant Delete', 'Unexpected response', deleteParticipantTest.error);
  }
}

/**
 * Test Suite: Group Isolation
 */
async function testGroupIsolation() {
  log('\n========================================', COLORS.YELLOW);
  log('TEST SUITE: Group Isolation', COLORS.YELLOW);
  log('========================================', COLORS.YELLOW);

  // Test 1: Org A cannot add participants to Org B's groups
  logTest('Org A cannot add participant to Org B\'s group');
  const addToGroupTest = await makeRequest(
    'POST',
    '/api/projects/add-participant-to-group',
    {
      groupId: TEST_ORGS.ORG_B.groupId,
      participantId: TEST_ORGS.ORG_A.participantId
    },
    TEST_ORGS.ORG_A.sessionCookie
  );

  if (addToGroupTest.status === 404) {
    logPass('Org A gets 404 when adding to Org B\'s group');
  } else if (addToGroupTest.success) {
    logFail('Cross-Org Group Add', 'Org A can add participant to Org B\'s group - SECURITY VIOLATION!');
  } else {
    logFail('Cross-Org Group Add', 'Unexpected response', addToGroupTest.error);
  }

  // Test 2: Org A cannot remove participants from Org B's groups
  logTest('Org A cannot remove participant from Org B\'s group');
  const removeFromGroupTest = await makeRequest(
    'POST',
    '/api/projects/remove-participant-from-group',
    {
      groupId: TEST_ORGS.ORG_B.groupId,
      participantId: TEST_ORGS.ORG_B.participantId
    },
    TEST_ORGS.ORG_A.sessionCookie
  );

  if (removeFromGroupTest.status === 404) {
    logPass('Org A gets 404 when removing from Org B\'s group');
  } else if (removeFromGroupTest.success) {
    logFail('Cross-Org Group Remove', 'Org A can remove from Org B\'s group - SECURITY VIOLATION!');
  } else {
    logFail('Cross-Org Group Remove', 'Unexpected response', removeFromGroupTest.error);
  }

  // Test 3: Org A cannot update Org B's groups
  logTest('Org A cannot update Org B\'s group');
  const updateGroupTest = await makeRequest(
    'POST',
    '/api/projects/update-group',
    {
      groupId: TEST_ORGS.ORG_B.groupId,
      updates: { groupName: 'HACKED' },
      projectId: TEST_ORGS.ORG_B.projectId
    },
    TEST_ORGS.ORG_A.sessionCookie
  );

  if (updateGroupTest.status === 404) {
    logPass('Org A gets 404 when updating Org B\'s group');
  } else if (updateGroupTest.success) {
    logFail('Cross-Org Group Update', 'Org A can update Org B\'s group - SECURITY VIOLATION!');
  } else {
    logFail('Cross-Org Group Update', 'Unexpected response', updateGroupTest.error);
  }
}

/**
 * Test Suite: Curriculum and Course Isolation
 */
async function testCurriculumIsolation() {
  log('\n========================================', COLORS.YELLOW);
  log('TEST SUITE: Curriculum & Course Isolation', COLORS.YELLOW);
  log('========================================', COLORS.YELLOW);

  // Test 1: Org A cannot access Org B's curriculums
  logTest('Org A cannot access Org B\'s curriculum');
  const curriculumTest = await makeRequest(
    'POST',
    '/api/projects/fetchProjectCurriculums',
    { projectId: TEST_ORGS.ORG_B.projectId },
    TEST_ORGS.ORG_A.sessionCookie
  );

  if (curriculumTest.status === 404) {
    logPass('Org A gets 404 when fetching Org B\'s curriculums');
  } else if (curriculumTest.success) {
    logFail('Cross-Org Curriculum', 'Org A can access Org B\'s curriculums - SECURITY VIOLATION!');
  } else {
    logFail('Cross-Org Curriculum', 'Unexpected response', curriculumTest.error);
  }

  // Test 2: Org A cannot delete Org B's curriculums
  logTest('Org A cannot delete Org B\'s curriculum');
  const deleteCurriculumTest = await makeRequest(
    'DELETE',
    '/api/curriculums/deleteCurriculum',
    { curriculumId: TEST_ORGS.ORG_B.curriculumId },
    TEST_ORGS.ORG_A.sessionCookie
  );

  if (deleteCurriculumTest.status === 404) {
    logPass('Org A gets 404 when deleting Org B\'s curriculum');
  } else if (deleteCurriculumTest.success) {
    logFail('Cross-Org Curriculum Delete', 'Org A can delete Org B\'s curriculum - SECURITY VIOLATION!');
  } else {
    logFail('Cross-Org Curriculum Delete', 'Unexpected response', deleteCurriculumTest.error);
  }

  // Test 3: Org A cannot access Org B's course progress
  logTest('Org A cannot access Org B\'s course progress');
  const courseProgressTest = await makeRequest(
    'POST',
    '/api/projects/fetchEnrolleCourseProgress',
    { courseId: TEST_ORGS.ORG_B.courseId },
    TEST_ORGS.ORG_A.sessionCookie
  );

  if (courseProgressTest.status === 404) {
    logPass('Org A gets 404 when fetching Org B\'s course progress');
  } else if (courseProgressTest.success) {
    logFail('Cross-Org Course Progress', 'Org A can access Org B\'s course progress - SECURITY VIOLATION!');
  } else {
    logFail('Cross-Org Course Progress', 'Unexpected response', courseProgressTest.error);
  }
}

/**
 * Test Suite: Event and Instructor Isolation
 */
async function testEventIsolation() {
  log('\n========================================', COLORS.YELLOW);
  log('TEST SUITE: Event & Instructor Isolation', COLORS.YELLOW);
  log('========================================', COLORS.YELLOW);

  // Test 1: Org A cannot assign instructors to Org B's events
  logTest('Org A cannot assign instructor to Org B\'s event');
  const assignInstructorTest = await makeRequest(
    'POST',
    '/api/projects/assignInstructor',
    {
      eventId: TEST_ORGS.ORG_B.eventId,
      instructorId: TEST_ORGS.ORG_A.instructorId
    },
    TEST_ORGS.ORG_A.sessionCookie
  );

  if (assignInstructorTest.status === 404) {
    logPass('Org A gets 404 when assigning to Org B\'s event');
  } else if (assignInstructorTest.success) {
    logFail('Cross-Org Event Instructor', 'Org A can assign instructor to Org B\'s event - SECURITY VIOLATION!');
  } else {
    logFail('Cross-Org Event Instructor', 'Unexpected response', assignInstructorTest.error);
  }

  // Test 2: Org A cannot add participants to Org B's events
  logTest('Org A cannot add participant to Org B\'s event');
  const addEventParticipantTest = await makeRequest(
    'POST',
    '/api/projects/addEventParticipant',
    {
      eventId: TEST_ORGS.ORG_B.eventId,
      participantId: TEST_ORGS.ORG_A.participantId
    },
    TEST_ORGS.ORG_A.sessionCookie
  );

  if (addEventParticipantTest.status === 404) {
    logPass('Org A gets 404 when adding participant to Org B\'s event');
  } else if (addEventParticipantTest.success) {
    logFail('Cross-Org Event Participant', 'Org A can add participant to Org B\'s event - SECURITY VIOLATION!');
  } else {
    logFail('Cross-Org Event Participant', 'Unexpected response', addEventParticipantTest.error);
  }

  // Test 3: Org A cannot update Org B's instructors
  logTest('Org A cannot update Org B\'s instructor');
  const updateInstructorTest = await makeRequest(
    'PUT',
    '/api/instructors/updateInstructor',
    {
      id: TEST_ORGS.ORG_B.instructorId,
      firstName: 'HACKED'
    },
    TEST_ORGS.ORG_A.sessionCookie
  );

  if (updateInstructorTest.status === 404) {
    logPass('Org A gets 404 when updating Org B\'s instructor');
  } else if (updateInstructorTest.success) {
    logFail('Cross-Org Instructor Update', 'Org A can update Org B\'s instructor - SECURITY VIOLATION!');
  } else {
    logFail('Cross-Org Instructor Update', 'Unexpected response', updateInstructorTest.error);
  }
}

/**
 * Test Suite: Same-Organization Access (Positive Tests)
 */
async function testSameOrgAccess() {
  log('\n========================================', COLORS.YELLOW);
  log('TEST SUITE: Same-Organization Access (Positive Tests)', COLORS.YELLOW);
  log('========================================', COLORS.YELLOW);

  // Test 1: Org A CAN access its own projects
  logTest('Org A can fetch its own projects');
  const projectTest = await makeRequest(
    'POST',
    '/api/projects/fetchProjects',
    {},
    TEST_ORGS.ORG_A.sessionCookie
  );

  if (projectTest.success && projectTest.data.projects?.length > 0) {
    logPass('Org A can successfully fetch its own projects');
  } else {
    logFail('Same-Org Projects', 'Org A cannot fetch its own projects', projectTest.error);
  }

  // Test 2: Org A CAN access its own project details
  logTest('Org A can access its own project by ID');
  const projectDetailTest = await makeRequest(
    'GET',
    `/api/projects/${TEST_ORGS.ORG_A.projectId}`,
    null,
    TEST_ORGS.ORG_A.sessionCookie
  );

  if (projectDetailTest.success) {
    logPass('Org A can successfully access its own project details');
  } else {
    logFail('Same-Org Project Access', 'Org A cannot access its own project', projectDetailTest.error);
  }

  // Test 3: Org A CAN update its own project
  logTest('Org A can update its own project');
  const updateTest = await makeRequest(
    'POST',
    '/api/projects/updateProject',
    {
      id: TEST_ORGS.ORG_A.projectId,
      title: 'Updated by Org A'
    },
    TEST_ORGS.ORG_A.sessionCookie
  );

  if (updateTest.success) {
    logPass('Org A can successfully update its own project');
  } else {
    logFail('Same-Org Project Update', 'Org A cannot update its own project', updateTest.error);
  }
}

/**
 * Print Test Summary
 */
function printTestSummary() {
  log('\n========================================', COLORS.YELLOW);
  log('TEST SUMMARY', COLORS.YELLOW);
  log('========================================', COLORS.YELLOW);

  log(`\nTotal Tests: ${testResults.total}`);
  log(`Passed: ${testResults.passed}`, COLORS.GREEN);
  log(`Failed: ${testResults.failed}`, testResults.failed > 0 ? COLORS.RED : COLORS.GREEN);

  if (testResults.failed > 0) {
    log('\n========================================', COLORS.RED);
    log('FAILED TESTS:', COLORS.RED);
    log('========================================', COLORS.RED);

    testResults.failures.forEach((failure, index) => {
      log(`\n${index + 1}. ${failure.testName}`, COLORS.RED);
      log(`   ${failure.message}`);
      if (failure.error) {
        console.error('   Error:', failure.error);
      }
    });
  }

  const percentage = ((testResults.passed / testResults.total) * 100).toFixed(1);
  log(`\nSuccess Rate: ${percentage}%`, percentage === '100.0' ? COLORS.GREEN : COLORS.YELLOW);

  if (testResults.failed === 0) {
    log('\n🎉 ALL TESTS PASSED! Multi-tenant isolation is working correctly.', COLORS.GREEN);
  } else {
    log('\n⚠️  SECURITY VULNERABILITIES DETECTED! Review failed tests immediately.', COLORS.RED);
  }
}

/**
 * Main Test Runner
 */
async function runTests() {
  log('\n╔════════════════════════════════════════╗', COLORS.BLUE);
  log('║  Multi-Organization Integration Tests  ║', COLORS.BLUE);
  log('╚════════════════════════════════════════╝', COLORS.BLUE);

  log('\n⚠️  PREREQUISITES:', COLORS.YELLOW);
  log('   1. Development server running on http://localhost:8081');
  log('   2. Database seeded with test organizations');
  log('   3. TEST_ORGS configured with session cookies and IDs\n');

  log('⏸️  This is a TEMPLATE script. Before running:', COLORS.YELLOW);
  log('   - Update TEST_ORGS with actual session cookies');
  log('   - Update TEST_ORGS with actual resource IDs from your database');
  log('   - Run the test data seeding script first\n');

  // Check if configured
  if (!TEST_ORGS.ORG_A.sessionCookie || !TEST_ORGS.ORG_B.sessionCookie) {
    log('❌ ERROR: Session cookies not configured. Please update TEST_ORGS object.', COLORS.RED);
    log('   See tests/integration/README.md for setup instructions.\n', COLORS.YELLOW);
    return;
  }

  if (!TEST_ORGS.ORG_A.projectId || !TEST_ORGS.ORG_B.projectId) {
    log('❌ ERROR: Resource IDs not configured. Please update TEST_ORGS object.', COLORS.RED);
    log('   Run the seed script and update TEST_ORGS with actual IDs.\n', COLORS.YELLOW);
    return;
  }

  try {
    // Run all test suites
    await testCrossOrgAccessPrevention();
    await testParticipantIsolation();
    await testGroupIsolation();
    await testCurriculumIsolation();
    await testEventIsolation();
    await testSameOrgAccess();

    // Print summary
    printTestSummary();

  } catch (error) {
    log('\n❌ FATAL ERROR:', COLORS.RED);
    console.error(error);
  }
}

// Run tests if executed directly
if (require.main === module) {
  runTests().catch(console.error);
}

module.exports = { runTests };
