import React from 'react';
import { useState } from 'react';

// third-party
import { Draggable } from '@hello-pangea/dnd';

// material-ui
import { useTheme } from '@mui/material/styles';
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
  Typography
} from '@mui/material';


// project imports
import IconButton from 'components/@extended/IconButton'
import ActivitiesDnd from './ActivitiesDndContainer';




// assets
import { MoreOutlined, PlusCircleOutlined, DownOutlined } from '@ant-design/icons';
import { motion, AnimatePresence } from "framer-motion"



// item drag wrapper
const getDragWrapper = (isDragging, draggableStyle, theme, radius) => {
  const bgcolor = theme.palette.background.paper + 99;
  return {
    userSelect: 'none',
    margin: `0 0 ${0}px 0`,
    padding: 0,
    border: '1px solid',
    borderColor: theme.palette.divider,
    backgroundColor: isDragging ? bgcolor : theme.palette.background.paper,
    borderRadius: radius,
    ...draggableStyle
  };
};


export const ActivityCard = ({ item, index }) => {

  const theme = useTheme();
  const [collapsed, setCollapsed] = useState(false);
  const [rotate, setRotate] = useState(0);


  const handleCollapse = () => {
    setCollapsed((prevState) => !prevState);
    rotate === 0 ? setRotate(-180)
      : setRotate(0);
  };



  const [anchorEl, setAnchorEl] = useState(null);
  const handleClick = (event) => {
    setAnchorEl(event?.currentTarget);
  };

  const handleClose = () => {
    setAnchorEl(null);
  };

  if(item)
  return (
    <>

      <Draggable  draggableId={item.id.toString()} index={index}>
        {(provided, snapshot) => (
          <div
            ref={provided.innerRef}
            {...provided.draggableProps}
            {...provided.dragHandleProps}
            style={getDragWrapper(snapshot.isDragging, provided.draggableProps.style, theme, `4px`)}
          >

            

            <Card sx={{ minWidth: 1, }} >

              <Box display="flex">
                <CardContent
                  sx={{
                    bgcolor: 'white',
                    minWidth: '30px',
                    flexDirection: 'column',
                    pl: 4


                  }}
                >

                  <Avatar
                    sx={{
                      color: 'white',
                      bgcolor: 'primary.main',
                      mb: 1.4
                    }}
                  >
                    {item.id}
                  </Avatar>
                </CardContent>
                <CardContent
                  sx={{ bgcolor: '', width: '80%', flexGrow: 1, pb: 0 }}
                >
                  <Typography variant="h5" >
                    {item.title}
                  </Typography>
                  <Typography variant="h7" color="text.secondary" component="div">
                    Covering te basics of CRM
                  </Typography>
                  <Typography variant="caption" color="error.main" component="div">
                    {item.activityType}
                  </Typography>
                </CardContent>
                <CardContent
                  sx={{
                    bgcolor: '',

                    flexGrow: 4,
                    display: 'flex',
                    flexDirection: 'column',
                    justifyContent: 'center',
                    alignItems: 'center'
                  }}
                >
                  <Typography sx={{ fontSize: 14, }} color="text.secondary" >
                    678
                  </Typography>
                  <Typography variant="h6" component="div">
                    min
                  </Typography>
                </CardContent>
                <CardActions
                  sx={{ bgcolor: '', width: '50px', justifyContent: 'center', }}
                >
                  <IconButton size="small" color="secondary" onClick={handleClick} aria-controls="menu-comment" aria-haspopup="true">
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
                    collapsed: { opacity: 0, height: 0 }
                  }}
                  transition={{ duration: 0.5 }}
                >
                  {/* Content Goes Here */}
                  <ActivitiesDnd modules={item.modules}/>
                </motion.section>
              )}
            </AnimatePresence>
          </div>
        )}
      </Draggable>
    </>
  )

}