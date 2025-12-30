import React, { useMemo, useCallback, useState, useEffect, Fragment, Suspense } from "react";
import PropTypes from "prop-types";
import { useRouter } from 'next/router';

// Material UI
import {
  Box,
  Button,
  CircularProgress,
  Typography,
  Stack,
  Dialog,
  Alert,
  Paper,
  Grid,
} from "@mui/material";
import { useTheme, alpha } from "@mui/material/styles";

// Third party
import { useSelector } from 'store';

// Project imports
import MainCard from "components/MainCard";
import { CSVExport } from "components/third-party/ReactTable";
import { PopupTransition } from "components/@extended/Transitions";
import GroupsErrorBoundary from "components/GroupsErrorBoundary";
import PerformanceMonitor from "components/PerformanceMonitor";
import DeleteCard from "components/cards/DeleteCard";

// Modernized hooks using CQRS architecture
import { useNormalizedGroups } from './hooks/useNormalizedGroups';
import { useGroupsCRUDRTK } from './hooks/useGroupsCRUDRTK';

// Components (reusing existing ones)
import GroupDetails from "./GroupDetails";
const AddGroup = React.lazy(() => import('./AddGroup'));
const ManageGroupSlider = React.lazy(() => import("./ManageGroupSlider"));
const CurriculumManageDialog = React.lazy(() => import("./CurriculumManageDialog"));
const EditGroupDialog = React.lazy(() => import("./components/EditGroupDialog"));

// Icons
import {
  PlusOutlined,
  SettingOutlined,
  TeamOutlined,
  UserAddOutlined,
  UploadOutlined,
  InfoCircleOutlined,
  ReloadOutlined,
} from "@ant-design/icons";

// Domain events integration
import eventBus from 'store/events/EventBus';

// React Table
import { useExpanded, useTable } from "react-table";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableRow,
  Chip,
  Menu,
  MenuItem,
  IconButton
} from "@mui/material";
import {
  DownOutlined,
  RightOutlined,
  MoreOutlined,
  EditOutlined,
  BookOutlined,
  MailOutlined,
  DeleteOutlined,
  CheckCircleOutlined,
  WarningOutlined
} from "@ant-design/icons";
import LinearWithLabel from "components/@extended/progress/LinearWithLabel";

// Feature flag to enable normalized entities
// Set to true to use the normalized entity store for better performance
const USE_NORMALIZED_ENTITIES = true;

// ==============================|| TABLE COMPONENTS ||============================== //

const ColumnCell = ({ row, handleCRUD, handleManageCurriculums, handleEditGroup }) => {
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
      <Stack direction="row" alignItems="center" justifyContent="center" spacing={0}>
        <IconButton
          id={`group-action-button-${row.id}`}
          aria-controls={open ? `group-action-menu-${row.id}` : undefined}
          aria-haspopup="true"
          aria-expanded={open ? "true" : undefined}
          onClick={handleClickSort}
          size="small"
          color="secondary"
        >
          <MoreOutlined />
        </IconButton>
        <Menu
          id={`group-action-menu-${row.id}`}
          anchorEl={anchorEl}
          keepMounted
          open={open}
          onClose={handleCloseSort}
          anchorOrigin={{ vertical: "bottom", horizontal: "right" }}
          transformOrigin={{ vertical: "top", horizontal: "right" }}
          MenuListProps={{ "aria-labelledby": `group-action-button-${row.id}` }}
          sx={{ p: 0, "& .MuiMenu-list": { p: 0 } }}
        >
          <MenuItem onClick={() => { handleEditGroup?.(row.original); handleCloseSort(); }}>
            <EditOutlined style={{ paddingRight: 8 }} />
            <Typography>Edit Group</Typography>
          </MenuItem>
          <MenuItem onClick={() => { handleManageCurriculums?.(row.original); handleCloseSort(); }}>
            <BookOutlined style={{ paddingRight: 8 }} />
            <Typography>Manage Curriculums</Typography>
          </MenuItem>
          <MenuItem onClick={handleCloseSort}>
            <MailOutlined style={{ paddingRight: 8 }} />
            <Typography>Email Credentials</Typography>
          </MenuItem>
          <MenuItem onClick={() => { handleCRUD?.handleRemoveGroup(row.original.id); handleCloseSort(); }}>
            <DeleteOutlined style={{ paddingRight: 8, paddingLeft: 0 }} />
            <Typography>Delete</Typography>
          </MenuItem>
        </Menu>
      </Stack>
    </>
  );
};

