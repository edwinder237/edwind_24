import { useState } from 'react';

// material-ui
import { CardContent, Chip, Checkbox, FormControlLabel, Grid, Tooltip, Typography } from '@mui/material';

// project imports
import MainCard from 'components/MainCard';
import CardTable from './cardTable';
import {  useSelector } from "store";

// assets
import { PlusCircleOutlined } from '@ant-design/icons';
import IconButton from 'components/@extended/IconButton';

// ===========================|| DATA WIDGET - TODO LIST ||=========================== //


const CurriculumCard = ({curriculum}) => {
  const { project_curriculums } = useSelector((state) => state.projects);
  const [state, setState] = useState({
    checkedA: true,
    checkedB: true,
    checkedC: true,
    checkedD: false,
    checkedE: false,
    checkedF: false,
    checkedG: false
  });
  const Curriculum = curriculum.curriculum;
 
  const [items, setItems] = useState(Curriculum?.curriculum_courses);
  //console.log(curriculum)

  function handleAddItems(newItem) {
    const newIt = { title: 'new thing' };
    setItems([...items, newIt]);
  }

  const handleChangeState = (event) => {
    setState({ ...state, [event.target.name]: event.target.checked });
  };

  return (
    <MainCard
      title={Curriculum?.title}
      content={false}
      secondary={
        <Grid  container  sx={{display:'flex', alignItems:'center', justifyContent: 'space-between' }}>

          <Grid item>
            <Tooltip title="Add Task">
              <IconButton onClick={handleAddItems}>
                <PlusCircleOutlined />
              </IconButton>
            </Tooltip>
          </Grid>
        
        </Grid>
        
      }
      sx={{ '& .MuiCardHeader-root': { p: 1.75 } }}
    >
  
      <CardTable data={items}/>

    </MainCard>
  );
};

export default CurriculumCard;
