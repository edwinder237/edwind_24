import { useState, useEffect } from "react";
import Loader from "components/Loader";
import {
  getUserStory,
  getUserStoryOrder,
  getProfiles,
  getComments,
  getModules,
  getCourses,
  getColumnsOrder,
} from "store/reducers/courses";
import { useDispatch, useSelector } from "store";

// material-ui
import {
  Avatar,
  AvatarGroup,
  Box,
  Button,
  Grid,
  IconButton,
  Link,
  List,
  ListItem,
  ListItemAvatar,
  ListItemButton,
  ListItemSecondaryAction,
  ListItemText,
  Menu,
  MenuItem,
  MoreOutlined,
  Stack,
  TextField,
  Typography,
} from "@mui/material";

// project import
import Layout from "layout";
import Page from "components/Page";
import MainCard from "components/MainCard";
import AnalyticEcommerce from "components/cards/statistics/AnalyticEcommerce";
import AnalyticActivityType from "components/cards/statistics/AnalyticActivityType";
import ModulesDnd from "./ModulesDnd";
import TextEditor from "./textEditor";
import CourseSyllabus from "./courseSyllabus";

// assets
import {
  GiftOutlined,
  MessageOutlined,
  SettingOutlined,
} from "@ant-design/icons";
//import { getModules } from "utils/getModules";


// avatar style
const avatarSX = {
  width: 36,
  height: 36,
  fontSize: "1rem",
};

// action style
const actionSX = {
  mt: 0.75,
  ml: 1,
  top: "auto",
  right: "auto",
  alignSelf: "flex-start",
  transform: "none",
};

// sales report status
const status = [
  {
    value: "today",
    label: "Today",
  },
  {
    value: "month",
    label: "This Month",
  },
  {
    value: "year",
    label: "This Year",
  },
];

// ==============================|| COURSE EDIT PAGE ||============================== //

