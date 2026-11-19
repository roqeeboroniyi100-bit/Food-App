import { useEffect, useState } from 'react';
import {
  AlertCircle,
  ArrowLeft,
  CheckCircle2,
  CreditCard,
  Minus,
  Plus,
  ShoppingBag,
  Trash2,
  X,
} from 'lucide-react';
import { MENU_ITEMS } from '../data/menu.ts';
import type {
  CartItem,
  FulfillmentType,
  MenuItem,
  OrderRecord,
  PaymentMethod,
  PromoResult,
} from '../types/food.ts';
import { SafeImage } from './SafeImage.tsx';

interface CartCheckoutDrawerProps {
  isOpen: boolean;
  onClose: () => void;
  cartItems: CartItem[];
  onUpdateQuantity: (cartKey: string, delta: number) => void;
  onRemoveItem: (cartKey: string) => void;
  onQuickAdd: (item: MenuItem) => void;
  onClearCart: () => void;
  fulfillment: FulfillmentType;
  onChangeFulfillment: (mode: FulfillmentType) => void;
  deliveryAddress: string;
  onChangeDeliveryAddress: (addr: string) => void;
  onOrderCreated: (order: OrderRecord) => void;
  onTrackOrder: (orderId: string) => void;
}

const DELIVERY_FEE = 4.99;
const FREE_DELIVERY_THRESHOLD = 35;
const TAX_RATE = 0.085;
const TIP_OPTIONS = [0, 10, 15, 20];

const TIME_SLOTS_DELIVERY = [
  'ASAP (25–35 min)',
  'Today, 12:30 PM',
  'Today, 1:30 PM',
  'Tonight, 6:30 PM',
  'Tonight, 7:30 PM',
];

const TIME_SLOTS_PICKUP = [
  'ASAP (15–20 min)',
  'Today, 12:15 PM',
  'Today, 1:00 PM',
  'Tonight, 6:15 PM',
  'Tonight, 7:15 PM',
];

