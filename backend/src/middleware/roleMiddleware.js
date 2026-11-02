/**
 * "নিরাময়" (Niramoy) - Role-Based Access Control (RBAC) Middleware
 * Restricts endpoint access according to user role: 'patient', 'doctor', 'admin', 'pharmacy'
 */

const authorizeRoles = (...allowedRoles) => {
  return (req, res, next) => {
    if (!req.user || !req.user.role) {
      return res.status(401).json({
        success: false,
        message: 'ব্যবহারকারীর ভূমিকা সনাক্ত করা যায়নি। (User role not identified)',
      });
    }

    if (!allowedRoles.includes(req.user.role)) {
      return res.status(403).json({
        success: false,
        message: `অননুমোদিত ভূমিকা। এই কাজটি সম্পাদন করার অনুমতি শুধুমাত্র [${allowedRoles.join(', ')}] এর জন্য সংরক্ষিত। (Forbidden: Required role [${allowedRoles.join(', ')}], current role is [${req.user.role}])`,
      });
    }

    next();
  };
};

module.exports = {
  authorizeRoles,
};
