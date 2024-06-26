import PropTypes from "prop-types";
import { useCallback, useEffect, useMemo, useState, Fragment } from "react";
import axios from "axios";
import { useDispatch, useSelector } from "store";
import { getModules } from "store/reducers/courses";

// next
import NextLink from "next/link";

// material-ui
import { alpha, useTheme } from "@mui/material/styles";
import {
  Button,
  Chip,
  Dialog,
  Stack,
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableRow,
  Tooltip,
  Typography,
  useMediaQuery,
} from "@mui/material";

// third-party
import { NumericFormat } from "react-number-format";
import {
  useFilters,
  useExpanded,
  useGlobalFilter,
  useRowSelect,
  useSortBy,
  useTable,
  usePagination,
} from "react-table";

// project import
import Layout from "layout";
import Page from "components/Page";
import MainCard from "components/MainCard";
import ScrollX from "components/ScrollX";
import Avatar from "components/@extended/Avatar";
import IconButton from "components/@extended/IconButton";
import { PopupTransition } from "components/@extended/Transitions";
import {
  CSVExport,
  HeaderSort,
  IndeterminateCheckbox,
  SortingSelect,
  TablePagination,
  TableRowSelection,
} from "components/third-party/ReactTable";

import AddCustomer from "sections/apps/customer/AddCustomer";
import CustomerView from "sections/apps/customer/CustomerView";
import AlertCustomerDelete from "sections/apps/customer/AlertCustomerDelete";

import makeData from "data/react-table";
import { renderFilterTypes, GlobalFilter } from "utils/react-table";

// assets
import {
  CloseOutlined,
  PlusOutlined,
  EyeTwoTone,
  EditTwoTone,
  DeleteTwoTone,
} from "@ant-design/icons";

// ==============================|| REACT TABLE ||============================== //

function ReactTable({ columns, data, renderRowSubComponent, handleAdd }) {
  const theme = useTheme();
  const matchDownSM = useMediaQuery(theme.breakpoints.down("sm"));

  const filterTypes = useMemo(() => renderFilterTypes, []);
  const sortBy = { id: "title", desc: false };

  const {
    getTableProps,
    getTableBodyProps,
    headerGroups,
    prepareRow,
    setHiddenColumns,
    allColumns,
    visibleColumns,
    rows,
    page,
    gotoPage,
    setPageSize,
    state: { globalFilter, selectedRowIds, pageIndex, pageSize, expanded },
    preGlobalFilteredRows,
    setGlobalFilter,
    setSortBy,
    selectedFlatRows,
  } = useTable(
    {
      columns,
      data,
      filterTypes,
      initialState: {
        pageIndex: 0,
        pageSize: 5,
        hiddenColumns: ["avatar"],
        sortBy: [sortBy],
      },
    },
    useGlobalFilter,
    useFilters,
    useSortBy,
    useExpanded,
    usePagination,
    useRowSelect
  );

  useEffect(() => {
    if (matchDownSM) {
      setHiddenColumns(["age", "contact", "visits", , "status", "avatar"]);
    } else {
      setHiddenColumns(["avatar"]);
    }
    // eslint-disable-next-line
  }, [matchDownSM]);

  return (
    <>
      <TableRowSelection selected={Object.keys(selectedRowIds).length} />
      <Stack spacing={3}>
        <Stack
          direction={matchDownSM ? "column" : "row"}
          spacing={1}
          justifyContent="space-between"
          alignItems="center"
          sx={{ p: 3, pb: 0 }}
        >
          <GlobalFilter
            preGlobalFilteredRows={preGlobalFilteredRows}
            globalFilter={globalFilter}
            setGlobalFilter={setGlobalFilter}
            size="small"
          />
          <Stack
            direction={matchDownSM ? "column" : "row"}
            alignItems="center"
            spacing={1}
          >
            <SortingSelect
              sortBy={sortBy.id}
              setSortBy={setSortBy}
              allColumns={allColumns}
            />
            <Button
              variant="contained"
              startIcon={<PlusOutlined />}
              onClick={handleAdd}
              size="small"
            >
              Add Course
            </Button>
            <CSVExport
              data={
                selectedFlatRows.length > 0
                  ? selectedFlatRows.map((d) => d.original)
                  : data
              }
              filename={"customer-list.csv"}
            />
          </Stack>
        </Stack>
        <Table {...getTableProps()}>
          <TableHead>
            {headerGroups.map((headerGroup, index) => (
              <TableRow
                {...headerGroup.getHeaderGroupProps()}
                key={index}
                sx={{ "& > th:first-of-type": { width: "58px" } }}
              >
                {headerGroup.headers.map((column, i) => (
                  <TableCell
                    {...column.getHeaderProps([
                      { className: column.className },
                    ])}
                    key={i}
                  >
                    <HeaderSort column={column} sort />
                  </TableCell>
                ))}
              </TableRow>
            ))}
          </TableHead>
          <TableBody {...getTableBodyProps()}>
            {page.map((row, i) => {
              prepareRow(row);
              const rowProps = row.getRowProps();

              return (
                <Fragment key={i}>
                  <TableRow
                    {...row.getRowProps()}
                    onClick={() => {
                      row.toggleRowSelected();
                    }}
                    sx={{
                      cursor: "pointer",
                      bgcolor: row.isSelected
                        ? alpha(theme.palette.primary.lighter, 0.35)
                        : "inherit",
                    }}
                  >
                    {true &&
                      row.cells.map((cell, i) => (
                        <TableCell
                          {...cell.getCellProps([
                            { className: cell.column.className },
                          ])}
                          key={i}
                        >
                          {cell.render("Cell")}
                        </TableCell>
                      ))}
                  </TableRow>
                  {row.isExpanded &&
                    renderRowSubComponent({
                      row,
                      rowProps,
                      visibleColumns,
                      expanded,
                    })}
                </Fragment>
              );
            })}
            <TableRow sx={{ "&:hover": { bgcolor: "transparent !important" } }}>
              <TableCell sx={{ p: 2, py: 3 }} colSpan={9}>
                <TablePagination
                  gotoPage={gotoPage}
                  rows={rows}
                  setPageSize={setPageSize}
                  pageSize={pageSize}
                  pageIndex={pageIndex}
                />
              </TableCell>
            </TableRow>
          </TableBody>
        </Table>
      </Stack>
    </>
  );
}

