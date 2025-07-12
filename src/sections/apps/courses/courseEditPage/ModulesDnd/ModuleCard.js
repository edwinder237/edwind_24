import React, { useEffect } from "react";
import { useState } from "react";
import { useDispatch, useSelector } from "store";
import { format } from 'date-fns';

// third-party
import { Draggable } from "@hello-pangea/dnd";

// material-ui
import { useTheme } from "@mui/material/styles";
import {
  Avatar,
  Box,
  Button,
  Card,
  CardActions,
  CardContent,
  ListItemButton,
  ListItemText,
  Menu,
  MenuItem,
  Typography,
} from "@mui/material";

// project imports
import IconButton from "components/@extended/IconButton";
import ActivitiesDnd from "../ActivitiesDnd/ActivitiesDndContainer";
import AlertModuleDelete from "./AlertModuleDelete";
import { selectItem, deleteItem } from "store/reducers/courses";
import { openSnackbar } from "store/reducers/snackbar";


// assets
import {
  MoreOutlined,
  PlusCircleOutlined,
  DownOutlined,
} from "@ant-design/icons";
import { motion, AnimatePresence } from "framer-motion";

// item drag wrapper
const getDragWrapper = (isDragging, draggableStyle, theme, radius) => {
  const bgcolor = theme.palette.background.paper + 99;
  return {
    userSelect: "none",
    margin: `0 0 ${0}px 0`,
    padding: 0,
    border: "1px solid",
    borderColor: theme.palette.divider,
    backgroundColor: isDragging ? bgcolor : theme.palette.background.paper,
    borderRadius: radius,
    ...draggableStyle,
  };
};

