export type CategoryId =
  | 'all'
  | 'flatbreads'
  | 'bowls'
  | 'pasta'
  | 'sides-drinks';

export type DietaryTag = 'Vegetarian' | 'Gluten-Free Option' | 'Spicy';

export interface DishOption {
  id: string;
  label: string;
  priceDelta: number;
}

export interface DishOptionGroup {
  id: string;
  title: string;
  required: boolean;
  type: 'single' | 'multiple';
  options: DishOption[];
}

export interface MenuItem {
  id: string;
  name: string;
  category: Exclude<CategoryId, 'all'>;
  categoryLabel: string;
  price: number;
  prepMinutes: number;
  calories: number;
  description: string;
  ingredients: string;
  allergens: string;
  tag?: string;
  dietary: DietaryTag[];
  image: string;
  featured: boolean;
  optionGroups: DishOptionGroup[];
}

export interface CartItem {
  cartKey: string;
  menuItemId: string;
  name: string;
  image: string;
  basePrice: number;
  quantity: number;
  selectedOptions: DishOption[];
  specialInstructions: string;
  unitPrice: number;
}

export type FulfillmentType = 'delivery' | 'pickup';

export type PaymentMethod = 'card' | 'apple_pay' | 'cash';

export type OrderStage =
  | 'confirmed'
  | 'preparing'
  | 'out_for_delivery'
  | 'ready_for_pickup'
  | 'completed';

export interface OrderItemSummary {
  menuItemId: string;
  name: string;
  quantity: number;
  unitPrice: number;
  lineTotal: number;
  optionsSummary: string[];
  specialInstructions?: string;
}

export interface OrderRecord {
  id: string;
  createdAt: string;
  fulfillment: FulfillmentType;
  scheduledTime: string;
  customer: {
    name: string;
    phone: string;
    email: string;
    address?: string;
    apt?: string;
    deliveryNotes?: string;
  };
  paymentMethod: PaymentMethod;
  items: OrderItemSummary[];
  subtotal: number;
  discount: number;
  promoCode?: string;
  deliveryFee: number;
  tax: number;
  tip: number;
  total: number;
  stage: OrderStage;
  estimatedMinutes: number;
  stageUpdatedAt: string;
}

export interface PromoResult {
  valid: boolean;
  code: string;
  message: string;
  discountAmount: number;
  freeDelivery: boolean;
}