ReactTable.propTypes = {
  columns: PropTypes.array,
  data: PropTypes.array,
  getHeaderProps: PropTypes.func,
  handleAdd: PropTypes.func,
  renderRowSubComponent: PropTypes.any,
};

// ==============================|| CUSTOMER - LIST ||============================== //

const CustomerCell = ({ row }) => {
  //console.log(row.values);
  const { values } = row;
  return (
    <Stack direction="row" spacing={1.5} alignItems="center">
      <Avatar
        alt="Avatar 1"
        size="sm"
        src={`/assets/images/users/avatar-${
          !values.avatar ? 1 : values.avatar
        }.png`}
      />
      <Stack spacing={0}>
        <Typography variant="subtitle1">{values.fatherName}</Typography>
        <Typography variant="caption" color="textSecondary">
          {values.email}
        </Typography>
      </Stack>
    </Stack>
  );
};

CustomerCell.propTypes = {
  row: PropTypes.object,
};

//const ContactCell = ({ value }) => <NumericFormat displayType="text" format="+1 (###) ###-####" mask="_" defaultValue={value} />; If Phone Number is required
//ContactCell.propTypes = {
//value: PropTypes.number
//};

const StatusCell = ({ value }) => {
  switch (value) {
    case "Complicated":
      return (
        <Chip color="error" label="Rejected" size="small" variant="light" />
      );
    case "Relationship":
      return (
        <Chip color="success" label="Verified" size="small" variant="light" />
      );
    case "Single":
    default:
      return <Chip color="info" label="Pending" size="small" variant="light" />;
  }
};

StatusCell.propTypes = {
  value: PropTypes.string,
};

const ActionsCell = (
  row,
  setCustomer,
  setCustomerDeleteId,
  handleClose,
  handleAdd,
  theme
) => {
  const collapseIcon = row.isExpanded ? (
    <CloseOutlined style={{ color: theme.palette.error.main }} />
  ) : (
    <EyeTwoTone twoToneColor={theme.palette.secondary.main} />
  );
  const courseId = row.original.id;
  return (
    <Stack
      direction="row"
      alignItems="center"
      justifyContent="center"
      spacing={0}
    >
      <Tooltip title="View">
        <IconButton
          color="secondary"
          onClick={(e) => {
            e.stopPropagation();
            row.toggleRowExpanded();
          }}
        >
          {collapseIcon}
        </IconButton>
      </Tooltip>
      <NextLink href={`/courses/${courseId}`} passHref>
        <Tooltip title="Edit">
          <IconButton color="primary">
            <EditTwoTone twoToneColor={theme.palette.primary.main} />
          </IconButton>
        </Tooltip>
      </NextLink>
      <Tooltip title="Delete">
        <IconButton
          color="error"
          onClick={(e) => {
            e.stopPropagation();
            handleClose();
            setCustomerDeleteId(row.values.fatherName);
          }}
        >
          <DeleteTwoTone twoToneColor={theme.palette.error.main} />
        </IconButton>
      </Tooltip>
    </Stack>
  );
};

