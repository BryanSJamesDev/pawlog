/**
 * Express middleware to ensure the request is made by an authenticated user.
 *
 * @param {Object} req - Express request object
 * @param {Object} res - Express response object
 * @param {Function} next - Express next middleware function
 */
export function requireLogin(req, res, next) {
  if (!req.user) {
    return res.status(401).json({ error: 'Not logged in' });
  }
  next();
}
