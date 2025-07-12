// material-ui
import {
  Box,
  Chip,
  Grid,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  Typography,
} from "@mui/material";

// project imports
import Avatar from "components/@extended/Avatar";

import SimpleBar from "components/third-party/SimpleBar";
import { FileTextFilled } from "@ant-design/icons";

// ===========================|| DATA WIDGET - PRODUCT SALES ||=========================== //



const CardTable = ({ data }) => (
  <>
    <SimpleBar
      sx={{
        height: 290,
      }}
    >
      <TableContainer>
        <Table>
          <TableHead>
            <TableRow>
              <TableCell sx={{ pl: 3 }}>Group Name</TableCell>
              <TableCell align="center" sx={{ pr: 3 }}>
                HC
              </TableCell>
            </TableRow>
          </TableHead>
          <TableBody>
            
              <TableRow >
                <TableCell sx={{}}>
                  <Grid
                    container
                    spacing={2}
                    direction="row"
                    sx={{
                      lg: "none",
                      display: "flex",
                      alignItems: "center",
                      justifyContent: "center",
                    }}
                  >
                    <Grid item sx={{ width: "auto" }}>
                      <Avatar color="primary" type="filled" size="sm">
                        <FileTextFilled />
                      </Avatar>
                    </Grid>
                    <Grid item xs zeroMinWidth sx={{ flexGrow: 1 }}>
                      <Typography align="left" variant="body1">
                        my title
                      </Typography>
                      <Typography
                        align="left"
                        variant="caption"
                        color="secondary"
                      >
role
                      </Typography>
                    </Grid>
                  </Grid>
                </TableCell>
                <TableCell align="center" sx={{ pr: 3 }}>
                  <span>5</span>
                </TableCell>
              </TableRow>
          </TableBody>
        </Table>
      </TableContainer>
    </SimpleBar>
  </>
);

export default CardTable;
           
            //{data?.map((course, index) => (    ))}