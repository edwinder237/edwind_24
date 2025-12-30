import PropTypes from 'prop-types';
import { Fragment, useMemo, useState, useCallback } from 'react';
import { useRouter } from 'next/router';
import { useSelector } from 'store';

// material-ui
import { Box, Chip, IconButton, Stack, Table, TableBody, TableCell, TableHead, TableRow, Typography, Alert, CircularProgress, Link } from '@mui/material';

// icons
import { DownOutlined, RightOutlined } from '@ant-design/icons';

// third-party
import { useTable, useFilters, useGlobalFilter, useExpanded } from 'react-table';

// project import
import MainCard from 'components/MainCard';
import ScrollX from 'components/ScrollX';
import { CSVExport, EmptyTable } from 'components/third-party/ReactTable';
import LinearWithLabel from 'components/@extended/progress/LinearWithLabel';
import { useGetProjectAssessmentsQuery } from 'store/api/projectApi';
import { selectAllParticipants } from 'store/entities/participantsSlice';
import ParticipantDetailsDrawer from '../Participant-Dialog/ParticipantDetailsDrawer';

import {
  GlobalFilter,
  DefaultColumnFilter,
  SelectColumnFilter,
  SliderColumnFilter,
  NumberRangeColumnFilter,
  renderFilterTypes,
  filterGreaterThan
} from 'utils/react-table';

// ==============================|| EXPANDER CELL ||============================== //

const ExpanderCell = ({ row }) => (
  <Box sx={{ fontSize: '0.75rem', color: 'text.secondary' }}>
    <IconButton
      {...row.getToggleRowExpandedProps()}
      sx={{
        p: 0.5,
        '&:hover': {
          bgcolor: 'transparent'
        }
      }}
    >
      {row.isExpanded ? <DownOutlined /> : <RightOutlined />}
    </IconButton>
  </Box>
);

ExpanderCell.propTypes = {
  row: PropTypes.object
};

// ==============================|| PARTICIPANT SCORES ROW ||============================== //

