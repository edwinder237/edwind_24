import { useEffect, useState, useCallback } from "react";
import React from "react";

// material-ui
import { 
  Typography, 
  Stack, 
  IconButton, 
  Tooltip, 
  TextField
} from "@mui/material";
import { SaveOutlined } from "@ant-design/icons";

// project imports
import MainCard from "components/MainCard";

// redux
import { useDispatch } from "store";
import { updateEvent } from "store/commands/eventCommands";

// ==============================|| SESSION NOTES ||============================== //

const SessionNotes = React.memo(({ notes, selectedEvent, events }) => {
  const dispatch = useDispatch();
  const [value, setValue] = useState(notes || "");
  const [isSaving, setIsSaving] = useState(false);
  const [lastSaved, setLastSaved] = useState(null);
  const [hasUnsavedChanges, setHasUnsavedChanges] = useState(false);

  // Update local state when notes prop changes or selected event changes
  useEffect(() => {
    setValue(notes || "");
    setHasUnsavedChanges(false);
  }, [notes, selectedEvent?.id]);

  // Debounced save function
  const saveNotes = useCallback(async () => {
    if (!selectedEvent) return;

    setIsSaving(true);
    try {
      // Use CQRS command pattern
      await dispatch(updateEvent({
        eventId: selectedEvent.id,
        projectId: selectedEvent.projectId,
        updates: {
          extendedProps: {
            ...selectedEvent.extendedProps,
            notes: value
          }
        }
      })).unwrap();

      setLastSaved(new Date());
      setHasUnsavedChanges(false);
    } catch (error) {
      console.error('Error saving notes:', error);
    } finally {
      setIsSaving(false);
    }
  }, [selectedEvent, value, dispatch]);

  const handleChange = (event) => {
    setValue(event.target.value);
    setHasUnsavedChanges(true);
  };

  const handleSave = () => {
    saveNotes();
  };

  const formatLastSaved = () => {
    if (!lastSaved) return "";
    return `Last saved: ${lastSaved.toLocaleTimeString()}`;
  };

  return (
    <MainCard
      title="Session Notes"
      secondary={
        <Stack direction="row" alignItems="center" spacing={1}>
          {hasUnsavedChanges && (
            <Typography variant="caption" color="warning.main">
              Unsaved changes
            </Typography>
          )}
          {lastSaved && !hasUnsavedChanges && (
            <Typography variant="caption" color="text.secondary">
              {formatLastSaved()}
            </Typography>
          )}
          <Tooltip title="Save Notes">
            <span>
              <IconButton 
                onClick={handleSave} 
                disabled={isSaving || !hasUnsavedChanges}
                color="primary"
                size="small"
              >
                <SaveOutlined />
              </IconButton>
            </span>
          </Tooltip>
        </Stack>
      }
    >
      <TextField
        multiline
        rows={8}
        fullWidth
        value={value}
        onChange={handleChange}
        placeholder="Add session notes, observations, or important information about this event..."
        variant="outlined"
        sx={{
          '& .MuiOutlinedInput-root': {
            '& fieldset': {
              borderColor: 'divider',
            },
            '&:hover fieldset': {
              borderColor: 'primary.main',
            },
            '&.Mui-focused fieldset': {
              borderColor: 'primary.main',
            },
          },
        }}
      />
    </MainCard>
  );
});

SessionNotes.displayName = 'SessionNotes';

export default SessionNotes;