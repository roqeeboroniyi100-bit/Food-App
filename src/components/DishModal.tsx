import { useEffect, useState } from 'react';
import { Check, Minus, Plus, X } from 'lucide-react';
import type { DishOption, MenuItem } from '../types/food.ts';
import { SafeImage } from './SafeImage.tsx';

interface DishModalProps {
  item: MenuItem | null;
  onClose: () => void;
  onAddToCart: (
    item: MenuItem,
    selectedOptions: DishOption[],
    quantity: number,
    specialInstructions: string,
  ) => void;
}

export function DishModal({ item, onClose, onAddToCart }: DishModalProps) {
  const [singleSelections, setSingleSelections] = useState<Record<string, string>>({});
  const [multiSelections, setMultiSelections] = useState<Record<string, boolean>>({});
  const [quantity, setQuantity] = useState(1);
  const [notes, setNotes] = useState('');

  useEffect(() => {
    if (!item) return;
    const defaults: Record<string, string> = {};
    for (const group of item.optionGroups) {
      if (group.type === 'single' && group.options.length > 0) {
        defaults[group.id] = group.options[0].id;
      }
    }
    setSingleSelections(defaults);
    setMultiSelections({});
    setQuantity(1);
    setNotes('');
  }, [item]);

  useEffect(() => {
    if (!item) return;
    const onKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') onClose();
    };
    window.addEventListener('keydown', onKeyDown);
    return () => window.removeEventListener('keydown', onKeyDown);
  }, [item, onClose]);

  if (!item) return null;

  const selectedOptions: DishOption[] = [];
  for (const group of item.optionGroups) {
    if (group.type === 'single') {
      const selectedId = singleSelections[group.id];
      const found = group.options.find((o) => o.id === selectedId);
      if (found) selectedOptions.push(found);
    } else {
      for (const opt of group.options) {
        if (multiSelections[opt.id]) {
          selectedOptions.push(opt);
        }
      }
    }
  }

  const optionsTotal = selectedOptions.reduce((sum, o) => sum + o.priceDelta, 0);
  const unitPrice = item.price + optionsTotal;
  const lineTotal = unitPrice * quantity;

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    onAddToCart(item, selectedOptions, quantity, notes.trim());
    onClose();
  };

  return (
    <div
      role="dialog"
      aria-modal="true"
      aria-labelledby="dish-modal-title"
      className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-[2px]"
      onClick={onClose}
    >
      <div
        className="bg-white border border-[#E4E4E7] rounded-2xl w-full max-w-2xl max-h-[90vh] overflow-hidden flex flex-col shadow-xl"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Top Photo Banner */}
        <div className="relative h-56 sm:h-64 bg-[#F4F4F5] shrink-0">
          <SafeImage src={item.image} alt={item.name} className="w-full h-full object-cover" />
          <button
            type="button"
            onClick={onClose}
            aria-label="Close dish customization"
            className="absolute top-4 right-4 w-9 h-9 rounded-full bg-white/95 text-[#18181B] border border-[#E4E4E7] flex items-center justify-center hover:bg-white transition-colors cursor-pointer"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Scrollable Content */}
        <form onSubmit={handleSubmit} className="flex-1 overflow-y-auto flex flex-col">
          <div className="p-6 space-y-6 flex-1">
            <div>
              <div className="flex flex-wrap items-center gap-2 text-xs text-[#52525B] mb-2">
                <span className="uppercase tracking-wider font-medium text-[#71717A]">
                  {item.categoryLabel}
                </span>
                <span aria-hidden="true">·</span>
                <span className="tabular-nums">{item.calories} kcal</span>
                <span aria-hidden="true">·</span>
                <span className="tabular-nums">{item.prepMinutes} min prep</span>
                {item.dietary.length > 0 && (
                  <>
                    <span aria-hidden="true">·</span>
                    <span>{item.dietary.join(' · ')}</span>
                  </>
                )}
              </div>

              <div className="flex items-start justify-between gap-4">
                <h2
                  id="dish-modal-title"
                  className="font-display text-2xl font-semibold text-[#18181B]"
                >
                  {item.name}
                </h2>
                <span className="text-lg font-semibold text-[#18181B] tabular-nums shrink-0">
                  ${item.price.toFixed(2)}
                </span>
              </div>

              <p className="mt-2.5 text-sm text-[#52525B] leading-relaxed">{item.description}</p>
              <p className="mt-2 text-xs text-[#71717A]">
                <span className="font-medium text-[#52525B]">Ingredients:</span> {item.ingredients}
                {' · '}
                <span className="font-medium text-[#52525B]">Allergens:</span> {item.allergens}
              </p>
            </div>

            {/* Option Groups */}
            {item.optionGroups.map((group) => (
              <div key={group.id} className="pt-5 border-t border-[#E4E4E7]">
                <div className="flex items-center justify-between mb-3">
                  <h3 className="font-sans text-sm font-semibold text-[#18181B]">{group.title}</h3>
                  <span className="text-xs text-[#71717A]">
                    {group.required ? 'Required · Choose 1' : 'Optional'}
                  </span>
                </div>

                <div className="space-y-2">
                  {group.options.map((opt) => {
                    const isChecked =
                      group.type === 'single'
                        ? singleSelections[group.id] === opt.id
                        : Boolean(multiSelections[opt.id]);

                    return (
                      <label
                        key={opt.id}
                        className={`flex items-center justify-between gap-3 px-4 py-3 rounded-lg border cursor-pointer transition-colors ${
                          isChecked
                            ? 'border-[#065F46] bg-[#065F46]/[0.04]'
                            : 'border-[#E4E4E7] hover:border-[#A1A1AA] bg-white'
                        }`}
                      >
                        <div className="flex items-center gap-3">
                          <input
                            type={group.type === 'single' ? 'radio' : 'checkbox'}
                            name={`group-${group.id}`}
                            checked={isChecked}
                            onChange={() => {
                              if (group.type === 'single') {
                                setSingleSelections((prev) => ({ ...prev, [group.id]: opt.id }));
                              } else {
                                setMultiSelections((prev) => ({
                                  ...prev,
                                  [opt.id]: !prev[opt.id],
                                }));
                              }
                            }}
                            className="sr-only"
                          />
                          <span
                            className={`w-4 h-4 flex items-center justify-center border shrink-0 ${
                              group.type === 'single' ? 'rounded-full' : 'rounded'
                            } ${
                              isChecked
                                ? 'bg-[#065F46] border-[#065F46] text-white'
                                : 'border-[#A1A1AA] bg-white'
                            }`}
                          >
                            {isChecked && <Check className="w-3 h-3" />}
                          </span>
                          <span className="text-sm font-medium text-[#18181B]">{opt.label}</span>
                        </div>

                        <span className="text-sm text-[#52525B] tabular-nums">
                          {opt.priceDelta > 0 ? `+$${opt.priceDelta.toFixed(2)}` : 'Included'}
                        </span>
                      </label>
                    );
                  })}
                </div>
              </div>
            ))}

            {/* Special Instructions */}
            <div className="pt-5 border-t border-[#E4E4E7]">
              <label
                htmlFor="special-notes"
                className="block text-sm font-semibold text-[#18181B] mb-2"
              >
                Special Kitchen Instructions
              </label>
              <textarea
                id="special-notes"
                rows={2}
                maxLength={200}
                value={notes}
                onChange={(e) => setNotes(e.target.value)}
                placeholder="e.g., Sauce on the side, extra crispy crust, no sesame..."
                className="w-full px-3.5 py-2.5 text-sm bg-[#FAFAFA] border border-[#E4E4E7] rounded-lg text-[#18181B] placeholder:text-[#71717A] focus:bg-white focus:border-[#065F46] outline-none resize-none"
              />
            </div>
          </div>

          {/* Sticky Bottom Purchase Bar */}
          <div className="p-4 sm:px-6 border-t border-[#E4E4E7] bg-white flex items-center justify-between gap-4 shrink-0">
            <div className="inline-flex items-center border border-[#E4E4E7] rounded-lg bg-[#FAFAFA]">
              <button
                type="button"
                onClick={() => setQuantity((q) => Math.max(1, q - 1))}
                aria-label="Decrease quantity"
                className="p-3 text-[#18181B] hover:bg-[#F4F4F5] rounded-l-lg cursor-pointer"
              >
                <Minus className="w-4 h-4" />
              </button>
              <span className="px-3 text-sm font-semibold tabular-nums min-w-[32px] text-center">
                {quantity}
              </span>
              <button
                type="button"
                onClick={() => setQuantity((q) => Math.min(20, q + 1))}
                aria-label="Increase quantity"
                className="p-3 text-[#18181B] hover:bg-[#F4F4F5] rounded-r-lg cursor-pointer"
              >
                <Plus className="w-4 h-4" />
              </button>
            </div>

            <button
              type="submit"
              className="flex-1 py-3 px-6 text-sm font-semibold text-white bg-[#065F46] hover:bg-[#047857] rounded-lg transition-colors tabular-nums cursor-pointer min-h-[44px]"
            >
              Add to Bag — ${lineTotal.toFixed(2)}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
