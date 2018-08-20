/* global assert */
export const assertFailed = async promiseFn => {
  try {
    await promiseFn();
  } catch (e) {
    return;
  }

  assert(false, "Did not fail as expected");
};

export const promisifyLogEvent = event =>
  new Promise((resolve, reject) => {
    event.watch((err, log) => {
      if (err) {
        reject(err);
        return;
      }

      resolve(log);
    });
  });
