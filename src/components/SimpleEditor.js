import { useState } from "react";
import PropTypes from "prop-types";

// next
import dynamic from "next/dynamic";

// third party
import "react-quill/dist/quill.snow.css";

const ReactQuill = dynamic(() => import("react-quill"), {
  ssr: false,
});

// ==============================|| QUILL EDITOR ||============================== //

const SimpleEditor = ({ handleTextChange }) => {
  const [text, setText] = useState(
    ""
  );
  const handleChange = (value) => {
    setText(value);
    handleTextChange(value);
  };

  return <ReactQuill value={text} onChange={handleChange} />;
};
SimpleEditor.propTypes = {
  initialText: PropTypes.string.isRequired,
};
SimpleEditor.defaultProps = {
  initialText: "",
};
export default SimpleEditor;
