import { useEffect, useState } from 'react';
import {
  AlertCircle,
  CheckCircle2,
  ChefHat,
  Clock,
  PackageCheck,
  Search,
  Truck,
  X,
} from 'lucide-react';
import type { OrderRecord, OrderStage } from '../types/food.ts';

interface OrderTrackerModalProps {
  isOpen: boolean;
  onClose: () => void;
  initialOrderId: string | null;
  recentOrderIds: string[];
}

interface StageDescriptor {
  key: OrderStage;
  label: string;
  detail: string;
  icon: typeof CheckCircle2;
}

function getStagesForFulfillment(fulfillment: 'delivery' | 'pickup'): StageDescriptor[] {
  return [
    {
      key: 'confirmed',
      label: 'Order Confirmed',
      detail: 'Kitchen ticket printed and queued.',
      icon: CheckCircle2,
    },
    {
      key: 'preparing',
      label: 'Preparing in Kitchen',
      detail: 'Baking sourdough and plating fresh ingredients.',
      icon: ChefHat,
    },
    fulfillment === 'delivery'
      ? {
          key: 'out_for_delivery',
          label: 'Out for Delivery',
          detail: 'Courier is on the way in an insulated thermal bag.',
          icon: Truck,
        }
      : {
          key: 'ready_for_pickup',
          label: 'Ready for Pickup',
          detail: 'Waiting warm on the Valencia St pickup counter.',
          icon: PackageCheck,
        },
    {
      key: 'completed',
      label: fulfillment === 'delivery' ? 'Delivered' : 'Picked Up',
      detail: 'Enjoy your meal from Ember & Grain.',
      icon: CheckCircle2,
    },
  ];
}

