import PropTypes from "prop-types";
import React, { useCallback, useMemo, Fragment, useState, useEffect, Suspense } from "react";

import {
  Box,
  Chip,
  Dialog,
  IconButton,
  Menu,
  MenuItem,
  Typography,
  Stack,
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableRow,
  Alert,
  Button,
  CircularProgress,
  Paper,
  Grid,
} from "@mui/material";
import { useTheme, alpha } from "@mui/material/styles";

// third-party
import { useExpanded, useTable } from "react-table";

// project import
import MainCard from "components/MainCard";
import ScrollX from "components/ScrollX";
import GroupDetails from "./GroupDetails";
import { CSVExport } from "components/third-party/ReactTable";
import LinearWithLabel from "components/@extended/progress/LinearWithLabel";
import GroupsErrorBoundary from "components/GroupsErrorBoundary";
import PerformanceMonitor from "components/PerformanceMonitor";
// ADD BUTTON DEPS
import { PopupTransition } from "components/@extended/Transitions";

// assets
import {
  DownOutlined,
  RightOutlined,
  PlusOutlined,
  MailOutlined,
  DeleteOutlined,
  MoreOutlined,
  SettingOutlined,
  ReloadOutlined,
  BookOutlined,
  EditOutlined,
  WarningOutlined,
  CheckCircleOutlined,
  UserAddOutlined,
  TeamOutlined,
  UploadOutlined,
  InfoCircleOutlined,
} from "@ant-design/icons";
import AddButton from "components/StyledButtons";
// Dynamic imports for heavy components to reduce bundle size
import AddGroupOptimized from "./AddGroupOptimized";
const ManageGroupSlider = React.lazy(() => import("./ManageGroupSlider"));
const CurriculumManageDialog = React.lazy(() => import("./CurriculumManageDialog"));
const EditGroupDialog = React.lazy(() => import("./components/EditGroupDialog"));

import { useDispatch } from "store";
import {
  addGroup,
  updateGroup,
  removeGroup,
  getGroupsDetails,
  getSingleProject,
  clearProgressCache,
} from "store/reducers/projects";
import { openSnackbar } from "store/reducers/snackbar";
import { useSelector } from "store";
import axios from "utils/axios";
import { debounce } from "utils/debounce";

// ==============================|| REACT TABLE ||============================== //

const tableName = "Groups";

const ColumnCell = ({
  row,
  setEditableRowIndex,
  editableRowIndex,
  handleRemoveGroup,
  handleManageCurriculums,
  handleEditGroup,
}) => {
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
      <Stack
        direction="row"
        alignItems="center"
        justifyContent="center"
        spacing={0}
      >
        <IconButton
          id={`chat-action-button-${editableRowIndex}`}
          aria-controls={
            open ? `chat-action-menu-${editableRowIndex}` : undefined
          }
          aria-haspopup="true"
          aria-expanded={open ? "true" : undefined}
          onClick={handleClickSort}
          size="small"
          color="secondary"
        >
          <MoreOutlined />
        </IconButton>
        <Menu
          id={`chat-action-menu-${editableRowIndex}`}
          anchorEl={anchorEl}
          keepMounted
          open={open}
          onClose={handleCloseSort}
          anchorOrigin={{
            vertical: "bottom",
            horizontal: "right",
          }}
          transformOrigin={{
            vertical: "top",
            horizontal: "right",
          }}
          MenuListProps={{
            "aria-labelledby": `chat-action-button-${editableRowIndex}`,
          }}
          sx={{
            p: 0,
            "& .MuiMenu-list": {
              p: 0,
            },
          }}
        >
          <MenuItem onClick={() => handleEditGroup && handleEditGroup(row.original)}>
            <EditOutlined style={{ paddingRight: 8 }} />
            <Typography>Edit Group</Typography>
          </MenuItem>
          <MenuItem onClick={() => handleManageCurriculums && handleManageCurriculums(row.original)}>
            <BookOutlined style={{ paddingRight: 8 }} />
            <Typography>Manage Curriculums</Typography>
          </MenuItem>
          <MenuItem>
            <MailOutlined style={{ paddingRight: 8 }} />
            <Typography>Email Credentials </Typography>
          </MenuItem>
          <MenuItem onClick={() => handleRemoveGroup(row.original.id)}>
            <DeleteOutlined style={{ paddingRight: 8, paddingLeft: 0 }} />
            <Typography>Delete</Typography>
          </MenuItem>
        </Menu>
      </Stack>
    </>
  );
};

