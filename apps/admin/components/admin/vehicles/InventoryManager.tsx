'use client';

import { useState } from 'react';
import { Package, MapPin, AlertTriangle, TrendingUp } from 'lucide-react';

interface InventoryManagerProps {
  inventory: any;
  onChange: (inventory: any) => void;
}

export default function InventoryManager({ inventory, onChange }: InventoryManagerProps) {
  const [inventoryData, setInventoryData] = useState(inventory || {
    stock: 0,
    lowStockThreshold: 5,
    sku: '',
    location: '',
    warehouseLocation: '',
    reorderPoint: 3,
    maxStock: 50,
    reservedStock: 0,
    availableStock: 0,
    incomingStock: 0,
    expectedDate: '',
  });

  const handleChange = (field: string, value: any) => {
    const newInventory = { ...inventoryData, [field]: value };
    
    // Calculate available stock
    newInventory.availableStock = newInventory.stock - newInventory.reservedStock;
    
    setInventoryData(newInventory);
    onChange(newInventory);
  };

  const getStockStatus = () => {
    if (inventoryData.stock === 0) {
      return { color: 'red', label: 'Out of Stock', icon: AlertTriangle };
    } else if (inventoryData.stock <= inventoryData.lowStockThreshold) {
      return { color: 'yellow', label: 'Low Stock', icon: AlertTriangle };
    } else {
      return { color: 'green', label: 'In Stock', icon: Package };
    }
  };

  const status = getStockStatus();
  const StatusIcon = status.icon;

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-xl font-semibold text-gray-900 mb-4">Inventory Management</h2>
        <p className="text-sm text-gray-500">
          Manage stock levels and warehouse locations
        </p>
      </div>

      {/* Stock Status Overview */}
      <div className={`bg-${status.color}-50 border-2 border-${status.color}-200 rounded-lg p-6`}>
        <div className="flex items-center gap-3 mb-4">
          <div className={`w-12 h-12 rounded-full bg-${status.color}-100 flex items-center justify-center`}>
            <StatusIcon className={`w-6 h-6 text-${status.color}-600`} />
          </div>
          <div>
            <h3 className={`font-semibold text-${status.color}-900`}>Current Status: {status.label}</h3>
            <p className={`text-sm text-${status.color}-700`}>
              {inventoryData.availableStock} units available for sale
            </p>
          </div>
        </div>
        
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 text-center">
          <div>
            <div className={`text-2xl font-bold text-${status.color}-900`}>{inventoryData.stock}</div>
            <div className={`text-xs text-${status.color}-700 mt-1`}>Total Stock</div>
          </div>
          <div>
            <div className={`text-2xl font-bold text-${status.color}-900`}>{inventoryData.availableStock}</div>
            <div className={`text-xs text-${status.color}-700 mt-1`}>Available</div>
          </div>
          <div>
            <div className={`text-2xl font-bold text-${status.color}-900`}>{inventoryData.reservedStock}</div>
            <div className={`text-xs text-${status.color}-700 mt-1`}>Reserved</div>
          </div>
          <div>
            <div className={`text-2xl font-bold text-${status.color}-900`}>{inventoryData.incomingStock}</div>
            <div className={`text-xs text-${status.color}-700 mt-1`}>Incoming</div>
          </div>
        </div>
      </div>

      {/* Stock Management */}
      <div className="bg-gray-50 border border-gray-200 rounded-lg p-6 space-y-4">
        <h3 className="font-semibold text-gray-900">Stock Levels</h3>
        
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Current Stock *
            </label>
            <input
              type="number"
              value={inventoryData.stock}
              onChange={(e) => handleChange('stock', parseInt(e.target.value) || 0)}
              className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-geely-blue focus:border-transparent"
              placeholder="0"
              min="0"
              required
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Reserved Stock
            </label>
            <input
              type="number"
              value={inventoryData.reservedStock}
              onChange={(e) => handleChange('reservedStock', parseInt(e.target.value) || 0)}
              className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-geely-blue focus:border-transparent"
              placeholder="0"
              min="0"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Low Stock Threshold
            </label>
            <input
              type="number"
              value={inventoryData.lowStockThreshold}
              onChange={(e) => handleChange('lowStockThreshold', parseInt(e.target.value) || 0)}
              className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-geely-blue focus:border-transparent"
              placeholder="5"
              min="0"
            />
          </div>
        </div>
      </div>

      {/* Product Identification */}
      <div className="bg-gray-50 border border-gray-200 rounded-lg p-6 space-y-4">
        <h3 className="font-semibold text-gray-900">Product Identification</h3>
        
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              SKU (Stock Keeping Unit) *
            </label>
            <input
              type="text"
              value={inventoryData.sku}
              onChange={(e) => handleChange('sku', e.target.value)}
              className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-geely-blue focus:border-transparent"
              placeholder="e.g., COOL-2024-001"
              required
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Warehouse Location
            </label>
            <div className="relative">
              <MapPin className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
              <input
                type="text"
                value={inventoryData.warehouseLocation}
                onChange={(e) => handleChange('warehouseLocation', e.target.value)}
                className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-geely-blue focus:border-transparent"
                placeholder="e.g., Warehouse A, Bay 12"
              />
            </div>
          </div>
        </div>
      </div>

      {/* Reorder Management */}
      <div className="bg-gray-50 border border-gray-200 rounded-lg p-6 space-y-4">
        <h3 className="font-semibold text-gray-900">Reorder Management</h3>
        
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Reorder Point
            </label>
            <input
              type="number"
              value={inventoryData.reorderPoint}
              onChange={(e) => handleChange('reorderPoint', parseInt(e.target.value) || 0)}
              className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-geely-blue focus:border-transparent"
              placeholder="3"
              min="0"
            />
            <p className="text-xs text-gray-500 mt-1">Alert when stock falls below this level</p>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Maximum Stock
            </label>
            <input
              type="number"
              value={inventoryData.maxStock}
              onChange={(e) => handleChange('maxStock', parseInt(e.target.value) || 0)}
              className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-geely-blue focus:border-transparent"
              placeholder="50"
              min="0"
            />
            <p className="text-xs text-gray-500 mt-1">Maximum units to keep in stock</p>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Incoming Stock
            </label>
            <input
              type="number"
              value={inventoryData.incomingStock}
              onChange={(e) => handleChange('incomingStock', parseInt(e.target.value) || 0)}
              className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-geely-blue focus:border-transparent"
              placeholder="0"
              min="0"
            />
            <p className="text-xs text-gray-500 mt-1">Units on order from supplier</p>
          </div>
        </div>

        {inventoryData.incomingStock > 0 && (
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Expected Delivery Date
            </label>
            <input
              type="date"
              value={inventoryData.expectedDate}
              onChange={(e) => handleChange('expectedDate', e.target.value)}
              className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-geely-blue focus:border-transparent"
            />
          </div>
        )}
      </div>

      {/* Alerts */}
      {inventoryData.stock <= inventoryData.reorderPoint && (
        <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4 flex items-start gap-3">
          <AlertTriangle className="w-5 h-5 text-yellow-600 flex-shrink-0 mt-0.5" />
          <div>
            <h4 className="font-medium text-yellow-900">Reorder Alert</h4>
            <p className="text-sm text-yellow-700 mt-1">
              Stock level has reached the reorder point. Consider placing a new order.
            </p>
          </div>
        </div>
      )}
    </div>
  );
}
