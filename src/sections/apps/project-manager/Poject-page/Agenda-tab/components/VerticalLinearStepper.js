import { useState } from 'react';

// material-ui
import { Box, Button, Step, Stepper, StepContent, StepLabel, Typography, IconButton, Tooltip } from '@mui/material';
import { OpenInNew, VideocamOutlined, DescriptionOutlined, SlideshowOutlined, GroupOutlined } from '@mui/icons-material';

// project import
import MainCard from 'components/MainCard';

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

export default function VerticalLinearStepper({activities}) {
  const [activeStep, setActiveStep] = useState(0);

  const handleNext = () => setActiveStep((prevActiveStep) => prevActiveStep + 1);
  const handleBack = () => setActiveStep((prevActiveStep) => prevActiveStep - 1);
  const handleReset = () => setActiveStep(0);

  if(activities){
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
                    >
                      {index === activities.length - 1 ? 'Finish' : 'Continue'}
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
            <Button size="small" variant="contained" color="error" onClick={handleReset} sx={{ mt: 2, mr: 1 }}>
              Reset
            </Button>
          </Box>
        )}
      </div>
    );

  }else return <>no activities</>

}
