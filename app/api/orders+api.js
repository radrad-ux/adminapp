/**
 * API endpoint for restaurant orders
 */

// Sample data for orders
const ORDERS_DATA = [
  {
    id: 'ord-001',
    tableNumber: '5',
    timestamp: '2023-04-06T14:30:00Z',
    status: 'completed',
    items: [
      { id: '1', name: 'Grilled Salmon', quantity: 2, price: 24.99 },
      { id: '3', name: 'Chocolate Lava Cake', quantity: 2, price: 9.99 }
    ],
    total: 69.96
  },
  {
    id: 'ord-002',
    tableNumber: '8',
    timestamp: '2023-04-06T15:45:00Z',
    status: 'in-progress',
    items: [
      { id: '2', name: 'Beef Tenderloin', quantity: 1, price: 29.99 }
    ],
    total: 29.99
  },
  {
    id: 'ord-003',
    tableNumber: '3',
    timestamp: '2023-04-06T16:20:00Z',
    status: 'pending',
    items: [
      { id: '4', name: 'Caesar Salad', quantity: 1, price: 12.99 },
      { id: '5', name: 'Pasta Carbonara', quantity: 1, price: 18.99 },
      { id: '6', name: 'Tiramisu', quantity: 1, price: 8.99 }
    ],
    total: 40.97
  }
];

// GET handler for fetching all orders
export function GET(request) {
  console.log('Orders endpoint called with GET');
  
  // Get URL parameters for filtering
  const url = new URL(request.url);
  const status = url.searchParams.get('status');
  
  if (status) {
    // Filter orders by status
    const filteredOrders = ORDERS_DATA.filter(order => order.status === status);
    return Response.json(filteredOrders);
  }
  
  // Return all orders if no status filter
  return Response.json(ORDERS_DATA);
}

// POST handler for creating a new order
export async function POST(request) {
  console.log('Orders endpoint called with POST');
  
  try {
    const body = await request.json();
    console.log('Received order data:', body);
    
    // Here you would typically save the order to a database
    
    // Generate a fake order ID for the response
    const newOrder = {
      ...body,
      id: `ord-${Math.floor(Math.random() * 1000).toString().padStart(3, '0')}`,
      timestamp: new Date().toISOString()
    };
    
    return Response.json({
      success: true,
      message: 'Order created successfully',
      order: newOrder
    });
  } catch (error) {
    console.error('Error processing order data:', error);
    
    return new Response(
      JSON.stringify({
        success: false,
        message: 'Failed to create order',
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

// PUT handler for updating an order status
export async function PUT(request) {
  console.log('Orders endpoint called with PUT');
  
  try {
    const body = await request.json();
    console.log('Updating order:', body);
    
    if (!body.id) {
      throw new Error('Order ID is required');
    }
    
    // Here you would typically update the order in a database
    
    return Response.json({
      success: true,
      message: `Order ${body.id} updated successfully`,
      order: body
    });
  } catch (error) {
    console.error('Error updating order:', error);
    
    return new Response(
      JSON.stringify({
        success: false,
        message: 'Failed to update order',
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

// DELETE handler for canceling an order
export async function DELETE(request) {
  console.log('Orders endpoint called with DELETE');
  
  try {
    const url = new URL(request.url);
    const id = url.searchParams.get('id');
    
    if (!id) {
      throw new Error('Order ID is required');
    }
    
    console.log('Canceling order with ID:', id);
    
    // Here you would typically update the order status in a database
    
    return Response.json({
      success: true,
      message: `Order ${id} cancelled successfully`
    });
  } catch (error) {
    console.error('Error canceling order:', error);
    
    return new Response(
      JSON.stringify({
        success: false,
        message: 'Failed to cancel order',
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