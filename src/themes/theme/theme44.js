// ==============================|| PRESET THEME - THEME44 ||============================== //

const Theme44 = (colors, mode) => {
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

  // Custom color palette based on the provided image - Primary: #02174c
  let primaryColors = ['#E8ECF5', '#D1DAEA', '#A3B5D5', '#7590C0', '#476BAB', '#02174C', '#013A66', '#012D52', '#01203D', '#011429'];
  let errorColors = ['#FFE7D3', '#FF805D', '#FF4528', '#DB271D', '#930C1A'];
  let warningColors = ['#FFF6D0', '#FFCF4E', '#FFB814', '#DB970E', '#935B06'];
  let infoColors = ['#E6F8FF', '#B3ECFF', '#80E1FF', '#4DD5FF', '#2199EA', '#1A7AB8', '#145C87', '#0E3D55', '#071F2A', '#02174C'];
  let successColors = ['#EAFCD4', '#8AE65B', '#58D62A', '#3DB81E', '#137C0D'];

  if (mode === 'dark') {
    primaryColors = ['#011429', '#01203D', '#012D52', '#013A66', '#02174C', '#476BAB', '#7590C0', '#A3B5D5', '#D1DAEA', '#E8ECF5'];
    errorColors = ['#341d1b', '#b03725', '#dd3f27', '#e9664d', '#fbd6c9'];
    warningColors = ['#342a1a', '#83631a', '#dda116', '#e9ba3a', '#fbefb5'];
    infoColors = ['#02174C', '#071F2A', '#0E3D55', '#145C87', '#1A7AB8', '#2199EA', '#4DD5FF', '#80E1FF', '#B3ECFF', '#E6F8FF'];
    successColors = ['#1f2e1c', '#449626', '#4fba28', '#74cf4d', '#e3fbd2'];
  }

  return {
    primary: {
      lighter: primaryColors[0],
      100: primaryColors[1],
      200: primaryColors[2],
      light: primaryColors[3],
      400: primaryColors[4],
      main: primaryColors[5], // #02174C
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
      main: infoColors[4], // #2199EA
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

export default Theme44;