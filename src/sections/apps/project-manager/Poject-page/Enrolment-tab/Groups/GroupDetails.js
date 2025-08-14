import PropTypes from "prop-types";
import { useState } from "react";

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
import GroupCurriculumWidget from "./GroupCurriculumWidget";
import CurriculumManageDialog from "./CurriculumManageDialog";

import GroupCurriculumTable from "./GroupCurriculumTable";

// assets
import { PlusCircleOutlined } from "@ant-design/icons";
import IconButton from "components/@extended/IconButton";

// ==============================|| EXPANDING TABLE - USER DETAILS ||============================== //

const GroupDetails = ({ Group }) => {
  const theme = useTheme();
  const matchDownMD = useMediaQuery(theme.breakpoints.down("md"));
  const [curriculumDialogOpen, setCurriculumDialogOpen] = useState(false);
  const [refreshKey, setRefreshKey] = useState(0);

  const backColor = alpha(theme.palette.primary.lighter, 0.1);

  const handleCurriculumManage = () => {
    setCurriculumDialogOpen(true);
  };

  const handleCurriculumDialogClose = () => {
    setCurriculumDialogOpen(false);
  };

  const handleRefresh = () => {
    setRefreshKey(prev => prev + 1);
  };

  const { courses, participants } = Group || {};

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
                <Tooltip title="Manage Group Curriculums">
                  <IconButton onClick={handleCurriculumManage}>
                    <PlusCircleOutlined />
                  </IconButton>
                </Tooltip>
              }
              sx={{ "& .MuiCardHeader-root": { p: 1.75 } }}
            >
              <GroupCurriculumWidget 
                groupId={Group?.id} 
                onManageCurriculums={handleCurriculumManage}
                refreshTrigger={refreshKey}
              />
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

        {/* Curriculum Management Dialog */}
        <CurriculumManageDialog
          open={curriculumDialogOpen}
          onClose={handleCurriculumDialogClose}
          group={Group}
          onRefresh={handleRefresh}
        />
      </TableCell>
    </TableRow>
  );
};

GroupDetails.propTypes = {
  data: PropTypes.object,
};

export default GroupDetails;
