import React from 'react';
import {
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  TableSortLabel,
  TableFooter,
  Typography,
  Chip,
  Box,
  Stack
} from '@mui/material';

const ResultsTable = ({ 
  groupedResults, 
  columnOrder, 
  sortBy, 
  sortOrder, 
  handleSort, 
  groupBy, 
  summaryStats 
}) => {
  return (
    <TableContainer sx={{ 
      border: '1px solid', 
      borderColor: 'divider',
      overflow: 'auto',
      maxHeight: { xs: '70vh', md: 'none' }
    }}>
      <Table sx={{ minWidth: { xs: 600, md: 800 } }}>
        <TableHead>
          <TableRow sx={{ 
            backgroundColor: 'grey.100',
            '& .MuiTableCell-head': {
              fontWeight: 'bold',
              fontSize: '0.9rem',
              textTransform: 'uppercase',
              letterSpacing: '0.5px',
              borderBottom: '2px solid',
              borderColor: 'divider'
            }
          }}>
            {columnOrder.map((column) => (
              <TableCell key={column.key}>
                <TableSortLabel
                  active={sortBy === column.sortKey}
                  direction={sortBy === column.sortKey ? sortOrder : 'asc'}
                  onClick={() => handleSort(column.sortKey)}
                  sx={{
                    '&.Mui-active': {
                      color: 'primary.main',
                      fontWeight: 'bold'
                    }
                  }}
                >
                  {column.label}
                </TableSortLabel>
              </TableCell>
            ))}
          </TableRow>
        </TableHead>
        <TableBody>
          {groupedResults.map((result, index) => (
            <TableRow 
              key={result.id} 
              sx={{ 
                '&:hover': { backgroundColor: 'action.hover' },
                '&:nth-of-type(even)': { backgroundColor: 'grey.25' },
                transition: 'background-color 0.2s ease'
              }}
            >
              {columnOrder.map((column) => (
                <TableCell 
                  key={column.key}
                  sx={{
                    py: 2,
                    borderBottom: '1px solid',
                    borderColor: 'divider'
                  }}
                >
                  <ResultsTableCell 
                    value={result[column.key]}
                    column={column}
                    result={result}
                    groupBy={groupBy}
                  />
                </TableCell>
              ))}
            </TableRow>
          ))}
        </TableBody>
        <TableFooter>
          <TableRow sx={{ 
            backgroundColor: 'primary.50',
            '& .MuiTableCell-root': {
              borderTop: '3px solid',
              borderColor: 'primary.main',
              fontWeight: 'bold',
              fontSize: '0.9rem',
              py: 2
            }
          }}>
            {columnOrder.map((column) => (
              <TableCell key={column.key}>
                <FooterCell column={column} summaryStats={summaryStats} />
              </TableCell>
            ))}
          </TableRow>
        </TableFooter>
      </Table>
    </TableContainer>
  );
};

const ResultsTableCell = ({ value, column, result, groupBy }) => {
  // Special handling for status column
  if (column.key === 'status' && !result.isGroupRow) {
    return (
      <Chip 
        label={value}
        color={
          value === 'Completed' ? 'success' : 
          value === 'In Progress' ? 'warning' : 'default'
        }
        size="medium"
        sx={{ 
          fontWeight: 'bold'
        }}
      />
    );
  }
  
  // Special handling for score column
  if (column.key === 'score') {
    const scoreValue = value ? `${value}%` : 'N/A';
    return (
      <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
        <Typography variant="body2" fontWeight="bold">
          {scoreValue}
        </Typography>
        {value && (
          <Box
            sx={{
              width: 8,
              height: 8,
              bgcolor: value >= 90 ? 'success.main' : 
                     value >= 70 ? 'warning.main' : 'error.main'
            }}
          />
        )}
      </Box>
    );
  }
  
  // Highlight grouped column values
  const isGroupedColumn = result.isGroupRow && (
    (groupBy === 'participants' && column.key === 'participantName') ||
    (groupBy === 'companies' && column.key === 'participantCompany') ||
    (groupBy === 'instructors' && column.key === 'instructorName') ||
    (groupBy === 'courses' && column.key === 'courseName') ||
    (groupBy === 'roles' && column.key === 'participantRole') ||
    (groupBy === 'trainingRecipients' && column.key === 'participantTrainingRecipient') ||
    (groupBy === 'status' && column.key === 'status')
  );
  
  // Regular text display
  return (
    <Typography 
      variant="body2" 
      fontWeight={isGroupedColumn ? 'bold' : 'medium'}
      color={isGroupedColumn ? 'primary.main' : 'text.primary'}
      sx={{
        fontSize: isGroupedColumn ? '0.95rem' : '0.875rem'
      }}
    >
      {value}
    </Typography>
  );
};

const FooterCell = ({ column, summaryStats }) => {
  switch (column.key) {
    case 'participantName':
      return (
        <Stack direction="row" alignItems="center" spacing={1}>
          <Typography variant="body2" fontWeight="bold" color="primary.main">
            {summaryStats.uniqueParticipants}
          </Typography>
          <Typography variant="caption" color="text.secondary">
            Participants
          </Typography>
        </Stack>
      );
    case 'participantCompany':
      return (
        <Stack direction="row" alignItems="center" spacing={1}>
          <Typography variant="body2" fontWeight="bold" color="primary.main">
            {summaryStats.uniqueCompanies}
          </Typography>
          <Typography variant="caption" color="text.secondary">
            Companies
          </Typography>
        </Stack>
      );
    case 'courseName':
      return (
        <Stack direction="row" alignItems="center" spacing={1}>
          <Typography variant="body2" fontWeight="bold" color="primary.main">
            {summaryStats.uniqueCourses}
          </Typography>
          <Typography variant="caption" color="text.secondary">
            Courses
          </Typography>
        </Stack>
      );
    case 'duration':
      return (
        <Stack direction="row" alignItems="center" spacing={1}>
          <Typography variant="body2" fontWeight="bold" color="primary.main">
            {Math.round(summaryStats.totalDuration / 60)}h {summaryStats.totalDuration % 60}m
          </Typography>
        </Stack>
      );
    case 'score':
      return (
        <Stack direction="row" alignItems="center" spacing={1}>
          <Typography variant="body2" fontWeight="bold" color="primary.main">
            {summaryStats.averageScore > 0 ? `${summaryStats.averageScore}%` : 'N/A'}
          </Typography>
          <Typography variant="caption" color="text.secondary">
            Avg
          </Typography>
        </Stack>
      );
    default:
      return (
        <Typography variant="body2" color="text.disabled">
          —
        </Typography>
      );
  }
};

export default ResultsTable;