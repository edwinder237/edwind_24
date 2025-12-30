import PropTypes from 'prop-types';
import { useState, useMemo } from 'react';
import { useDispatch } from 'react-redux';
import {
  Box,
  Typography,
  Paper,
  CircularProgress,
  TextField,
  InputAdornment,
} from "@mui/material";
import { useTheme } from "@mui/material/styles";
import {
  CheckSquareOutlined,
  SearchOutlined,
} from "@ant-design/icons";
import ParticipantChecklistDialog from './ParticipantChecklistDialog';
import { useGetProjectChecklistQuery } from 'store/api/projectApi';
import { checklistCommands } from 'store/commands';
import ToDoList from 'sections/widget/data/ToDoList';

// ==============================|| PROJECT CHECKLIST ||============================== //

const ProjectChecklist = ({
  projectId,
  styles
}) => {
  const dispatch = useDispatch();
  const theme = useTheme();

  // RTK Query - Fetch checklist data
  const {
    data: checklistItems = [],
    isLoading: checklistLoading,
    refetch: onRefreshChecklist
  } = useGetProjectChecklistQuery(projectId, {
    skip: !projectId
  });

  // Local UI state
  const [participantDialogOpen, setParticipantDialogOpen] = useState(false);
  const [selectedChecklistItem, setSelectedChecklistItem] = useState(null);
  const [editingNoteId, setEditingNoteId] = useState(null);
  const [noteValue, setNoteValue] = useState('');
  const [savingNote, setSavingNote] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [updatingItems, setUpdatingItems] = useState(new Set());

  // Function to normalize text for search (handles accents and case)
  const normalizeText = (text) => {
    if (!text) return '';
    return text
      .toLowerCase()
      .normalize('NFD')
      .replace(/[\u0300-\u036f]/g, '');
  };

  // Filter items based on search query - MUST be before early returns
  const filteredItems = useMemo(() => {
    return checklistItems.filter((item) => {
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
  }, [checklistItems, searchQuery]);

  // Group filtered items by type, curriculum, and course - MUST be before early returns
  const groupedItems = useMemo(() => {
    return filteredItems.reduce((acc, item) => {
      // Create different group keys based on item type
      let groupKey;
      if (item.itemType === 'curriculum') {
        // Curriculum items: grouped by curriculum with special indicator
        groupKey = `📋 ${item.curriculumName} - Trainer Checklist`;
      } else {
        // Course items: grouped by curriculum and course name
        groupKey = `📖 ${item.curriculumName} - ${item.courseName}`;
      }

      if (!acc[groupKey]) {
        acc[groupKey] = [];
      }
      acc[groupKey].push(item);
      return acc;
    }, {});
  }, [filteredItems]);

  const completedCount = filteredItems.filter(item => item.completed).length;

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
      // Use semantic command to update note
      await dispatch(checklistCommands.updateChecklistNote({
        projectId,
        checklistItemId: item.id,
        itemTitle: item.title,
        notes: noteValue.trim() || null,
        completed: item.completed,
        completedBy: 'current-user', // TODO: Get from auth context
        itemType: item.itemType || 'course' // Pass item type for correct API routing
      })).unwrap();

      setEditingNoteId(null);
      setNoteValue('');
    } catch (error) {
      console.error('Error saving note:', error);
    } finally {
      setSavingNote(false);
    }
  };

  const handleToggleItem = async (item) => {
    // Don't allow toggling participant-only items at project level
    if (item.participantOnly) {
      return;
    }

    // Track which item is being updated
    setUpdatingItems(prev => new Set(prev).add(item.id));

    try {
      // Use semantic command based on current state
      const command = item.completed
        ? checklistCommands.uncompleteChecklistItem
        : checklistCommands.completeChecklistItem;

      await dispatch(command({
        projectId,
        checklistItemId: item.id,
        itemTitle: item.title,
        completedBy: 'current-user', // TODO: Get from auth context
        itemType: item.itemType || 'course' // Pass item type for correct API routing
      })).unwrap();
    } catch (error) {
      console.error('Error toggling checklist item:', error);
    } finally {
      // Remove from updating set
      setUpdatingItems(prev => {
        const next = new Set(prev);
        next.delete(item.id);
        return next;
      });
    }
  };

  if (checklistLoading) {
    return (
      <Box sx={{ display: 'flex', justifyContent: 'center', p: 4 }}>
        <CircularProgress />
      </Box>
    );
  }

  return (
    <Box>
      {/* Header with Search */}
      <Box sx={{ mb: 3 }}>
        <Box sx={{ ...styles.flexBetween, mb: 2 }}>
          <Typography variant="h5">
            Project Checklist ({filteredItems.length} of {checklistItems.length} items)
          </Typography>
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
        /* ToDoList Component with Grouped Items */
        <ToDoList
          title={`Checklist Items (${filteredItems.length})`}
          groupedItems={groupedItems}
          onToggleItem={handleToggleItem}
          onSaveNote={handleSaveNote}
          onEditNote={handleEditNote}
          onCancelNote={handleCancelNote}
          onParticipantChipClick={handleParticipantChipClick}
          editingNoteId={editingNoteId}
          noteValue={noteValue}
          onNoteValueChange={setNoteValue}
          savingNote={savingNote}
          updatingItems={updatingItems}
          showAddButton={false}
          completedCount={completedCount}
          totalCount={filteredItems.length}
        />
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
  projectId: PropTypes.oneOfType([PropTypes.number, PropTypes.string]).isRequired,
  styles: PropTypes.object.isRequired
};

export default ProjectChecklist;