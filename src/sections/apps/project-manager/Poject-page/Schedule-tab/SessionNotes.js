import { useEffect, useState } from "react";

// material-ui
import { useTheme } from "@mui/material/styles";
import { Grid } from "@mui/material";

// project imports
import MainCard from "components/MainCard";
import { ThemeDirection, ThemeMode } from "config";

// next
import dynamic from "next/dynamic";

// third party
import "react-quill/dist/quill.snow.css";

const ReactQuill = dynamic(() => import("react-quill"), {
  ssr: false,
});

// ==============================|| QUILL EDITOR ||============================== //

const SessionNotes = ({ notes }) => {
  const theme = useTheme();

  const [text, setText] = useState("");

  useEffect(() => {
    setText(notes);
  }, [notes]);

  const handleChange = (value) => {
    setText(value);
  };


  return (
    <>
      <Grid
        item
        xs={12}
        sm={12}
        md={12}
        lg={12}
        sx={{
          "& .quill": {
            bgcolor:
              theme.palette.mode === ThemeMode.DARK ? "dark.main" : "grey.50",
            borderRadius: "4px",
            "& .ql-toolbar": {
              bgcolor:
                theme.palette.mode === ThemeMode.DARK
                  ? "dark.light"
                  : "grey.100",
              borderColor: theme.palette.divider,
              borderTopLeftRadius: "4px",
              borderTopRightRadius: "4px",
            },
            "& .ql-container": {
              borderColor: `${theme.palette.divider} !important`,
              borderBottomLeftRadius: "4px",
              borderBottomRightRadius: "4px",
              "& .ql-editor": {
                minHeight: 135,
                height: 1,
              },
            },
          },
        }}
      >
        <MainCard title="Sesion Notes (learning, Technical, Attendance, progress)">
          <ReactQuill value={text} onChange={handleChange} />
        </MainCard>
      </Grid>
    </>
  );
};

export default SessionNotes;
