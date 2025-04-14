/**
 * API endpoint for restaurant information
 */

// Sample data for restaurant info with more realistic content
const RESTAURANT_INFO = {
  name: 'The Gourmet Kitchen',
  address: '123 Main Street, Foodtown, FT 12345',
  phone: '+1 (555) 123-4567',
  email: 'info@gourmetkitchen.com',
  openingHours: 'Monday - Friday: 11:00 AM - 10:00 PM\nSaturday - Sunday: 12:00 PM - 11:00 PM',
  logo: 'https://dmenu-five.vercel.app/uploads/logo/logo-default.png',
  banner: 'https://dmenu-five.vercel.app/uploads/banner/banner-1742852302585-interior%20(1).webp',
  featuredImages: [
    'https://dmenu-five.vercel.app/uploads/banner/banner-1742852302585-interior%20(1).webp',
    'https://images.unsplash.com/photo-1555396273-367ea4eb4db5?ixlib=rb-4.0.3&ixid=M3wxMjA3fDB8MHxwaG90by1wYWdlfHx8fGVufDB8fHx8fA%3D%3D&auto=format&fit=crop&w=500&q=80',
    'https://images.unsplash.com/photo-1544148103-0773bf10d330?ixlib=rb-4.0.3&ixid=M3wxMjA3fDB8MHxwaG90by1wYWdlfHx8fGVufDB8fHx8fA%3D%3D&auto=format&fit=crop&w=1470&q=80'
  ],
  cuisine: 'International',
  rating: 4.7,
  description: 'The Gourmet Kitchen offers an exceptional dining experience with a diverse menu of international cuisine. Our chefs use only the freshest ingredients to create memorable dishes that delight the senses.',
  established: 2015,
  owner: 'Jane Smith',
  website: 'https://dmenu-five.vercel.app',
  mapLocation: 'https://maps.google.com/?q=123+Main+Street,+Foodtown,+FT+12345',
  socialMedia: {
    facebook: 'gourmetkitchen',
    instagram: '@thegourmetkitchen',
    twitter: '@gourmet_kitchen'
  },
  features: [
    'Outdoor Seating',
    'Private Dining Room',
    'Vegan Options',
    'Full Bar',
    'Wheelchair Accessible'
  ],
  paymentMethods: ['Cash', 'Credit Card', 'Digital Wallet']
};

// In-memory storage for restaurant info (would be a database in production)
let restaurantData = { ...RESTAURANT_INFO };

// GET handler for fetching restaurant info
export function GET(request) {
  console.log('Restaurant info endpoint called with GET');
  
  // Ensure the banner URL is properly encoded (but not double-encoded)
  const data = { ...restaurantData };
  
  // Create a response with CORS headers for cross-origin requests
  return new Response(
    JSON.stringify(data),
    {
      status: 200,
      headers: {
        'Content-Type': 'application/json',
        'Access-Control-Allow-Origin': '*'
      }
    }
  );
}

// POST handler for updating restaurant info
export async function POST(request) {
  console.log('Restaurant info endpoint called with POST');
  
  try {
    const body = await request.json();
    console.log('Received restaurant info update:', body);
    
    // Update the in-memory restaurant data
    // In a real app, this would update a database
    restaurantData = {
      ...restaurantData,
      ...body
    };
    
    return new Response(
      JSON.stringify({
        success: true,
        message: 'Restaurant information updated successfully',
        data: restaurantData
      }),
      {
        status: 200,
        headers: {
          'Content-Type': 'application/json',
          'Access-Control-Allow-Origin': '*'
        }
      }
    );
  } catch (error) {
    console.error('Error updating restaurant info:', error);
    
    return new Response(
      JSON.stringify({
        success: false,
        message: 'Failed to update restaurant information',
        error: error.message
      }),
      {
        status: 400,
        headers: {
          'Content-Type': 'application/json',
          'Access-Control-Allow-Origin': '*'
        }
      }
    );
  }
} 