import { KITCHEN_IMAGE } from '../data/menu.ts';
import { SafeImage } from './SafeImage.tsx';

export function KitchenStory() {
  return (
    <section id="our-kitchen" className="py-16 lg:py-24 bg-white border-t border-[#E4E4E7]">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-10 lg:gap-14 items-stretch">
          {/* Left Editorial Photo */}
          <div className="lg:col-span-6">
            <div className="h-80 sm:h-96 lg:h-full min-h-[360px] rounded-2xl overflow-hidden border border-[#E4E4E7] bg-[#F4F4F5]">
              <SafeImage
                src={KITCHEN_IMAGE}
                alt="Baker sliding sourdough flatbread from Ember & Grain brick wood-fired oven"
                className="w-full h-full object-cover"
              />
            </div>
          </div>

          {/* Right Craftsmanship Copy */}
          <div className="lg:col-span-6 flex flex-col justify-between py-2">
            <div>
              <p className="text-xs font-medium text-[#52525B] mb-3">
                Our Craftsmanship · Valencia Street Kitchen
              </p>
              <h2 className="font-display text-3xl sm:text-4xl font-semibold tracking-tight text-[#18181B] text-balance">
                72-hour wild fermentation meets an 850°F white oak hearth.
              </h2>
              <p className="mt-4 text-base text-[#52525B] leading-relaxed">
                Every morning starts at 5:30 AM mixing organic stone-milled wheat with our ten-year
                mother starter. Nothing is par-baked or held under heat lamps—your flatbread hits the
                deck and your pasta hits the pan only after your ticket prints.
              </p>
            </div>

            <div className="mt-8 pt-8 border-t border-[#E4E4E7] space-y-5">
              <div>
                <h3 className="font-sans text-sm font-semibold text-[#18181B]">
                  01. Single-Origin California Grains
                </h3>
                <p className="mt-1 text-sm text-[#52525B]">
                  Stone-ground heritage Red Fife wheat and heirloom farro milled weekly within 90
                  miles of our kitchen.
                </p>
              </div>
              <div>
                <h3 className="font-sans text-sm font-semibold text-[#18181B]">
                  02. Compostable Thermal Packaging
                </h3>
                <p className="mt-1 text-sm text-[#52525B]">
                  Vented molded-fiber boxes keep sourdough crusts crisp and roasted bowls steaming hot
                  from oven to doorstep.
                </p>
              </div>
              <div>
                <h3 className="font-sans text-sm font-semibold text-[#18181B]">
                  03. Direct Neighborhood Delivery
                </h3>
                <p className="mt-1 text-sm text-[#52525B]">
                  Dispatched by our in-house courier team with zero inflated marketplace markups.
                </p>
              </div>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}
