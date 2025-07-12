import { useDispatch,useSelector } from 'store';

// material-ui
import { createFilterOptions, Autocomplete, Box, Button, Grid, InputAdornment, Stack, TextField, Typography, Chip } from '@mui/material';

// third-party
import { useFormik } from 'formik';
import * as yup from 'yup';


// project imports
import MainCard from 'components/MainCard';
import AnimateButton from 'components/@extended/AnimateButton';
import { openSnackbar } from 'store/reducers/snackbar';

// assets
import { CloseOutlined, DownOutlined } from '@ant-design/icons';

//const roles = ['Yoo', 'Admin', 'Staff', 'Manager'];

const skills = ['Marc', 'Matthew', 'Jamal', 'Francis', 'Stephanie'];

const filter = createFilterOptions();
const filterSkills = createFilterOptions();

const validationSchema = yup.object({
  role: yup
    .string()
    .trim()
    .required('Role selection is required')
    .matches(/^[a-z\d\-/#_\s]+$/i, 'Only alphanumerics are allowed')
    .max(50, 'Role must be at most 50 characters'),
  skills: yup
    .array()
    .of(
      yup
        .string()
        .trim()
        .required('Leading spaces found in your tag')
        .matches(/^[a-z\d\-/#.&_\s]+$/i, 'Only alphanumerics are allowed')
        .max(50, 'Skill tag field must be at most 50 characters')
    )
    .required('Skill selection is required')
    .min(3, 'Skill tags field must have at least 3 items')
    .max(15, 'Please select a maximum of 15 skills.')
});

// ==============================|| FORM VALIDATION - AUTOCOMPLETE FORMIK  ||============================== //

const AddInstructors = () => {
  const dispatch = useDispatch();
  const {  isAdding,project_curriculums:curriculum } = useSelector((state) => state.projects);
 const courses = curriculum.flatMap((i)=>i.curriculum.curriculum_courses.map((course)=>course.course.title))
  const  roles = courses; 
  const formik = useFormik({
    initialValues: {
      role: '',
      skills: []
    },
    validationSchema,
    onSubmit: (/*values*/) => {
      dispatch(
        openSnackbar({
          open: true,
          message: 'Autocomplete - Submit Success',
          variant: 'alert',
          alert: {
            color: 'success'
          },
          close: false
        })
      );
    }
  });

  let TagsError = false;
  if (formik.touched.skills && typeof formik.errors.skills) {
    if (formik.touched.skills && typeof formik.errors.skills === 'string') {
      TagsError = formik.errors.skills;
    } else {
      formik.errors.skills &&
        typeof formik.errors.skills !== 'string' &&
        formik.errors.skills.map((item) => {
          // @ts-ignore
          if (typeof item === 'object') TagsError = item.label;
          return item;
        });
    }
  }

  return (
      <form onSubmit={formik.handleSubmit}>
        <Grid container spacing={3}>

          <Grid item xs={12}>
            <Autocomplete
              id="skills"
              multiple
              fullWidth
              autoHighlight
              freeSolo
              disableCloseOnSelect
              options={skills}
              value={formik.values.skills}
              onBlur={formik.handleBlur}
              getOptionLabel={(option) => option}
              onChange={(event, newValue) => {
                const jobExist = skills.includes(newValue[newValue.length - 1]);
                if (!jobExist) {
                  formik.setFieldValue('skills', newValue);
                } else {
                  formik.setFieldValue('skills', newValue);
                }
              }}
              filterOptions={(options, params) => {
                const filtered = filterSkills(options, params);
                const { inputValue } = params;
                const isExisting = options.some((option) => inputValue === option);
                if (inputValue !== '' && !isExisting) {
                  filtered.push(inputValue);
                }

                return filtered;
              }}
              renderOption={(props, option) => {
                return (
                  <Box component="li" {...props}>
                    {!skills.some((v) => option.includes(v)) ? `Add "${option}"` : option}
                  </Box>
                );
              }}
              renderInput={(params) => (
                <TextField
                  {...params}
                  name="skills"
                  placeholder="Add instuctor"
                  error={formik.touched.skills && Boolean(formik.errors.skills)}
                  helperText={TagsError}
                />
              )}
              renderTags={(value, getTagProps) =>
                value.map((option, index) => {
                  let error = false;
                  if (formik.touched.skills && formik.errors.skills && typeof formik.errors.skills !== 'string') {
                    if (typeof formik.errors.skills[index] === 'object') error = true;
                  }

                  return (
                    <Chip
                      key={index}
                      {...getTagProps({ index })}
                      variant="combined"
                      color={error ? 'error' : 'secondary'}
                      label={
                        <Typography variant="caption" color="secondary.dark">
                          {option}
                        </Typography>
                      }
                      deleteIcon={<CloseOutlined style={{ fontSize: '0.875rem' }} />}
                      size="small"
                    />
                  );
                })
              }
            />
          </Grid>
        </Grid>
      </form>
  );
};

export default AddInstructors;
