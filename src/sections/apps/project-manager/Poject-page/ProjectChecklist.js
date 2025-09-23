import PropTypes from 'prop-types';
import { useState } from 'react';
import {
  Box,
  Chip,
  Typography,
  Paper,
  CircularProgress,
  List,
  ListItem,
  ListItemIcon,
  ListItemText,
  Checkbox,
  Card,
  CardContent,
  CardHeader,
  Avatar,
  IconButton,
  TextField,
  Tooltip,
  InputAdornment,
} from "@mui/material";
import { useTheme } from "@mui/material/styles";
import {
  CheckSquareOutlined,
  BookOutlined,
  SettingOutlined,
  FileTextOutlined,
  UserOutlined,
  EditOutlined,
  SaveOutlined,
  CloseOutlined,
  SearchOutlined,
} from "@ant-design/icons";
import ParticipantChecklistDialog from './ParticipantChecklistDialog';
import axios from 'utils/axios';

// ==============================|| PROJECT CHECKLIST ||============================== //

const ProjectChecklist = ({ 
  checklistItems, 
  checklistLoading, 
  onToggleItem,
  updatingItems,
  styles,
  projectId,
  onUpdateNote,
  onRefreshChecklist 
}) => {
  const theme = useTheme();
  const [participantDialogOpen, setParticipantDialogOpen] = useState(false);
  const [selectedChecklistItem, setSelectedChecklistItem] = useState(null);
  const [editingNoteId, setEditingNoteId] = useState(null);
  const [noteValue, setNoteValue] = useState('');
  const [savingNote, setSavingNote] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');

  const handleParticipantChipClick = (item) => {
    setSelectedChecklistItem(item);
    setParticipantDialogOpen(true);
  };

  const handleDialogClose = () => {
    setParticipantDialogOpen(false);
    setSelectedChecklistItem(null);
  };

  const handleEditNote = (item) => {
    setEditingNoteId(item.id);
    setNoteValue(item.notes || '');
  };

  const handleCancelNote = () => {
    setEditingNoteId(null);
    setNoteValue('');
  };

  const handleSaveNote = async (item) => {
    setSavingNote(true);
    try {
      const response = await axios.post('/api/projects/checklist-progress', {
        projectId,
        checklistItemId: item.id,
        completed: item.completed,
        notes: noteValue.trim() || null
      });
      
      if (onUpdateNote) {
        onUpdateNote(item.id, noteValue.trim());
      }
      
      setEditingNoteId(null);
      setNoteValue('');
    } catch (error) {
      console.error('Error saving note:', error);
    } finally {
      setSavingNote(false);
    }
  };

  const getCategoryIcon = (category) => {
    switch (category) {
      case 'content': return <BookOutlined />;
      case 'technical': return <SettingOutlined />;
      case 'review': return <FileTextOutlined />;
      case 'instructor': return <UserOutlined />;
      default: return <CheckSquareOutlined />;
    }
  };

  const getPriorityColor = (priority) => {
    switch (priority) {
      case 'high': return 'error';
      case 'medium': return 'warning';
      case 'low': return 'success';
      default: return 'default';
    }
  };

  if (checklistLoading) {
    return (
      <Box sx={{ display: 'flex', justifyContent: 'center', p: 4 }}>
        <CircularProgress />
      </Box>
    );
  }

  // Function to normalize text for search (handles accents and case)
  const normalizeText = (text) => {
    if (!text) return '';
    return text
      .toLowerCase()
      .normalize('NFD')
      .replace(/[\u0300-\u036f]/g, '');
  };

  // Filter items based on search query
  const filteredItems = checklistItems.filter((item) => {
    if (!searchQuery.trim()) return true;
    
    const normalizedQuery = normalizeText(searchQuery);
    const searchableText = [
      item.title,
      item.description,
      item.courseName,
      item.curriculumName,
      item.category,
      item.module?.title
    ].map(normalizeText).join(' ');
    
    return searchableText.includes(normalizedQuery);
  });

  // Group filtered items by course and curriculum
  const groupedItems = filteredItems.reduce((acc, item) => {
    const groupKey = `${item.curriculumName} - ${item.courseName}`;
    if (!acc[groupKey]) {
      acc[groupKey] = [];
    }
    acc[groupKey].push(item);
    return acc;
  }, {});

  return (
    <Box>
      {/* Header */}
      <Box sx={{ mb: 3 }}>
        <Box sx={{ ...styles.flexBetween, mb: 2 }}>
          <Typography variant="h5">
            Project Checklist ({filteredItems.length} of {checklistItems.length} items)
          </Typography>
          <Box sx={{ ...styles.flexCenter, gap: 1 }}>
            <Chip 
              label={`${filteredItems.filter(item => item.completed).length} completed`}
              color="success"
              variant="filled"
            />
            <Chip 
              label={`${filteredItems.filter(item => !item.completed).length} pending`}
              color="default"
              variant="outlined"
            />
          </Box>
        </Box>
        
        {/* Search Field */}
        <TextField
          size="small"
          fullWidth
          placeholder="Search checklist items..."
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
          InputProps={{
            startAdornment: (
              <InputAdornment position="start">
                <SearchOutlined style={{ color: theme.palette.text.secondary }} />
              </InputAdornment>
            ),
          }}
          sx={{ maxWidth: 400 }}
        />
      </Box>

      {/* Empty State */}
      {checklistItems.length === 0 ? (
        <Paper sx={{ p: 4, textAlign: 'center' }}>
          <CheckSquareOutlined style={{ fontSize: 48, marginBottom: 16, color: '#ccc' }} />
          <Typography variant="h6" gutterBottom>No Checklist Items</Typography>
          <Typography variant="body2" color="text.secondary">
            This project has no associated checklist items. Add courses to the project curriculum to see relevant checklist items.
          </Typography>
        </Paper>
      ) : filteredItems.length === 0 ? (
        <Paper sx={{ p: 4, textAlign: 'center' }}>
          <SearchOutlined style={{ fontSize: 48, marginBottom: 16, color: '#ccc' }} />
          <Typography variant="h6" gutterBottom>No Results Found</Typography>
          <Typography variant="body2" color="text.secondary">
            No checklist items match your search "{searchQuery}". Try adjusting your search terms.
          </Typography>
        </Paper>
      ) : (
        /* Grouped Checklist Items */
        Object.entries(groupedItems).map(([groupKey, items]) => (
          <Card key={groupKey} sx={{ mb: 2 }}>
            <CardHeader
              avatar={
                <Avatar sx={{ bgcolor: theme.palette.primary.main }}>
                  <BookOutlined />
                </Avatar>
              }
              title={
                <Typography variant="h6">
                  {groupKey} ({items.length})
                </Typography>
              }
              subheader={
                <Typography variant="body2" color="text.secondary">
                  {items.filter(item => item.completed).length} of {items.length} completed
                </Typography>
              }
            />
            <CardContent sx={{ pt: 0 }}>
              <List>
                {items.map((item) => (
                  <ListItem 
                    key={item.id} 
                    sx={{ 
                      pl: 0,
                      borderRadius: 1,
                      mb: 0.5,
                      '&:hover': {
                        backgroundColor: 'action.hover',
                      },
                      transition: 'background-color 0.2s'
                    }}
                  >
                    <ListItemIcon sx={{ position: 'relative' }}>
                      <Tooltip 
                        title={item.participantOnly ? "This task is completed automatically when all participants complete it" : ""}
                        placement="top"
                      >
                        <span>
                          <Checkbox 
                            checked={item.completed}
                            onChange={() => !item.participantOnly && onToggleItem(item)}
                            disabled={updatingItems.has(item.id) || item.participantOnly}
                            color="primary"
                          />
                        </span>
                      </Tooltip>
                      {updatingItems.has(item.id) && (
                        <CircularProgress 
                          size={20} 
                          sx={{ 
                            position: 'absolute',
                            left: '50%',
                            top: '50%',
                            marginLeft: '-10px',
                            marginTop: '-10px',
                          }} 
                        />
                      )}
                    </ListItemIcon>
                    <ListItemText
                      primary={
                        <Box>
                          <Box sx={{ ...styles.flexCenter, gap: 1, flexWrap: 'wrap', mb: 0.5 }}>
                            <Typography 
                              variant="body1" 
                              sx={{ 
                                fontWeight: 500,
                                textDecoration: item.completed ? 'line-through' : 'none',
                                opacity: item.completed ? 0.7 : 1,
                                flexGrow: 1,
                                textAlign: 'left'
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
                                icon={<UserOutlined style={{ fontSize: '14px' }} />}
                                onClick={() => handleParticipantChipClick(item)}
                                sx={{ cursor: 'pointer', '&:hover': { opacity: 0.8 } }}
                              />
                            )}
                            {item.module && (
                              <Chip 
                                label={`Module: ${item.module.title}`} 
                                size="small" 
                                variant="outlined"
                                color="info"
                              />
                            )}
                          </Box>
                        </Box>
                      }
                      secondary={
                        <Box sx={{ mt: 0.5 }}>
                          {item.description && (
                            <Typography variant="body2" color="text.secondary" sx={{ mb: 1 }}>
                              {item.description}
                            </Typography>
                          )}
                          
                          {/* Note Section */}
                          {editingNoteId === item.id ? (
                            <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.5, mb: 1 }}>
                              <TextField
                                size="small"
                                fullWidth
                                value={noteValue}
                                onChange={(e) => setNoteValue(e.target.value)}
                                placeholder="Add a note (max 160 characters)"
                                inputProps={{ maxLength: 160 }}
                                autoFocus
                                disabled={savingNote}
                                sx={{ 
                                  flexGrow: 1,
                                  '& .MuiInputBase-input': {
                                    fontSize: '0.875rem'
                                  }
                                }}
                              />
                              <IconButton 
                                size="small" 
                                onClick={() => handleSaveNote(item)}
                                disabled={savingNote}
                                color="primary"
                                sx={{ p: 0.5 }}
                              >
                                <SaveOutlined style={{ fontSize: 16 }} />
                              </IconButton>
                              <IconButton 
                                size="small" 
                                onClick={handleCancelNote}
                                disabled={savingNote}
                                sx={{ p: 0.5 }}
                              >
                                <CloseOutlined style={{ fontSize: 16 }} />
                              </IconButton>
                            </Box>
                          ) : (
                            item.notes ? (
                              <Box sx={{ 
                                display: 'flex', 
                                alignItems: 'center', 
                                gap: 0.5,
                                mb: 1
                              }}>
                                <Typography 
                                  variant="caption" 
                                  sx={{ 
                                    fontStyle: 'italic',
                                    color: 'text.secondary',
                                    flexGrow: 1
                                  }}
                                >
                                  Note: {item.notes}
                                </Typography>
                                <IconButton 
                                  size="small" 
                                  onClick={() => handleEditNote(item)}
                                  sx={{ p: 0.25 }}
                                >
                                  <EditOutlined style={{ fontSize: 12 }} />
                                </IconButton>
                              </Box>
                            ) : (
                              <Box sx={{ mb: 0.5 }}>
                                <Typography
                                  variant="caption"
                                  onClick={() => handleEditNote(item)}
                                  sx={{ 
                                    color: 'text.secondary',
                                    cursor: 'pointer',
                                    display: 'inline-flex',
                                    alignItems: 'center',
                                    gap: 0.5,
                                    '&:hover': { 
                                      textDecoration: 'underline',
                                      color: 'primary.main'
                                    }
                                  }}
                                >
                                  <EditOutlined style={{ fontSize: 12 }} />
                                  Add note
                                </Typography>
                              </Box>
                            )
                          )}
                          
                          <Typography variant="caption" color="text.secondary" sx={{ display: 'block' }}>
                            Created: {new Date(item.createdAt).toLocaleDateString()}
                            {item.completedAt && (
                              <> • Completed: {new Date(item.completedAt).toLocaleDateString()}</>
                            )}
                          </Typography>
                        </Box>
                      }
                    />
                  </ListItem>
                ))}
              </List>
            </CardContent>
          </Card>
        ))
      )}

      {/* Participant Progress Dialog */}
      <ParticipantChecklistDialog
        open={participantDialogOpen}
        onClose={handleDialogClose}
        projectId={projectId}
        checklistItem={selectedChecklistItem}
        onRefreshChecklist={onRefreshChecklist}
      />
    </Box>
  );
};

ProjectChecklist.propTypes = {
  checklistItems: PropTypes.array.isRequired,
  checklistLoading: PropTypes.bool.isRequired,
  onToggleItem: PropTypes.func.isRequired,
  updatingItems: PropTypes.instanceOf(Set).isRequired,
  styles: PropTypes.object.isRequired,
  projectId: PropTypes.number.isRequired,
  onUpdateNote: PropTypes.func,
  onRefreshChecklist: PropTypes.func.isRequired
};

export default ProjectChecklist;