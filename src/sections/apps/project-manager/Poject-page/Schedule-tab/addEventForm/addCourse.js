import { useEffect } from "react";

import { useDispatch, useSelector } from "store";

// material-ui
import {
  createFilterOptions,
  Autocomplete,
  Box,
  Button,
  Grid,
  InputAdornment,
  Stack,
  TextField,
  Typography,
  Chip,
} from "@mui/material";

// third-party
import { useFormik } from "formik";
import * as yup from "yup";

// project imports
import MainCard from "components/MainCard";
import AnimateButton from "components/@extended/AnimateButton";
import { openSnackbar } from "store/reducers/snackbar";
import TransferList from "./transfer-list";

// assets
import { CloseOutlined, DownOutlined } from "@ant-design/icons";
import { useState } from "react";

const filter = createFilterOptions();
const filterSkills = createFilterOptions();

const validationSchema = yup.object({
  course: yup
    .string()
    .trim()
    .required("course selection is required")
    .matches(/^[a-z\d\-/#_\s]+$/i, "Only alphanumerics are allowed")
    .max(50, "course must be at most 50 characters"),
  id: yup
    .array()
    .of(
      yup
        .string()
        .trim()
        .required("Leading spaces found in your tag")
        .matches(/^[a-z\d\-/#.&_\s]+$/i, "Only alphanumerics are allowed")
        .max(50, "Skill tag field must be at most 50 characters")
    )
    .required("Skill selection is required")
    .min(3, "Skill tags field must have at least 3 items")
    .max(15, "Please select a maximum of 15 id."),
});

// ==============================|| FORM VALIDATION - AUTOCOMPLETE FORMIK  ||============================== //

const AddCourse = ({eventId}) => {
  const dispatch = useDispatch();
  const { isAdding, project_curriculums: curriculum } = useSelector(
    (state) => state.projects
  );
  const [value, setValue] = useState({ course: "", id: false });
  const [courseId, setCourseId] = useState(false);

  const courses = curriculum.flatMap((i) =>
    i.curriculum.curriculum_courses.map((course) => ({
      id: course.course.id,
      title: course.course.title,
    }))
  );
  const courseTitles = courses.map((c) => c.title);
  const formik = useFormik({
    initialValues: value,
    validationSchema,
    onSubmit: (values) => {
      dispatch(
        openSnackbar({
          open: true,
          message: "Autocomplete - Submit Success",
          variant: "alert",
          alert: {
            color: "success",
          },
          close: false,
        })
      );
    },
  });

  useEffect(() => {
    const id = formik.values.id;
    setValue(formik.values);
    setCourseId(id);
  }, [formik.values]);

  return (
    <form onSubmit={formik.handleSubmit}>
      <Grid container spacing={3}  sx={{ display:'flex',justifyItems:'center'}}>
        <Grid item xs={12}   >
          <Autocomplete
            fullWidth
            value={formik.values.course}
            disableClearable
            onChange={(event, newValue) => {
              const courseExist = courseTitles.includes(newValue.title);
              if (!courseExist) {
                console.log("need to add to db courses");
                const matchData = newValue.title?.match(/"((?:\\.|[^"\\])*)"/);
                formik.setFieldValue("course", matchData && matchData[1]);
              } else {
                formik.setFieldValue("course", newValue.title);
                formik.setFieldValue("id", newValue.id);
              }
            }}
            filterOptions={(options, params) => {
              const filtered = filter(options, params);
              const { inputValue } = params;
              const isExisting = options.some(
                (option) => inputValue === option
              );
              if (inputValue !== "" && !isExisting) {
                filtered.push(`Add "${inputValue}"`);
              }
              return filtered;
            }}
            selectOnFocus
            clearOnBlur
            autoHighlight
            handleHomeEndKeys
            id="free-solo-with-text-demo"
            options={courses}
            getOptionLabel={(option) => {
              let value = option;
              const courseExist = courseTitles.includes(option.title);
              if (!courseExist) {
                const matchData = option.title?.match(/"((?:\\.|[^"\\])*)"/);
                if (matchData && matchData[1])
                  value = matchData && matchData[1];
              }
              return value;
            }}
            renderOption={(props, option) => {
              return (
                <Box component="li" {...props}>
                  {option.title}
                </Box>
              );
            }}
            freeSolo
            renderInput={(params) => (
              <TextField
                {...params}
                name="course"
                error={formik.touched.course && Boolean(formik.errors.course)}
                helperText={
                  formik.touched.course &&
                  formik.errors.course &&
                  formik.errors.course
                }
                placeholder="Select Course"
                InputProps={{
                  ...params.InputProps,
                  sx: { bgcolor: "grey.0" },
                  endAdornment: (
                    <InputAdornment position="end">
                      <DownOutlined />
                    </InputAdornment>
                  ),
                }}
              />
            )}
          />
        </Grid>
        </Grid>
        <Grid container spacing={0}  sx={{ pt:2, display:'flex',justifyItems:'center',width:'110%'}}>
        <Grid  item   >
          <TransferList courseId={courseId} eventId={eventId} />
        </Grid>
        </Grid>
     
    </form>
  );
};

export default AddCourse;
