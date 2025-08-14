// material-ui
import { 
  CardContent, 
  Grid, 
  Skeleton, 
  Stack, 
  Box,
  Divider 
} from '@mui/material';

// project import
import MainCard from 'components/MainCard';

// ===========================|| SKELETON - PROJECT CARD ||=========================== //

const ProjectCardSkeleton = () => {
  return (
    <MainCard
      sx={{
        height: 1,
        "& .MuiCardContent-root": {
          height: 1,
          display: "flex",
          flexDirection: "column",
          bgcolor: "",
        },
      }}
    >
      <Grid bgcolor="" width="110%" container spacing={2.25}>
        {/* Header with status chips and menu */}
        <Grid
          item
          xs={12}
          sx={{
            display: "flex",
            justifyContent: "space-between",
            alignItems: "center",
            pr: 2,
          }}
        >
          <Stack direction="row" spacing={1}>
            <Skeleton animation="wave" height={24} width={65} sx={{ borderRadius: 3 }} />
            <Skeleton animation="wave" height={24} width={75} sx={{ borderRadius: 3 }} />
          </Stack>
          
          <Skeleton animation="wave" height={32} width={32} variant="circular" />
        </Grid>
        
        {/* Divider */}
        <Grid item xs={12}>
          <Divider />
        </Grid>
        
        {/* Card Media (Image area) */}
        <Box sx={{ width: 1, m: "auto" }}>
          <Skeleton 
            animation="wave" 
            variant="rectangular" 
            height={130} 
            sx={{ width: '100%' }}
          />
        </Box>

        <CardContent sx={{ p: 2 }}>
          <Stack spacing={1.5}>
            {/* Project Title */}
            <Stack spacing={0.75}>
              <Skeleton animation="wave" height={28} width="90%" />
              <Skeleton animation="wave" height={20} width="70%" />
            </Stack>

            {/* Description */}
            <Stack spacing={0.5}>
              <Skeleton animation="wave" height={16} width="100%" />
              <Skeleton animation="wave" height={16} width="80%" />
            </Stack>

            {/* Date Information */}
            <Stack direction="row" spacing={2} alignItems="center">
              <Stack spacing={0.25}>
                <Skeleton animation="wave" height={14} width={70} />
                <Skeleton animation="wave" height={16} width={90} />
              </Stack>
              <Stack spacing={0.25}>
                <Skeleton animation="wave" height={14} width={70} />
                <Skeleton animation="wave" height={16} width={90} />
              </Stack>
            </Stack>

            {/* Tags */}
            <Stack direction="row" spacing={1} flexWrap="wrap">
              <Skeleton animation="wave" height={24} width={65} sx={{ borderRadius: 3 }} />
              <Skeleton animation="wave" height={24} width={75} sx={{ borderRadius: 3 }} />
              <Skeleton animation="wave" height={24} width={55} sx={{ borderRadius: 3 }} />
            </Stack>

            {/* Action Button */}
            <Box sx={{ mt: 1 }}>
              <Skeleton animation="wave" height={36} width={100} sx={{ borderRadius: 1 }} />
            </Box>
          </Stack>
        </CardContent>
      </Grid>
    </MainCard>
  );
};

export default ProjectCardSkeleton;