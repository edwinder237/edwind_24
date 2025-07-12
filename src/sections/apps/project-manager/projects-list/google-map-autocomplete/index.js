// material-ui
import {
  Grid,
} from "@mui/material";

// third-party
import { useFormik } from "formik";
import * as yup from "yup";

// assets
import GoogleMaps from "./GoogleMap";

// validation schema
const validationSchema = yup.object({
  country: yup.string().required("Country is required").nullable(),
  county: yup.string().required("Region required"),
  city: yup.string().required("City required"),
  address1: yup.string().required("Address1 is required"),
  postCode: yup.string().required("Post Code is required"),
});

// ==============================|| FORMS VALIDATION - ADDRESS ||============================== //

function GoogleMapAutocomplete({handleLocationChange}) {

  const formik = useFormik({
    initialValues: {
      address1: "",
      address2: "",
      city: "",
      county: "",
      country: "",
      postCode: "",
    },
    validationSchema,
    onSubmit: async (/*values, { setErrors, setStatus, setSubmitting }*/) => {
      // submit location
    },
  });

  return (
    <form onSubmit={formik.handleSubmit} id="google-map-forms">
      <Grid container spacing={3.5}>
        <Grid item xs={12}>
          <GoogleMaps formik={formik} handleLocationChange={handleLocationChange} />
        </Grid>
      </Grid>
    </form>
  );
}

export default GoogleMapAutocomplete;
