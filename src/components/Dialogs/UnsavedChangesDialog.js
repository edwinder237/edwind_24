import PropTypes from 'prop-types';
import {
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Button,
  Typography,
  Box
} from '@mui/material';

/**
 * Reusable confirmation dialog for unsaved changes
 * Styled to match DeleteCard component
 *
 * @param {boolean} open - Whether the dialog is open
 * @param {function} onClose - Called when user wants to keep editing
 * @param {function} onDiscard - Called when user confirms discarding changes
 * @param {string} title - Dialog title (default: "Unsaved Changes")
 * @param {string} message - Dialog message
 * @param {string} keepEditingLabel - Label for the keep editing button
 * @param {string} discardLabel - Label for the discard button
 */
const UnsavedChangesDialog = ({
  open,
  onClose,
  onDiscard,
  title = 'Unsaved Changes',
  message = 'You have unsaved changes. Are you sure you want to close this form? Your progress will be lost.',
  keepEditingLabel = 'Cancel',
  discardLabel = 'Discard'
}) => {
  return (
    <Dialog
      open={open}
      onClose={onClose}
      maxWidth="xs"
      PaperProps={{
        sx: {
          backgroundColor: 'background.paper',
          backgroundImage: 'none',
          borderRadius: 0,
          minWidth: 400,
          maxWidth: 450
        }
      }}
    >
      <DialogTitle sx={{ pb: 2 }}>
        {title}
      </DialogTitle>

      <DialogContent>
        <Typography variant="body1" color="text.secondary">
          {message}
        </Typography>
      </DialogContent>

      <DialogActions sx={{ px: 3, pb: 3, pt: 2 }}>
        <Box sx={{ display: 'flex', gap: 2, justifyContent: 'flex-end', width: '100%' }}>
          <Button
            onClick={onClose}
            variant="text"
            sx={{
              color: 'primary.main',
              '&:hover': {
                bgcolor: 'transparent'
              }
            }}
          >
            {keepEditingLabel}
          </Button>

          <Button
            onClick={onDiscard}
            variant="contained"
            autoFocus
            sx={{
              bgcolor: '#ff5630',
              color: '#fff',
              boxShadow: 'none',
              '&:hover': {
                bgcolor: '#de350b',
                boxShadow: 'none'
              }
            }}
          >
            {discardLabel}
          </Button>
        </Box>
      </DialogActions>
    </Dialog>
  );
};

UnsavedChangesDialog.propTypes = {
  open: PropTypes.bool.isRequired,
  onClose: PropTypes.func.isRequired,
  onDiscard: PropTypes.func.isRequired,
  title: PropTypes.string,
  message: PropTypes.string,
  keepEditingLabel: PropTypes.string,
  discardLabel: PropTypes.string
};

export default UnsavedChangesDialog;