ActionsCell.propTypes = {
  row: PropTypes.object,
  setCustomer: PropTypes.func,
  setCustomerDeleteId: PropTypes.func,
  handleClose: PropTypes.func,
  handleAdd: PropTypes.func,
  theme: PropTypes.array,
};

// Section Cell and Header
const SelectionCell = ({ row }) => (
  <IndeterminateCheckbox {...row.getToggleRowSelectedProps()} />
);
const SelectionHeader = ({ getToggleAllPageRowsSelectedProps }) => (
  <IndeterminateCheckbox
    indeterminate
    {...getToggleAllPageRowsSelectedProps()}
  />
);

SelectionCell.propTypes = {
  row: PropTypes.object,
};

SelectionHeader.propTypes = {
  getToggleAllPageRowsSelectedProps: PropTypes.func,
};

const CoursesTable = () => {
  const dispatch = useDispatch();

  const { courses, modules } = useSelector((store) => store.courses);
  console.log("from coures-table",courses.filter((course)=>course.id === 1)[0]);



  const [data, setData] = useState([{ name: "name" }]);

  useEffect(() => {
    setData(courses);
  }, []);

  const theme = useTheme();

  const [open, setOpen] = useState(false);
  const [customer, setCustomer] = useState(null);
  const [customerDeleteId, setCustomerDeleteId] = useState("");
  const [add, setAdd] = useState(false);

  const handleAdd = () => {
    setAdd(!add);
    if (customer && !add) setCustomer(null);
  };

  const handleClose = () => {
    setOpen(!open);
  };

  const columns = useMemo(
    () => [
      {
        title: "Row Selection",
        Header: SelectionHeader,
        accessor: "selection",
        Cell: SelectionCell,
        disableSortBy: true,
      },
      {
        Header: "#",
        accessor: "sortorder",
        className: "cell-center",
      },
      {
        Header: "Course Name",
        accessor: "title",
      },
      {
        Header: "Description",
        accessor: "description",
        disableSortBy: true,
      },
      {
        Header: "Priority",
        accessor: "priority",
        className: "cell-center",
      },
      {
        Header: "Duration",
        accessor: "duration",
        className: "cell-center",
      },
      {
        Header: "Code",
        accessor: "id",
      },
      {
        Header: "Actions",
        className: "cell-center",
        disableSortBy: true,
        Cell: ({ row }) =>
          ActionsCell(
            row,
            setCustomer,
            setCustomerDeleteId,
            handleClose,
            handleAdd,
            theme
          ),
      },
    ],
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [theme]
  );

  //const renderRowSubComponent = useCallback(({ row }) => <CustomerView data={data2[Number(row.id)]} />, [data2]);

  return (
    <Page title="Courses List">
      <MainCard content={false}>
        <ScrollX>
          {true && (
            <ReactTable
              columns={columns}
              data={data.length > 0 ? data : []}
              handleAdd={handleAdd}
              renderRowSubComponent={null}
            />
          )}
        </ScrollX>
        <AlertCustomerDelete
          title={customerDeleteId}
          open={open}
          handleClose={handleClose}
        />
        {/* add customer dialog */}
        <Dialog
          maxWidth="sm"
          TransitionComponent={PopupTransition}
          keepMounted
          fullWidth
          onClose={handleAdd}
          open={add}
          sx={{ "& .MuiDialog-paper": { p: 0 }, transition: "transform 225ms" }}
          aria-describedby="alert-dialog-slide-description"
        >
          <AddCustomer customer={customer} onCancel={handleAdd} />
        </Dialog>
      </MainCard>
    </Page>
  );
};

CoursesTable.getLayout = function getLayout(page) {
  return <Layout>{page}</Layout>;
};

export default CoursesTable;
