import { useState } from "react";
// material-ui
import { Box } from "@mui/material";

// third-party
import { DragDropContext, Droppable } from "@hello-pangea/dnd";
import { useTheme } from "@mui/material/styles";

// project imports
import AddModule from "./AddModule";
import ItemDetails from "./moduleDetails";
import ScrollX from "components/ScrollX";
import { ThemeMode } from "config";

import { useDispatch, useSelector } from "store";
import { updateModulesOrder } from "store/reducers/courses";
import { openSnackbar } from "store/reducers/snackbar";

import { ModuleCard } from "./ModuleCard";

// column drop wrapper
const getDropWrapper = (isDraggingOver, theme, radius) => {
  const bgcolor =
    theme.palette.mode === ThemeMode.DARK
      ? theme.palette.background.default
      : theme.palette.secondary.lighter;
  const bgcolorDrop =
    theme.palette.mode === ThemeMode.DARK
      ? theme.palette.text.disabled
      : theme.palette.secondary.light + 65;

  return {
    background: isDraggingOver ? bgcolorDrop : bgcolor,
    padding: "8px 0px 14px",
    width: "100%",
    borderRadius: radius,
  };
};

// ==============================|| COURSES - MODULESDND ||============================== //

const ModulesDnd = ({ courseId,getSelectedModuleId }) => {
  const theme = useTheme();
  const dispatch = useDispatch();

  const { modules } = useSelector((state) => state.courses);

  // handle drag & drop
  const onDragEnd = (result) => {
    const { source, destination, draggableId, type } = result;

    if (!destination) return;
    if (
      destination.droppableId === source.droppableId &&
      destination.index === source.index
    )
      return;

    if (type === "DraggableCard") {
      //const newItemsOrder = Array.from(columnsOrder);
      const newItemsOrder = Array.from(modules);
      const draggedItem = newItemsOrder.filter(
        (item) => item.id.toString() === draggableId
      )[0];

      newItemsOrder.splice(source.index, 1); // remove dragged column
      newItemsOrder.splice(destination?.index, 0, draggedItem); // set column new position

      dispatch(updateModulesOrder(newItemsOrder, courseId));
      dispatch(
        openSnackbar({
          open: true,
          message: "order saved",
          anchorOrigin: { vertical: "top", horizontal: "right" },
          variant: "alert",
          alert: {
            color: "success",
          },
          close: false,
        })
      );
      return;
    }
  };

  const [selectedCard, setSelectedCard] = useState(null);

  const handleCardClick = (cardId) => {
    setSelectedCard(cardId);
    getSelectedModuleId(cardId)
  };
  
  if (modules) {
    return (
      <Box sx={{ display: "flex" }}>
        <ScrollX>
          <DragDropContext onDragEnd={onDragEnd}>
            <Droppable droppableId="id" type="DraggableCard">
              {(providedDrop, snapshotDrop) => (
                <div
                  ref={providedDrop.innerRef}
                  {...providedDrop.droppableProps}
                  style={getDropWrapper(
                    snapshotDrop.isDraggingOver,
                    theme,
                    `4px`
                  )}
                >
                  {modules.map((module, i) => (
                    <ModuleCard
                      key={module.id}
                      item={module}
                      index={i}
                      courseId={courseId}
                      moduleId={module.id}
                      isSelected={module.id === selectedCard} // Pass isSelected prop
                      onClick={() => handleCardClick(module.id)} // Pass click handler
                    />
                  ))}
                  {providedDrop.placeholder}
                  <AddModule courseId={courseId} />
                </div>
              )}
            </Droppable>
          </DragDropContext>
        </ScrollX>
        <ItemDetails moduleId={selectedCard}  />
      </Box>
    );
  }
};

export default ModulesDnd;
