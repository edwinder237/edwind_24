import React from 'react';
import { useState } from 'react';

// material-ui
import { useTheme } from '@mui/material/styles';
import {
  Avatar,
  Box,
  Button,
  List,
  ListItem,
  ListItemButton,
  ListItemText,
  Menu,
  MenuItem,
  Typography,
  Stack
} from '@mui/material';


// project imports

import AlertItemDelete from '../AlertItemDelete';
import { openSnackbar } from 'store/reducers/snackbar';
import { useDispatch, useSelector } from 'store';
import { selectItem, deleteItem } from 'store/reducers/kanban';
import IconButton from 'components/@extended/IconButton'
import MainCard from 'components/MainCard';


//Dnd imports 
import DndApp from 'utils/DndApp';

//drag and drop components 1
import DndProps from 'sections/apps/kanban/Board/DndCourses/nestedDnd1/DndChildProps';
//passed as a prop to DndProps
import { dndStyle as childStyle } from 'sections/apps/kanban/Board/DndCourses/nestedDnd1/DndChildStyles';
import { Activity } from 'sections/apps/kanban/Board/DndCourses/nestedDnd1/Activity';
import ColumnTitle from 'sections/apps/kanban/Board/DndCourses/nestedDnd1/ChildTitle';

// third-party
import { Draggable } from 'react-beautiful-dnd';

// assets
import { MoreOutlined, PlusCircleOutlined, DownOutlined, MenuOutlined } from '@ant-design/icons';
import { motion, AnimatePresence } from "framer-motion"
import { bgcolor } from '@mui/system';

// avatar style
const avatarSX = {
  width: 36,
  height: 36,
  fontSize: '1rem'
};

// action style
const actionSX = {
  mt: 0,
  ml: 0,

  alignSelf: 'flex-start',
  transform: 'none'
};

// item drag wrapper
const getDragWrapper = (isDragging, draggableStyle, theme, styles) => {
  const bgcolor = theme.palette.background.paper + 99;

  return {
    ...styles.dragWrapper, // spread styles.dragWrapper object
    backgroundColor: isDragging ? styles.dragWrapper.isDragging : styles.dragWrapper.backgroundColor,
    ...draggableStyle
  };
};



