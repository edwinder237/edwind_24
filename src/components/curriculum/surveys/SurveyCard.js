import { useState } from 'react';
import PropTypes from 'prop-types';
import {
  Box,
  Button,
  Card,
  CardContent,
  Chip,
  IconButton,
  Stack,
  Tooltip,
  Typography,
  Link
} from '@mui/material';
import {
  Edit as EditIcon,
  Delete as DeleteIcon,
  OpenInNew as OpenInNewIcon,
  Schedule as ScheduleIcon,
  School as SchoolIcon,
  Assessment as AssessmentIcon
} from '@mui/icons-material';
import {
  SURVEY_PROVIDERS,
  SURVEY_TYPES,
  getProviderLabel,
  getSurveyTypeLabel,
  getStatusColor
} from 'utils/surveyProviders';
import SurveyResultsDialog from './SurveyResultsDialog';

const SurveyCard = ({ survey, onEdit, onDelete }) => {
  const [resultsDialogOpen, setResultsDialogOpen] = useState(false);
  const providerConfig = SURVEY_PROVIDERS[survey.provider] || SURVEY_PROVIDERS.other;
  const surveyTypeConfig = SURVEY_TYPES[survey.surveyType];

  const getProviderChipColor = (provider) => {
    switch (provider) {
      case 'google_forms': return 'primary';
      case 'microsoft_forms': return 'info';
      case 'typeform': return 'secondary';
      default: return 'default';
    }
  };

  const handleOpenSurvey = () => {
    if (survey.providerConfig?.formUrl) {
      window.open(survey.providerConfig.formUrl, '_blank', 'noopener,noreferrer');
    }
  };

  return (
    <Card variant="outlined" sx={{ '&:hover': { borderColor: 'primary.main' } }}>
      <CardContent>
        <Stack direction="row" justifyContent="space-between" alignItems="flex-start">
          <Box sx={{ flex: 1 }}>
            {/* Title and Status */}
            <Stack direction="row" alignItems="center" spacing={1} sx={{ mb: 1 }}>
              <Typography variant="h6" component="h3">
                {survey.title}
              </Typography>
              <Chip
                label={survey.status}
                size="small"
                color={getStatusColor(survey.status)}
              />
              {survey.isRequired && (
                <Chip label="Required" size="small" variant="outlined" color="warning" />
              )}
            </Stack>

            {/* Description */}
            {survey.description && (
              <Typography variant="body2" color="text.secondary" sx={{ mb: 2 }}>
                {survey.description}
              </Typography>
            )}

            {/* Tags/Info */}
            <Stack direction="row" spacing={1} flexWrap="wrap" useFlexGap>
              {/* Provider */}
              <Chip
                label={getProviderLabel(survey.provider)}
                size="small"
                color={getProviderChipColor(survey.provider)}
                variant="outlined"
              />

              {/* Survey Type */}
              <Chip
                label={getSurveyTypeLabel(survey.surveyType)}
                size="small"
                variant="outlined"
                icon={survey.surveyType === 'per_course' ? <SchoolIcon /> : <ScheduleIcon />}
              />

              {/* Trigger Course (for per_course) */}
              {survey.surveyType === 'per_course' && survey.triggerCourse && (
                <Chip
                  label={`After: ${survey.triggerCourse.title}`}
                  size="small"
                  variant="outlined"
                  color="info"
                />
              )}

              {/* Custom Days (for custom timing) */}
              {survey.surveyType === 'custom' && survey.customTriggerDays && (
                <Chip
                  label={`${survey.customTriggerDays} days after enrollment`}
                  size="small"
                  variant="outlined"
                />
              )}
            </Stack>

            {/* Form URL */}
            {survey.providerConfig?.formUrl && (
              <Box sx={{ mt: 2 }}>
                <Link
                  href={survey.providerConfig.formUrl}
                  target="_blank"
                  rel="noopener noreferrer"
                  sx={{
                    fontSize: '0.875rem',
                    display: 'flex',
                    alignItems: 'center',
                    gap: 0.5,
                    maxWidth: '100%',
                    overflow: 'hidden',
                    textOverflow: 'ellipsis',
                    whiteSpace: 'nowrap'
                  }}
                >
                  <OpenInNewIcon fontSize="small" />
                  {survey.providerConfig.formUrl}
                </Link>
              </Box>
            )}

            {/* View Results Button - only show for providers that support results */}
            {providerConfig?.supportsResults && (
              <Box sx={{ mt: 2 }}>
                <Button
                  variant="outlined"
                  size="small"
                  startIcon={<AssessmentIcon />}
                  onClick={() => setResultsDialogOpen(true)}
                >
                  View Results
                </Button>
              </Box>
            )}
          </Box>

          {/* Actions */}
          <Stack direction="row" spacing={0.5}>
            <Tooltip title="Open Survey">
              <IconButton
                size="small"
                onClick={handleOpenSurvey}
                disabled={!survey.providerConfig?.formUrl}
              >
                <OpenInNewIcon fontSize="small" />
              </IconButton>
            </Tooltip>
            <Tooltip title="Edit">
              <IconButton size="small" onClick={onEdit}>
                <EditIcon fontSize="small" />
              </IconButton>
            </Tooltip>
            <Tooltip title="Delete">
              <IconButton size="small" onClick={onDelete} color="error">
                <DeleteIcon fontSize="small" />
              </IconButton>
            </Tooltip>
          </Stack>
        </Stack>
      </CardContent>

      {/* Results Dialog */}
      <SurveyResultsDialog
        open={resultsDialogOpen}
        onClose={() => setResultsDialogOpen(false)}
        survey={survey}
      />
    </Card>
  );
};

SurveyCard.propTypes = {
  survey: PropTypes.shape({
    id: PropTypes.number.isRequired,
    title: PropTypes.string.isRequired,
    description: PropTypes.string,
    surveyType: PropTypes.string.isRequired,
    provider: PropTypes.string.isRequired,
    providerConfig: PropTypes.object,
    status: PropTypes.string.isRequired,
    isRequired: PropTypes.bool,
    triggerCourse: PropTypes.shape({
      id: PropTypes.number,
      title: PropTypes.string
    }),
    customTriggerDays: PropTypes.number
  }).isRequired,
  onEdit: PropTypes.func.isRequired,
  onDelete: PropTypes.func.isRequired
};

export default SurveyCard;
