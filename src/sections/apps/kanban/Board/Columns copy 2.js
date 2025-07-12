import PropTypes from 'prop-types';
import { useState } from 'react';

// material-ui
import { useTheme } from '@mui/material/styles';
import { Box, Grid, Tooltip } from '@mui/material';
import CircularProgress from '@mui/material/CircularProgress';

// third-party
import { Droppable, Draggable } from 'react-beautiful-dnd';

// project imports
import EditColumn from './EditColumn';
import Items from './Items';
import AddItem from './AddItem';
import AlertColumnDelete from './AlertColumnDelete';
import { openSnackbar } from 'store/reducers/snackbar';
import { useDispatch, useSelector } from 'store';
import { deleteColumn } from 'store/reducers/kanban';
import IconButton from 'components/@extended/IconButton';

// assets
import { DeleteOutlined } from '@ant-design/icons';


// column drag wrapper
const getDragWrapper = (isDragging, draggableStyle, customStyle) => {

  return {
    ...customStyle.containerStyle.dragWrapper,
    ...draggableStyle
  };
};

// column drop wrapper
const getDropWrapper = (isDraggingOver, customStyle) => {
  const { dropWrapper } = customStyle.containerStyle;
  const bgcolor = dropWrapper.bgcolor;
  const bgcolorDrop = dropWrapper.bgcolorDrop;

  return {
    background: isDraggingOver ? bgcolorDrop : bgcolor,
    ...customStyle.containerStyle.dropWrapper
  };
};

// ==============================|| KANBAN BOARD - COLUMN ||============================== //

const Columns = ({ column, index, styles, title, dragComponent: DragComponent, info,courseIndex }) => {
  const theme = useTheme();
  const dispatch = useDispatch();
  const { items, columns, columnsOrder } = useSelector((state) => state.kanban);
 // console.log(courseIndex)
  const columnItems = column && column.itemIds.map((itemId) => items.filter((item) => item.id === itemId)[0]);
  const handleColumnDelete = () => {
    setOpen(true);
  };
  const [open, setOpen] = useState(false);
  const handleClose = (status) => {
    setOpen(false);
    if (status) {
      dispatch(deleteColumn(column.id, columnsOrder, columns));
      dispatch(
        openSnackbar({
          open: true,
          message: 'Column deleted successfully',
          anchorOrigin: { vertical: 'top', horizontal: 'right' },
          variant: 'alert',
          alert: {
            color: 'success'
          },
          close: false
        })
      );
    }
  };

  if (column &&columnItems[0] && items.length > 0) {
    return (
      <>

        <Draggable draggableId={column.id} index={index}>
          {(provided, snapshot) => (
            <div
              ref={provided.innerRef}
              {...provided.draggableProps}
              {...provided.dragHandleProps}
              style={getDragWrapper(snapshot.isDragging, provided.draggableProps.style, styles)}
            >
              <Droppable droppableId={column.id} type="item">
                {(providedDrop, snapshotDrop) => (
                  <div
                    ref={providedDrop.innerRef}
                    {...providedDrop.droppableProps}
                    style={getDropWrapper(snapshotDrop.isDraggingOver, styles)}

                  >
                    {title}


                    {columnItems && items.length > 0 ?
                      items[0].modules.map((item, i) => (
                        <DragComponent key={item.id} item={item} index={i} info={info} styles={styles} />
                      ))
                      :

                      <>No modules</>
                    }

                    {providedDrop.placeholder}
                    <AddItem columnId={column.id} shortName={info} />
                  </div>
                )}
              </Droppable>
            </div>
          )}
        </Draggable>


      </>
    );
  } else return <Box sx={{ display: 'flex' }}><CircularProgress /></Box>;
};

Columns.propTypes = {
  column: PropTypes.object,
  index: PropTypes.number,
  title: PropTypes.object,
};

export default Columns;
