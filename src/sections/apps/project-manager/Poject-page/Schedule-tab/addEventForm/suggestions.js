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

const Suggestions = () => {
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
            <Stack
              direction="row"
              spacing={1}
              alignItems="center"
              sx={{ mt: 1.5, flexWrap: { xs: 'wrap', sm: 'inherit' }, gap: { xs: 1, sm: 0 } }}
            >
              <Typography variant="caption">Suggestion:</Typography>
              {skills
                .filter((skill) => formik.values.skills && !formik.values.skills.map((item) => item).includes(skill))
                .slice(0, 5)
                .map((option, index) => (
                  <Chip
                    key={index}
                    variant="outlined"
                    onClick={() => formik.setFieldValue('skills', [...formik.values.skills, option])}
                    label={<Typography variant="caption">{option}</Typography>}
                    size="small"
                  />
                ))}
            </Stack>
          </Grid>
        </Grid>
      </form>
  );
};

export default Suggestions;