const CellExpander = React.memo(({ row }) => {
  const collapseIcon = row.isExpanded ? <DownOutlined /> : <RightOutlined />;
  return (
    <Box
      sx={{
        fontSize: "0.75rem",
        color: "text.secondary",
        textAlign: "center",
        cursor: "pointer",
        p: 1,
        '&:hover': { color: 'primary.main' }
      }}
      {...row.getToggleRowExpandedProps()}
      onClick={(e) => {
        e.preventDefault();
        e.stopPropagation();
        row.toggleRowExpanded();
      }}
    >
      {collapseIcon}
    </Box>
  );
});

const GroupCell = React.memo(({ value, groups }) => {
  if (typeof value !== 'string' && typeof value !== 'number') {
    return <Chip color="error" label="Invalid" size="small" />;
  }

  if (!Array.isArray(groups)) {
    return <Chip color="error" label="No Groups" size="small" />;
  }

  const matchingGroup = groups.find((group) =>
    group && typeof group === 'object' && !group.error && group.groupName === value
  );

  if (matchingGroup) {
    const chipColor = matchingGroup.chipColor;
    return (
      <Chip
        style={{ backgroundColor: chipColor, color: "#fff" }}
        label={`${value}`}
        size="small"
      />
    );
  } else {
    return <Chip color="default" label="Unknown" size="small" />;
  }
});

function ReactTable({ groups, handleCRUD, handleManageCurriculums, handleEditGroup, projectId }) {
  const columns = useMemo(() => [
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
      Cell: (props) => <GroupCell {...props} groups={groups} />,
    },
    {
      Header: "Size",
      accessor: "participants",
      Cell: ({ value }) => {
        const count = value && Array.isArray(value) ? value.length : 0;
        return count === 0 ? <span>⚠️</span> : <span>{count}</span>;
      },
    },
    {
      Header: "Curriculum",
      accessor: "group_curriculums",
      Cell: ({ value }) => {
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
      Header: "Progress",
      accessor: "progress",
      Cell: ({ value }) => {
        if (value === null || value === undefined) {
          return (
            <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
              <Typography variant="caption" color="text.secondary">
                Expand to view
              </Typography>
            </Box>
          );
        }
        return <LinearWithLabel value={value} sx={{ minWidth: 75 }} />;
      },
    },
  ], [groups]);

  const {
    getTableProps,
    getTableBodyProps,
    headerGroups,
    rows,
    prepareRow,
    visibleColumns,
    state: { expanded },
  } = useTable(
    {
      columns,
      data: groups || [],
      getSubRows: () => undefined,
      autoResetExpanded: false, // Preserve expanded state on data changes
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
              handleCRUD={handleCRUD}
              handleManageCurriculums={handleManageCurriculums}
              handleEditGroup={handleEditGroup}
            />
          ),
        },
      ]);
    }
  );

  const renderRowSubComponent = useCallback(({ row }) => {
    const groupData = groups[row.id];
    if (!groupData || typeof groupData === 'object' && groupData.error) {
      return <div>Unable to load group details</div>;
    }
    return <GroupDetails Group={groupData} projectId={projectId} />;
  }, [groups, projectId]);

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
                  <TableCell key={index} {...columnProps}>
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
                    <TableCell key={index} {...cellProps}>
                      {cell.render("Cell")}
                    </TableCell>
                  );
                })}
              </TableRow>
              {row.isExpanded && renderRowSubComponent({ row, rowProps, visibleColumns })}
            </Fragment>
          );
        })}
      </TableBody>
    </Table>
  );
}

/**
 * Groups Component using CQRS Architecture
 *
 * Key Improvements:
 * - RTK Query for automatic caching and background refetching
 * - Semantic commands for consistent business logic
 * - Domain events for loose coupling and real-time updates
 * - Normalized entity selectors for computed views
 * - Enhanced error handling and user feedback
 * - Performance optimizations with memoization
 */
