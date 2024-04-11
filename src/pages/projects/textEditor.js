import { useState } from 'react';

//editor dynamic import 
import dynamic from 'next/dynamic';
import "react-draft-wysiwyg/dist/react-draft-wysiwyg.css";
import { EditorState,ContentState   } from 'draft-js';




const Editor = dynamic(() => import('react-draft-wysiwyg').then((module) => module.Editor), { ssr: false });

function TextEditor({text}) {

    const [editorState, setEditorState] = useState(
        EditorState.createWithContent(
          ContentState.createFromText(text)
        )
      );
    
      const onEditorStateChange = (newEditorState) => {
        setEditorState(newEditorState);
      };
    
      return (
        <div>
          <Editor
            editorState={editorState}
            editorStyle={{  minHeight: "900px" }}
            onEditorStateChange={onEditorStateChange}
          />
        </div>
      );
}

export default TextEditor