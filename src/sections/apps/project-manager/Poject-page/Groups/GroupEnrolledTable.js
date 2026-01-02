import PropTypes from "prop-types";
import { useMemo, useCallback, useState } from "react";
import { useSelector, useDispatch } from 'store';
import { groupCommands } from 'store/commands/groupCommands';
import eventBus from 'store/events/EventBus';
import { selectAllGroups } from 'store/entities/groupsSlice';

// material-ui
import {
  Box,
  Chip,
  Stack,
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableRow,
  FormControl,
  Select,
  MenuItem,
  IconButton,
  Tooltip,
  Divider,
} from "@mui/material";

// third-party
import { useTable, useFilters, usePagination } from "react-table";

// project import
import Layout from "layout";

import LinearWithLabel from "components/@extended/progress/LinearWithLabel";
import { TablePagination } from "components/third-party/ReactTable";

// assets
// Removed unused TeamOutlined import

// ==============================|| REACT TABLE ||============================== //

function ReactTable({ columns, data, top }) {
  const {
    getTableProps,
    getTableBodyProps,
    headerGroups,
    rows,
    page,
    prepareRow,
    gotoPage,
    setPageSize,
    state: { pageIndex, pageSize },
  } = useTable(
    {
      columns,
      data,
      initialState: { pageIndex: 0, pageSize: 5 },
    },
    useFilters,
    usePagination
  );

  return (
    <Stack>
      {top && (
        <Box sx={{ p: 2 }}>
          <TablePagination
            gotoPage={gotoPage}
            rows={rows}
            setPageSize={setPageSize}
            pageIndex={pageIndex}
            pageSize={pageSize}
          />
        </Box>
      )}

      <Table {...getTableProps()}>
        <TableHead sx={{ borderTopWidth: top ? 2 : 1 }}>
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
          {page.map((row, i) => {
            prepareRow(row);
            const { key: rowKey, ...rowProps } = row.getRowProps();
            return (
              <TableRow key={i} {...rowProps}>
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
            );
          })}

          {!top && (
            <TableRow>
              <TableCell sx={{ p: 2 }} colSpan={4}>
                <TablePagination
                  gotoPage={gotoPage}
                  rows={rows}
                  setPageSize={setPageSize}
                  pageIndex={pageIndex}
                  pageSize={pageSize}
                />
              </TableCell>
            </TableRow>
          )}
        </TableBody>
      </Table>
    </Stack>
  );
}

ReactTable.propTypes = {
  columns: PropTypes.array,
  data: PropTypes.array,
  top: PropTypes.bool,
};

// ==============================|| REACT TABLE - PAGINATION ||============================== //

const StatusCell = ({ value }) => {
  switch (value) {
    case "Complicated":
      return (
        <Chip color="error" label="Complicated" size="small" variant="light" />
      );
    case "Relationship":
      return (
        <Chip
          color="success"
          label="Relationship"
          size="small"
          variant="light"
        />
      );
    case "Single":
    default:
      return <Chip color="info" label={value} size="small" variant="light" />;
  }
};

StatusCell.propTypes = {
  value: PropTypes.string,
};
const ProgressCell = ({ value }) => (
  <LinearWithLabel value={value} sx={{ minWidth: 75 }} />
);

ProgressCell.propTypes = {
  value: PropTypes.number,
};

