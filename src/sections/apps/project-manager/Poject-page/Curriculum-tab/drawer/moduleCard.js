import NextLink from 'next/link';

// material-ui
import { 
  CardContent, 
  Grid, 
  Link, 
  Typography, 
  Box, 
  Chip, 
  Stack,
  Avatar,
  Divider,
  IconButton,
  Tooltip
} from '@mui/material';

// project imports
import MainCard from 'components/MainCard';

// assets
import { BookOutlined, CloseOutlined } from '@ant-design/icons';

// ===========================|| CURRICULUM COURSES DRAWER ||=========================== //

const ModuleCard = ({ curriculum, onClose }) => {
  const courses = curriculum?.curriculum?.curriculum_courses || [];

  return (
    <MainCard
      title={
        <Stack direction="row" alignItems="center" spacing={1}>
          <BookOutlined />
          <Typography variant="h6">
            {curriculum?.curriculum?.title || 'Curriculum'} Courses
          </Typography>
          <Chip 
            label={courses.length} 
            size="small" 
            color="primary" 
            variant="outlined"
          />
        </Stack>
      }
      content={false}
      secondary={
        <Tooltip title="Close">
          <IconButton onClick={onClose}>
            <CloseOutlined />
          </IconButton>
        </Tooltip>
      }
      sx={{ width: '450px', height: '100%', m: 0 }}
    >
      <CardContent sx={{ p: 0 }}>
        {courses.length > 0 ? (
          <Box>
            {courses.map((curriculumCourse, index) => {
              const course = curriculumCourse.course;
              const roles = [];
              
              return (
                <Box key={course.id || index}>
                  <Box sx={{ p: 3 }}>
                    <Grid container alignItems="center" spacing={2}>
                      <Grid item>
                        <Avatar 
                          sx={{ 
                            bgcolor: 'primary.main',
                            width: 56,
                            height: 56
                          }}
                        >
                          <BookOutlined />
                        </Avatar>
                      </Grid>
                      <Grid item xs>
                        <Grid container spacing={1}>
                          <Grid item xs={12}>
                            <Typography variant="h6" color="text.primary">
                              {course.title}
                            </Typography>
                            <Typography variant="body2" color="text.secondary">
                              Course ID: {course.id}
                            </Typography>
                          </Grid>
                          {roles.length > 0 && (
                            <Grid item xs={12}>
                              <Stack direction="row" spacing={1} flexWrap="wrap">
                                {roles.map((courseRole, roleIndex) => (
                                  <Chip
                                    key={roleIndex}
                                    label={courseRole.role.title}
                                    size="small"
                                    variant="outlined"
                                    color="secondary"
                                  />
                                ))}
                              </Stack>
                            </Grid>
                          )}
                        </Grid>
                      </Grid>
                      <Grid item>
                        <NextLink href={`/courses/${course.id}`} passHref legacyBehavior>
                          <Link>
                            <Chip
                              label="View Course"
                              size="small"
                              color="primary"
                              clickable
                              variant="outlined"
                            />
                          </Link>
                        </NextLink>
                      </Grid>
                    </Grid>
                  </Box>
                  {index < courses.length - 1 && <Divider />}
                </Box>
              );
            })}
          </Box>
        ) : (
          <Box sx={{ p: 4, textAlign: 'center' }}>
            <BookOutlined style={{ fontSize: 48, color: '#ccc', marginBottom: 16 }} />
            <Typography variant="h6" color="text.secondary" gutterBottom>
              No Courses Found
            </Typography>
            <Typography variant="body2" color="text.secondary">
              This curriculum doesn't have any courses assigned yet.
            </Typography>
          </Box>
        )}
      </CardContent>
    </MainCard>
  );
};

export default ModuleCard;
