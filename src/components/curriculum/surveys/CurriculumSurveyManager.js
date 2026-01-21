import { useState } from 'react';
import PropTypes from 'prop-types';
import {
  Box,
  Button,
  Card,
  CardContent,
  Stack,
  Typography,
  Skeleton,
  Divider,
  Tabs,
  Tab
} from '@mui/material';
import { Add as AddIcon, Poll as PollIcon } from '@mui/icons-material';
import { useDispatch } from 'react-redux';
import { openSnackbar } from 'store/reducers/snackbar';
import {
  useGetCurriculumSurveysQuery,
  useDeleteCurriculumSurveyMutation
} from 'store/api/projectApi';

import SurveyCard from './SurveyCard';
import SurveyEmptyState from './SurveyEmptyState';
import CreateSurveyDialog from './CreateSurveyDialog';

const CurriculumSurveyManager = ({ curriculumId, curriculumTitle, courses = [] }) => {
  const dispatch = useDispatch();
  const [dialogOpen, setDialogOpen] = useState(false);
  const [editingSurvey, setEditingSurvey] = useState(null);
  const [selectedTab, setSelectedTab] = useState(0);

  // Fetch surveys
  const {
    data: surveys = [],
    isLoading,
    refetch
  } = useGetCurriculumSurveysQuery(curriculumId, {
    skip: !curriculumId
  });

  const [deleteSurvey] = useDeleteCurriculumSurveyMutation();

  // Filter surveys by type based on tab
  const surveysByType = {
    all: surveys,
    pre_training: surveys.filter(s => s.surveyType === 'pre_training'),
    post_training: surveys.filter(s => s.surveyType === 'post_training'),
    per_course: surveys.filter(s => s.surveyType === 'per_course'),
  };

  const tabOptions = [
    { label: 'All', key: 'all', count: surveysByType.all.length },
    { label: 'Pre-Training', key: 'pre_training', count: surveysByType.pre_training.length },
    { label: 'Post-Training', key: 'post_training', count: surveysByType.post_training.length },
    { label: 'Per-Course', key: 'per_course', count: surveysByType.per_course.length },
  ];

  const currentSurveys = surveysByType[tabOptions[selectedTab].key];

  const handleAdd = () => {
    setEditingSurvey(null);
    setDialogOpen(true);
  };

  const handleEdit = (survey) => {
    setEditingSurvey(survey);
    setDialogOpen(true);
  };

  const handleDelete = async (survey) => {
    if (!window.confirm(`Delete survey "${survey.title}"? This cannot be undone.`)) {
      return;
    }

    try {
      await deleteSurvey({ id: survey.id, curriculumId }).unwrap();
      dispatch(openSnackbar({
        open: true,
        message: 'Survey deleted successfully',
        variant: 'alert',
        alert: { color: 'success' }
      }));
    } catch (error) {
      dispatch(openSnackbar({
        open: true,
        message: error.message || 'Failed to delete survey',
        variant: 'alert',
        alert: { color: 'error' }
      }));
    }
  };

  const handleDialogClose = (success) => {
    setDialogOpen(false);
    setEditingSurvey(null);
    if (success) {
      refetch();
    }
  };

  if (isLoading) {
    return (
      <Card>
        <CardContent>
          <Stack spacing={2}>
            <Skeleton variant="rectangular" height={60} />
            <Skeleton variant="rectangular" height={120} />
            <Skeleton variant="rectangular" height={120} />
          </Stack>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card>
      <CardContent>
        {/* Header */}
        <Stack direction="row" justifyContent="space-between" alignItems="center" sx={{ mb: 3 }}>
          <Box>
            <Typography variant="h6" sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
              <PollIcon color="primary" />
              Surveys
            </Typography>
            <Typography variant="body2" color="text.secondary">
              Create and manage surveys for {curriculumTitle || 'this curriculum'}
            </Typography>
          </Box>
          <Button
            variant="contained"
            startIcon={<AddIcon />}
            onClick={handleAdd}
          >
            Create Survey
          </Button>
        </Stack>

        <Divider sx={{ mb: 2 }} />

        {/* Tabs for filtering */}
        {surveys.length > 0 && (
          <Tabs
            value={selectedTab}
            onChange={(e, v) => setSelectedTab(v)}
            sx={{ mb: 3 }}
          >
            {tabOptions.map((tab) => (
              <Tab
                key={tab.key}
                label={`${tab.label} (${tab.count})`}
              />
            ))}
          </Tabs>
        )}

        {/* Survey List or Empty State */}
        {currentSurveys.length === 0 ? (
          <SurveyEmptyState
            onAdd={handleAdd}
            surveyType={tabOptions[selectedTab].key}
          />
        ) : (
          <Stack spacing={2}>
            {currentSurveys.map((survey) => (
              <SurveyCard
                key={survey.id}
                survey={survey}
                onEdit={() => handleEdit(survey)}
                onDelete={() => handleDelete(survey)}
              />
            ))}
          </Stack>
        )}

        {/* Create/Edit Dialog */}
        <CreateSurveyDialog
          open={dialogOpen}
          onClose={handleDialogClose}
          curriculumId={curriculumId}
          editingSurvey={editingSurvey}
          courses={courses}
        />
      </CardContent>
    </Card>
  );
};

CurriculumSurveyManager.propTypes = {
  curriculumId: PropTypes.number.isRequired,
  curriculumTitle: PropTypes.string,
  courses: PropTypes.array
};

export default CurriculumSurveyManager;
