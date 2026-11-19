import { useEffect, useMemo, useState } from 'react';
import { CheckCircle2 } from 'lucide-react';
import { CartCheckoutDrawer } from './components/CartCheckoutDrawer.tsx';
import { DishModal } from './components/DishModal.tsx';
import { Footer } from './components/Footer.tsx';
import { Hero } from './components/Hero.tsx';
import { KitchenStory } from './components/KitchenStory.tsx';
import { MenuCatalog } from './components/MenuCatalog.tsx';
import { Navbar } from './components/Navbar.tsx';
import { OrderTrackerModal } from './components/OrderTrackerModal.tsx';
import { MENU_ITEMS } from './data/menu.ts';
import type {
  CartItem,
  CategoryId,
  DietaryTag,
  DishOption,
  FulfillmentType,
  MenuItem,
  OrderRecord,
} from './types/food.ts';

const CART_STORAGE_KEY = 'ember_grain_cart_v1';
const ORDERS_STORAGE_KEY = 'ember_grain_recent_orders_v1';

function buildCartKey(menuItemId: string, selectedOptions: DishOption[], notes: string): string {
  const optionIds = selectedOptions
    .map((o) => o.id)
    .sort()
    .join(',');
  return `${menuItemId}::${optionIds}::${notes.trim().toLowerCase()}`;
}

