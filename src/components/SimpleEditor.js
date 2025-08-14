import { useState } from "react";
import PropTypes from "prop-types";

// material-ui
import { TextField } from "@mui/material";

// ==============================|| SIMPLE EDITOR ||============================== //

const SimpleEditor = ({ handleTextChange }) => {
  const [text, setText] = useState("");
  
  const handleChange = (event) => {
    const value = event.target.value;
    setText(value);
    handleTextChange(value);
  };

  return (
    <TextField
      fullWidth
      multiline
      rows={6}
      value={text}
      onChange={handleChange}
      placeholder="Enter your text here..."
      variant="outlined"
    />
  );
};
SimpleEditor.propTypes = {
  initialText: PropTypes.string.isRequired,
};
SimpleEditor.defaultProps = {
  initialText: "",
};
export default SimpleEditor;
