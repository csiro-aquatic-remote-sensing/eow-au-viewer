import {LogLevel, LogLevelName} from 'brolog';

/**
 * If true then (debug) write all EOW Data Image URLs to console.  Corporate Affairs wants them for a presentation.
 */
export const writeAllEOWDataImageUrls = false;
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
