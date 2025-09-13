import React, { useMemo } from 'react';
import { FixedSizeList as List } from 'react-window';
import { 
  Table, 
  TableBody, 
  TableCell, 
  TableHead, 
  TableRow,
  Box
} from '@mui/material';

// Virtual scrolling component for handling 1000+ groups efficiently
// This will only render visible rows, dramatically improving performance

const VirtualizedTable = ({ 
  columns, 
  data, 
  rowHeight = 80, 
  height = 400,
  renderRowSubComponent,
  ...tableProps 
}) => {
  const itemCount = data.length;

  // Memoized row renderer
  const Row = useMemo(() => ({ index, style }) => {
    const row = data[index];
    if (!row) return null;

    return (
      <div style={style}>
        <TableRow>
          {columns.map((column, colIndex) => (
            <TableCell key={colIndex}>
              {column.Cell ? column.Cell({ value: row[column.accessor], row: { original: row, index } }) : row[column.accessor]}
            </TableCell>
          ))}
        </TableRow>
      </div>
    );
  }, [columns, data]);

  // Don't use virtualization for small datasets (less than 50 items)
  if (itemCount < 50) {
    return (
      <Table {...tableProps}>
        <TableHead>
          <TableRow>
            {columns.map((column, index) => (
              <TableCell key={index}>
                {column.Header}
              </TableCell>
            ))}
          </TableRow>
        </TableHead>
        <TableBody>
          {data.map((row, rowIndex) => (
            <TableRow key={rowIndex}>
              {columns.map((column, colIndex) => (
                <TableCell key={colIndex}>
                  {column.Cell ? column.Cell({ value: row[column.accessor], row: { original: row, index: rowIndex } }) : row[column.accessor]}
                </TableCell>
              ))}
            </TableRow>
          ))}
        </TableBody>
      </Table>
    );
  }

  // Use virtualization for large datasets
  return (
    <Box>
      <Table {...tableProps}>
        <TableHead>
          <TableRow>
            {columns.map((column, index) => (
              <TableCell key={index} sx={{ position: 'sticky', top: 0, zIndex: 1, bgcolor: 'background.paper' }}>
                {column.Header}
              </TableCell>
            ))}
          </TableRow>
        </TableHead>
      </Table>
      
      <List
        height={height}
        itemCount={itemCount}
        itemSize={rowHeight}
        overscanCount={5} // Render 5 extra items above and below visible area
      >
        {Row}
      </List>
      
      <Box sx={{ p: 2, textAlign: 'center', color: 'text.secondary', fontSize: '0.875rem' }}>
        Showing {Math.min(height / rowHeight, itemCount)} of {itemCount} groups (Virtualized)
      </Box>
    </Box>
  );
};

export default React.memo(VirtualizedTable);