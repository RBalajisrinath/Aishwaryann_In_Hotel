export const errorHandler = (err, req, res, next) => {
  console.error('Error:', err.message);

  // Default error
  let statusCode = err.statusCode || 500;
  let message = err.message || 'Internal Server Error';

  // Validation errors
  if (err.name === 'ValidationError') {
    statusCode = 400;
    message = err.details?.map(d => d.message).join(', ') || 'Validation failed';
  }

  // JWT errors
  if (err.name === 'JsonWebTokenError') {
    statusCode = 401;
    message = 'Invalid token';
  }

  // Database errors
  if (err.code?.startsWith('ER_')) {
    statusCode = 400;
    message = 'Database error occurred';
  }

  res.status(statusCode).json({
    success: false,
    message,
    ...(process.env.NODE_ENV === 'development' && { error: err })
  });
};