export default function App() {
  const [menuItems, setMenuItems] = useState<MenuItem[]>(MENU_ITEMS);
  const [activeCategory, setActiveCategory] = useState<CategoryId>('all');
  const [searchQuery, setSearchQuery] = useState('');
  const [activeDietary, setActiveDietary] = useState<DietaryTag[]>([]);
  const [featuredOnly, setFeaturedOnly] = useState(false);

  const [fulfillment, setFulfillment] = useState<FulfillmentType>('delivery');
  const [deliveryAddress, setDeliveryAddress] = useState('');

  const [selectedDish, setSelectedDish] = useState<MenuItem | null>(null);
  const [cartOpen, setCartOpen] = useState(false);
  const [trackerOpen, setTrackerOpen] = useState(false);
  const [trackedOrderId, setTrackedOrderId] = useState<string | null>(null);
  const [toastMessage, setToastMessage] = useState<string | null>(null);

  const [cartItems, setCartItems] = useState<CartItem[]>(() => {
    try {
      const saved = localStorage.getItem(CART_STORAGE_KEY);
      if (saved) {
        const parsed = JSON.parse(saved) as CartItem[];
        if (Array.isArray(parsed)) return parsed;
      }
    } catch {
      // Ignore storage read errors
    }
    return [];
  });

  const [recentOrderIds, setRecentOrderIds] = useState<string[]>(() => {
    try {
      const saved = localStorage.getItem(ORDERS_STORAGE_KEY);
      if (saved) {
        const parsed = JSON.parse(saved) as string[];
        if (Array.isArray(parsed)) return parsed;
      }
    } catch {
      // Ignore storage read errors
    }
    return ['EG-1041'];
  });

  // Sync menu from Express API on mount while preserving immediate initial render
  useEffect(() => {
    fetch('/api/menu')
      .then((res) => (res.ok ? res.json() : null))
      .then((data: { items?: MenuItem[] } | null) => {
        if (data?.items && Array.isArray(data.items) && data.items.length > 0) {
          setMenuItems(data.items);
        }
      })
      .catch(() => {
        // Keep bundled catalog if offline
      });
  }, []);

  useEffect(() => {
    try {
      localStorage.setItem(CART_STORAGE_KEY, JSON.stringify(cartItems));
    } catch {
      // Ignore storage quota errors
    }
  }, [cartItems]);

  useEffect(() => {
    try {
      localStorage.setItem(ORDERS_STORAGE_KEY, JSON.stringify(recentOrderIds));
    } catch {
      // Ignore storage quota errors
    }
  }, [recentOrderIds]);

  useEffect(() => {
    if (!toastMessage) return;
    const t = window.setTimeout(() => setToastMessage(null), 2600);
    return () => window.clearTimeout(t);
  }, [toastMessage]);

  const filteredItems = useMemo(() => {
    const q = searchQuery.trim().toLowerCase();
    return menuItems.filter((item) => {
      if (activeCategory !== 'all' && item.category !== activeCategory) return false;
      if (featuredOnly && !item.featured) return false;
      if (activeDietary.length > 0) {
        const matchesAll = activeDietary.every((tag) => item.dietary.includes(tag));
        if (!matchesAll) return false;
      }
      if (q) {
        const haystack = `${item.name} ${item.description} ${item.ingredients} ${item.categoryLabel}`.toLowerCase();
        if (!haystack.includes(q)) return false;
      }
      return true;
    });
  }, [menuItems, activeCategory, featuredOnly, activeDietary, searchQuery]);

  const addToCart = (
    item: MenuItem,
    selectedOptions: DishOption[],
    quantity: number,
    specialInstructions: string,
  ) => {
    const cartKey = buildCartKey(item.id, selectedOptions, specialInstructions);
    const optionsDelta = selectedOptions.reduce((sum, o) => sum + o.priceDelta, 0);
    const unitPrice = Math.round((item.price + optionsDelta) * 100) / 100;

    setCartItems((prev) => {
      const existing = prev.find((c) => c.cartKey === cartKey);
      if (existing) {
        return prev.map((c) =>
          c.cartKey === cartKey ? { ...c, quantity: Math.min(20, c.quantity + quantity) } : c,
        );
      }
      return [
        ...prev,
        {
          cartKey,
          menuItemId: item.id,
          name: item.name,
          image: item.image,
          basePrice: item.price,
          quantity,
          selectedOptions,
          specialInstructions,
          unitPrice,
        },
      ];
    });

    setToastMessage(`Added ${quantity}x ${item.name} to bag`);
  };

  const handleQuickAdd = (item: MenuItem) => {
    const defaultOptions: DishOption[] = [];
    for (const group of item.optionGroups) {
      if (group.type === 'single' && group.options.length > 0) {
        defaultOptions.push(group.options[0]);
      }
    }
    addToCart(item, defaultOptions, 1, '');
  };

  const handleUpdateCartQuantity = (cartKey: string, delta: number) => {
    setCartItems((prev) =>
      prev
        .map((c) => (c.cartKey === cartKey ? { ...c, quantity: c.quantity + delta } : c))
        .filter((c) => c.quantity > 0),
    );
  };

  const handleRemoveCartItem = (cartKey: string) => {
    setCartItems((prev) => prev.filter((c) => c.cartKey !== cartKey));
  };

  const handleToggleDietary = (tag: DietaryTag) => {
    setActiveDietary((prev) =>
      prev.includes(tag) ? prev.filter((t) => t !== tag) : [...prev, tag],
    );
  };

  const handleResetFilters = () => {
    setActiveCategory('all');
    setSearchQuery('');
    setActiveDietary([]);
    setFeaturedOnly(false);
  };

  const handleSelectSpecials = () => {
    setActiveCategory('all');
    setSearchQuery('');
    setActiveDietary([]);
    setFeaturedOnly(true);
    document.getElementById('menu')?.scrollIntoView({ behavior: 'smooth' });
  };

  const handleOrderCreated = (order: OrderRecord) => {
    setRecentOrderIds((prev) => [order.id, ...prev.filter((id) => id !== order.id)]);
    setTrackedOrderId(order.id);
  };

  const handleOpenTracker = (orderId?: string) => {
    if (orderId) {
      setTrackedOrderId(orderId);
    }
    setTrackerOpen(true);
  };

  const cartCount = cartItems.reduce((sum, item) => sum + item.quantity, 0);
  const cartSubtotal = cartItems.reduce((sum, item) => sum + item.unitPrice * item.quantity, 0);

  return (
    <div className="min-h-screen flex flex-col bg-[#FAFAFA] text-[#18181B]">
      <Navbar
        cartCount={cartCount}
        cartSubtotal={cartSubtotal}
        onOpenCart={() => setCartOpen(true)}
        onOpenTracker={() => handleOpenTracker()}
      />

      <main className="flex-1">
        <Hero
          fulfillment={fulfillment}
          onChangeFulfillment={setFulfillment}
          deliveryAddress={deliveryAddress}
          onChangeDeliveryAddress={setDeliveryAddress}
          onSelectSpecials={handleSelectSpecials}
        />

        <MenuCatalog
          items={filteredItems}
          activeCategory={activeCategory}
          onSelectCategory={setActiveCategory}
          searchQuery={searchQuery}
          onChangeSearch={setSearchQuery}
          activeDietary={activeDietary}
          onToggleDietary={handleToggleDietary}
          featuredOnly={featuredOnly}
          onToggleFeaturedOnly={() => setFeaturedOnly((prev) => !prev)}
          onResetFilters={handleResetFilters}
          onOpenDish={(dish) => setSelectedDish(dish)}
          onQuickAdd={handleQuickAdd}
          cartItems={cartItems}
          onUpdateCartQuantity={handleUpdateCartQuantity}
        />

        <KitchenStory />
      </main>

      <Footer
        onOpenTracker={() => handleOpenTracker()}
        onOpenCart={() => setCartOpen(true)}
      />

      {/* Dish Customization Modal */}
      <DishModal
        item={selectedDish}
        onClose={() => setSelectedDish(null)}
        onAddToCart={addToCart}
      />

      {/* Slide-Over Cart & Checkout Drawer */}
      <CartCheckoutDrawer
        isOpen={cartOpen}
        onClose={() => setCartOpen(false)}
        cartItems={cartItems}
        onUpdateQuantity={handleUpdateCartQuantity}
        onRemoveItem={handleRemoveCartItem}
        onQuickAdd={handleQuickAdd}
        onClearCart={() => setCartItems([])}
        fulfillment={fulfillment}
        onChangeFulfillment={setFulfillment}
        deliveryAddress={deliveryAddress}
        onChangeDeliveryAddress={setDeliveryAddress}
        onOrderCreated={handleOrderCreated}
        onTrackOrder={(orderId) => handleOpenTracker(orderId)}
      />

      {/* Live Order Tracker Modal */}
      <OrderTrackerModal
        isOpen={trackerOpen}
        onClose={() => setTrackerOpen(false)}
        initialOrderId={trackedOrderId}
        recentOrderIds={recentOrderIds}
      />

      {/* Non-intrusive Add-to-Bag Feedback Toast */}
      {toastMessage && (
        <div
          role="status"
          aria-live="polite"
          className="fixed bottom-5 right-5 z-40 flex items-center gap-3 px-4 py-3 bg-[#18181B] text-white text-sm rounded-xl shadow-lg border border-white/10"
        >
          <CheckCircle2 className="w-4 h-4 text-[#34D399] shrink-0" aria-hidden="true" />
          <span>{toastMessage}</span>
          <button
            type="button"
            onClick={() => {
              setToastMessage(null);
              setCartOpen(true);
            }}
            className="text-xs font-semibold text-[#34D399] hover:underline underline-offset-4 whitespace-nowrap cursor-pointer ml-1"
          >
            View Bag
          </button>
        </div>
      )}
    </div>
  );
}
