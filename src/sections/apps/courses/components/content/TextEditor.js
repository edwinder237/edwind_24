import React, { useState, useEffect, forwardRef, useImperativeHandle, useCallback } from "react";
import { useDispatch, useSelector } from "store";
import { updateModuleContent } from 'store/reducers/courses';
import { openSnackbar } from 'store/reducers/snackbar';
import { useTheme } from "@mui/material/styles";
import { ThemeMode } from "config";
import { Button, Box, CircularProgress, Typography, TextField } from "@mui/material";

const TextEditor = forwardRef(({ selectedModuleId, courseId }, ref) => {
  console.log('TextEditor component rendering with:', { selectedModuleId, courseId, hasRef: !!ref });
  const theme = useTheme();
  const dispatch = useDispatch();
  const [content, setContent] = useState('');
  const [isLoading, setIsLoading] = useState(true);

  const { modules, courses } = useSelector((store) => store.courses);
  const selectedModule = modules.find((module) => module.id === selectedModuleId);
  const course = courses.find((course) => course.id.toString() === courseId);

  useEffect(() => {
    const loadContent = (contentData) => {
      let textContent = '';
      
      // Try to extract text from draft-js format if it exists
      if (contentData && contentData.blocks) {
        textContent = contentData.blocks.map(block => block.text || '').join('\n');
      } else if (typeof contentData === 'string') {
        textContent = contentData;
      }
      
      if (!textContent) {
        textContent = 'Start writing your content here...';
      }
      
      setContent(textContent);
      setIsLoading(false);
    };

    if (selectedModule) {
      loadContent(selectedModule.JSONContent);
    } else if (course) {
      loadContent(course.JSONSyllabus);
    } else {
      setContent('Start writing your content here...');
      setIsLoading(false);
    }
  }, [selectedModule, course]);

  const handleContentChange = (event) => {
    setContent(event.target.value);
  };

  const handleSave = React.useCallback(async () => {
    if (!content) {
      return;
    }
    
    try {
      // Convert text content to a simple format that can be stored
      const contentData = {
        blocks: [
          {
            key: 'default',
            text: content,
            type: 'unstyled',
            depth: 0,
            inlineStyleRanges: [],
            entityRanges: [],
            data: {}
          }
        ],
        entityMap: {}
      };
      
      if (selectedModuleId) {
        const updatedModules = modules.map((module) => {
          if (module.id === selectedModuleId) {
            return {
              ...module,
              JSONContent: contentData,
            };
          }
          return module;
        });

        await dispatch(updateModuleContent(updatedModules, selectedModuleId, contentData));
      }

      dispatch(openSnackbar({
        open: true,
        message: 'Content saved successfully',
        anchorOrigin: { vertical: 'top', horizontal: 'right' },
        variant: 'alert',
        alert: {
          color: 'success'
        },
        close: false
      }));
    } catch (error) {
      console.error('Error saving content:', error);
      dispatch(openSnackbar({
        open: true,
        message: 'Error saving content. Please try again.',
        anchorOrigin: { vertical: 'top', horizontal: 'right' },
        variant: 'alert',
        alert: {
          color: 'error'
        },
        close: false
      }));
    }
  }, [content, selectedModuleId, modules, dispatch]);

  // Expose save function to parent component
  useImperativeHandle(ref, () => {
    return {
      save: handleSave
    };
  }, [handleSave]);

  if (isLoading) {
    return (
      <Box 
        display="flex" 
        justifyContent="center" 
        alignItems="center" 
        minHeight={200}
        flexDirection="column"
        gap={2}
      >
        <CircularProgress />
        <Typography variant="body2" color="textSecondary">
          Loading editor...
        </Typography>
      </Box>
    );
  }

  return (
    <TextField
      fullWidth
      multiline
      rows={30}
      value={content}
      onChange={handleContentChange}
      placeholder="Start writing your content here..."
      variant="outlined"
      sx={{
        '& .MuiOutlinedInput-root': {
          minHeight: '900px',
          alignItems: 'flex-start'
        }
      }}
    />
  );
});

TextEditor.displayName = 'TextEditor';

export default TextEditor;
