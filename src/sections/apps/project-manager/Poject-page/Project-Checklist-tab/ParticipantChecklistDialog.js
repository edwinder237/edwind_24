import PropTypes from 'prop-types';
import { useState } from 'react';
import { useDispatch } from 'react-redux';
import {
  Dialog,
  Button,
  Box,
  Typography,
  List,
  ListItem,
  ListItemText,
  ListItemIcon,
  Chip,
  CircularProgress,
  LinearProgress,
  IconButton,
  Divider,
  Alert,
  Checkbox,
  TextField,
  InputAdornment
} from '@mui/material';
import { useTheme } from '@mui/material/styles';
import {
  CheckCircleOutlined,
  CloseCircleOutlined,
  CloseOutlined,
  UserOutlined,
  SearchOutlined
} from '@ant-design/icons';
import MainCard from 'components/MainCard';
import { useGetParticipantChecklistProgressQuery } from 'store/api/projectApi';
import { checklistCommands } from 'store/commands';

// ==============================|| PARTICIPANT CHECKLIST DIALOG ||============================== //

const ParticipantChecklistDialog = ({
  open,
  onClose,
  projectId,
  checklistItem,
  onRefreshChecklist
}) => {
  const theme = useTheme();
  const dispatch = useDispatch();

  // RTK Query - Fetch participant progress
  const {
    data,
    isLoading: loading,
    error,
    refetch
  } = useGetParticipantChecklistProgressQuery(
    { projectId, checklistItemId: checklistItem?.id },
    { skip: !open || !checklistItem || !projectId }
  );

  const [updatingParticipants, setUpdatingParticipants] = useState(new Set());
  const [searchQuery, setSearchQuery] = useState('');

  // Style constants
  const isDarkMode = theme.palette.mode === 'dark';
  const summaryBgColor = isDarkMode ? theme.palette.background.default : theme.palette.grey[50];
  const progressBgColor = isDarkMode ? theme.palette.grey[700] : theme.palette.grey[200];

  // Handle participant task completion toggle
  const handleParticipantCompletionToggle = async (participant) => {
    if (updatingParticipants.has(participant.participantId)) return;

    setUpdatingParticipants(prev => new Set(prev).add(participant.participantId));

    try {
      // Use semantic command
      await dispatch(checklistCommands.markParticipantTaskComplete({
        participantId: participant.participantId,
        checklistItemId: checklistItem.id,
        projectId,
        participantName: participant.name,
        itemTitle: checklistItem.title,
        completed: !participant.completed
      })).unwrap();

      // Refetch data to get updated state from server
      await refetch();

      // Refresh parent checklist (may trigger auto-completion)
      if (onRefreshChecklist) {
        onRefreshChecklist();
      }
    } catch (err) {
      console.error('Error updating participant completion:', err);
    } finally {
      setUpdatingParticipants(prev => {
        const newSet = new Set(prev);
        newSet.delete(participant.participantId);
        return newSet;
      });
    }
  };

  // Filter participants based on search query
  const filteredParticipants = data?.participants?.filter(participant => {
    if (!searchQuery) return true;
    const query = searchQuery.toLowerCase();
    return (
      participant.name?.toLowerCase().includes(query) ||
      participant.role?.toLowerCase().includes(query)
    );
  }) || [];

  if (!checklistItem) return null;

  return (
    <Dialog 
      open={open} 
      onClose={onClose}
      maxWidth="md"
      fullWidth
      sx={{
        '& .MuiDialog-paper': {
          borderRadius: 1,
          boxShadow: theme.customShadows.z24,
          bgcolor: theme.palette.background.paper
        }
      }}
    >
      <MainCard
        title={
          <Box>
            <Typography variant="h4" component="div" sx={{ fontWeight: 600, color: theme.palette.text.primary }}>
              Participant Progress
            </Typography>
            <Typography variant="body2" color="text.secondary" sx={{ mt: 0.5 }}>
              {checklistItem.title}
            </Typography>
          </Box>
        }
        secondary={
          <IconButton
            aria-label="close"
            onClick={onClose}
            sx={{ 
              color: theme.palette.text.secondary,
              '&:hover': { 
                bgcolor: theme.palette.action.hover,
                color: theme.palette.text.primary
              }
            }}
          >
            <CloseOutlined />
          </IconButton>
        }
        content={false}
        sx={{ 
          borderRadius: 1,
          bgcolor: theme.palette.background.paper,
          '& .MuiCardHeader-root': {
            borderBottom: `1px solid ${theme.palette.divider}`,
            bgcolor: theme.palette.background.paper
          }
        }}
      >
        {loading ? (
          <Box sx={{ display: 'flex', justifyContent: 'center', alignItems: 'center', minHeight: 300 }}>
            <CircularProgress color="primary" />
          </Box>
        ) : error ? (
          <Box sx={{ p: 3 }}>
            <Alert severity="error">
              {error?.data?.message || error?.error || 'Failed to load participant progress'}
            </Alert>
          </Box>
        ) : data ? (
          <>
            {/* Summary Section */}
            <Box sx={{ 
              p: 3, 
              bgcolor: summaryBgColor,
              borderBottom: `1px solid ${theme.palette.divider}`
            }}>
              <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 2 }}>
                <Typography variant="h6" sx={{ fontWeight: 600, color: 'text.primary' }}>
                  Completion Summary
                </Typography>
                <Chip 
                  label={`${data.summary.completionRate}% Complete`}
                  color={data.summary.completionRate === 100 ? 'success' : 'primary'}
                  variant="filled"
                  sx={{
                    fontWeight: 600,
                    height: 28,
                    '& .MuiChip-label': { px: 1.5 }
                  }}
                />
              </Box>
              
              <LinearProgress 
                variant="determinate" 
                value={data.summary.completionRate} 
                sx={{ 
                  height: 8, 
                  borderRadius: 1,
                  mb: 2,
                  bgcolor: progressBgColor,
                  '& .MuiLinearProgress-bar': {
                    borderRadius: 1,
                    bgcolor: data.summary.completionRate === 100 
                      ? theme.palette.success.main 
                      : theme.palette.primary.main
                  }
                }}
              />
              
              <Box sx={{ display: 'flex', gap: 1.5, flexWrap: 'wrap' }}>
                <Chip 
                  icon={<CheckCircleOutlined />}
                  label={`${data.summary.completed} Completed`}
                  color="success"
                  variant="outlined"
                  size="small"
                />
                <Chip 
                  icon={<CloseCircleOutlined />}
                  label={`${data.summary.pending} Pending`}
                  color="default"
                  variant="outlined"
                  size="small"
                />
                <Chip 
                  icon={<UserOutlined />}
                  label={`${data.summary.active} Active`}
                  color="primary"
                  variant="outlined"
                  size="small"
                />
                {data.summary.removed > 0 && (
                  <Chip 
                    label={`${data.summary.removed} Removed`}
                    color="error"
                    variant="outlined"
                    size="small"
                  />
                )}
              </Box>
            </Box>

            {/* Search Input */}
            <Box sx={{ px: 3, pb: 2 }}>
              <TextField
                fullWidth
                size="small"
                placeholder="Search participants by name or role..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                InputProps={{
                  startAdornment: (
                    <InputAdornment position="start">
                      <SearchOutlined style={{ fontSize: 18, color: theme.palette.text.secondary }} />
                    </InputAdornment>
                  ),
                }}
                sx={{
                  '& .MuiOutlinedInput-root': {
                    bgcolor: theme.palette.background.paper,
                    '&:hover': {
                      '& .MuiOutlinedInput-notchedOutline': {
                        borderColor: theme.palette.primary.main,
                      }
                    }
                  }
                }}
              />
            </Box>

            {/* Participant List */}
            <List sx={{ 
              p: 0, 
              maxHeight: 400, 
              overflow: 'auto',
              bgcolor: theme.palette.background.paper 
            }}>
              {filteredParticipants.length === 0 ? (
                <Box sx={{ 
                  textAlign: 'center', 
                  py: 4, 
                  color: theme.palette.text.secondary 
                }}>
                  <SearchOutlined style={{ fontSize: 48, marginBottom: 16, opacity: 0.3 }} />
                  <Typography variant="body1">
                    No participants found matching "{searchQuery}"
                  </Typography>
                  <Typography variant="body2" sx={{ mt: 1 }}>
                    Try searching with a different name or role
                  </Typography>
                </Box>
              ) : (
                filteredParticipants.map((participant, index) => (
                  <ListItem 
                    key={participant.participantId}
                    sx={{ 
                      borderBottom: index < filteredParticipants.length - 1 
                      ? `1px solid ${theme.palette.divider}` 
                      : 'none',
                    '&:hover': { bgcolor: theme.palette.action.hover },
                    py: 1.5,
                    px: 3,
                    opacity: participant.isActive ? 1 : 0.6,
                    bgcolor: participant.isActive 
                      ? 'inherit' 
                      : theme.palette.action.disabledBackground
                  }}
                >
                  <ListItemIcon sx={{ position: 'relative' }}>
                    <Checkbox 
                      checked={participant.completed}
                      onChange={() => handleParticipantCompletionToggle(participant)}
                      disabled={updatingParticipants.has(participant.participantId) || !participant.isActive}
                      color="primary"
                    />
                    {updatingParticipants.has(participant.participantId) && (
                      <CircularProgress 
                        size={20} 
                        sx={{ 
                          position: 'absolute',
                          left: '50%',
                          top: '50%',
                          marginLeft: '-10px',
                          marginTop: '-10px'
                        }} 
                      />
                    )}
                  </ListItemIcon>
                  <ListItemText
                    primary={
                      <Typography 
                        variant="subtitle1"
                        sx={{
                          textDecoration: participant.completed ? 'line-through' : 'none',
                          opacity: participant.completed ? 0.7 : 1,
                          color: theme.palette.text.primary
                        }}
                      >
                        {participant.name}
                      </Typography>
                    }
                    secondary={
                      <Box sx={{ mt: 0.5 }}>
                        <Typography variant="body2" color="text.secondary">
                          {participant.role}
                          {!participant.isActive && (
                            <Chip 
                              label="Removed" 
                              size="small" 
                              color="error"
                              sx={{ ml: 1, height: 18, fontSize: '0.7rem' }}
                            />
                          )}
                        </Typography>
                        <Typography 
                          variant="caption" 
                          sx={{ 
                            color: participant.completed 
                              ? theme.palette.success.main 
                              : theme.palette.text.secondary,
                            display: 'block',
                            mt: 0.5 
                          }}
                        >
                          {!participant.isActive 
                            ? 'Removed from project'
                            : participant.completed 
                              ? `✓ Completed on ${new Date(participant.completedAt).toLocaleDateString()}`
                              : 'Pending completion'}
                        </Typography>
                        {participant.notes && (
                          <Typography 
                            variant="caption" 
                            sx={{ 
                              color: theme.palette.text.secondary,
                              display: 'block',
                              mt: 0.5,
                              fontStyle: 'italic'
                            }}
                          >
                            Note: {participant.notes}
                          </Typography>
                        )}
                      </Box>
                    }
                  />
                  <Box>
                    {participant.completed ? (
                      <CheckCircleOutlined 
                        style={{ fontSize: 24, color: theme.palette.success.main }} 
                      />
                    ) : (
                      <CloseCircleOutlined 
                        style={{ fontSize: 24, color: theme.palette.grey[400] }} 
                      />
                    )}
                  </Box>
                  </ListItem>
                ))
              )}
            </List>

            {data.participants.length === 0 && (
              <Box sx={{ 
                p: 4, 
                textAlign: 'center',
                bgcolor: theme.palette.background.paper 
              }}>
                <UserOutlined style={{ 
                  fontSize: 48, 
                  marginBottom: 16, 
                  color: theme.palette.text.disabled 
                }} />
                <Typography variant="h6" gutterBottom color="text.primary">
                  No Participants
                </Typography>
                <Typography variant="body2" color="text.secondary">
                  There are no participants enrolled in this project yet.
                </Typography>
              </Box>
            )}
          </>
        ) : null}
        
        {/* Footer Actions */}
        <Box sx={{ 
          p: 3, 
          borderTop: `1px solid ${theme.palette.divider}`,
          bgcolor: theme.palette.background.paper,
          textAlign: 'right'
        }}>
          <Button 
            onClick={onClose} 
            variant="contained"
            size="medium"
            sx={{
              minWidth: 100,
              fontWeight: 600,
              textTransform: 'none'
            }}
          >
            Close
          </Button>
        </Box>
      </MainCard>
    </Dialog>
  );
};

ParticipantChecklistDialog.propTypes = {
  open: PropTypes.bool.isRequired,
  onClose: PropTypes.func.isRequired,
  projectId: PropTypes.number.isRequired,
  checklistItem: PropTypes.object,
  onRefreshChecklist: PropTypes.func
};

export default ParticipantChecklistDialog;