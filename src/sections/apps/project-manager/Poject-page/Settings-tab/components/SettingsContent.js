import React from 'react';
import PropTypes from 'prop-types';
import { Box, Paper, Typography, Fade } from '@mui/material';
import { useTheme } from '@mui/material/styles';

import {
  ProjectScheduleCard,
  ProjectInfoCard,
  ProjectTopicsCard,
  ProjectCurriculumCard
} from './';
import ProjectInstructors from '../ProjectInstructors';

const SettingsContent = ({ 
  activeCategory,
  settings,
  project,
  projectSettings,
  onUpdateField,
  onToggleWorkingDay,
  onUpdateTitle,
  onUpdateBackgroundImage,
  onUpdateLocation,
  onUpdateTrainingRecipient
}) => {
  const theme = useTheme();

  const renderContent = () => {
    switch (activeCategory) {
      case 'schedule':
        return (
          <ProjectScheduleCard
            settings={settings}
            onUpdateField={onUpdateField}
            onToggleWorkingDay={onToggleWorkingDay}
          />
        );
      
      case 'information':
        return (
          <>
            <ProjectInfoCard
              project={project}
              projectSettings={projectSettings}
              onUpdateTitle={onUpdateTitle}
              onUpdateLocation={onUpdateLocation}
              onUpdateBackgroundImage={onUpdateBackgroundImage}
              onUpdateTrainingRecipient={onUpdateTrainingRecipient}
            />
            <Box sx={{ mt: 3 }}>
              <ProjectInstructors projectId={project?.id} />
            </Box>
          </>
        );
      
      case 'topics':
        return <ProjectTopicsCard projectId={project?.id} />;
      
      case 'curriculum':
        return <ProjectCurriculumCard projectId={project?.id} />;
      
      default:
        return (
          <Box sx={{ p: 3, textAlign: 'center' }}>
            <Typography variant="h6" color="text.secondary">
              Select a category to view settings
            </Typography>
          </Box>
        );
    }
  };

  const getCategoryTitle = () => {
    const titles = {
      schedule: 'Project Schedule',
      information: 'Project Information', 
      topics: 'Project Topics',
      curriculum: 'Curriculum Management',
      customization: 'Card Appearance'
    };
    return titles[activeCategory] || 'Settings';
  };

  const getCategoryDescription = () => {
    const descriptions = {
      schedule: 'Configure project duration, working days, and daily schedule settings.',
      information: 'Update basic project information including title, status, location, and instructors.',
      topics: 'Add and manage topics related to this project.',
      curriculum: 'Assign and manage curriculums for this project.'
    };
    return descriptions[activeCategory] || 'Configure your project settings.';
  };

  return (
    <Paper 
      elevation={0}
      sx={{
        backgroundColor: theme.palette.background.paper,
        border: `1px solid ${theme.palette.divider}`,
        borderRadius: 2,
        overflow: 'hidden',
        height: 'fit-content'
      }}
    >
      {/* Header */}
      <Box sx={{ p: 3, borderBottom: `1px solid ${theme.palette.divider}` }}>
        <Typography variant="h6" sx={{ fontWeight: 600, mb: 0.5 }}>
          {getCategoryTitle()}
        </Typography>
        <Typography variant="body2" color="text.secondary">
          {getCategoryDescription()}
        </Typography>
      </Box>
      
      {/* Content */}
      <Box sx={{ p: 3 }}>
        <Fade in={true} key={activeCategory} timeout={300}>
          <Box>
            {renderContent()}
          </Box>
        </Fade>
      </Box>
    </Paper>
  );
};

SettingsContent.propTypes = {
  activeCategory: PropTypes.string.isRequired,
  settings: PropTypes.object,
  project: PropTypes.object,
  projectSettings: PropTypes.object,
  onUpdateField: PropTypes.func,
  onToggleWorkingDay: PropTypes.func,
  onUpdateTitle: PropTypes.func,
  onUpdateBackgroundImage: PropTypes.func,
  onUpdateLocation: PropTypes.func,
  onUpdateTrainingRecipient: PropTypes.func
};

export default SettingsContent;