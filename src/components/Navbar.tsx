import { useState } from 'react';
import { Menu, ShoppingBag, X } from 'lucide-react';

interface NavbarProps {
  cartCount: number;
  cartSubtotal: number;
  onOpenCart: () => void;
  onOpenTracker: () => void;
}

export function Navbar({ cartCount, cartSubtotal, onOpenCart, onOpenTracker }: NavbarProps) {
  const [mobileOpen, setMobileOpen] = useState(false);

  return (
    <header className="sticky top-0 z-40 bg-[#FAFAFA]/95 backdrop-blur-sm border-b border-[#E4E4E7]">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-16 flex items-center justify-between gap-8">
        {/* Zone 1: Single-element Brand Wordmark */}
        <a
          href="#top"
          className="font-display text-xl font-semibold tracking-tight text-[#18181B] whitespace-nowrap shrink-0"
        >
          Ember &amp; Grain
        </a>

        {/* Zone 2: 4 Concise Single-Line Navigation Links */}
        <nav
          aria-label="Primary navigation"
          className="hidden md:flex items-center gap-8 text-sm font-medium text-[#52525B]"
        >
          <a
            href="#menu"
            className="hover:text-[#18181B] hover:underline underline-offset-4 transition-colors whitespace-nowrap shrink-0"
          >
            Menu
          </a>
          <a
            href="#specials"
            className="hover:text-[#18181B] hover:underline underline-offset-4 transition-colors whitespace-nowrap shrink-0"
          >
            Specials
          </a>
          <a
            href="#our-kitchen"
            className="hover:text-[#18181B] hover:underline underline-offset-4 transition-colors whitespace-nowrap shrink-0"
          >
            Our Kitchen
          </a>
          <button
            type="button"
            onClick={onOpenTracker}
            className="hover:text-[#18181B] hover:underline underline-offset-4 transition-colors whitespace-nowrap shrink-0 cursor-pointer"
          >
            Track Order
          </button>
        </nav>

        {/* Zone 3: 1 Primary Action */}
        <div className="flex items-center gap-3 shrink-0">
          <button
            type="button"
            onClick={onOpenCart}
            aria-label={`Open bag with ${cartCount} items`}
            className="inline-flex items-center gap-2 px-4 py-2.5 text-sm font-semibold text-white bg-[#065F46] hover:bg-[#047857] rounded-lg transition-colors whitespace-nowrap shrink-0 cursor-pointer min-h-[40px]"
          >
            <ShoppingBag className="w-4 h-4 shrink-0" aria-hidden="true" />
            <span>Bag ({cartCount})</span>
            {cartCount > 0 && (
              <span className="hidden sm:inline tabular-nums opacity-90">
                · ${cartSubtotal.toFixed(2)}
              </span>
            )}
          </button>

          <button
            type="button"
            onClick={() => setMobileOpen((prev) => !prev)}
            aria-label={mobileOpen ? 'Close navigation menu' : 'Open navigation menu'}
            aria-expanded={mobileOpen}
            className="md:hidden inline-flex items-center justify-center w-10 h-10 rounded-lg border border-[#E4E4E7] bg-white text-[#18181B] cursor-pointer"
          >
            {mobileOpen ? <X className="w-5 h-5" /> : <Menu className="w-5 h-5" />}
          </button>
        </div>
      </div>

      {/* Mobile Drawer Nav */}
      {mobileOpen && (
        <div className="md:hidden border-t border-[#E4E4E7] bg-white px-4 py-4 flex flex-col gap-3">
          <a
            href="#menu"
            onClick={() => setMobileOpen(false)}
            className="py-2 text-sm font-medium text-[#18181B]"
          >
            Menu
          </a>
          <a
            href="#specials"
            onClick={() => setMobileOpen(false)}
            className="py-2 text-sm font-medium text-[#18181B]"
          >
            Specials
          </a>
          <a
            href="#our-kitchen"
            onClick={() => setMobileOpen(false)}
            className="py-2 text-sm font-medium text-[#18181B]"
          >
            Our Kitchen
          </a>
          <button
            type="button"
            onClick={() => {
              setMobileOpen(false);
              onOpenTracker();
            }}
            className="py-2 text-left text-sm font-medium text-[#18181B]"
          >
            Track Order
          </button>
        </div>
      )}
    </header>
  );
}
