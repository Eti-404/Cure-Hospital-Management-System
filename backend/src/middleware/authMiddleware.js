/**
 * "নিরাময়" (Niramoy) - Authentication Middleware
 * Extracts and verifies JWT bearer tokens
 */

const jwt = require('jsonwebtoken');

const JWT_SECRET = process.env.JWT_SECRET || 'niramoy_jwt_secret_dev_key_tertiary_hospital_2026';

const verifyToken = (req, res, next) => {
  const authHeader = req.headers.authorization || req.headers.Authorization;

  if (!authHeader || !authHeader.startsWith('Bearer ')) {
    return res.status(401).json({
      success: false,
      message: 'অননুমোদিত প্রবেশাধিকার। অনুগ্রহ করে প্রথমে লগইন করুন। (Unauthorized: No Bearer token provided)',
    });
  }

  const token = authHeader.split(' ')[1];

  try {
    const decoded = jwt.verify(token, JWT_SECRET);
    req.user = decoded; // { id, full_name, mobile_number, nid, role }
    next();
  } catch (err) {
    return res.status(403).json({
      success: false,
      message: 'টোকেন মেয়াদোত্তীর্ণ বা অবৈধ। আবার লগইন করুন। (Forbidden: Invalid or expired token)',
      error: err.message,
    });
  }
};

module.exports = {
  verifyToken,
  JWT_SECRET,
};
