// next
import Image from 'next/image';

// material-ui
import { Divider, Grid, List, ListItem, ListItemAvatar, ListItemText, Typography } from '@mui/material';
import Link from '@mui/material/Link';


// project import
import Avatar from 'components/@extended/Avatar';
import LinearWithLabel from 'components/@extended/progress/LinearWithLabel';
import MainCard from 'components/MainCard';

// assets
const Target = '/assets/images/analytics/target.svg';

// ==============================|| LABELLED TASKS ||============================== //

function LabelledTasks() {
  return (
    <Grid item xs={12}>
      <MainCard sx={{ width: '100%',height:125 }}>
        <Grid container spacing={1.25}  >
          <Grid item xs={6}>
            <Typography  >Learning</Typography>
          </Grid>
          <Grid item xs={6}>
            <LinearWithLabel value={30} color="primary" />
          </Grid>
          <Grid item xs={6}>
          <Link underline="hover" color="inherit" >Technical</Link>
           
          </Grid>
          <Grid item xs={6}>
            <LinearWithLabel value={97.8} color="success" />
          </Grid>
          <Grid item xs={6}>
            <Typography>Attendance</Typography>
          </Grid>
          <Grid item xs={6}>
            <LinearWithLabel value={55} color="warning" />
          </Grid>
        </Grid>
      </MainCard>
    </Grid>
  );
}

export default LabelledTasks;
