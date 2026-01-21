import PropTypes from 'prop-types';
import { Box, Button, Typography } from '@mui/material';
import { Add as AddIcon, Poll as PollIcon } from '@mui/icons-material';

const SurveyEmptyState = ({ onAdd, surveyType = 'all' }) => {
  const getMessage = () => {
    switch (surveyType) {
      case 'pre_training':
        return 'No pre-training surveys yet. Create one to gather feedback before training begins.';
      case 'post_training':
        return 'No post-training surveys yet. Create one to collect feedback after training completes.';
      case 'per_course':
        return 'No per-course surveys yet. Create one to gather feedback after specific course completion.';
      default:
        return 'Surveys will allow you to collect feedback from participants enrolled in this curriculum.';
    }
  };

  return (
    <Box sx={{ textAlign: 'center', py: 6 }}>
      <PollIcon sx={{ fontSize: 64, color: 'text.secondary', mb: 2 }} />
      <Typography variant="h6" color="text.secondary" gutterBottom>
        No Surveys Yet
      </Typography>
      <Typography variant="body2" color="text.secondary" sx={{ mb: 3, maxWidth: 400, mx: 'auto' }}>
        {getMessage()}
      </Typography>
      <Button
        variant="contained"
        startIcon={<AddIcon />}
        onClick={onAdd}
      >
        Create Survey
      </Button>
    </Box>
  );
};

SurveyEmptyState.propTypes = {
  onAdd: PropTypes.func.isRequired,
  surveyType: PropTypes.string
};

export default SurveyEmptyState;
