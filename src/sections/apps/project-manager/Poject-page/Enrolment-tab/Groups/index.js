import PropTypes from "prop-types";
import { useCallback, useMemo, Fragment, useState, useEffect } from "react";

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
} from "@mui/material";

// third-party
import { useExpanded, useTable } from "react-table";

// project import
import MainCard from "components/MainCard";
import ScrollX from "components/ScrollX";
import GroupDetails from "./GroupDetails";
import { CSVExport } from "components/third-party/ReactTable";
import LinearWithLabel from "components/@extended/progress/LinearWithLabel";
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
} from "@ant-design/icons";
import AddButton from "components/StyledButtons";
import AddGroupOptimized from "./AddGroupOptimized";
import ManageGroupSlider from "./ManageGroupSlider";
import CurriculumManageDialog from "./CurriculumManageDialog";
import EditGroupDialog from "./components/EditGroupDialog";

import { useDispatch } from "store";
import {
  addGroup,
  updateGroup,
  removeGroup,
  getGroupsDetails,
  getSingleProject,
} from "store/reducers/projects";
import { openSnackbar } from "store/reducers/snackbar";
import { useSelector } from "store";
import axios from "utils/axios";

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

const CellExpander = ({ row }) => {
  const collapseIcon = row.isExpanded ? <DownOutlined /> : <RightOutlined />;
  return (
    <Box
      sx={{ fontSize: "0.75rem", color: "text.secondary", textAlign: "center" }}
      {...row.getToggleRowExpandedProps()}
    >
      {collapseIcon}
    </Box>
  );
};

CellExpander.propTypes = {
  row: PropTypes.object,
};

const GroupCell = ({ value, groups }) => {
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
};

GroupCell.propTypes = {
  value: PropTypes.string,
  chipColor: PropTypes.string,
};

const GroupTable = ({ index }) => {
  const { singleProject: Project, project_participants, groups, loading } = useSelector((state) => state.projects);
  const dispatch = useDispatch();
  const { participants } = Project;

  const [data, setData] = useState([]);
  const [error, setError] = useState(null);

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
    
    // Ensure groups are fetched before opening the slider
    if (Project?.id && (!groups || groups.length === 0)) {
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
      
      // Refresh data from server to ensure consistency
      if (Project?.id) {
        console.log('Refreshing data after group deletion...');
        await dispatch(getGroupsDetails(Project.id));
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
        // Refresh the groups details first to update participant counts
        await dispatch(getGroupsDetails(Project.id));
        // Then refresh the project data to update all components
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
          console.log('Size cell - value:', value, 'row:', row.original);
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
        Cell: ProgressCell,
      },
    ],
    [data]
  );

  const renderRowSubComponent = useCallback(
    ({ row }) => {
      const groupData = data[row.id];
      // Safety check to ensure valid group data
      if (!groupData || typeof groupData === 'object' && groupData.error) {
        return <div>Unable to load group details</div>;
      }
      return <GroupDetails Group={groupData} />;
    },
    [data]
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
            onClick={fetchGroupsData}
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

  return (
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
      >
        {error ? (
          <ErrorDisplay />
        ) : loading ? (
          <LoadingDisplay />
        ) : (
          <ScrollX>
            <ReactTable
              columns={columns}
              data={Array.isArray(data) ? data : []}
              renderRowSubComponent={renderRowSubComponent}
              handleRemoveGroup={handleRemoveGroup}
              handleManageCurriculums={handleManageCurriculums}
              handleEditGroup={handleEditGroup}
            />
          </ScrollX>
        )}
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
      
      {/* Curriculum Management Dialog */}
      <CurriculumManageDialog
        open={curriculumDialogOpen}
        onClose={handleCurriculumDialogClose}
        group={selectedGroup}
        onRefresh={handleRefreshAfterCurriculumChange}
      />

      {/* Edit Group Dialog */}
      <EditGroupDialog
        open={editGroupDialog}
        onClose={handleEditGroupClose}
        group={groupToEdit}
        onUpdate={handleUpdateGroupDetails}
        existingGroupNames={(data || []).map(group => group.groupName).filter(name => name !== groupToEdit?.groupName)}
      />
    </Fragment>
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

export default GroupTable;
