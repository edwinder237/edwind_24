
// material-ui
import { Box } from '@mui/material';

// third-party
import { DragDropContext, Droppable } from '@hello-pangea/dnd';
import { useTheme } from '@mui/material/styles';


// project imports
import AddItem from './AddActivity';
import activityDetails from './activityDetails';
import ScrollX from 'components/ScrollX';
import { ThemeMode } from 'config';



import { useDispatch, useSelector } from 'store';
import { updateCoursesOrder } from 'store/reducers/courses';

// dev only 

import { DraggableCard } from '../ModulesDnd/ModuleCard';


// column drop wrapper
const getDropWrapper = (isDraggingOver, theme, radius) => {
  const bgcolor = theme.palette.mode === ThemeMode.DARK ? theme.palette.background.default : theme.palette.secondary.lighter;
  const bgcolorDrop = theme.palette.mode === ThemeMode.DARK ? theme.palette.text.disabled : theme.palette.secondary.light + 65;

  return {
   background: isDraggingOver ? bgcolorDrop : bgcolor ,
    padding: '8px 0px 14px',
    width: '100%',
    borderRadius: radius
  };
};

// ==============================|| COURSES - MODULESDND ||============================== //

// accepts props: items,styles

const ModulesDnd = () => {
  const theme = useTheme();
  const dispatch = useDispatch();

  const { courses, columnsOrder } = useSelector((state) => state.courses);
const items = [];
  // Dnd needs to display only column titl

  const columns = courses;


  // colomn contains an array of all courses
  const column = columns[0];
  //const columnItems = column.itemIds.map((itemId) => items.filter((item) => item.id !== itemId)[0]);

  // handle drag & drop
  const onDragEnd = (result) => {
    const { source, destination, draggableId, type } = result;

    console.log(result)

    if (!destination) return;
    if (destination.droppableId === source.droppableId && destination.index === source.index) return;

    if (type === 'DraggableCard') {
      //const newItemsOrder = Array.from(columnsOrder);
      const newItemsOrder = Array.from(courses);
      const draggedItem = newItemsOrder.filter((item)=>item.id.toString() === draggableId)[0]
    
      newItemsOrder.splice(source.index, 1); // remove dragged column
      newItemsOrder.splice(destination?.index, 0, draggedItem); // set column new position

      dispatch(updateCoursesOrder(newItemsOrder));
      return;
    }
  };
  if (column) {
    return (

      <Box sx={{ display: 'flex' }}>

        <ScrollX>
          <DragDropContext onDragEnd={onDragEnd}>
            <Droppable droppableId="id" type="DraggableCard">
              {(providedDrop, snapshotDrop) => (
                <div
                  ref={providedDrop.innerRef}
                  {...providedDrop.droppableProps}
                  style={getDropWrapper(snapshotDrop.isDraggingOver, theme, `4px`)}
                >
                  {courses.map((item, i) => (
                    <DraggableCard key={i} item={item} index={i}/>
                  ))}
                  {providedDrop.placeholder}
                  <AddItem columnId={column.id} />
                </div>
              )}
            </Droppable>
          </DragDropContext>
        </ScrollX>
        <activityDetails />
      </Box>

    );
  }


};



export default ModulesDnd;
