import React, { useState, useMemo } from 'react';
import PropTypes from 'prop-types';
import {
  Dialog,
  Button,
  Typography,
  Box,
  Stack,
  Chip,
  Divider,
  Alert,
  CircularProgress,
  RadioGroup,
  Radio,
  FormControlLabel,
  Link,
} from '@mui/material';
import {
  MailOutlined,
  CloseCircleOutlined,
} from '@ant-design/icons';
import { Assignment } from '@mui/icons-material';

// Project imports
import MainCard from 'components/MainCard';
import { PopupTransition } from 'components/@extended/Transitions';

const SatisfactionSurveyDialog = ({
  open,
  onClose,
  selectedParticipants = [],
  surveys = [],
  onSend,
  loading = false,
}) => {
  const [selectedSurveyId, setSelectedSurveyId] = useState(null);
  const [sending, setSending] = useState(false);

  // Auto-select if only one survey
  const effectiveSurveyId = useMemo(() => {
    if (surveys.length === 1) return surveys[0].id;
    return selectedSurveyId;
  }, [surveys, selectedSurveyId]);

  const selectedSurvey = useMemo(() => {
    return surveys.find(s => s.id === effectiveSurveyId) || null;
  }, [surveys, effectiveSurveyId]);

  const handleSend = async () => {
    if (!selectedSurvey) return;

    setSending(true);
    try {
      await onSend({
        participants: selectedParticipants,
        surveyUrl: selectedSurvey.providerConfig?.formUrl,
        surveyTitle: selectedSurvey.title,
      });

      setSelectedSurveyId(null);
      onClose();
    } catch (error) {
      console.error('Failed to send survey:', error);
    } finally {
      setSending(false);
    }
  };

  const handleClose = () => {
    if (!sending) {
      setSelectedSurveyId(null);
      onClose();
    }
  };

  return (
    <Dialog
      open={open}
      onClose={handleClose}
      maxWidth="sm"
      fullWidth
      TransitionComponent={PopupTransition}
      sx={{ "& .MuiDialog-paper": { p: 0, maxWidth: 600 } }}
    >
      <MainCard
        title={
          <Stack direction="row" alignItems="center" spacing={1}>
            <Assignment />
            <Typography variant="h5">Send Satisfaction Survey (L1)</Typography>
          </Stack>
        }
        content={false}
        sx={{ m: 0 }}
      >
        <Box sx={{ p: 3 }}>
          <Stack spacing={3}>
            {/* Participants Summary */}
            <Box>
              <Typography variant="subtitle1" gutterBottom>
                Selected Participants ({selectedParticipants.length})
              </Typography>
              <Box display="flex" flexWrap="wrap" gap={1}>
                {selectedParticipants.map((participant, index) => (
                  <Chip
                    key={participant.id || index}
                    label={`${participant.participant?.firstName} ${participant.participant?.lastName}`}
                    size="small"
                    color="primary"
                    variant="outlined"
                  />
                ))}
              </Box>
            </Box>

            <Divider />

            {/* Survey Selection */}
            <Box>
              {loading ? (
                <Box display="flex" alignItems="center" gap={1} py={2}>
                  <CircularProgress size={20} />
                  <Typography variant="body2" color="text.secondary">Loading surveys...</Typography>
                </Box>
              ) : surveys.length === 0 ? (
                <Alert severity="info">
                  No satisfaction surveys configured for this project&apos;s curriculum. Add a post-training survey in the curriculum settings first.
                </Alert>
              ) : surveys.length === 1 ? (
                <Box>
                  <Typography variant="subtitle1" gutterBottom>
                    Survey
                  </Typography>
                  <Box sx={{ p: 2, border: '1px solid', borderColor: 'divider', borderRadius: 1 }}>
                    <Typography variant="subtitle2">{surveys[0].title}</Typography>
                    {surveys[0].description && (
                      <Typography variant="body2" color="text.secondary" sx={{ mt: 0.5 }}>
                        {surveys[0].description}
                      </Typography>
                    )}
                    <Link
                      href={surveys[0].providerConfig?.formUrl}
                      target="_blank"
                      rel="noopener noreferrer"
                      variant="caption"
                      sx={{ display: 'block', mt: 1 }}
                    >
                      {surveys[0].providerConfig?.formUrl}
                    </Link>
                  </Box>
                </Box>
              ) : (
                <Box>
                  <Typography variant="subtitle1" gutterBottom>
                    Select Survey
                  </Typography>
                  <RadioGroup
                    value={selectedSurveyId || ''}
                    onChange={(e) => setSelectedSurveyId(parseInt(e.target.value))}
                  >
                    {surveys.map((survey) => (
                      <Box
                        key={survey.id}
                        sx={{
                          p: 2,
                          mb: 1,
                          border: '1px solid',
                          borderColor: selectedSurveyId === survey.id ? 'primary.main' : 'divider',
                          borderRadius: 1,
                        }}
                      >
                        <FormControlLabel
                          value={survey.id}
                          control={<Radio />}
                          label={
                            <Box>
                              <Typography variant="subtitle2">{survey.title}</Typography>
                              {survey.description && (
                                <Typography variant="body2" color="text.secondary" sx={{ mt: 0.5 }}>
                                  {survey.description}
                                </Typography>
                              )}
                              <Link
                                href={survey.providerConfig?.formUrl}
                                target="_blank"
                                rel="noopener noreferrer"
                                variant="caption"
                                sx={{ display: 'block', mt: 1 }}
                              >
                                {survey.providerConfig?.formUrl}
                              </Link>
                            </Box>
                          }
                        />
                      </Box>
                    ))}
                  </RadioGroup>
                </Box>
              )}
            </Box>

            {/* Confirmation */}
            {selectedSurvey && (
              <Alert severity="success" icon={<MailOutlined />}>
                Survey &quot;{selectedSurvey.title}&quot; will be sent to {selectedParticipants.length} participant{selectedParticipants.length !== 1 ? 's' : ''}
              </Alert>
            )}

            {/* Action Buttons */}
            <Stack
              direction="row"
              justifyContent="flex-end"
              spacing={2}
              sx={{ pt: 2, borderTop: '1px solid', borderColor: 'divider' }}
            >
              <Button
                onClick={handleClose}
                disabled={sending}
                startIcon={<CloseCircleOutlined />}
              >
                Cancel
              </Button>
              <Button
                onClick={handleSend}
                variant="contained"
                color="primary"
                disabled={!selectedSurvey || sending}
                startIcon={sending ? <CircularProgress size={16} /> : <MailOutlined />}
              >
                {sending ? 'Sending...' : 'Send Survey'}
              </Button>
            </Stack>
          </Stack>
        </Box>
      </MainCard>
    </Dialog>
  );
};

SatisfactionSurveyDialog.propTypes = {
  open: PropTypes.bool.isRequired,
  onClose: PropTypes.func.isRequired,
  selectedParticipants: PropTypes.array,
  surveys: PropTypes.array,
  onSend: PropTypes.func.isRequired,
  loading: PropTypes.bool,
};

export default SatisfactionSurveyDialog;
