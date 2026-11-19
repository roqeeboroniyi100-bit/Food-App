import { Minus, Plus, Search, SlidersHorizontal, X } from 'lucide-react';
import { CATEGORIES } from '../data/menu.ts';
import type { CartItem, CategoryId, DietaryTag, MenuItem } from '../types/food.ts';
import { SafeImage } from './SafeImage.tsx';

interface MenuCatalogProps {
  items: MenuItem[];
  activeCategory: CategoryId;
  onSelectCategory: (cat: CategoryId) => void;
  searchQuery: string;
  onChangeSearch: (q: string) => void;
  activeDietary: DietaryTag[];
  onToggleDietary: (tag: DietaryTag) => void;
  featuredOnly: boolean;
  onToggleFeaturedOnly: () => void;
  onResetFilters: () => void;
  onOpenDish: (item: MenuItem) => void;
  onQuickAdd: (item: MenuItem) => void;
  cartItems: CartItem[];
  onUpdateCartQuantity: (cartKey: string, delta: number) => void;
}

const DIETARY_OPTIONS: DietaryTag[] = ['Vegetarian', 'Gluten-Free Option', 'Spicy'];

export function MenuCatalog({
  items,
  activeCategory,
  onSelectCategory,
  searchQuery,
  onChangeSearch,
  activeDietary,
  onToggleDietary,
  featuredOnly,
  onToggleFeaturedOnly,
  onResetFilters,
  onOpenDish,
  onQuickAdd,
  cartItems,
  onUpdateCartQuantity,
}: MenuCatalogProps) {
  const hasActiveFilters =
    activeCategory !== 'all' ||
    searchQuery.trim() !== '' ||
    activeDietary.length > 0 ||
    featuredOnly;

  const getCartEntriesForDish = (menuItemId: string) =>
    cartItems.filter((c) => c.menuItemId === menuItemId);

  return (
    <section id="menu" className="py-14 lg:py-20 bg-[#FAFAFA]">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        {/* Section Heading */}
        <div id="specials" className="flex flex-col md:flex-row md:items-end justify-between gap-6 mb-8">
          <div>
            <p className="text-xs font-medium text-[#52525B] mb-2">
              Cooked to Order · Daily Seasonal Menu
            </p>
            <h2 className="font-display text-3xl sm:text-4xl font-semibold tracking-tight text-[#18181B]">
              Order from Today&apos;s Menu
            </h2>
          </div>

          {/* Search Input */}
          <div className="relative w-full md:w-80">
            <Search
              className="w-4 h-4 text-[#71717A] absolute left-3.5 top-1/2 -translate-y-1/2 pointer-events-none"
              aria-hidden="true"
            />
            <input
              type="search"
              value={searchQuery}
              onChange={(e) => onChangeSearch(e.target.value)}
              placeholder="Search dishes or ingredients..."
              aria-label="Search menu dishes"
              className="w-full pl-10 pr-9 py-2.5 text-sm bg-white border border-[#E4E4E7] rounded-lg text-[#18181B] placeholder:text-[#71717A] focus:border-[#065F46] outline-none transition-colors"
            />
            {searchQuery && (
              <button
                type="button"
                onClick={() => onChangeSearch('')}
                aria-label="Clear search"
                className="absolute right-2.5 top-1/2 -translate-y-1/2 p-1 text-[#71717A] hover:text-[#18181B] cursor-pointer"
              >
                <X className="w-4 h-4" />
              </button>
            )}
          </div>
        </div>

        {/* Category Tabs + Dietary Filter Controls */}
        <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4 pb-8 border-b border-[#E4E4E7]">
          <div
            role="tablist"
            aria-label="Menu categories"
            className="flex flex-wrap items-center gap-1.5 p-1 bg-[#F4F4F5] rounded-lg w-fit"
          >
            {CATEGORIES.map((cat) => {
              const isActive = activeCategory === cat.id;
              return (
                <button
                  key={cat.id}
                  type="button"
                  role="tab"
                  aria-selected={isActive}
                  onClick={() => onSelectCategory(cat.id)}
                  className={`px-3.5 py-2 text-xs font-semibold rounded-md transition-colors whitespace-nowrap shrink-0 cursor-pointer ${
                    isActive
                      ? 'bg-white text-[#18181B] shadow-xs'
                      : 'text-[#52525B] hover:text-[#18181B]'
                  }`}
                >
                  {cat.label}
                </button>
              );
            })}
          </div>

          <div className="flex flex-wrap items-center gap-2">
            <span className="inline-flex items-center gap-1.5 text-xs font-medium text-[#71717A] mr-1">
              <SlidersHorizontal className="w-3.5 h-3.5" aria-hidden="true" />
              <span>Filter:</span>
            </span>

            <button
              type="button"
              onClick={onToggleFeaturedOnly}
              aria-pressed={featuredOnly}
              className={`px-3 py-1.5 text-xs font-medium rounded-md border transition-colors whitespace-nowrap shrink-0 cursor-pointer ${
                featuredOnly
                  ? 'bg-[#065F46] text-white border-[#065F46]'
                  : 'bg-white text-[#52525B] border-[#E4E4E7] hover:border-[#A1A1AA] hover:text-[#18181B]'
              }`}
            >
              House Favorites
            </button>

            {DIETARY_OPTIONS.map((tag) => {
              const selected = activeDietary.includes(tag);
              return (
                <button
                  key={tag}
                  type="button"
                  onClick={() => onToggleDietary(tag)}
                  aria-pressed={selected}
                  className={`px-3 py-1.5 text-xs font-medium rounded-md border transition-colors whitespace-nowrap shrink-0 cursor-pointer ${
                    selected
                      ? 'bg-[#18181B] text-white border-[#18181B]'
                      : 'bg-white text-[#52525B] border-[#E4E4E7] hover:border-[#A1A1AA] hover:text-[#18181B]'
                  }`}
                >
                  {tag === 'Gluten-Free Option' ? 'Gluten-Free' : tag}
                </button>
              );
            })}

            {hasActiveFilters && (
              <button
                type="button"
                onClick={onResetFilters}
                className="px-2.5 py-1.5 text-xs font-medium text-[#52525B] hover:text-[#18181B] underline underline-offset-4 whitespace-nowrap cursor-pointer"
              >
                Reset
              </button>
            )}
          </div>
        </div>

        {/* Product Grid */}
        {items.length === 0 ? (
          <div className="my-12 bg-white border border-[#E4E4E7] rounded-xl p-12 text-center">
            <p className="font-display text-xl font-semibold text-[#18181B]">
              No dishes match your current filters
            </p>
            <p className="mt-2 text-sm text-[#52525B]">
              Try clearing your search term or dietary filters to browse all 9 seasonal dishes.
            </p>
            <button
              type="button"
              onClick={onResetFilters}
              className="mt-6 px-5 py-2.5 text-sm font-semibold text-white bg-[#065F46] hover:bg-[#047857] rounded-lg transition-colors cursor-pointer"
            >
              Show All Dishes
            </button>
          </div>
        ) : (
          <div className="mt-8 grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-7">
            {items.map((item) => {
              const inBagEntries = getCartEntriesForDish(item.id);
              const totalQtyInBag = inBagEntries.reduce((sum, e) => sum + e.quantity, 0);
              const lastCartEntry = inBagEntries[inBagEntries.length - 1];

              return (
                <article
                  key={item.id}
                  className="group bg-white border border-[#E4E4E7] rounded-xl overflow-hidden flex flex-col transition-transform duration-200 hover:-translate-y-0.5"
                >
                  {/* Image Container (4:3 uniform aspect) */}
                  <button
                    type="button"
                    onClick={() => onOpenDish(item)}
                    aria-label={`Customize ${item.name}`}
                    className="relative aspect-[4/3] w-full overflow-hidden bg-[#F4F4F5] block text-left cursor-pointer"
                  >
                    <SafeImage
                      src={item.image}
                      alt={item.name}
                      className="w-full h-full object-cover transition-transform duration-300 group-hover:scale-[1.03]"
                    />
                  </button>

                  {/* Card Body — Identical Field Order */}
                  <div className="p-5 flex-1 flex flex-col justify-between gap-4">
                    <div>
                      {/* Clean Unboxed Metadata Line (Zero Pills) */}
                      <div className="flex items-center gap-2 text-xs text-[#52525B] mb-1.5">
                        <span className="uppercase tracking-wider font-medium text-[#71717A]">
                          {item.categoryLabel}
                        </span>
                        <span aria-hidden="true">·</span>
                        <span className="tabular-nums">{item.prepMinutes} min</span>
                        {item.tag && (
                          <>
                            <span aria-hidden="true">·</span>
                            <span className="font-medium text-[#065F46]">{item.tag}</span>
                          </>
                        )}
                      </div>

                      {/* Title */}
                      <button
                        type="button"
                        onClick={() => onOpenDish(item)}
                        className="text-left block w-full cursor-pointer"
                      >
                        <h3 className="font-display text-lg font-semibold text-[#18181B] group-hover:text-[#065F46] transition-colors leading-snug">
                          {item.name}
                        </h3>
                      </button>

                      {/* 2-line Description */}
                      <p className="mt-2 text-sm text-[#52525B] leading-relaxed line-clamp-2">
                        {item.description}
                      </p>
                    </div>

                    {/* Price & Action Footer */}
                    <div className="pt-3 border-t border-[#F4F4F5] flex items-center justify-between gap-3">
                      <span className="text-base font-semibold text-[#18181B] tabular-nums">
                        ${item.price.toFixed(2)}
                      </span>

                      <div className="flex items-center gap-2 shrink-0">
                        <button
                          type="button"
                          onClick={() => onOpenDish(item)}
                          className="px-3 py-2 text-xs font-medium text-[#52525B] hover:text-[#18181B] border border-[#E4E4E7] hover:border-[#A1A1AA] rounded-lg transition-colors whitespace-nowrap cursor-pointer min-h-[38px]"
                        >
                          Customize
                        </button>

                        {totalQtyInBag > 0 && lastCartEntry ? (
                          <div className="inline-flex items-center border border-[#065F46] rounded-lg bg-[#065F46] text-white min-h-[38px]">
                            <button
                              type="button"
                              onClick={() => onUpdateCartQuantity(lastCartEntry.cartKey, -1)}
                              aria-label={`Decrease quantity of ${item.name}`}
                              className="px-2.5 py-2 hover:bg-[#047857] rounded-l-lg transition-colors cursor-pointer"
                            >
                              <Minus className="w-3.5 h-3.5" />
                            </button>
                            <span className="px-2 text-xs font-semibold tabular-nums min-w-[24px] text-center">
                              {totalQtyInBag}
                            </span>
                            <button
                              type="button"
                              onClick={() => onUpdateCartQuantity(lastCartEntry.cartKey, 1)}
                              aria-label={`Increase quantity of ${item.name}`}
                              className="px-2.5 py-2 hover:bg-[#047857] rounded-r-lg transition-colors cursor-pointer"
                            >
                              <Plus className="w-3.5 h-3.5" />
                            </button>
                          </div>
                        ) : (
                          <button
                            type="button"
                            onClick={() => onQuickAdd(item)}
                            className="inline-flex items-center gap-1.5 px-3.5 py-2 text-xs font-semibold text-white bg-[#065F46] hover:bg-[#047857] rounded-lg transition-colors whitespace-nowrap cursor-pointer min-h-[38px]"
                          >
                            <Plus className="w-3.5 h-3.5" aria-hidden="true" />
                            <span>Add</span>
                          </button>
                        )}
                      </div>
                    </div>
                  </div>
                </article>
              );
            })}
          </div>
        )}
      </div>
    </section>
  );
}
