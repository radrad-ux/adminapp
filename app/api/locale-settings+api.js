/**
 * API endpoint for restaurant locale settings
 */

// Sample data for restaurant settings that matches the server format
const SETTINGS_DATA = {
  defaultLanguage: 'en',
  defaultCurrency: 'DZD',
  orderingEnabled: true,
  // Server timestamp (for cache verification)
  serverTime: new Date().toISOString()
};

// GET handler for fetching restaurant settings
export function GET(request) {
  console.log('Locale settings endpoint called with GET');
  
  // Return actual data with no-cache headers
  return Response.json(SETTINGS_DATA, {
    headers: {
      'Cache-Control': 'no-store, no-cache, must-revalidate, proxy-revalidate',
      'Pragma': 'no-cache',
      'Expires': '0',
      'Surrogate-Control': 'no-store'
    }
  });
}

// POST handler for updating restaurant settings
export async function POST(request) {
  console.log('Locale settings endpoint called with POST');
  
  try {
    const body = await request.json();
    console.log('Received settings data:', body);
    
    // Here you would typically persist this data to a database
    // Update only the fields that can be changed
    const updatedSettings = {
      ...SETTINGS_DATA,
      defaultLanguage: body.defaultLanguage || SETTINGS_DATA.defaultLanguage,
      orderingEnabled: body.orderingEnabled !== undefined ? body.orderingEnabled : SETTINGS_DATA.orderingEnabled,
      // defaultCurrency is fixed to DZD and cannot be changed
      serverTime: new Date().toISOString()
    };
    
    return Response.json({
      success: true,
      message: 'Settings updated successfully',
      data: updatedSettings
    }, {
      headers: {
        'Cache-Control': 'no-store, no-cache, must-revalidate, proxy-revalidate',
        'Pragma': 'no-cache',
        'Expires': '0',
        'Surrogate-Control': 'no-store'
      }
    });
  } catch (error) {
    console.error('Error processing settings data:', error);
    
    return new Response(
      JSON.stringify({
        success: false,
        message: 'Failed to update settings',
        error: error.message
      }),
      {
        status: 400,
        headers: {
          'Content-Type': 'application/json',
          'Cache-Control': 'no-store, no-cache, must-revalidate, proxy-revalidate',
          'Pragma': 'no-cache',
          'Expires': '0',
          'Surrogate-Control': 'no-store'
        }
      }
    );
  }
}

// PUT handler for full update (to match server's route.js)
export async function PUT(request) {
  console.log('Locale settings endpoint called with PUT');
  
  try {
    const body = await request.json();
    console.log('Received settings data for PUT:', body);
    
    // Similar logic to POST but for PUT semantics
    const updatedSettings = {
      ...SETTINGS_DATA,
      defaultLanguage: body.defaultLanguage || SETTINGS_DATA.defaultLanguage,
      orderingEnabled: body.orderingEnabled !== undefined ? body.orderingEnabled : SETTINGS_DATA.orderingEnabled,
      // defaultCurrency is fixed to DZD and cannot be changed
      serverTime: new Date().toISOString()
    };
    
    return Response.json({
      success: true,
      message: 'Settings updated successfully',
      data: updatedSettings
    }, {
      headers: {
        'Cache-Control': 'no-store, no-cache, must-revalidate, proxy-revalidate',
        'Pragma': 'no-cache',
        'Expires': '0',
        'Surrogate-Control': 'no-store'
      }
    });
  } catch (error) {
    console.error('Error processing settings data:', error);
    
    return new Response(
      JSON.stringify({
        success: false,
        message: 'Failed to update settings',
        error: error.message
      }),
      {
        status: 400,
        headers: {
          'Content-Type': 'application/json',
          'Cache-Control': 'no-store, no-cache, must-revalidate, proxy-revalidate',
          'Pragma': 'no-cache',
          'Expires': '0',
          'Surrogate-Control': 'no-store'
        }
      }
    );
  }
} 