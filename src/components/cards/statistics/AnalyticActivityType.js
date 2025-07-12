import PropTypes from 'prop-types';

// material-ui
import { Box, Chip, Grid, Stack, Typography } from '@mui/material';

// project import
import MainCard from 'components/MainCard';

// assets
import { RiseOutlined, FallOutlined, UserOutlined, ReadOutlined, VideoCameraOutlined } from '@ant-design/icons';
import { height } from '@mui/system';

// ==============================|| STATISTICS - ECOMMERCE CARD  ||============================== //

const AnalyticActivityType = ({ color = 'primary', title, count, percentage, isLoss, extra }) => (
  <MainCard contentSX={{ p: 2.25 }}>
    <Stack sx={{ bgcolor: '' }} spacing={0.5}>
      <Typography variant="h6" color="textSecondary">
        {title}
      </Typography>
      <Grid container alignItems="center">
        <Grid item>
          <Box sx={{ pt: 0}}>
            <Stack direction='row' sx={{ bgcolor: '', justifyContent: "space-between" }} spacing={1}>
              <Typography variant="h6" color="inherit">
                Pratical: {count.practical}
              </Typography>
              <Typography variant="h6" color="inherit">
                Passive: {count.passive}
              </Typography>
              <Typography variant="h6" color="inherit">
                Quiz: {count.quiz}
              </Typography>
            </Stack>

          </Box>
        </Grid>
      </Grid>

    </Stack>

  </MainCard>
);
// DOM temp fix
//AnalyticActivityType.propTypes = {
 // title: PropTypes.string,
//  count: PropTypes.string,
//  percentage: PropTypes.number,
 // isLoss: PropTypes.bool,
 // color: PropTypes.string,
//  extra: PropTypes.string
//};

export default AnalyticActivityType;
