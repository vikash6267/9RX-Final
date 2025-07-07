import { CartItem, addToCart as addToCartAction, removeFromCart as removeFromCartAction, updateQuantity as updateQuantityAction, clearCart as clearCartAction,updatePrice } from '../types/cartTypes';

export const addToCart = (item: CartItem) => addToCartAction(item);

export const removeFromCart = (productId: string) => removeFromCartAction(productId);

export const updateQuantity = (productId: string, quantity: number,sizeId: string) => 
  updateQuantityAction({ productId, quantity, sizeId});


export const updateCartPrice = (productId: string, sizeId: string, price: number) => 
  updatePrice({ productId, sizeId, price });

export const clearCart = () => clearCartAction();