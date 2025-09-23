import React, { useMemo, useState, useEffect, useCallback, useRef } from 'react';
import PropTypes from 'prop-types';
import { useTheme, alpha } from '@mui/material/styles';
import {
  Box,
  Button,
  Stack,
  Table,
  TableBody,
  TableCell,
  TableFooter,
  TableHead,
  TableRow,
  Typography,
  CircularProgress,
} from '@mui/material';

// Third-party removed update import as it's no longer needed
import {
  useExpanded,
  useFilters,
  useGroupBy,
  useGlobalFilter,
  usePagination,
  useRowSelect,
  useSortBy,
  useTable,
} from 'react-table';

// Project imports
import ActionButton from 'components/ActionButton';
import {
  HidingSelect,
  HeaderSort,
  TablePagination,
  TableRowSelection,
  CSVExport,
  EmptyTable,
} from 'components/third-party/ReactTable';
import {
  renderFilterTypes,
  GlobalFilter,
  DefaultColumnFilter,
} from 'utils/react-table';

// Icons
import {
  DownOutlined,
  GroupOutlined,
  RightOutlined,
  UngroupOutlined,
  PlusOutlined,
  UploadOutlined,
  ReloadOutlined,
} from '@ant-design/icons';

// Local imports
import { ColumnCell } from './ColumnCell';

/**
 * Optimized ReactTable component for participants data
 */
