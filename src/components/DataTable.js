import PropTypes from 'prop-types';
import { useMemo } from 'react';

// material-ui
import { alpha, useTheme } from '@mui/material/styles';
import {
  Box,
  Stack,
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableRow,
  Button,
  Skeleton
} from '@mui/material';

// third-party
import {
  useFilters,
  useGlobalFilter,
  usePagination,
  useRowSelect,
  useSortBy,
  useTable
} from 'react-table';

// project import
import MainCard from 'components/MainCard';
import ScrollX from 'components/ScrollX';
import {
  HeaderSort,
  IndeterminateCheckbox,
  TablePagination,
  TableRowSelection,
  CSVExport,
  EmptyTable
} from 'components/third-party/ReactTable';
import {
  renderFilterTypes,
  GlobalFilter,
  DefaultColumnFilter
} from 'utils/react-table';

// assets
import { PlusOutlined } from '@ant-design/icons';

// ==============================|| SELECTION CELL & HEADER ||============================== //

const SelectionCell = ({ row }) => (
  <IndeterminateCheckbox {...row.getToggleRowSelectedProps()} />
);

SelectionCell.propTypes = {
  row: PropTypes.object
};

const SelectionHeader = ({ getToggleAllPageRowsSelectedProps }) => (
  <IndeterminateCheckbox indeterminate {...getToggleAllPageRowsSelectedProps()} />
);

SelectionHeader.propTypes = {
  getToggleAllPageRowsSelectedProps: PropTypes.func
};

// ==============================|| TABLE SKELETON ||============================== //

