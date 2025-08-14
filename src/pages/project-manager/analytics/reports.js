import React, { useMemo } from 'react';
import {
  Grid,
  Typography,
  Box,
  Stack,
  Button,
  Alert,
  Fade
} from '@mui/material';
import {
  DownloadOutlined,
  PrintOutlined,
  VisibilityOutlined
} from '@mui/icons-material';

// project import
import Layout from 'layout';
import Page from 'components/Page';
import MainCard from 'components/MainCard';

// custom components
import ReportHeader from './components/ReportHeader';
import ReportFilters from './components/ReportFilters';
import LoadingState from './components/LoadingState';
import ResultsTable from './components/ResultsTable';
import TrainingSignOffSheet from './components/TrainingSignOffSheet';

// custom hooks and utilities
import { useReportsState } from 'sections/apps/project-manager/analytics/hooks/useReportsState';
import { useTrainingData } from 'sections/apps/project-manager/analytics/hooks/useTrainingData';
import { 
  applySorting,
  getGroupedResults,
  getColumnOrder,
  getSummaryStats,
  generateSignOffSheetData
} from 'sections/apps/project-manager/analytics/utils/dataProcessing';

// ==============================|| REPORTS ||============================== //

const Reports = () => {
  // TODO: Get these from context or props
  const projectId = null; // Will be passed from parent component
  const subOrganizationId = 1; // Will be from user context

  const {
    // State
    filters,
    sortBy,
    sortOrder,
    showResults,
    signOffDialogOpen,
    selectedSignOffData,
    groupBy,
    loading: uiLoading,
    filtersExpanded,
    
    // Actions
    handleFilterChange,
    clearFilters,
    applyFilters,
    getActiveFilterCount,
    handleSort,
    setSignOffDialogOpen,
    setSelectedSignOffData,
    setGroupBy,
    setFiltersExpanded
  } = useReportsState();

  // Database integration
  const {
    trainingRecords,
    filterOptions,
    loading: dataLoading,
    error,
    fetchTrainingRecords
  } = useTrainingData(projectId, subOrganizationId);

  const loading = uiLoading || dataLoading;

  // Custom apply filters function that uses the hook's applyFilters with API integration
  const handleApplyFilters = async () => {
    await applyFilters(() => fetchTrainingRecords(filters));
  };

  // Get sorted results
  const sortedResults = useMemo(() => {
    return applySorting(trainingRecords, sortBy, sortOrder);
  }, [trainingRecords, sortBy, sortOrder]);

  // Group results for display
  const groupedResults = useMemo(() => {
    return getGroupedResults(sortedResults, groupBy);
  }, [sortedResults, groupBy]);

  // Get column order based on grouping
  const columnOrder = useMemo(() => {
    return getColumnOrder(groupBy);
  }, [groupBy]);

  // Calculate summary statistics
  const summaryStats = useMemo(() => {
    return getSummaryStats(sortedResults);
  }, [sortedResults]);

  // Handle sign-off sheet generation
  const generateSignOffSheet = (courseId) => {
    const signOffData = generateSignOffSheetData(sortedResults, courseId);
    if (signOffData) {
      setSelectedSignOffData(signOffData);
      setSignOffDialogOpen(true);
    }
  };

  return (
    <Page title="Training Reports">
      <Grid container spacing={3}>
        {/* Error Display */}
        {error && (
          <Grid item xs={12}>
            <Alert severity="error" sx={{ mb: 2 }}>
              {error}
            </Alert>
          </Grid>
        )}

        {/* Header */}
        <ReportHeader
          showResults={showResults}
          filteredResults={sortedResults}
          getActiveFilterCount={getActiveFilterCount}
          filtersExpanded={filtersExpanded}
          setFiltersExpanded={setFiltersExpanded}
          clearFilters={clearFilters}
          applyFilters={handleApplyFilters}
          loading={loading}
        />

        {/* Filters */}
        <ReportFilters
          filters={filters}
          filterOptions={filterOptions}
          handleFilterChange={handleFilterChange}
          getActiveFilterCount={getActiveFilterCount}
          filtersExpanded={filtersExpanded}
          groupBy={groupBy}
          setGroupBy={setGroupBy}
        />

        {/* Loading State */}
        {loading && <LoadingState />}

        {/* Results */}
        {showResults && !loading && (
          <Fade in={showResults}>
            <Grid item xs={12}>
              <MainCard sx={{ overflow: 'hidden' }}>
                <Box sx={{ 
                  backgroundColor: 'primary.lighter',
                  p: { xs: 2, md: 3 },
                  mb: 3
                }}>
                  <Stack 
                    direction={{ xs: 'column', md: 'row' }} 
                    alignItems={{ xs: 'flex-start', md: 'center' }} 
                    justifyContent="space-between"
                    spacing={2}
                  >
                    <Box>
                      <Stack direction="row" alignItems="center" spacing={2}>
                        <VisibilityOutlined color="primary" sx={{ fontSize: 28 }} />
                        <Box>
                          <Typography variant="h5" fontWeight="bold">
                            Training Results
                          </Typography>
                          <Typography variant="body2" color="text.secondary">
                            {sortedResults.length} records • {groupBy !== 'none' ? `Grouped by ${groupBy}` : 'Detailed view'}
                          </Typography>
                        </Box>
                      </Stack>
                    </Box>
                    <Stack direction={{ xs: 'column', sm: 'row' }} spacing={2} sx={{ width: { xs: '100%', md: 'auto' } }}>
                      <Button
                        variant="outlined"
                        startIcon={<DownloadOutlined />}
                        size="medium"
                        sx={{ width: { xs: '100%', sm: 'auto' } }}
                        disabled={sortedResults.length === 0}
                      >
                        Export CSV
                      </Button>
                      <Button
                        variant="contained"
                        startIcon={<PrintOutlined />}
                        size="medium"
                        onClick={() => {
                          if (sortedResults.length > 0) {
                            const courseId = sortedResults[0].courseId;
                            generateSignOffSheet(courseId);
                          }
                        }}
                        sx={{ width: { xs: '100%', sm: 'auto' } }}
                        disabled={sortedResults.length === 0}
                      >
                        Sign-off Sheet
                      </Button>
                    </Stack>
                  </Stack>
                </Box>

                {sortedResults.length === 0 ? (
                  <Alert 
                    severity="info" 
                    sx={{ 
                      mb: 2,
                      '& .MuiAlert-message': {
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        width: '100%',
                        py: 2
                      }
                    }}
                  >
                    <Stack alignItems="center" spacing={1}>
                      <Typography variant="h6">No Results Found</Typography>
                      <Typography variant="body2" color="text.secondary">
                        Try adjusting your filters or clearing them to see more results.
                      </Typography>
                    </Stack>
                  </Alert>
                ) : (
                  <ResultsTable
                    groupedResults={groupedResults}
                    columnOrder={columnOrder}
                    sortBy={sortBy}
                    sortOrder={sortOrder}
                    handleSort={handleSort}
                    groupBy={groupBy}
                    summaryStats={summaryStats}
                  />
                )}
              </MainCard>
            </Grid>
          </Fade>
        )}
      </Grid>

      {/* Training Sign-off Sheet Dialog */}
      <TrainingSignOffSheet
        open={signOffDialogOpen}
        onClose={() => setSignOffDialogOpen(false)}
        data={selectedSignOffData}
      />
    </Page>
  );
};

Reports.getLayout = function getLayout(page) {
  return <Layout>{page}</Layout>;
};

export default Reports;