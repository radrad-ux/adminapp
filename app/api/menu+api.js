/**
 * API endpoint for menu
 * This is a compatibility endpoint that redirects to menu-items
 */

// Import menu items data
import { GET as getMenuItems, POST as postMenuItems, PUT as putMenuItems } from './menu-items+api';

// GET handler for menu
export function GET(request) {
  console.log('Menu endpoint called with GET (redirecting to menu-items)');
  return getMenuItems(request);
}

// POST handler for menu
export async function POST(request) {
  console.log('Menu endpoint called with POST (redirecting to menu-items)');
  return postMenuItems(request);
}

// PUT handler for menu
export async function PUT(request) {
  console.log('Menu endpoint called with PUT (redirecting to menu-items)');
  return putMenuItems(request);
} 