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

// ==============================|| DELETE CARD - CONFIRMATION DIALOG ||============================== //

const DeleteCard = ({
  open,
  onClose,
  onDelete,
  onArchive,
  title = 'Delete Event',
  itemName,
  message,
  showArchive = false,
  deleteLabel = 'Delete',
  archiveLabel = 'Archive',
  cancelLabel = 'Cancel'
}) => {
  const defaultMessage = message ||
    `Are you sure you want to delete "${itemName}"? This action cannot be undone.`;

  return (
    <Dialog
      open={open}
      onClose={onClose}
      maxWidth="sm"
      fullWidth
      PaperProps={{
        sx: {
          backgroundColor: 'background.paper',
          backgroundImage: 'none',
          borderRadius: 0,
          minWidth: 400
        }
      }}
    >
      <DialogTitle sx={{ pb: 2 }}>
        {title}
      </DialogTitle>

      <DialogContent>
        <Typography variant="body1" color="text.secondary">
          {defaultMessage}
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
            {cancelLabel}
          </Button>

          {showArchive && onArchive && (
            <Button
              onClick={onArchive}
              variant="outlined"
              color="warning"
            >
              {archiveLabel}
            </Button>
          )}

          <Button
            onClick={onDelete}
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
            {deleteLabel}
          </Button>
        </Box>
      </DialogActions>
    </Dialog>
  );
};

DeleteCard.propTypes = {
  open: PropTypes.bool.isRequired,
  onClose: PropTypes.func.isRequired,
  onDelete: PropTypes.func.isRequired,
  onArchive: PropTypes.func,
  title: PropTypes.string,
  itemName: PropTypes.string,
  message: PropTypes.string,
  showArchive: PropTypes.bool,
  deleteLabel: PropTypes.string,
  archiveLabel: PropTypes.string,
  cancelLabel: PropTypes.string
};

export default DeleteCard;
