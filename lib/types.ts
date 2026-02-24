// Database Types
export interface User {
  id: string;
  email: string;
  role: 'customer' | 'admin';
  phone?: string;
  created_at: string;
}

export interface SparePart {
  id: string;
  name: string;
  description: string;
  car_model: string;
  price: number;
  stock_quantity: number;
  image_url: string;
  created_at: string;
}

export interface Order {
  id: string;
  user_id: string;
  total_amount: number;
  payment_status: 'pending' | 'paid' | 'failed';
  order_status: 'booked' | 'confirmed' | 'processing' | 'shipped' | 'delivered' | 'cancelled';
  invoice_url?: string;
  razorpay_order_id?: string;
  razorpay_payment_id?: string;
  created_at: string;
}

export interface OrderItem {
  id: string;
  order_id: string;
  spare_part_id: string;
  quantity: number;
  price: number;
  spare_part?: SparePart;
}

export interface KhatabookEntry {
  id: string;
  customer_id: string;
  order_id: string;
  total_amount: number;
  paid_amount: number;
  pending_amount: number;
  due_date: string;
  status: 'pending' | 'paid' | 'overdue';
}

export interface Ad {
  id: string;
  title: string;
  image_url: string;
  redirect_url: string;
  active: boolean;
}

// Cart Types
export interface CartItem {
  spare_part: SparePart;
  quantity: number;
}

export interface Cart {
  items: CartItem[];
  total: number;
}

// Razorpay Types
export interface RazorpayOrder {
  id: string;
  amount: number;
  currency: string;
}

export interface RazorpayResponse {
  razorpay_order_id: string;
  razorpay_payment_id: string;
  razorpay_signature: string;
}
