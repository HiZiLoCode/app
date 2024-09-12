import {Provider} from 'react-redux';

import {store} from '../store';
import Routes from '../Routes';
import { I18nextProvider } from 'react-i18next';
import i18n from 'src/utils/react-i18n-config'
export default () => (
  <I18nextProvider i18n={i18n}>
    <Provider store={store}>
      <Routes />
    </Provider>
  </I18nextProvider>

);
