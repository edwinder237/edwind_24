import React, { useMemo, useState } from "react";
import Link from 'next/link';
// material-ui
import { Box, Chip, Typography, Stack, Accordion, AccordionSummary, AccordionDetails, IconButton, Tooltip } from "@mui/material";
import { TreeView, TreeItem } from "@mui/lab";
import ExpandMoreIcon from '@mui/icons-material/ExpandMore';
import { EditOutlined, CheckCircleOutlined } from '@mui/icons-material';

// project import
import MainCard from "components/MainCard";
import VerticalLinearStepper from "./VerticalLinearStepper";

// assets
import { DownOutlined, RightOutlined } from "@ant-design/icons";

// ==============================|| TREE VIEW - DISABLED ||============================== //

const Moduleswidget = React.memo(({ eventState }) => {
  const { courseTitle, modules, course } = eventState;
  
  // Memoize module count to avoid recalculation
  const moduleCount = useMemo(() => modules?.length || 0, [modules]);
  
  // State to track expanded modules - by default first module is expanded
  const [expandedModules, setExpandedModules] = useState([0]);
  
  // State to track completed modules
  const [completedModules, setCompletedModules] = useState([]);
  
  // Handler for when a module is completed
  const handleModuleComplete = (moduleIndex) => {
    // Mark module as completed immediately
    setCompletedModules(prev => [...prev, moduleIndex]);
    
    // Use requestAnimationFrame for smoother transitions
    requestAnimationFrame(() => {
      // Collapse the completed module
      setExpandedModules(prev => prev.filter(index => index !== moduleIndex));
      
      // Expand the next module if it exists
      if (moduleIndex + 1 < moduleCount) {
        setExpandedModules(prev => [...prev, moduleIndex + 1]);
      }
    });
  };
  
  // Handler for accordion expansion
  const handleAccordionChange = (moduleIndex) => (event, isExpanded) => {
    if (isExpanded) {
      setExpandedModules(prev => [...prev, moduleIndex]);
    } else {
      setExpandedModules(prev => prev.filter(index => index !== moduleIndex));
    }
  };

  if (!course) {
    return (
      <MainCard
        sx={{ height: 'fit-content' }}
        title={
          <Stack direction="row" alignItems="center" spacing={1}>
            <Typography variant="h6">Course Content</Typography>
          </Stack>
        }
      >
        <Box sx={{ p: 2, textAlign: 'center', color: 'text.secondary' }}>
          <Typography variant="body2">
            Select an event with a linked course to view modules and activities.
          </Typography>
        </Box>
      </MainCard>
    );
  }

  return (
    <MainCard
      sx={{ 
        display: 'flex',
        flexDirection: 'column',
        height: '100%',
        maxHeight: '600px',
        overflow: 'hidden',
        '& .MuiCardContent-root': {
          display: 'flex',
          flexDirection: 'column',
          flex: 1,
          overflow: 'hidden',
          pb: 1
        }
      }}
      title={
        <Stack direction="row" alignItems="center" spacing={1} justifyContent="space-between">
          <Stack direction="row" alignItems="center" spacing={1}>
            <Typography variant="h6">{course.title}</Typography>
            <Chip 
              label={`${moduleCount} modules`} 
              size="small" 
              color="secondary" 
              variant="outlined"
            />
          </Stack>
          <Tooltip title="Edit Course">
            <Link href={`/courses/${course.id}`} passHref>
              <IconButton
                size="small"
                sx={{
                  color: 'primary.main',
                  '&:hover': {
                    backgroundColor: 'primary.lighter'
                  }
                }}
              >
                <EditOutlined fontSize="small" />
              </IconButton>
            </Link>
          </Tooltip>
        </Stack>
      }
    >
      {moduleCount > 0 ? (
        <Box sx={{ 
          mt: 1,
          overflowY: 'auto',
          overflowX: 'hidden',
          flex: 1,
          pb: 2,
          // Hide scrollbar for Chrome, Safari and Opera
          '&::-webkit-scrollbar': {
            display: 'none',
          },
          // Hide scrollbar for IE, Edge and Firefox
          msOverflowStyle: 'none',
          scrollbarWidth: 'none'
        }}>
          {modules.map((module, i) => {
            const activityCount = module.activities?.length || 0;
            const isCompleted = completedModules.includes(i);
            const isExpanded = expandedModules.includes(i);
            
            return (
              <Accordion 
                key={module.id || i}
                expanded={isExpanded}
                onChange={handleAccordionChange(i)}
                sx={{ 
                  mb: 1,
                  '&:before': { display: 'none' },
                  boxShadow: 'none',
                  border: '1px solid',
                  borderColor: isCompleted ? 'success.main' : 'divider',
                  borderRadius: 1,
                  backgroundColor: isCompleted ? 'success.lighter' : 'background.paper',
                  transition: 'all 0.3s ease-in-out'
                }}
              >
                <AccordionSummary 
                  expandIcon={<ExpandMoreIcon />}
                  sx={{ 
                    '& .MuiAccordionSummary-content': { 
                      alignItems: 'center' 
                    }
                  }}
                >
                  <Stack direction="row" alignItems="center" spacing={1} sx={{ width: '100%' }}>
                    {isCompleted && (
                      <CheckCircleOutlined 
                        sx={{ 
                          color: 'success.main',
                          fontSize: 20
                        }} 
                      />
                    )}
                    <Typography 
                      variant="subtitle2" 
                      sx={{ 
                        flexGrow: 1,
                        textDecoration: isCompleted ? 'line-through' : 'none',
                        color: isCompleted ? 'text.secondary' : 'text.primary'
                      }}
                    >
                      {module.title}
                    </Typography>
                    <Chip 
                      label={isCompleted ? 'Completed' : `${activityCount} activities`}
                      size="small"
                      variant={isCompleted ? "filled" : "outlined"}
                      color={isCompleted ? "success" : "primary"}
                    />
                  </Stack>
                </AccordionSummary>
                <AccordionDetails sx={{ pt: 0 }}>
                  <VerticalLinearStepper 
                    activities={module.activities || []} 
                    onComplete={handleModuleComplete}
                    moduleIndex={i}
                  />
                </AccordionDetails>
              </Accordion>
            );
          })}
        </Box>
      ) : (
        <Box sx={{ p: 2, textAlign: 'center', color: 'text.secondary' }}>
          <Typography variant="body2">
            No modules found for this course.
          </Typography>
        </Box>
      )}
    </MainCard>
  );
});

export default Moduleswidget;
