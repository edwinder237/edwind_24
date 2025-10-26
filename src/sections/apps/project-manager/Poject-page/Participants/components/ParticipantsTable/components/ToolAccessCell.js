import { useState } from 'react';
import PropTypes from 'prop-types';
import {
  Box,
  Chip,
  IconButton,
  List,
  ListItem,
  ListItemText,
  Paper,
  Divider,
  Popover,
  Stack,
  Tooltip,
  Typography,
} from '@mui/material';
import {
  EditTwoTone,
  EyeOutlined,
  ToolOutlined,
} from '@ant-design/icons';
import ToolAccessManager from 'components/ToolAccessManager';

/**
 * Cell component for displaying and managing tool access
 */
const ToolAccessCell = ({ value, row, onRefresh }) => {
  const [anchorEl, setAnchorEl] = useState(null);
  const [managerOpen, setManagerOpen] = useState(false);

  const participant = row?.original?.participant;
  const participantId = participant?.id;
  const participantName = participant ? `${participant.firstName} ${participant.lastName}` : '';

  const handleClick = (event) => {
    setAnchorEl(event.currentTarget);
  };

  const handleClose = () => {
    setAnchorEl(null);
  };

  const handleManageClick = () => {
    setManagerOpen(true);
    handleClose();
  };

  const handleManagerClose = () => {
    setManagerOpen(false);
  };

  const handleUpdate = () => {
    onRefresh?.();
  };

  const open = Boolean(anchorEl);
  const toolAccesses = value || [];

  return (
    <>
      <Stack direction="row" spacing={1} alignItems="center">
        {toolAccesses.length === 0 ? (
          <Typography variant="body2" color="text.secondary">
            No tools assigned
          </Typography>
        ) : (
          <Chip
            icon={<ToolOutlined />}
            label={`${toolAccesses.length} tools`}
            size="small"
            variant="outlined"
            color="primary"
            onClick={handleClick}
            sx={{ cursor: 'pointer' }}
          />
        )}
        
        <Tooltip title="Manage Tool Access">
          <IconButton 
            size="small" 
            onClick={handleManageClick}
            disabled={!participantId}
          >
            <EditTwoTone />
          </IconButton>
        </Tooltip>
        
        {toolAccesses.length > 0 && (
          <Tooltip title="View Tool Access">
            <IconButton size="small" onClick={handleClick}>
              <EyeOutlined />
            </IconButton>
          </Tooltip>
        )}
      </Stack>
      
      {/* View Popover */}
      <Popover
        open={open}
        anchorEl={anchorEl}
        onClose={handleClose}
        anchorOrigin={{
          vertical: 'bottom',
          horizontal: 'left',
        }}
        transformOrigin={{
          vertical: 'top',
          horizontal: 'left',
        }}
        PaperProps={{
          sx: { maxWidth: 400, maxHeight: 300 }
        }}
      >
        <Paper sx={{ p: 2 }}>
          <Stack direction="row" justifyContent="space-between" alignItems="center" sx={{ mb: 2 }}>
            <Typography variant="h6">
              Tool Access
            </Typography>
            <IconButton size="small" onClick={handleManageClick}>
              <EditTwoTone />
            </IconButton>
          </Stack>
          <List dense>
            {toolAccesses.map((toolAccess, index) => (
              <div key={toolAccess.id}>
                <ListItem sx={{ px: 0 }}>
                  <ListItemText
                    primary={
                      <Stack direction="row" justifyContent="space-between" alignItems="center">
                        <Typography variant="subtitle2">
                          {toolAccess.tool}
                        </Typography>
                        <Chip
                          label={toolAccess.toolType || 'Tool'}
                          size="small"
                          color="secondary"
                          variant="outlined"
                        />
                      </Stack>
                    }
                    secondary={
                      <Box>
                        <Typography variant="body2" color="text.secondary">
                          Username: {toolAccess.username}
                        </Typography>
                        <Typography variant="body2" color="text.secondary">
                          Access Code: {toolAccess.accessCode}
                        </Typography>
                        {toolAccess.toolDescription && (
                          <Typography variant="caption" color="text.secondary">
                            {toolAccess.toolDescription}
                          </Typography>
                        )}
                        {toolAccess.toolUrl && (
                          <Typography
                            variant="caption"
                            color="primary"
                            component="a"
                            href={toolAccess.toolUrl}
                            target="_blank"
                            rel="noopener noreferrer"
                            sx={{ display: 'block', mt: 0.5 }}
                          >
                            {toolAccess.toolUrl}
                          </Typography>
                        )}
                      </Box>
                    }
                  />
                </ListItem>
                {index < toolAccesses.length - 1 && <Divider />}
              </div>
            ))}
          </List>
        </Paper>
      </Popover>

      {/* Tool Access Manager Dialog */}
      {participantId && (
        <ToolAccessManager
          open={managerOpen}
          onClose={handleManagerClose}
          participantId={participantId}
          participantName={participantName}
          onUpdate={handleUpdate}
        />
      )}
    </>
  );
};

ToolAccessCell.propTypes = {
  value: PropTypes.array,
  row: PropTypes.object,
  onRefresh: PropTypes.func,
};

export default ToolAccessCell;