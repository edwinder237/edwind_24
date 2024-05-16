import PropTypes from "prop-types";
import React from "react";

// material-ui
import { alpha, useTheme } from "@mui/material/styles";
import {
  Box,
  Collapse,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
} from "@mui/material";

// project imports
import Layout from "layout";
import Page from "components/Page";
import MainCard from "components/MainCard";
import IconButton from "components/@extended/IconButton";
import EnrolleeList from "./EnrolleeList";
// assets
import { UpOutlined, DownOutlined } from "@ant-design/icons";

// table data
function createData(name, calories, fat, carbs, protein, price) {
  return {
    name,
    calories,
    fat,
    carbs,
    protein,
    price,
    history: [
      { date: "2020-01-05", customerId: "11091700", amount: 3 },
      { date: "2020-01-02", customerId: "Anonymous", amount: 1 },
    ],
  };
}

function Row({ row }) {
  const theme = useTheme();
  const [open, setOpen] = React.useState(false);
  const backColor = alpha(theme.palette.primary.lighter, 0.1);

  return (
    <>
      <TableRow hover sx={{ "& > *": { borderBottom: "unset" } }}>
        <TableCell sx={{ pl: 3 }}>
          <IconButton
            aria-label="expand row"
            size="small"
            onClick={() => setOpen(!open)}
          >
            {open ? <UpOutlined /> : <DownOutlined />}
          </IconButton>
        </TableCell>
        <TableCell align="left" component="th" scope="row">
          {row.name}
        </TableCell>
        <TableCell align="right">55</TableCell>
      </TableRow>
      <TableRow
        sx={{
          bgcolor: backColor,
          "&:hover": { bgcolor: `${backColor} !important` },
        }}
      >
        <TableCell sx={{ py: 0 }} colSpan={6}>
          <Collapse in={open} timeout="auto" unmountOnExit>
            {open && (
              <Box sx={{ py: 3, pl: { xs: 3, sm: 5, md: 6, lg: 10, xl: 12 } }}>
                <EnrolleeList />
              </Box>
            )}
          </Collapse>
        </TableCell>
      </TableRow>
    </>
  );
}

Row.propTypes = {
  row: PropTypes.object,
};

const rows = [
  createData("Group-732", 3),
  createData("Group-765", 237),
  createData("Group-555", 16),
];

// ==============================|| MUI TABLE - COLLAPSIBLE ||============================== //

export default function CollapsibleGroup() {
  return (
    <>
      <TableContainer>
        <Table aria-label="collapsible table">
          <TableHead>
            <TableRow>
              <TableCell width="30%" />
              <TableCell>Group Name</TableCell>
              <TableCell align="right">HC</TableCell>
            </TableRow>
          </TableHead>
          <TableBody>
            {rows.map((row) => (
              <Row key={row.name} row={row} />
            ))}
          </TableBody>
        </Table>
      </TableContainer>
    </>
  );
}

CollapsibleGroup.getLayout = function getLayout(page) {
  return <Layout>{page}</Layout>;
};
