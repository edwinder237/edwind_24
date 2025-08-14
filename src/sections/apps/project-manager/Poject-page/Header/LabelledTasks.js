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

function LabelledTasks({ checklistItems = [] }) {
  // Calculate technical progress from checklist items
  const totalItems = checklistItems.length;
  const completedItems = checklistItems.filter(item => item.completed).length;
  const technicalProgress = totalItems > 0 ? Math.round((completedItems / totalItems) * 100) : 0;
  
  // Mock data for other progress indicators (these can be updated later)
  const learningProgress = 30;
  const attendanceProgress = 85;
  
  return (
    <Grid item xs={12}>
      <MainCard sx={{ width: '100%',height:125 }}>
        <Grid container spacing={1.25}  >
          <Grid item xs={6}>
            <Typography>Learning</Typography>
          </Grid>
          <Grid item xs={6}>
            <LinearWithLabel value={learningProgress} color="primary" />
          </Grid>
          <Grid item xs={6}>
            <Link 
              underline="hover" 
              color="inherit" 
              title={`${completedItems}/${totalItems} technical tasks completed`}
            >
              Technical
            </Link>
          </Grid>
          <Grid item xs={6}>
            <LinearWithLabel 
              value={technicalProgress} 
              color={technicalProgress >= 80 ? "success" : technicalProgress >= 50 ? "warning" : "error"} 
            />
          </Grid>
          <Grid item xs={6}>
            <Typography>Attendance</Typography>
          </Grid>
          <Grid item xs={6}>
            <LinearWithLabel value={attendanceProgress} color="warning" />
          </Grid>
        </Grid>
      </MainCard>
    </Grid>
  );
}

export default LabelledTasks;