export const CourseEdit = ({ item, index, info, styles }) => {

  // creates an array of column objects with keys of: columnId, title and itemIds

  function getColumnsObjects(data, index) {

    const columnIdsData = {
      column1: 'column-1',
      column2: 'column-2',
      column3: 'column-3'
    };

    const columnNumber = [1]

    const arrays = item.activities ? item.activities : [0];


    return columnNumber.map((column, i) => ({
      id: columnIdsData.column2,
      title: "new",
      itemIds: arrays && arrays.map((module) => module.id)
    }))

  }
  const kanban = useSelector((state) => state.kanban);
  const { userStory, items, columns, modules, nestedColumns2 } = kanban;



  const columsProps = nestedColumns2;
  const itemsData = item.activities && item.activities.length > 0 ? item.activities : [null];
  //console.log(itemsData);
  const theme = useTheme();
  const dispatch = useDispatch();
  const [collapsed, setCollapsed] = useState(false);
  const [rotate, setRotate] = useState(0);

  const backProfile = item && item.image && `/assets/images/profile/${item.image}`;



  //const itemStory = userStory.filter((story) => story?.itemIds?.filter((itemId) => itemId === item.id)[0])[0];


  const handleCollapse = () => {
    setCollapsed((prevState) => !prevState);
    rotate === 0 ? setRotate(-180)
      : setRotate(0);
  };


  const handleAddTask = () => {
    console.log("add task");
  };

  const handlerDetails = (id) => {
    dispatch(selectItem(id));
  };

  const [anchorEl, setAnchorEl] = useState(null);
  const handleClick = (event) => {
    setAnchorEl(event?.currentTarget);
  };

  const handleClose = () => {
    setAnchorEl(null);
  };

  const [open, setOpen] = useState(false);
  const handleModalClose = (status) => {
    setOpen(false);
    if (status) {
      //dispatch(deleteItem(item.id, items, columns, userStory));
      dispatch(deleteItem(item.id, modules, columns, userStory));
      dispatch(
        openSnackbar({
          open: true,
          message: 'Task Deleted successfully',
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

  const [openStoryDrawer, setOpenStoryDrawer] = useState(false);
  const handleStoryDrawerOpen = () => {
    setOpenStoryDrawer((prevState) => !prevState);
  };

  const editStory = () => {
    setOpenStoryDrawer((prevState) => !prevState);
  };

  // DND Props genreation (theme,component,style,collapsed,index,titleComponent)
  const DndNestedProps = DndProps(theme, Activity, childStyle, null, ColumnTitle, null, itemsData, columsProps);

  //console.log(item);
  return (
    <>
      <Draggable key={item.id} draggableId={item.id} index={index}>

        {(provided, snapshot) => (
          <Box
            ref={provided.innerRef}
            {...provided.draggableProps}
            {...provided.dragHandleProps} 
            style={getDragWrapper(snapshot.isDragging, provided.draggableProps.style, theme, styles)}
          >

              <MainCard sx={{ mt: 0, bgcolor: "" }} content={false}>
                <List
                  component="nav"
                  sx={{
                    px: 0,
                    py: 0,
                    '& .MuiListItemButton-root': {
                      py: 0, // py: 1.5 default
                      px: 0, //aaded to cut off the padding
                      '& .MuiAvatar-root': avatarSX,
                      '& .MuiListItemSecondaryAction-root': { ...actionSX, position: 'relative' }
                    }
                  }}
                >

                  <ListItemButton divider>


                    <Box width={1} height={100} sx={{ pt: 0, bgcolor: "", display: "flex", flexDirection: "row" }}  >

                      <Box id="container 1" bgcolor="" maxWidth="80px" minWidth="80px">
                        <Box sx={{ bgcolor: "", display: "flex", alignItems: "flex-end", justifyContent: "center" }} width={1} height={0.5} >
                          <Avatar
                            sx={{
                              color: 'primary',
                              bgcolor: '#9254DE',
                            }}
                          >
                            {item.sortorder}
                          </Avatar>
                        </Box>
                        <Box sx={{ bgcolor: "", pb: 1, display: "flex", alignItems: "flex-end", justifyContent: "center" }} width={1} height={0.5} >
                          <motion.div className="box" animate={{ rotate }} transition={{ type: "tween", duration: 0.5 }}>
                            {item.hasChildren ? <IconButton sx={{ fontSize: "0.6rem" }} onClick={handleCollapse} component={DownOutlined} /> : null}
                          </motion.div >
                        </Box>
                      </Box>

                      <ListItem
                        id="tile"
                        sx={{
                          pt: '2px',
                          minWidth: '120px',
                          width: 1,
                          maxWidth: '100%',
                          height: 100,
                          bgcolor: '',
                        }}
                        onClick={() => handlerDetails(item.id)}
                      >
                        <Stack direction="column" width={1}>
                          <ListItemText

                            primary={
                              <Typography
                                variant="subtitle1"
                                sx={{
                                  display: 'inline-block',
                                  width: 'calc(100% - 34px)',
                                  textOverflow: 'ellipsis',
                                  whiteSpace: 'nowrap',
                                  overflow: 'hidden',
                                  verticalAlign: 'middle',
                                  cursor: 'pointer',
                                  '&:hover': {
                                    textDecoration: 'underline',
                                  },
                                }}
                                onClick={() => handlerDetails(item.id)}
                              >
                                {item.title || item.name}
                              </Typography>
                            }
                          />
                          {!item.hasChildren ?
                            <ListItemButton>
                              <Stack direction="column">
                                <Button
                                  size="small"
                                  variant="text"
                                  onClick={handleAddTask}
                                  startIcon={<PlusCircleOutlined />}
                                >
                                  {`Add ${info.childShortName}`}
                                </Button>
                              </Stack>
                            </ListItemButton>
                            :
                            <Typography variant="body2" color="primary">
                              {item.modules ? item.modules.length : item.activities.length} activities
                            </Typography>

                          }



                        </Stack>
                      </ListItem>





                      <Box id="timming" minWidth={70} height={100} sx={{ display: "flex", alignItems: "center", justifyContent: "center", bgcolor: "", }} bgcolor="">
                        <Stack alignItems="center">
                          <Typography variant="subtitle1" noWrap>
                            {item.duration}
                          </Typography>
                          <Typography variant="h6" color="secondary" noWrap>
                            min
                          </Typography>
                        </Stack>
                      </Box>
                      <Box id="button" paddingRight="20px" minWidth={35} height={100} sx={{ display: "flex", alignItems: "center", justifyContent: "center" }} bgcolor="">
                        <IconButton size="small" color="secondary" onClick={handleClick} aria-controls="menu-comment" aria-haspopup="true">
                          <MoreOutlined />
                        </IconButton>
                      </Box>
                    </Box>


                    <Menu
                      id="menu-comment"
                      anchorEl={anchorEl}
                      keepMounted
                      open={Boolean(anchorEl)}
                      onClose={handleClose}
                      variant="selectedMenu"
                      anchorOrigin={{
                        vertical: 'bottom',
                        horizontal: 'right'
                      }}
                      transformOrigin={{
                        vertical: 'top',
                        horizontal: 'right'
                      }}
                    >
                      <MenuItem
                        onClick={() => {
                          handleClose();
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
                    <AlertItemDelete title="title" open={open} handleClose={handleModalClose} />
                  </ListItemButton>



                </List>
              </MainCard>


              <>
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
                        collapsed: { opacity: 0, height: 0 }
                      }}
                      transition={{ duration: 0.5 }}
                    >

                      <DndApp props={DndNestedProps} />
                    </motion.section>
                  )}
                </AnimatePresence>
              </>

          </Box>
        )}
      </Draggable>
    </>
  )
}