const DataTableSkeleton = ({ rows = 10, columns = 6 }) => {
  return (
    <MainCard content={false}>
      <Stack spacing={2}>
        {/* Header skeleton */}
        <Stack
          direction={{ xs: 'column', sm: 'row' }}
          justifyContent="space-between"
          alignItems={{ xs: 'stretch', sm: 'center' }}
          spacing={2}
          sx={{ p: 2, pb: 0 }}
        >
          <Skeleton variant="rounded" width={300} height={40} />
          <Stack direction="row" spacing={1} alignItems="center">
            <Skeleton variant="circular" width={32} height={32} />
            <Skeleton variant="rounded" width={140} height={36} />
          </Stack>
        </Stack>

        {/* Table skeleton */}
        <Box sx={{ width: '100%', overflowX: 'auto' }}>
          <Table>
            <TableHead>
              <TableRow>
                <TableCell padding="checkbox">
                  <Skeleton variant="rectangular" width={20} height={20} />
                </TableCell>
                {[...Array(columns)].map((_, index) => (
                  <TableCell key={index}>
                    <Skeleton variant="text" width={80} height={24} />
                  </TableCell>
                ))}
              </TableRow>
            </TableHead>
            <TableBody>
              {[...Array(rows)].map((_, rowIndex) => (
                <TableRow key={rowIndex}>
                  <TableCell padding="checkbox">
                    <Skeleton variant="rectangular" width={20} height={20} />
                  </TableCell>
                  {[...Array(columns)].map((_, colIndex) => (
                    <TableCell key={colIndex}>
                      {colIndex === 0 ? (
                        <Stack direction="row" spacing={1.5} alignItems="center">
                          <Skeleton variant="rounded" width={40} height={40} />
                          <Stack spacing={0.5}>
                            <Skeleton variant="text" width={120} height={20} />
                            <Skeleton variant="text" width={180} height={16} />
                          </Stack>
                        </Stack>
                      ) : colIndex === columns - 1 ? (
                        <Stack direction="row" spacing={0.5}>
                          <Skeleton variant="circular" width={28} height={28} />
                          <Skeleton variant="circular" width={28} height={28} />
                          <Skeleton variant="circular" width={28} height={28} />
                        </Stack>
                      ) : (
                        <Skeleton variant="rounded" width={80} height={24} />
                      )}
                    </TableCell>
                  ))}
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </Box>

        {/* Pagination skeleton */}
        <Box sx={{ p: 2 }}>
          <Stack direction="row" justifyContent="space-between" alignItems="center">
            <Stack direction="row" spacing={1} alignItems="center">
              <Skeleton variant="text" width={80} height={20} />
              <Skeleton variant="rounded" width={60} height={32} />
              <Skeleton variant="text" width={40} height={20} />
              <Skeleton variant="rounded" width={50} height={32} />
            </Stack>
            <Stack direction="row" spacing={0.5}>
              {[...Array(5)].map((_, index) => (
                <Skeleton key={index} variant="rounded" width={32} height={32} />
              ))}
            </Stack>
          </Stack>
        </Box>
      </Stack>
    </MainCard>
  );
};

DataTableSkeleton.propTypes = {
  rows: PropTypes.number,
  columns: PropTypes.number
};

// ==============================|| REACT TABLE CORE ||============================== //

function ReactTableCore({
  columns,
  data,
  hiddenColumns = [],
  emptyMessage = 'No Data Found',
  csvFilename = 'export.csv',
  csvHeaders = [],
  createButtonLabel,
  onCreate,
  renderActions,
  onRowClick,
  initialPageSize = 10
}) {
  const theme = useTheme();
  const filterTypes = useMemo(() => renderFilterTypes, []);
  const defaultColumn = useMemo(() => ({ Filter: DefaultColumnFilter }), []);

  const initialState = useMemo(
    () => ({
      filters: [],
      hiddenColumns,
      pageIndex: 0,
      pageSize: initialPageSize
    }),
    [hiddenColumns, initialPageSize]
  );

  // Build columns with optional actions
  const tableColumns = useMemo(() => {
    if (renderActions) {
      return [
        ...columns,
        {
          id: 'actions',
          Header: 'Actions',
          disableSortBy: true,
          disableFilters: true,
          Cell: ({ row }) => renderActions(row)
        }
      ];
    }
    return columns;
  }, [columns, renderActions]);

  const {
    getTableProps,
    getTableBodyProps,
    headerGroups,
    rows,
    page,
    prepareRow,
    gotoPage,
    setPageSize,
    state: { globalFilter, pageIndex, pageSize, selectedRowIds },
    preGlobalFilteredRows,
    setGlobalFilter,
    selectedFlatRows
  } = useTable(
    {
      columns: tableColumns,
      data,
      defaultColumn,
      initialState,
      filterTypes
    },
    useGlobalFilter,
    useFilters,
    useSortBy,
    usePagination,
    useRowSelect,
    (hooks) => {
      hooks.allColumns.push((columns) => [
        {
          id: 'selection',
          Header: SelectionHeader,
          Cell: SelectionCell,
          disableSortBy: true,
          disableFilters: true
        },
        ...columns
      ]);
    }
  );

  // CSV Export headers - use provided or generate from columns
  const headers = useMemo(() => {
    if (csvHeaders.length > 0) return csvHeaders;
    return columns
      .filter(col => col.accessor && !hiddenColumns.includes(col.accessor))
      .map(col => ({
        label: typeof col.Header === 'string' ? col.Header : col.accessor,
        key: col.accessor
      }));
  }, [columns, csvHeaders, hiddenColumns]);

  return (
    <>
      <TableRowSelection selected={Object.keys(selectedRowIds).length} />
      <Stack spacing={2}>
        <Stack
          direction={{ xs: 'column', sm: 'row' }}
          justifyContent="space-between"
          alignItems={{ xs: 'stretch', sm: 'center' }}
          spacing={2}
          sx={{ p: 2, pb: 0 }}
        >
          <GlobalFilter
            preGlobalFilteredRows={preGlobalFilteredRows}
            globalFilter={globalFilter}
            setGlobalFilter={setGlobalFilter}
            size="small"
            sx={{ minWidth: { xs: '100%', sm: 300 } }}
          />
          <Stack direction="row" spacing={1} alignItems="center">
            <CSVExport
              data={
                selectedFlatRows.length > 0
                  ? selectedFlatRows.map((d) => d.original).filter((d) => d !== undefined)
                  : data
              }
              filename={csvFilename}
              headers={headers}
            />
            {onCreate && createButtonLabel && (
              <Button
                variant="contained"
                startIcon={<PlusOutlined />}
                onClick={onCreate}
                size="small"
              >
                {createButtonLabel}
              </Button>
            )}
          </Stack>
        </Stack>

        <Box sx={{ width: '100%', overflowX: 'auto', display: 'block' }}>
          <Table {...getTableProps()}>
            <TableHead sx={{ borderTopWidth: 2 }}>
              {headerGroups.map((headerGroup) => {
                const { key: headerGroupKey, ...headerGroupProps } = headerGroup.getHeaderGroupProps();
                return (
                  <TableRow key={headerGroupKey} {...headerGroupProps}>
                    {headerGroup.headers.map((column) => {
                      const { key: columnKey, ...columnProps } = column.getHeaderProps([
                        { className: column.className }
                      ]);
                      return (
                        <TableCell key={columnKey} {...columnProps}>
                          <HeaderSort column={column} sort />
                        </TableCell>
                      );
                    })}
                  </TableRow>
                );
              })}
            </TableHead>

            <TableBody {...getTableBodyProps()}>
              {page.length > 0 ? (
                page.map((row) => {
                  prepareRow(row);
                  const { key: rowKey, ...rowProps } = row.getRowProps();
                  return (
                    <TableRow
                      key={rowKey}
                      {...rowProps}
                      hover
                      sx={{
                        cursor: onRowClick ? 'pointer' : 'default',
                        bgcolor: row.isSelected
                          ? alpha(theme.palette.primary.lighter, 0.35)
                          : 'inherit'
                      }}
                      onClick={() => {
                        row.toggleRowSelected();
                        if (onRowClick) onRowClick(row.original);
                      }}
                    >
                      {row.cells.map((cell) => {
                        const { key: cellKey, ...cellProps } = cell.getCellProps([
                          { className: cell.column.className }
                        ]);
                        return (
                          <TableCell key={cellKey} {...cellProps}>
                            {cell.render('Cell')}
                          </TableCell>
                        );
                      })}
                    </TableRow>
                  );
                })
              ) : (
                <EmptyTable msg={emptyMessage} colSpan={tableColumns.length + 1} />
              )}
            </TableBody>
          </Table>
        </Box>

        <Box sx={{ p: 2 }}>
          <TablePagination
            gotoPage={gotoPage}
            rows={rows}
            setPageSize={setPageSize}
            pageIndex={pageIndex}
            pageSize={pageSize}
          />
        </Box>
      </Stack>
    </>
  );
}

ReactTableCore.propTypes = {
  columns: PropTypes.array.isRequired,
  data: PropTypes.array.isRequired,
  hiddenColumns: PropTypes.array,
  emptyMessage: PropTypes.string,
  csvFilename: PropTypes.string,
  csvHeaders: PropTypes.array,
  createButtonLabel: PropTypes.string,
  onCreate: PropTypes.func,
  renderActions: PropTypes.func,
  onRowClick: PropTypes.func,
  initialPageSize: PropTypes.number
};

// ==============================|| DATA TABLE ||============================== //

const DataTable = ({
  columns,
  data,
  hiddenColumns,
  emptyMessage,
  csvFilename,
  csvHeaders,
  createButtonLabel,
  onCreate,
  renderActions,
  onRowClick,
  initialPageSize
}) => {
  return (
    <MainCard content={false}>
      <ScrollX>
        <ReactTableCore
          columns={columns}
          data={data}
          hiddenColumns={hiddenColumns}
          emptyMessage={emptyMessage}
          csvFilename={csvFilename}
          csvHeaders={csvHeaders}
          createButtonLabel={createButtonLabel}
          onCreate={onCreate}
          renderActions={renderActions}
          onRowClick={onRowClick}
          initialPageSize={initialPageSize}
        />
      </ScrollX>
    </MainCard>
  );
};

DataTable.propTypes = {
  columns: PropTypes.array.isRequired,
  data: PropTypes.array.isRequired,
  hiddenColumns: PropTypes.array,
  emptyMessage: PropTypes.string,
  csvFilename: PropTypes.string,
  csvHeaders: PropTypes.array,
  createButtonLabel: PropTypes.string,
  onCreate: PropTypes.func,
  renderActions: PropTypes.func,
  onRowClick: PropTypes.func,
  initialPageSize: PropTypes.number
};

export { DataTableSkeleton };
export default DataTable;
