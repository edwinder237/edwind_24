import PropTypes from "prop-types";
import { useMemo } from "react";

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
} from "@mui/material";

// third-party
import { useTable, useFilters, usePagination } from "react-table";

// project import
import Layout from "layout";

import LinearWithLabel from "components/@extended/progress/LinearWithLabel";
import { TablePagination } from "components/third-party/ReactTable";

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
          {headerGroups.map((headerGroup, i) => (
            <TableRow key={i} {...headerGroup.getHeaderGroupProps()}>
              {headerGroup.headers.map((column, index) => (
                <TableCell
                  key={index}
                  {...column.getHeaderProps([{ className: column.className }])}
                >
                  {column.render("Header")}
                </TableCell>
              ))}
            </TableRow>
          ))}
        </TableHead>
        <TableBody {...getTableBodyProps()}>
          {page.map((row, i) => {
            prepareRow(row);
            return (
              <TableRow key={i} {...row.getRowProps()}>
                {row.cells.map((cell, index) => (
                  <TableCell
                    key={index}
                    {...cell.getCellProps([
                      { className: cell.column.className },
                    ])}
                  >
                    {cell.render("Cell")}
                  </TableCell>
                ))}
              </TableRow>
            );
          })}

          {!top && (
            <TableRow>
              <TableCell sx={{ p: 2 }} colSpan={7}>
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

const GroupEnrolledTable = ({ Enrolled }) => {
  console.log(Enrolled);
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

  const participantsWithAttendance = Enrolled.map((person, i) => {
    return { ...person, attendanceStatus: attendanceStatusesArray[i] };
  });

  const columns = useMemo(
    () => [
      {
        Header: "Full Name",
        accessor: "participant.participant",
        Cell: ({ cell: { value } }) => (
          <span>{`${value.firstName} ${value.lastName}`}</span>
        ),
      },
      {
        Header: "Role",
        accessor: "participant.participant.role",
      },
      {
        Header: "Status",
        accessor: "attendanceStatus",
        Cell: StatusCell,
      },
      {
        Header: " Departement",
        accessor: "departement",
      },
    ],
    []
  );

  return <ReactTable columns={columns} data={participantsWithAttendance} />;
};

GroupEnrolledTable.getLayout = function getLayout(page) {
  return <Layout>{page}</Layout>;
};

export default GroupEnrolledTable;
