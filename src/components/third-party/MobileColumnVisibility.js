import PropTypes from 'prop-types';
import React, { useState } from 'react';

// material-ui
import { useTheme } from '@mui/material/styles';
import {
  Box,
  Checkbox,
  IconButton,
  ListItemText,
  Menu,
  MenuItem,
  Tooltip,
  Typography,
  Divider,
  Stack,
  Button
} from '@mui/material';

// assets
import { CheckOutlined, SettingOutlined, EyeOutlined, EyeInvisibleOutlined } from '@ant-design/icons';

// ==============================|| MOBILE COLUMN VISIBILITY ||============================== //

/**
 * Mobile-friendly column visibility control
 * Displays an icon button that opens a menu for toggling column visibility
 */
const MobileColumnVisibility = ({ hiddenColumns = [], setHiddenColumns, allColumns = [] }) => {
  const theme = useTheme();
  const [anchorEl, setAnchorEl] = useState(null);
  const open = Boolean(anchorEl);

  const handleClick = (event) => {
    setAnchorEl(event.currentTarget);
  };

  const handleClose = () => {
    setAnchorEl(null);
  };

  const handleToggleColumn = (columnId) => {
    if (hiddenColumns.includes(columnId)) {
      // Show column - remove from hidden
      setHiddenColumns(hiddenColumns.filter((id) => id !== columnId));
    } else {
      // Hide column - add to hidden
      setHiddenColumns([...hiddenColumns, columnId]);
    }
  };

  const handleShowAll = () => {
    setHiddenColumns([]);
  };

  const handleHideOptional = () => {
    // Hide all columns except essential ones (selection, firstName, lastName, actions)
    const essentialColumns = ['selection', 'participant.firstName', 'participant.lastName', 'actions'];
    const toHide = allColumns
      .filter((col) => !essentialColumns.includes(col.id))
      .map((col) => col.id);
    setHiddenColumns(toHide);
  };

  // Filter out selection and id columns from the menu as they should always be visible
  const toggleableColumns = allColumns.filter(
    (col) => col.id !== 'selection' && col.id !== 'id'
  );

  const visibleCount = allColumns.filter((c) => !hiddenColumns.includes(c.id)).length;

  return (
    <>
      <Tooltip title="Manage Columns">
        <IconButton
          onClick={handleClick}
          size="small"
          sx={{
            border: '1px solid',
            borderColor: 'divider',
            borderRadius: 1,
            p: 0.75,
            '&:hover': {
              borderColor: 'primary.main',
              bgcolor: 'action.hover'
            }
          }}
        >
          <SettingOutlined style={{ fontSize: '18px' }} />
        </IconButton>
      </Tooltip>

      <Menu
        anchorEl={anchorEl}
        open={open}
        onClose={handleClose}
        anchorOrigin={{
          vertical: 'bottom',
          horizontal: 'right'
        }}
        transformOrigin={{
          vertical: 'top',
          horizontal: 'right'
        }}
        PaperProps={{
          sx: {
            minWidth: 220,
            maxWidth: 280,
            maxHeight: 400,
            mt: 1
          }
        }}
      >
        {/* Header */}
        <Box sx={{ px: 2, py: 1.5, borderBottom: '1px solid', borderColor: 'divider' }}>
          <Typography variant="subtitle2" fontWeight={600}>
            Visible Columns
          </Typography>
          <Typography variant="caption" color="text.secondary">
            {visibleCount} of {allColumns.length} columns visible
          </Typography>
        </Box>

        {/* Quick Actions */}
        <Stack direction="row" spacing={1} sx={{ px: 2, py: 1 }}>
          <Button
            size="small"
            variant="outlined"
            onClick={handleShowAll}
            startIcon={<EyeOutlined />}
            sx={{ flex: 1, fontSize: '0.7rem', py: 0.5 }}
          >
            All
          </Button>
          <Button
            size="small"
            variant="outlined"
            onClick={handleHideOptional}
            startIcon={<EyeInvisibleOutlined />}
            sx={{ flex: 1, fontSize: '0.7rem', py: 0.5 }}
          >
            Minimal
          </Button>
        </Stack>

        <Divider />

        {/* Column List */}
        {toggleableColumns.map((column) => {
          const isVisible = !hiddenColumns.includes(column.id);
          const columnName = typeof column.Header === 'string' ? column.Header : column?.title || column.id;

          return (
            <MenuItem
              key={column.id}
              onClick={() => handleToggleColumn(column.id)}
              sx={{
                py: 0.75,
                px: 2,
                bgcolor: isVisible ? 'transparent' : 'action.hover'
              }}
            >
              <Checkbox
                checked={isVisible}
                size="small"
                sx={{ p: 0, mr: 1.5 }}
                color="success"
                checkedIcon={
                  <Box
                    sx={{
                      width: 16,
                      height: 16,
                      border: '1px solid',
                      borderColor: 'inherit',
                      borderRadius: 0.25,
                      position: 'relative',
                      backgroundColor: theme.palette.success.main
                    }}
                  >
                    <CheckOutlined
                      style={{
                        position: 'absolute',
                        color: theme.palette.common.white,
                        fontSize: 12,
                        top: 1,
                        left: 1
                      }}
                    />
                  </Box>
                }
              />
              <ListItemText
                primary={columnName}
                primaryTypographyProps={{
                  variant: 'body2',
                  sx: {
                    color: isVisible ? 'text.primary' : 'text.secondary'
                  }
                }}
              />
            </MenuItem>
          );
        })}
      </Menu>
    </>
  );
};

MobileColumnVisibility.propTypes = {
  hiddenColumns: PropTypes.array,
  setHiddenColumns: PropTypes.func.isRequired,
  allColumns: PropTypes.array.isRequired
};

export default MobileColumnVisibility;
