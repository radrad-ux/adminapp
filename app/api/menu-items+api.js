/**
 * API endpoint for menu items
 */

// Sample data for menu items
const MENU_ITEMS_DATA = [
  {
    id: '1',
    name: 'Grilled Salmon',
    description: 'Fresh salmon fillet grilled to perfection, served with seasonal vegetables',
    price: 24.99,
    category: 'Main Course',
    image: 'https://example.com/grilled-salmon.jpg',
    available: true
  },
  {
    id: '2',
    name: 'Beef Tenderloin',
    description: 'Premium cut beef tenderloin with red wine reduction',
    price: 29.99,
    category: 'Main Course',
    image: 'https://example.com/beef-tenderloin.jpg',
    available: true
  },
  {
    id: '3',
    name: 'Chocolate Lava Cake',
    description: 'Warm chocolate cake with molten center, served with vanilla ice cream',
    price: 9.99,
    category: 'Dessert',
    image: 'https://example.com/chocolate-lava-cake.jpg',
    available: true
  },
  {
    id: '4',
    name: 'Caesar Salad',
    description: 'Crisp romaine lettuce with Caesar dressing, croutons, and parmesan cheese',
    price: 12.99,
    category: 'Appetizers',
    image: 'https://example.com/caesar-salad.jpg',
    available: true
  },
  {
    id: '5',
    name: 'Pasta Carbonara',
    description: 'Spaghetti with creamy sauce, pancetta, and parmesan cheese',
    price: 18.99,
    category: 'Main Course',
    image: 'https://example.com/pasta-carbonara.jpg',
    available: true
  },
  {
    id: '6',
    name: 'Tiramisu',
    description: 'Classic Italian dessert with coffee-soaked ladyfingers and mascarpone cream',
    price: 8.99,
    category: 'Dessert',
    image: 'https://example.com/tiramisu.jpg',
    available: true
  },
  {
    id: '7',
    name: 'Sparkling Water',
    description: 'Refreshing sparkling water with ice and lemon',
    price: 3.99,
    category: 'Beverages',
    image: 'https://example.com/sparkling-water.jpg',
    available: true
  }
];

// GET handler for fetching all menu items
export function GET(request) {
  console.log('Menu items endpoint called with GET');
  
  // Get URL parameters for filtering
  const url = new URL(request.url);
  const category = url.searchParams.get('category');
  
  if (category) {
    // Filter menu items by category
    const filteredItems = MENU_ITEMS_DATA.filter(item => item.category === category);
    return Response.json(filteredItems);
  }
  
  // Return all menu items if no category filter
  return Response.json(MENU_ITEMS_DATA);
}

// POST handler for creating or updating a menu item
export async function POST(request) {
  console.log('Menu items endpoint called with POST');
  
  try {
    const body = await request.json();
    console.log('Received menu item data:', body);
    
    // Here you would typically persist this data to a database
    
    return Response.json({
      success: true,
      message: 'Menu item saved successfully',
      menuItem: body
    });
  } catch (error) {
    console.error('Error processing menu item data:', error);
    
    return new Response(
      JSON.stringify({
        success: false,
        message: 'Failed to process menu item data',
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

// PUT handler for updating a specific menu item
export async function PUT(request) {
  console.log('Menu items endpoint called with PUT');
  
  try {
    const body = await request.json();
    console.log('Updating menu item:', body);
    
    // Here you would typically update the menu item in a database
    
    return Response.json({
      success: true,
      message: 'Menu item updated successfully',
      menuItem: body
    });
  } catch (error) {
    console.error('Error updating menu item:', error);
    
    return new Response(
      JSON.stringify({
        success: false,
        message: 'Failed to update menu item',
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