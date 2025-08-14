import { useState } from 'react';

// material-ui
import { TextField } from '@mui/material';

function TextEditor({text}) {
    const [content, setContent] = useState(text || '');
    
    const handleChange = (event) => {
        setContent(event.target.value);
    };
    
    return (
        <TextField
            fullWidth
            multiline
            rows={30}
            value={content}
            onChange={handleChange}
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
}

export default TextEditor