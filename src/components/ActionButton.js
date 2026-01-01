import * as React from "react";
import { styled, alpha } from "@mui/material/styles";
import Button from "@mui/material/Button";
import Menu from "@mui/material/Menu";
import MenuItem from "@mui/material/MenuItem";
import { Edit, Delete, Email, PersonOutline, ChevronRight, GroupOutlined } from "@mui/icons-material";
import Divider from "@mui/material/Divider";
import KeyboardArrowDownIcon from "@mui/icons-material/KeyboardArrowDown";
import { Box, Typography, CircularProgress } from "@mui/material";

const StyledMenu = styled((props) => (
  <Menu
    elevation={0}
    anchorOrigin={{
      vertical: "bottom",
      horizontal: "right",
    }}
    transformOrigin={{
      vertical: "top",
      horizontal: "right",
    }}
    {...props}
  />
))(({ theme }) => ({
  "& .MuiPaper-root": {
    borderRadius: 6,
    marginTop: theme.spacing(1),
    minWidth: 180,
    color:
      theme.palette.mode === "light"
        ? "rgb(55, 65, 81)"
        : theme.palette.grey[300],
    boxShadow:
      "rgb(255, 255, 255) 0px 0px 0px 0px, rgba(0, 0, 0, 0.05) 0px 0px 0px 1px, rgba(0, 0, 0, 0.1) 0px 10px 15px -3px, rgba(0, 0, 0, 0.05) 0px 4px 6px -2px",
    "& .MuiMenu-list": {
      padding: "4px 0",
    },
    "& .MuiMenuItem-root": {
      "& .MuiSvgIcon-root": {
        fontSize: 18,
        color: theme.palette.text.secondary,
        marginRight: theme.spacing(1.5),
      },
      "&:active": {
        backgroundColor: alpha(
          theme.palette.primary.main,
          theme.palette.action.selectedOpacity
        ),
      },
    },
  },
}));

const SubMenu = styled(Menu)(({ theme }) => ({
  "& .MuiPaper-root": {
    borderRadius: 6,
    minWidth: 160,
    color:
      theme.palette.mode === "light"
        ? "rgb(55, 65, 81)"
        : theme.palette.grey[300],
    boxShadow:
      "rgb(255, 255, 255) 0px 0px 0px 0px, rgba(0, 0, 0, 0.05) 0px 0px 0px 1px, rgba(0, 0, 0, 0.1) 0px 10px 15px -3px, rgba(0, 0, 0, 0.05) 0px 4px 6px -2px",
    "& .MuiMenu-list": {
      padding: "4px 0",
    },
  },
}));

