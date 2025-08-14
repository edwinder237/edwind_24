import PropTypes from 'prop-types';
import { useState } from 'react';
import { useDispatch } from 'react-redux';

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
import { deleteCourse, deactivateCourse, getCourses } from 'store/reducers/courses';
import { openSnackbar } from 'store/reducers/snackbar';

// assets
import { DeleteFilled } from '@ant-design/icons';

// ==============================|| COURSE - DELETE ||============================== //

export default function AlertCourseDelete({ course, open, handleClose }) {
  const dispatch = useDispatch();
  const [deleting, setDeleting] = useState(false);
  const [deactivating, setDeactivating] = useState(false);

  const handleDelete = async () => {
    try {
      setDeleting(true);
      await dispatch(deleteCourse(course.id));
      
      dispatch(openSnackbar({
        open: true,
        message: 'Course deleted successfully',
        variant: 'alert',
        alert: { color: 'success' }
      }));

      handleClose(false);
      
      // Refresh courses list after a brief delay to ensure consistency
      setTimeout(() => {
        dispatch(getCourses());
      }, 500);
    } catch (error) {
      console.error('Error deleting course:', error);
      dispatch(openSnackbar({
        open: true,
        message: error.message || 'Failed to delete course. It may be in use by curriculums or events.',
        variant: 'alert',
        alert: { color: 'error' }
      }));
    } finally {
      setDeleting(false);
    }
  };

  const handleDeactivate = async () => {
    try {
      setDeactivating(true);
      await dispatch(deactivateCourse(course.id));
      
      dispatch(openSnackbar({
        open: true,
        message: 'Course deactivated successfully',
        variant: 'alert',
        alert: { color: 'success' }
      }));

      handleClose(false);
      
      // Refresh courses list after a brief delay to ensure consistency
      setTimeout(() => {
        dispatch(getCourses());
      }, 500);
    } catch (error) {
      console.error('Error deactivating course:', error);
      dispatch(openSnackbar({
        open: true,
        message: error.message || 'Failed to deactivate course.',
        variant: 'alert',
        alert: { color: 'error' }
      }));
    } finally {
      setDeactivating(false);
    }
  };

  if (!course) return null;

  return (
    <Dialog
      open={open}
      onClose={() => handleClose(false)}
      keepMounted
      TransitionComponent={PopupTransition}
      maxWidth="xs"
      aria-labelledby="course-delete-title"
      aria-describedby="course-delete-description"
    >
      <DialogContent sx={{ mt: 2, my: 1 }}>
        <Stack alignItems="center" spacing={3.5}>
          <Avatar color="error" sx={{ width: 72, height: 72, fontSize: '1.75rem' }}>
            <DeleteFilled />
          </Avatar>
          <Stack spacing={2}>
            <Typography variant="h4" align="center">
              Are you sure you want to delete?
            </Typography>
            <Typography align="center">
              {(course.curriculum_courses?.length > 0 || course.events?.length > 0) ? (
                <>
                  <Typography variant="subtitle1" component="span">
                    &quot;{course.title}&quot;{' '}
                  </Typography>
                  is currently being used in {course.curriculum_courses?.length || 0} curriculum(s) and {course.events?.length || 0} event(s).
                  <Typography variant="body2" color="warning.main" sx={{ mt: 1, fontWeight: 'bold' }}>
                    You can either deactivate it (safer) or permanently delete it.
                  </Typography>
                </>
              ) : (
                <>
                  By deleting
                  <Typography variant="subtitle1" component="span">
                    {' '}
                    &quot;{course.title}&quot;{' '}
                  </Typography>
                  course, all associated modules and activities will also be deleted.
                </>
              )}
            </Typography>
          </Stack>

          {(course.curriculum_courses?.length > 0 || course.events?.length > 0) ? (
            // Show both deactivate and delete options when course is in use
            <>
              <Stack direction="row" spacing={1} sx={{ width: 1 }}>
                <Button 
                  fullWidth 
                  onClick={() => handleClose(false)} 
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
                  disabled={deleting || deactivating}
                  startIcon={deactivating ? <CircularProgress size={20} /> : null}
                >
                  {deactivating ? 'Deactivating...' : 'Deactivate'}
                </Button>
              </Stack>
              <Stack direction="row" spacing={1} sx={{ width: 1, mt: 1 }}>
                <Button 
                  fullWidth 
                  color="error" 
                  variant="outlined" 
                  onClick={handleDelete}
                  disabled={deleting || deactivating}
                  startIcon={deleting ? <CircularProgress size={20} /> : null}
                >
                  {deleting ? 'Deleting...' : 'Force Delete'}
                </Button>
              </Stack>
            </>
          ) : (
            // Show only delete option when course is not in use
            <Stack direction="row" spacing={2} sx={{ width: 1 }}>
              <Button 
                fullWidth 
                onClick={() => handleClose(false)} 
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
                startIcon={deleting ? <CircularProgress size={20} /> : null}
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

AlertCourseDelete.propTypes = {
  course: PropTypes.object,
  open: PropTypes.bool,
  handleClose: PropTypes.func
};