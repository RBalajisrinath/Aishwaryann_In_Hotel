// Middleware to broadcast admin updates to all connected clients
export const broadcastAdminUpdate = (io) => {
  return (req, res, next) => {
    // Store original send
    const originalSend = res.send;
    
    res.send = function(data) {
      // Check if this is a successful admin update (PUT/POST/DELETE)
      if ((req.method === 'PUT' || req.method === 'POST' || req.method === 'DELETE') && 
          res.statusCode >= 200 && res.statusCode < 300 &&
          req.path.includes('/api/admin') || req.path.includes('/api/site-content')) {
        
        try {
          const response = JSON.parse(data);
          
          if (response.success) {
            // Broadcast to all clients
            io.emit('adminUpdate', {
              type: req.method,
              path: req.path,
              data: response.data,
              message: response.message,
              timestamp: new Date().toISOString()
            });
            
            console.log(`📡 Broadcasting admin update: ${req.method} ${req.path}`);
          }
        } catch (e) {
          // Not JSON, skip broadcasting
        }
      }
      
      // Call original send
      return originalSend.call(this, data);
    };
    
    next();
  };
};
