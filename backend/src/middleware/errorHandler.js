/**
 * "নিরাময়" (Niramoy) - Centralized Error Handler Middleware
 */

const errorHandler = (err, req, res, next) => {
  console.error('❌ [Server Error]:', err.stack || err.message);

  const statusCode = res.statusCode === 200 ? 500 : res.statusCode;

  res.status(statusCode).json({
    success: false,
    message: err.message || 'অভ্যন্তরীণ সার্ভার ত্রুটি। (Internal Server Error)',
    stack: process.env.NODE_ENV === 'production' ? null : err.stack,
  });
};

module.exports = errorHandler;
