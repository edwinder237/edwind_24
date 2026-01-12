import PropTypes from 'prop-types';
import { useState } from 'react';

// material-ui
import {
  Button,
  Dialog,
  DialogContent,
  Stack,
  Typography,
  CircularProgress
} from '@mui/material';

// project import
import Avatar from 'components/@extended/Avatar';
import { PopupTransition } from 'components/@extended/Transitions';
import axios from 'utils/axios';

// assets
import { DeleteFilled, StopOutlined } from '@ant-design/icons';

// ==============================|| INSTRUCTOR - DELETE ||============================== //

export default function InstructorDeleteAlert({ instructor, open, handleClose, onDeleteSuccess, onDeactivateSuccess }) {
  const [deleting, setDeleting] = useState(false);
  const [deactivating, setDeactivating] = useState(false);

  const hasAssignments = instructor && (
    (instructor.projectCount || 0) > 0 ||
    (instructor.courseCount || 0) > 0
  );

  const handleDelete = async () => {
    try {
      setDeleting(true);
      const response = await axios.delete('/api/instructors/deleteInstructor', {
        params: { id: instructor.id }
      });

      if (response.data.success) {
        if (onDeleteSuccess) {
          onDeleteSuccess(instructor.id);
        }
        handleClose();
      }
    } catch (error) {
      console.error('Error deleting instructor:', error);
    } finally {
      setDeleting(false);
    }
  };

  const handleDeactivate = async () => {
    try {
      setDeactivating(true);
      const response = await axios.put('/api/instructors/updateInstructor', {
        id: instructor.id,
        status: 'inactive',
        updatedBy: 'current-user' // TODO: Get from auth context
      });

      if (response.data.success) {
        if (onDeactivateSuccess) {
          onDeactivateSuccess(instructor.id);
        }
        handleClose();
      }
    } catch (error) {
      console.error('Error deactivating instructor:', error);
    } finally {
      setDeactivating(false);
    }
  };

  if (!instructor) return null;

  const fullName = `${instructor.firstName} ${instructor.lastName}`;

  return (
    <Dialog
      open={open}
      onClose={handleClose}
      keepMounted
      TransitionComponent={PopupTransition}
      maxWidth="xs"
      aria-labelledby="instructor-delete-title"
      aria-describedby="instructor-delete-description"
    >
      <DialogContent sx={{ mt: 2, my: 1 }}>
        <Stack alignItems="center" spacing={3.5}>
          <Avatar color={hasAssignments ? "warning" : "error"} sx={{ width: 72, height: 72, fontSize: '1.75rem' }}>
            {hasAssignments ? <StopOutlined /> : <DeleteFilled />}
          </Avatar>
          <Stack spacing={2}>
            <Typography variant="h4" align="center">
              {hasAssignments ? 'Instructor has active assignments' : 'Are you sure you want to delete?'}
            </Typography>
            <Typography align="center">
              {hasAssignments ? (
                <>
                  <Typography variant="subtitle1" component="span">
                    &quot;{fullName}&quot;
                  </Typography>
                  {' '}is currently assigned to{' '}
                  <strong>{instructor.projectCount || 0}</strong> project(s) and{' '}
                  <strong>{instructor.courseCount || 0}</strong> course(s).
                  <Typography variant="body2" color="warning.main" sx={{ mt: 1, fontWeight: 'bold' }}>
                    You can deactivate this instructor instead, which will preserve all assignments.
                  </Typography>
                </>
              ) : (
                <>
                  By deleting
                  <Typography variant="subtitle1" component="span">
                    {' '}&quot;{fullName}&quot;{' '}
                  </Typography>
                  instructor, all associated records will also be removed.
                </>
              )}
            </Typography>
          </Stack>

          {hasAssignments ? (
            <>
              <Stack direction="row" spacing={1} sx={{ width: 1 }}>
                <Button
                  fullWidth
                  onClick={handleClose}
                  color="secondary"
                  variant="outlined"
                  disabled={deleting || deactivating}
                >
                  Cancel
                </Button>
                <Button
                  fullWidth
                  color="warning"
                  variant="contained"
                  onClick={handleDeactivate}
                  autoFocus
                  disabled={deleting || deactivating}
                  startIcon={deactivating ? <CircularProgress size={20} color="inherit" /> : null}
                >
                  {deactivating ? 'Deactivating...' : 'Deactivate'}
                </Button>
              </Stack>
              <Button
                fullWidth
                color="error"
                variant="outlined"
                onClick={handleDelete}
                disabled={deleting || deactivating}
                startIcon={deleting ? <CircularProgress size={20} /> : null}
                size="small"
              >
                {deleting ? 'Deleting...' : 'Force Delete Anyway'}
              </Button>
            </>
          ) : (
            <Stack direction="row" spacing={2} sx={{ width: 1 }}>
              <Button
                fullWidth
                onClick={handleClose}
                color="secondary"
                variant="outlined"
                disabled={deleting}
              >
                Cancel
              </Button>
              <Button
                fullWidth
                color="error"
                variant="contained"
                onClick={handleDelete}
                autoFocus
                disabled={deleting}
                startIcon={deleting ? <CircularProgress size={20} color="inherit" /> : null}
              >
                {deleting ? 'Deleting...' : 'Delete'}
              </Button>
            </Stack>
          )}
        </Stack>
      </DialogContent>
    </Dialog>
  );
}

InstructorDeleteAlert.propTypes = {
  instructor: PropTypes.object,
  open: PropTypes.bool,
  handleClose: PropTypes.func,
  onDeleteSuccess: PropTypes.func,
  onDeactivateSuccess: PropTypes.func
};
