import { useState } from 'react';
import PropTypes from 'prop-types';
import {
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Button,
  Box,
  Typography,
  Stack,
  Chip,
  Alert,
  AlertTitle,
  CircularProgress,
  Divider,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  Paper,
  IconButton,
  Tooltip,
  Collapse,
  LinearProgress,
  Card,
  CardContent
} from '@mui/material';
import {
  Close as CloseIcon,
  Refresh as RefreshIcon,
  ExpandMore as ExpandMoreIcon,
  ExpandLess as ExpandLessIcon,
  OpenInNew as OpenInNewIcon,
  CheckCircle as CheckCircleIcon,
  Error as ErrorIcon,
  Info as InfoIcon,
  ContentCopy as CopyIcon
} from '@mui/icons-material';
import { useLazyGetSurveyResultsQuery } from 'store/api/projectApi';
import { SURVEY_PROVIDERS } from 'utils/surveyProviders';

const SurveyResultsDialog = ({ open, onClose, survey }) => {
  const [expandedQuestions, setExpandedQuestions] = useState({});
  const [fetchResults, { data, isLoading, isFetching, error }] = useLazyGetSurveyResultsQuery();

  // Fetch results when dialog opens
  const handleOpen = () => {
    if (survey?.id) {
      fetchResults(survey.id);
    }
  };

  const handleRefresh = () => {
    if (survey?.id) {
      fetchResults(survey.id, { forceRefetch: true });
    }
  };

  const toggleQuestion = (questionId) => {
    setExpandedQuestions(prev => ({
      ...prev,
      [questionId]: !prev[questionId]
    }));
  };

  const copyServiceAccountEmail = () => {
    if (data?.serviceAccountEmail) {
      navigator.clipboard.writeText(data.serviceAccountEmail);
    }
  };

  const providerConfig = SURVEY_PROVIDERS[survey?.provider];

  // Calculate aggregated stats for questions
  const getQuestionStats = (question, responses) => {
    if (!responses || responses.length === 0) return null;

    const answers = responses
      .map(r => r.answers?.[question.title])
      .filter(a => a !== undefined && a !== null);

    if (answers.length === 0) return null;

    if (question.type === 'multiple_choice' || question.type === 'checkbox') {
      // Count occurrences of each option
      const counts = {};
      answers.forEach(answer => {
        const values = Array.isArray(answer) ? answer : [answer];
        values.forEach(v => {
          counts[v] = (counts[v] || 0) + 1;
        });
      });

      return {
        type: 'distribution',
        counts,
        total: answers.length
      };
    }

    if (question.type === 'scale') {
      // Calculate average for scale questions
      const numbers = answers.map(a => parseFloat(a)).filter(n => !isNaN(n));
      if (numbers.length === 0) return null;

      const avg = numbers.reduce((sum, n) => sum + n, 0) / numbers.length;
      return {
        type: 'average',
        average: avg.toFixed(2),
        min: Math.min(...numbers),
        max: Math.max(...numbers),
        total: numbers.length
      };
    }

    // For text questions, just return count
    return {
      type: 'text',
      total: answers.length
    };
  };

  return (
    <Dialog
      open={open}
      onClose={onClose}
      maxWidth="md"
      fullWidth
      TransitionProps={{ onEntered: handleOpen }}
    >
      <DialogTitle>
        <Stack direction="row" justifyContent="space-between" alignItems="center">
          <Box>
            <Typography variant="h6">Survey Results</Typography>
            <Typography variant="body2" color="text.secondary">
              {survey?.title}
            </Typography>
          </Box>
          <Stack direction="row" spacing={1}>
            <Tooltip title="Refresh results">
              <IconButton onClick={handleRefresh} disabled={isFetching}>
                <RefreshIcon />
              </IconButton>
            </Tooltip>
            <IconButton onClick={onClose}>
              <CloseIcon />
            </IconButton>
          </Stack>
        </Stack>
      </DialogTitle>

      <DialogContent dividers>
        {isLoading ? (
          <Box sx={{ display: 'flex', justifyContent: 'center', py: 6 }}>
            <CircularProgress />
          </Box>
        ) : error ? (
          <Alert severity="error">
            <AlertTitle>Error fetching results</AlertTitle>
            {error.message || 'An unexpected error occurred'}
          </Alert>
        ) : data?.success === false ? (
          <Stack spacing={3}>
            <Alert severity="warning" icon={<InfoIcon />}>
              <AlertTitle>{data.error}</AlertTitle>
              {data.setupInstructions && (
                <Box sx={{ mt: 2 }}>
                  <Typography variant="subtitle2" gutterBottom>Setup Instructions:</Typography>
                  <ol style={{ margin: 0, paddingLeft: 20 }}>
                    {data.setupInstructions.map((step, index) => (
                      <li key={index}>
                        <Typography variant="body2">{step}</Typography>
                      </li>
                    ))}
                  </ol>
                </Box>
              )}
              {data.serviceAccountEmail && (
                <Box sx={{ mt: 2 }}>
                  <Typography variant="subtitle2" gutterBottom>
                    Service Account Email (share your form with this email):
                  </Typography>
                  <Stack direction="row" alignItems="center" spacing={1}>
                    <code style={{
                      backgroundColor: 'rgba(0,0,0,0.1)',
                      padding: '4px 8px',
                      borderRadius: 4,
                      fontSize: '0.875rem'
                    }}>
                      {data.serviceAccountEmail}
                    </code>
                    <Tooltip title="Copy email">
                      <IconButton size="small" onClick={copyServiceAccountEmail}>
                        <CopyIcon fontSize="small" />
                      </IconButton>
                    </Tooltip>
                  </Stack>
                </Box>
              )}
            </Alert>

            <Button
              variant="outlined"
              startIcon={<OpenInNewIcon />}
              href={survey?.providerConfig?.formUrl}
              target="_blank"
            >
              View Results in {providerConfig?.label || 'Survey Tool'}
            </Button>
          </Stack>
        ) : data?.success ? (
          <Stack spacing={3}>
            {/* Summary Stats */}
            <Card variant="outlined">
              <CardContent>
                <Stack direction="row" spacing={4} flexWrap="wrap" useFlexGap>
                  <Box>
                    <Typography variant="h4" color="primary">
                      {data.responseCount || 0}
                    </Typography>
                    <Typography variant="body2" color="text.secondary">
                      Total Responses
                    </Typography>
                  </Box>
                  <Box>
                    <Typography variant="h4" color="secondary">
                      {data.questions?.length || 0}
                    </Typography>
                    <Typography variant="body2" color="text.secondary">
                      Questions
                    </Typography>
                  </Box>
                  {data.lastResponseTime && (
                    <Box>
                      <Typography variant="body1">
                        {new Date(data.lastResponseTime).toLocaleString()}
                      </Typography>
                      <Typography variant="body2" color="text.secondary">
                        Last Response
                      </Typography>
                    </Box>
                  )}
                  {data.hasGrading && data.responses?.length > 0 && (
                    <Box>
                      <Typography variant="h4" color={getAverageScoreColor(data.responses)}>
                        {getAverageScore(data.responses)}%
                      </Typography>
                      <Typography variant="body2" color="text.secondary">
                        Avg Score
                      </Typography>
                    </Box>
                  )}
                </Stack>
                {data.hasGrading && (
                  <Box sx={{ mt: 2 }}>
                    <Chip
                      label={data.isQuizMode ? 'Quiz Mode (from Google Forms)' : 'Custom Answer Key'}
                      size="small"
                      color="info"
                      variant="outlined"
                    />
                  </Box>
                )}
              </CardContent>
            </Card>

            {/* Questions Summary */}
            {data.questions && data.questions.length > 0 && (
              <Box>
                <Typography variant="h6" gutterBottom>
                  Questions & Responses
                </Typography>
                <Stack spacing={2}>
                  {data.questions.map((question) => {
                    const stats = getQuestionStats(question, data.responses);
                    const isExpanded = expandedQuestions[question.id];

                    return (
                      <Card key={question.id} variant="outlined">
                        <CardContent sx={{ pb: 1 }}>
                          <Stack
                            direction="row"
                            justifyContent="space-between"
                            alignItems="flex-start"
                            sx={{ cursor: 'pointer' }}
                            onClick={() => toggleQuestion(question.id)}
                          >
                            <Box sx={{ flex: 1 }}>
                              <Stack direction="row" spacing={1} alignItems="center" flexWrap="wrap">
                                <Typography variant="subtitle1">
                                  {question.title}
                                </Typography>
                                {question.required && (
                                  <Chip label="Required" size="small" color="error" variant="outlined" />
                                )}
                                <Chip label={question.type} size="small" variant="outlined" />
                                {question.pointValue && (
                                  <Chip label={`${question.pointValue} pts`} size="small" color="primary" variant="outlined" />
                                )}
                              </Stack>
                              {question.description && (
                                <Typography variant="body2" color="text.secondary">
                                  {question.description}
                                </Typography>
                              )}
                              {question.correctAnswers && (
                                <Typography variant="body2" color="success.main" sx={{ mt: 0.5 }}>
                                  <CheckCircleIcon fontSize="inherit" sx={{ verticalAlign: 'middle', mr: 0.5 }} />
                                  Correct: {Array.isArray(question.correctAnswers) ? question.correctAnswers.join(', ') : question.correctAnswers}
                                </Typography>
                              )}
                            </Box>
                            <IconButton size="small">
                              {isExpanded ? <ExpandLessIcon /> : <ExpandMoreIcon />}
                            </IconButton>
                          </Stack>

                          {/* Stats Summary */}
                          {stats && (
                            <Box sx={{ mt: 1 }}>
                              {stats.type === 'distribution' && (
                                <Stack spacing={1}>
                                  {Object.entries(stats.counts)
                                    .sort((a, b) => b[1] - a[1])
                                    .slice(0, isExpanded ? undefined : 3)
                                    .map(([option, count]) => {
                                      const percentage = ((count / stats.total) * 100).toFixed(0);
                                      return (
                                        <Box key={option}>
                                          <Stack direction="row" justifyContent="space-between" sx={{ mb: 0.5 }}>
                                            <Typography variant="body2">{option}</Typography>
                                            <Typography variant="body2" color="text.secondary">
                                              {count} ({percentage}%)
                                            </Typography>
                                          </Stack>
                                          <LinearProgress
                                            variant="determinate"
                                            value={parseFloat(percentage)}
                                            sx={{ height: 8, borderRadius: 1 }}
                                          />
                                        </Box>
                                      );
                                    })}
                                </Stack>
                              )}
                              {stats.type === 'average' && (
                                <Typography variant="body2">
                                  Average: <strong>{stats.average}</strong> (min: {stats.min}, max: {stats.max}) from {stats.total} responses
                                </Typography>
                              )}
                              {stats.type === 'text' && (
                                <Typography variant="body2" color="text.secondary">
                                  {stats.total} text responses
                                </Typography>
                              )}
                            </Box>
                          )}

                          {/* Expanded: Show all responses for text questions */}
                          <Collapse in={isExpanded}>
                            {(question.type === 'short_text' || question.type === 'paragraph') && data.responses && (
                              <Box sx={{ mt: 2 }}>
                                <Divider sx={{ mb: 2 }} />
                                <Typography variant="subtitle2" gutterBottom>
                                  All Responses:
                                </Typography>
                                <Stack spacing={1}>
                                  {data.responses
                                    .filter(r => r.answers?.[question.title])
                                    .map((response, idx) => (
                                      <Paper key={idx} variant="outlined" sx={{ p: 1.5 }}>
                                        <Typography variant="body2">
                                          {response.answers[question.title]}
                                        </Typography>
                                        <Typography variant="caption" color="text.secondary">
                                          {new Date(response.submittedAt).toLocaleString()}
                                        </Typography>
                                      </Paper>
                                    ))}
                                </Stack>
                              </Box>
                            )}
                          </Collapse>
                        </CardContent>
                      </Card>
                    );
                  })}
                </Stack>
              </Box>
            )}

            {/* All Responses Table */}
            {data.responses && data.responses.length > 0 && (
              <Box>
                <Typography variant="h6" gutterBottom>
                  Response Details
                </Typography>
                <TableContainer component={Paper} variant="outlined">
                  <Table size="small">
                    <TableHead>
                      <TableRow>
                        <TableCell>Submitted</TableCell>
                        {data.hasGrading && <TableCell>Score</TableCell>}
                        {data.questions?.slice(0, 3).map(q => (
                          <TableCell key={q.id}>
                            {q.title.length > 30 ? q.title.substring(0, 30) + '...' : q.title}
                          </TableCell>
                        ))}
                        {data.questions?.length > 3 && (
                          <TableCell>+ {data.questions.length - 3} more</TableCell>
                        )}
                      </TableRow>
                    </TableHead>
                    <TableBody>
                      {data.responses.slice(0, 10).map((response, idx) => (
                        <TableRow key={response.responseId || idx}>
                          <TableCell>
                            {new Date(response.submittedAt).toLocaleDateString()}
                          </TableCell>
                          {data.hasGrading && (
                            <TableCell>
                              {response.score ? (
                                <Chip
                                  label={`${response.score.percentage}%`}
                                  size="small"
                                  color={response.score.percentage >= 70 ? 'success' : response.score.percentage >= 50 ? 'warning' : 'error'}
                                />
                              ) : '-'}
                            </TableCell>
                          )}
                          {data.questions?.slice(0, 3).map(q => (
                            <TableCell key={q.id}>
                              <Stack direction="row" alignItems="center" spacing={0.5}>
                                {response.grading?.[q.title] && (
                                  response.grading[q.title].isCorrect ? (
                                    <CheckCircleIcon fontSize="small" color="success" />
                                  ) : (
                                    <ErrorIcon fontSize="small" color="error" />
                                  )
                                )}
                                <span>{formatAnswer(response.answers?.[q.title])}</span>
                              </Stack>
                            </TableCell>
                          ))}
                          {data.questions?.length > 3 && (
                            <TableCell>...</TableCell>
                          )}
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                </TableContainer>
                {data.responses.length > 10 && (
                  <Typography variant="body2" color="text.secondary" sx={{ mt: 1 }}>
                    Showing 10 of {data.responses.length} responses
                  </Typography>
                )}
              </Box>
            )}
          </Stack>
        ) : (
          <Alert severity="info">
            No results available. Click refresh to try again.
          </Alert>
        )}
      </DialogContent>

      <DialogActions>
        <Button
          variant="outlined"
          startIcon={<OpenInNewIcon />}
          href={survey?.providerConfig?.formUrl}
          target="_blank"
        >
          Open in {providerConfig?.label || 'Survey Tool'}
        </Button>
        <Button onClick={onClose}>Close</Button>
      </DialogActions>
    </Dialog>
  );
};

// Helper to format answer values for display
function formatAnswer(answer) {
  if (answer === null || answer === undefined) return '-';
  if (Array.isArray(answer)) return answer.join(', ');
  if (typeof answer === 'string' && answer.length > 50) {
    return answer.substring(0, 50) + '...';
  }
  return String(answer);
}

// Helper to calculate average score
function getAverageScore(responses) {
  const scores = responses
    .filter(r => r.score?.percentage !== undefined)
    .map(r => r.score.percentage);
  if (scores.length === 0) return 0;
  return Math.round(scores.reduce((sum, s) => sum + s, 0) / scores.length);
}

// Helper to get color based on average score
function getAverageScoreColor(responses) {
  const avg = getAverageScore(responses);
  if (avg >= 70) return 'success.main';
  if (avg >= 50) return 'warning.main';
  return 'error.main';
}

SurveyResultsDialog.propTypes = {
  open: PropTypes.bool.isRequired,
  onClose: PropTypes.func.isRequired,
  survey: PropTypes.shape({
    id: PropTypes.number,
    title: PropTypes.string,
    provider: PropTypes.string,
    providerConfig: PropTypes.object
  })
};

export default SurveyResultsDialog;
