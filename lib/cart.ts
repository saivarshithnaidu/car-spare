import { CartItem, SparePart } from './types';

const CART_STORAGE_KEY = 'car_spare_cart';

export function getCart(): CartItem[] {
    if (typeof window === 'undefined') return [];

    const cartData = localStorage.getItem(CART_STORAGE_KEY);
    return cartData ? JSON.parse(cartData) : [];
}

export function saveCart(cart: CartItem[]) {
    if (typeof window === 'undefined') return;
    localStorage.setItem(CART_STORAGE_KEY, JSON.stringify(cart));
}

export function addToCart(sparePart: SparePart, quantity: number = 1) {
    const cart = getCart();
    const existingItemIndex = cart.findIndex(
        (item) => item.spare_part.id === sparePart.id
    );

    if (existingItemIndex > -1) {
        // Update quantity
        cart[existingItemIndex].quantity += quantity;
    } else {
        // Add new item
        cart.push({ spare_part: sparePart, quantity });
    }

    saveCart(cart);
    return cart;
}

export function removeFromCart(sparePartId: string) {
    const cart = getCart();
    const updatedCart = cart.filter((item) => item.spare_part.id !== sparePartId);
    saveCart(updatedCart);
    return updatedCart;
}

export function updateCartItemQuantity(sparePartId: string, quantity: number) {
    const cart = getCart();
    const itemIndex = cart.findIndex((item) => item.spare_part.id === sparePartId);

    if (itemIndex > -1) {
        if (quantity <= 0) {
            return removeFromCart(sparePartId);
        }
        cart[itemIndex].quantity = quantity;
        saveCart(cart);
    }

    return cart;
}

export function clearCart() {
    if (typeof window === 'undefined') return;
    localStorage.removeItem(CART_STORAGE_KEY);
}

export function calculateCartTotal(cart: CartItem[]) {
    const subtotal = cart.reduce(
        (sum, item) => sum + item.spare_part.price * item.quantity,
        0
    );
    const gst = subtotal * 0.18; // 18% GST
    const total = subtotal + gst;

    return { subtotal, gst, total };
}

export function getCartItemCount() {
    const cart = getCart();
    return cart.reduce((sum, item) => sum + item.quantity, 0);
}
