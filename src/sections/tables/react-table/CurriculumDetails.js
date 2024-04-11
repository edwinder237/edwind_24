import NextLink from 'next/link';

// material-ui
import { CardMedia, Chip, Link, Stack, Table, TableBody, TableCell, TableContainer, TableHead, TableRow } from '@mui/material';

// project imports
import MainCard from 'components/MainCard';
import IconButton from 'components/@extended/IconButton';

// assets
import { EditOutlined, DeleteOutlined } from '@ant-design/icons';


// table data
function createData(customer, cid, product, date, status, statuscolor) {
  return { customer, cid, product, date, status, statuscolor };
}

const rows = [
  createData('Kick-Off Meeting', '81412314', '17-2-2017', '17-2-2017', 'Pending', 'warning'),
  createData('Sales rep Training 1', '68457898', '20-2-2017', '17-2-2017',  'Paid', 'primary'),
  createData('Crm Mobile', '45457898', '17-2-2017', '17-2-2017',  'Success', 'success'),
  createData('Campaign360', '62446232', '25-4-2017', '17-2-2017',  'Failed', 'error')
];

// =========================|| DATA WIDGET - LATEST ORDER ||========================= //

export default function CurriculumDetails() {
  return (

      <TableContainer >
        <Table sx={{ minWidth: 350 }} aria-label="simple table">
          <TableHead >
            <TableRow >
              <TableCell sx={{ pl: 3 }}>Course</TableCell>
              <TableCell>Course Id</TableCell>
              <TableCell align="right">Start Date</TableCell>
              <TableCell align="center">End Date</TableCell>
              <TableCell align="center">Status</TableCell>
              <TableCell align="center" sx={{ pr: 3 }}> Action</TableCell>
            </TableRow>
          </TableHead>

          <TableBody>
            {rows.map((row, index) => (
              <TableRow hover key={index}>
                <TableCell sx={{ pl: 3 }}>{row.customer}</TableCell>
                <TableCell>{row.cid}</TableCell>
                <TableCell align="center">{row.date}</TableCell>
                <TableCell align="center">{row.date}</TableCell>
                <TableCell align="center">
                  <Chip color={row.statuscolor} label={row.status} size="small" />
                </TableCell>
                <TableCell align="center" sx={{ pr: 3 }}>
                  <Stack direction="row" justifyContent="center" alignItems="center">
                    <IconButton color="primary" size="large">
                      <EditOutlined />
                    </IconButton>
                    <IconButton color="inherit" size="large">
                      <DeleteOutlined />
                    </IconButton>
                  </Stack>
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </TableContainer>
   
  );
}
