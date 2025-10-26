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
  TextField,
  Tooltip,
  IconButton,
  Chip,
} from '@mui/material';
import { Visibility, Edit, Delete, Check, Close } from '@mui/icons-material';

// Third-party
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
  CSVExport,
  EmptyTable,
  IndeterminateCheckbox,
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
} from '@ant-design/icons';

// Local imports
import { ColumnCell } from './ColumnCell';
import ToolAccessCell from './ToolAccessCell';
import RoleDropdownCell from './RoleDropdownCell';
import GroupDropdownCell from './GroupDropdownCell';

// Editable Cell Component - simple and self-contained
const EditableCell = ({ value, row, column, updateMyData, editableRowIndex }) => {
  const isEditing = editableRowIndex === row.index;
  const [localValue, setLocalValue] = React.useState(value || '');

  // Update local value when entering edit mode or value changes
  React.useEffect(() => {
    setLocalValue(value || '');
  }, [value, editableRowIndex]);

  if (!isEditing) {
    return <span>{value || ''}</span>;
  }

  return (
    <TextField
      value={localValue}
      onChange={(e) => {
        setLocalValue(e.target.value);
        updateMyData(column.id, e.target.value);
      }}
      size="small"
      fullWidth
      variant="standard"
      sx={{
        '& .MuiInputBase-input': {
          padding: '4px 0'
        }
      }}
    />
  );
};

/**
 * FIXED ReactTable component - inline column definitions for simplicity
 * Note: React.memo removed to fix closure issues with editValues in handleSubmit
 */