const GroupEnrolledTable = ({ Enrolled, onRefresh, currentGroup, progressData, projectId }) => {
  const dispatch = useDispatch();

  // Get groups from normalized entity store (CQRS pattern)
  const groups = useSelector(selectAllGroups);

  const [movingParticipants, setMovingParticipants] = useState(new Set());
  
  const attendanceStatusesArray = [
    "Present",
    "Absent",
    "Tardy (Late)",
    "Excused Absence",
    "Unexcused Absence",
    "Remote Attendance",
    "On Time",
    "Participated",
    "Did Not Participate",
    "Withdrew",
    "Attended Online",
    "Attended In-Person",
    "Attended Virtually",
    "Attended Via Video Conference",
    "Attended Via Webinar",
    "Attended Via Virtual Classroom",
    "Attended Via Live Stream",
    "Attended Via Recorded Session",
    "No Training Needed",
    // Add other less common attendance statuses here
  ];

  // Safety check to prevent errors when Enrolled is undefined or null
  const enrolledData = Enrolled || [];

  // Helper function to find which group a participant is in
  const getParticipantGroup = useCallback((participantId) => {
    return groups?.find(g =>
      g.participants?.some(p =>
        p.participantId === participantId ||
        p.participant?.id === participantId
      )
    );
  }, [groups]);

  // Check if participant is being moved
  const isMoving = useCallback((participantId) => {
    return movingParticipants.has(participantId);
  }, [movingParticipants]);

  // Check if ANY action is in progress (to disable all controls)
  const isAnyActionInProgress = movingParticipants.size > 0;

  // Handle group assignment using CQRS commands
  const handleAssignToGroup = useCallback(async (participantId, newGroupId) => {
    if (!participantId) return;

    // Prevent double actions - check if any action is already in progress
    if (movingParticipants.size > 0) {
      console.log('[GroupEnrolledTable] Action blocked - another action is in progress');
      return;
    }

    // Find current group
    const currentParticipantGroup = getParticipantGroup(participantId);
    const fromGroupId = currentParticipantGroup?.id || null;

    // Empty string means remove from group
    const toGroupId = newGroupId === '' ? null : (newGroupId || null);

    // Don't do anything if trying to move to same group
    if (fromGroupId === toGroupId) return;

    // Mark participant as moving
    setMovingParticipants(prev => new Set(prev).add(participantId));

    try {
      // Use CQRS command to move participant
      await dispatch(groupCommands.moveParticipantBetweenGroups({
        participantId,
        fromGroupId,
        toGroupId,
        projectId
      })).unwrap();

      // Publish event to trigger refresh
      eventBus.publish('groups:refresh-needed', {
        projectId,
        source: 'GroupEnrolledTable',
        action: toGroupId ? 'move' : 'remove'
      });

    } catch (error) {
      console.error('[GroupEnrolledTable] Failed to move participant:', error);
    } finally {
      // Remove from moving set
      setMovingParticipants(prev => {
        const newSet = new Set(prev);
        newSet.delete(participantId);
        return newSet;
      });
    }
  }, [dispatch, getParticipantGroup, projectId, groups, movingParticipants]);

  const participantsWithAttendance = enrolledData.filter(person => 
    person && person.participant && person.participant.participant
  ).map((person, i) => {
    return { ...person, attendanceStatus: attendanceStatusesArray[i] };
  });

  const columns = useMemo(
    () => [
      {
        Header: "Full Name",
        accessor: "participant.participant",
        Cell: ({ cell: { value } }) => {
          if (!value || !value.firstName || !value.lastName) {
            return <span>-</span>;
          }
          return <span>{`${value.firstName} ${value.lastName}`}</span>;
        },
      },
      {
        Header: "Role",
        accessor: "participant.participant.role",
        Cell: ({ cell: { value } }) => {
          if (typeof value === 'object' && value !== null) {
            return value.title || value.name || 'Unknown Role';
          }
          return value || 'N/A';
        },
      },
      {
        Header: "Individual Progress",
        accessor: "participant.participant.progress",
        Cell: ({ value, row }) => {
          // Try to get progress from progressData if available
          const participantId = row.original?.participant?.id;
          const loadedProgress = progressData?.participantProgress?.find(
            p => p.participantId === participantId
          )?.progress;
          
          const actualProgress = loadedProgress !== undefined ? loadedProgress : value;
          
          // Default to 0% for new participants instead of showing "-"
          const displayProgress = actualProgress !== null && actualProgress !== undefined ? actualProgress : 0;
          
          return <LinearWithLabel value={displayProgress} sx={{ minWidth: 75 }} />;
        },
      },
      {
        Header: "Action",
        accessor: "id",
        disableFilters: true,
        disableGroupBy: true,
        Cell: ({ row }) => {
          const participant = row.original;
          // Get the project_participants.id, not the group_participants.id
          const participantId = participant?.participant?.id || participant?.participantId;
          const isAssigning = isMoving(participantId);

          // Find which group this participant is currently in
          const currentParticipantGroup = getParticipantGroup(participantId);

          return (
            <FormControl size="small" sx={{ minWidth: 120 }}>
              <Select
                value={currentParticipantGroup?.id || ''}
                onChange={(e) => handleAssignToGroup(participantId, e.target.value)}
                displayEmpty
                disabled={isAnyActionInProgress}
                size="small"
                renderValue={(selected) => {
                  // Find the selected group to display properly
                  const selectedGroup = groups?.find(g => g.id === selected);
                  if (selectedGroup) {
                    return (
                      <Stack direction="row" spacing={1} alignItems="center">
                        <Box
                          sx={{
                            width: 12,
                            height: 12,
                            borderRadius: '50%',
                            backgroundColor: selectedGroup.chipColor || '#1976d2',
                            border: '1px solid rgba(255, 255, 255, 0.3)',
                          }}
                        />
                        <span>{selectedGroup.groupName}</span>
                      </Stack>
                    );
                  }
                  // If no group selected, show placeholder
                  return <span style={{ color: '#999' }}>No Group</span>;
                }}
              >
                {/* Show ALL groups, not just current one */}
                {groups?.map((group) => (
                  <MenuItem key={group.id} value={group.id}>
                    <Stack direction="row" spacing={1} alignItems="center">
                      <Box
                        sx={{
                          width: 12,
                          height: 12,
                          borderRadius: '50%',
                          backgroundColor: group.chipColor || '#1976d2',
                          border: '1px solid rgba(255, 255, 255, 0.3)',
                        }}
                      />
                      <span>{group.groupName}</span>
                    </Stack>
                  </MenuItem>
                ))}

                {/* Divider to separate groups from remove option */}
                {groups && groups.length > 0 && <Divider />}

                {/* Remove from Group option */}
                <MenuItem value="">
                  <span style={{ color: '#f44336', fontStyle: 'italic' }}>Remove from Group</span>
                </MenuItem>
              </Select>
            </FormControl>
          );
        },
      },
    ],
    [groups, isMoving, isAnyActionInProgress, getParticipantGroup, handleAssignToGroup, currentGroup, progressData]
  );

  return <ReactTable columns={columns} data={participantsWithAttendance} />;
};

GroupEnrolledTable.propTypes = {
  Enrolled: PropTypes.array,
  onRefresh: PropTypes.func,
  currentGroup: PropTypes.object,
  progressData: PropTypes.object,
  projectId: PropTypes.number,
};

GroupEnrolledTable.getLayout = function getLayout(page) {
  return <Layout>{page}</Layout>;
};

export default GroupEnrolledTable;