export function CartCheckoutDrawer({
  isOpen,
  onClose,
  cartItems,
  onUpdateQuantity,
  onRemoveItem,
  onQuickAdd,
  onClearCart,
  fulfillment,
  onChangeFulfillment,
  deliveryAddress,
  onChangeDeliveryAddress,
  onOrderCreated,
  onTrackOrder,
}: CartCheckoutDrawerProps) {
  const [step, setStep] = useState<'bag' | 'checkout' | 'confirmed'>('bag');
  const [scheduledTime, setScheduledTime] = useState('ASAP (25–35 min)');
  const [promoInput, setPromoInput] = useState('');
  const [appliedPromo, setAppliedPromo] = useState<PromoResult | null>(null);
  const [promoLoading, setPromoLoading] = useState(false);
  const [tipPercent, setTipPercent] = useState(15);

  // Checkout customer fields
  const [customerName, setCustomerName] = useState('');
  const [customerPhone, setCustomerPhone] = useState('');
  const [customerEmail, setCustomerEmail] = useState('');
  const [apt, setApt] = useState('');
  const [deliveryNotes, setDeliveryNotes] = useState('');
  const [paymentMethod, setPaymentMethod] = useState<PaymentMethod>('card');

  const [submitting, setSubmitting] = useState(false);
  const [submitError, setSubmitError] = useState<string | null>(null);
  const [confirmedOrder, setConfirmedOrder] = useState<OrderRecord | null>(null);

  useEffect(() => {
    setScheduledTime(fulfillment === 'delivery' ? TIME_SLOTS_DELIVERY[0] : TIME_SLOTS_PICKUP[0]);
  }, [fulfillment]);

  useEffect(() => {
    if (!isOpen) return;
    const onKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') onClose();
    };
    window.addEventListener('keydown', onKeyDown);
    return () => window.removeEventListener('keydown', onKeyDown);
  }, [isOpen, onClose]);

  useEffect(() => {
    if (isOpen && step === 'confirmed' && cartItems.length > 0) {
      setStep('bag');
      setConfirmedOrder(null);
    }
  }, [isOpen, step, cartItems.length]);

  const subtotal = cartItems.reduce((sum, item) => sum + item.unitPrice * item.quantity, 0);

  // Re-evaluate local discount if promo is active and subtotal changes
  let discount = 0;
  let freeDeliveryFromPromo = false;
  if (appliedPromo?.valid) {
    if (appliedPromo.code === 'WELCOME10') {
      discount = Math.round(subtotal * 0.1 * 100) / 100;
    } else if (appliedPromo.code === 'HEARTH15' && subtotal >= 45) {
      discount = Math.round(subtotal * 0.15 * 100) / 100;
    } else if (appliedPromo.code === 'FREESHIP') {
      freeDeliveryFromPromo = true;
    }
  }

  const discountedSubtotal = Math.max(0, subtotal - discount);
  const qualifiesFreeDelivery =
    fulfillment === 'pickup' || subtotal >= FREE_DELIVERY_THRESHOLD || freeDeliveryFromPromo;
  const deliveryFee = cartItems.length === 0 || qualifiesFreeDelivery ? 0 : DELIVERY_FEE;
  const tax = Math.round(discountedSubtotal * TAX_RATE * 100) / 100;
  const tip = Math.round(subtotal * (tipPercent / 100) * 100) / 100;
  const total = discountedSubtotal + deliveryFee + tax + tip;

  const amountToFreeDelivery = Math.max(0, FREE_DELIVERY_THRESHOLD - subtotal);
  const freeDeliveryProgress = Math.min(100, (subtotal / FREE_DELIVERY_THRESHOLD) * 100);

  // Suggest up to 2 pairings not yet in bag
  const inBagIds = new Set(cartItems.map((i) => i.menuItemId));
  const pairings = MENU_ITEMS.filter(
    (m) =>
      (m.id === 'blood-orange-spritz' || m.id === 'basque-vanilla-cheesecake' || m.id === 'charred-cauliflower') &&
      !inBagIds.has(m.id),
  ).slice(0, 2);

  const handleApplyPromo = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!promoInput.trim()) return;
    setPromoLoading(true);
    try {
      const res = await fetch('/api/promo/validate', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ code: promoInput.trim(), subtotal }),
      });
      const data = (await res.json()) as PromoResult;
      setAppliedPromo(data);
    } catch {
      setAppliedPromo({
        valid: false,
        code: promoInput.trim().toUpperCase(),
        message: 'Could not verify code right now. Please try again.',
        discountAmount: 0,
        freeDelivery: false,
      });
    } finally {
      setPromoLoading(false);
    }
  };

  const handleSubmitOrder = async (e: React.FormEvent) => {
    e.preventDefault();
    setSubmitError(null);

    if (!customerName.trim() || !customerPhone.trim() || !customerEmail.trim()) {
      setSubmitError('Please fill in your name, phone number, and email address.');
      return;
    }

    if (fulfillment === 'delivery' && !deliveryAddress.trim()) {
      setSubmitError('Please enter a delivery street address.');
      return;
    }

    setSubmitting(true);
    try {
      const res = await fetch('/api/orders', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          fulfillment,
          scheduledTime,
          customer: {
            name: customerName.trim(),
            phone: customerPhone.trim(),
            email: customerEmail.trim(),
            address: fulfillment === 'delivery' ? deliveryAddress.trim() : undefined,
            apt: fulfillment === 'delivery' ? apt.trim() : undefined,
            deliveryNotes: deliveryNotes.trim() || undefined,
          },
          paymentMethod,
          promoCode: appliedPromo?.valid ? appliedPromo.code : undefined,
          tipPercent,
          items: cartItems.map((item) => ({
            menuItemId: item.menuItemId,
            quantity: item.quantity,
            selectedOptionIds: item.selectedOptions.map((o) => o.id),
            specialInstructions: item.specialInstructions || undefined,
          })),
        }),
      });

      const data = (await res.json()) as { order?: OrderRecord; error?: string };
      if (!res.ok || !data.order) {
        setSubmitError(data.error || 'Unable to place your order. Please check your details.');
        return;
      }

      setConfirmedOrder(data.order);
      onOrderCreated(data.order);
      onClearCart();
      setAppliedPromo(null);
      setPromoInput('');
      setStep('confirmed');
    } catch {
      setSubmitError('Network error while submitting your order. Please try again.');
    } finally {
      setSubmitting(false);
    }
  };

  if (!isOpen) return null;

  const timeSlots = fulfillment === 'delivery' ? TIME_SLOTS_DELIVERY : TIME_SLOTS_PICKUP;

  return (
    <div
      role="dialog"
      aria-modal="true"
      aria-label="Your order bag and checkout"
      className="fixed inset-0 z-50 flex justify-end bg-black/45 backdrop-blur-[2px]"
      onClick={onClose}
    >
      <div
        className="w-full max-w-lg bg-white h-full flex flex-col border-l border-[#E4E4E7] shadow-2xl"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Drawer Header */}
        <div className="px-6 py-4 border-b border-[#E4E4E7] flex items-center justify-between gap-4 shrink-0">
          <div className="flex items-center gap-3">
            {step === 'checkout' && (
              <button
                type="button"
                onClick={() => {
                  setSubmitError(null);
                  setStep('bag');
                }}
                aria-label="Back to bag"
                className="p-1.5 -ml-1.5 rounded-lg text-[#52525B] hover:text-[#18181B] hover:bg-[#F4F4F5] cursor-pointer"
              >
                <ArrowLeft className="w-4 h-4" />
              </button>
            )}
            <h2 className="font-display text-xl font-semibold text-[#18181B]">
              {step === 'bag'
                ? 'Your Order Bag'
                : step === 'checkout'
                  ? 'Delivery & Payment'
                  : 'Order Confirmed'}
            </h2>
          </div>

          <button
            type="button"
            onClick={onClose}
            aria-label="Close bag drawer"
            className="p-2 rounded-lg text-[#52525B] hover:text-[#18181B] hover:bg-[#F4F4F5] cursor-pointer"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Step 1: Bag Review */}
        {step === 'bag' && (
          <>
            {cartItems.length === 0 ? (
              <div className="flex-1 flex flex-col items-center justify-center p-8 text-center">
                <div className="w-14 h-14 rounded-full bg-[#F4F4F5] flex items-center justify-center mb-4">
                  <ShoppingBag className="w-6 h-6 text-[#71717A]" aria-hidden="true" />
                </div>
                <h3 className="font-display text-xl font-semibold text-[#18181B]">
                  Your bag is empty
                </h3>
                <p className="mt-2 text-sm text-[#52525B] max-w-xs">
                  Add wood-fired flatbreads, harvest bowls, or handmade pasta from today&apos;s
                  menu to get started.
                </p>
                <button
                  type="button"
                  onClick={onClose}
                  className="mt-6 px-5 py-2.5 text-sm font-semibold text-white bg-[#065F46] hover:bg-[#047857] rounded-lg transition-colors cursor-pointer"
                >
                  Browse Menu
                </button>
              </div>
            ) : (
              <>
                <div className="flex-1 overflow-y-auto px-6 py-5 space-y-6">
                  {/* Fulfillment & Time Selector */}
                  <div className="bg-[#FAFAFA] border border-[#E4E4E7] rounded-xl p-4 space-y-3">
                    <div className="flex items-center justify-between gap-3">
                      <div className="inline-flex p-1 bg-[#E4E4E7]/60 rounded-lg">
                        <button
                          type="button"
                          onClick={() => onChangeFulfillment('delivery')}
                          className={`px-3 py-1.5 text-xs font-semibold rounded-md transition-colors cursor-pointer ${
                            fulfillment === 'delivery'
                              ? 'bg-white text-[#18181B] shadow-xs'
                              : 'text-[#52525B] hover:text-[#18181B]'
                          }`}
                        >
                          Delivery
                        </button>
                        <button
                          type="button"
                          onClick={() => onChangeFulfillment('pickup')}
                          className={`px-3 py-1.5 text-xs font-semibold rounded-md transition-colors cursor-pointer ${
                            fulfillment === 'pickup'
                              ? 'bg-white text-[#18181B] shadow-xs'
                              : 'text-[#52525B] hover:text-[#18181B]'
                          }`}
                        >
                          Pickup
                        </button>
                      </div>

                      <select
                        aria-label="Select scheduled time"
                        value={scheduledTime}
                        onChange={(e) => setScheduledTime(e.target.value)}
                        className="text-xs font-medium text-[#18181B] bg-white border border-[#E4E4E7] rounded-lg px-2.5 py-2 outline-none focus:border-[#065F46]"
                      >
                        {timeSlots.map((slot) => (
                          <option key={slot} value={slot}>
                            {slot}
                          </option>
                        ))}
                      </select>
                    </div>

                    {fulfillment === 'delivery' && (
                      <div>
                        <div className="flex items-center justify-between text-xs text-[#52525B] mb-1.5">
                          <span>
                            {amountToFreeDelivery > 0
                              ? `Add $${amountToFreeDelivery.toFixed(2)} more for free delivery`
                              : 'You unlocked free local delivery'}
                          </span>
                          <span className="tabular-nums font-medium">
                            ${Math.min(subtotal, FREE_DELIVERY_THRESHOLD).toFixed(2)} / $35.00
                          </span>
                        </div>
                        <div className="h-1.5 bg-[#E4E4E7] rounded-full overflow-hidden">
                          <div
                            className="h-full bg-[#065F46] transition-all duration-300"
                            style={{ width: `${freeDeliveryProgress}%` }}
                          />
                        </div>
                      </div>
                    )}
                  </div>

                  {/* Line Items */}
                  <ul className="divide-y divide-[#E4E4E7]">
                    {cartItems.map((item) => (
                      <li key={item.cartKey} className="py-4 first:pt-0 flex gap-4">
                        <div className="w-20 h-16 rounded-lg overflow-hidden bg-[#F4F4F5] shrink-0 border border-[#E4E4E7]">
                          <SafeImage
                            src={item.image}
                            alt={item.name}
                            className="w-full h-full object-cover"
                          />
                        </div>

                        <div className="flex-1 min-w-0">
                          <div className="flex items-start justify-between gap-2">
                            <h3 className="font-sans text-sm font-semibold text-[#18181B] leading-snug">
                              {item.name}
                            </h3>
                            <span className="text-sm font-semibold text-[#18181B] tabular-nums shrink-0">
                              ${(item.unitPrice * item.quantity).toFixed(2)}
                            </span>
                          </div>

                          {item.selectedOptions.length > 0 && (
                            <p className="mt-1 text-xs text-[#52525B]">
                              {item.selectedOptions.map((o) => o.label).join(' · ')}
                            </p>
                          )}

                          {item.specialInstructions && (
                            <p className="mt-1 text-xs text-[#71717A] italic">
                              Note: {item.specialInstructions}
                            </p>
                          )}

                          <div className="mt-2.5 flex items-center justify-between">
                            <div className="inline-flex items-center border border-[#E4E4E7] rounded-lg bg-[#FAFAFA]">
                              <button
                                type="button"
                                onClick={() => onUpdateQuantity(item.cartKey, -1)}
                                aria-label={`Decrease quantity of ${item.name}`}
                                className="p-1.5 text-[#18181B] hover:bg-[#E4E4E7]/60 rounded-l-lg cursor-pointer"
                              >
                                <Minus className="w-3.5 h-3.5" />
                              </button>
                              <span className="px-2.5 text-xs font-semibold tabular-nums">
                                {item.quantity}
                              </span>
                              <button
                                type="button"
                                onClick={() => onUpdateQuantity(item.cartKey, 1)}
                                aria-label={`Increase quantity of ${item.name}`}
                                className="p-1.5 text-[#18181B] hover:bg-[#E4E4E7]/60 rounded-r-lg cursor-pointer"
                              >
                                <Plus className="w-3.5 h-3.5" />
                              </button>
                            </div>

                            <button
                              type="button"
                              onClick={() => onRemoveItem(item.cartKey)}
                              aria-label={`Remove ${item.name} from bag`}
                              className="p-1.5 text-[#71717A] hover:text-[#DC2626] transition-colors cursor-pointer"
                            >
                              <Trash2 className="w-4 h-4" />
                            </button>
                          </div>
                        </div>
                      </li>
                    ))}
                  </ul>

                  {/* Suggested Pairings */}
                  {pairings.length > 0 && (
                    <div className="pt-4 border-t border-[#E4E4E7]">
                      <p className="text-xs font-semibold uppercase tracking-wider text-[#71717A] mb-3">
                        Pair With Your Order
                      </p>
                      <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                        {pairings.map((pair) => (
                          <div
                            key={pair.id}
                            className="flex items-center gap-3 p-2.5 bg-[#FAFAFA] border border-[#E4E4E7] rounded-lg"
                          >
                            <div className="w-12 h-12 rounded-md overflow-hidden shrink-0 bg-[#F4F4F5]">
                              <SafeImage
                                src={pair.image}
                                alt={pair.name}
                                className="w-full h-full object-cover"
                              />
                            </div>
                            <div className="flex-1 min-w-0">
                              <p className="text-xs font-semibold text-[#18181B] truncate">
                                {pair.name}
                              </p>
                              <p className="text-xs text-[#52525B] tabular-nums">
                                ${pair.price.toFixed(2)}
                              </p>
                            </div>
                            <button
                              type="button"
                              onClick={() => onQuickAdd(pair)}
                              aria-label={`Add ${pair.name}`}
                              className="p-2 rounded-md bg-white border border-[#E4E4E7] hover:border-[#065F46] text-[#065F46] cursor-pointer shrink-0"
                            >
                              <Plus className="w-3.5 h-3.5" />
                            </button>
                          </div>
                        ))}
                      </div>
                    </div>
                  )}

                  {/* Promo Code */}
                  <div className="pt-4 border-t border-[#E4E4E7]">
                    <form onSubmit={handleApplyPromo} className="flex gap-2">
                      <input
                        type="text"
                        value={promoInput}
                        onChange={(e) => setPromoInput(e.target.value)}
                        placeholder="Promo code (e.g. WELCOME10)"
                        aria-label="Promo code"
                        className="flex-1 px-3.5 py-2 text-sm bg-[#FAFAFA] border border-[#E4E4E7] rounded-lg text-[#18181B] placeholder:text-[#71717A] focus:bg-white focus:border-[#065F46] outline-none uppercase"
                      />
                      <button
                        type="submit"
                        disabled={promoLoading}
                        className="px-4 py-2 text-xs font-semibold text-[#18181B] bg-[#F4F4F5] hover:bg-[#E4E4E7] rounded-lg transition-colors whitespace-nowrap cursor-pointer disabled:opacity-60"
                      >
                        {promoLoading ? 'Checking...' : 'Apply'}
                      </button>
                    </form>
                    {appliedPromo && (
                      <div
                        className={`mt-2 flex items-center gap-1.5 text-xs ${
                          appliedPromo.valid ? 'text-[#065F46]' : 'text-[#B91C1C]'
                        }`}
                      >
                        {appliedPromo.valid ? (
                          <CheckCircle2 className="w-3.5 h-3.5 shrink-0" aria-hidden="true" />
                        ) : (
                          <AlertCircle className="w-3.5 h-3.5 shrink-0" aria-hidden="true" />
                        )}
                        <span>{appliedPromo.message}</span>
                      </div>
                    )}
                  </div>

                  {/* Tip Selector */}
                  <div className="pt-4 border-t border-[#E4E4E7]">
                    <div className="flex items-center justify-between mb-2">
                      <span className="text-xs font-semibold text-[#18181B]">
                        Kitchen &amp; Courier Tip
                      </span>
                      <span className="text-xs text-[#52525B] tabular-nums">
                        ${tip.toFixed(2)}
                      </span>
                    </div>
                    <div className="grid grid-cols-4 gap-2">
                      {TIP_OPTIONS.map((pct) => (
                        <button
                          key={pct}
                          type="button"
                          onClick={() => setTipPercent(pct)}
                          className={`py-2 text-xs font-semibold rounded-lg border transition-colors tabular-nums cursor-pointer ${
                            tipPercent === pct
                              ? 'bg-[#18181B] text-white border-[#18181B]'
                              : 'bg-white text-[#52525B] border-[#E4E4E7] hover:border-[#A1A1AA]'
                          }`}
                        >
                          {pct === 0 ? 'No Tip' : `${pct}%`}
                        </button>
                      ))}
                    </div>
                  </div>
                </div>

                {/* Bag Footer Totals */}
                <div className="px-6 py-5 border-t border-[#E4E4E7] bg-[#FAFAFA] space-y-2 shrink-0">
                  <div className="flex justify-between text-xs text-[#52525B]">
                    <span>Subtotal</span>
                    <span className="tabular-nums">${subtotal.toFixed(2)}</span>
                  </div>
                  {discount > 0 && (
                    <div className="flex justify-between text-xs text-[#065F46] font-medium">
                      <span>Promo ({appliedPromo?.code})</span>
                      <span className="tabular-nums">-${discount.toFixed(2)}</span>
                    </div>
                  )}
                  <div className="flex justify-between text-xs text-[#52525B]">
                    <span>{fulfillment === 'pickup' ? 'Pickup Fee' : 'Delivery Fee'}</span>
                    <span className="tabular-nums">
                      {deliveryFee === 0 ? 'Free' : `$${deliveryFee.toFixed(2)}`}
                    </span>
                  </div>
                  <div className="flex justify-between text-xs text-[#52525B]">
                    <span>Estimated Tax (8.5%)</span>
                    <span className="tabular-nums">${tax.toFixed(2)}</span>
                  </div>
                  <div className="flex justify-between text-xs text-[#52525B]">
                    <span>Tip ({tipPercent}%)</span>
                    <span className="tabular-nums">${tip.toFixed(2)}</span>
                  </div>
                  <div className="pt-2 border-t border-[#E4E4E7] flex justify-between text-base font-semibold text-[#18181B]">
                    <span>Total</span>
                    <span className="tabular-nums">${total.toFixed(2)}</span>
                  </div>

                  <button
                    type="button"
                    onClick={() => setStep('checkout')}
                    className="mt-3 w-full py-3.5 px-5 text-sm font-semibold text-white bg-[#065F46] hover:bg-[#047857] rounded-lg transition-colors tabular-nums cursor-pointer min-h-[46px]"
                  >
                    Continue to Checkout — ${total.toFixed(2)}
                  </button>
                </div>
              </>
            )}
          </>
        )}

        {/* Step 2: Checkout Form */}
        {step === 'checkout' && (
          <form onSubmit={handleSubmitOrder} className="flex-1 flex flex-col overflow-hidden">
            <div className="flex-1 overflow-y-auto px-6 py-5 space-y-5">
              {submitError && (
                <div
                  role="alert"
                  className="flex items-start gap-2.5 p-3.5 rounded-lg bg-[#FEF2F2] border border-[#FECACA] text-xs text-[#B91C1C]"
                >
                  <AlertCircle className="w-4 h-4 shrink-0 mt-0.5" aria-hidden="true" />
                  <span>{submitError}</span>
                </div>
              )}

              <div>
                <h3 className="font-sans text-sm font-semibold text-[#18181B] mb-3">
                  Contact Information
                </h3>
                <div className="space-y-3">
                  <div>
                    <label htmlFor="chk-name" className="block text-xs font-medium text-[#52525B] mb-1">
                      Full Name
                    </label>
                    <input
                      id="chk-name"
                      type="text"
                      required
                      value={customerName}
                      onChange={(e) => setCustomerName(e.target.value)}
                      placeholder="Jordan Rivera"
                      className="w-full px-3.5 py-2.5 text-sm bg-white border border-[#E4E4E7] rounded-lg focus:border-[#065F46] outline-none"
                    />
                  </div>
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                    <div>
                      <label htmlFor="chk-phone" className="block text-xs font-medium text-[#52525B] mb-1">
                        Phone Number
                      </label>
                      <input
                        id="chk-phone"
                        type="tel"
                        required
                        value={customerPhone}
                        onChange={(e) => setCustomerPhone(e.target.value)}
                        placeholder="(415) 555-0148"
                        className="w-full px-3.5 py-2.5 text-sm bg-white border border-[#E4E4E7] rounded-lg focus:border-[#065F46] outline-none"
                      />
                    </div>
                    <div>
                      <label htmlFor="chk-email" className="block text-xs font-medium text-[#52525B] mb-1">
                        Email for Receipt
                      </label>
                      <input
                        id="chk-email"
                        type="email"
                        required
                        value={customerEmail}
                        onChange={(e) => setCustomerEmail(e.target.value)}
                        placeholder="jordan@example.com"
                        className="w-full px-3.5 py-2.5 text-sm bg-white border border-[#E4E4E7] rounded-lg focus:border-[#065F46] outline-none"
                      />
                    </div>
                  </div>
                </div>
              </div>

              {fulfillment === 'delivery' ? (
                <div className="pt-4 border-t border-[#E4E4E7]">
                  <h3 className="font-sans text-sm font-semibold text-[#18181B] mb-3">
                    Delivery Address · {scheduledTime}
                  </h3>
                  <div className="space-y-3">
                    <div>
                      <label htmlFor="chk-address" className="block text-xs font-medium text-[#52525B] mb-1">
                        Street Address
                      </label>
                      <input
                        id="chk-address"
                        type="text"
                        required
                        value={deliveryAddress}
                        onChange={(e) => onChangeDeliveryAddress(e.target.value)}
                        placeholder="742 Valencia St, San Francisco, CA"
                        className="w-full px-3.5 py-2.5 text-sm bg-white border border-[#E4E4E7] rounded-lg focus:border-[#065F46] outline-none"
                      />
                    </div>
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                      <div>
                        <label htmlFor="chk-apt" className="block text-xs font-medium text-[#52525B] mb-1">
                          Apt / Suite / Floor
                        </label>
                        <input
                          id="chk-apt"
                          type="text"
                          value={apt}
                          onChange={(e) => setApt(e.target.value)}
                          placeholder="Apt 4B"
                          className="w-full px-3.5 py-2.5 text-sm bg-white border border-[#E4E4E7] rounded-lg focus:border-[#065F46] outline-none"
                        />
                      </div>
                      <div>
                        <label htmlFor="chk-notes" className="block text-xs font-medium text-[#52525B] mb-1">
                          Drop-off Instructions
                        </label>
                        <input
                          id="chk-notes"
                          type="text"
                          value={deliveryNotes}
                          onChange={(e) => setDeliveryNotes(e.target.value)}
                          placeholder="Leave at front porch"
                          className="w-full px-3.5 py-2.5 text-sm bg-white border border-[#E4E4E7] rounded-lg focus:border-[#065F46] outline-none"
                        />
                      </div>
                    </div>
                  </div>
                </div>
              ) : (
                <div className="pt-4 border-t border-[#E4E4E7]">
                  <h3 className="font-sans text-sm font-semibold text-[#18181B] mb-2">
                    Pickup Location · {scheduledTime}
                  </h3>
                  <div className="p-4 rounded-xl bg-[#FAFAFA] border border-[#E4E4E7] text-sm text-[#52525B]">
                    <p className="font-semibold text-[#18181B]">Ember &amp; Grain Kitchen</p>
                    <p className="mt-1">742 Valencia St, San Francisco, CA 94110</p>
                    <p className="mt-1 text-xs text-[#71717A]">
                      Orders are held warm on the dedicated pickup shelf inside the front entrance.
                    </p>
                  </div>
                </div>
              )}

              {/* Payment Method */}
              <div className="pt-4 border-t border-[#E4E4E7]">
                <h3 className="font-sans text-sm font-semibold text-[#18181B] mb-3">
                  Payment Method
                </h3>
                <div className="grid grid-cols-3 gap-2.5">
                  {(
                    [
                      { id: 'card', label: 'Credit Card' },
                      { id: 'apple_pay', label: 'Express Pay' },
                      { id: 'cash', label: fulfillment === 'delivery' ? 'Cash on Delivery' : 'Pay at Counter' },
                    ] as const
                  ).map((method) => (
                    <button
                      key={method.id}
                      type="button"
                      onClick={() => setPaymentMethod(method.id)}
                      className={`p-3 rounded-lg border text-xs font-semibold text-center transition-colors cursor-pointer ${
                        paymentMethod === method.id
                          ? 'border-[#065F46] bg-[#065F46]/[0.05] text-[#065F46]'
                          : 'border-[#E4E4E7] bg-white text-[#52525B] hover:border-[#A1A1AA]'
                      }`}
                    >
                      <CreditCard className="w-4 h-4 mx-auto mb-1.5" aria-hidden="true" />
                      <span>{method.label}</span>
                    </button>
                  ))}
                </div>
              </div>
            </div>

            <div className="px-6 py-5 border-t border-[#E4E4E7] bg-[#FAFAFA] shrink-0">
              <div className="flex items-center justify-between text-sm font-semibold text-[#18181B] mb-3">
                <span>Order Total ({cartItems.reduce((s, i) => s + i.quantity, 0)} items)</span>
                <span className="tabular-nums">${total.toFixed(2)}</span>
              </div>
              <button
                type="submit"
                disabled={submitting}
                className="w-full py-3.5 px-5 text-sm font-semibold text-white bg-[#065F46] hover:bg-[#047857] rounded-lg transition-colors tabular-nums cursor-pointer disabled:opacity-60 min-h-[46px]"
              >
                {submitting ? 'Submitting Order...' : `Place Order — $${total.toFixed(2)}`}
              </button>
            </div>
          </form>
        )}

        {/* Step 3: Confirmation Receipt */}
        {step === 'confirmed' && confirmedOrder && (
          <div className="flex-1 overflow-y-auto px-6 py-6 flex flex-col justify-between gap-6">
            <div className="space-y-5">
              <div className="p-5 rounded-xl bg-[#065F46]/[0.06] border border-[#065F46]/20">
                <div className="flex items-center gap-2.5 text-[#065F46]">
                  <CheckCircle2 className="w-5 h-5 shrink-0" aria-hidden="true" />
                  <span className="text-sm font-semibold">
                    Order #{confirmedOrder.id} Confirmed
                  </span>
                </div>
                <p className="mt-2 text-sm text-[#18181B]">
                  Thank you, {confirmedOrder.customer.name}. Our kitchen has received your order and
                  started firing the hearth.
                </p>
                <p className="mt-1.5 text-xs text-[#52525B] tabular-nums">
                  Estimated {confirmedOrder.fulfillment === 'delivery' ? 'delivery' : 'pickup'}:{' '}
                  <span className="font-semibold text-[#18181B]">
                    {confirmedOrder.estimatedMinutes} minutes
                  </span>{' '}
                  ({confirmedOrder.scheduledTime})
                </p>
              </div>

              <div className="border border-[#E4E4E7] rounded-xl p-4 space-y-3">
                <h3 className="font-sans text-xs font-semibold uppercase tracking-wider text-[#71717A]">
                  Receipt Summary
                </h3>
                <ul className="divide-y divide-[#F4F4F5] text-sm">
                  {confirmedOrder.items.map((item, idx) => (
                    <li key={`${item.menuItemId}-${idx}`} className="py-2.5 flex justify-between gap-3">
                      <div>
                        <p className="font-medium text-[#18181B]">
                          {item.quantity}x {item.name}
                        </p>
                        {item.optionsSummary.length > 0 && (
                          <p className="text-xs text-[#71717A]">{item.optionsSummary.join(' · ')}</p>
                        )}
                      </div>
                      <span className="font-medium text-[#18181B] tabular-nums shrink-0">
                        ${item.lineTotal.toFixed(2)}
                      </span>
                    </li>
                  ))}
                </ul>

                <div className="pt-3 border-t border-[#E4E4E7] space-y-1.5 text-xs text-[#52525B]">
                  <div className="flex justify-between">
                    <span>Subtotal</span>
                    <span className="tabular-nums">${confirmedOrder.subtotal.toFixed(2)}</span>
                  </div>
                  {confirmedOrder.discount > 0 && (
                    <div className="flex justify-between text-[#065F46]">
                      <span>Discount ({confirmedOrder.promoCode})</span>
                      <span className="tabular-nums">-${confirmedOrder.discount.toFixed(2)}</span>
                    </div>
                  )}
                  <div className="flex justify-between">
                    <span>Delivery</span>
                    <span className="tabular-nums">
                      {confirmedOrder.deliveryFee === 0
                        ? 'Free'
                        : `$${confirmedOrder.deliveryFee.toFixed(2)}`}
                    </span>
                  </div>
                  <div className="flex justify-between">
                    <span>Tax</span>
                    <span className="tabular-nums">${confirmedOrder.tax.toFixed(2)}</span>
                  </div>
                  <div className="flex justify-between">
                    <span>Tip</span>
                    <span className="tabular-nums">${confirmedOrder.tip.toFixed(2)}</span>
                  </div>
                  <div className="pt-2 border-t border-[#E4E4E7] flex justify-between text-sm font-semibold text-[#18181B]">
                    <span>Total Paid</span>
                    <span className="tabular-nums">${confirmedOrder.total.toFixed(2)}</span>
                  </div>
                </div>
              </div>
            </div>

            <div className="space-y-2.5">
              <button
                type="button"
                onClick={() => {
                  const id = confirmedOrder.id;
                  onClose();
                  onTrackOrder(id);
                }}
                className="w-full py-3.5 px-5 text-sm font-semibold text-white bg-[#065F46] hover:bg-[#047857] rounded-lg transition-colors cursor-pointer min-h-[44px]"
              >
                Track Live Order Status
              </button>
              <button
                type="button"
                onClick={() => {
                  setStep('bag');
                  onClose();
                }}
                className="w-full py-3 px-5 text-sm font-medium text-[#52525B] hover:text-[#18181B] border border-[#E4E4E7] rounded-lg transition-colors cursor-pointer"
              >
                Back to Menu
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
