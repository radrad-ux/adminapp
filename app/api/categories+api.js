/**
 * API endpoint for menu categories
 */

// Sample data for categories
const CATEGORIES_DATA = [
  {
    id: 'cat-1',
    name: 'Main Course',
    description: 'Primary dishes served as the main course of a meal',
    displayOrder: 1,
    active: true
  },
  {
    id: 'cat-2',
    name: 'Appetizers',
    description: 'Small dishes served before the main course',
    displayOrder: 0,
    active: true
  },
  {
    id: 'cat-3',
    name: 'Dessert',
    description: 'Sweet dishes served after the main course',
    displayOrder: 2,
    active: true
  },
  {
    id: 'cat-4',
    name: 'Beverages',
    description: 'Drinks and refreshments',
    displayOrder: 3,
    active: true
  }
];

// GET handler for fetching all categories
export function GET(request) {
  console.log('Categories endpoint called with GET');
  
  // Return actual data instead of empty array
  return Response.json(CATEGORIES_DATA);
}

// POST handler for creating or updating a category
export async function POST(request) {
  console.log('Categories endpoint called with POST');
  
  try {
    const body = await request.json();
    console.log('Received category data:', body);
    
    // Here you would typically persist this data to a database
    
    return Response.json({
      success: true,
      message: 'Category saved successfully',
      category: body
    });
  } catch (error) {
    console.error('Error processing category data:', error);
    
    return new Response(
      JSON.stringify({
        success: false,
        message: 'Failed to process category data',
        error: error.message
      }),
      {
        status: 400,
        headers: {
          'Content-Type': 'application/json'
        }
      }
    );
  }
}

// PUT handler for updating a specific category
export async function PUT(request) {
  console.log('Categories endpoint called with PUT');
  
  try {
    const body = await request.json();
    console.log('Updating category:', body);
    
    // Here you would typically update the category in a database
    
    return Response.json({
      success: true,
      message: 'Category updated successfully',
      category: body
    });
  } catch (error) {
    console.error('Error updating category:', error);
    
    return new Response(
      JSON.stringify({
        success: false,
        message: 'Failed to update category',
        error: error.message
      }),
      {
        status: 400,
        headers: {
          'Content-Type': 'application/json'
        }
      }
    );
  }
}

// DELETE handler for removing a category
export async function DELETE(request) {
  console.log('Categories endpoint called with DELETE');
  
  try {
    const url = new URL(request.url);
    const id = url.searchParams.get('id');
    
    if (!id) {
      throw new Error('Category ID is required');
    }
    
    console.log('Deleting category with ID:', id);
    
    // Here you would typically delete the category from a database
    
    return Response.json({
      success: true,
      message: `Category with ID ${id} deleted successfully`
    });
  } catch (error) {
    console.error('Error deleting category:', error);
    
    return new Response(
      JSON.stringify({
        success: false,
        message: 'Failed to delete category',
        error: error.message
      }),
      {
        status: 400,
        headers: {
          'Content-Type': 'application/json'
        }
      }
    );
  }
} 