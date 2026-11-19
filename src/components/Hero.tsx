import { ArrowRight, MapPin } from 'lucide-react';
import { HERO_IMAGE } from '../data/menu.ts';
import type { FulfillmentType } from '../types/food.ts';
import { SafeImage } from './SafeImage.tsx';

interface HeroProps {
  fulfillment: FulfillmentType;
  onChangeFulfillment: (mode: FulfillmentType) => void;
  deliveryAddress: string;
  onChangeDeliveryAddress: (addr: string) => void;
  onSelectSpecials: () => void;
}

export function Hero({
  fulfillment,
  onChangeFulfillment,
  deliveryAddress,
  onChangeDeliveryAddress,
  onSelectSpecials,
}: HeroProps) {
  return (
    <section id="top" className="border-b border-[#E4E4E7] bg-[#FAFAFA]">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 pt-10 pb-12 lg:pt-14 lg:pb-16">
        {/* 2-Column Split Hero with Equal Height Stretch */}
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 lg:gap-12 items-stretch">
          {/* Left Content Column */}
          <div className="lg:col-span-6 flex flex-col justify-between py-2">
            <div>
              <p className="text-xs font-medium tracking-wide text-[#52525B] mb-4">
                Wood-Fired Kitchen · Valencia District · Delivery &amp; Pickup
              </p>

              <h1 className="font-display text-[clamp(2.25rem,4vw,3.5rem)] leading-[1.08] font-semibold tracking-tight text-[#18181B] text-balance max-w-xl">
                Fresh from the hearth, delivered to your table.
              </h1>

              <p className="mt-5 text-base leading-relaxed text-[#52525B] max-w-lg">
                72-hour fermented sourdough flatbreads, cedar-roasted harvest bowls, and handmade
                bronze-die pasta cooked to order over white oak embers.
              </p>
            </div>

            {/* Fulfillment Mode + Quick Address Input */}
            <div className="mt-8 bg-white border border-[#E4E4E7] rounded-xl p-5 max-w-xl">
              <div className="flex items-center justify-between gap-4 mb-4">
                <div
                  role="tablist"
                  aria-label="Fulfillment option"
                  className="inline-flex items-center p-1 bg-[#F4F4F5] rounded-lg"
                >
                  <button
                    type="button"
                    role="tab"
                    aria-selected={fulfillment === 'delivery'}
                    onClick={() => onChangeFulfillment('delivery')}
                    className={`px-4 py-2 text-xs font-semibold rounded-md transition-colors whitespace-nowrap shrink-0 cursor-pointer ${
                      fulfillment === 'delivery'
                        ? 'bg-white text-[#18181B] shadow-xs'
                        : 'text-[#52525B] hover:text-[#18181B]'
                    }`}
                  >
                    Delivery
                  </button>
                  <button
                    type="button"
                    role="tab"
                    aria-selected={fulfillment === 'pickup'}
                    onClick={() => onChangeFulfillment('pickup')}
                    className={`px-4 py-2 text-xs font-semibold rounded-md transition-colors whitespace-nowrap shrink-0 cursor-pointer ${
                      fulfillment === 'pickup'
                        ? 'bg-white text-[#18181B] shadow-xs'
                        : 'text-[#52525B] hover:text-[#18181B]'
                    }`}
                  >
                    Pickup
                  </button>
                </div>

                <span className="text-xs font-medium text-[#52525B] tabular-nums whitespace-nowrap">
                  {fulfillment === 'delivery' ? 'Est. 25–35 min' : 'Ready in 15–20 min'}
                </span>
              </div>

              {fulfillment === 'delivery' ? (
                <div className="flex flex-col sm:flex-row gap-3">
                  <div className="relative flex-1">
                    <MapPin
                      className="w-4 h-4 text-[#71717A] absolute left-3.5 top-1/2 -translate-y-1/2 pointer-events-none"
                      aria-hidden="true"
                    />
                    <input
                      type="text"
                      value={deliveryAddress}
                      onChange={(e) => onChangeDeliveryAddress(e.target.value)}
                      placeholder="Enter delivery street address"
                      aria-label="Delivery street address"
                      className="w-full pl-10 pr-3.5 py-2.5 text-sm bg-[#FAFAFA] border border-[#E4E4E7] rounded-lg text-[#18181B] placeholder:text-[#71717A] focus:bg-white focus:border-[#065F46] outline-none transition-colors"
                    />
                  </div>
                  <a
                    href="#menu"
                    className="inline-flex items-center justify-center gap-2 px-5 py-2.5 text-sm font-semibold text-white bg-[#065F46] hover:bg-[#047857] rounded-lg transition-colors whitespace-nowrap shrink-0 min-h-[42px]"
                  >
                    <span>Order Now</span>
                    <ArrowRight className="w-4 h-4 shrink-0" aria-hidden="true" />
                  </a>
                </div>
              ) : (
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pt-1">
                  <div className="text-sm text-[#52525B]">
                    <span className="font-medium text-[#18181B]">742 Valencia St Kitchen</span>
                    <span className="mx-2 text-[#A1A1AA]" aria-hidden="true">
                      ·
                    </span>
                    <span>Counter Pickup (No Fees)</span>
                  </div>
                  <a
                    href="#menu"
                    className="inline-flex items-center justify-center gap-2 px-5 py-2.5 text-sm font-semibold text-white bg-[#065F46] hover:bg-[#047857] rounded-lg transition-colors whitespace-nowrap shrink-0 min-h-[42px]"
                  >
                    <span>Start Pickup Order</span>
                    <ArrowRight className="w-4 h-4 shrink-0" aria-hidden="true" />
                  </a>
                </div>
              )}

              <div className="mt-4 pt-3.5 border-t border-[#F4F4F5] flex flex-wrap items-center justify-between gap-3 text-xs text-[#52525B]">
                <span>Use code WELCOME10 for 10% off your first online order</span>
                <button
                  type="button"
                  onClick={onSelectSpecials}
                  className="font-semibold text-[#065F46] hover:underline underline-offset-4 whitespace-nowrap cursor-pointer"
                >
                  View House Favorites
                </button>
              </div>
            </div>
          </div>

          {/* Right Media Column */}
          <div className="lg:col-span-6">
            <div className="h-72 sm:h-96 lg:h-full min-h-[340px] rounded-2xl overflow-hidden border border-[#E4E4E7] bg-[#F4F4F5]">
              <SafeImage
                src={HERO_IMAGE}
                alt="Wood-fired sourdough flatbread, miso glazed salmon bowl, and handmade pappardelle pasta on a dark slate table"
                className="w-full h-full object-cover"
              />
            </div>
          </div>
        </div>

        {/* Full-Width 4-Column Kitchen Summary Strip Below Split */}
        <div className="mt-10 pt-8 border-t border-[#E4E4E7] grid grid-cols-2 lg:grid-cols-4 gap-6">
          <div>
            <p className="text-xs font-medium text-[#71717A]">Kitchen Preparation</p>
            <p className="mt-1 text-base font-semibold text-[#18181B] tabular-nums">
              15–22 Minutes
            </p>
          </div>
          <div>
            <p className="text-xs font-medium text-[#71717A]">Free Local Delivery</p>
            <p className="mt-1 text-base font-semibold text-[#18181B] tabular-nums">
              Orders $35.00+
            </p>
          </div>
          <div>
            <p className="text-xs font-medium text-[#71717A]">Daily Service Hours</p>
            <p className="mt-1 text-base font-semibold text-[#18181B] tabular-nums">
              11:00 AM – 10:30 PM
            </p>
          </div>
          <div>
            <p className="text-xs font-medium text-[#71717A]">Seasonal Menu</p>
            <p className="mt-1 text-base font-semibold text-[#18181B] tabular-nums">
              9 Wood-Fired Dishes
            </p>
          </div>
        </div>
      </div>
    </section>
  );
}