const ReactTable = ({
  data,
  onAdd,
  onAddMultiple,
  onCsvImport,
  onUpdate,
  onRemove,
  onRemoveMany,
  csvImportLoading,
  globalLoading,
  onSelectionChange,
  onEmailAccess,
  editableRowIndex,
  setEditableRowIndex,
  onRefresh,
  onViewParticipant,
  hideToolbar = false
}) => {
  const theme = useTheme();
  
  // Stable filter types
  const filterTypes = useMemo(() => renderFilterTypes, []);
  
  // Edit state (simplified)
  const [editValues, setEditValues] = useState({});
  const [isSaving, setIsSaving] = useState(false);

  // Use ref to always access current editValues in callbacks (prevents closure issues)
  const editValuesRef = useRef(editValues);
  editValuesRef.current = editValues;

  // Clear edit values when row changes
  useEffect(() => {
    setEditValues({});
  }, [editableRowIndex]);

  // Stable update handler
  const updateField = useCallback((field, value) => {
    setEditValues(prev => ({ ...prev, [field]: value }));
  }, []);

  // Move handleSubmit here before tableColumns to avoid reference error
  const handleSubmit = useCallback(async () => {
    // Get current editValues from ref (always up-to-date, no closure issues)
    const currentEditValues = editValuesRef.current;

    if (editableRowIndex !== null && data[editableRowIndex] && Object.keys(currentEditValues).length > 0) {
      const currentRow = data[editableRowIndex];
      const participantId = currentRow.participant?.id;

      if (!participantId) {
        console.error('No participant ID found');
        return;
      }

      // Extract field names from nested accessors (e.g., "participant.firstName" -> "firstName")
      const updates = {};
      Object.keys(currentEditValues).forEach(key => {
        const fieldName = key.replace('participant.', '');
        updates[fieldName] = currentEditValues[key];
      });

      try {
        setIsSaving(true);
        await onUpdate(participantId, updates);
        setEditValues({});
        setEditableRowIndex(null);
      } catch (error) {
        console.error('Update failed:', error);
      } finally {
        setIsSaving(false);
      }
    }
  }, [editableRowIndex, data, onUpdate, setEditableRowIndex]);

  // Column definitions with stable memoization
  const tableColumns = useMemo(() => [
    {
      title: "Row Selection",
      id: "selection",
      Header: ({ getToggleAllPageRowsSelectedProps }) => (
        <IndeterminateCheckbox indeterminate {...getToggleAllPageRowsSelectedProps()} />
      ),
      Footer: "#",
      accessor: "selection",
      groupByBoundary: true,
      Cell: ({ row }) => <IndeterminateCheckbox {...row.getToggleRowSelectedProps()} />,
      disableSortBy: true,
      disableFilters: true,
      disableGroupBy: true,
      Aggregated: () => null,
    },
    {
      Header: "id",
      Footer: "id",
      accessor: "id",
      className: "cell-center",
      disableFilters: true,
      disableGroupBy: true,
    },
    {
      Header: "First Name",
      Footer: "First Name",
      accessor: "participant.firstName",
      dataType: "text",
      disableGroupBy: true,
      disableFilters: true,
      aggregate: "count",
      Aggregated: ({ value }) => `${value} Person`,
      Cell: ({ value, row, column }) => (
        <EditableCell
          value={value}
          row={row}
          column={column}
          updateMyData={updateField}
          editableRowIndex={editableRowIndex}
        />
      ),
    },
    {
      Header: "Last Name",
      Footer: "Last Name",
      accessor: "participant.lastName",
      dataType: "text",
      disableFilters: true,
      disableGroupBy: true,
      Cell: ({ value, row, column }) => (
        <EditableCell
          value={value}
          row={row}
          column={column}
          updateMyData={updateField}
          editableRowIndex={editableRowIndex}
        />
      ),
    },
    {
      Header: "Role",
      Footer: "Role",
      dataType: "text",
      accessor: "participant.role.title",
      disableFilters: true,
      disableGroupBy: true,
      Cell: ({ row }) => {
        const roleObject = row.original.participant?.role;
        return <RoleDropdownCell value={roleObject} row={row} onUpdate={onRefresh} />;
      },
    },
    {
      Header: "Email",
      Footer: "Email",
      accessor: "participant.email",
      dataType: "text",
      disableFilters: true,
      disableGroupBy: true,
      Cell: ({ value, row, column }) => (
        <EditableCell
          value={value}
          row={row}
          column={column}
          updateMyData={updateField}
          editableRowIndex={editableRowIndex}
        />
      ),
    },
    {
      Header: "Company",
      Footer: "Company",
      accessor: "participant.parentGroup",
      dataType: "text",
      disableFilters: true,
      disableGroupBy: true,
      Cell: ({ value }) => {
        if (typeof value === 'object' && value !== null) {
          return value.name || value.title || value.groupName || value.company || 'Unknown Company';
        }
        return value || 'N/A';
      },
    },
    {
      Header: "Training Recipient",
      Footer: "Training Recipient",
      accessor: "training_recipient.name",
      dataType: "text",
      disableFilters: true,
      disableGroupBy: true,
      Cell: ({ value, row }) => {
        // Try to get TR name from enrollment first, then fall back to participant
        const trName = value || row.original?.training_recipient?.name || row.original?.participant?.training_recipient?.name;
        return trName || 'N/A';
      },
    },
    {
      Header: "Group",
      Footer: "Group",
      accessor: (row) => {
        try {
          return row?.group?.[0] || null;
        } catch (error) {
          return null;
        }
      },
      id: "groupName",
      dataType: "text",
      disableFilters: true,
      disableGroupBy: true,
      Cell: ({ row, value }) => {
        return <GroupDropdownCell value={value} row={row} onUpdate={onRefresh} />;
      },
    },
    {
      Header: "Notes",
      Footer: "Notes",
      dataType: "text",
      accessor: "participant.notes",
      disableGroupBy: true,
      disableFilters: true,
      Cell: ({ value, row, column }) => {
        let displayValue = value;
        if (typeof value === 'object' && value !== null) {
          displayValue = value.text || value.content || value.note || JSON.stringify(value);
        }
        return (
          <EditableCell
            value={displayValue || ''}
            row={row}
            column={column}
            updateMyData={updateField}
            editableRowIndex={editableRowIndex}
          />
        );
      },
    },
    {
      Header: "Tool Access",
      Footer: "Tool Access",
      accessor: "participant.toolAccesses",
      dataType: "text",
      disableFilters: true,
      disableGroupBy: true,
      show: false,
      Cell: ({ value, row }) => {
        return <ToolAccessCell value={value} row={row} onRefresh={onRefresh} />;
      },
    },
    {
      Header: "Actions",
      Footer: "Actions",
      accessor: "actions",
      disableFilters: true,
      disableGroupBy: true,
      disableSortBy: true,
      Cell: ({ row }) => {
        const isEditing = editableRowIndex === row.index;

        const handleEdit = () => {
          if (isEditing) {
            // Cancel edit mode
            setEditableRowIndex(null);
          } else {
            // Enter edit mode
            setEditableRowIndex(row.index);
          }
        };

        const handleSave = async () => {
          try {
            await handleSubmit();
            setEditableRowIndex(null);
          } catch (error) {
            console.error('[Actions] Save failed:', error);
          }
        };

        const handleDelete = () => {
          const participantId = row.original?.id;
          if (participantId && onRemove) {
            onRemove(participantId);
          }
        };

        // If row is being edited, show save/cancel buttons
        if (isEditing) {
          return (
            <Stack direction="row" spacing={0.5} justifyContent="flex-start">
              <Tooltip title={isSaving ? "Saving..." : "Save Changes"}>
                <span>
                  <IconButton
                    size="small"
                    color="success"
                    onClick={handleSave}
                    disabled={isSaving}
                    sx={{
                      '&:hover': {
                        backgroundColor: 'success.lighter'
                      }
                    }}
                  >
                    {isSaving ? (
                      <CircularProgress size={16} color="success" />
                    ) : (
                      <Check fontSize="small" />
                    )}
                  </IconButton>
                </span>
              </Tooltip>

              <Tooltip title="Cancel">
                <span>
                  <IconButton
                    size="small"
                    color="error"
                    onClick={() => setEditableRowIndex(null)}
                    disabled={isSaving}
                    sx={{
                      '&:hover': {
                        backgroundColor: 'error.lighter'
                      }
                    }}
                  >
                    <Close fontSize="small" />
                  </IconButton>
                </span>
              </Tooltip>
            </Stack>
          );
        }

        return (
          <Stack direction="row" spacing={0.5} justifyContent="flex-start">
            <Tooltip title="View Details">
              <IconButton
                size="small"
                color="primary"
                onClick={() => onViewParticipant && onViewParticipant(row.original)}
                sx={{
                  '&:hover': {
                    backgroundColor: 'primary.lighter'
                  }
                }}
              >
                <Visibility fontSize="small" />
              </IconButton>
            </Tooltip>

            <Tooltip title="Edit Participant">
              <IconButton
                size="small"
                color="info"
                onClick={handleEdit}
                sx={{
                  '&:hover': {
                    backgroundColor: 'info.lighter'
                  }
                }}
              >
                <Edit fontSize="small" />
              </IconButton>
            </Tooltip>

            <Tooltip title="Delete Participant">
              <IconButton
                size="small"
                color="error"
                onClick={handleDelete}
                sx={{
                  '&:hover': {
                    backgroundColor: 'error.lighter'
                  }
                }}
              >
                <Delete fontSize="small" />
              </IconButton>
            </Tooltip>
          </Stack>
        );
      },
    },
  ], [editableRowIndex, updateField, onRefresh, onViewParticipant, setEditableRowIndex, onRemove, handleSubmit, isSaving]);

  const tableData = useMemo(() => {
    return data;
  }, [data]);

  // Default column
  const defaultColumn = useMemo(() => ({
    Filter: DefaultColumnFilter,
    minWidth: 30,
    width: 120,
    maxWidth: 400,
  }), []);

  // Initial state
  const initialState = useMemo(() => ({
    pageIndex: 0,
    pageSize: 25,
    hiddenColumns: ['id', 'participant.toolAccesses'],
    sortBy: [{ id: 'participant.firstName', desc: false }],
  }), []);

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
      data: tableData,
      defaultColumn,
      initialState,
      filterTypes,
      editableRowIndex,
      setEditableRowIndex,
      updateField,
    },
    useGlobalFilter,
    useFilters,
    useGroupBy,
    useSortBy,
    useExpanded,
    usePagination,
    useRowSelect
  );

  // CSV headers
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

  // FIXED Selection tracking - stable references
  const selectedIndex = useMemo(() => Object.keys(selectedRowIds), [selectedRowIds]);
  const selectedParticipants = useMemo(
    () => selectedIndex.map((index) => data[index]),
    [selectedIndex, data]
  );
  const selectedIds = useMemo(
    () => selectedIndex.map((index) => data[index]?.id),
    [selectedIndex, data]
  );

  // Stable callback ref
  const onSelectionChangeRef = useRef(onSelectionChange);
  onSelectionChangeRef.current = onSelectionChange;

  // FIXED Selection effect with stable dependencies
  useEffect(() => {
    if (onSelectionChangeRef.current) {
      onSelectionChangeRef.current({ selectedParticipants, selectedIds });
    }
  }, [selectedRowIds]); // Only selectedRowIds dependency

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
      <Box sx={{
        flex: 1,
        display: 'flex',
        flexDirection: 'column',
        minHeight: 0,
        overflow: 'hidden'
      }}>
        {/* Toolbar - hidden when dialog is open to prevent autofill issues */}
        {!hideToolbar && (
          <Stack
            direction="row"
            justifyContent="space-between"
            sx={{ p: 2, pb: 1, flexShrink: 0 }}
          >
            <Stack direction="row" spacing={2} alignItems="center">
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
                    handleCRUD={{ handleRemoveMany: onRemoveMany }}
                    iDs={selectedIds}
                    onEmailAccess={onEmailAccess}
                  />
                  {Object.keys(selectedRowIds).length > 0 && (
                    <Chip
                      size="small"
                      label={`${Object.keys(selectedRowIds).length} row(s) selected`}
                      color="secondary"
                      variant="light"
                    />
                  )}
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
                onClick={onAdd}
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
        )}

        {/* Table Container */}
        <Box sx={{
          flex: 1,
          overflow: 'auto',
          minHeight: 0,
          '&::-webkit-scrollbar': {
            width: '8px',
            height: '8px',
          },
          '&::-webkit-scrollbar-track': {
            bgcolor: '#1a1a1a',
          },
          '&::-webkit-scrollbar-thumb': {
            bgcolor: '#3a3a3a',
            borderRadius: '4px',
            '&:hover': {
              bgcolor: '#4a4a4a',
            },
          },
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
            <Table>
              <TableBody>
                <EmptyTable msg="No participants found" colSpan={allColumns.length} />
              </TableBody>
            </Table>
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
                      bgcolor: row.isSelected ? alpha(theme.palette.primary.light, 0.35) : "inherit",
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
};

ReactTable.propTypes = {
  data: PropTypes.array.isRequired,
  onAdd: PropTypes.func.isRequired,
  onAddMultiple: PropTypes.func.isRequired,
  onCsvImport: PropTypes.func.isRequired,
  onUpdate: PropTypes.func.isRequired,
  onRemove: PropTypes.func.isRequired,
  onRemoveMany: PropTypes.func,
  csvImportLoading: PropTypes.bool,
  globalLoading: PropTypes.bool,
  onSelectionChange: PropTypes.func,
  onEmailAccess: PropTypes.func,
  editableRowIndex: PropTypes.number,
  setEditableRowIndex: PropTypes.func,
  onRefresh: PropTypes.func,
  onViewParticipant: PropTypes.func,
  hideToolbar: PropTypes.bool,
};

ReactTable.displayName = 'ReactTable';

export default ReactTable;