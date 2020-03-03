import {LogLevel, LogLevelName} from 'brolog';

export const brologLevel: LogLevelName = 'info';

// All this who-har is necessary to placate the Transpiler
export const getLogLevel = (): LogLevelName => {
  return brologLevel;
};

export const isDebugLevel = () => {
  switch (getLogLevel()) {
    case 'verbose':
    case 'silly':
      return true;
    default:
      return false;
  }
};