ColumnCell.propTypes = {
  row: PropTypes.object,
  setEditableRowIndex: PropTypes.func,
  editableRowIndex: PropTypes.number,
  handleRemoveGroup: PropTypes.func,
  handleManageCurriculums: PropTypes.func,
  handleEditGroup: PropTypes.func,
};

function ReactTable({
  columns: userColumns,
  data,
  renderRowSubComponent,
  handleRemoveGroup,
  handleManageCurriculums,
  handleEditGroup,
}) {
  const {
    getTableProps,
    getTableBodyProps,
    headerGroups,
    rows,
    prepareRow,
    visibleColumns,
  } = useTable(
    {
      columns: userColumns,
      data,
    },
    useExpanded,
    (hooks) => {
      hooks.allColumns.push((columns) => [
        ...columns,
        {
          accessor: "edit",
          id: "edit",
          Footer: "Edit",
          Header: "Action",
          disableFilters: true,
          disableSortBy: true,
          disableGroupBy: true,
          groupByBoundary: true,
          Cell: ({ row }) => (
            <ColumnCell 
              row={row} 
              handleRemoveGroup={handleRemoveGroup}
              handleManageCurriculums={handleManageCurriculums}
              handleEditGroup={handleEditGroup}
            />
          ),
        },
      ]);
    }
  );

  return (
    <Table {...getTableProps()}>
      <TableHead>
        {headerGroups.map((headerGroup, i) => {
          const { key, ...headerGroupProps } = headerGroup.getHeaderGroupProps();
          return (
            <TableRow key={i} {...headerGroupProps}>
            {headerGroup.headers.map((column, index) => {
              const { key: columnKey, ...columnProps } = column.getHeaderProps([{ className: column.className }]);
              return (
                <TableCell
                  key={index}
                  {...columnProps}
              >
                {column.render("Header")}
              </TableCell>
              );
            })}
            </TableRow>
          );
        })}
      </TableHead>
      <TableBody {...getTableBodyProps()}>
        {rows.map((row, i) => {
          prepareRow(row);
          const { key: rowKey, ...rowProps } = row.getRowProps();

          return (
            <Fragment key={i}>
              <TableRow {...rowProps}>
                {row.cells.map((cell, index) => {
                  const { key: cellKey, ...cellProps } = cell.getCellProps([
                    { className: cell.column.className },
                  ]);
                  return (
                    <TableCell
                      key={index}
                      {...cellProps}
                  >
                    {cell.render("Cell")}
                  </TableCell>
                  );
                })}
              </TableRow>
              {row.isExpanded &&
                renderRowSubComponent({ row, rowProps, visibleColumns })}
            </Fragment>
          );
        })}
      </TableBody>
    </Table>
  );
}

ReactTable.propTypes = {
  columns: PropTypes.array,
  data: PropTypes.array,
  renderRowSubComponent: PropTypes.any,
  handleRemoveGroup: PropTypes.func,
  handleManageCurriculums: PropTypes.func,
  handleEditGroup: PropTypes.func,
};

// ==============================|| REACT TABLE - EXPANDING TABLE ||============================== //

const CellExpander = React.memo(({ row }) => {
  const collapseIcon = row.isExpanded ? <DownOutlined /> : <RightOutlined />;
  return (
    <Box
      sx={{ fontSize: "0.75rem", color: "text.secondary", textAlign: "center" }}
      {...row.getToggleRowExpandedProps()}
    >
      {collapseIcon}
    </Box>
  );
});

CellExpander.propTypes = {
  row: PropTypes.object,
};

const GroupCell = React.memo(({ value, groups }) => {
  // Safety check for value
  if (typeof value !== 'string' && typeof value !== 'number') {
    return <Chip color="error" label="Invalid" size="small" />;
  }

  // Safety check for groups array
  if (!Array.isArray(groups)) {
    return <Chip color="error" label="No Groups" size="small" />;
  }

  const matchingGroup = groups.find((group) => 
    group && typeof group === 'object' && !group.error && group.groupName === value
  );

  if (matchingGroup) {
    const chipColor = matchingGroup.chipColor;

    switch (value) {
      default:
        return (
          <Chip
            style={{ backgroundColor: chipColor, color: "#fff" }}
            label={`${value}`}
            size="small"
          />
        );
    }
  } else {
    // Handle the case when a matching group is not found
    return <Chip color="default" label="Unknown" size="small" />;
  }
  // Handle the case when the value is falsy (null, undefined, etc.)
  return <Chip color="default" label="None" size="small" />;
});

GroupCell.propTypes = {
  value: PropTypes.string,
  chipColor: PropTypes.string,
};

