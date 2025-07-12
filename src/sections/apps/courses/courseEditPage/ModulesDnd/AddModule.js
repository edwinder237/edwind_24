import PropTypes from 'prop-types';
import { useState } from 'react';

// material-ui
import { Button, Grid, TextField, Stack, Tooltip, Box } from '@mui/material';


// project imports
import { openSnackbar } from 'store/reducers/snackbar';
import SubCard from 'components/MainCard';
import { useDispatch, useSelector } from 'store';
import { addModule } from 'store/reducers/courses';
import IconButton from 'components/@extended/IconButton';

// assets
import { CalculatorOutlined, CloseOutlined, TeamOutlined } from '@ant-design/icons';


// ==============================|| KANBAN BOARD - ADD ITEM ||============================== //

const AddModule = ({ courseId }) => {
  const dispatch = useDispatch();

  const [addTaskBox, setAddTaskBox] = useState(false);
  const {modules=[]} = useSelector((state) => state.courses);
  const handleAddTaskChange = () => {
    setAddTaskBox((prev) => !prev);
  };

  const [title, setTitle] = useState('');
  const [isTitle, setIsTitle] = useState(false);

  const handleAddTask = (event) => {
    if (event.key === 'Enter' || event.keyCode === 13) {
      add();
    }
  };

  
  const newId = parseInt(modules[modules.length-1]?.id) + 1
 const newOrder = modules[modules.length-1]?.moduleOrder + 1
 const currentDate = new Date();
const formattedDate = currentDate.toISOString();

const tempContent = {
  entityMap: {},
  blocks: [
    {
      key: "637gr",
      text: "Write content here",
      type: "unstyled",
      depth: 0,
      inlineStyleRanges: [],
      entityRanges: [],
      data: {},
    },
  ],
};



  const add = () => {
    if (title.length > 0) {
      const newModule = {
        id:newId,
        lastUpdated: formattedDate,
        //createdAt: new Date(), // Assuming you want to set createdAt to the current date and time
        published: true, // Set the default value for published
        title,
        summary: "Sample Summary",
        content: "Sample Content",
        JSONContent: tempContent, // default content for the text editor
        duration: 12, // Set the default duration
        moduleStatus: "active", // Set the default moduleStatus
        backgroundImg: "sample.jpg", // Set a default background image path
        courseId: parseInt(courseId), // Set the course ID
        activities: [], // Assuming activities is an array of objects
        moduleOrder: newOrder // Set the default module order
      };
const newModules = [...modules,newModule]
      dispatch(addModule(newModules,newModule));
      dispatch(
        openSnackbar({
          open: true,
          message: 'Module Added successfully',
          anchorOrigin: { vertical: 'top', horizontal: 'right' },
          variant: 'alert',
          alert: {
            color: 'success'
          },
          close: false
        })
      );
      handleAddTaskChange();
      setTitle('');
    } else {
      setIsTitle(true);
    }
  };

  const handleModuleTitle = (event) => {
    const newTitle = event.target.value;
    setTitle(newTitle);
    if (newTitle.length <= 0) {
      setIsTitle(true);
    } else {
      setIsTitle(false);
    }
  };

  return (
    <Grid container alignItems="center" spacing={1} sx={{ marginTop: 1 }}>
      {addTaskBox && (
        <Grid item xs={12}>
          <SubCard content={false}>
            <Box sx={{ p: 2, pb: 1.5, transition: 'background-color 0.25s ease-out' }}>
              <Grid container alignItems="center" spacing={0.5}>
                <Grid item xs={12}>
                  <TextField
                    fullWidth
                    placeholder="Add Module"
                    value={title}
                    onChange={handleModuleTitle}
                    sx={{
                      mb: 3,
                      '& input': { bgcolor: 'transparent', p: 0, borderRadius: '0px' },
                      '& fieldset': { display: 'none' },
                      '& .MuiFormHelperText-root': {
                        ml: 0
                      },
                      '& .MuiOutlinedInput-root': {
                        bgcolor: 'transparent',
                        '&.Mui-focused': {
                          boxShadow: 'none'
                        }
                      }
                    }}
                    onKeyUp={handleAddTask}
                    helperText={isTitle ? 'Module title is required.' : ''}
                    error={isTitle}
                  />
                </Grid>
                <Grid item>
                  <IconButton>
                    <TeamOutlined />
                  </IconButton>
                </Grid>
                <Grid item>
                  <IconButton>
                    <CalculatorOutlined />
                  </IconButton>
                </Grid>
                <Grid item xs zeroMinWidth />
                <Grid item>
                  <Stack direction="row" alignItems="center" spacing={1}>
                    <Tooltip title="Cancel">
                      <IconButton size="small" color="error" onClick={handleAddTaskChange}>
                        <CloseOutlined />
                      </IconButton>
                    </Tooltip>
                    <Button variant="contained" color="primary" onClick={add} size="small">
                      Add
                    </Button>
                  </Stack>
                </Grid>
              </Grid>
            </Box>
          </SubCard>
        </Grid>
      )}
      {!addTaskBox && (
        <Grid item xs={12}>
          <Button variant="dashed" color="secondary" fullWidth onClick={handleAddTaskChange}>
            Add Module
          </Button>
        </Grid>
      )}
    </Grid>
  );
};

AddModule.propTypes = {
  courseId: PropTypes.oneOfType([PropTypes.string])
};

export default AddModule;
