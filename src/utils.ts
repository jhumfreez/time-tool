const EXPORT_FILE_EXT = '.json';

export const padNumber = (value: number, padLength = 2, padding = '0') =>
  (value + '').padStart(padLength, padding);

// #region Time Utils

export const msToHours = (milliseconds: number) => {
  const sec = milliseconds / 1000;
  const min = sec / 60;
  const hours = min / 60;
  return hours;
};

/**
 * Add days to current date. Provide negative integer for subtraction.
 * @example
 * const lastWeek = offsetDays(-7);
 */
export const offsetDays = (numDays: number) => {
  const today = new Date();
  return new Date(today.setDate(today.getDate() + numDays));
};

export const dateStamp = () =>
  new Date().toLocaleDateString().replace(/\//g, '-');

// #endregion Time Utils

// #region File Utils
export const defaultFileName = () => `time-export_${dateStamp()}`;

// src: https://stackoverflow.com/questions/34156282/how-do-i-save-json-to-local-text-file
export const exportObject = (data: Object) => {
  const blob = new Blob([JSON.stringify(data, null, 4)], {
    type: 'application/json',
  });
  return blob;
};

export const download = (content: Object, fileName = defaultFileName()) => {
  const a = document.createElement('a');
  const file = exportObject(content);
  a.href = URL.createObjectURL(file);
  a.download = fileName + EXPORT_FILE_EXT;
  a.click();
};
// #endregion File Utils
