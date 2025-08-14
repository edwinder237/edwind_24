import React from 'react';
import PropTypes from 'prop-types';
import {
  Button,
  Stack,
  Typography,
  CircularProgress
} from '@mui/material';
import { NOTIFICATION_MESSAGES } from '../utils/constants';

const SettingsActions = React.memo(({ 
  hasChanges, 
  saving, 
  onSave, 
  onCancel 
}) => {
  return (
    <Stack spacing={1}>
      <Stack
        direction="row"
        justifyContent="flex-end"
        alignItems="center"
        spacing={2}
      >
        <Button 
          variant="outlined" 
          color="secondary"
          onClick={onCancel}
          disabled={saving || !hasChanges}
        >
          Cancel
        </Button>
        <Button 
          variant="contained"
          onClick={onSave}
          disabled={saving || !hasChanges}
          startIcon={saving ? <CircularProgress size={20} /> : null}
        >
          {saving ? 'Updating...' : 'Update Settings'}
        </Button>
      </Stack>
      
      {hasChanges && (
        <Typography 
          variant="caption" 
          color="warning.main" 
          sx={{ textAlign: 'right' }}
        >
          {NOTIFICATION_MESSAGES.UNSAVED_CHANGES}
        </Typography>
      )}
    </Stack>
  );
});

SettingsActions.propTypes = {
  hasChanges: PropTypes.bool.isRequired,
  saving: PropTypes.bool.isRequired,
  onSave: PropTypes.func.isRequired,
  onCancel: PropTypes.func.isRequired
};

SettingsActions.displayName = 'SettingsActions';

export default SettingsActions;