export default function ActionButton({
  label,
  handleCRUD,
  iDs,
  onEmailAccess,
  roles = [],
  rolesLoading = false,
  onAssignRole,
  groups = [],
  groupsLoading = false,
  onAssignGroup
}) {
  const { handleRemoveMany } = handleCRUD;
  const [anchorEl, setAnchorEl] = React.useState(null);
  const [roleMenuAnchor, setRoleMenuAnchor] = React.useState(null);
  const [groupMenuAnchor, setGroupMenuAnchor] = React.useState(null);
  const open = Boolean(anchorEl);
  const roleMenuOpen = Boolean(roleMenuAnchor);
  const groupMenuOpen = Boolean(groupMenuAnchor);

  const handleClick = (event) => {
    setAnchorEl(event.currentTarget);
  };

  const handleClose = () => {
    setAnchorEl(null);
    setRoleMenuAnchor(null);
    setGroupMenuAnchor(null);
  };

  const handleRemoveMultiple = () => {
    handleRemoveMany(iDs);
    handleClose();
  };

  const handleEmailAccess = () => {
    if (onEmailAccess) {
      onEmailAccess();
    }
    handleClose();
  };

  const handleRoleMenuOpen = (event) => {
    setRoleMenuAnchor(event.currentTarget);
  };

  const handleRoleMenuClose = () => {
    setRoleMenuAnchor(null);
  };

  const handleRoleSelect = (roleId) => {
    if (onAssignRole) {
      onAssignRole(roleId, iDs);
    }
    handleClose();
  };

  const handleGroupMenuOpen = (event) => {
    setGroupMenuAnchor(event.currentTarget);
  };

  const handleGroupMenuClose = () => {
    setGroupMenuAnchor(null);
  };

  const handleGroupSelect = (groupId) => {
    if (onAssignGroup) {
      onAssignGroup(groupId, iDs);
    }
    handleClose();
  };

  const hasSelections = iDs && iDs.length > 0;

  return (
    <div>
      <Button
        id="demo-customized-button"
        aria-controls={open ? "demo-customized-menu" : undefined}
        aria-haspopup="true"
        aria-expanded={open ? "true" : undefined}
        variant="contained"
        disableElevation
        onClick={handleClick}
        endIcon={<KeyboardArrowDownIcon />}
      >
        {label}
      </Button>
      <StyledMenu
        id="demo-customized-menu"
        MenuListProps={{
          "aria-labelledby": "demo-customized-button",
        }}
        anchorEl={anchorEl}
        open={open}
        onClose={handleClose}
      >
        <MenuItem onClick={handleEmailAccess} disableRipple disabled={!hasSelections}>
          <Email sx={{ color: "#2196f3" }} />
          Email Access
        </MenuItem>

        {/* Assign Role submenu trigger */}
        <MenuItem
          onClick={handleRoleMenuOpen}
          disableRipple
          disabled={!hasSelections}
          sx={{
            display: 'flex',
            justifyContent: 'space-between',
            pr: 1
          }}
        >
          <Box sx={{ display: 'flex', alignItems: 'center' }}>
            <PersonOutline sx={{ color: "#4caf50" }} />
            Assign Role
          </Box>
          <ChevronRight sx={{ ml: 1, fontSize: 16 }} />
        </MenuItem>

        {/* Assign Group submenu trigger */}
        <MenuItem
          onClick={handleGroupMenuOpen}
          disableRipple
          disabled={!hasSelections}
          sx={{
            display: 'flex',
            justifyContent: 'space-between',
            pr: 1
          }}
        >
          <Box sx={{ display: 'flex', alignItems: 'center' }}>
            <GroupOutlined sx={{ color: "#9c27b0" }} />
            Assign Group
          </Box>
          <ChevronRight sx={{ ml: 1, fontSize: 16 }} />
        </MenuItem>

        <Divider sx={{ my: 0.5 }} />

        <MenuItem onClick={handleRemoveMultiple} disableRipple disabled={!hasSelections}>
          <Delete sx={{ color: "#ff5722" }} />
          Delete
        </MenuItem>
        <MenuItem onClick={handleClose} disableRipple disabled={!hasSelections}>
          <Edit />
          Edit
        </MenuItem>
      </StyledMenu>

      {/* Role selection submenu */}
      <SubMenu
        anchorEl={roleMenuAnchor}
        open={roleMenuOpen}
        onClose={handleRoleMenuClose}
        anchorOrigin={{
          vertical: "top",
          horizontal: "right",
        }}
        transformOrigin={{
          vertical: "top",
          horizontal: "left",
        }}
      >
        {rolesLoading ? (
          <MenuItem disabled>
            <CircularProgress size={16} sx={{ mr: 1 }} />
            Loading roles...
          </MenuItem>
        ) : roles.length === 0 ? (
          <MenuItem disabled>
            <Typography variant="body2" color="textSecondary">
              No roles available
            </Typography>
          </MenuItem>
        ) : (
          <>
            {/* Option to remove role */}
            <MenuItem
              onClick={() => handleRoleSelect(null)}
              sx={{ fontStyle: 'italic', color: 'text.secondary' }}
            >
              No Role
            </MenuItem>
            <Divider sx={{ my: 0.5 }} />
            {roles.map((role) => (
              <MenuItem
                key={role.id}
                onClick={() => handleRoleSelect(role.id)}
              >
                {role.title}
              </MenuItem>
            ))}
          </>
        )}
      </SubMenu>

      {/* Group selection submenu */}
      <SubMenu
        anchorEl={groupMenuAnchor}
        open={groupMenuOpen}
        onClose={handleGroupMenuClose}
        anchorOrigin={{
          vertical: "top",
          horizontal: "right",
        }}
        transformOrigin={{
          vertical: "top",
          horizontal: "left",
        }}
      >
        {groupsLoading ? (
          <MenuItem disabled>
            <CircularProgress size={16} sx={{ mr: 1 }} />
            Loading groups...
          </MenuItem>
        ) : groups.length === 0 ? (
          <MenuItem disabled>
            <Typography variant="body2" color="textSecondary">
              No groups available
            </Typography>
          </MenuItem>
        ) : (
          <>
            {/* Option to remove from all groups */}
            <MenuItem
              onClick={() => handleGroupSelect(null)}
              sx={{ fontStyle: 'italic', color: 'text.secondary' }}
            >
              Remove from Groups
            </MenuItem>
            <Divider sx={{ my: 0.5 }} />
            {groups.map((group) => (
              <MenuItem
                key={group.id}
                onClick={() => handleGroupSelect(group.id)}
              >
                <Box
                  sx={{
                    width: 12,
                    height: 12,
                    borderRadius: '50%',
                    backgroundColor: group.chipColor || '#9e9e9e',
                    mr: 1.5
                  }}
                />
                {group.groupName}
              </MenuItem>
            ))}
          </>
        )}
      </SubMenu>
    </div>
  );
}
