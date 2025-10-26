import React, { useState, useCallback } from 'react';
import PropTypes from 'prop-types';
import {
  IconButton,
  Menu,
  MenuItem,
  Tooltip,
  Stack,
} from '@mui/material';
import {
  DeleteOutlined,
  EditTwoTone,
  MoreOutlined,
  CheckOutlined,
  CloseOutlined,
} from '@ant-design/icons';

/**
 * Column cell component for edit/delete actions
 */
export const ColumnCell = ({
  row,
  handleSubmit,
  handleCRUD,
  setEditableRowIndex,
  editableRowIndex,
}) => {
  const [anchorEl, setAnchorEl] = useState(null);
  const open = Boolean(anchorEl);
  const isEditing = editableRowIndex === row.index;

  const handleClick = useCallback((event) => {
    setAnchorEl(event.currentTarget);
  }, []);

  const handleClose = useCallback(() => {
    setAnchorEl(null);
  }, []);

  const handleEdit = useCallback(() => {
    if (isEditing) {
      // Cancel edit mode
      setEditableRowIndex(null);
    } else {
      // Enter edit mode
      setEditableRowIndex(row.index);
    }
    handleClose();
  }, [isEditing, row.index, setEditableRowIndex, handleClose]);

  const handleSave = useCallback(async () => {
    try {
      await handleSubmit();
      setEditableRowIndex(null);
    } catch (error) {
      console.error('[ColumnCell] Save failed:', error);
    }
  }, [handleSubmit, setEditableRowIndex]);

  const handleCancel = useCallback(() => {
    setEditableRowIndex(null);
  }, [setEditableRowIndex]);

  const handleDelete = useCallback(() => {
    const participantId = row.original?.id;
    if (participantId && handleCRUD?.handleRemove) {
      handleCRUD.handleRemove(participantId);
    }
    handleClose();
  }, [row.original?.id, handleCRUD]);

  // If in edit mode, show save/cancel buttons
  if (isEditing) {
    return (
      <Stack direction="row" spacing={0.5}>
        <Tooltip title="Save Changes">
          <IconButton
            color="success"
            size="small"
            onClick={handleSave}
          >
            <CheckOutlined />
          </IconButton>
        </Tooltip>
        <Tooltip title="Cancel">
          <IconButton
            color="error"
            size="small"
            onClick={handleCancel}
          >
            <CloseOutlined />
          </IconButton>
        </Tooltip>
      </Stack>
    );
  }

  // Normal mode - show menu button
  return (
    <>
      <Tooltip title="Actions">
        <IconButton
          color="secondary"
          size="small"
          onClick={handleClick}
        >
          <MoreOutlined />
        </IconButton>
      </Tooltip>

      <Menu
        anchorEl={anchorEl}
        open={open}
        onClose={handleClose}
        anchorOrigin={{
          vertical: 'bottom',
          horizontal: 'right',
        }}
        transformOrigin={{
          vertical: 'top',
          horizontal: 'right',
        }}
      >
        <MenuItem onClick={handleEdit}>
          <EditTwoTone sx={{ mr: 1 }} />
          Edit
        </MenuItem>
        <MenuItem onClick={handleDelete} sx={{ color: 'error.main' }}>
          <DeleteOutlined sx={{ mr: 1 }} />
          Delete
        </MenuItem>
      </Menu>
    </>
  );
};

ColumnCell.propTypes = {
  row: PropTypes.object.isRequired,
  handleSubmit: PropTypes.func.isRequired,
  handleCRUD: PropTypes.object.isRequired,
  setEditableRowIndex: PropTypes.func.isRequired,
  editableRowIndex: PropTypes.number,
};

ColumnCell.displayName = 'ColumnCell';