const ParticipantScoresRow = ({ participants, onParticipantClick }) => {
  return (
    <TableRow>
      <TableCell colSpan={8} sx={{ bgcolor: 'grey.50', p: 0 }}>
        <Box sx={{ p: 2 }}>
          <Typography variant="subtitle1" sx={{ mb: 2 }}>
            Participant Scores
          </Typography>
          <Table size="small">
            <TableHead>
              <TableRow>
                <TableCell>Participant Name</TableCell>
                <TableCell align="right">Score</TableCell>
                <TableCell align="center">Status</TableCell>
                <TableCell align="center">Attempts</TableCell>
                <TableCell>Completion Date</TableCell>
              </TableRow>
            </TableHead>
            <TableBody>
              {participants.map((participant, index) => (
                <TableRow key={index} sx={{ '&:hover': { bgcolor: 'action.hover' } }}>
                  <TableCell>
                    <Link
                      component="button"
                      variant="body2"
                      onClick={() => onParticipantClick(participant.participantId)}
                      sx={{
                        cursor: 'pointer',
                        textDecoration: 'none',
                        '&:hover': {
                          textDecoration: 'underline'
                        }
                      }}
                    >
                      {participant.name}
                    </Link>
                  </TableCell>
                  <TableCell align="right">
                    {participant.score !== null ? `${participant.score}%` : 'N/A'}
                  </TableCell>
                  <TableCell align="center">
                    {participant.status === 'Passed' && <Chip color="success" label="Passed" size="small" variant="light" />}
                    {participant.status === 'Failed' && <Chip color="error" label="Failed" size="small" variant="light" />}
                    {participant.status === 'In Progress' && <Chip color="warning" label="In Progress" size="small" variant="light" />}
                    {participant.status === 'Not Started' && <Chip color="default" label="Not Started" size="small" variant="light" />}
                  </TableCell>
                  <TableCell align="center">{participant.attempts}</TableCell>
                  <TableCell>{participant.completionDate || '-'}</TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </Box>
      </TableCell>
    </TableRow>
  );
};

ParticipantScoresRow.propTypes = {
  participants: PropTypes.array,
  onParticipantClick: PropTypes.func
};

// ==============================|| REACT TABLE ||============================== //

function ReactTable({ columns, data, onParticipantClick }) {
  const filterTypes = useMemo(() => renderFilterTypes, []);
  const defaultColumn = useMemo(() => ({ Filter: DefaultColumnFilter }), []);
  const initialState = useMemo(() => ({ filters: [{ id: 'type', value: '' }] }), []);

  const { getTableProps, getTableBodyProps, headerGroups, rows, prepareRow, state, preGlobalFilteredRows, setGlobalFilter, visibleColumns } =
    useTable(
      {
        columns,
        data,
        defaultColumn,
        initialState,
        filterTypes
      },
      useGlobalFilter,
      useFilters,
      useExpanded
    );

  return (
    <>
      <Stack direction="row" spacing={2} justifyContent="space-between" sx={{ padding: 2 }}>
        <GlobalFilter preGlobalFilteredRows={preGlobalFilteredRows} globalFilter={state.globalFilter} setGlobalFilter={setGlobalFilter} />
        <CSVExport data={rows.map((d) => d.original)} filename={'project-assessments.csv'} />
      </Stack>

      <Table {...getTableProps()}>
        <TableHead sx={{ borderTopWidth: 2 }}>
          {headerGroups.map((headerGroup, index) => (
            <TableRow {...headerGroup.getHeaderGroupProps()} key={index}>
              {headerGroup.headers.map((column, i) => (
                <TableCell {...column.getHeaderProps([{ className: column.className }])} key={i}>
                  {column.render('Header')}
                </TableCell>
              ))}
            </TableRow>
          ))}
        </TableHead>
        <TableBody {...getTableBodyProps()}>
          {headerGroups.map((group, index) => {
            return (
              <TableRow {...group.getHeaderGroupProps()} key={index}>
                {group?.headers?.map((column, i) => (
                  <TableCell {...column.getHeaderProps([{ className: column.className }])} key={i}>
                    {column?.canFilter ? column?.render('Filter') : null}
                  </TableCell>
                ))}
              </TableRow>
            );
          })}
          {rows.length > 0 ? (
            rows.map((row, i) => {
              prepareRow(row);
              const { key, ...rowProps } = row.getRowProps();
              return (
                <Fragment key={key}>
                  <TableRow {...rowProps}>
                    {row.cells.map((cell, index) => (
                      <TableCell {...cell.getCellProps([{ className: cell.column.className }])} key={index}>
                        {cell.render('Cell')}
                      </TableCell>
                    ))}
                  </TableRow>
                  {row.isExpanded && <ParticipantScoresRow participants={row.original.participantScores} onParticipantClick={onParticipantClick} />}
                </Fragment>
              );
            })
          ) : (
            <EmptyTable msg="No Assessments Found" colSpan={8} />
          )}
        </TableBody>
      </Table>
    </>
  );
}

ReactTable.propTypes = {
  columns: PropTypes.array,
  data: PropTypes.array,
  onParticipantClick: PropTypes.func
};

// ==============================|| STATUS CELL ||============================== //

const StatusCell = ({ value }) => {
  switch (value) {
    case 'Passed':
      return <Chip color="success" label="Passed" size="small" variant="light" />;
    case 'Failed':
      return <Chip color="error" label="Failed" size="small" variant="light" />;
    case 'Pending':
      return <Chip color="warning" label="Pending" size="small" variant="light" />;
    case 'Not Started':
    default:
      return <Chip color="default" label="Not Started" size="small" variant="light" />;
  }
};

StatusCell.propTypes = {
  value: PropTypes.string
};

// ==============================|| COMPLETION CELL ||============================== //

const CompletionCell = ({ value }) => <LinearWithLabel value={value} sx={{ minWidth: 75 }} />;

CompletionCell.propTypes = {
  value: PropTypes.number
};

// ==============================|| PROJECT ASSESSMENTS TAB ||============================== //

const ProjectAssessmentsTab = () => {
  const router = useRouter();
  const projectId = router.query.id;

  // Get all participants from normalized store
  const allParticipants = useSelector(selectAllParticipants);

  // Participant drawer state
  const [drawerOpen, setDrawerOpen] = useState(false);
  const [selectedParticipant, setSelectedParticipant] = useState(null);

  // CQRS: RTK Query for project assessments
  const {
    data: assessmentData,
    isLoading,
    isError,
    error
  } = useGetProjectAssessmentsQuery(projectId, {
    skip: !projectId,
    refetchOnMountOrArgChange: true
  });

  // Transform API data to match table format
  const data = useMemo(() => {
    if (!assessmentData?.projectAssessments) {
      return [];
    }
    return assessmentData.projectAssessments;
  }, [assessmentData]);

  // Handle participant click to open drawer
  const handleParticipantClick = useCallback((participantId) => {
    // Find the participant data from the normalized store
    const participantData = allParticipants.find(p => p.id === participantId);

    if (!participantData) {
      console.error('Participant not found:', participantId);
      return;
    }

    // Transform data for drawer (same pattern as ParticipantsTable)
    const participant = {
      id: participantData.participant?.id, // UUID from participants table
      projectParticipantId: participantData.id, // Numeric ID from project_participants table
      firstName: participantData.participant?.firstName,
      lastName: participantData.participant?.lastName,
      email: participantData.participant?.email,
      phone: participantData.participant?.phone,
      role: participantData.participant?.role
    };

    setSelectedParticipant(participant);
    setDrawerOpen(true);
  }, [allParticipants]);

  const handleCloseDrawer = useCallback(() => {
    setDrawerOpen(false);
    setSelectedParticipant(null);
  }, []);

  const columns = useMemo(
    () => [
      {
        Header: () => null,
        id: 'expander',
        className: 'cell-center',
        Cell: ExpanderCell,
        SubCell: () => null
      },
      {
        Header: 'Assessment Name',
        accessor: 'assessmentName'
      },
      {
        Header: 'Course',
        accessor: 'course',
        filter: 'fuzzyText'
      },
      {
        Header: 'Type',
        accessor: 'type',
        Filter: SelectColumnFilter,
        filter: 'includes'
      },
      {
        Header: 'Participants',
        accessor: 'totalParticipants',
        className: 'cell-right'
      },
      {
        Header: 'Completed',
        accessor: 'completed',
        className: 'cell-right'
      },
      {
        Header: 'Avg Score',
        accessor: 'averageScore',
        className: 'cell-right',
        Filter: SliderColumnFilter,
        filter: filterGreaterThan
      },
      {
        Header: 'Passing Rate (%)',
        accessor: 'passingRate',
        className: 'cell-right',
        Filter: SliderColumnFilter,
        filter: filterGreaterThan,
        Cell: CompletionCell
      }
    ],
    []
  );

  // Loading state
  if (isLoading) {
    return (
      <MainCard content={false}>
        <Stack spacing={2} sx={{ p: 2 }}>
          <Stack direction="row" justifyContent="space-between" alignItems="center">
            <Typography variant="h4">Project Assessments</Typography>
          </Stack>
          <Typography variant="body2" color="text.secondary">
            View and manage all assessments assigned to this project
          </Typography>
        </Stack>
        <Box sx={{ display: 'flex', justifyContent: 'center', alignItems: 'center', minHeight: 400 }}>
          <CircularProgress />
        </Box>
      </MainCard>
    );
  }

  // Error state
  if (isError) {
    return (
      <MainCard content={false}>
        <Stack spacing={2} sx={{ p: 2 }}>
          <Stack direction="row" justifyContent="space-between" alignItems="center">
            <Typography variant="h4">Project Assessments</Typography>
          </Stack>
          <Alert severity="error">
            Failed to load assessments: {error?.message || 'Unknown error'}
          </Alert>
        </Stack>
      </MainCard>
    );
  }

  return (
    <>
      <MainCard content={false}>
        <Stack spacing={2} sx={{ p: 2 }}>
          <Stack direction="row" justifyContent="space-between" alignItems="center">
            <Typography variant="h4">Project Assessments</Typography>
          </Stack>
          <Typography variant="body2" color="text.secondary">
            View and manage all assessments assigned to this project
          </Typography>
        </Stack>
        <ScrollX>
          <ReactTable columns={columns} data={data} onParticipantClick={handleParticipantClick} />
        </ScrollX>
      </MainCard>

      {/* Participant Details Drawer */}
      <ParticipantDetailsDrawer
        open={drawerOpen}
        onClose={handleCloseDrawer}
        participant={selectedParticipant}
        projectId={projectId}
      />
    </>
  );
};

export default ProjectAssessmentsTab;
