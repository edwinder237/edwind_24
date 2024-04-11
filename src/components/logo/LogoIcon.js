// material-ui
import { useTheme } from '@mui/material/styles';

/**
 * if you want to use image instead of <svg> uncomment following.
 *
 * const logoIconDark = 'assets/images/logo-icon-dark.svg';
 * const logoIcon = 'assets/images/logo-icon.svg';
 *
 */

// ==============================|| LOGO ICON SVG ||============================== //

const LogoIcon = () => {
  const theme = useTheme();

  return edwindIcon(theme)

};

export default LogoIcon;

function edwindIcon(theme, reverse) {
  return (
    <svg xmlns="http://www.w3.org/2000/svg" width="41" height="28" fill="none" viewBox="0 0 41 28">
  <path fill="white" fillRule="evenodd" d="M0 8.72 40.423.982l-8.843 13.23-13.895-2.497 8.843-4.992-13.39 4.493L0 8.72Zm8.452 3.654 15.067 2.242-13.28 12.457-1.787-14.699Z" clipRule="evenodd"/>
 
</svg>
  )
}

//DOM FIX -OLD: <path fill="white" fill-rule="evenodd" d="M0 8.72 40.423.982l-8.843 13.23-13.895-2.497 8.843-4.992-13.39 4.493L0 8.72Zm8.452 3.654 15.067 2.242-13.28 12.457-1.787-14.699Z" clip-rule="evenodd"/>