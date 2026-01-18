import React from 'react';
import { useAppSettings } from '../../contexts/AppSettingsContext';
import LoginV1 from './LoginV1';
import LoginV2 from './LoginV2';

const Login = () => {
  const { authUiVersion } = useAppSettings();

  return authUiVersion === '2' ? <LoginV2 /> : <LoginV1 />;
};

export default Login;
