import React, { useState, useEffect } from "react";
import { useDispatch, useSelector } from "store";
import { updateModuleContent } from 'store/reducers/courses';
import { openSnackbar } from 'store/reducers/snackbar';
import dynamic from "next/dynamic";
import "react-draft-wysiwyg/dist/react-draft-wysiwyg.css";
import {
  EditorState,
  ContentState,
  convertToRaw,
  convertFromRaw,
} from "draft-js";
import { useTheme } from "@mui/material/styles";
import { ThemeMode } from "config";
import { Button } from "@mui/material";
import "../../../../styles/editorStyles.module.css"; 

const Editor = dynamic(
  () => import("react-draft-wysiwyg").then((module) => module.Editor),
  { ssr: false }
);

function TextEditor({ selectedModuleId, courseId }) {
  const theme = useTheme();
  const dispatch = useDispatch();
  const [editorState, setEditorState] = useState(null);

  const { modules, courses } = useSelector((store) => store.courses);
  const selectedModule = modules.find((module) => module.id === selectedModuleId);
  const course = courses.find((course) => course.id.toString() === courseId);

  useEffect(() => {
    const loadEditorState = (content) => {
      const moduleContent = EditorState.createWithContent(
        convertFromRaw(content)
      );
      setEditorState(moduleContent);
    };

    if (selectedModule) {
      loadEditorState(selectedModule.JSONContent);
    } else {
      loadEditorState(course.JSONSyllabus);
    }
  }, [selectedModule, course]);

  if (!editorState) {
    return null; 
  }

  const onEditorStateChange = (newEditorState) => {
    setEditorState(newEditorState);
  };

  const handleSave = async () => {
    try {
      const editedJSON = convertToRaw(editorState.getCurrentContent());
      const updatedModules = modules.map((module) => {
        if (module.id === selectedModuleId) {
          return {
            ...module,
            JSONContent: editedJSON,
          };
        }
        return module;
      });

      await dispatch(updateModuleContent(updatedModules, selectedModuleId, editedJSON));

      dispatch(openSnackbar({
        open: true,
        message: 'Content Saved',
        anchorOrigin: { vertical: 'top', horizontal: 'right' },
        variant: 'alert',
        alert: {
          color: 'success'
        },
        close: false
      }));
    } catch (error) {
      // Handle the error
    }
  };

  return (
    <div>
      <Button onClick={handleSave} variant="contained">
        Save
      </Button>
      <Editor
        editorState={editorState}
        editorStyle={{ minHeight: "900px" }}
        onEditorStateChange={onEditorStateChange}
      />
    </div>
  );
}

export default TextEditor;
