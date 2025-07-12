// material-ui
import { Box } from "@mui/material";
import { TreeView, TreeItem } from "@mui/lab";

// project import
import MainCard from "components/MainCard";
import VerticalLinearStepper from "./VerticalLinearStepper";

// assets
import { DownOutlined, RightOutlined } from "@ant-design/icons";

// ==============================|| TREE VIEW - DISABLED ||============================== //

export default function Moduleswidget({ eventState }) {
  const { courseTitle, modules } = eventState;

    return (
      <MainCard
        sx={{ maxHeight: 1, flexGrow: 1, maxWidth: 1, overflowY: "auto" }}
        title={`${courseTitle} | Modules`}
      >
        <TreeView
          aria-label="disabled items"
          defaultCollapseIcon={<DownOutlined />}
          defaultExpandIcon={<RightOutlined />}
          multiSelect
        >
          {modules?.map((module, i) => (
            <TreeItem nodeId={i} label={`${module.title}`}>
              <VerticalLinearStepper activities={module.activities} />
            </TreeItem>
          ))}
        </TreeView>
      </MainCard>
    );

}