export const ModuleCard = ({ item, index, courseIndex, moduleId, isSelected, onClick }) => {
  const moduleIndex = index;
  const theme = useTheme();
  const [collapsed, setCollapsed] = useState(false);
  const [rotate, setRotate] = useState(0);
  const dispatch = useDispatch();
  const {modules,response} = useSelector((state)=>state.courses)

  const handlerDetails = (id) => {
    dispatch(selectItem(id));
  };

  const handleCollapse = () => {
    setCollapsed((prevState) => !prevState);
    rotate === 0 ? setRotate(-180) : setRotate(0);
  };

  const [anchorEl, setAnchorEl] = useState(null);
  const handleClick = (event) => {
    setAnchorEl(event?.currentTarget);
  };

  const handleClose = () => {
    setAnchorEl(null);
  };


    console.log(response)

  
  const [open, setOpen] = useState(false);

  const  handleModalClose  = async (status) => {
    setOpen(false);
    if (status && modules) {
      
     await dispatch(deleteItem(moduleId,modules));
      dispatch(
        openSnackbar({
          open: true,
          message: response,
          anchorOrigin: { vertical: "top", horizontal: "right" },
          variant: "alert",
          alert: {
            color: "success",
          },
          close: false,
        })
      );
    }
  };

  const date = new Date(item.lastUpdated);

  if (item)
    return (
      <>
        <Draggable key={item.id} draggableId={item.id.toString()} index={index}>
          {(provided, snapshot) => (
            <div
              ref={provided.innerRef}
              {...provided.draggableProps}
              style={getDragWrapper(
                snapshot.isDragging,
                provided.draggableProps.style,
                theme,
                `4px`
              )}
            >
              <Card
                onClick={onClick}
                sx={{
                  bgcolor: isSelected ? "red" : "initial",
                  minWidth: 1,
                }}
              >
                <Box display="flex">
                  <CardContent
                    {...provided.dragHandleProps}
                    sx={{
                      bgcolor: "",
                      minWidth: "30px",
                      flexDirection: "column",
                      pl: 4,
                    }}
                  >
                    <Avatar
                      sx={{
                        color: "white",
                        bgcolor: "primary.main",
                        mb: 1.4,
                      }}
                    >
                      {index + 1}
                    </Avatar>
                    {/* Collapse Button */}
                    <Box
                      sx={{
                        bgcolor: "",
                        pb: 1,
                        display: "flex",
                        alignItems: "flex-end",
                        justifyContent: "center",
                      }}
                      width={1}
                      height={0.5}
                    >
                      <motion.div
                        className="box"
                        animate={{ rotate }}
                        transition={{ type: "tween", duration: 0.5 }}
                      >
                        {item.activities.length > 0 ? (
                          <IconButton
                            sx={{ fontSize: "0.6rem" }}
                            onClick={handleCollapse}
                            component={DownOutlined}
                          />
                        ) : null}
                      </motion.div>
                    </Box>
                  </CardContent>
                  <CardContent
                    sx={{ bgcolor: "", width: "80%", flexGrow: 1, pb: 0 }}
                  >
                    <Typography variant="h5">{item.title}</Typography>
                    <Typography
                      variant="h7"
                      color="text.secondary"
                      component="div"
                    >
                      {item.summary}
                      <br />
                     {`lastUpdated: ${format(date,'dd-MM-yy HH:mm:ss')}`}
                    </Typography>
                    <Typography
                      variant="caption"
                      color="error.main"
                      component="div"
                    >
                      version 3.4.6
                    </Typography>
                    {item.activities.length === 0 ? (
                      <ListItemText sx={{ bgcolor: "", pl: 0 }}>
                        <Button
                          size="small"
                          variant="text"
                          onClick={null}
                          startIcon={<PlusCircleOutlined />}
                        >
                          {`Add Activity`}
                        </Button>
                      </ListItemText>
                    ) : (
                      <Typography variant="body2" color="primary">
                        {item.activities.length}{" "}
                        {`Activit${item.activities.length > 1 ? "ies" : "y"}`}
                      </Typography>
                    )}
                  </CardContent>
                  <CardContent
                    sx={{
                      bgcolor: "",

                      flexGrow: 4,
                      display: "flex",
                      flexDirection: "column",
                      justifyContent: "center",
                      alignItems: "center",
                    }}
                  >
                    <Typography sx={{ fontSize: 14 }} color="text.secondary">
                      {item.duration}
                    </Typography>
                    <Typography variant="h6" component="div">
                      min
                    </Typography>
                  </CardContent>
                  <CardActions
                    sx={{
                      bgcolor: "",
                      width: "50px",
                      justifyContent: "center",
                    }}
                  >
                    <IconButton
                      size="small"
                      color="secondary"
                      onClick={handleClick}
                      aria-controls="menu-comment"
                      aria-haspopup="true"
                    >
                      <MoreOutlined />
                    </IconButton>
                  </CardActions>
                </Box>
                {/* Menu */}
                <Menu
                  id="menu-comment"
                  anchorEl={anchorEl}
                  keepMounted
                  open={Boolean(anchorEl)}
                  onClose={handleClose}
                  variant="selectedMenu"
                  anchorOrigin={{
                    vertical: "bottom",
                    horizontal: "right",
                  }}
                  transformOrigin={{
                    vertical: "top",
                    horizontal: "right",
                  }}
                >
                  <MenuItem
                    onClick={() => {
                      //handleClose();
                      handlerDetails(item.id);
                    }}
                  >
                    Edit
                  </MenuItem>
                  <MenuItem
                    onClick={() => {
                      handleClose();
                      setOpen(true);
                    }}
                  >
                    Delete
                  </MenuItem>
                </Menu>
                <AlertModuleDelete
                  title={item.title}
                  open={open}
                  handleClose={handleModalClose}
                />
              </Card>

              {/* Header */}
              <motion.header
                initial={false}
                onClick={() => setExpanded(isOpen ? false : i)}
              />
              <AnimatePresence initial={false}>
                {collapsed && (
                  <motion.section
                    key="content"
                    initial="collapsed"
                    animate="open"
                    exit="collapsed"
                    variants={{
                      open: { opacity: 1, height: "auto" },
                      collapsed: { opacity: 0, height: 0 },
                    }}
                    transition={{ duration: 0.5 }}
                  >
                    {/* Content Goes Here */}
                    <ActivitiesDnd
                      activities={item.activities}
                      courseIndex={courseIndex}
                      moduleIndex={moduleIndex}
                      moduleId={moduleId}
                    />
                  </motion.section>
                )}
              </AnimatePresence>
            </div>
          )}
        </Draggable>
      </>
    );
};
