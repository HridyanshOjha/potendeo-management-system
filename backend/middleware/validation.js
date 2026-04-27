/**
 * Input sanitization & validation helpers.
 * Used as route-level middleware arrays.
 */

// Sanitize string fields - trim whitespace, remove null bytes
const sanitizeBody = (req, res, next) => {
  const sanitize = (obj) => {
    if (typeof obj !== 'object' || obj === null) return obj;
    for (const key of Object.keys(obj)) {
      if (typeof obj[key] === 'string') {
        obj[key] = obj[key].trim().replace(/\0/g, '');
      } else if (typeof obj[key] === 'object') {
        sanitize(obj[key]);
      }
    }
    return obj;
  };
  if (req.body) req.body = sanitize(req.body);
  next();
};

// Validate MongoDB ObjectId params
const validateObjectId = (paramName = 'id') => (req, res, next) => {
  const id = req.params[paramName];
  if (!id || !/^[a-fA-F0-9]{24}$/.test(id)) {
    return res.status(400).json({ success: false, message: `Invalid ${paramName} format.` });
  }
  next();
};

// Validate required body fields
const requireFields = (...fields) => (req, res, next) => {
  const missing = fields.filter(f => !req.body[f]);
  if (missing.length > 0) {
    return res.status(400).json({
      success: false,
      message: `Missing required fields: ${missing.join(', ')}.`,
    });
  }
  next();
};

module.exports = { sanitizeBody, validateObjectId, requireFields };
