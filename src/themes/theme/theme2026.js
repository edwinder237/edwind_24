// ==============================|| PRESET THEME - THEME2026 ||============================== //

const Theme2026 = (colors, mode) => {
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

  // Color palette: Primary #0083fd, Dark #0069ca, Light #319cff / #64b4ff
  let primaryColors = ['#e6f2ff', '#b3d9ff', '#80c1ff', '#64b4ff', '#319cff', '#0083fd', '#0069ca', '#004f98', '#003565', '#001b33'];
  let errorColors = ['#FFE7D3', '#FF805D', '#FF4528', '#DB271D', '#930C1A'];
  let warningColors = ['#FFF6D0', '#FFCF4E', '#FFB814', '#DB970E', '#935B06'];
  let infoColors = ['#e6f2ff', '#b3d9ff', '#80c1ff', '#64b4ff', '#319cff', '#0083fd', '#0069ca', '#004f98', '#003565', '#001b33'];
  let successColors = ['#EAFCD4', '#8AE65B', '#58D62A', '#3DB81E', '#137C0D'];

  if (mode === 'dark') {
    primaryColors = ['#001b33', '#003565', '#004f98', '#0069ca', '#0083fd', '#319cff', '#64b4ff', '#80c1ff', '#b3d9ff', '#e6f2ff'];
    errorColors = ['#341d1b', '#b03725', '#dd3f27', '#e9664d', '#fbd6c9'];
    warningColors = ['#342a1a', '#83631a', '#dda116', '#e9ba3a', '#fbefb5'];
    infoColors = ['#001b33', '#003565', '#004f98', '#0069ca', '#0083fd', '#319cff', '#64b4ff', '#80c1ff', '#b3d9ff', '#e6f2ff'];
    successColors = ['#1f2e1c', '#449626', '#4fba28', '#74cf4d', '#e3fbd2'];
  }

  return {
    primary: {
      lighter: primaryColors[0],
      100: primaryColors[1],
      200: primaryColors[2],
      light: primaryColors[3],
      400: primaryColors[4],
      main: primaryColors[5], // #0083fd
      dark: primaryColors[6], // #0069ca
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
      main: infoColors[4], // #319cff
      dark: infoColors[5],
      darker: infoColors[6],
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

export default Theme2026;
