import PropTypes from 'prop-types';

// material-ui
import { Grid, Stack, Typography } from '@mui/material';
import { CheckCircle, Schedule, Cancel } from '@mui/icons-material';

// project imports
import MainCard from 'components/MainCard';

// ==============================|| ATTENDANCE SUMMARY CARD ||============================== //

const AttendanceSummaryCard = ({ count, label, icon: IconComponent, color }) => {
  return (
    <MainCard>
      <Grid container justifyContent="space-between" alignItems="center">
        <Grid item>
          <Stack spacing={1}>
            <Typography variant="h3" sx={{ fontWeight: 600 }}>
              {count}
            </Typography>
            <Typography variant="body1" color="text.secondary">
              {label}
            </Typography>
          </Stack>
        </Grid>
        <Grid item>
          <Typography variant="h2" style={{ color }}>
            <IconComponent fontSize="large" />
          </Typography>
        </Grid>
      </Grid>
    </MainCard>
  );
};

AttendanceSummaryCard.propTypes = {
  count: PropTypes.number.isRequired,
  label: PropTypes.string.isRequired,
  icon: PropTypes.object.isRequired,
  color: PropTypes.string.isRequired
};

// ==============================|| ATTENDANCE SUMMARY ||============================== //

const AttendanceSummary = ({ attendanceStats }) => {
  return (
    <Grid container spacing={2}>
      <Grid item xs={12} sm={4}>
        <AttendanceSummaryCard
          count={attendanceStats.present}
          label="Present"
          icon={CheckCircle}
          color="#4caf50" // success color
        />
      </Grid>
      <Grid item xs={12} sm={4}>
        <AttendanceSummaryCard
          count={attendanceStats.late}
          label="Late"
          icon={Schedule}
          color="#ff9800" // warning color
        />
      </Grid>
      <Grid item xs={12} sm={4}>
        <AttendanceSummaryCard
          count={attendanceStats.absent}
          label="Absent"
          icon={Cancel}
          color="#f44336" // error color
        />
      </Grid>
    </Grid>
  );
};

AttendanceSummary.propTypes = {
  attendanceStats: PropTypes.shape({
    present: PropTypes.number.isRequired,
    late: PropTypes.number.isRequired,
    absent: PropTypes.number.isRequired,
    total: PropTypes.number.isRequired
  }).isRequired
};

export default AttendanceSummary;
