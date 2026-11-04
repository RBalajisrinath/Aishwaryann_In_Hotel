export const requestLogger = (req, res, next) => {
  const start = Date.now();
  
  res.on('finish', () => {
    // Request logging disabled for production
  });
  
  next();
};
