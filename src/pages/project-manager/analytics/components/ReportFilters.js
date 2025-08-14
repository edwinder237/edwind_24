import React from 'react';
import {
  Grid,
  Typography,
  Box,
  Stack,
  Chip,
  TextField,
  Collapse,
  Autocomplete
} from '@mui/material';
import { TuneOutlined, GroupWorkOutlined } from '@mui/icons-material';

import MainCard from 'components/MainCard';
import GroupByButtons from './GroupByButtons';

const ReportFilters = ({
  filters,
  filterOptions,
  handleFilterChange,
  getActiveFilterCount,
  filtersExpanded,
  groupBy,
  setGroupBy
}) => {
  // Use filterOptions from API or fallback to empty arrays
  const {
    courses = [],
    participants = [],
    instructors = [],
    trainingRecipients = [],
    projects = [],
    topics = [],
    statusOptions = [],
    companies = []
  } = filterOptions;

  return (
    <Grid item xs={12}>
      <Collapse in={filtersExpanded}>
        <MainCard>
          <Box sx={{ mb: 3 }}>
            <Stack direction="row" alignItems="center" spacing={2}>
              <TuneOutlined color="primary" />
              <Typography variant="h5" fontWeight="bold">
                Report Filters
              </Typography>
              {getActiveFilterCount() > 0 && (
                <Chip 
                  label={`${getActiveFilterCount()} active`}
                  size="small" 
                  color="primary" 
                  variant="outlined"
                />
              )}
            </Stack>
            <Typography variant="body2" color="text.secondary" sx={{ mt: 1 }}>
              Customize your report by selecting specific criteria below
            </Typography>
          </Box>
          
          <Grid container spacing={3}>
            {/* Course Filter */}
            <Grid item xs={12} md={4}>
              <Autocomplete
                multiple
                options={courses}
                getOptionLabel={(option) => option.name}
                value={courses.filter(course => filters.courses.includes(course.id))}
                onChange={(event, newValue) => {
                  handleFilterChange('courses', newValue.map(course => course.id));
                }}
                filterSelectedOptions
                renderTags={(value, getTagProps) =>
                  value.map((option, index) => (
                    <Chip
                      {...getTagProps({ index })}
                      key={option.id}
                      label={option.name}
                      size="small"
                    />
                  ))
                }
                renderOption={(props, option) => {
                  const { key, ...otherProps } = props;
                  return (
                    <Box component="li" key={key} {...otherProps}>
                      {option.name}
                    </Box>
                  );
                }}
                renderInput={(params) => (
                  <TextField
                    {...params}
                    label="Courses"
                    placeholder="Search courses..."
                  />
                )}
              />
            </Grid>

            {/* Participants Filter */}
            <Grid item xs={12} md={4}>
              <Autocomplete
                multiple
                options={participants}
                getOptionLabel={(option) => `${option.firstName} ${option.lastName}`}
                value={participants.filter(participant => filters.participants.includes(participant.id))}
                onChange={(event, newValue) => {
                  handleFilterChange('participants', newValue.map(participant => participant.id));
                }}
                filterSelectedOptions
                renderTags={(value, getTagProps) =>
                  value.map((option, index) => (
                    <Chip
                      {...getTagProps({ index })}
                      key={option.id}
                      label={`${option.firstName} ${option.lastName}`}
                      size="small"
                    />
                  ))
                }
                renderOption={(props, option) => {
                  const { key, ...otherProps } = props;
                  return (
                    <Box component="li" key={key} {...otherProps}>
                      <Box>
                        <Typography variant="body2">
                          {`${option.firstName} ${option.lastName}`}
                        </Typography>
                        <Typography variant="caption" color="text.secondary">
                          {option.department}
                        </Typography>
                      </Box>
                    </Box>
                  );
                }}
                renderInput={(params) => (
                  <TextField
                    {...params}
                    label="Participants"
                    placeholder="Search participants..."
                  />
                )}
              />
            </Grid>

            {/* Instructors Filter */}
            <Grid item xs={12} md={4}>
              <Autocomplete
                multiple
                options={instructors}
                getOptionLabel={(option) => option.name}
                value={instructors.filter(instructor => filters.instructors.includes(instructor.id))}
                onChange={(event, newValue) => {
                  handleFilterChange('instructors', newValue.map(instructor => instructor.id));
                }}
                filterSelectedOptions
                renderTags={(value, getTagProps) =>
                  value.map((option, index) => (
                    <Chip
                      {...getTagProps({ index })}
                      key={option.id}
                      label={option.name}
                      size="small"
                    />
                  ))
                }
                renderOption={(props, option) => {
                  const { key, ...otherProps } = props;
                  return (
                    <Box component="li" key={key} {...otherProps}>
                      <Box>
                        <Typography variant="body2">
                          {option.name}
                        </Typography>
                        <Typography variant="caption" color="text.secondary">
                          {option.specialization}
                        </Typography>
                      </Box>
                    </Box>
                  );
                }}
                renderInput={(params) => (
                  <TextField
                    {...params}
                    label="Instructors"
                    placeholder="Search instructors..."
                  />
                )}
              />
            </Grid>

            {/* Status Filter */}
            <Grid item xs={12} md={4}>
              <Autocomplete
                multiple
                options={statusOptions}
                getOptionLabel={(option) => option}
                value={filters.status}
                onChange={(event, newValue) => {
                  handleFilterChange('status', newValue);
                }}
                filterSelectedOptions
                renderTags={(value, getTagProps) =>
                  value.map((option, index) => (
                    <Chip
                      {...getTagProps({ index })}
                      key={option}
                      label={option}
                      size="small"
                    />
                  ))
                }
                renderOption={(props, option) => {
                  const { key, ...otherProps } = props;
                  return (
                    <Box component="li" key={key} {...otherProps}>
                      {option}
                    </Box>
                  );
                }}
                renderInput={(params) => (
                  <TextField
                    {...params}
                    label="Status"
                    placeholder="Search status..."
                  />
                )}
              />
            </Grid>

            {/* Topics Filter */}
            <Grid item xs={12} md={4}>
              <Autocomplete
                multiple
                options={topics}
                getOptionLabel={(option) => typeof option === 'string' ? option : option.title}
                value={filters.topics}
                onChange={(event, newValue) => {
                  handleFilterChange('topics', newValue.map(topic => typeof topic === 'string' ? topic : topic.title));
                }}
                filterSelectedOptions
                renderTags={(value, getTagProps) =>
                  value.map((option, index) => (
                    <Chip
                      {...getTagProps({ index })}
                      key={typeof option === 'string' ? option : option.title}
                      label={typeof option === 'string' ? option : option.title}
                      size="small"
                    />
                  ))
                }
                renderOption={(props, option) => {
                  const { key, ...otherProps } = props;
                  return (
                    <Box component="li" key={key} {...otherProps}>
                      {typeof option === 'string' ? option : option.title}
                    </Box>
                  );
                }}
                renderInput={(params) => (
                  <TextField
                    {...params}
                    label="Topics"
                    placeholder="Search topics..."
                  />
                )}
              />
            </Grid>

            {/* Companies Filter */}
            <Grid item xs={12} md={4}>
              <Autocomplete
                multiple
                options={companies}
                getOptionLabel={(option) => option}
                value={filters.companies}
                onChange={(event, newValue) => {
                  handleFilterChange('companies', newValue);
                }}
                filterSelectedOptions
                renderTags={(value, getTagProps) =>
                  value.map((option, index) => (
                    <Chip
                      {...getTagProps({ index })}
                      key={option}
                      label={option}
                      size="small"
                    />
                  ))
                }
                renderOption={(props, option) => {
                  const { key, ...otherProps } = props;
                  return (
                    <Box component="li" key={key} {...otherProps}>
                      {option}
                    </Box>
                  );
                }}
                renderInput={(params) => (
                  <TextField
                    {...params}
                    label="Companies"
                    placeholder="Search companies..."
                  />
                )}
              />
            </Grid>

            {/* Projects Filter */}
            <Grid item xs={12} md={4}>
              <Autocomplete
                multiple
                options={projects}
                getOptionLabel={(option) => option.name}
                value={projects.filter(project => filters.projects.includes(project.id))}
                onChange={(event, newValue) => {
                  handleFilterChange('projects', newValue.map(project => project.id));
                }}
                filterSelectedOptions
                renderTags={(value, getTagProps) =>
                  value.map((option, index) => (
                    <Chip
                      {...getTagProps({ index })}
                      key={option.id}
                      label={option.name}
                      size="small"
                    />
                  ))
                }
                renderOption={(props, option) => {
                  const { key, ...otherProps } = props;
                  return (
                    <Box component="li" key={key} {...otherProps}>
                      <Box>
                        <Typography variant="body2">
                          {option.name}
                        </Typography>
                        <Typography variant="caption" color="text.secondary">
                          {option.summary}
                        </Typography>
                      </Box>
                    </Box>
                  );
                }}
                renderInput={(params) => (
                  <TextField
                    {...params}
                    label="Projects"
                    placeholder="Search projects..."
                  />
                )}
              />
            </Grid>

            {/* Date Range */}
            <Grid item xs={12} md={4}>
              <Stack spacing={2}>
                <TextField
                  label="Start Date"
                  type="date"
                  value={filters.startDate}
                  onChange={(e) => handleFilterChange('startDate', e.target.value)}
                  InputLabelProps={{ shrink: true }}
                  fullWidth
                />
                <TextField
                  label="End Date"
                  type="date"
                  value={filters.endDate}
                  onChange={(e) => handleFilterChange('endDate', e.target.value)}
                  InputLabelProps={{ shrink: true }}
                  fullWidth
                />
              </Stack>
            </Grid>
          </Grid>
          
          <GroupByButtons groupBy={groupBy} setGroupBy={setGroupBy} />
        </MainCard>
      </Collapse>
    </Grid>
  );
};

export default ReportFilters;