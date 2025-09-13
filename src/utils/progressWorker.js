// Web Worker for heavy progress calculations (for future use with 500+ participants)
// This moves expensive calculations off the main thread

self.addEventListener('message', function(e) {
  const { type, data } = e.data;
  
  switch (type) {
    case 'CALCULATE_BATCH_PROGRESS':
      try {
        const { groups, progressData } = data;
        
        // Simulate heavy calculation work
        const results = groups.map(group => {
          // Complex progress calculations that would normally block UI
          let totalProgress = 0;
          let participantCount = 0;
          
          if (group.participants && Array.isArray(group.participants)) {
            group.participants.forEach(participant => {
              if (participant.progress !== undefined && participant.progress !== null) {
                totalProgress += participant.progress;
                participantCount++;
              }
            });
          }
          
          const averageProgress = participantCount > 0 ? Math.round(totalProgress / participantCount) : 0;
          
          return {
            groupId: group.id,
            averageProgress,
            participantCount,
            calculatedAt: Date.now()
          };
        });
        
        // Send results back to main thread
        self.postMessage({
          type: 'BATCH_PROGRESS_COMPLETE',
          results: results
        });
        
      } catch (error) {
        self.postMessage({
          type: 'BATCH_PROGRESS_ERROR',
          error: error.message
        });
      }
      break;
      
    default:
      self.postMessage({
        type: 'UNKNOWN_COMMAND',
        error: 'Unknown command type'
      });
  }
});

// Utility function for complex calculations
function calculateComplexMetrics(data) {
  // Future: Add complex statistical calculations
  // - Standard deviation of progress
  // - Completion rate trends
  // - Predictive completion dates
  // - Risk assessment scores
  
  return {
    calculated: true,
    timestamp: Date.now()
  };
}