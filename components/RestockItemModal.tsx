import React, { useState, useEffect } from 'react';
import { InventoryItem } from '../types';
import { useSiteSettings } from '../context/SiteSettingsContext';

interface RestockItemModalProps {
  item: InventoryItem;
  isOpen: boolean;
  onClose: () => void;
  onAddToPurchaseList: (item: InventoryItem, quantityToBuy: number, supplier?: string, estimatedPrice?: number) => void;
}

const RestockItemModal: React.FC<RestockItemModalProps> = ({ item, isOpen, onClose, onAddToPurchaseList }) => {
  const [quantityToBuy, setQuantityToBuy] = useState(1);
  const [supplier, setSupplier] = useState(item.supplier || '');
  const [estimatedPrice, setEstimatedPrice] = useState(item.lastPurchasePrice || 0);
  const { currencySymbol } = useSiteSettings();

  useEffect(() => {
    if (isOpen) {
      setQuantityToBuy(Math.max(1, item.lowStockThreshold > item.quantity ? item.lowStockThreshold - item.quantity : 1));
      setSupplier(item.supplier || '');
      setEstimatedPrice(item.lastPurchasePrice || 0);
    }
  }, [isOpen, item]);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (quantityToBuy <= 0) {
      alert("Quantity to buy must be greater than zero.");
      return;
    }
    onAddToPurchaseList(item, quantityToBuy, supplier, estimatedPrice > 0 ? estimatedPrice : undefined);
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-[120] p-4">
      <div className="bg-white dark:bg-secondary p-6 rounded-lg shadow-xl w-full max-w-md">
        <div className="flex justify-between items-center mb-4">
          <h3 className="text-xl font-semibold text-gray-800 dark:text-gray-200">Re-stock: {item.name}</h3>
          <button onClick={onClose} className="text-gray-500 dark:text-gray-400 hover:text-gray-700 dark:hover:text-gray-200 p-1">&times;</button>
        </div>
        <p className="text-sm text-gray-600 dark:text-gray-300 mb-1">Current Stock: {item.quantity} {item.unit}</p>
        <p className="text-sm text-gray-600 dark:text-gray-300 mb-4">Low Stock Threshold: {item.lowStockThreshold} {item.unit}</p>
        
        <form onSubmit={handleSubmit} className="space-y-4 text-sm">
          <div>
            <label htmlFor="quantityToBuy" className="block text-xs font-medium text-gray-700 dark:text-gray-300">Quantity to Buy*</label>
            <input
              type="number"
              id="quantityToBuy"
              value={quantityToBuy}
              onChange={(e) => setQuantityToBuy(Math.max(1, parseInt(e.target.value)))}
              min="1"
              required
              className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-primary focus:border-primary dark:bg-secondary-dark dark:border-gray-600 dark:text-white"
              inputMode="numeric"
            />
          </div>
          <div>
            <label htmlFor="supplier" className="block text-xs font-medium text-gray-700 dark:text-gray-300">Supplier (Optional)</label>
            <input
              type="text"
              id="supplier"
              value={supplier}
              onChange={(e) => setSupplier(e.target.value)}
              placeholder={item.supplier || "Enter supplier name"}
              className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-primary focus:border-primary dark:bg-secondary-dark dark:border-gray-600 dark:text-white"
            />
          </div>
          <div>
            <label htmlFor="estimatedPrice" className="block text-xs font-medium text-gray-700 dark:text-gray-300">Estimated Price ({currencySymbol}) per {item.unit} (Optional)</label>
            <input
              type="number"
              id="estimatedPrice"
              value={estimatedPrice}
              onChange={(e) => setEstimatedPrice(parseFloat(e.target.value))}
              min="0"
              step="0.01"
              placeholder={item.lastPurchasePrice ? String(item.lastPurchasePrice) : "Enter price"}
              className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-primary focus:border-primary dark:bg-secondary-dark dark:border-gray-600 dark:text-white"
              inputMode="decimal"
            />
          </div>
          <div className="flex justify-end space-x-3 pt-2">
            <button
              type="button"
              onClick={onClose}
              className="bg-gray-200 hover:bg-gray-300 text-gray-700 font-semibold py-2 px-4 rounded-lg transition-colors text-xs dark:bg-gray-600 dark:hover:bg-gray-500 dark:text-gray-200"
            >
              Cancel
            </button>
            <button
              type="submit"
              className="bg-secondary hover:bg-secondary-dark text-white font-semibold py-2 px-4 rounded-lg transition-colors text-xs"
            >
              Add to Purchase List
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default RestockItemModal;