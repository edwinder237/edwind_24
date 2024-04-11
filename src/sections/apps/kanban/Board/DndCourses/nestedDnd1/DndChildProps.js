import React from 'react';

function DndProps(theme,dragComponent,DndStyles,collapsed,titleComponent,courseIndex,items, columns){

const Collapsed = collapsed === true ? true : false;

    const DndProps = {
        title:false,
        titleComponent:titleComponent,
        collapsed:Collapsed,
        collapsedIndex:courseIndex,

        info:{
            pageName: "DndProps",
            shortName: "Modules",
            childShortName: "Activity"
        },
    
        DndColumnTitles:[
            {column1: "Column 1"},
            {column2: "Column 2"},
        ],
    
        DndDragedComponent: dragComponent,
    
        DndStyles: DndStyles() ,
    
        DndParentFunctions: {},
    
        DndApiRoutes: {},
        items:items,
        columns:columns
    
    };


  return DndProps
}

export default DndProps