import PropTypes from "prop-types";
import { useMemo } from "react";
import { useSelector } from 'store';

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

// hooks
import useParticipantGroupMove from "hooks/useParticipantGroupMove";

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

const GroupEnrolledTable = ({ Enrolled, onRefresh, currentGroup, progressData }) => {
  console.log(Enrolled);
  const { groups } = useSelector((state) => state.projects);
  
  // Use the custom hook for participant group management
  const { 
    moveParticipant, 
    isMoving, 
    getParticipantGroups 
  } = useParticipantGroupMove();
  
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
  
  // Handle group assignment using the hook
  const handleAssignToGroup = async (participantId, newGroupId) => {
    if (!participantId) return;
    
    const result = await moveParticipant(participantId, newGroupId || null, {
      removeFromAll: true,
      showNotification: true
    });
    
    // Refresh data immediately after successful move
    if (result.success && onRefresh) {
      onRefresh();
    }
  };

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
          
          // Find all groups this participant is in using the hook
          const participantGroups = getParticipantGroups(participantId);
          
          // Use the first group if participant is in multiple groups (shouldn't happen after fix)
          const currentParticipantGroup = participantGroups[0];
          
          return (
            <FormControl size="small" sx={{ minWidth: 120 }}>
              <Select
                value={currentParticipantGroup?.id || ''}
                onChange={(e) => handleAssignToGroup(participantId, e.target.value)}
                displayEmpty
                disabled={isAssigning}
                size="small"
              >
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
    [groups, isMoving, getParticipantGroups, handleAssignToGroup, currentGroup, progressData]
  );

  return <ReactTable columns={columns} data={participantsWithAttendance} />;
};

GroupEnrolledTable.propTypes = {
  Enrolled: PropTypes.array,
  onRefresh: PropTypes.func,
  currentGroup: PropTypes.object,
  progressData: PropTypes.object,
};

GroupEnrolledTable.getLayout = function getLayout(page) {
  return <Layout>{page}</Layout>;
};

export default GroupEnrolledTable;
