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

  return edbahnIcon(theme)

};

export default LogoIcon;

function edbahnIcon(theme) {
  return (
    <svg xmlns="http://www.w3.org/2000/svg" width="35" height="35" viewBox="0 0 114 77" fill="none">
      <rect width="114" height="77" rx="10" fill="white" />
      <g transform="matrix(-1.6018306636155604,0,0,1.6018306636155604,95.28604118993134,0.1029745228503316)" fill={theme.palette.primary.main}>
        <g><polygon points="1,9.3 47,18.4 32.2,20.9 17.1,15.8 27.7,21.9 11.1,24.6" /></g>
        <g><polygon points="37.4,21.9 20.2,24.6 35.6,38.7" /></g>
      </g>
    </svg>
  )
}

//DOM FIX -OLD: <path fill="white" fill-rule="evenodd" d="M0 8.72 40.423.982l-8.843 13.23-13.895-2.497 8.843-4.992-13.39 4.493L0 8.72Zm8.452 3.654 15.067 2.242-13.28 12.457-1.787-14.699Z" clip-rule="evenodd"/>