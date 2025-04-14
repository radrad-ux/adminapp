/**
 * API endpoint for environment check
 * This endpoint is used to verify that the API is functioning correctly
 */

// GET handler for environment check
export function GET(request) {
  console.log('Environment check endpoint called');
  
  return Response.json({
    success: true,
    message: 'API is functioning correctly',
    timestamp: new Date().toISOString(),
    environment: process.env.NODE_ENV || 'development',
    apiVersion: '1.0.0',
    endpoints: [
      { path: '/env-check', method: 'GET', description: 'Environment check' },
      { path: '/categories', method: 'GET,POST,PUT,DELETE', description: 'Menu categories' },
      { path: '/locale-settings', method: 'GET,POST,PATCH', description: 'Restaurant settings' },
      { path: '/menu-items', method: 'GET,POST,PUT', description: 'Menu items' },
      { path: '/orders', method: 'GET,POST,PUT,DELETE', description: 'Restaurant orders' },
      { path: '/restaurant-info', method: 'GET,POST', description: 'Restaurant information' }
    ]
  });
} 