export function OrderTrackerModal({
  isOpen,
  onClose,
  initialOrderId,
  recentOrderIds,
}: OrderTrackerModalProps) {
  const [lookupInput, setLookupInput] = useState(initialOrderId || 'EG-1041');
  const [activeOrder, setActiveOrder] = useState<OrderRecord | null>(null);
  const [allOrders, setAllOrders] = useState<OrderRecord[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [advancing, setAdvancing] = useState(false);

  const fetchOrderById = async (orderId: string) => {
    if (!orderId.trim()) return;
    setLoading(true);
    setError(null);
    try {
      const res = await fetch(`/api/orders/${encodeURIComponent(orderId.trim())}`);
      const data = (await res.json()) as { order?: OrderRecord; error?: string };
      if (!res.ok || !data.order) {
        setError(data.error || 'Order not found.');
        setActiveOrder(null);
      } else {
        setActiveOrder(data.order);
      }
    } catch {
      setError('Unable to reach order tracking service.');
    } finally {
      setLoading(false);
    }
  };

  const fetchAllOrders = async () => {
    try {
      const res = await fetch('/api/orders');
      const data = (await res.json()) as { orders?: OrderRecord[] };
      if (res.ok && Array.isArray(data.orders)) {
        setAllOrders(data.orders);
      }
    } catch {
      // Ignore list load error
    }
  };

  useEffect(() => {
    if (!isOpen) return;
    const targetId = initialOrderId || recentOrderIds[0] || 'EG-1041';
    setLookupInput(targetId);
    fetchOrderById(targetId);
    fetchAllOrders();
  }, [isOpen, initialOrderId, recentOrderIds]);

  // Poll live status every 5 seconds while open and not yet completed
  useEffect(() => {
    if (!isOpen || !activeOrder || activeOrder.stage === 'completed') return;
    const timer = window.setInterval(async () => {
      try {
        const res = await fetch(`/api/orders/${encodeURIComponent(activeOrder.id)}`);
        if (res.ok) {
          const data = (await res.json()) as { order?: OrderRecord };
          if (data.order) setActiveOrder(data.order);
        }
      } catch {
        // Ignore transient poll errors
      }
    }, 5000);
    return () => window.clearInterval(timer);
  }, [isOpen, activeOrder]);

  useEffect(() => {
    if (!isOpen) return;
    const onKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') onClose();
    };
    window.addEventListener('keydown', onKeyDown);
    return () => window.removeEventListener('keydown', onKeyDown);
  }, [isOpen, onClose]);

  const handleAdvanceStage = async () => {
    if (!activeOrder) return;
    setAdvancing(true);
    try {
      const res = await fetch(`/api/orders/${encodeURIComponent(activeOrder.id)}/advance`, {
        method: 'POST',
      });
      const data = (await res.json()) as { order?: OrderRecord };
      if (res.ok && data.order) {
        setActiveOrder(data.order);
        fetchAllOrders();
      }
    } finally {
      setAdvancing(false);
    }
  };

  if (!isOpen) return null;

  const stages = activeOrder ? getStagesForFulfillment(activeOrder.fulfillment) : [];
  const currentStageIndex = activeOrder
    ? stages.findIndex((s) => s.key === activeOrder.stage)
    : -1;

  return (
    <div
      role="dialog"
      aria-modal="true"
      aria-labelledby="tracker-title"
      className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-[2px]"
      onClick={onClose}
    >
      <div
        className="bg-white border border-[#E4E4E7] rounded-2xl w-full max-w-2xl max-h-[90vh] overflow-hidden flex flex-col shadow-xl"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="px-6 py-4 border-b border-[#E4E4E7] flex items-center justify-between gap-4 shrink-0">
          <h2 id="tracker-title" className="font-display text-xl font-semibold text-[#18181B]">
            Live Order Tracker
          </h2>
          <button
            type="button"
            onClick={onClose}
            aria-label="Close order tracker"
            className="p-2 rounded-lg text-[#52525B] hover:text-[#18181B] hover:bg-[#F4F4F5] cursor-pointer"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        <div className="p-6 overflow-y-auto space-y-6">
          {/* Lookup Search Bar */}
          <form
            onSubmit={(e) => {
              e.preventDefault();
              fetchOrderById(lookupInput);
            }}
            className="flex flex-col sm:flex-row gap-2.5"
          >
            <div className="relative flex-1">
              <Search
                className="w-4 h-4 text-[#71717A] absolute left-3.5 top-1/2 -translate-y-1/2 pointer-events-none"
                aria-hidden="true"
              />
              <input
                type="text"
                value={lookupInput}
                onChange={(e) => setLookupInput(e.target.value.toUpperCase())}
                placeholder="Enter Order ID (e.g. EG-1041)"
                aria-label="Order ID lookup"
                className="w-full pl-10 pr-3.5 py-2.5 text-sm font-mono bg-[#FAFAFA] border border-[#E4E4E7] rounded-lg text-[#18181B] focus:bg-white focus:border-[#065F46] outline-none"
              />
            </div>
            <button
              type="submit"
              disabled={loading}
              className="px-5 py-2.5 text-sm font-semibold text-white bg-[#065F46] hover:bg-[#047857] rounded-lg transition-colors whitespace-nowrap cursor-pointer disabled:opacity-60"
            >
              {loading ? 'Looking up...' : 'Track Order'}
            </button>
          </form>

          {/* Recent Orders Quick Switcher */}
          {allOrders.length > 0 && (
            <div className="flex flex-wrap items-center gap-2 text-xs">
              <span className="text-[#71717A] font-medium">Recent orders:</span>
              {allOrders.slice(0, 4).map((ord) => (
                <button
                  key={ord.id}
                  type="button"
                  onClick={() => {
                    setLookupInput(ord.id);
                    fetchOrderById(ord.id);
                  }}
                  className={`px-2.5 py-1 rounded-md border font-mono transition-colors cursor-pointer ${
                    activeOrder?.id === ord.id
                      ? 'bg-[#18181B] text-white border-[#18181B]'
                      : 'bg-[#FAFAFA] text-[#52525B] border-[#E4E4E7] hover:border-[#A1A1AA]'
                  }`}
                >
                  #{ord.id}
                </button>
              ))}
            </div>
          )}

          {error && (
            <div
              role="alert"
              className="flex items-center gap-2.5 p-4 rounded-xl bg-[#FEF2F2] border border-[#FECACA] text-sm text-[#B91C1C]"
            >
              <AlertCircle className="w-4 h-4 shrink-0" aria-hidden="true" />
              <span>{error}</span>
            </div>
          )}

          {activeOrder && (
            <div className="space-y-6">
              {/* Order Summary Header */}
              <div className="p-5 rounded-xl bg-[#FAFAFA] border border-[#E4E4E7] flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                <div>
                  <div className="flex items-center gap-2 text-xs text-[#52525B]">
                    <span className="font-mono font-medium text-[#18181B]">#{activeOrder.id}</span>
                    <span aria-hidden="true">·</span>
                    <span className="capitalize">{activeOrder.fulfillment}</span>
                    <span aria-hidden="true">·</span>
                    <span>{activeOrder.scheduledTime}</span>
                  </div>
                  <h3 className="mt-1 font-display text-lg font-semibold text-[#18181B]">
                    {stages[currentStageIndex]?.label ?? 'Confirmed'}
                  </h3>
                  <p className="text-xs text-[#52525B] mt-0.5">
                    {activeOrder.fulfillment === 'delivery'
                      ? `Delivering to ${activeOrder.customer.address}`
                      : 'Pickup at 742 Valencia St Counter'}
                  </p>
                </div>

                <div className="flex items-center gap-3 shrink-0">
                  <div className="text-left sm:text-right">
                    <p className="text-xs text-[#71717A] flex items-center sm:justify-end gap-1">
                      <Clock className="w-3.5 h-3.5" aria-hidden="true" />
                      <span>Status</span>
                    </p>
                    <p className="text-sm font-semibold text-[#065F46] tabular-nums">
                      {activeOrder.stage === 'completed'
                        ? 'Complete'
                        : activeOrder.estimatedMinutes > 0
                          ? `~${activeOrder.estimatedMinutes} min left`
                          : 'Ready now'}
                    </p>
                  </div>
                </div>
              </div>

              {/* 4-Stage Progress Timeline */}
              <ol className="space-y-4">
                {stages.map((stage, idx) => {
                  const isDone = idx <= currentStageIndex;
                  const isCurrent = idx === currentStageIndex;
                  const Icon = stage.icon;

                  return (
                    <li key={stage.key} className="flex items-start gap-4">
                      <div
                        className={`w-9 h-9 rounded-full flex items-center justify-center border shrink-0 transition-colors ${
                          isDone
                            ? 'bg-[#065F46] border-[#065F46] text-white'
                            : 'bg-white border-[#E4E4E7] text-[#A1A1AA]'
                        }`}
                      >
                        <Icon className="w-4 h-4" aria-hidden="true" />
                      </div>
                      <div className="flex-1 pt-0.5 pb-2 border-b border-[#F4F4F5] last:border-b-0">
                        <div className="flex items-center justify-between gap-2">
                          <span
                            className={`text-sm font-semibold ${
                              isDone ? 'text-[#18181B]' : 'text-[#71717A]'
                            }`}
                          >
                            {stage.label}
                          </span>
                          <span className="text-xs font-medium text-[#52525B]">
                            {isCurrent ? 'Current Stage' : isDone ? 'Completed' : 'Upcoming'}
                          </span>
                        </div>
                        <p className="text-xs text-[#52525B] mt-0.5">{stage.detail}</p>
                      </div>
                    </li>
                  );
                })}
              </ol>

              {activeOrder.stage !== 'completed' && (
                <div className="flex items-center justify-between gap-4 pt-2">
                  <p className="text-xs text-[#71717A]">
                    Updates automatically as your order moves through the kitchen.
                  </p>
                  <button
                    type="button"
                    onClick={handleAdvanceStage}
                    disabled={advancing}
                    className="px-3.5 py-2 text-xs font-semibold text-[#18181B] bg-[#F4F4F5] hover:bg-[#E4E4E7] rounded-lg transition-colors whitespace-nowrap shrink-0 cursor-pointer disabled:opacity-60"
                  >
                    {advancing ? 'Updating...' : 'Simulate Next Stage'}
                  </button>
                </div>
              )}

              {/* Itemized Receipt */}
              <div className="border border-[#E4E4E7] rounded-xl p-4">
                <h4 className="font-sans text-xs font-semibold uppercase tracking-wider text-[#71717A] mb-3">
                  Items in This Order
                </h4>
                <ul className="divide-y divide-[#F4F4F5] text-sm">
                  {activeOrder.items.map((item, idx) => (
                    <li
                      key={`${item.menuItemId}-${idx}`}
                      className="py-2 flex items-start justify-between gap-4"
                    >
                      <div>
                        <p className="font-medium text-[#18181B]">
                          {item.quantity}x {item.name}
                        </p>
                        {item.optionsSummary.length > 0 && (
                          <p className="text-xs text-[#71717A]">
                            {item.optionsSummary.join(' · ')}
                          </p>
                        )}
                      </div>
                      <span className="font-medium text-[#18181B] tabular-nums shrink-0">
                        ${item.lineTotal.toFixed(2)}
                      </span>
                    </li>
                  ))}
                </ul>
                <div className="mt-3 pt-3 border-t border-[#E4E4E7] flex justify-between text-sm font-semibold text-[#18181B]">
                  <span>Total Charged</span>
                  <span className="tabular-nums">${activeOrder.total.toFixed(2)}</span>
                </div>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
