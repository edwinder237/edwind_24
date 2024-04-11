import PropTypes from 'prop-types';
import { useCallback, useMemo,Fragment } from 'react';

// material-ui
import { Box,Button, Chip, Stack, Table, TableBody, TableCell, TableHead, TableRow, Typography } from '@mui/material';

// third-party
import { useTable, useGroupBy, useExpanded } from 'react-table';

// project import
import MainCard from 'components/MainCard';
import ScrollX from 'components/ScrollX';
import { CSVExport } from 'components/third-party/ReactTable';
import LinearWithLabel from 'components/@extended/progress/LinearWithLabel';
import { roundedMedian, useControlledState } from 'utils/react-table';
import ExpandingGroupDetail from './Groups';


// assets
import { DownOutlined, GroupOutlined, RightOutlined, UngroupOutlined,PlusOutlined } from '@ant-design/icons';

// ==============================|| REACT TABLE ||============================== //
const tableTitle = "Groups/Class";

function ReactTable({ columns, data,renderRowSubComponent }) {
  const { getTableProps, getTableBodyProps, headerGroups, rows, prepareRow,visibleColumns } = useTable(
    {
      columns,
      data,
      initialState: { groupBy: ['group'] }
    },
    useGroupBy,
    useExpanded,
    (hooks) => {
      hooks.useControlledState.push(useControlledState);
      hooks.visibleColumns.push((cols, { instance }) => {
        if (!instance.state.groupBy.length) {
          return cols;
        }
        return [
          {
            id: 'expander',
            Header: SelectionHeader,
            Cell: SelectionCell
          },
          ...cols
        ];
      });
    }
  );

  const firstPageRows = rows.slice(0, rows.length);
  let groupedData = [];
  if (rows.filter((row) => row.original).length) {
    groupedData = rows.map((row) => row.original).filter((row) => row !== undefined);
  } else {
    groupedData = [];
    rows.forEach((row) => {
      if (row.subRows.length) {
        groupedData.push({ ...row.values });
        row.subRows.forEach((subRow) => {
          if (subRow.subRows.length) {
            groupedData.push({ ...subRow.values });
            subRow.subRows.forEach((innerRow) => {
              groupedData.push({
                ...innerRow.values,
                age: undefined,
                group: undefined
              });
            });
          } else {
            groupedData.push({
              ...subRow.values,
              age: undefined
            });
          }
        });
      } else {
        groupedData.push({ ...row.values });
      }
    });
  }

  function handleCreateGroup() {
    alert("yo")

  }

  return (
    <MainCard
      content={false}
      title={`${tableTitle} list`}
      secondary={
        <Stack direction="row" spacing={2} sx={{ display: { xs: 'none', sm: 'flex' } }}>
          <Legend /> 
          <Button variant="contained" startIcon={<PlusOutlined />} onClick={handleCreateGroup} size="small">
              Add {tableTitle}
            </Button>
          <CSVExport data={groupedData} filename={'grouping-single-column-table.csv'} />
        </Stack>
      }
    >
      <Stack direction="row" spacing={2} sx={{ p: 2.5, display: { xs: 'flex', sm: 'none' } }} justifyContent="flex-end">
        <Legend /> <CSVExport data={groupedData} filename={'grouping-single-column-table.csv'} />
      </Stack>
      <ScrollX sx={{ maxHeight: 600 }}>
        <Table {...getTableProps()}>
          <TableHead sx={{ position: 'sticky', top: -1, zIndex: 1199 }}>
            {headerGroups.map((headerGroup, i) => (
              <TableRow {...headerGroup.getHeaderGroupProps()} key={i}>
                {headerGroup.headers.map((column, index) => {
                  const groupIcon = column.isGrouped ? <UngroupOutlined /> : <GroupOutlined />;
                  return (
                    <TableCell {...column.getHeaderProps([{ className: column.className }])} key={index}>
                      <Stack direction="row" spacing={1.15} alignItems="center" sx={{ display: 'inline-flex' }}>
                        {column.canGroupBy ? (
                          <Box
                            sx={{ color: column.isGrouped ? 'error.main' : 'primary.main', fontSize: '1rem' }}
                            {...column.getGroupByToggleProps()}
                          >
                            {groupIcon}
                          </Box>
                        ) : null}
                        <Box>{column.render('Header')}</Box>
                      </Stack>
                    </TableCell>
                  );
                })}
              </TableRow>
            ))}
          </TableHead>
          <TableBody {...getTableBodyProps()}>
            {firstPageRows.map((row, i) => {
              prepareRow(row);
              const rowProps = row.getRowProps();
              return (
                <Fragment key={i}>
                <TableRow {...row.getRowProps()} key={i}>
                  {row.cells.map((cell, index) => {
                    let bgcolor = 'background.paper';
                    if (cell.isAggregated) bgcolor = 'warning.lighter';
                    if (cell.isGrouped) bgcolor = 'success.lighter';
                    if (cell.isPlaceholder) bgcolor = 'error.lighter';

                    return (
                      <TableCell {...cell.getCellProps([{ className: cell.column.className }])} sx={{ bgcolor }} key={index}>
                        {cell.isAggregated ? cell.render('Aggregated') : cell.isPlaceholder ? null : cell.render('Cell')}
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
      </ScrollX>
    </MainCard>
  );
}

ReactTable.propTypes = {
  columns: PropTypes.array,
  data: PropTypes.array,
  renderRowSubComponent: PropTypes.any
};

// ==============================|| LEGEND ||============================== //

function Legend() {
  return (
    <Stack direction="row" spacing={1} alignItems="center" justifyContent="flex-end">
      <Chip color="warning" variant="light" label="Aggregated" />
    </Stack>
  );
}

// ==============================|| REACT TABLE - EXPANDING DETAILS ||============================== //

const StatusCell = ({ value }) => {
  switch (value) {
    case 3:
      return <Chip color="error" label="Group 3" size="small" />;
    case 2:
      return <Chip color="success" label="Group 2" size="small" />;
    case 1:
    default:
      return <Chip color="info" label="Group 1" size="small" />;
  }
};

StatusCell.propTypes = {
  value: PropTypes.string
};

const ProgressCell = ({ value }) => <LinearWithLabel value={value} sx={{ minWidth: 75 }} />;

ProgressCell.propTypes = {
  value: PropTypes.number
};

function GroupingColumnTable({ data }) {
  const columns = useMemo(
    () => [
      {
        Header: 'Full Name',
        accessor: 'fullname',
        aggregate: 'count',
        Aggregated: ({ value }) => `${value} Person`,
        disableGroupBy: true
      },
      {
        Header: 'Email',
        accessor: 'email',
        disableGroupBy: true
      },
      {
        Header: 'Role',
        accessor: 'role',
        disableGroupBy: true
      },
      {
        Header: 'Age',
        accessor: 'age',
        className: 'cell-right',
        aggregate: 'average',
        Aggregated: ({ value }) => `${value} (avg)`
      },
      {
        Header: 'Visits',
        accessor: 'visits',
        className: 'cell-right',
        aggregate: 'sum',
        Aggregated: ({ value }) => `${value} (total)`,
        disableGroupBy: true
      },
      {
        Header: 'Class',
        accessor: 'group',
        Cell: StatusCell
      },
      {
        Header: 'Curriculum Progress',
        accessor: 'progress',
        aggregate: roundedMedian,
        Aggregated: ({ value }) => `${value} %`,
        disableGroupBy: true,
        Cell: ProgressCell
      }
    ],
    []
  );
  const renderRowSubComponent = useCallback(() => <ExpandingGroupDetail data={data} />, [data]);
  
  return <ReactTable columns={columns} data={data} renderRowSubComponent={renderRowSubComponent}  />;
}

GroupingColumnTable.propTypes = {
  data: PropTypes.array
};

const SelectionHeader = ({ allColumns, state: { groupBy } }) =>
  groupBy.map((columnId, index) => {
    const column = allColumns.find((d) => d.id === columnId);
    const groupIcon = column.isGrouped ? <UngroupOutlined /> : <GroupOutlined />;

    return (
      <Stack
        key={index}
        direction="row"
        spacing={1.25}
        alignItems="center"
        {...column.getHeaderProps()}
        sx={{ display: 'inline-flex', '&:not(:last-of-type)': { mr: 1.5 } }}
      >
        {column.canGroupBy ? (
          <Box sx={{ color: column.isGrouped ? 'error.main' : 'primary.main', fontSize: '1rem' }} {...column.getGroupByToggleProps()}>
            {groupIcon}
          </Box>
        ) : null}
        <Typography variant="subtitle1">{column.render('Header')}</Typography>
      </Stack>
    );
  });

SelectionHeader.propTypes = {
  allColumns: PropTypes.array,
  state: PropTypes.array
};

const SelectionCell = ({ row }) => {
  if (row.canExpand) {
    const groupedCell = row.allCells.find((d) => d.isGrouped);
    const collapseIcon = row.isExpanded ? <DownOutlined /> : <RightOutlined />;

    return (
      <Stack direction="row" spacing={1} alignItems="center">
        <Box sx={{ pl: row.depth * 2, pr: 0.5, fontSize: '0.75rem', color: 'text.secondary' }} {...row.getToggleRowExpandedProps()}>
          {collapseIcon}
        </Box>
        <Box>{groupedCell.render('Cell')}</Box>
        <Box>({row.subRows.length})</Box>
      </Stack>
    );
  }
  return null;
};

SelectionCell.propTypes = {
  row: PropTypes.object
};

export default GroupingColumnTable;
