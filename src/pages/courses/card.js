import { useMemo, useState, useEffect } from 'react';
import { useDispatch,useSelector } from 'store';
import {getItems} from 'store/reducers/kanban';

// material-ui
import {
  Grid,
  Stack,
  useMediaQuery,
  Button,
  FormControl,
  Select,
  MenuItem,
  Box,
  Dialog,
  Slide,
  Pagination,
  Typography
} from '@mui/material';
import { styled } from '@mui/material/styles';

// project import
import Layout from 'layout';
import Page from 'components/Page';
import { PopupTransition } from 'components/@extended/Transitions';
import EmptyUserCard from 'components/cards/skeleton/EmptyUserCard';
import CustomerCard from 'sections/apps/customer/CustomerCard';
import AddCustomer from 'sections/apps/customer/AddCustomer';


import makeData from 'data/react-table';
import { GlobalFilter } from 'utils/react-table';
import usePagination from 'hooks/usePagination';

// assets
import { PlusOutlined } from '@ant-design/icons';

import {data as courses} from '../../mock/courses'
import Items from 'sections/apps/kanban/Backlogs/Items';

// ==============================|| CUSTOMER - CARD ||============================== //

const allColumns = [
  {
    id: 1,
    header: 'Default'
  },
  {
    id: 2,
    header: 'Customer Name'
  },
  {
    id: 3,
    header: 'Email'
  },
  {
    id: 4,
    header: 'Contact'
  },
  {
    id: 5,
    header: 'Age'
  },
  {
    id: 6,
    header: 'Country'
  },
  {
    id: 7,
    header: 'Status'
  }
];

const CustomButton = styled(Button)(({  

  background: 'hsla(223, 95%, 15%, 1)',
  background: 'linear-gradient(180deg, hsla(223, 95%, 15%, 1) 0%, hsla(217, 100%, 42%, 1) 100%)',
  background: '-moz-linear-gradient(270deg, hsla(223, 95%, 15%, 1) 0%, hsla(217, 100%, 42%, 1) 100%)',
  background: '-webkit-linear-gradient(180deg, hsla(223, 95%, 15%, 1) 0%, hsla(217, 100%, 42%, 1) 100%)',
  filter: 'progid:DXImageTransform.Microsoft.gradient(startColorstr="#02174C", endColorstr="#0052D6", GradientType=1)',

})) 

const CustomerCardPage = () => {

  useEffect(() => {
    dispatch(getItems());
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const dispatch = useDispatch();

  const { items } = useSelector((state) => state.kanban);




  const data = useMemo(() => makeData(6), []);
  const matchDownSM = useMediaQuery((theme) => theme.breakpoints.down('sm'));

  const [sortBy, setSortBy] = useState('Default');
  const [globalFilter, setGlobalFilter] = useState('');
  const [add, setAdd] = useState(false);
  const [customer, setCustomer] = useState(null);
  const [userCard, setUserCard] = useState([]);
  const [page, setPage] = useState(1);
  const handleChange = (event) => {
    setSortBy(event.target.value);
  };

  const handleAdd = () => {
    setAdd(!add);
    if (customer && !add) setCustomer(null);
  };

  // search
  useEffect(() => {
    const newData = data.filter((value) => {
      if (globalFilter) {
        return value.fatherName.toLowerCase().includes(globalFilter.toLowerCase());
      } else {
        return value;
      }
    });
    setUserCard(newData);
  }, [globalFilter, data]);

  const PER_PAGE = 6;

  const count = Math.ceil(userCard.length / PER_PAGE);
  const _DATA = usePagination(userCard, PER_PAGE);

  const handleChangePage = (e, p) => {
    setPage(p);
    _DATA.jump(p);
  };

  return (
    <Page title="Customer List">
      <Box sx={{ position: 'relative', marginBottom: 3 }}>
        <Stack direction="row" alignItems="center">
          <Stack
            direction={matchDownSM ? 'column' : 'row'}
            sx={{ width: '100%' }}
            spacing={1}
            justifyContent="space-between"
            alignItems="center"
          >
            <GlobalFilter preGlobalFilteredRows={data} globalFilter={globalFilter} setGlobalFilter={setGlobalFilter} />
            <Stack direction={matchDownSM ? 'column' : 'row'} alignItems="center" spacing={1}>
              <FormControl sx={{ m: 1, minWidth: 120 }}>
                <Select
                  value={sortBy}
                  onChange={handleChange}
                  displayEmpty
                  inputProps={{ 'aria-label': 'Without label' }}
                  renderValue={(selected) => {
                    if (!selected) {
                      return <Typography variant="subtitle1">Sort By</Typography>;
                    }

                    return <Typography variant="subtitle2">Sort by ({sortBy})</Typography>;
                  }}
                >
                  {allColumns.map((column) => {
                    return (
                      <MenuItem key={column.id} value={column.header}>
                        {column.header}
                      </MenuItem>
                    );
                  })}
                </Select>
              </FormControl>
              <CustomButton variant="contained" startIcon={<PlusOutlined />} onClick={handleAdd}>
                Add Course
              </CustomButton>
            </Stack>
          </Stack>
        </Stack>
      </Box>
      <Grid container spacing={3}>
        {courses.length > 0 ? (
    

    items.map((data, index) => (
              <Slide key={index} direction="up" in={true} timeout={50}>
                <Grid item xs={12} sm={6} lg={4}>
                  <CustomerCard course={items[index]} customer={data} index={index} />
                </Grid>
              </Slide>
            ))
        ) : (
          <EmptyUserCard title={'You have not created any courses yet.'} />
        )}
      </Grid>
      <Stack spacing={2} sx={{ p: 2.5 }} alignItems="flex-end">
        <Pagination
          count={count}
          size="medium"
          page={page}
          showFirstButton
          showLastButton
          variant="combined"
          color="primary"
          onChange={handleChangePage}
        />
      </Stack>

      {/* add customer dialog */}
      <Dialog
        maxWidth="sm"
        fullWidth
        TransitionComponent={PopupTransition}
        onClose={handleAdd}
        open={add}
        sx={{ '& .MuiDialog-paper': { p: 0 } }}
      >
        <AddCustomer customer={customer} onCancel={handleAdd} />
      </Dialog>
    </Page>
  );
};

CustomerCardPage.getLayout = function getLayout(page) {
  return <Layout>{page}</Layout>;
};

export default CustomerCardPage;