const GroupTable = ({ index }) => {
  const { singleProject: Project, project_participants, groups, loading } = useSelector((state) => state.projects);
  const dispatch = useDispatch();
  const theme = useTheme();
  const { participants } = Project;

  const [data, setData] = useState([]);
  const [error, setError] = useState(null);
  const [progressData, setProgressData] = useState({}); // Separate state for progress to avoid re-renders

  const fetchGroupsData = async () => {
    if (Project && Project.id) {
      try {
        setError(null);
        await dispatch(getGroupsDetails(Project.id));
      } catch (err) {
        setError('Failed to load groups. Please try again.');
        console.error('Error fetching groups:', err);
      }
    }
  };

  // Debounced version to prevent excessive API calls during rapid operations
  const debouncedFetchGroupsData = useMemo(
    () => debounce(fetchGroupsData, 300),
    [Project?.id]
  );

  // Centralized state management - prioritize Redux groups state
  useEffect(() => {
    // Helper function to validate group data
    const isValidGroupsArray = (data) => {
      return Array.isArray(data) && data.every(item => 
        item && typeof item === 'object' && !item.error && typeof item.groupName === 'string'
      );
    };
    
    // Check if groups data contains error
    const hasError = (data) => {
      return data && typeof data === 'object' && data.error;
    };
    
    if (hasError(groups)) {
      setError('Error loading groups data. Please try again.');
      setData([]);
    } else if (groups && isValidGroupsArray(groups) && Project?.id) {
      // Always use groups from Redux state which includes complete curriculum data
      const projectGroups = groups.filter(group => 
        group && typeof group === 'object' && !group.error && group.projectId === Project.id
      );
      console.log('Using Redux groups with complete data:', projectGroups);
      setData(projectGroups);
      setError(null);
    } else {
      // Set empty array and only show error if we expect data
      console.log('Setting empty array - no valid group data');
      setData([]);
      if (Project?.id && groups !== null) {
        setError('No groups found or invalid data format.');
      }
    }
  }, [groups, Project?.id]);

  // ADD BUTTON DEPS
  const [customer, setCustomer] = useState(null);
  const [add, setAdd] = useState(false);
  const [manageGroup, setManageGroup] = useState(false);
  const [curriculumDialogOpen, setCurriculumDialogOpen] = useState(false);
  const [selectedGroup, setSelectedGroup] = useState(null);
  
  // EDIT GROUP STATE
  const [editGroupDialog, setEditGroupDialog] = useState(false);
  const [groupToEdit, setGroupToEdit] = useState(null);
  
  const handleAdd = () => {
    setAdd(!add);
    if (customer && !add) setCustomer(null);
  };
  
  const handleManageGroup = async () => {
    console.log('Opening ManageGroup with groups:', groups);
    console.log('Groups data for ManageGroupSlider:', Array.isArray(groups) ? groups.filter(group => 
      group && typeof group === 'object' && !group.error && group.projectId === Project?.id
    ) : []);
    
    // Only fetch if groups are completely empty/null
    if (Project?.id && !groups) {
      console.log('Fetching groups before opening ManageGroup slider...');
      await fetchGroupsData();
    }
    
    setManageGroup(!manageGroup);
  };
  async function handleAddGroup(newGroup) {
    //this fucntion adds the newlly created group to the project.groups state

    return await dispatch(addGroup(newGroup, groups, index, Project.id));
  }

  async function handleRemoveGroup(groupId) {
    try {
      const groupToDelete = groups.find((group) => group.id === groupId);
      const groupName = groupToDelete?.groupName || 'Group';
      
      const updatedGroups = groups.filter((group) => group.id !== groupId);
      console.log('Removing group with ID:', groupId);
      console.log('Updated groups after removal:', updatedGroups);
      
      await dispatch(removeGroup(updatedGroups, index, groupId));
      
      // Small delay to ensure database deletion is fully processed
      await new Promise(resolve => setTimeout(resolve, 500));
      
      // Single refresh to update project data (includes groups)
      if (Project?.id) {
        console.log('Refreshing data after group deletion...');
        await dispatch(getSingleProject(Project.id));
        console.log('Data refresh completed');
      }
      
      // Show success notification
      dispatch(openSnackbar({
        open: true,
        message: `${groupName} deleted successfully.`,
        variant: 'alert',
        alert: {
          color: 'success'
        },
        close: false
      }));
      
    } catch (error) {
      console.error('Failed to delete group:', error);
      
      // Show error notification
      dispatch(openSnackbar({
        open: true,
        message: 'Failed to delete group. Please try again.',
        variant: 'alert',
        alert: {
          color: 'error'
        },
        close: false
      }));
    }
  }

  const handleManageCurriculums = (group) => {
    setSelectedGroup(group);
    setCurriculumDialogOpen(true);
  };

  const handleCurriculumDialogClose = () => {
    setCurriculumDialogOpen(false);
    setSelectedGroup(null);
  };

  const handleRefreshAfterCurriculumChange = async () => {
    // This function is now handled directly by CurriculumManageDialog
    // via Redux dispatch, so we don't need to do anything here.
    // Keeping this function for compatibility but it's essentially a no-op
    console.log('Curriculum refresh handled by dialog component');
  };

  // EDIT GROUP HANDLERS
  const handleEditGroup = (group) => {
    setGroupToEdit(group);
    setEditGroupDialog(true);
  };

  const handleEditGroupClose = () => {
    setEditGroupDialog(false);
    setGroupToEdit(null);
  };

  const handleUpdateGroupDetails = async (groupId, updates) => {
    try {
      await dispatch(updateGroup(groupId, updates, Project.id));
      
      // No need to refresh data - Redux state is already updated with preserved order
      
      // Show success notification
      dispatch(openSnackbar({
        open: true,
        message: 'Group updated successfully.',
        variant: 'alert',
        alert: {
          color: 'success'
        },
        close: false
      }));
      
    } catch (error) {
      console.error('Failed to update group:', error);
      
      // Show error notification
      dispatch(openSnackbar({
        open: true,
        message: 'Failed to update group. Please try again.',
        variant: 'alert',
        alert: {
          color: 'error'
        },
        close: false
      }));
      
      throw error; // Re-throw so the dialog can handle it
    }
  };

  async function handleUpdateGroup(groupId, action, participantId) {
    try {
      setError(null);
      let response;
      
      if (action === 'add') {
        response = await axios.post('/api/projects/add-participant-to-group', {
          groupId,
          participantId,
        });
      } else if (action === 'remove') {
        response = await axios.post('/api/projects/remove-participant-from-group', {
          groupId,
          participantId,
        });
      }

      if (response?.data?.success) {
        // Single refresh to update all project data (includes groups)
        await dispatch(getSingleProject(Project.id));
        console.log(response.data.message);
      } else {
        setError('Failed to update group participant. Please try again.');
      }
    } catch (error) {
      console.error('Error updating group:', error);
      setError('Failed to update group participant. Please try again.');
    }
  }

  // Handle lazy loading of progress when group is expanded
  const handleProgressLoad = useCallback(async (groupId) => {
    if (!Project?.id || !groupId) return;
    
    // Skip if already loaded
    if (progressData[groupId]) return;
    
    try {
      const response = await axios.post('/api/groups/calculate-progress', {
        groupId,
        projectId: Project.id
      });
      
      if (response.data) {
        // Update progress in separate state to avoid table re-render
        setProgressData(prev => ({
          ...prev,
          [groupId]: {
            groupProgress: response.data.groupProgress,
            participantProgress: response.data.participantProgress
          }
        }));
      }
    } catch (error) {
      console.error('Error loading group progress:', error);
    }
  }, [Project?.id, progressData]);

  // Function to handle progress cache clearing and refresh
  const handleProgressCacheInvalidation = useCallback(async () => {
    if (!Project?.id) return;
    
    try {
      console.log('Handling progress cache invalidation for project:', Project.id);
      
      // Clear server-side and client-side cache
      await dispatch(clearProgressCache(Project.id));
      
      // Clear local progress state to force re-fetch
      setProgressData({});
      
      // Optionally refresh the groups data as well
      // This ensures any new attendance data is reflected
      await dispatch(getGroupsDetails(Project.id));
      
    } catch (error) {
      console.error('Error handling progress cache invalidation:', error);
    }
  }, [Project?.id, dispatch]);

  // Listen for attendance updates from other tabs/components
  useEffect(() => {
    const handleAttendanceUpdate = (event) => {
      if (event.detail?.projectId === Project?.id) {
        console.log('Received attendance update event for project:', Project.id);
        handleProgressCacheInvalidation();
      }
    };

    // Listen for custom event
    window.addEventListener('attendanceUpdated', handleAttendanceUpdate);
    
    return () => {
      window.removeEventListener('attendanceUpdated', handleAttendanceUpdate);
    };
  }, [Project?.id, handleProgressCacheInvalidation]);

  // Performance monitoring and cleanup
  useEffect(() => {
    const startTime = performance.now();
    
    return () => {
      const endTime = performance.now();
      const renderTime = endTime - startTime;
      
      // Log performance metrics in development
      if (process.env.NODE_ENV === 'development' && renderTime > 100) {
        console.warn(`Groups tab render took ${renderTime.toFixed(2)}ms - consider optimizing`);
      }
      
      // Cleanup: Clear progress data when component unmounts to prevent memory leaks
      setProgressData({});
    };
  }, []);

  // Memory cleanup when project changes
  useEffect(() => {
    // Clear progress data when switching projects to prevent memory accumulation
    setProgressData({});
    setError(null);
  }, [Project?.id]);

  // Memoize column definitions with optimized dependencies
  const columns = useMemo(
    () => [
      {
        Header: () => null,
        id: "expander",
        className: "cell-center",
        Cell: CellExpander,
        SubCell: () => null,
      },
      {
        Header: "Group Name",
        accessor: "groupName",
        Cell: (props) => <GroupCell {...props} groups={data} />,
      },
      {
        Header: "Size",
        accessor: "participants",
        Cell: ({ value, row }) => {
          const count = value && Array.isArray(value) ? value.length : 0;
          return count === 0 ? <span>⚠️</span> : <span>{count}</span>;
        },
      },
      {
        Header: "Curriculum",
        accessor: "group_curriculums",
        Cell: ({ value, row }) => {
          const hasCurriculums = value && Array.isArray(value) && value.length > 0;
          return (
            <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
              {hasCurriculums ? (
                <CheckCircleOutlined style={{ color: '#52c41a' }} />
              ) : (
                <WarningOutlined style={{ color: '#faad14' }} />
              )}
            </Box>
          );
        },
      },
      {
        Header: "Curriculum Progress",
        accessor: "progress",
        Cell: ({ value, row }) => {
          const groupId = row.original.id;
          const loadedProgress = progressData[groupId]?.groupProgress;
          
          // Use loaded progress if available, otherwise use original value
          const actualProgress = loadedProgress !== undefined ? loadedProgress : value;
          
          if (actualProgress === null || actualProgress === undefined) {
            // Show loading or "expand to view" for lazy loading
            return (
              <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                <Typography variant="caption" color="text.secondary">
                  {row.isExpanded ? <CircularProgress size={16} /> : "Expand to view"}
                </Typography>
              </Box>
            );
          }
          return <LinearWithLabel value={actualProgress} sx={{ minWidth: 75 }} />;
        },
      },
    ],
    [data.length, Object.keys(progressData).length] // Only re-render when counts change, not entire objects
  );

  const renderRowSubComponent = useCallback(
    ({ row }) => {
      const groupData = data[row.id];
      // Safety check to ensure valid group data
      if (!groupData || typeof groupData === 'object' && groupData.error) {
        return <div>Unable to load group details</div>;
      }
      
      // Merge progress data with group data for the details component
      const groupWithProgress = {
        ...groupData,
        progressData: progressData[groupData.id]
      };
      
      return <GroupDetails Group={groupWithProgress} onProgressLoad={handleProgressLoad} />;
    },
    [data, progressData, handleProgressLoad]
  );

  // Error Display Component
  const ErrorDisplay = () => (
    <Box sx={{ p: 4, textAlign: 'center' }}>
      <Alert 
        severity="error" 
        sx={{ mb: 3, display: 'inline-flex', alignItems: 'center' }}
        action={
          <Button
            color="inherit"
            size="small"
            onClick={debouncedFetchGroupsData}
            startIcon={loading ? <CircularProgress size={16} color="inherit" /> : <ReloadOutlined />}
            disabled={loading}
          >
            {loading ? 'Retrying...' : 'Retry'}
          </Button>
        }
      >
        {error}
      </Alert>
    </Box>
  );

  // Loading Display Component
  const LoadingDisplay = () => (
    <Box sx={{ p: 4, textAlign: 'center' }}>
      <CircularProgress size={40} />
      <Typography variant="body2" sx={{ mt: 2 }}>
        Loading groups...
      </Typography>
    </Box>
  );

  // State for welcome dialog
  const [showWelcomeDialog, setShowWelcomeDialog] = useState(false);

  // Check if we should show the welcome dialog
  React.useEffect(() => {
    const hasNoParticipants = !project_participants || project_participants.length === 0;
    if (hasNoParticipants && !loading && !error) {
      setShowWelcomeDialog(true);
    } else {
      setShowWelcomeDialog(false);
    }
  }, [project_participants, loading, error]);

  // Listen for custom event to show welcome dialog when participants drawer opens
  React.useEffect(() => {
    const handleShowWelcomeDialog = () => {
      const hasNoParticipants = !project_participants || project_participants.length === 0;
      if (hasNoParticipants && !loading && !error) {
        setShowWelcomeDialog(true);
      }
    };

    window.addEventListener('checkShowWelcomeDialog', handleShowWelcomeDialog);
    
    return () => {
      window.removeEventListener('checkShowWelcomeDialog', handleShowWelcomeDialog);
    };
  }, [project_participants, loading, error]);

  return (
    <GroupsErrorBoundary>
    <Fragment>
      <MainCard
        title={tableName}
        content={false}
        subheader={
          "This section enables the assignment of courses to groups and the management of participants."
        }
        secondary={
          <Stack direction="row" spacing={2} sx={{ display: { sm: "flex" } }}>
            <Button
              onClick={handleAdd}
              variant="contained"
              startIcon={<PlusOutlined />}
              size="small"
            >
              Add {tableName}
            </Button>
            <Button
              onClick={handleManageGroup}
              variant="outlined"
              startIcon={<SettingOutlined />}
              size="small"
            >
              Manage Group
            </Button>
            <CSVExport data={data} filename={"expanding-details-table.csv"} />
          </Stack>
        }
        sx={{ 
          flex: 1,
          display: 'flex',
          flexDirection: 'column',
          minHeight: 0,
          '& .MuiCardContent-root': {
            flex: 1,
            display: 'flex',
            flexDirection: 'column',
            minHeight: 0,
            overflow: 'hidden'
          }
        }}
      >
        <Box sx={{ 
          flex: 1, 
          display: 'flex',
          flexDirection: 'column',
          minHeight: 0,
          overflow: 'hidden'
        }}>
          {error ? (
            <ErrorDisplay />
          ) : loading ? (
            <LoadingDisplay />
          ) : data.length === 0 ? (
            // Empty state when no groups exist
            <Box sx={{ 
              flex: 1, 
              display: 'flex',
              flexDirection: 'column',
              alignItems: 'center',
              justifyContent: 'center',
              p: 4
            }}>
              <Box
                sx={{
                  width: 120,
                  height: 120,
                  borderRadius: '50%',
                  bgcolor: alpha(theme.palette.primary.main, 0.08),
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  mb: 3,
                }}
              >
                <TeamOutlined style={{ 
                  fontSize: 64, 
                  color: alpha(theme.palette.primary.main, 0.4)
                }} />
              </Box>
              
              <Typography 
                variant="h5" 
                fontWeight="600" 
                color="text.primary"
                gutterBottom
              >
                No Groups Yet
              </Typography>
              
              <Typography 
                variant="body1" 
                color="text.secondary"
                textAlign="center"
                sx={{ mb: 4, maxWidth: 400 }}
              >
                Groups help you organize participants and assign curriculums efficiently. 
                Create your first group to get started.
              </Typography>
              
              <Stack direction="row" spacing={2}>
                <Button
                  variant="contained"
                  startIcon={<PlusOutlined />}
                  onClick={handleAdd}
                  size="large"
                  sx={{
                    px: 4,
                    py: 1.5,
                    boxShadow: theme.shadows[8],
                    '&:hover': {
                      boxShadow: theme.shadows[12]
                    }
                  }}
                >
                  Create Your First Group
                </Button>
                
                {/* Only show Manage Participants button if there are participants */}
                {(!project_participants || project_participants.length === 0) && (
                  <Button
                    variant="outlined"
                    startIcon={<UserAddOutlined />}
                    onClick={() => {
                      window.dispatchEvent(new CustomEvent('openParticipantsDrawer', { 
                        detail: { action: 'addManually' } 
                      }));
                    }}
                    size="large"
                    sx={{ px: 3, py: 1.5 }}
                  >
                    Add Participants First
                  </Button>
                )}
              </Stack>
              
              <Box sx={{ mt: 6, p: 3, bgcolor: 'background.default', borderRadius: 2, maxWidth: 600 }}>
                <Typography variant="subtitle2" color="text.primary" gutterBottom>
                  <InfoCircleOutlined style={{ marginRight: 8 }} />
                  Quick Tips:
                </Typography>
                <Box component="ul" sx={{ m: 0, pl: 3, color: 'text.secondary' }}>
                  <li>
                    <Typography variant="body2">
                      Groups can have multiple participants assigned to them
                    </Typography>
                  </li>
                  <li>
                    <Typography variant="body2">
                      Each group can have its own curriculum and learning path
                    </Typography>
                  </li>
                  <li>
                    <Typography variant="body2">
                      Track progress for the entire group or individual participants
                    </Typography>
                  </li>
                </Box>
              </Box>
            </Box>
          ) : (
            <Box sx={{ 
              flex: 1, 
              overflow: 'auto',
              minHeight: 0
            }}>
              <ReactTable
                columns={columns}
                data={Array.isArray(data) ? data : []}
                renderRowSubComponent={renderRowSubComponent}
                handleRemoveGroup={handleRemoveGroup}
                handleManageCurriculums={handleManageCurriculums}
                handleEditGroup={handleEditGroup}
              />
            </Box>
          )}
        </Box>
      </MainCard>
      <Dialog
        maxWidth="sm"
        fullWidth
        TransitionComponent={PopupTransition}
        onClose={handleAdd}
        open={add}
        sx={{ "& .MuiDialog-paper": { p: 0, maxWidth: 600 } }}
      >
        <AddGroupOptimized
          customer={customer}
          onCancel={handleAdd}
          handleAddParticipant={handleAddGroup}
          groupsInState={groups}
          participants={project_participants || participants}
        />
      </Dialog>
      
      <Suspense fallback={<Box sx={{ p: 2, textAlign: 'center' }}><CircularProgress size={20} /></Box>}>
        <ManageGroupSlider
          open={manageGroup}
          onClose={handleManageGroup}
          groups={(() => {
            const filteredGroups = Array.isArray(groups) ? groups.filter(group => 
              group && typeof group === 'object' && !group.error && group.projectId === Project?.id
            ) : [];
            return filteredGroups;
          })()}
          participants={(() => {
            // Use project_participants from Redux state which includes role data
            const mapped = project_participants ? project_participants.map(p => {
              return {
                ...p.participant,
                projectParticipantId: p.id // Include the project_participants.id for API calls
              };
            }).filter(Boolean) : [];
            return mapped;
          })()}
          onUpdateGroup={handleUpdateGroup}
          error={error}
          onRetry={fetchGroupsData}
          loading={loading}
        />
      </Suspense>
      
      {/* Curriculum Management Dialog */}
      <Suspense fallback={<Box sx={{ p: 2, textAlign: 'center' }}><CircularProgress size={20} /></Box>}>
        <CurriculumManageDialog
          open={curriculumDialogOpen}
          onClose={handleCurriculumDialogClose}
          group={selectedGroup}
          onRefresh={handleRefreshAfterCurriculumChange}
        />
      </Suspense>

      {/* Edit Group Dialog */}
      <Suspense fallback={<Box sx={{ p: 2, textAlign: 'center' }}><CircularProgress size={20} /></Box>}>
        <EditGroupDialog
          open={editGroupDialog}
          onClose={handleEditGroupClose}
          group={groupToEdit}
          onUpdate={handleUpdateGroupDetails}
          existingGroupNames={(data || []).map(group => group.groupName).filter(name => name !== groupToEdit?.groupName)}
        />
      </Suspense>

      {/* Welcome Dialog for Empty State */}
      <Dialog
        open={showWelcomeDialog}
        maxWidth="md"
        fullWidth
        PaperProps={{
          sx: {
            borderRadius: 2,
            bgcolor: 'background.paper',
            backgroundImage: 'none',
          }
        }}
      >
        <Box sx={{ p: 5, textAlign: 'center' }}>
          <Box
            sx={{
              width: 80,
              height: 80,
              borderRadius: '50%',
              bgcolor: alpha(theme.palette.primary.main, 0.1),
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              margin: '0 auto 24px',
            }}
          >
            <TeamOutlined style={{ 
              fontSize: 48, 
              color: theme.palette.primary.main 
            }} />
          </Box>
          
          <Typography 
            variant="h4" 
            fontWeight="600" 
            gutterBottom
            color="text.primary"
          >
            Welcome! Let's Get Started
          </Typography>
          
          <Typography 
            variant="body1" 
            color="text.secondary"
            sx={{ 
              mb: 5,
              maxWidth: 600,
              mx: 'auto'
            }}
          >
            You need to add participants before creating groups. Choose how you'd like to add your team members:
          </Typography>
          
          <Grid container spacing={3} justifyContent="center" sx={{ maxWidth: 700, mx: 'auto' }}>
            <Grid item xs={12} sm={6}>
              <Box
                sx={{ 
                  p: 4,
                  borderRadius: 2,
                  cursor: 'pointer',
                  transition: 'all 0.3s',
                  bgcolor: 'background.default',
                  border: '2px solid',
                  borderColor: 'divider',
                  '&:hover': {
                    borderColor: 'primary.main',
                    bgcolor: alpha(theme.palette.primary.main, 0.04),
                    transform: 'translateY(-4px)',
                    boxShadow: theme.shadows[4]
                  }
                }}
                onClick={() => {
                  setShowWelcomeDialog(false);
                  // Open the participants drawer and then trigger add participant
                  const manageParticipantsButton = document.querySelector('[aria-label="manage-participants"]');
                  if (manageParticipantsButton) {
                    manageParticipantsButton.click();
                    setTimeout(() => {
                      const addButton = document.querySelector('[aria-label="add-participant"]');
                      if (addButton) addButton.click();
                    }, 500);
                  } else {
                    // Fallback: dispatch event to open drawer
                    window.dispatchEvent(new CustomEvent('openParticipantsDrawer', { 
                      detail: { action: 'addManually' } 
                    }));
                  }
                }}
              >
                <Box
                  sx={{
                    width: 56,
                    height: 56,
                    borderRadius: '12px',
                    bgcolor: alpha(theme.palette.primary.main, 0.1),
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    margin: '0 auto 16px',
                  }}
                >
                  <UserAddOutlined style={{ 
                    fontSize: 32, 
                    color: theme.palette.primary.main 
                  }} />
                </Box>
                <Typography 
                  variant="h6" 
                  fontWeight="600" 
                  gutterBottom
                  color="text.primary"
                >
                  Add Manually
                </Typography>
                <Typography 
                  variant="body2" 
                  color="text.secondary"
                >
                  Add participants one by one
                </Typography>
              </Box>
            </Grid>
            
            <Grid item xs={12} sm={6}>
              <Box
                sx={{ 
                  p: 4,
                  borderRadius: 2,
                  cursor: 'pointer',
                  transition: 'all 0.3s',
                  bgcolor: 'background.default',
                  border: '2px solid',
                  borderColor: 'divider',
                  '&:hover': {
                    borderColor: 'success.main',
                    bgcolor: alpha(theme.palette.success.main, 0.04),
                    transform: 'translateY(-4px)',
                    boxShadow: theme.shadows[4]
                  }
                }}
                onClick={() => {
                  setShowWelcomeDialog(false);
                  // Open the participants drawer and then trigger CSV import
                  const manageParticipantsButton = document.querySelector('[aria-label="manage-participants"]');
                  if (manageParticipantsButton) {
                    manageParticipantsButton.click();
                    setTimeout(() => {
                      const importButton = document.querySelector('[aria-label="import-csv"]');
                      if (importButton) importButton.click();
                    }, 500);
                  } else {
                    // Fallback: dispatch event to open drawer
                    window.dispatchEvent(new CustomEvent('openParticipantsDrawer', { 
                      detail: { action: 'importCSV' } 
                    }));
                  }
                }}
              >
                <Box
                  sx={{
                    width: 56,
                    height: 56,
                    borderRadius: '12px',
                    bgcolor: alpha(theme.palette.success.main, 0.1),
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    margin: '0 auto 16px',
                  }}
                >
                  <UploadOutlined style={{ 
                    fontSize: 32, 
                    color: theme.palette.success.main 
                  }} />
                </Box>
                <Typography 
                  variant="h6" 
                  fontWeight="600" 
                  gutterBottom
                  color="text.primary"
                >
                  Import CSV
                </Typography>
                <Typography 
                  variant="body2" 
                  color="text.secondary"
                >
                  Bulk import from file
                </Typography>
              </Box>
            </Grid>
          </Grid>
          
          <Typography 
            variant="caption" 
            color="text.secondary"
            sx={{ 
              display: 'block', 
              mt: 4,
              mb: 3
            }}
          >
            Tip: After adding participants, you can organize them into groups
          </Typography>
          
          <Button
            variant="text"
            color="secondary"
            onClick={() => setShowWelcomeDialog(false)}
            sx={{ 
              mt: 2,
              textTransform: 'none',
              fontWeight: 500
            }}
          >
            Skip for now
          </Button>
        </Box>
      </Dialog>
    </Fragment>
    <PerformanceMonitor />
    </GroupsErrorBoundary>
  );
};

GroupTable.propTypes = {
  groups: PropTypes.array,
};

// ==============================|| REACT TABLE - EXPANDING DETAILS ||============================== //




const ProgressCell = ({ value }) => (
  <LinearWithLabel value={value} sx={{ minWidth: 75 }} />
);

ProgressCell.propTypes = {
  value: PropTypes.number,
};

export default React.memo(GroupTable);
