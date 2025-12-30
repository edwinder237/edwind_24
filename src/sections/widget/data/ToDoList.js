import PropTypes from 'prop-types';
import { useState } from 'react';

// material-ui
import {
  CardContent,
  Checkbox,
  FormControlLabel,
  Grid,
  Tooltip,
  Box,
  Typography,
  Chip,
  IconButton,
  TextField,
  CircularProgress,
  Avatar,
  Collapse
} from '@mui/material';
import { useTheme } from '@mui/material/styles';

// project imports
import MainCard from 'components/MainCard';

// assets
import {
  PlusCircleOutlined,
  EditOutlined,
  SaveOutlined,
  CloseOutlined,
  BookOutlined,
  UserOutlined,
  UpOutlined,
  DownOutlined
} from '@ant-design/icons';

// ===========================|| DATA WIDGET - TODO LIST ||=========================== //

const ToDoList = ({
  title = "To Do List",
  items = [],
  groupedItems = {},
  onToggleItem,
  onSaveNote,
  onEditNote,
  onCancelNote,
  onParticipantChipClick,
  editingNoteId,
  noteValue,
  onNoteValueChange,
  savingNote,
  updatingItems = new Set(),
  showAddButton = true,
  onAddClick,
  completedCount = 0,
  totalCount = 0
}) => {
  const theme = useTheme();
  const [expandedGroups, setExpandedGroups] = useState({});

  const toggleGroup = (groupKey) => {
    setExpandedGroups(prev => ({
      ...prev,
      [groupKey]: !prev[groupKey]
    }));
  };

  // If no grouped items provided, render simple list
  const renderSimpleList = () => (
    <CardContent>
      <Grid container spacing={0} sx={{ '& .Mui-checked + span': { textDecoration: 'line-through' } }}>
        {items.map((item, index) => (
          <Grid item xs={12} key={item.id || index}>
            <FormControlLabel
              control={
                <Checkbox
                  checked={item.checked || item.completed}
                  onChange={() => onToggleItem && onToggleItem(item)}
                  name={item.name || `item${index}`}
                  color="primary"
                  disabled={updatingItems.has(item.id)}
                />
              }
              label={item.label || item.title}
              sx={{ width: '100%' }}
            />
          </Grid>
        ))}
      </Grid>
    </CardContent>
  );

  // Render grouped checklist with all features
  const renderGroupedList = () => (
    <CardContent sx={{ pt: 1 }}>
      {Object.entries(groupedItems).map(([groupKey, groupItems]) => {
        const isExpanded = expandedGroups[groupKey] !== false; // Default to expanded
        const groupCompleted = groupItems.filter(item => item.completed).length;

        return (
          <Box key={groupKey} sx={{ mb: 2 }}>
            {/* Group Header */}
            <Box
              sx={{
                display: 'flex',
                alignItems: 'center',
                gap: 1,
                p: 1.5,
                bgcolor: theme.palette.mode === 'dark' ? theme.palette.grey[100] : theme.palette.grey[2],
                borderRadius: 1,
                cursor: 'pointer',
                '&:hover': {
                  bgcolor: theme.palette.mode === 'dark' ? theme.palette.grey[200] : theme.palette.grey[3],
                },
                mb: 1
              }}
              onClick={() => toggleGroup(groupKey)}
            >
              <Avatar sx={{ bgcolor: theme.palette.primary.main, width: 32, height: 32 }}>
                <BookOutlined style={{ fontSize: 16 }} />
              </Avatar>
              <Box sx={{ flexGrow: 1 }}>
                <Typography variant="subtitle2" sx={{ fontWeight: 600 }}>
                  {groupKey} ({groupItems.length})
                </Typography>
                <Typography variant="caption" color="text.secondary">
                  {groupCompleted} of {groupItems.length} completed
                </Typography>
              </Box>
              <IconButton size="small">
                {isExpanded ? <UpOutlined /> : <DownOutlined />}
              </IconButton>
            </Box>

            {/* Group Items */}
            <Collapse in={isExpanded}>
              <Grid container spacing={0}>
                {groupItems.map((item) => (
                  <Grid item xs={12} key={item.id}>
                    <Box sx={{
                      pl: 1,
                      borderRadius: 1,
                      mb: 0.5,
                      '&:hover': {
                        backgroundColor: 'action.hover',
                      },
                      transition: 'background-color 0.2s'
                    }}>
                      {/* Checkbox and Title Row */}
                      <Box sx={{ display: 'flex', alignItems: 'flex-start', gap: 0.5 }}>
                        <Box sx={{ position: 'relative', pt: 1 }}>
                          <Tooltip
                            title={item.participantOnly ? "This task is completed automatically when all participants complete it" : ""}
                            placement="top"
                          >
                            <span>
                              <Checkbox
                                checked={item.completed}
                                onChange={() => onToggleItem && onToggleItem(item)}
                                disabled={updatingItems.has(item.id) || item.participantOnly}
                                color="primary"
                                size="small"
                              />
                            </span>
                          </Tooltip>
                          {updatingItems.has(item.id) && (
                            <CircularProgress
                              size={16}
                              sx={{
                                position: 'absolute',
                                left: '50%',
                                top: '50%',
                                marginLeft: '-8px',
                                marginTop: '-8px',
                              }}
                            />
                          )}
                        </Box>

                        <Box sx={{ flexGrow: 1, pt: 1.25 }}>
                          {/* Title and Chips */}
                          <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, flexWrap: 'wrap', mb: 0.5 }}>
                            <Typography
                              variant="body2"
                              sx={{
                                fontWeight: 500,
                                textDecoration: item.completed ? 'line-through' : 'none',
                                opacity: item.completed ? 0.7 : 1,
                                flexGrow: 1,
                              }}
                            >
                              {item.priority === 'high' && '! '}
                              {item.title}
                            </Typography>
                            {item.participantOnly && (
                              <Chip
                                label={item.participantCompletionCount ?
                                  (item.participantCompletionCount.total === 0 ?
                                    "No one assigned" :
                                    `Participants: ${item.participantCompletionCount.completed}/${item.participantCompletionCount.total}`
                                  ) :
                                  "Participant Only"
                                }
                                size="small"
                                variant="filled"
                                color={item.participantCompletionCount && item.participantCompletionCount.total === 0 ? "default" : "primary"}
                                icon={<UserOutlined style={{ fontSize: '12px' }} />}
                                onClick={() => onParticipantChipClick && onParticipantChipClick(item)}
                                sx={{ cursor: 'pointer', height: 20, fontSize: '0.7rem', '&:hover': { opacity: 0.8 } }}
                              />
                            )}
                            {item.module && (
                              <Chip
                                label={`Module: ${item.module.title}`}
                                size="small"
                                variant="outlined"
                                color="info"
                                sx={{ height: 20, fontSize: '0.7rem' }}
                              />
                            )}
                          </Box>

                          {/* Description */}
                          {item.description && (
                            <Typography variant="caption" color="text.secondary" sx={{ display: 'block', mb: 0.5 }}>
                              {item.description}
                            </Typography>
                          )}

                          {/* Note Section */}
                          {editingNoteId === item.id ? (
                            <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.5, mb: 0.5 }}>
                              <TextField
                                size="small"
                                fullWidth
                                value={noteValue}
                                onChange={(e) => onNoteValueChange && onNoteValueChange(e.target.value)}
                                placeholder="Add a note (max 160 characters)"
                                inputProps={{ maxLength: 160 }}
                                autoFocus
                                disabled={savingNote}
                                sx={{
                                  '& .MuiInputBase-input': {
                                    fontSize: '0.75rem',
                                    py: 0.5
                                  }
                                }}
                              />
                              <IconButton
                                size="small"
                                onClick={() => onSaveNote && onSaveNote(item)}
                                disabled={savingNote}
                                color="primary"
                                sx={{ p: 0.25 }}
                              >
                                <SaveOutlined style={{ fontSize: 14 }} />
                              </IconButton>
                              <IconButton
                                size="small"
                                onClick={() => onCancelNote && onCancelNote()}
                                disabled={savingNote}
                                sx={{ p: 0.25 }}
                              >
                                <CloseOutlined style={{ fontSize: 14 }} />
                              </IconButton>
                            </Box>
                          ) : (
                            item.notes ? (
                              <Box sx={{
                                display: 'flex',
                                alignItems: 'center',
                                gap: 0.5,
                                mb: 0.5
                              }}>
                                <Typography
                                  variant="caption"
                                  sx={{
                                    fontStyle: 'italic',
                                    color: 'text.secondary',
                                    flexGrow: 1,
                                    fontSize: '0.7rem'
                                  }}
                                >
                                  Note: {item.notes}
                                </Typography>
                                <IconButton
                                  size="small"
                                  onClick={() => onEditNote && onEditNote(item)}
                                  sx={{ p: 0.15 }}
                                >
                                  <EditOutlined style={{ fontSize: 11 }} />
                                </IconButton>
                              </Box>
                            ) : (
                              <Box sx={{ mb: 0.25 }}>
                                <Typography
                                  variant="caption"
                                  onClick={() => onEditNote && onEditNote(item)}
                                  sx={{
                                    color: 'text.secondary',
                                    cursor: 'pointer',
                                    display: 'inline-flex',
                                    alignItems: 'center',
                                    gap: 0.5,
                                    fontSize: '0.7rem',
                                    '&:hover': {
                                      textDecoration: 'underline',
                                      color: 'primary.main'
                                    }
                                  }}
                                >
                                  <EditOutlined style={{ fontSize: 10 }} />
                                  Add note
                                </Typography>
                              </Box>
                            )
                          )}

                          {/* Metadata */}
                          <Typography variant="caption" color="text.secondary" sx={{ display: 'block', fontSize: '0.65rem' }}>
                            Created: {new Date(item.createdAt).toLocaleDateString()}
                            {item.completedAt && (
                              <> • Completed: {new Date(item.completedAt).toLocaleDateString()}</>
                            )}
                          </Typography>
                        </Box>
                      </Box>
                    </Box>
                  </Grid>
                ))}
              </Grid>
            </Collapse>
          </Box>
        );
      })}
    </CardContent>
  );

  return (
    <MainCard
      title={title}
      content={false}
      secondary={
        showAddButton && onAddClick ? (
          <Tooltip title="Add Task">
            <IconButton onClick={onAddClick}>
              <PlusCircleOutlined />
            </IconButton>
          </Tooltip>
        ) : completedCount !== undefined && totalCount !== undefined ? (
          <Box sx={{ display: 'flex', gap: 0.5 }}>
            <Chip
              label={`${completedCount} completed`}
              color="success"
              variant="filled"
              size="small"
            />
            <Chip
              label={`${totalCount - completedCount} pending`}
              color="default"
              variant="outlined"
              size="small"
            />
          </Box>
        ) : null
      }
      sx={{ '& .MuiCardHeader-root': { p: 1.75 } }}
    >
      {Object.keys(groupedItems).length > 0 ? renderGroupedList() : renderSimpleList()}
    </MainCard>
  );
};

ToDoList.propTypes = {
  title: PropTypes.string,
  items: PropTypes.array,
  groupedItems: PropTypes.object,
  onToggleItem: PropTypes.func,
  onSaveNote: PropTypes.func,
  onEditNote: PropTypes.func,
  onCancelNote: PropTypes.func,
  onParticipantChipClick: PropTypes.func,
  editingNoteId: PropTypes.oneOfType([PropTypes.string, PropTypes.number]),
  noteValue: PropTypes.string,
  onNoteValueChange: PropTypes.func,
  savingNote: PropTypes.bool,
  updatingItems: PropTypes.instanceOf(Set),
  showAddButton: PropTypes.bool,
  onAddClick: PropTypes.func,
  completedCount: PropTypes.number,
  totalCount: PropTypes.number
};

export default ToDoList;
