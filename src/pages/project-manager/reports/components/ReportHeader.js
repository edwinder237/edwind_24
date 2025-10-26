import React from 'react';
import {
  Grid,
  Typography,
  Box,
  Stack,
  Button,
  Badge,
  Chip,
  CircularProgress
} from '@mui/material';
import {
  AnalyticsOutlined,
  TuneOutlined,
  ClearOutlined,
  PlayArrowOutlined
} from '@mui/icons-material';
import MainCard from 'components/MainCard';

const ReportHeader = ({
  showResults,
  filteredResults,
  getActiveFilterCount,
  filtersExpanded,
  setFiltersExpanded,
  clearFilters,
  applyFilters,
  loading
}) => {
  return (
    <Grid item xs={12}>
      <MainCard>
        <Stack direction="row" alignItems="center" justifyContent="space-between" spacing={3}>
          <Box sx={{ flex: 1 }}>
            <Stack direction="row" alignItems="center" spacing={2} sx={{ mb: 1 }}>
              <AnalyticsOutlined color="primary" sx={{ fontSize: 32 }} />
              <Typography variant="h3" fontWeight="bold">
                Training Analytics
              </Typography>
            </Stack>
            <Typography variant="h6" color="text.secondary" fontWeight={400}>
              Comprehensive reporting on training completion, participant progress, and performance metrics
            </Typography>
            {showResults && (
              <Chip 
                label={`${filteredResults.length} records found`}
                color="primary"
                sx={{ mt: 2 }}
              />
            )}
          </Box>
          <Box>
            <Stack direction="row" spacing={2}>
              <Badge badgeContent={getActiveFilterCount()} color="secondary">
                <Button
                  variant="outlined"
                  startIcon={<TuneOutlined />}
                  onClick={() => setFiltersExpanded(!filtersExpanded)}
                >
                  {filtersExpanded ? 'Hide' : 'Show'} Filters
                </Button>
              </Badge>
              <Button
                variant="outlined"
                startIcon={<ClearOutlined />}
                onClick={clearFilters}
                disabled={getActiveFilterCount() === 0}
              >
                Clear All
              </Button>
              <Button
                variant="contained"
                startIcon={loading ? <CircularProgress size={16} color="inherit" /> : <PlayArrowOutlined />}
                onClick={applyFilters}
                disabled={loading}
              >
                {loading ? 'Running...' : 'Run Report'}
              </Button>
            </Stack>
          </Box>
        </Stack>
      </MainCard>
    </Grid>
  );
};

export default ReportHeader;