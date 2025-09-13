import React, { useState, useEffect } from 'react';
import { 
  Box, 
  Typography, 
  Accordion, 
  AccordionSummary, 
  AccordionDetails,
  Chip,
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableRow,
  LinearProgress
} from '@mui/material';
import { ExpandMore } from '@mui/icons-material';

// Performance monitoring component - only shows in development
const PerformanceMonitor = () => {
  const [metrics, setMetrics] = useState({
    renderTimes: [],
    memoryUsage: 0,
    apiCalls: [],
    cacheHits: 0,
    cacheMisses: 0
  });

  useEffect(() => {
    if (process.env.NODE_ENV !== 'development') return;

    let observer;

    // Performance Observer for measuring render times
    if ('PerformanceObserver' in window) {
      observer = new PerformanceObserver((list) => {
        const entries = list.getEntries();
        entries.forEach(entry => {
          if (entry.entryType === 'measure' && entry.name.includes('Groups')) {
            setMetrics(prev => ({
              ...prev,
              renderTimes: [
                ...prev.renderTimes.slice(-9), // Keep last 10 measurements
                {
                  name: entry.name,
                  duration: Math.round(entry.duration),
                  timestamp: Date.now()
                }
              ]
            }));
          }
        });
      });

      observer.observe({ entryTypes: ['measure', 'navigation'] });
    }

    // Memory usage monitoring
    const memoryInterval = setInterval(() => {
      if (performance.memory) {
        setMetrics(prev => ({
          ...prev,
          memoryUsage: Math.round(performance.memory.usedJSHeapSize / 1024 / 1024)
        }));
      }
    }, 2000);

    return () => {
      if (observer) observer.disconnect();
      clearInterval(memoryInterval);
    };
  }, []);

  // Don't render in production
  if (process.env.NODE_ENV !== 'development') {
    return null;
  }

  const averageRenderTime = metrics.renderTimes.length > 0 
    ? Math.round(metrics.renderTimes.reduce((sum, entry) => sum + entry.duration, 0) / metrics.renderTimes.length)
    : 0;

  const cacheHitRate = metrics.cacheHits + metrics.cacheMisses > 0 
    ? Math.round((metrics.cacheHits / (metrics.cacheHits + metrics.cacheMisses)) * 100)
    : 0;

  return (
    <Box sx={{ 
      position: 'fixed', 
      bottom: 0, 
      right: 0, 
      width: 350,
      maxHeight: 300,
      zIndex: 9999,
      bgcolor: 'background.paper',
      border: 1,
      borderColor: 'divider',
      borderRadius: '8px 0 0 0',
      boxShadow: 3
    }}>
      <Accordion defaultExpanded={false}>
        <AccordionSummary expandIcon={<ExpandMore />}>
          <Typography variant="subtitle2">
            Groups Performance Monitor
          </Typography>
          <Box sx={{ ml: 'auto', mr: 1 }}>
            <Chip 
              label={`${averageRenderTime}ms avg`} 
              size="small" 
              color={averageRenderTime > 100 ? 'error' : averageRenderTime > 50 ? 'warning' : 'success'}
            />
          </Box>
        </AccordionSummary>
        
        <AccordionDetails>
          <Box sx={{ fontSize: '0.75rem' }}>
            {/* Memory Usage */}
            <Box sx={{ mb: 2 }}>
              <Typography variant="caption" display="block">
                Memory Usage: {metrics.memoryUsage} MB
              </Typography>
              <LinearProgress 
                variant="determinate" 
                value={Math.min((metrics.memoryUsage / 100) * 100, 100)} 
                sx={{ height: 4, borderRadius: 2 }}
                color={metrics.memoryUsage > 50 ? 'error' : 'primary'}
              />
            </Box>

            {/* Cache Performance */}
            <Box sx={{ mb: 2 }}>
              <Typography variant="caption" display="block">
                Cache Hit Rate: {cacheHitRate}% ({metrics.cacheHits} hits, {metrics.cacheMisses} misses)
              </Typography>
              <LinearProgress 
                variant="determinate" 
                value={cacheHitRate} 
                sx={{ height: 4, borderRadius: 2 }}
                color={cacheHitRate > 80 ? 'success' : cacheHitRate > 60 ? 'warning' : 'error'}
              />
            </Box>

            {/* Recent Render Times */}
            {metrics.renderTimes.length > 0 && (
              <Box>
                <Typography variant="caption" display="block" gutterBottom>
                  Recent Render Times:
                </Typography>
                <Table size="small" sx={{ fontSize: '0.7rem' }}>
                  <TableHead>
                    <TableRow>
                      <TableCell sx={{ p: 0.5, fontSize: '0.7rem' }}>Operation</TableCell>
                      <TableCell sx={{ p: 0.5, fontSize: '0.7rem' }}>Time (ms)</TableCell>
                    </TableRow>
                  </TableHead>
                  <TableBody>
                    {metrics.renderTimes.slice(-5).map((entry, index) => (
                      <TableRow key={index}>
                        <TableCell sx={{ p: 0.5, fontSize: '0.7rem' }}>
                          {entry.name.replace('Groups-', '')}
                        </TableCell>
                        <TableCell sx={{ p: 0.5, fontSize: '0.7rem' }}>
                          <Chip 
                            label={entry.duration}
                            size="small"
                            color={entry.duration > 100 ? 'error' : entry.duration > 50 ? 'warning' : 'success'}
                            sx={{ fontSize: '0.65rem', height: '18px' }}
                          />
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </Box>
            )}
          </Box>
        </AccordionDetails>
      </Accordion>
    </Box>
  );
};

export default PerformanceMonitor;