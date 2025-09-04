import PropTypes from "prop-types";
import { useMemo, useState } from "react";
import { useSelector, useDispatch } from 'store';

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
} from "@mui/material";

// third-party
import { useTable, useFilters, usePagination } from "react-table";

// project import
import Layout from "layout";

import LinearWithLabel from "components/@extended/progress/LinearWithLabel";
import { TablePagination } from "components/third-party/ReactTable";

// assets
import { TeamOutlined } from "@ant-design/icons";

// store
import { openSnackbar } from 'store/reducers/snackbar';
import { getGroupsDetails, getSingleProject } from 'store/reducers/projects';
import axios from 'utils/axios';

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

const GroupEnrolledTable = ({ Enrolled, onRefresh, currentGroup }) => {
  console.log(Enrolled);
  const dispatch = useDispatch();
  const { groups, singleProject } = useSelector((state) => state.projects);
  const [assigningParticipant, setAssigningParticipant] = useState(null);
  
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
  
  // Handle group assignment and removal
  const handleAssignToGroup = async (participantId, groupId) => {
    if (!participantId) return;
    
    setAssigningParticipant(participantId);
    try {
      let response;
      
      if (groupId === '' || !groupId) {
        // Remove from current group
        if (currentGroup?.id) {
          response = await axios.post('/api/projects/remove-participant-from-group', {
            groupId: currentGroup.id,
            participantId: participantId
          });
          
          if (response.data.success) {
            dispatch(openSnackbar({
              open: true,
              message: 'Participant removed from group successfully',
              variant: 'alert',
              alert: { color: 'success' }
            }));
          }
        }
      } else {
        // Add to new group
        response = await axios.post('/api/projects/add-participant-to-group', {
          projectId: singleProject?.id,
          groupId: groupId,
          participantId: participantId
        });
        
        if (response.data.success) {
          dispatch(openSnackbar({
            open: true,
            message: 'Participant assigned to group successfully',
            variant: 'alert',
            alert: { color: 'success' }
          }));
        }
      }
      
      // Refresh the data
      if (onRefresh) {
        onRefresh();
      }
      
      // Also refresh Redux state to update UI immediately
      await dispatch(getGroupsDetails(singleProject.id));
      await dispatch(getSingleProject(singleProject.id));
    } catch (error) {
      console.error('Error updating participant group:', error);
      dispatch(openSnackbar({
        open: true,
        message: error.response?.data?.error || 'Failed to update participant group',
        variant: 'alert',
        alert: { color: 'error' }
      }));
    } finally {
      setAssigningParticipant(null);
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
        Cell: ProgressCell,
      },
      {
        Header: "Action",
        accessor: "id",
        disableFilters: true,
        disableGroupBy: true,
        Cell: ({ row }) => {
          const participant = row.original;
          const participantId = participant?.id;
          const isAssigning = assigningParticipant === participantId;
          
          return (
            <Stack direction="row" spacing={1} alignItems="center">
              <FormControl size="small" sx={{ minWidth: 120 }}>
                <Select
                  value={currentGroup?.id || ''}
                  onChange={(e) => handleAssignToGroup(participantId, e.target.value)}
                  displayEmpty
                  disabled={isAssigning}
                  size="small"
                >
                  <MenuItem value="">
                    <em>No Group</em>
                  </MenuItem>
                  {groups?.map((group) => (
                    <MenuItem key={group.id} value={group.id}>
                      <Stack direction="row" spacing={1} alignItems="center">
                        <TeamOutlined style={{ fontSize: 14 }} />
                        <span>{group.groupName}</span>
                      </Stack>
                    </MenuItem>
                  ))}
                </Select>
              </FormControl>
              
              {currentGroup && (
                <Chip
                  label={currentGroup.groupName}
                  size="small"
                  color="primary"
                  variant="outlined"
                  style={{ 
                    backgroundColor: currentGroup.chipColor || '#1976d2',
                    color: '#fff',
                    border: 'none'
                  }}
                />
              )}
            </Stack>
          );
        },
      },
    ],
    [groups, assigningParticipant, handleAssignToGroup, currentGroup]
  );

  return <ReactTable columns={columns} data={participantsWithAttendance} />;
};

GroupEnrolledTable.propTypes = {
  Enrolled: PropTypes.array,
  onRefresh: PropTypes.func,
  currentGroup: PropTypes.object,
};

GroupEnrolledTable.getLayout = function getLayout(page) {
  return <Layout>{page}</Layout>;
};

export default GroupEnrolledTable;
