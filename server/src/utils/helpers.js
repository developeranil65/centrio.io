/**
 * Utility helpers
 */

/**
 * Wrap an async route handler to catch errors automatically.
 */
const asyncHandler = (fn) => (req, res, next) => {
    Promise.resolve(fn(req, res, next)).catch(next);
};

module.exports = { asyncHandler };
