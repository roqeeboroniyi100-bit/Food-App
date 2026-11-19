interface FooterProps {
  onOpenTracker: () => void;
  onOpenCart: () => void;
}

export function Footer({ onOpenTracker, onOpenCart }: FooterProps) {
  return (
    <footer className="bg-[#FAFAFA] border-t border-[#E4E4E7] py-12 lg:py-16">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-8">
          <div>
            <p className="font-display text-xl font-semibold text-[#18181B]">Ember &amp; Grain</p>
            <p className="mt-2.5 text-sm text-[#52525B] leading-relaxed">
              Wood-fired sourdough flatbreads, harvest bowls, and handmade pasta prepared fresh
              daily.
            </p>
          </div>

          <div>
            <p className="text-xs font-semibold uppercase tracking-wider text-[#71717A] mb-3">
              Kitchen &amp; Pickup
            </p>
            <p className="text-sm text-[#18181B] font-medium">742 Valencia Street</p>
            <p className="text-sm text-[#52525B]">San Francisco, CA 94110</p>
            <p className="mt-2 text-sm text-[#52525B] tabular-nums">(415) 555-0182</p>
          </div>

          <div>
            <p className="text-xs font-semibold uppercase tracking-wider text-[#71717A] mb-3">
              Service Hours
            </p>
            <p className="text-sm text-[#52525B] tabular-nums">Mon – Thu: 11:00 AM – 10:00 PM</p>
            <p className="mt-1 text-sm text-[#52525B] tabular-nums">Fri – Sun: 11:00 AM – 10:30 PM</p>
          </div>

          <div>
            <p className="text-xs font-semibold uppercase tracking-wider text-[#71717A] mb-3">
              Quick Links
            </p>
            <ul className="space-y-2 text-sm text-[#52525B]">
              <li>
                <a href="#menu" className="hover:text-[#18181B] transition-colors">
                  Browse Menu
                </a>
              </li>
              <li>
                <button
                  type="button"
                  onClick={onOpenCart}
                  className="hover:text-[#18181B] transition-colors cursor-pointer"
                >
                  View Order Bag
                </button>
              </li>
              <li>
                <button
                  type="button"
                  onClick={onOpenTracker}
                  className="hover:text-[#18181B] transition-colors cursor-pointer"
                >
                  Track Active Order
                </button>
              </li>
            </ul>
          </div>
        </div>

        <div className="mt-10 pt-6 border-t border-[#E4E4E7] flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 text-xs text-[#71717A]">
          <p>© {new Date().getFullYear()} Ember &amp; Grain Kitchen. All rights reserved.</p>
          <p>Online Promo Codes: WELCOME10 (10% off) · FREESHIP (Free Delivery) · HEARTH15 (15% off $45+)</p>
        </div>
      </div>
    </footer>
  );
}
