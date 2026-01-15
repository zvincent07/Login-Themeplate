/**
 * INPUT VALIDATION MIDDLEWARE
 * 
 * Rules:
 * - Validate body, params, and query
 * - Validation happens BEFORE controllers
 * - Reject unknown fields
 * - Never trust frontend validation
 */

/**
 * Reject unknown fields from request body
 */
const rejectUnknownFields = (allowedFields) => {
  return (req, res, next) => {
    const bodyKeys = Object.keys(req.body || {});
    const unknownFields = bodyKeys.filter(key => !allowedFields.includes(key));

    if (unknownFields.length > 0) {
      return res.status(400).json({
        success: false,
        error: `Unknown fields not allowed: ${unknownFields.join(', ')}`,
        unknownFields,
      });
    }

    next();
  };
};

/**
 * Whitelist and sanitize query parameters
 */
const sanitizeQuery = (allowedParams) => {
  return (req, res, next) => {
    const queryKeys = Object.keys(req.query || {});
    const sanitizedQuery = {};

    allowedParams.forEach(param => {
      if (req.query[param] !== undefined) {
        sanitizedQuery[param] = req.query[param];
      }
    });

    req.query = sanitizedQuery;
    next();
  };
};

module.exports = {
  rejectUnknownFields,
  sanitizeQuery,
};
