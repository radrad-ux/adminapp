/**
 * API endpoint for handling operations on a specific menu item by ID
 */

// GET handler for retrieving a specific menu item by ID
export async function GET(request, { params }) {
  console.log(`Menu item endpoint called with GET for ID: ${params.id}`);
  
  try {
    // In a real implementation, this would fetch from a database
    // For now, forward the request to the main API
    const apiUrl = process.env.API_URL || 'https://dmenu-five.vercel.app/api';
    const response = await fetch(`${apiUrl}/menu-items/${params.id}`, {
      method: 'GET',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': request.headers.get('authorization') || ''
      }
    });
    
    const data = await response.json();
    return Response.json(data);
  } catch (error) {
    console.error(`Error fetching menu item ${params.id}:`, error);
    return Response.json({ error: 'Failed to fetch menu item' }, { status: 500 });
  }
}

// PATCH handler for updating a menu item (specifically for availability)
export async function PATCH(request, { params }) {
  console.log(`Menu item endpoint called with PATCH for ID: ${params.id}`);
  
  try {
    const body = await request.json();
    console.log(`Updating menu item ${params.id} with:`, body);
    
    // Forward the request to the main API, but use PUT since that's what it supports
    const apiUrl = process.env.API_URL || 'https://dmenu-five.vercel.app/api';
    const response = await fetch(`${apiUrl}/menu-items/${params.id}`, {
      method: 'PUT', // Use PUT instead of PATCH
      headers: {
        'Content-Type': 'application/json',
        'Authorization': request.headers.get('authorization') || ''
      },
      body: JSON.stringify(body)
    });
    
    if (!response.ok) {
      const errorData = await response.json();
      console.error(`API error when updating menu item ${params.id}:`, errorData);
      return Response.json(
        { message: errorData.message || 'Unknown error', status: response.status },
        { status: response.status }
      );
    }
    
    const data = await response.json();
    return Response.json(data);
  } catch (error) {
    console.error(`Error updating menu item ${params.id}:`, error);
    return Response.json({ error: 'Failed to update menu item' }, { status: 500 });
  }
}

// PUT handler for full updates to a menu item
export async function PUT(request, { params }) {
  console.log(`Menu item endpoint called with PUT for ID: ${params.id}`);
  
  try {
    const body = await request.json();
    console.log(`Updating menu item ${params.id} with:`, body);
    
    // Forward the request to the main API
    const apiUrl = process.env.API_URL || 'https://dmenu-five.vercel.app/api';
    const response = await fetch(`${apiUrl}/menu-items/${params.id}`, {
      method: 'PUT',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': request.headers.get('authorization') || ''
      },
      body: JSON.stringify(body)
    });
    
    if (!response.ok) {
      const errorData = await response.json();
      console.error(`API error when updating menu item ${params.id}:`, errorData);
      return Response.json(
        { message: errorData.message || 'Unknown error', status: response.status },
        { status: response.status }
      );
    }
    
    const data = await response.json();
    return Response.json(data);
  } catch (error) {
    console.error(`Error updating menu item ${params.id}:`, error);
    return Response.json({ error: 'Failed to update menu item' }, { status: 500 });
  }
} 