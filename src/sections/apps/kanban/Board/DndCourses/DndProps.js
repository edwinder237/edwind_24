import React from 'react';

function DndProps(theme,dragComponent,DndStyles,collapsed,titleComponent,courseIndex,items, columns){


    const DndProps = {
        courseIndex:courseIndex,
        titleComponent:titleComponent,
        collapsed:false,
        info:{
            pageName: "DndProps",
            shortName: "Module",
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
        items: items,
        columns: columns
    
    };


  return DndProps
}

export default DndProps