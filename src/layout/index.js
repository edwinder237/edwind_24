import PropTypes from "prop-types";
import { lazy, Suspense } from "react";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";

// material-ui
import { styled } from "@mui/material/styles";
import LinearProgress from "@mui/material/LinearProgress";

// project import
import MainLayout from "./MainLayout";
import AuthGuard from "components/AuthGuard";
//import GuestGuard from "utils/route-guard/GuestGuard";

const Header = lazy(() => import("./Header"));
const FooterBlock = lazy(() => import("./FooterBlock"));

// ==============================|| REACT QUERY ||============================== //
// Create a client
const queryClient = new QueryClient();

// ==============================|| Loader ||============================== //

const LoaderWrapper = styled("div")(({ theme }) => ({
  position: "fixed",
  top: 0,
  left: 0,
  zIndex: 2001,
  width: "100%",
  "& > * + *": {
    marginTop: theme.spacing(2),
  },
}));

const Loader = () => (
  <LoaderWrapper>
    <LinearProgress color="primary" />
  </LoaderWrapper>
);

// ==============================|| LAYOUTS - STRUCTURE ||============================== //

export default function Layout({ variant = "main", children }) {
  if (variant === "landing" || variant === "simple") {
    return (
      <Suspense fallback={<Loader />}>
        <Header layout={variant} />
        {children}
        <FooterBlock isFull={variant === "landing"} />
      </Suspense>
    );
  }

  if (variant === "blank") {
    return children;
  }

  if (variant === "auth") {
    //return <GuestGuard>{children}</GuestGuard>;
  }

  return (
    <QueryClientProvider client={queryClient}>
      <AuthGuard>
        <MainLayout>{children}</MainLayout>
      </AuthGuard>
    </QueryClientProvider>
  );
}

Layout.propTypes = {
  variant: PropTypes.string,
  children: PropTypes.node,
};
