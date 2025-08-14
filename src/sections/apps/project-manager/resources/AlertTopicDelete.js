import PropTypes from 'prop-types';

// material-ui
import { Button, Dialog, DialogContent, Stack, Typography } from '@mui/material';

// project import
import Avatar from 'components/@extended/Avatar';
import { PopupTransition } from 'components/@extended/Transitions';

// assets
import { DeleteFilled } from '@ant-design/icons';

// ==============================|| TOPIC - DELETE ||============================== //

export default function AlertTopicDelete({ 
  title, 
  usageCount = 0, 
  open, 
  handleClose 
}) {
  const hasUsage = usageCount > 0;

  return (
    <Dialog
      open={open}
      onClose={() => handleClose(false)}
      keepMounted
      TransitionComponent={PopupTransition}
      maxWidth="xs"
      aria-labelledby="topic-delete-title"
      aria-describedby="topic-delete-description"
    >
      <DialogContent sx={{ mt: 2, my: 1 }}>
        <Stack alignItems="center" spacing={3.5}>
          <Avatar color="error" sx={{ width: 72, height: 72, fontSize: '1.75rem' }}>
            <DeleteFilled />
          </Avatar>
          <Stack spacing={2}>
            <Typography variant="h4" align="center">
              {hasUsage ? 'Cannot Delete Topic' : 'Are you sure you want to delete?'}
            </Typography>
            <Typography align="center">
              {hasUsage ? (
                <>
                  The topic
                  <Typography variant="subtitle1" component="span">
                    {' '}
                    &quot;{title}&quot;{' '}
                  </Typography>
                  is currently used by {usageCount} course{usageCount !== 1 ? 's' : ''}. 
                  Please remove the topic from all courses before deleting it.
                </>
              ) : (
                <>
                  By deleting the topic
                  <Typography variant="subtitle1" component="span">
                    {' '}
                    &quot;{title}&quot;{' '}
                  </Typography>
                  it will be permanently removed from the system. This action cannot be undone.
                </>
              )}
            </Typography>
          </Stack>

          <Stack direction="row" spacing={2} sx={{ width: 1 }}>
            <Button 
              fullWidth 
              onClick={() => handleClose(false)} 
              color="secondary" 
              variant="outlined"
            >
              {hasUsage ? 'Close' : 'Cancel'}
            </Button>
            {!hasUsage && (
              <Button 
                fullWidth 
                color="error" 
                variant="contained" 
                onClick={() => handleClose(true)} 
                autoFocus
              >
                Delete
              </Button>
            )}
          </Stack>
        </Stack>
      </DialogContent>
    </Dialog>
  );
}

AlertTopicDelete.propTypes = {
  title: PropTypes.string,
  usageCount: PropTypes.number,
  open: PropTypes.bool,
  handleClose: PropTypes.func
};