const Groups = React.memo(({ index }) => {
  const theme = useTheme();
  const router = useRouter();

  // Extract project ID from agenda store
  const projectIdFromAgenda = useSelector(state => state.projectAgenda?.projectId);

  // Fallback: get project ID from URL if not in agenda store
  const projectIdFromUrl = router?.query?.id;

  // Use whichever is available (prefer agenda store) and ensure it's a number
  const projectId = projectIdFromAgenda || (projectIdFromUrl ? parseInt(projectIdFromUrl) : null);

  // Normalized data management with caching - CQRS pattern
  const {
    groups,
    participants, // Directly from normalized entity store (no fallback!)
    loading,
    refreshing,
    error,
    isEmpty,
    forceRefresh
  } = useNormalizedGroups(projectId);

  // CRUD operations with RTK Query mutations
  const crudConfig = useMemo(() => ({
    data: groups,
    participants,
    projectId,
    onRefresh: forceRefresh
  }), [groups, participants, projectId, forceRefresh]);

  const crudOperations = useGroupsCRUDRTK(crudConfig);

  // UI State management
  const [add, setAdd] = useState(false);
  const [manageGroup, setManageGroup] = useState(false);
  const [curriculumDialogOpen, setCurriculumDialogOpen] = useState(false);
  const [selectedGroup, setSelectedGroup] = useState(null);
  const [editGroupDialog, setEditGroupDialog] = useState(false);
  const [groupToEdit, setGroupToEdit] = useState(null);
  const [showWelcomeDialog, setShowWelcomeDialog] = useState(false);

  // DELETE CONFIRMATION STATE
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const [groupToDelete, setGroupToDelete] = useState(null);

  // Domain events subscription for real-time updates
  useEffect(() => {
    if (!projectId) return;

    // Subscribe to group-related events
    const handleGroupAdded = (event) => {
      console.log('[Groups] Group added:', event);
      // RTK Query will automatically refetch due to cache invalidation
    };

    const handleGroupUpdated = (event) => {
      console.log('[Groups] Group updated:', event);
    };

    const handleGroupRemoved = (event) => {
      console.log('[Groups] Group removed:', event);
    };

    const handleRefreshNeeded = (event) => {
      console.log('[Groups] Refresh requested:', event);
      // Trigger refresh when child components request it
      forceRefresh?.();
    };

    // Subscribe to events
    const unsubscribe1 = eventBus.subscribe('group.add.completed', handleGroupAdded);
    const unsubscribe2 = eventBus.subscribe('group.update.completed', handleGroupUpdated);
    const unsubscribe3 = eventBus.subscribe('group.remove.completed', handleGroupRemoved);
    const unsubscribe4 = eventBus.subscribe('groups:refresh-needed', handleRefreshNeeded);

    // Cleanup subscriptions
    return () => {
      unsubscribe1();
      unsubscribe2();
      unsubscribe3();
      unsubscribe4();
    };
  }, [projectId, forceRefresh]);

  // Check if we should show the welcome dialog
  // Use participants from normalized store instead of old Redux store
  useEffect(() => {
    const hasNoParticipants = !participants || participants.length === 0;
    if (hasNoParticipants && !loading && !error && projectId) {
      setShowWelcomeDialog(true);
    } else {
      setShowWelcomeDialog(false);
    }
  }, [participants, loading, error, projectId]);

  // Handlers
  const handleAdd = useCallback(() => {
    setAdd(!add);
  }, [add]);

  const handleManageGroup = useCallback(() => {
    setManageGroup(!manageGroup);
  }, [manageGroup]);

  const handleManageCurriculums = useCallback((group) => {
    setSelectedGroup(group);
    setCurriculumDialogOpen(true);
  }, []);

  const handleCurriculumDialogClose = useCallback(() => {
    setCurriculumDialogOpen(false);
    setSelectedGroup(null);
  }, []);

  const handleEditGroup = useCallback((group) => {
    setGroupToEdit(group);
    setEditGroupDialog(true);
  }, []);

  const handleEditGroupClose = useCallback(() => {
    setEditGroupDialog(false);
    setGroupToEdit(null);
  }, []);

  // Show delete confirmation dialog
  const handleDeleteClick = useCallback((groupId) => {
    const group = groups.find((g) => g.id === groupId);
    if (group) {
      setGroupToDelete(group);
      setDeleteDialogOpen(true);
    }
  }, [groups]);

  // Confirm and execute deletion
  const handleConfirmDelete = useCallback(async () => {
    if (groupToDelete) {
      await crudOperations.handleRemoveGroup(groupToDelete.id);
      setDeleteDialogOpen(false);
      setGroupToDelete(null);
    }
  }, [groupToDelete, crudOperations]);

  // Cancel deletion
  const handleCancelDelete = useCallback(() => {
    setDeleteDialogOpen(false);
    setGroupToDelete(null);
  }, []);

  // Enhanced CRUD handlers with domain events
  const handleCRUD = useMemo(() => ({
    handleAddGroup: async (newGroup) => {
      await crudOperations.handleAddGroup(newGroup);
      setAdd(false);
    },
    handleUpdateGroup: crudOperations.handleUpdateGroup,
    handleRemoveGroup: handleDeleteClick, // Show confirmation instead of direct delete
    handleAddParticipantToGroup: crudOperations.handleAddParticipantToGroup,
    handleRemoveParticipantFromGroup: crudOperations.handleRemoveParticipantFromGroup,
    handleClearProgressCache: crudOperations.handleClearProgressCache,
  }), [crudOperations, handleDeleteClick]);

  // Error Display Component
  const ErrorDisplay = useCallback(() => (
    <Box sx={{ p: 4, textAlign: 'center' }}>
      <Alert
        severity="error"
        sx={{ mb: 3, display: 'inline-flex', alignItems: 'center' }}
        action={
          <Button
            color="inherit"
            size="small"
            onClick={forceRefresh}
            startIcon={loading ? <CircularProgress size={16} color="inherit" /> : <ReloadOutlined />}
            disabled={loading}
          >
            {loading ? 'Retrying...' : 'Retry'}
          </Button>
        }
      >
        {error?.message || 'Failed to load groups'}
      </Alert>
    </Box>
  ), [error, loading, forceRefresh]);

  // Loading Display Component
  const LoadingDisplay = useCallback(() => (
    <Box sx={{ p: 4, textAlign: 'center' }}>
      <CircularProgress size={40} />
      <Typography variant="body2" sx={{ mt: 2 }}>
        Loading groups...
      </Typography>
    </Box>
  ), []);

  // Empty State Component
  const EmptyState = useCallback(() => (
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

        {(!participants || participants.length === 0) && (
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
  ), [theme, handleAdd, participants]);

  // Show loading state
  if (loading && !refreshing) {
    return <LoadingDisplay />;
  }

  // Show error state
  if (error && !loading) {
    return (
      <MainCard>
        <ErrorDisplay />
      </MainCard>
    );
  }

  return (
    <GroupsErrorBoundary>
      <Fragment>
        <MainCard
          title="Groups"
          content={false}
          subheader="Manage groups and assign participants."
          secondary={
            <Stack direction="row" spacing={2} sx={{ display: { sm: "flex" } }}>
              <Button
                onClick={handleAdd}
                variant="contained"
                startIcon={<PlusOutlined />}
                size="small"
              >
                Add Groups
              </Button>
              <Button
                onClick={handleManageGroup}
                variant="outlined"
                startIcon={<SettingOutlined />}
                size="small"
              >
                Manage Group
              </Button>
              <CSVExport data={groups} filename="groups-export.csv" />
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
            {isEmpty ? (
              <EmptyState />
            ) : (
              <Box sx={{
                flex: 1,
                overflow: 'auto',
                minHeight: 0,
                position: 'relative'
              }}>
                {/* Show subtle loading indicator when refreshing existing data */}
                {refreshing && groups.length > 0 && (
                  <Box
                    sx={{
                      position: 'absolute',
                      top: 0,
                      left: 0,
                      right: 0,
                      height: 3,
                      bgcolor: 'transparent',
                      zIndex: 10,
                    }}
                  >
                    <Box
                      sx={{
                        height: '100%',
                        bgcolor: 'primary.main',
                        borderRadius: 1,
                        animation: 'refreshIndicator 1.5s ease-in-out infinite',
                        '@keyframes refreshIndicator': {
                          '0%': { width: '0%', opacity: 0.6 },
                          '50%': { width: '100%', opacity: 1 },
                          '100%': { width: '0%', opacity: 0.6, marginLeft: '100%' },
                        },
                      }}
                    />
                  </Box>
                )}

                <ReactTable
                  groups={groups}
                  handleCRUD={handleCRUD}
                  handleManageCurriculums={handleManageCurriculums}
                  handleEditGroup={handleEditGroup}
                  projectId={projectId}
                />
              </Box>
            )}
          </Box>
        </MainCard>

        {/* Add Group Dialog */}
        <Dialog
          maxWidth="sm"
          fullWidth
          TransitionComponent={PopupTransition}
          onClose={handleAdd}
          open={add}
          sx={{ "& .MuiDialog-paper": { p: 0, maxWidth: 600 } }}
        >
          <Suspense fallback={<Box sx={{ p: 2, textAlign: 'center' }}><CircularProgress size={20} /></Box>}>
            <AddGroup
              onCancel={handleAdd}
              handleAddParticipant={handleCRUD.handleAddGroup}
              groupsInState={groups}
              participants={participants}
            />
          </Suspense>
        </Dialog>

        {/* Manage Group Slider */}
        <Suspense fallback={<Box sx={{ p: 2, textAlign: 'center' }}><CircularProgress size={20} /></Box>}>
          <ManageGroupSlider
            open={manageGroup}
            onClose={handleManageGroup}
            groups={groups.filter(group =>
              group && typeof group === 'object' && !group.error && group.projectId === projectId
            )}
            participants={participants.map(p => {
              // Normalized structure: { id, participant: {...}, role, training_recipient, group }
              // ManageGroupSlider expects flat participant with projectParticipantId
              if (!p.participant) return null;

              return {
                id: p.participant.id, // participants table id
                firstName: p.participant.firstName,
                lastName: p.participant.lastName,
                email: p.participant.email,
                role: p.participant.role || p.role,
                projectParticipantId: p.id, // project_participants.id (needed for adding to group)
                ...p.participant // spread rest of participant data
              };
            }).filter(Boolean)} // Filter out null entries
            onUpdateGroup={handleCRUD.handleAddParticipantToGroup}
            error={error}
            onRetry={forceRefresh}
            loading={loading}
          />
        </Suspense>

        {/* Curriculum Management Dialog */}
        <Suspense fallback={<Box sx={{ p: 2, textAlign: 'center' }}><CircularProgress size={20} /></Box>}>
          <CurriculumManageDialog
            open={curriculumDialogOpen}
            onClose={handleCurriculumDialogClose}
            group={selectedGroup}
            projectId={projectId}
            onRefresh={forceRefresh}
          />
        </Suspense>

        {/* Edit Group Dialog */}
        <Suspense fallback={<Box sx={{ p: 2, textAlign: 'center' }}><CircularProgress size={20} /></Box>}>
          <EditGroupDialog
            open={editGroupDialog}
            onClose={handleEditGroupClose}
            group={groupToEdit}
            onUpdate={handleCRUD.handleUpdateGroup}
            existingGroupNames={groups.map(group => group.groupName).filter(name => name !== groupToEdit?.groupName)}
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
                <Paper
                  sx={{
                    p: 4,
                    borderRadius: 2,
                    cursor: 'pointer',
                    transition: 'all 0.3s',
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
                    window.dispatchEvent(new CustomEvent('openParticipantsDrawer', {
                      detail: { action: 'addManually' }
                    }));
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
                </Paper>
              </Grid>

              <Grid item xs={12} sm={6}>
                <Paper
                  sx={{
                    p: 4,
                    borderRadius: 2,
                    cursor: 'pointer',
                    transition: 'all 0.3s',
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
                    window.dispatchEvent(new CustomEvent('openParticipantsDrawer', {
                      detail: { action: 'importCSV' }
                    }));
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
                </Paper>
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

        {/* Delete Confirmation Dialog */}
        <DeleteCard
          open={deleteDialogOpen}
          onClose={handleCancelDelete}
          onDelete={handleConfirmDelete}
          title="Delete Group"
          itemName={groupToDelete?.groupName}
          message={`Are you sure you want to delete the group "${groupToDelete?.groupName}"? This will remove all participants from this group.`}
        />
      </Fragment>

      <PerformanceMonitor />
    </GroupsErrorBoundary>
  );
});

Groups.propTypes = {
  index: PropTypes.number,
};

Groups.displayName = 'Groups';

export default React.memo(Groups);
