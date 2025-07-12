import PropTypes from "prop-types";

// next
// import Image from 'next/legacy/image';

// material-ui
import {
  Autocomplete,
  Box,
  Button,
  FormControl,
  FormControlLabel,
  FormHelperText,
  Grid,
  InputLabel,
  MenuItem,
  Radio,
  RadioGroup,
  Select,
  Stack,
  TextField,
} from "@mui/material";
import { AdapterDateFns } from "@mui/x-date-pickers/AdapterDateFns";
import { LocalizationProvider } from "@mui/x-date-pickers/LocalizationProvider";
import { DesktopDatePicker } from "@mui/x-date-pickers/DesktopDatePicker";

// third-party
import * as yup from "yup";
import { useFormik } from "formik";

// project imports
import AnimateButton from "components/@extended/AnimateButton";
import UploadMultiFile from "components/third-party/dropzone/MultiFile";

import { useDispatch, useSelector } from "store";
import { openSnackbar } from "store/reducers/snackbar";
import { editModule } from "store/reducers/courses";
import { errors } from "openid-client";

const validationSchema = yup.object({
  title: yup.string().required("Title is required"),
  dueDate: yup.date(),
  duration: yup.number().required("duration is required"),
});

// ==============================|| KANBAN BOARD - ITEM EDIT ||============================== //

const EditModule = ({ handleDrawerOpen, moduleId }) => {
  const dispatch = useDispatch();
  const { modules,response } = useSelector((state) => state.courses);
  const selectedCard = modules.find((module)=>module.id === moduleId)

  const formik = useFormik({
    enableReinitialize: true,
    initialValues: {
      ...selectedCard,
    },
    validationSchema,
    onSubmit: async (values) => {
      try {
        const itemToEdit = {
          ...values,
          title: values.title,
          duration: parseInt(values.duration),
          summary: values.summary,
          lastUpdated: new Date().toISOString()
        };
    
        // Dispatch editModule and wait for it to complete
        await dispatch(editModule(itemToEdit, moduleId, modules));
    
       
       dispatch(
          openSnackbar({
            open: true,
            message: response? JSON.stringify(response): error,
            variant: "alert",
            alert: {
              color: "success",
            },
            close: false,
          })
        );
    
        handleDrawerOpen();
      } catch (error) {
        console.error("Error editing module:", error);
        // Handle error as needed
      }
    },
  });

  return (
    <form onSubmit={formik.handleSubmit}>
      <LocalizationProvider dateAdapter={AdapterDateFns}>
        <Grid container spacing={2.5}>
          <Grid item xs={12}>
            <Stack spacing={1}>
              <InputLabel>Title</InputLabel>
              <TextField
                fullWidth
                id="title"
                name="title"
                placeholder="Title"
                value={formik.values.title}
                onChange={formik.handleChange}
                error={formik.touched.title && Boolean(formik.errors.title)}
                helperText={formik.touched.title && formik.errors.title}
              />
            </Stack>
          </Grid>

          <Grid item xs={12}>
            <Stack spacing={1}>
              <InputLabel>Summary</InputLabel>
              <TextField
                fullWidth
                id="summary"
                name="summary"
                multiline
                rows={3}
                value={formik.values.summary}
                onChange={formik.handleChange}
                error={
                  formik.touched.description &&
                  Boolean(formik.errors.description)
                }
                helperText={
                  formik.touched.description && formik.errors.description
                }
              />
            </Stack>
          </Grid>

          <Grid item xs={12}>
            <Stack spacing={1}>
              <InputLabel>Duration</InputLabel>
              <TextField
                fullWidth
                id="duration"
                name="duration"
                value={formik.values.duration}
                onChange={formik.handleChange}
                error={
                  formik.touched.duration && Boolean(formik.errors.duration)
                }
                helperText={formik.touched.duration && formik.errors.duration}
              />
            </Stack>
          </Grid>

          <Grid item xs={12}>
            <AnimateButton>
              <Button fullWidth variant="contained" type="submit">
                Save
              </Button>
            </AnimateButton>
          </Grid>
        </Grid>
      </LocalizationProvider>
    </form>
  );
};

EditModule.propTypes = {
  item: PropTypes.object,
  handleDrawerOpen: PropTypes.func,
};

export default EditModule;
