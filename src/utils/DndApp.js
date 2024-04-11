import Board from '../sections/apps/kanban/Board/index';

import React from 'react'

function DndApp(props) {
 // console.log(props)
  return (
    <Board childrenProps={props} />
  )
}

export default DndApp


//If State = hasChildren then return Board with c

// pass the haschildren state to the board component from CourseEdit 