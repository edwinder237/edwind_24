import { useState, useMemo, useEffect } from 'react';
import { useDispatch, useSelector } from 'store';
import { openSnackbar } from 'store/reducers/snackbar';

// material-ui
import { Box, Button, Step, Stepper, StepContent, StepLabel, Typography, IconButton, Tooltip, CircularProgress } from '@mui/material';
import { OpenInNew, VideocamOutlined, DescriptionOutlined, SlideshowOutlined, GroupOutlined, EmailOutlined } from '@mui/icons-material';

// project import
import MainCard from 'components/MainCard';
import { saveModuleProgress, resetModuleProgress } from 'store/reducers/projects';

const steps = [
  {
    label: 'Video',
    description: `For each ad campaign that you create, you can control how much
              you're willing to spend on clicks.`
  },
  {
    label: 'Create an ad group',
    description: 'An ad group contains one or more ads which target a shared set of keywords.'
  },
  {
    label: 'Create an ad',
    description: `Try out different ad text to see what brings in the most customers,
              and learn how to enhance your ads using features like ad extensions.
              If you run into any problems with your ads, find out how to tell if
              they're running and how to resolve approval issues.`
  }
];

// Helper function to get activity type icon
const getActivityIcon = (type) => {
  switch (type) {
    case 'video':
      return <VideocamOutlined fontSize="small" />;
    case 'lecture':
      return <DescriptionOutlined fontSize="small" />;
    case 'presentation':
      return <SlideshowOutlined fontSize="small" />;
    case 'group_activity':
      return <GroupOutlined fontSize="small" />;
    default:
      return <SlideshowOutlined fontSize="small" />; // Default to presentation icon
  }
};

// Helper function to get activity type color
const getActivityColor = (type) => {
  switch (type) {
    case 'video':
      return 'error.main';
    case 'lecture':
      return 'primary.main';
    case 'presentation':
      return 'success.main';
    case 'group_activity':
      return 'warning.main';
    default:
      return 'success.main'; // Default to presentation color
  }
};

// ==============================|| STEPPER - VERTICAL ||============================== //

