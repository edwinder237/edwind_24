import PropTypes from "prop-types";

// material-ui
import { alpha, useTheme } from "@mui/material/styles";
import {
  useMediaQuery,
  Grid,
  Stack,
  TableCell,
  TableRow,
  Tooltip,
} from "@mui/material";

// third-party
import { PatternFormat } from "react-number-format";

//components
import ScrollX from "components/ScrollX";

// project import
import MainCard from "components/MainCard";
import GroupEnrolledTable from "./GroupEnrolledTable";
import CurriculmWidget from "../CurriculmWidget";

import GroupCurriculumTable from "./GroupCurriculumTable";

// assets
import { PlusCircleOutlined } from "@ant-design/icons";
import IconButton from "components/@extended/IconButton";

// ==============================|| EXPANDING TABLE - USER DETAILS ||============================== //

const GroupDetails = ({ Group: { courses, participants } }) => {
  const theme = useTheme();
  const matchDownMD = useMediaQuery(theme.breakpoints.down("md"));

  const backColor = alpha(theme.palette.primary.lighter, 0.1);

  return (
    <TableRow
      sx={{
        bgcolor: backColor,
        "&:hover": { bgcolor: `${backColor} !important` },
      }}
    >
      <TableCell colSpan={8} sx={{ p: 2.5 }}>
        <Grid
          container
          spacing={2.5}
          justifyContent="center"
          sx={{ pl: { xs: 0, sm: 2, md: 2, lg: 2, xl: 2 } }}
        >
          <Grid
            item
            xs={12}
            sm={4}
            md={4}
            lg={4}
            xl={4}
            sx={{ order: { xs: 1, sm: 0, md: 0, lg: 0, xl: 0 } }}
          >
            <MainCard
              title="Curriculum"
              content={false}
              secondary={
                <Tooltip title="Add course">
                  <IconButton>
                    <PlusCircleOutlined />
                  </IconButton>
                </Tooltip>
              }
              sx={{ "& .MuiCardHeader-root": { p: 1.75 } }}
            >
              {false && <CurriculmWidget courses={courses} />}
            </MainCard>
          </Grid>
          <Grid item xs={12} sm={8} md={8} lg={8} xl={8}>
            <MainCard title="Enrolled" content={false}>
              <ScrollX>
                {true && <GroupEnrolledTable Enrolled={participants} />}
              </ScrollX>
            </MainCard>
          </Grid>
        </Grid>
      </TableCell>
    </TableRow>
  );
};

GroupDetails.propTypes = {
  data: PropTypes.object,
};

export default GroupDetails;
