import PropTypes from 'prop-types';

// polyfills
import 'core-js/stable';
import 'regenerator-runtime/runtime';

// scroll bar
import 'simplebar/src/simplebar.css';

// apex-chart
import 'styles/apex-chart.css';
import 'styles/react-table.css';
import 'styles/editorStyles.module.css';


// third party
import { Provider as ReduxProvider } from 'react-redux';

// project import
import Locales from 'components/Locales';
import ScrollTop from 'components/ScrollTop';
import RTLLayout from 'components/RTLLayout';
import Snackbar from 'components/@extended/Snackbar';
import Notistack from 'components/third-party/Notistack';
import { ConfigProvider } from 'contexts/ConfigContext';
import { store } from 'store';
import ThemeCustomization from 'themes';

export default function App({ Component, pageProps }) {
  const getLayout = Component.getLayout ?? ((page) => page);

  return (
    <ReduxProvider store={store}>
      <ConfigProvider>
        <ThemeCustomization>
          <RTLLayout>
            <Locales>
              <ScrollTop>
                <>
                  <Notistack>
                    <Snackbar />
                    {getLayout(<Component {...pageProps} />)}
                  </Notistack>
                </>
              </ScrollTop>
            </Locales>
          </RTLLayout>
        </ThemeCustomization>
      </ConfigProvider>
    </ReduxProvider>
  );
}

App.propTypes = {
  Component: PropTypes.any,
  pageProps: PropTypes.any
};


