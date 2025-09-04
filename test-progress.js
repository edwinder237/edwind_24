// Quick test to verify the progress API works
const axios = require('axios');

async function testProgress() {
  const baseUrl = 'http://localhost:8081';
  
  try {
    console.log('Testing save module progress...');
    
    // Test saving progress
    const saveResponse = await axios.post(`${baseUrl}/api/events/save-module-progress`, {
      eventId: 4,
      moduleId: 11,
      activities: [26],
      completed: true
    });
    
    console.log('Save response:', saveResponse.data);
    
    // Test fetching progress
    console.log('Testing get progress...');
    const getResponse = await axios.get(`${baseUrl}/api/events/get-progress?eventId=4`);
    
    console.log('Get response:', getResponse.data);
    
  } catch (error) {
    console.error('Error:', error.response?.data || error.message);
  }
}

testProgress();