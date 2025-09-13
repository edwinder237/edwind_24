import PropTypes from "prop-types";
import { useCallback, useEffect, useMemo, useState, Fragment } from "react";

// material-ui
import { alpha, useTheme } from "@mui/material/styles";
import {
  Button,
  Stack,
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableRow,
  useMediaQuery,
  Box,
  Menu,
  MenuItem,
  Divider,
  Fab,
  Tooltip,
  Typography,
} from "@mui/material";

// third-party
import {
  useFilters,
  useExpanded,
  useGlobalFilter,
  useRowSelect,
  useSortBy,
  useTable,
  usePagination,
} from "react-table";

// project imports
import {
  CSVExport,
  HeaderSort,
  IndeterminateCheckbox,
  SortingSelect,
  TablePagination,
  TableRowSelection,
} from "components/third-party/ReactTable";
import { renderFilterTypes, GlobalFilter } from "utils/react-table";

// assets
import { PlusOutlined, DeleteOutlined, EditTwoTone, MoreOutlined } from "@ant-design/icons";
import KeyboardArrowDownIcon from "@mui/icons-material/KeyboardArrowDown";

// ==============================|| REUSABLE APP TABLE ||============================== //

function AppTable({
  columns,
  data,
  renderRowSubComponent,
  handleAdd,
  addButtonText = "Add Item",
  showAddButton = true,
  showCSVExport = true,
  showSorting = true,
  showGlobalFilter = true,
  showRowSelection = true,
  showPagination = true,
  initialPageSize = 50,
  initialSortBy = null,
  initialHiddenColumns = [],
  responsiveHiddenColumns = [],
  csvFilename = "data-export.csv",
  tableProps = {},
  onRowClick,
  customActions,
  emptyMessage = "No data available",
  // Actions props
  showActionsButton = true,
  actionsLabel = "Actions",
  onBulkDelete,
  onBulkEdit,
  customMenuItems = [],
  // Enhanced add button props
  showFloatingActionButton = false,
  addButtonVariant = "emphasized", // "emphasized", "contained", "outlined"
  addButtonDescription = null,
}) {
  const theme = useTheme();
  const matchDownSM = useMediaQuery(theme.breakpoints.down("sm"));

  // Actions menu state
  const [actionsAnchorEl, setActionsAnchorEl] = useState(null);
  const actionsMenuOpen = Boolean(actionsAnchorEl);

  const filterTypes = useMemo(() => renderFilterTypes, []);
  const defaultSortBy = initialSortBy || { id: columns[0]?.accessor || "id", desc: false };

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
        pageSize: initialPageSize,
        hiddenColumns: initialHiddenColumns,
        sortBy: [defaultSortBy],
      },
      ...tableProps,
    },
    useGlobalFilter,
    useFilters,
    useSortBy,
    useExpanded,
    usePagination,
    useRowSelect
  );

  // Handle responsive column hiding
  useEffect(() => {
    if (matchDownSM && responsiveHiddenColumns.length > 0) {
      setHiddenColumns([...initialHiddenColumns, ...responsiveHiddenColumns]);
    } else {
      setHiddenColumns(initialHiddenColumns);
    }
  }, [matchDownSM, initialHiddenColumns, responsiveHiddenColumns]);

  // Handle row click
  const handleRowClick = useCallback((row) => {
    if (onRowClick) {
      onRowClick(row);
    } else {
      row.toggleRowSelected();
    }
  }, [onRowClick]);

  // Actions menu handlers
  const handleActionsClick = (event) => {
    setActionsAnchorEl(event.currentTarget);
  };

  const handleActionsClose = () => {
    setActionsAnchorEl(null);
  };

  const handleBulkDeleteClick = () => {
    const selectedIds = Object.keys(selectedRowIds);
    const selectedData = selectedIds.map(index => data[index]);
    if (onBulkDelete) {
      onBulkDelete(selectedData, selectedIds);
    }
    handleActionsClose();
  };

  const handleBulkEditClick = () => {
    const selectedIds = Object.keys(selectedRowIds);
    const selectedData = selectedIds.map(index => data[index]);
    if (onBulkEdit) {
      onBulkEdit(selectedData, selectedIds);
    }
    handleActionsClose();
  };

  // Get selected count
  const selectedCount = Object.keys(selectedRowIds).length;

  return (
    <>
      {showRowSelection && (
        <TableRowSelection selected={Object.keys(selectedRowIds).length} />
      )}
      
      {/* Add button description if provided */}
      {addButtonDescription && showAddButton && handleAdd && (
        <Box sx={{ 
          p: 2, 
          background: 'linear-gradient(135deg, rgba(102, 126, 234, 0.05) 0%, rgba(118, 75, 162, 0.05) 100%)',
          borderRadius: 2,
          mb: 2,
          border: '1px solid',
          borderColor: 'primary.light',
        }}>
          <Stack direction="row" spacing={2} alignItems="center">
            <PlusOutlined style={{ fontSize: 24, color: theme.palette.primary.main }} />
            <Box flex={1}>
              <Typography variant="subtitle1" fontWeight={600} color="primary.main">
                {addButtonText}
              </Typography>
              <Typography variant="body2" color="text.secondary">
                {addButtonDescription}
              </Typography>
            </Box>
            <Button
              variant="contained"
              onClick={handleAdd}
              sx={{
                background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
                color: 'white',
                fontWeight: 600,
                px: 3,
                '&:hover': {
                  background: 'linear-gradient(135deg, #764ba2 0%, #667eea 100%)',
                  transform: 'translateY(-1px)',
                },
              }}
            >
              Create Now
            </Button>
          </Stack>
        </Box>
      )}
      
      <Stack spacing={3}>
        {/* Header Controls */}
        <Stack
          direction={matchDownSM ? "column" : "row"}
          spacing={1}
          justifyContent="space-between"
          alignItems="center"
          sx={{ p: 3, pb: 0 }}
        >
          {/* Left side - Search */}
          {showGlobalFilter && (
            <GlobalFilter
              preGlobalFilteredRows={preGlobalFilteredRows}
              globalFilter={globalFilter}
              setGlobalFilter={setGlobalFilter}
              size="small"
            />
          )}

          {/* Right side - Actions */}
          <Stack
            direction={matchDownSM ? "column" : "row"}
            alignItems="center"
            spacing={1}
          >
            {showSorting && (
              <SortingSelect
                sortBy={defaultSortBy.id}
                setSortBy={setSortBy}
                allColumns={allColumns}
              />
            )}

            {/* Actions Button */}
            {showActionsButton && selectedCount > 0 && (
              <>
                <Button
                  variant="contained"
                  color="primary"
                  endIcon={<KeyboardArrowDownIcon />}
                  onClick={handleActionsClick}
                  size="small"
                  disabled={selectedCount === 0}
                >
                  {actionsLabel} ({selectedCount})
                </Button>
                <Menu
                  anchorEl={actionsAnchorEl}
                  open={actionsMenuOpen}
                  onClose={handleActionsClose}
                  anchorOrigin={{
                    vertical: "bottom",
                    horizontal: "right",
                  }}
                  transformOrigin={{
                    vertical: "top",
                    horizontal: "right",
                  }}
                  PaperProps={{
                    sx: {
                      minWidth: 180,
                      mt: 1,
                      "& .MuiMenuItem-root": {
                        "& .MuiSvgIcon-root": {
                          fontSize: 18,
                          mr: 1.5,
                        },
                      },
                    },
                  }}
                >
                  {onBulkEdit && (
                    <MenuItem onClick={handleBulkEditClick}>
                      <EditTwoTone />
                      Edit Selected
                    </MenuItem>
                  )}
                  {onBulkDelete && (
                    <MenuItem onClick={handleBulkDeleteClick}>
                      <DeleteOutlined sx={{ color: "#ff5722" }} />
                      Delete Selected
                    </MenuItem>
                  )}
                  {customMenuItems.length > 0 && onBulkDelete && <Divider />}
                  {customMenuItems.map((item, index) => (
                    <MenuItem
                      key={index}
                      onClick={() => {
                        const selectedIds = Object.keys(selectedRowIds);
                        const selectedData = selectedIds.map(id => data[id]);
                        item.onClick(selectedData, selectedIds);
                        handleActionsClose();
                      }}
                      disabled={item.disabled}
                    >
                      {item.icon}
                      {item.label}
                    </MenuItem>
                  ))}
                </Menu>
              </>
            )}

            {/* Custom actions */}
            {customActions && customActions}

            {/* Add button - Enhanced styling based on variant */}
            {showAddButton && handleAdd && (
              <Button
                variant={addButtonVariant === "emphasized" ? "contained" : addButtonVariant}
                startIcon={<PlusOutlined />}
                onClick={handleAdd}
                size={addButtonVariant === "emphasized" ? "medium" : "small"}
                sx={addButtonVariant === "emphasized" ? {
                  background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
                  color: 'white',
                  fontWeight: 600,
                  px: 3,
                  py: 1,
                  boxShadow: '0 4px 14px 0 rgba(102, 126, 234, 0.4)',
                  '&:hover': {
                    background: 'linear-gradient(135deg, #764ba2 0%, #667eea 100%)',
                    boxShadow: '0 6px 20px rgba(102, 126, 234, 0.5)',
                    transform: 'translateY(-1px)',
                  },
                  transition: 'all 0.3s ease',
                } : {}}
              >
                {addButtonText}
              </Button>
            )}

            {/* CSV Export */}
            {showCSVExport && (
              <CSVExport
                data={
                  selectedFlatRows.length > 0
                    ? selectedFlatRows.map((d) => d.original)
                    : data
                }
                filename={csvFilename}
              />
            )}
          </Stack>
        </Stack>

        {/* Empty State with prominent Add button */}
        {data.length === 0 && showAddButton && handleAdd && (
          <Box
            sx={{
              textAlign: 'center',
              py: 8,
              px: 3,
              background: 'linear-gradient(135deg, rgba(102, 126, 234, 0.02) 0%, rgba(118, 75, 162, 0.02) 100%)',
              borderRadius: 2,
              border: '1px dashed',
              borderColor: 'divider',
            }}
          >
            <PlusOutlined style={{ fontSize: 48, color: theme.palette.primary.light, marginBottom: 16 }} />
            <Typography variant="h5" gutterBottom color="text.primary">
              {emptyMessage}
            </Typography>
            <Typography variant="body1" color="text.secondary" sx={{ mb: 4 }}>
              Get started by creating your first item
            </Typography>
            <Button
              variant="contained"
              startIcon={<PlusOutlined />}
              onClick={handleAdd}
              size="large"
              sx={{
                background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
                color: 'white',
                fontWeight: 600,
                px: 4,
                py: 1.5,
                fontSize: '1rem',
                boxShadow: '0 4px 14px 0 rgba(102, 126, 234, 0.4)',
                '&:hover': {
                  background: 'linear-gradient(135deg, #764ba2 0%, #667eea 100%)',
                  boxShadow: '0 6px 20px rgba(102, 126, 234, 0.5)',
                  transform: 'translateY(-2px)',
                },
                transition: 'all 0.3s ease',
              }}
            >
              {addButtonText}
            </Button>
          </Box>
        )}

        {/* Table */}
        {data.length > 0 && (
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
            {page.length > 0 ? (
              page.map((row, i) => {
                prepareRow(row);
                const rowProps = row.getRowProps();

                return (
                  <Fragment key={i}>
                    <TableRow
                      {...row.getRowProps()}
                      onClick={() => handleRowClick(row)}
                      sx={{
                        cursor: "pointer",
                        bgcolor: row.isSelected
                          ? alpha(theme.palette.primary.lighter, 0.35)
                          : "inherit",
                      }}
                    >
                      {row.cells.map((cell, i) => (
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
                    
                    {/* Expandable row content */}
                    {row.isExpanded && renderRowSubComponent &&
                      renderRowSubComponent({
                        row,
                        rowProps,
                        visibleColumns,
                        expanded,
                      })}
                  </Fragment>
                );
              })
            ) : (
              <TableRow>
                <TableCell colSpan={visibleColumns.length} align="center" sx={{ py: 4 }}>
                  {emptyMessage}
                </TableCell>
              </TableRow>
            )}
            
            {/* Pagination */}
            {showPagination && rows.length > 0 && (
              <TableRow sx={{ "&:hover": { bgcolor: "transparent !important" } }}>
                <TableCell sx={{ p: 2, py: 3 }} colSpan={visibleColumns.length}>
                  <TablePagination
                    gotoPage={gotoPage}
                    rows={rows}
                    setPageSize={setPageSize}
                    pageSize={pageSize}
                    pageIndex={pageIndex}
                  />
                </TableCell>
              </TableRow>
            )}
          </TableBody>
        </Table>
        )}
      </Stack>
      
      {/* Floating Action Button */}
      {showFloatingActionButton && showAddButton && handleAdd && (
        <Tooltip title={addButtonText} placement="left">
          <Fab
            color="primary"
            aria-label="add"
            onClick={handleAdd}
            sx={{
              position: 'fixed',
              bottom: 24,
              right: 24,
              background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
              color: 'white',
              width: 64,
              height: 64,
              boxShadow: '0 6px 20px rgba(102, 126, 234, 0.4)',
              '&:hover': {
                background: 'linear-gradient(135deg, #764ba2 0%, #667eea 100%)',
                boxShadow: '0 8px 28px rgba(102, 126, 234, 0.5)',
                transform: 'scale(1.1)',
              },
              transition: 'all 0.3s ease',
              zIndex: theme.zIndex.speedDial,
            }}
          >
            <PlusOutlined style={{ fontSize: 28 }} />
          </Fab>
        </Tooltip>
      )}
    </>
  );
}

AppTable.propTypes = {
  columns: PropTypes.array.isRequired,
  data: PropTypes.array.isRequired,
  renderRowSubComponent: PropTypes.func,
  handleAdd: PropTypes.func,
  addButtonText: PropTypes.string,
  showAddButton: PropTypes.bool,
  showCSVExport: PropTypes.bool,
  showSorting: PropTypes.bool,
  showGlobalFilter: PropTypes.bool,
  showRowSelection: PropTypes.bool,
  showPagination: PropTypes.bool,
  initialPageSize: PropTypes.number,
  initialSortBy: PropTypes.object,
  initialHiddenColumns: PropTypes.array,
  responsiveHiddenColumns: PropTypes.array,
  csvFilename: PropTypes.string,
  tableProps: PropTypes.object,
  onRowClick: PropTypes.func,
  customActions: PropTypes.node,
  emptyMessage: PropTypes.string,
  // Actions props
  showActionsButton: PropTypes.bool,
  actionsLabel: PropTypes.string,
  onBulkDelete: PropTypes.func,
  onBulkEdit: PropTypes.func,
  customMenuItems: PropTypes.arrayOf(
    PropTypes.shape({
      label: PropTypes.string.isRequired,
      icon: PropTypes.node,
      onClick: PropTypes.func.isRequired,
      disabled: PropTypes.bool,
    })
  ),
  // Enhanced add button props
  showFloatingActionButton: PropTypes.bool,
  addButtonVariant: PropTypes.oneOf(['emphasized', 'contained', 'outlined']),
  addButtonDescription: PropTypes.string,
};

// ==============================|| HELPER COMPONENTS ||============================== //

// Selection components for easy reuse
export const SelectionCell = ({ row }) => (
  <IndeterminateCheckbox {...row.getToggleRowSelectedProps()} />
);

export const SelectionHeader = ({ getToggleAllPageRowsSelectedProps }) => (
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

export default AppTable;