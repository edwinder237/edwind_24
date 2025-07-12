// ==============================|| PRESET THEME - PURPLE THEME8 ||============================== //

const Theme9 = (colors, mode) => {
  const { grey } = colors;
  const greyColors = {
    0: grey[0],
    50: grey[1],
    100: grey[2],
    200: grey[3],
    300: grey[4],
    400: grey[5],
    500: grey[6],
    600: grey[7],
    700: grey[8],
    800: grey[9],
    900: grey[10],
    A50: grey[15],
    A100: grey[11],
    A200: grey[12],
    A400: grey[13],
    A700: grey[14],
    A800: grey[16]
  };
  const contrastText = '#fff';

  let primaryColors = ['#CBDEFC', '#98BCF9', '#6292EE', '#3B6EDD', '#053CC7', '#032EAB', '#02228F', '#011773', '#00105F'];

  let errorColors = ['#F9DDCF', '#F3B6A1', '#DC806C', '#BA4E44', '#8C1616', '#781019', '#640B1A', '#51071A', '#43041A'];
  let warningColors = ['#FBF2C9', '#F8E495', '#EBCA5F', '#D8Ad37', '#BF8601', '#A46E00', '#895700', '#6E4300', '#5B3400'];

  let infoColors = ['#C7F9E9', '#91F3DD', '#57DBC9', '#2EB8B0', '#008589', '#006875', '#004E62', '#00384F', '#002941'];
  let successColors = ['#E7FAD2', '#CAF6A7', '#9FE377', '#74C951', '#3FA522', '#2A8D18', '#187611', '#0B5F0A', '#064F0B'];

  if (mode === 'dark') {
    primaryColors = ['#1a2524', '#173331', '#15423e', '#11544e', '#0b6c63', '#058478', '#1a9686', '#37a996', '#59b8a5', '#7fc6b6'];
    errorColors = ['#321d1d', '#7d2e28', '#d13c31', '#e66859', '#f8baaf'];
    warningColors = ['#342c1a', '#836611', '#dda705', '#e9bf28', '#f8e577'];
    infoColors = ['#1a2628', '#11595f', '#058e98', '#1ea6aa', '#64cfcb'];
    successColors = ['#1a2721', '#115c36', '#05934c', '#1da65d', '#61ca8b'];
  }

  return {
    primary: {
      lighter: primaryColors[0],
      100: primaryColors[1],
      200: primaryColors[2],
      light: primaryColors[3],
      400: primaryColors[4],
      main: primaryColors[5],
      dark: primaryColors[6],
      700: primaryColors[7],
      darker: primaryColors[8],
      900: primaryColors[9],
      contrastText
    },
    secondary: {
      lighter: greyColors[100],
      100: greyColors[100],
      200: greyColors[200],
      light: greyColors[300],
      400: greyColors[400],
      main: greyColors[500],
      600: greyColors[600],
      dark: greyColors[700],
      800: greyColors[800],
      darker: greyColors[900],
      A100: greyColors[0],
      A200: greyColors.A400,
      A300: greyColors.A700,
      contrastText: greyColors[0]
    },
    error: {
      lighter: errorColors[0],
      light: errorColors[1],
      main: errorColors[2],
      dark: errorColors[3],
      darker: errorColors[4],
      contrastText
    },
    warning: {
      lighter: warningColors[0],
      light: warningColors[1],
      main: warningColors[2],
      dark: warningColors[3],
      darker: warningColors[4],
      contrastText: greyColors[100]
    },
    info: {
      lighter: infoColors[0],
      light: infoColors[1],
      main: infoColors[2],
      dark: infoColors[3],
      darker: infoColors[4],
      contrastText
    },
    success: {
      lighter: successColors[0],
      light: successColors[1],
      main: successColors[2],
      dark: successColors[3],
      darker: successColors[4],
      contrastText
    },
    grey: greyColors
  };
};

export default Theme9;

const collor = {
  'color-primary-100': '#C9D2F7',
  'color-primary-200': '#97A7EF',
  'color-primary-300': '#5D70D0',
  'color-primary-400': '#3243A2',
  'color-primary-500': '#081565',
  'color-primary-600': '#050F56',
  'color-primary-700': '#040B48',
  'color-primary-800': '#02073A',
  'color-primary-900': '#010530',
  'color-success-100': '#E4F8D0',
  'color-success-200': '#C6F1A5',
  'color-success-300': '#95D670',
  'color-success-400': '#64AD46',
  'color-success-500': '#2D7719',
  'color-success-600': '#1D6612',
  'color-success-700': '#11550C',
  'color-success-800': '#074508',
  'color-success-900': '#043909',
  'color-info-100': '#C7F9E9',
  'color-info-200': '#91F3DD',
  'color-info-300': '#57DBC9',
  'color-info-400': '#2EB8B0',
  'color-info-500': '#008589',
  'color-info-600': '#006875',
  'color-info-700': '#004E62',
  'color-info-800': '#00384F',
  'color-info-900': '#002941',
  'color-warning-100': '#FBF2C9',
  'color-warning-200': '#F8E495',
  'color-warning-300': '#EBCA5F',
  'color-warning-400': '#D8AD37',
  'color-warning-500': '#BF8601',
  'color-warning-600': '#A46E00',
  'color-warning-700': '#895700',
  'color-warning-800': '#6E4300',
  'color-warning-900': '#5B3400',
  'color-danger-100': '#F9DDCF',
  'color-danger-200': '#F3B6A1',
  'color-danger-300': '#DC806C',
  'color-danger-400': '#BA4E44',
  'color-danger-500': '#8C1616',
  'color-danger-600': '#781019',
  'color-danger-700': '#640B1A',
  'color-danger-800': '#51071A',
  'color-danger-900': '#43041A'
};
