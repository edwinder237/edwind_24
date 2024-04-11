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
} from "@ant-design/icons";
import AddButton from "components/StyledButtons";
import AddGroup from "./AddGroup";

import { useDispatch } from "store";
import {
  addGroup,
  removeGroup,
  getGroupsDetails,
} from "store/reducers/projects";
import { useSelector } from "react-redux";

// ==============================|| REACT TABLE ||============================== //

const tableName = "Groups";

const ColumnCell = ({
  row,
  setEditableRowIndex,
  editableRowIndex,
  handleRemoveGroup,
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
          <MenuItem>
            <MailOutlined style={{ paddingRight: 8 }} />
            <Typography>Email Credentials </Typography>
          </MenuItem>
          <MenuItem onClick={() => handleRemoveGroup(row.original.uuid)}>
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
};

function ReactTable({
  columns: userColumns,
  data,
  renderRowSubComponent,
  handleRemoveGroup,
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
            <ColumnCell row={row} handleRemoveGroup={handleRemoveGroup} />
          ),
        },
      ]);
    }
  );

  return (
    <Table {...getTableProps()}>
      <TableHead>
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
        {rows.map((row, i) => {
          prepareRow(row);
          const rowProps = row.getRowProps();

          return (
            <Fragment key={i}>
              <TableRow {...row.getRowProps()}>
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
  const matchingGroup = groups.find((group) => group.groupName === value);

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
  const { singleProject: Project } = useSelector((state) => state.projects);
  const dispatch = useDispatch();
  const { participants } = Project;

  const [data, setData] = useState([]);

  useEffect(() => {
    dispatch(getGroupsDetails(Project.id));
  }, []);

  const { groups } = useSelector((state) => state.projects);

  // console.log("Project/GroupTable/index",groups );

  useEffect(() => {
    setData(groups);
  }, []);

  // ADD BUTTON DEPS
  const [customer, setCustomer] = useState(null);
  const [add, setAdd] = useState(false);
  const handleAdd = () => {
    setAdd(!add);
    if (customer && !add) setCustomer(null);
  };
  function handleAddGroup(newGroup) {
    //this fucntion adds the newlly created group to the project.groups state

    dispatch(addGroup(newGroup, groups, index));
  }

  function handleRemoveGroup(uuid) {
    const updatedGroups = groups.filter((group) => group.uuid !== uuid);
    //console.log(updatedGroups);
    dispatch(removeGroup(updatedGroups, index));
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
        Cell: (props) => <GroupCell {...props} groups={groups} />,
      },
      {
        Header: "Size",
        accessor: "participants",
        Cell: ({ value }) => <span>{value ? value.length : ""}</span>,
      },
      {
        Header: "Curriculum Progress",
        accessor: "progress",
        Cell: ProgressCell,
      },
    ],
    [groups]
  );

  const renderRowSubComponent = useCallback(
    ({ row }) => <GroupDetails Group={groups[row.id]} />,
    [groups]
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
            <AddButton
              onClick={handleAdd}
              variant="contained"
              startIcon={<PlusOutlined />}
              size="small"
            >
              Add {tableName}
            </AddButton>
            <CSVExport data={data} filename={"expanding-details-table.csv"} />
          </Stack>
        }
      >
        <ScrollX>
          <ReactTable
            columns={columns}
            data={groups ? groups : []}
            renderRowSubComponent={renderRowSubComponent}
            handleRemoveGroup={handleRemoveGroup}
          />
        </ScrollX>
      </MainCard>
      <Dialog
        maxWidth="sm"
        fullWidth
        TransitionComponent={PopupTransition}
        onClose={handleAdd}
        open={add}
        sx={{ "& .MuiDialog-paper": { p: 0 } }}
      >
        <AddGroup
          customer={customer}
          onCancel={handleAdd}
          handleAddParticipant={handleAddGroup}
          groupsInState={groups}
          participants={participants}
        />
      </Dialog>
    </Fragment>
  );
};

GroupTable.propTypes = {
  groups: PropTypes.array,
};

// ==============================|| REACT TABLE - EXPANDING DETAILS ||============================== //

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
      return <Chip color="info" label="Single" size="small" variant="light" />;
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

export default GroupTable;
