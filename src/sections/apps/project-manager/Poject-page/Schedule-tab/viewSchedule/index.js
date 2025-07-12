import {
    AppBar,
    IconButton,
    Toolbar,
  Box,
  Button,
  Card,
  DialogActions,
  DialogContent,
  Divider,
  Typography,
  Grid,
  Stack,
} from "@mui/material";
import CloseIcon from '@mui/icons-material/Close';
import { height } from "@mui/system";

function ViewSchedule({ handleClose }) {
  return (
 
      <Card variant="outlined" sx={{ maxWidth: 800, minHeight:600}}>
                <AppBar sx={{ position: 'relative' }}>
          <Toolbar>
            <IconButton
              edge="start"
              color="inherit"
              onClick={handleClose}
              aria-label="close"
            >
              <CloseIcon />
            </IconButton>
            <Typography sx={{ ml: 2, flex: 1 }} variant="h6" component="div">
              
            </Typography>
            <DialogActions>
          <Button variant="contained" onClick={handleClose}>Send</Button>
        </DialogActions>
          </Toolbar>
        </AppBar>

        <DialogContent>
          <Grid
            container
            direction="column"
            spacing={2}
            p={2}
          >
            <Grid item>
              <Grid
                container
                bgcolor=""
                sx={{
                  display: "flex",
                  justifyContent: "flex-start",
                  alignItems: "center",
                }}
              >
                <Box
                  id="logo"
                  bgcolor=""
                  sx={{
                    width: "20%",
                    height: "0.5%",
                  }}
                >
                  <img
                    src="https://d15k2d11r6t6rl.cloudfront.net/public/users/Integrators/BeeProAgency/818300_802231/sm-page-compagnie-FR-bg-copie-e1512664242473.png"
                    alt="Alternate text"
                    title="Alternate text"
                    style={{
                      width: "100%",
                      height: "100%",
                      objectFit: "contain",
                    }}
                  />
                </Box>
              </Grid>
            </Grid>

            <Grid item>
              <Grid
                container
                bgcolor=""
                p={2}
                xs={12}
                sm={12}
                md={12}
                lg={12}
                xl={12}
                sx={{
                  display: "flex",
                  justifyContent: "center",
                  alignContent: "flex-end",
                }}
              >
                <Grid item>
                  <Box bgcolor="" sx={{ width: 1, height: 1 }}>
                    <Typography variant="h4">Horaire de formation</Typography>
                  </Box>
                </Grid>
              </Grid>
            </Grid>
            <Grid item>
              <Divider color="" />
            </Grid>
            <Grid item>
              <Grid
                container
                bgcolor=""
                p={2}
                xs={12}
                sm={12}
                md={12}
                lg={12}
                xl={12}
                sx={{
                  display: "flex",
                  justifyContent: "center",
                  alignContent: "flex-end",
                }}
              >
                <Grid item bgcolor="" md={3}>
                  <Grid
                    container
                    bgcolor=""
                    sx={{
                      display: "flex",
                      justifyContent: "center",
                      textAlign: "center",
                    }}
                  >
                    <Grid item>
                      <Stack>
                        <Typography variant="body2" component="div">
                          FÉVR.
                        </Typography>
                        <Typography variant="h3" component="div">
                          19
                        </Typography>

                        <Typography variant="body2">Lun</Typography>
                      </Stack>
                    </Grid>
                  </Grid>
                </Grid>
                <Grid item bgcolor="" md={6} height={1}>
                  <Grid
                    container
                    direction="column"
                    sx={{
                      display: "flex",
                      justifyContent: "start",
                    }}
                  >
                    <Grid item bgcolor="">
                      <Typography
                        color="red"
                        variant="subtitle1"
                        style={{ fontWeight: "bold" }}
                      >
                        Agenda
                      </Typography>
                    </Grid>
                    <Grid item>
                      <Grid container>
                        <Grid item md={2} bgcolor="">
                          <Typography variant="body1">09:00</Typography>
                        </Grid>
                        <Grid item md={10} bgcolor="">
                          <Typography variant="body1">
                            Kick-off meeting
                          </Typography>
                        </Grid>
                      </Grid>
                    </Grid>
                    <Grid item>
                      <Grid container>
                        <Grid item md={2} bgcolor="">
                          <Typography variant="body1">10:00</Typography>
                        </Grid>
                        <Grid
                          item
                          md={10}
                          style={{
                            overflow: "hidden",
                            textOverflow: "ellipsis",
                            width: "11rem",
                          }}
                        >
                          <Typography noWrap variant="body1">
                            Introduction à CRM 360
                          </Typography>
                        </Grid>
                      </Grid>
                    </Grid>
                  </Grid>
                </Grid>
                <Grid item md={3}>
                  <Grid container sx={{ display: "flex" }}>
                    <Grid item>
                      <Typography
                        variant="subtitle1"
                        style={{ fontWeight: "bold" }}
                      >
                        Focus de la journée:
                      </Typography>
                    </Grid>
                    <Grid
                      item
                      style={{
                        overflow: "hidden",
                        textOverflow: "ellipsis",
                        width: "11rem",
                      }}
                    >
                      <Typography noWrap variant="body1">
                        Introduction to CRM
                        xxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxx
                      </Typography>
                    </Grid>
                  </Grid>
                </Grid>
              </Grid>
            </Grid>
            <Grid item>
              <Divider color="" />
            </Grid>
            <Grid item>
              <Grid
                container
                bgcolor=""
                p={2}
                xs={12}
                sm={12}
                md={12}
                lg={12}
                xl={12}
                sx={{
                  display: "flex",
                  justifyContent: "center",
                  alignContent: "flex-end",
                }}
              >
                <Grid item bgcolor="" md={3}>
                  <Grid
                    container
                    bgcolor=""
                    sx={{
                      display: "flex",
                      justifyContent: "center",
                      textAlign: "center",
                    }}
                  >
                    <Grid item>
                      <Stack>
                        <Typography variant="body2" component="div">
                          FÉVR.
                        </Typography>
                        <Typography variant="h3" component="div">
                          20
                        </Typography>

                        <Typography variant="body2">Lun</Typography>
                      </Stack>
                    </Grid>
                  </Grid>
                </Grid>
                <Grid item bgcolor="" md={6} height={1}>
                  <Grid
                    container
                    direction="column"
                    sx={{
                      display: "flex",
                      justifyContent: "start",
                    }}
                  >
                    <Grid item bgcolor="">
                      <Typography
                        color="red"
                        variant="subtitle1"
                        style={{ fontWeight: "bold" }}
                      >
                        Agenda
                      </Typography>
                    </Grid>
                    <Grid item>
                      <Grid container>
                        <Grid item md={2} bgcolor="">
                          <Typography variant="body1">09:00</Typography>
                        </Grid>
                        <Grid item md={10} bgcolor="">
                          <Typography variant="body1">
                            Kick-off meeting - Group 1
                          </Typography>
                        </Grid>
                      </Grid>
                    </Grid>
                    <Grid item>
                      <Grid container>
                        <Grid item md={2} bgcolor="">
                          <Typography variant="body1">10:00</Typography>
                        </Grid>
                        <Grid
                          item
                          md={10}
                          style={{
                            overflow: "hidden",
                            textOverflow: "ellipsis",
                            width: "11rem",
                          }}
                        >
                          <Typography noWrap variant="body1">
                            Introduction à CRM 360 - Group 2
                          </Typography>
                        </Grid>
                      </Grid>
                    </Grid>
                  </Grid>
                </Grid>
                <Grid item md={3}>
                  <Grid container sx={{ display: "flex" }}>
                    <Grid item>
                      <Typography
                        variant="subtitle1"
                        style={{ fontWeight: "bold" }}
                      >
                        Focus de la journée:
                      </Typography>
                    </Grid>
                    <Grid
                      item
                      style={{
                        overflow: "hidden",
                        textOverflow: "ellipsis",
                        width: "11rem",
                      }}
                    >
                      <Typography noWrap variant="body1">
                        Introduction to CRM
                        
                      </Typography>
                    </Grid>
                  </Grid>
                </Grid>
              </Grid>
            </Grid>
            <Grid item>
              <Divider color="" />
            </Grid>
          </Grid>
        </DialogContent>

      </Card>
   
  );
}

export default ViewSchedule;
