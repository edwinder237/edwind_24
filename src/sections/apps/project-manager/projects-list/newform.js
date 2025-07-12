// material-ui
import { useTheme } from "@mui/material/styles";
import {
  Box,
  Avatar,
  Button,
  CardContent,
  CardActions,
  Checkbox,
  Divider,
  Grid,
  InputLabel,
  TextField,
  FormHelperText,
  FormControlLabel,
  Paper,
  Typography,
  Stack,
} from "@mui/material";

// project imports

import MainCard from "components/MainCard";
import SimpleEditor from "components/SimpleEditor";
import MaskPage from "./datePicker";
import CheckboxesAutocomplete from "./tagsPicker";
import GoogleMapAutocomplete from "./google-map-autocomplete";

// ==============================|| LAYOUTS - STICKY ACTIONBAR ||============================== //

function StickyActionBar() {
  const theme = useTheme();

  return (
    <Grid container spacing={3}>
      <Grid item xs={12}>
        <MainCard content={false} sx={{ overflow: "visible" }}>

          <CardContent>
            <Grid container spacing={3} alignItems="center">
              <Grid item xs={12}>
                <Grid container spacing={2} alignItems="center">
                  <Grid
                    item
                    xs={12}
                    sm={3}
                    lg={3}
                    sx={{ pt: { xs: 2, sm: "0 !important" } }}
                  >
                    <Box
                      sx={{
                        display: "flex",
                        justifyContent: "end",
                        flexWrap: "wrap",
                        "& > :not(style)": {
                          mt: 1,
                          width: 100,
                          height: 100,
                        },
                      }}
                    >
                      <Paper elevation={3} />
                    </Box>
                  </Grid>
                  <Grid item xs={12} sm={9} lg={7}>
                    <Typography variant="h3" sx={{ mb: 0 }}>
                      Clarington Kia | Onboarding
                    </Typography>
                    <Typography variant="body2" sx={{ mb: 2 }}>
                      SM360 | Created by Marc Nelson
                    </Typography>
                  </Grid>
                </Grid>
              </Grid>
              <Grid item xs={12}>
                <Divider />
              </Grid>

              <Grid item xs={12}>
                <Grid container spacing={2} alignItems="center">
                  <Grid
                    item
                    xs={12}
                    sm={3}
                    lg={3}
                    sx={{ pt: { xs: 2, sm: "1 !important" } }}
                  >
                    <InputLabel sx={{ textAlign: { xs: "left", sm: "right" } }}>
                      Project Title :
                    </InputLabel>
                  </Grid>
                  <Grid item xs={12} sm={8} lg={7}>
                    <TextField fullWidth placeholder="Enter project name" />
                  </Grid>

                  <Grid
                    item
                    xs={12}
                    sm={3}
                    lg={3}
                    sx={{ pt: { xs: 2, sm: "1 !important" } }}
                  >
                    <InputLabel sx={{ textAlign: { xs: "left", sm: "right" } }}>
                      Project Type :
                    </InputLabel>
                  </Grid>
                  <Grid item xs={12} sm={8} lg={7}>
                    <FormControlLabel
                      control={<Checkbox defaultChecked />}
                      label="Onboarding"
                    />
                    <FormControlLabel
                      control={<Checkbox />}
                      label="Continuous"
                    />
                  </Grid>
                  <Grid
                    item
                    xs={12}
                    sm={3}
                    lg={3}
                    sx={{ pt: { xs: 2, sm: "1 !important" } }}
                  >
                    <InputLabel sx={{ textAlign: { xs: "left", sm: "right" } }}>
                      Language :
                    </InputLabel>
                  </Grid>
                  <Grid item xs={12} sm={8} lg={7}>
                    <FormControlLabel
                      control={<Checkbox defaultChecked />}
                      label="English"
                    />
                    <FormControlLabel control={<Checkbox />} label="French" />
                  </Grid>
                </Grid>
              </Grid>
              <Grid item xs={12}>
                <Divider />
              </Grid>

              <Grid item xs={12}>
                <Grid container spacing={3} alignItems="center">
                  <Grid
                    item
                    xs={12}
                    sm={3}
                    lg={3}
                    sx={{
                      pt: { xs: 2, sm: "1 !important" },
                    }}
                  >
                    <InputLabel
                      sx={{
                        textAlign: { xs: "left", sm: "right" },
                      }}
                    >
                      Tags :
                    </InputLabel>
                  </Grid>
                  <Grid item xs={12} sm={8} lg={7}>
                    <CheckboxesAutocomplete />
                  </Grid>
                  <Grid
                    item
                    xs={12}
                    sm={3}
                    lg={3}
                    sx={{
                      alignSelf: "flex-start",
                      pt: { xs: 2, sm: "1 !important" },
                    }}
                  >
                    <InputLabel
                      sx={{
                        textAlign: { xs: "left", sm: "right" },
                      }}
                    >
                      Description :
                    </InputLabel>
                  </Grid>
                  <Grid
                    item
                    xs={12}
                    sm={8}
                    lg={7}
                    sx={{
                      "& .quill": {
                        bgcolor:
                          theme.palette.mode === "dark"
                            ? "dark.main"
                            : "grey.50",
                        borderRadius: "4px",
                        "& .ql-toolbar": {
                          bgcolor:
                            theme.palette.mode === "dark"
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
                            minHeight: 225,
                          },
                        },
                      },
                    }}
                  >
                    <SimpleEditor />
                  </Grid>

                  <Grid
                    item
                    xs={12}
                    sm={3}
                    lg={3}
                    sx={{
                      alignSelf: "flex-start",
                      pt: { xs: 2, sm: "1 !important" },
                    }}
                  >
                    <InputLabel sx={{ textAlign: { xs: "left", sm: "right" } }}>
                      Dates :
                    </InputLabel>
                  </Grid>
                  <Grid item xs={12} sm={8} lg={7}>
                    <MaskPage />
                  </Grid>
                </Grid>
              </Grid>

              <Grid item xs={12}>
                <Divider />
                <Grid />
              </Grid>
              <Grid item xs={12}>
                <Grid container spacing={2} alignItems="center">
                  <Grid
                    item
                    xs={12}
                    sm={3}
                    lg={3}
                    sx={{
                      pt: { xs: 20, sm: "1 !important" },
                    }}
                  >
                    <InputLabel sx={{ textAlign: { xs: "left", sm: "right" } }}>
                      Location :
                    </InputLabel>
                  </Grid>
                  <Grid item xs={12} sm={8} lg={7}>
                    <GoogleMapAutocomplete />
                  </Grid>
                </Grid>
              </Grid>
            </Grid>
          </CardContent>
        </MainCard>
      </Grid>
    </Grid>
  );
}

export default StickyActionBar;
