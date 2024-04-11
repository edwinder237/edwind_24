import PropTypes from 'prop-types';

// material-ui
import { styled } from '@mui/material/styles';
import { Card, CardContent, Grid, Typography } from '@mui/material';

// styles
const IconWrapper = styled('div')({
  position: 'absolute',
  left: '-17px',
  bottom: '-27px',
  color: '#fff',
  transform: 'rotate(25deg)',
  '& svg': {
    width: '100px',
    height: '100px',
    opacity: '0.35'
  }
});

// =============================|| USER NUM CARD ||============================= //

const HeaderCountCard = ({ primary, secondary, iconPrimary, color }) => {
  const IconPrimary = iconPrimary;
  const primaryIcon = iconPrimary ? <IconPrimary fontSize="large" /> : null;

  return (
    <Card elevation={0} sx={{ height:125, background: color, position: 'relative', color: '#fff' }}>
      <CardContent>
        <IconWrapper>{primaryIcon}</IconWrapper>
        <Grid container direction="column" justifyContent="center" alignItems="center" spacing={1}>
          <Grid item sm={12}>
            <Typography variant="h3" align="center" color="inherit">
              {secondary}
            </Typography>
          </Grid>
          <Grid item sm={12}>
            <Typography variant="body1" align="center" color="inherit">
              {primary}
            </Typography>
          </Grid>
        </Grid>
      </CardContent>
    </Card>
  );
};

HeaderCountCard.propTypes = {
  primary: PropTypes.string,
  secondary: PropTypes.number,
  iconPrimary: PropTypes.object,
  color: PropTypes.string
};

export default HeaderCountCard;