const ReactTable = React.memo(({
  columns,
  data,
  handleCRUD,
  csvImportLoading,
  globalLoading,
  onSelectionChange,
  onEmailAccess,
  editableRowIndex,
  setEditableRowIndex,
  onRefresh
}) => {
  const { handleDialog } = handleCRUD;
  const theme = useTheme();
  
  // Memoized filter types
  const filterTypes = useMemo(() => renderFilterTypes, []);
  
  // Edit state management
  const [editValues, setEditValues] = useState({});
  const editValuesRef = useRef({});

  // Clear edit values when entering edit mode for a new row
  useEffect(() => {
    setEditValues({});
    editValuesRef.current = {};
  }, [editableRowIndex]);

  // Update field handler
  const updateField = useCallback((field, value) => {
    editValuesRef.current = { ...editValuesRef.current, [field]: value };
    setEditValues(prev => ({ ...prev, [field]: value }));
  }, []);

  // Submit handler for edits
  const handleSubmit = useCallback(async () => {
    const currentEditValues = editValuesRef.current;
    
    if (editableRowIndex !== null && data[editableRowIndex] && Object.keys(currentEditValues).length > 0) {
      const currentParticipant = data[editableRowIndex].participant;
      const updatedParticipant = { ...currentParticipant, ...currentEditValues };
      
      try {
        await handleCRUD.handleUpdate(updatedParticipant);
        setEditValues({});
        editValuesRef.current = {};
      } catch (error) {
        console.error('Update failed:', error);
      }
    }
  }, [editableRowIndex, data, handleCRUD]);

  // Enhanced table columns with inline editing
  const tableColumns = useMemo(() => columns.map(column => {
    // Add inline editing for specific fields
    if (column.accessor === "participant.firstName") {
      return {
        ...column,
        Cell: ({ row, value }) => {
          const isEditable = row.index === editableRowIndex;
          return isEditable ? (
            <input 
              type="text" 
              defaultValue={value} 
              onChange={(e) => updateField('firstName', e.target.value)}
              onBlur={(e) => updateField('firstName', e.target.value)}
              style={{ 
                width: '100%', 
                padding: '4px', 
                fontSize: '14px',
                border: '1px solid #ddd',
                borderRadius: '4px'
              }}
            />
          ) : (
            <span>{value}</span>
          );
        }
      };
    }
    
    if (column.accessor === "participant.lastName") {
      return {
        ...column,
        Cell: ({ row, value }) => {
          const isEditable = row.index === editableRowIndex;
          return isEditable ? (
            <input 
              type="text" 
              defaultValue={value} 
              onChange={(e) => updateField('lastName', e.target.value)}
              onBlur={(e) => updateField('lastName', e.target.value)}
              style={{ 
                width: '100%', 
                padding: '4px', 
                fontSize: '14px',
                border: '1px solid #ddd',
                borderRadius: '4px'
              }}
            />
          ) : (
            <span>{value}</span>
          );
        }
      };
    }
    
    if (column.accessor === "participant.email") {
      return {
        ...column,
        Cell: ({ row, value }) => {
          const isEditable = row.index === editableRowIndex;
          return isEditable ? (
            <input 
              type="email" 
              defaultValue={value} 
              onChange={(e) => updateField('email', e.target.value)}
              onBlur={(e) => updateField('email', e.target.value)}
              style={{ 
                width: '100%', 
                padding: '4px', 
                fontSize: '14px',
                border: '1px solid #ddd',
                borderRadius: '4px'
              }}
            />
          ) : (
            <span>{value}</span>
          );
        }
      };
    }

    if (column.accessor === "participant.notes") {
      return {
        ...column,
        Cell: ({ row, value }) => {
          const isEditable = row.index === editableRowIndex;
          return isEditable ? (
            <input 
              type="text" 
              defaultValue={value || ''} 
              onChange={(e) => updateField('notes', e.target.value)}
              onBlur={(e) => updateField('notes', e.target.value)}
              style={{ 
                width: '100%', 
                padding: '4px', 
                fontSize: '14px',
                border: '1px solid #ddd',
                borderRadius: '4px'
              }}
            />
          ) : (
            <span>{value || ''}</span>
          );
        }
      };
    }

    if (column.accessor === "participant.parentGroup") {
      return {
        ...column,
        Cell: ({ row, value }) => {
          const isEditable = row.index === editableRowIndex;
          const displayValue = typeof value === 'object' && value !== null 
            ? (value.name || value.title || value.groupName || value.company || 'Unknown Company')
            : (value || '');
          
          return isEditable ? (
            <input 
              type="text" 
              defaultValue={displayValue !== 'N/A' ? displayValue : ''} 
              onChange={(e) => updateField('parentGroup', e.target.value)}
              onBlur={(e) => updateField('parentGroup', e.target.value)}
              style={{ 
                width: '100%', 
                padding: '4px', 
                fontSize: '14px',
                border: '1px solid #ddd',
                borderRadius: '4px'
              }}
            />
          ) : (
            <span>{displayValue === '' ? 'N/A' : displayValue}</span>
          );
        }
      };
    }
    
    return column;
  }), [columns, editableRowIndex, updateField]);

  // Default column configuration
  const defaultColumn = useMemo(
    () => ({
      Filter: DefaultColumnFilter,
      minWidth: 30,
      width: 120,
      maxWidth: 400,
    }),
    []
  );

  // Initial state configuration
  const initialState = useMemo(
    () => ({
      pageIndex: 0,
      pageSize: 25,
      hiddenColumns: ['id', 'participant.toolAccesses'],
      sortBy: [{ id: 'participant.firstName', desc: false }],
    }),
    []
  );

  // Table instance
  const {
    getTableProps,
    getTableBodyProps,
    headerGroups,
    footerGroups,
    rows,
    page,
    prepareRow,
    gotoPage,
    setPageSize,
    setHiddenColumns,
    allColumns,
    state: {
      globalFilter,
      hiddenColumns,
      pageIndex,
      pageSize,
      selectedRowIds,
    },
    preGlobalFilteredRows,
    setGlobalFilter,
    selectedFlatRows,
  } = useTable(
    {
      columns: tableColumns,
      data,
      defaultColumn,
      initialState,
      filterTypes,
      editableRowIndex,
      setEditableRowIndex,
    },
    useGlobalFilter,
    useFilters,
    useGroupBy,
    useSortBy,
    useExpanded,
    usePagination,
    useRowSelect,
    (hooks) => {
      hooks.allColumns.push((columns) => [
        ...columns,
        {
          accessor: "edit",
          id: "edit",
          Footer: "Edit",
          Header: "Edit",
          disableFilters: true,
          disableSortBy: true,
          disableGroupBy: true,
          groupByBoundary: true,
          Cell: (props) => (
            <ColumnCell
              {...props}
              handleSubmit={handleSubmit}
              handleCRUD={handleCRUD}
              setEditableRowIndex={setEditableRowIndex}
              editableRowIndex={editableRowIndex}
            />
          ),
        },
      ]);
    }
  );

  // Column reorder functionality removed

  // CSV export headers
  const headers = useMemo(() => {
    const result = [];
    allColumns.forEach((item) => {
      if (
        !hiddenColumns?.includes(item.id) &&
        item.id !== "selection" &&
        item.id !== "edit"
      ) {
        result.push({
          label: typeof item.Header === "string" ? item.Header : "id",
          key: item.id,
        });
      }
    });
    return result;
  }, [allColumns, hiddenColumns]);

  // Selection tracking
  const selectedIndex = Object.keys(selectedRowIds);
  const selectedParticipants = useMemo(
    () => selectedIndex.map((index) => data[index]),
    [selectedIndex, data]
  );
  const selectedIds = useMemo(
    () => selectedIndex.map((index) => data[index]?.id),
    [selectedIndex, data]
  );

  // Use ref to store the latest onSelectionChange callback
  const onSelectionChangeRef = useRef(onSelectionChange);
  onSelectionChangeRef.current = onSelectionChange;

  // Notify parent component of selection changes
  useEffect(() => {
    if (onSelectionChangeRef.current) {
      onSelectionChangeRef.current({ selectedParticipants, selectedIds });
    }
  }, [selectedRowIds]); // Only depend on selectedRowIds to avoid loops

  const isEmpty = !data || data.length === 0;
  const showLoadingState = (csvImportLoading || (globalLoading && isEmpty));

  return (
    <Box sx={{ 
      flex: 1, 
      display: 'flex', 
      flexDirection: 'column',
      minHeight: 0,
      overflow: 'hidden'
    }}>
      {!isEmpty && <TableRowSelection selected={Object.keys(selectedRowIds).length} />}
      <Box sx={{ 
        flex: 1, 
        display: 'flex', 
        flexDirection: 'column',
        minHeight: 0,
        overflow: 'hidden'
      }}>
        {/* Toolbar */}
        <Stack
          direction="row"
          justifyContent="space-between"
          sx={{ p: 2, pb: 1, flexShrink: 0 }}
        >
          <Stack direction="row" spacing={2}>
            {!isEmpty && (
              <>
                <GlobalFilter
                  preGlobalFilteredRows={preGlobalFilteredRows}
                  globalFilter={globalFilter}
                  setGlobalFilter={setGlobalFilter}
                  size="small"
                />
                <ActionButton
                  label="Actions"
                  handleCRUD={handleCRUD}
                  iDs={selectedIds}
                  onEmailAccess={onEmailAccess}
                />
              </>
            )}
          </Stack>
          
          <Stack direction="row" spacing={2}>
            {!isEmpty && (
              <Box sx={{ display: { xs: "none", sm: "flex" } }}>
                <HidingSelect
                  hiddenColumns={hiddenColumns}
                  setHiddenColumns={setHiddenColumns}
                  allColumns={allColumns}
                />
              </Box>
            )}

            <Button
              onClick={handleDialog}
              variant="contained"
              startIcon={<PlusOutlined />}
              size="small"
              aria-label="add-participant"
              sx={{
                '& .MuiButton-startIcon': {
                  mr: { xs: 0, sm: 1 }
                }
              }}
            >
              <Box component="span" sx={{ display: { xs: 'none', sm: 'inline' } }}>
                Add Participant
              </Box>
            </Button>

            <Button
              onClick={handleCRUD.handleAddMultiple}
              variant="outlined"
              startIcon={<GroupOutlined />}
              size="small"
              aria-label="add-multiple-participants"
              sx={{
                '& .MuiButton-startIcon': {
                  mr: { xs: 0, sm: 1 }
                }
              }}
            >
              <Box component="span" sx={{ display: { xs: 'none', sm: 'inline' } }}>
                Add Multiple
              </Box>
            </Button>

            <Button
              onClick={handleCRUD.handleCsvImport}
              variant="outlined"
              startIcon={<UploadOutlined />}
              size="small"
              disabled={csvImportLoading}
              aria-label="import-csv"
              sx={{
                '& .MuiButton-startIcon': {
                  mr: { xs: 0, sm: 1 }
                }
              }}
            >
              <Box component="span" sx={{ display: { xs: 'none', sm: 'inline' } }}>
                Import CSV
              </Box>
            </Button>
            
            {onRefresh && (
              <Button
                onClick={onRefresh}
                variant="outlined"
                startIcon={<ReloadOutlined />}
                size="small"
                aria-label="refresh-data"
                sx={{
                  '& .MuiButton-startIcon': {
                    mr: { xs: 0, sm: 1 }
                  }
                }}
              >
                <Box component="span" sx={{ display: { xs: 'none', sm: 'inline' } }}>
                  Refresh
                </Box>
              </Button>
            )}

            {!isEmpty && (
              <CSVExport
                data={
                  selectedFlatRows.length > 0
                    ? selectedFlatRows
                        .map((d) => d.original)
                        .filter((d) => d !== undefined)
                    : data
                }
                filename="participants-export.csv"
                headers={headers}
              />
            )}
          </Stack>
        </Stack>

        {/* Table Container */}
        <Box sx={{ 
          flex: 1, 
          overflow: 'auto',
          minHeight: 0
        }}>
          {showLoadingState ? (
            <Box
              sx={{
                display: 'flex',
                flexDirection: 'column',
                alignItems: 'center',
                justifyContent: 'center',
                minHeight: 400,
                p: 3,
                bgcolor: 'transparent'
              }}
            >
              <CircularProgress size={60} sx={{ mb: 2 }} />
              <Typography 
                variant="h6" 
                color="primary" 
                sx={{ mb: 1, textAlign: 'center' }}
              >
                Importing participants...
              </Typography>
              <Typography 
                variant="body2" 
                color="text.secondary" 
                sx={{ textAlign: 'center', maxWidth: 300 }}
              >
                Please wait while we process your CSV file and add the participants to your project.
              </Typography>
            </Box>
          ) : isEmpty ? (
            <Box
              sx={{
                display: 'flex',
                flexDirection: 'column',
                alignItems: 'center',
                justifyContent: 'center',
                minHeight: 400,
                p: 3,
                bgcolor: 'transparent'
              }}
            >
              <svg width="120" height="100" viewBox="0 0 184 152" aria-hidden focusable="false">
                <g fill="none" fillRule="evenodd">
                  <g transform="translate(24 31.67)">
                    <ellipse cx="67.797" cy="106.89" rx="67.797" ry="12.668" fill="#E0E0E0" />
                    <path
                      d="M122.034 69.674L98.109 40.229c-1.148-1.386-2.826-2.225-4.593-2.225h-51.44c-1.766 0-3.444.839-4.592 2.225L13.56 69.674v15.383h108.475V69.674z"
                      fill="#FAFAFA"
                    />
                    <path
                      d="M33.83 0h67.933a4 4 0 0 1 4 4v93.344a4 4 0 0 1-4 4H33.83a4 4 0 0 1-4-4V4a4 4 0 0 1 4-4z"
                      fill="#F5F5F5"
                    />
                    <path
                      d="M42.678 9.953h50.237a2 2 0 0 1 2 2V36.91a2 2 0 0 1-2 2H42.678a2 2 0 0 1-2-2V11.953a2 2 0 0 1 2-2zM42.94 49.767h49.713a2.262 2.262 0 1 1 0 4.524H42.94a2.262 2.262 0 0 1 0-4.524zM42.94 61.53h49.713a2.262 2.262 0 1 1 0 4.525H42.94a2.262 2.262 0 0 1 0-4.525zM121.813 105.032c-.775 3.071-3.497 5.36-6.735 5.36H20.515c-3.238 0-5.96-2.29-6.734-5.36a7.309 7.309 0 0 1-.222-1.79V69.675h26.318c2.907 0 5.25 2.448 5.25 5.42v.04c0 2.971 2.37 5.37 5.277 5.37h34.785c2.907 0 5.277-2.421 5.277-5.393V75.1c0-2.972 2.343-5.426 5.25-5.426h26.318v33.569c0 .617-.077 1.216-.221 1.789z"
                      fill="#EEEEEE"
                    />
                  </g>
                </g>
              </svg>
              <Typography 
                variant="h6" 
                color="text.secondary" 
                sx={{ mt: 2, textAlign: 'center' }}
              >
                No participants found
              </Typography>
              <Typography 
                variant="body2" 
                color="text.secondary" 
                sx={{ mt: 1, textAlign: 'center', maxWidth: 300 }}
              >
                Get started by adding participants to your project using the "Add Participant" button above.
              </Typography>
            </Box>
          ) : (
            <Table {...getTableProps()}>
              <TableHead sx={{ borderTopWidth: 2 }}>
                {headerGroups.map((headerGroup, i) => {
                  const { key, ...headerGroupProps } = headerGroup.getHeaderGroupProps();
                  return (
                    <TableRow key={i} {...headerGroupProps}>
                    {headerGroup.headers.map((column, index) => {
                      const groupIcon = column.isGrouped ? (
                        <UngroupOutlined />
                      ) : (
                        <GroupOutlined />
                      );
                      
                      const { key: headerKey, ...headerProps } = column.getHeaderProps([
                        { className: column.className },
                      ]);
                      
                      return (
                        <TableCell
                          key={`header-cell-${index}`}
                          {...headerProps}
                        >
                          <Stack
                            direction="row"
                            spacing={1.15}
                            alignItems="center"
                            sx={{ display: "inline-flex" }}
                          >
                            <HeaderSort column={column} sort />
                            
                            <Box sx={{ position: "relative" }}>
                              {column.canGroupBy ? (
                                <Box
                                  sx={{
                                    color: column.isGrouped ? "error.main" : "primary.main",
                                    fontSize: "1rem",
                                  }}
                                  {...column.getGroupByToggleProps()}
                                >
                                  {groupIcon}
                                </Box>
                              ) : null}
                            </Box>
                          </Stack>
                          
                          {column.canFilter ? column.render("Filter") : null}
                        </TableCell>
                      );
                    })}
                    </TableRow>
                  );
                })}
              </TableHead>

            <TableBody {...getTableBodyProps()} className="striped">
              {page.map((row, i) => {
                prepareRow(row);
                const { key, ...rowProps } = row.getRowProps();
                return (
                  <TableRow
                    key={i}
                    {...rowProps}
                    onClick={() => {
                      row.toggleRowSelected();
                    }}
                    sx={{
                      cursor: "pointer",
                      bgcolor: row.isSelected ? alpha(theme.palette.primary.lighter, 0.35) : "inherit",
                    }}
                  >
                    {row.cells.map((cell, index) => {
                      let bgcolor = "inherit";
                      if (cell.isGrouped) bgcolor = "success.lighter";
                      if (cell.isAggregated) bgcolor = "warning.lighter";
                      if (cell.isPlaceholder) bgcolor = "error.lighter";
                      if (cell.isRepeatedValue) bgcolor = "grey.400";

                      const collapseIcon = row.isExpanded ? (
                        <DownOutlined />
                      ) : (
                        <RightOutlined />
                      );

                      const { key: cellKey, ...cellProps } = cell.getCellProps([
                        { className: cell.column.className },
                      ]);
                      
                      return (
                        <TableCell
                          key={`body-cell-${index}`}
                          {...cellProps}
                          sx={{ bgcolor }}
                        >
                          {cell.isGrouped ? (
                            <Box sx={{ display: "flex", alignItems: "center" }}>
                              <Box
                                {...row.getToggleRowExpandedProps()}
                                sx={{ color: "primary.main", mr: 1 }}
                              >
                                {collapseIcon}
                              </Box>
                              <Box>{cell.render("Cell")}</Box>
                              <Box sx={{ ml: 1 }}>({row.subRows.length})</Box>
                            </Box>
                          ) : cell.isAggregated ? (
                            cell.render("Aggregated")
                          ) : cell.isPlaceholder ? null : (
                            cell.render("Cell")
                          )}
                        </TableCell>
                      );
                    })}
                  </TableRow>
                );
              })}
            </TableBody>

              <TableFooter sx={{ borderBottomWidth: 2 }}>
                {footerGroups.map((group, i) => {
                  const { key, ...footerGroupProps } = group.getFooterGroupProps();
                  return (
                    <TableRow key={i} {...footerGroupProps}>
                      {group.headers.map((column) => {
                        const { key: footerKey, ...footerProps } = column.getFooterProps([
                          { className: column.className },
                        ]);
                        return (
                          <TableCell
                            key={column.id}
                            {...footerProps}
                          >
                            {column.render("Footer")}
                          </TableCell>
                        );
                      })}
                    </TableRow>
                  );
                })}
              </TableFooter>
            </Table>
          )}
        </Box>

        {/* Pagination */}
        {!isEmpty && (
          <Box sx={{ flexShrink: 0, p: 2 }}>
            <TablePagination
              gotoPage={gotoPage}
              rows={rows}
              setPageSize={setPageSize}
              pageIndex={pageIndex}
              pageSize={pageSize}
            />
          </Box>
        )}
      </Box>
    </Box>
  );
});

ReactTable.propTypes = {
  columns: PropTypes.array.isRequired,
  data: PropTypes.array.isRequired,
  handleCRUD: PropTypes.object.isRequired,
  csvImportLoading: PropTypes.bool,
  globalLoading: PropTypes.bool,
  onSelectionChange: PropTypes.func,
  onEmailAccess: PropTypes.func,
  editableRowIndex: PropTypes.number,
  setEditableRowIndex: PropTypes.func,
};

ReactTable.displayName = 'ReactTable';

export default ReactTable;