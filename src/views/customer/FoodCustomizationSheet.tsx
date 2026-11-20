import React, { useMemo, useState } from 'react';
import { Minus, Plus, X } from 'lucide-react';
import {
  calculateCartItemUnitPrice,
  formatCurrency,
} from '../../domain/serveqrLogic';
import type { CartItem, MenuItem, SelectedCustomization } from '../../domain/types';
import { FoodImage } from '../../components/FoodImage';
import { VegIndicator } from '../../components/StatusText';

interface FoodCustomizationSheetProps {
  item: MenuItem;
  currencySymbol: string;
  initialCartItem?: CartItem | null;
  onClose: () => void;
  onConfirm: (payload: {
    selectedCustomizations: SelectedCustomization[];
    specialInstructions: string;
    quantity: number;
  }) => void;
}

export const FoodCustomizationSheet: React.FC<FoodCustomizationSheetProps> = ({
  item,
  currencySymbol,
  initialCartItem,
  onClose,
  onConfirm,
}) => {
  const defaultSelections = useMemo<SelectedCustomization[]>(() => {
    if (initialCartItem) return initialCartItem.selectedCustomizations;
    const initial: SelectedCustomization[] = [];
    for (const group of item.customizations) {
      if (group.type === 'single' && group.required && group.choices.length > 0) {
        const defaultChoice = group.choices[Math.min(1, group.choices.length - 1)] ?? group.choices[0];
        initial.push({
          groupId: group.id,
          groupName: group.name,
          choiceId: defaultChoice.id,
          choiceLabel: defaultChoice.label,
          priceDelta: defaultChoice.priceDelta,
        });
      }
    }
    return initial;
  }, [initialCartItem, item.customizations]);

  const [selected, setSelected] = useState<SelectedCustomization[]>(defaultSelections);
  const [instructions, setInstructions] = useState(
    initialCartItem?.specialInstructions ?? ''
  );
  const [quantity, setQuantity] = useState(initialCartItem?.quantity ?? 1);

  const unitPrice = calculateCartItemUnitPrice(item.price, selected);
  const totalPrice = unitPrice * quantity;

  const isChoiceSelected = (groupId: string, choiceId: string) =>
    selected.some((s) => s.groupId === groupId && s.choiceId === choiceId);

  const handleToggleChoice = (
    groupId: string,
    groupName: string,
    type: 'single' | 'multiple',
    choice: { id: string; label: string; priceDelta: number }
  ) => {
    setSelected((prev) => {
      const exists = prev.some((s) => s.groupId === groupId && s.choiceId === choice.id);
      if (type === 'single') {
        const withoutGroup = prev.filter((s) => s.groupId !== groupId);
        return [
          ...withoutGroup,
          {
            groupId,
            groupName,
            choiceId: choice.id,
            choiceLabel: choice.label,
            priceDelta: choice.priceDelta,
          },
        ];
      }
      if (exists) {
        return prev.filter((s) => !(s.groupId === groupId && s.choiceId === choice.id));
      }
      return [
        ...prev,
        {
          groupId,
          groupName,
          choiceId: choice.id,
          choiceLabel: choice.label,
          priceDelta: choice.priceDelta,
        },
      ];
    });
  };

  return (
    <div
      className="fixed inset-0 z-50 bg-slate-900/55 flex items-end sm:items-center justify-center sm:p-4"
      role="dialog"
      aria-modal="true"
      aria-labelledby="custom-dish-title"
    >
      <div className="w-full sm:max-w-lg bg-white rounded-t-3xl sm:rounded-2xl border border-slate-200 overflow-hidden max-h-[90vh] flex flex-col">
        {/* Mobile grab handle */}
        <div className="sm:hidden pt-3 pb-1 flex justify-center">
          <span className="w-10 h-1.5 rounded-full bg-slate-300" />
        </div>

        {/* Header */}
        <div className="px-5 py-3.5 border-b border-slate-200 flex items-center justify-between gap-3">
          <div className="flex items-center gap-3 min-w-0">
            <FoodImage
              src={item.imageUrl}
              alt={item.name}
              className="w-12 h-12 rounded-lg shrink-0"
            />
            <div className="min-w-0">
              <div className="flex items-center gap-1.5">
                <VegIndicator isVeg={item.isVeg} />
                <h2
                  id="custom-dish-title"
                  className="font-display font-bold text-[#172B4D] text-base truncate"
                >
                  {item.name}
                </h2>
              </div>
              <p className="text-xs font-mono text-slate-500 mt-0.5 tabular-nums">
                Base {formatCurrency(item.price, currencySymbol)} · {item.prepTimeMinutes} min prep
              </p>
            </div>
          </div>
          <button
            type="button"
            onClick={onClose}
            aria-label="Close customization"
            className="min-h-[44px] min-w-[44px] flex items-center justify-center text-slate-500 hover:text-[#172B4D] cursor-pointer"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Scrollable options */}
        <div className="p-5 overflow-y-auto space-y-5 flex-1">
          {item.description && (
            <p className="text-xs text-slate-600 leading-relaxed">{item.description}</p>
          )}

          {item.customizations.map((group) => (
            <fieldset key={group.id} className="space-y-2.5">
              <legend className="text-sm font-bold text-[#172B4D] flex items-center justify-between w-full">
                <span>{group.name}</span>
                <span className="text-xs font-normal text-slate-500">
                  {group.required ? 'Required' : 'Optional'}
                </span>
              </legend>
              <div className="space-y-2">
                {group.choices.map((choice) => {
                  const checked = isChoiceSelected(group.id, choice.id);
                  return (
                    <label
                      key={choice.id}
                      className={`min-h-[44px] px-3.5 py-2.5 rounded-xl border flex items-center justify-between gap-3 cursor-pointer transition-colors ${
                        checked
                          ? 'border-[#087F5B] bg-emerald-50/45'
                          : 'border-slate-200 hover:border-slate-300'
                      }`}
                    >
                      <span className="inline-flex items-center gap-2.5 text-sm text-[#202938]">
                        <input
                          type={group.type === 'single' ? 'radio' : 'checkbox'}
                          name={group.id}
                          checked={checked}
                          onChange={() =>
                            handleToggleChoice(group.id, group.name, group.type, choice)
                          }
                          className="w-4 h-4 text-[#087F5B] border-slate-300 focus:ring-[#087F5B]"
                        />
                        <span>{choice.label}</span>
                      </span>
                      <span className="font-mono text-xs text-slate-600 tabular-nums">
                        {choice.priceDelta > 0
                          ? `+${formatCurrency(choice.priceDelta, currencySymbol)}`
                          : 'Included'}
                      </span>
                    </label>
                  );
                })}
              </div>
            </fieldset>
          ))}

          <div>
            <label
              htmlFor="dish-special-instructions"
              className="block text-sm font-bold text-[#172B4D] mb-1.5"
            >
              Special Instructions
            </label>
            <textarea
              id="dish-special-instructions"
              rows={2}
              value={instructions}
              onChange={(e) => setInstructions(e.target.value)}
              placeholder="e.g., Less oil, serve raita separately, no onions..."
              className="w-full px-3.5 py-2.5 text-sm border border-slate-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-[#087F5B]/25 focus:border-[#087F5B]"
            />
          </div>
        </div>

        {/* Sticky Footer Action */}
        <div className="p-4 bg-white border-t border-slate-200 flex items-center gap-3">
          <div className="inline-flex items-center border border-slate-300 rounded-xl overflow-hidden shrink-0">
            <button
              type="button"
              onClick={() => setQuantity((q) => Math.max(1, q - 1))}
              aria-label="Decrease quantity"
              className="min-h-[44px] min-w-[40px] flex items-center justify-center text-slate-700 hover:bg-slate-100 cursor-pointer"
            >
              <Minus className="w-4 h-4" />
            </button>
            <span className="px-2.5 font-mono text-sm font-bold text-[#172B4D] tabular-nums">
              {quantity}
            </span>
            <button
              type="button"
              onClick={() => setQuantity((q) => q + 1)}
              aria-label="Increase quantity"
              className="min-h-[44px] min-w-[40px] flex items-center justify-center text-slate-700 hover:bg-slate-100 cursor-pointer"
            >
              <Plus className="w-4 h-4" />
            </button>
          </div>

          <button
            type="button"
            onClick={() =>
              onConfirm({
                selectedCustomizations: selected,
                specialInstructions: instructions,
                quantity,
              })
            }
            className="flex-1 min-h-[46px] px-4 text-sm font-semibold text-white bg-[#087F5B] hover:bg-[#06674A] rounded-xl transition-colors flex items-center justify-between cursor-pointer"
          >
            <span>{initialCartItem ? 'Update Cart' : 'Add to Cart'}</span>
            <span className="font-mono tabular-nums">
              {formatCurrency(totalPrice, currencySymbol)}
            </span>
          </button>
        </div>
      </div>
    </div>
  );
};