export default function VerticalLinearStepper({activities, onComplete, onReset, moduleIndex, eventId, moduleId, moduleTitle, eventData}) {
  const dispatch = useDispatch();
  const { progressLoading, moduleProgress } = useSelector((state) => state.projects);
  const [activeStep, setActiveStep] = useState(0);
  const [sendingEmail, setSendingEmail] = useState({});

  // Check if this module is already completed
  const isModuleCompleted = useMemo(() => {
    if (eventId && moduleId) {
      const progressKey = `${eventId}_${moduleId}`;
      return moduleProgress[progressKey]?.completed || false;
    }
    return false;
  }, [eventId, moduleId, moduleProgress]);

  // Set active step to complete if module is already completed
  useEffect(() => {
    if (isModuleCompleted && activeStep < activities.length) {
      setActiveStep(activities.length);
    }
  }, [isModuleCompleted, activities.length, activeStep]);

  const handleNext = async () => {
    const nextStep = activeStep + 1;
    setActiveStep(nextStep);
    
    // Check if all activities are completed
    if (nextStep === activities.length && onComplete) {
      // Save progress for the event if we have the required data
      if (eventId && moduleId) {
        try {
          // Get all activity IDs for this module
          const activityIds = activities.map(activity => activity.id);
          
          // Save progress for this event
          await dispatch(saveModuleProgress(eventId, moduleId, activityIds));
        } catch (error) {
          console.error('Error saving module progress:', error);
        }
      }
      
      // Call the onComplete callback for UI updates
      onComplete(moduleIndex);
    }
  };
  
  const handleBack = () => setActiveStep((prevActiveStep) => prevActiveStep - 1);
  
  const handleReset = async () => {
    // Reset UI state immediately for better UX
    setActiveStep(0);
    
    // Reset progress in database and Redux state if we have the required data
    if (eventId && moduleId) {
      try {
        await dispatch(resetModuleProgress(eventId, moduleId, activities));
        
        // Call the parent component's reset handler to update the module state
        if (onReset) {
          onReset(moduleIndex);
        }
      } catch (error) {
        console.error('Error resetting module progress:', error);
      }
    }
  };

  const handleSendModuleEmail = async (activity, activityIndex) => {
    if (!activity.contentUrl || !eventId) return;
    
    setSendingEmail(prev => ({ ...prev, [activityIndex]: true }));
    
    try {
      const response = await fetch('/api/email/send-module-link', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          eventId,
          moduleTitle: moduleTitle || 'Module',
          moduleUrl: activity.contentUrl,
          activityTitle: activity.title
        }),
      });
      
      const data = await response.json();
      
      if (response.ok) {
        dispatch(openSnackbar({
          open: true,
          message: `Module link sent to ${data.summary.emailsSent} participant(s)`,
          variant: 'alert',
          alert: {
            color: 'success'
          },
          close: true
        }));
      } else {
        throw new Error(data.message || 'Failed to send email');
      }
    } catch (error) {
      console.error('Error sending module email:', error);
      dispatch(openSnackbar({
        open: true,
        message: error.message || 'Failed to send module link',
        variant: 'alert',
        alert: {
          color: 'error'
        },
        close: true
      }));
    } finally {
      setSendingEmail(prev => ({ ...prev, [activityIndex]: false }));
    }
  };

  // Check if activities exist and have length
  if(!activities || activities.length === 0){
    return (
      <Box sx={{ p: 2, textAlign: 'center' }}>
        <Typography variant="body2" color="text.secondary">
          No activities in this module
        </Typography>
      </Box>
    );
  }

  return (
    <div>
      <Stepper activeStep={activeStep} orientation="vertical">
        {activities.map((activitie, index) => (
          <Step key={activitie.id || `step-${index}`}>
            <StepLabel 
              optional={index === 2 ? <Typography variant="caption">Last step</Typography> : null}
              sx={{ 
                '& .MuiStepLabel-labelContainer': { 
                  display: 'flex', 
                  alignItems: 'center', 
                  gap: 1 
                } 
              }}
            >
              <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                <Box 
                  sx={{ 
                    color: getActivityColor(activitie.activityType || activitie.type),
                    display: 'flex',
                    alignItems: 'center'
                  }}
                >
                  {getActivityIcon(activitie.activityType || activitie.type)}
                </Box>
                <Typography>{activitie.title}</Typography>
                {activitie.contentUrl && activitie.contentUrl.trim() !== '' && (
                  <>
                    <Tooltip title="Open content in new tab">
                      <IconButton
                        size="small"
                        onClick={(e) => {
                          e.stopPropagation();
                          window.open(activitie.contentUrl, '_blank', 'noopener,noreferrer');
                        }}
                        sx={{
                          color: 'primary.main',
                          '&:hover': {
                            backgroundColor: 'primary.lighter'
                          }
                        }}
                      >
                        <OpenInNew fontSize="small" />
                      </IconButton>
                    </Tooltip>
                    <Tooltip title="Email module URL to participants">
                      <IconButton
                        size="small"
                        onClick={(e) => {
                          e.stopPropagation();
                          handleSendModuleEmail(activitie, index);
                        }}
                        disabled={sendingEmail[index]}
                        sx={{
                          color: 'secondary.main',
                          '&:hover': {
                            backgroundColor: 'secondary.lighter'
                          }
                        }}
                      >
                        {sendingEmail[index] ? (
                          <CircularProgress size={16} />
                        ) : (
                          <EmailOutlined fontSize="small" />
                        )}
                      </IconButton>
                    </Tooltip>
                  </>
                )}
              </Box>
            </StepLabel>
            <StepContent>
              <Typography>{activitie.summary}</Typography>
              <Box sx={{ mb: 2 }}>
                <div>
                  <Button
                    variant="contained"
                    onClick={handleNext}
                    sx={{ mt: 1, mr: 1 }}
                    color={index === activities.length - 1 ? 'success' : 'primary'}
                    disabled={progressLoading}
                  >
                    {progressLoading && index === activities.length - 1 ? 'Saving...' : (index === activities.length - 1 ? 'Finish' : 'Continue')}
                  </Button>
                  <Button disabled={index === 0} onClick={handleBack} sx={{ mt: 1, mr: 1 }}>
                    Back
                  </Button>
                </div>
              </Box>
            </StepContent>
          </Step>
        ))}
      </Stepper>
      {activeStep === activities.length && (
        <Box sx={{ pt: 2 }}>
          <Typography sx={{ color: 'success.main' }}>All steps completed - you&apos;re finished</Typography>
          <Button 
            size="small" 
            variant="contained" 
            color="error" 
            onClick={handleReset} 
            sx={{ mt: 2, mr: 1 }}
            disabled={progressLoading}
          >
            {progressLoading ? 'Resetting...' : 'Reset'}
          </Button>
        </Box>
      )}
    </div>
  );
}
