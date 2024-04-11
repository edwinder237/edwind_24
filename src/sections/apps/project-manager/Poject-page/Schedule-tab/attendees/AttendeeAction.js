import PropTypes from 'prop-types';
import { useState } from 'react';

// material-ui
import { Menu, MenuItem, Typography } from '@mui/material';

// project imports
import IconButton from 'components/@extended/IconButton';

// assets
import { BackwardOutlined, CopyOutlined, DeleteOutlined, ForwardOutlined, MoreOutlined } from '@ant-design/icons';

const AttendeeAction = ({ index }) => {
  const [anchorEl, setAnchorEl] = useState(null);

  const handleClickSort = (event) => {
    setAnchorEl(event?.currentTarget);
  };

  const handleCloseSort = () => {
    setAnchorEl(null);
  };

  const open = Boolean(anchorEl);

  return (
    <>
      <IconButton
        id={`chat-action-button-${index}`}
        aria-controls={open ? `chat-action-menu-${index}` : undefined}
        aria-haspopup="true"
        aria-expanded={open ? 'true' : undefined}
        onClick={handleClickSort}
        size="small"
        color="secondary"
      >
        <MoreOutlined />
      </IconButton>
      <Menu
        id={`chat-action-menu-${index}`}
        anchorEl={anchorEl}
        keepMounted
        open={open}
        onClose={handleCloseSort}
        anchorOrigin={{
          vertical: 'bottom',
          horizontal: 'right'
        }}
        transformOrigin={{
          vertical: 'top',
          horizontal: 'right'
        }}
        MenuListProps={{
          'aria-labelledby': `chat-action-button-${index}`
        }}
        sx={{
          p: 0,
          '& .MuiMenu-list': {
            p: 0
          }
        }}
      >
        <MenuItem>
          <CopyOutlined style={{ paddingRight: 8 }} />
          <Typography>Email</Typography>
        </MenuItem>
        <MenuItem>
          <ForwardOutlined style={{ paddingRight: 8 }} />
          <Typography>Move to another event</Typography>
        </MenuItem>
        <MenuItem>
          <DeleteOutlined style={{ paddingRight: 8, paddingLeft: 0 }} />
          <Typography>Remove from event </Typography>
        </MenuItem>
      </Menu>
    </>
  );
};

AttendeeAction.propTypes = {
  index: PropTypes.number
};

export default AttendeeAction;
