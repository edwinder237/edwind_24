import { useTheme } from '@mui/material/styles';


export const dndStyle = () => {
    const theme = useTheme();
    return {
        parentContainerStyle: {
            p: 0,
            px: 0,
            bgcolor: 'transparent',
            display: 'flex',
            overflow: 'auto'
        },
        containerStyle: {
            dragWrapper: {
                minWidth: 350,
                border: '1px solid',
                borderColor: theme.palette.divider,
                borderRadius: `4px`,
                userSelect: 'none',
                margin: `0 ${5}px 0 0`,
                height: '100%'
            },
            dropWrapper: {
                bgcolor: theme.palette.mode === 'dark' ? theme.palette.background.default : theme.palette.secondary.lighter,
                bgcolorDrop: theme.palette.mode === 'dark' ? theme.palette.text.disabled : theme.palette.secondary.light + 65,
                padding: '8px 0px 14px',
                width: 'auto',
                borderRadius: `4px`
            }
        },
        dragItemStyle: {
            userSelect: 'none',
            margin: `0 0 ${8}px 0`,
            padding: 16,
            border: '1px solid',
            borderColor: theme.palette.divider,
            backgroundColor: theme.palette.background.paper,
            borderRadius: `4px`
        },

        dragWrapper :  {
            
              userSelect: 'none',
              margin: `0 0 ${0}px 0`,
              borderColor: theme.palette.divider,
              backgroundColor: theme.palette.background.paper,
              isDragging: theme.palette.background.paper + 99,
              borderRadius: `4px`
          
    }
}
}