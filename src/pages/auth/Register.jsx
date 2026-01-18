import React from 'react';
import { useAppSettings } from '../../contexts/AppSettingsContext';
import RegisterV1 from './RegisterV1';
import RegisterV2 from './RegisterV2';

const Register = () => {
  const { authUiVersion } = useAppSettings();

  return authUiVersion === '2' ? <RegisterV2 /> : <RegisterV1 />;
};

export default Register;
