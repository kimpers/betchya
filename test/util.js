/* global assert */
export const assertFailed = async promiseFn => {
  try {
    await promiseFn();
  } catch (e) {
    return;
  }

  assert(false, "Did not fail as expected");
};