const CourseEditPage = ({ courseId }) => {
  const dispatch = useDispatch();
  const [loading, setLoading] = useState(true);
  const [isDeleting, setIsDeleting] = useState(false);
  const [selectedModuleId, setSelectedModuleId] = useState(false);
  const [JSON, setJSON] = useState();
  const { courses, modules } = useSelector((state) => state.courses);
  //console.log('sybalius =',courses)
  const courseModules = courses.filter(
    (course) => course.id.toString() === courseId
  )[0]?.modules;
  const course = courses.filter(
    (course) => course.id.toString() === courseId
  )[0];
  useEffect(() => {
    const modules = dispatch(getModules(courseModules));
    Promise.all([modules]).then(() => setLoading(false));
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  function Editor({ ...props }) {
    return <TextEditor {...props} />;
  }

  const getSelectedModuleId = (selectedCardId) => {
    setSelectedModuleId(selectedCardId);
  };

  if (loading) return <Loader />;

  function getJSON(JSON) {
    setJSON(JSON);
  }
  const handleSave = () => {
    // Here, you'll add the logic to save the content
    console.log("Content saved:", JSON);
  };

  const deleteStuff = () => {
    setIsDeleting(tru);
  };


  console.log("from courseedit page = modules", modules);

  const totalDuration = modules.reduce((acc, section) => {
    return acc + section.duration;
  }, 0);
  const totalModules = modules.length.toString();

  const totalPractical = modules
    .map(
      (module) =>
        module.activities &&
        module.activities.filter(
          (activity) => activity.category === "practical"
        ).length
    )
    .reduce((acc, section) => {
      return acc + section;
    }, 0)
    .toString();

  const totalQuiz = modules
    .map(
      (module) =>
        module.activities &&
        module.activities.filter((activity) => activity.category === "quiz")
          .length
    )
    .reduce((acc, section) => {
      return acc + section;
    }, 0)
    .toString();
  const totalPassive = modules
    .map(
      (module) =>
        module.activities &&
        module.activities.filter((activity) => activity.category === "passive")
          .length
    )
    .reduce((acc, section) => {
      return acc + section;
    }, 0)
    .toString();

  const activitiesAnalysis = {
    practical: totalPractical,
    quiz: totalQuiz,
    passive: totalPassive,
  };

  if (modules) {
    return (
      <Page title="Course Editor">
        <Grid container rowSpacing={4.5} columnSpacing={2.75}>
          {/* row 1 */}
          <Grid item xs={12} sx={{ mb: -2.25 }}>
            <Typography variant="h5"></Typography>
          </Grid>
          <Grid item xs={12} sm={6} md={4} lg={3}>
            <AnalyticEcommerce
              title="Duration"
              count={`${totalDuration} min`}
              extra="35,000"
            />
          </Grid>
          <Grid item xs={12} sm={6} md={4} lg={3}>
            <AnalyticEcommerce
              title="Modules"
              count={totalModules}
              extra="8,900"
            />
          </Grid>
          <Grid item xs={12} sm={6} md={4} lg={3}>
            <AnalyticActivityType
              title="Activities"
              count={activitiesAnalysis}
              isLoss
              color="warning"
              extra="1,943"
            />
          </Grid>
          <Grid item xs={12} sm={6} md={4} lg={3}>
            <AnalyticEcommerce
              title="Success rate"
              count="89%"
              isLoss
              color="warning"
              extra="$20,395"
            />
          </Grid>

          <Grid
            bgcolor=""
            item
            md={8}
            sx={{ display: { sm: "none", md: "block", lg: "none" } }}
          />

          {/* row 2 */}

          <Grid item xs={12} md={5} lg={4}>
            <Grid container alignItems="center" justifyContent="space-between">
              <Grid minWidth={1} item>
                <Typography variant="h5">Course</Typography>
              </Grid>
              <MainCard
                secondary={
                  <Button onClick={()=>setSelectedModuleId(false)} variant="contained">
                    sybalius
                  </Button>
                }
                sx={{ mt: 2, width: 1 }}
                title="Info"
              >
                <Stack alignItems="baseline" direction="row" spacing={0}>
                  <Box alignItems="center" minWidth="97px" bgcolor="">
                    <Typography color="primary" variant="body1">
                      Title
                    </Typography>
                  </Box>
                  <Box width={1} bgcolor="">
                    <Typography variant="body1">{course.title}</Typography>
                  </Box>
                </Stack>

                <Stack alignItems="baseline" direction="row" spacing={0}>
                  <Box alignItems="center" minWidth="97px" bgcolor="">
                    <Typography color="primary" variant="body1">
                      Summary
                    </Typography>
                  </Box>
                  <Box width={1} bgcolor="">
                    <Typography color="secondary" variant="body1">
                      {course.summary}
                    </Typography>
                  </Box>
                </Stack>

                <Stack alignItems="baseline" direction="row" spacing={0}>
                  <Box alignItems="center" minWidth="97px" bgcolor="">
                    <Typography color="primary" variant="body1">
                      Learning Objectives
                    </Typography>
                  </Box>
                  <Box width={1} bgcolor="">
                    <Typography variant="body2" component="div">
                      <ul>
                        <li>Discuss the basics of angular</li>
                        <li>Locate different vendors</li>
                        <li>Recite all terms</li>
                        <li>Recall their order</li>
                      </ul>
                    </Typography>
                  </Box>
                </Stack>

                <Box display="flex" justifyContent="center">
                  <Typography variant="body2" color="primary">
                    {" "}
                    <Link
                      component="button"
                      onClick={() => console.log("hehe")}
                    >
                      Show More
                    </Link>
                  </Typography>
                </Box>
              </MainCard>
            </Grid>

            {/* courses */}
            <Grid item>
              {true ? (
                <ModulesDnd
                  courseId={courseId}
                  getSelectedModuleId={getSelectedModuleId}
                />
              ) : (
                <DnDComponent />
              )}
            </Grid>
          </Grid>

          {/* row 3 */}
          <Grid bgcolor="" item xs={12} md={7} lg={8}>
            <Grid container alignItems="center" justifyContent="space-between">
              <Grid item>
                <Typography variant="h5">Content</Typography>
              </Grid>
            </Grid>

            <MainCard
              secondary={
                <Button onClick={handleSave} variant="contained">
                  Save
                </Button>
              }
              sx={{ mt: 2 }}
              title="Editor"
            >
              <CourseSyllabus/>
             {false && <Editor courseId={courseId} selectedModuleId={selectedModuleId} />}
            </MainCard>
          </Grid>
        </Grid>
      </Page>
    );
  }
};

CourseEditPage.getLayout = function getLayout(page) {
  return <Layout>{page}</Layout>;
};

export default CourseEditPage;
