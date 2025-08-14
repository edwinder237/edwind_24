import React, { useMemo } from 'react';
import PropTypes from 'prop-types';
import {
  Grid,
  Stack,
  Typography
} from '@mui/material';
import MainCard from 'components/MainCard';
import { formatDisplayDate } from '../utils/timeHelpers';

const ProjectInfoCard = React.memo(({ project, projectSettings }) => {
  // Memoized formatted dates
  const formattedDates = useMemo(() => ({
    created: formatDisplayDate(project?.createdAt),
    lastUpdated: formatDisplayDate(projectSettings?.updatedAt)
  }), [project?.createdAt, projectSettings?.updatedAt]);

  const projectInfo = useMemo(() => [
    {
      label: 'Project ID',
      value: project?.id || 'N/A'
    },
    {
      label: 'Project Status',
      value: project?.projectStatus || 'N/A'
    },
    {
      label: 'Created',
      value: formattedDates.created
    },
    {
      label: 'Last Updated',
      value: formattedDates.lastUpdated
    }
  ], [project?.id, project?.projectStatus, formattedDates]);

  return (
    <MainCard title="Project Information">
      <Stack spacing={2}>
        <Grid container spacing={2}>
          {projectInfo.map((info, index) => (
            <Grid item xs={12} sm={6} key={index}>
              <Typography variant="body2" color="text.secondary">
                {info.label}
              </Typography>
              <Typography variant="body1">
                {info.value}
              </Typography>
            </Grid>
          ))}
        </Grid>
      </Stack>
    </MainCard>
  );
});

ProjectInfoCard.propTypes = {
  project: PropTypes.shape({
    id: PropTypes.oneOfType([PropTypes.string, PropTypes.number]),
    projectStatus: PropTypes.string,
    createdAt: PropTypes.oneOfType([PropTypes.string, PropTypes.instanceOf(Date)])
  }),
  projectSettings: PropTypes.shape({
    updatedAt: PropTypes.oneOfType([PropTypes.string, PropTypes.instanceOf(Date)])
  })
};

ProjectInfoCard.displayName = 'ProjectInfoCard';

export default ProjectInfoCard;