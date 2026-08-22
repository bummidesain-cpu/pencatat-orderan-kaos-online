import React from 'react';
import {
  AlertTriangle,
  ArrowRight,
  CheckCircle2,
  Clock,
  Kanban,
  Package,
  Printer,
  Scissors,
  Shirt,
} from 'lucide-react';
import { formatDateShort, getDeadlineInfo } from '../../lib/utils';
import { Order, ProductionStage } from '../../types';

interface ProductionBoardProps {
  orders: Order[];
  onUpdateStage?: (orderId: string, newStage: ProductionStage) => void;
  onStageChange?: (orderId: string, newStage: ProductionStage) => void;
  onSelectOrder: (order: Order) => void;
  onPrintSPK?: (order: Order) => void;
  userRole?: string;
}

export const ProductionBoard: React.FC<ProductionBoardProps> = ({
  orders,
  onUpdateStage,
  onStageChange,
  onSelectOrder,
  onPrintSPK,
  userRole,
}) => {
  const handleStageUpdate = (orderId: string, newStage: ProductionStage) => {
    if (typeof onUpdateStage === 'function') {
      onUpdateStage(orderId, newStage);
    } else if (typeof onStageChange === 'function') {
      onStageChange(orderId, newStage);
    }
  };
  const kanbanColumns: { id: string; label: ProductionStage; color: string }[] = [
    { id: 'col-1', label: 'Order Masuk', color: 'bg-amber-500' },
    { id: 'col-2', label: 'Belanja bahan', color: 'bg-blue-500' },
    { id: 'col-3', label: 'Potong', color: 'bg-orange-500' },
    { id: 'col-4', label: 'Proofing', color: 'bg-yellow-500' },
    { id: 'col-5', label: 'Sablon', color: 'bg-indigo-600' },
    { id: 'col-6', label: 'Finishing sablon', color: 'bg-cyan-600' },
    { id: 'col-7', label: 'Jahit', color: 'bg-purple-600' },
    { id: 'col-8', label: 'QC', color: 'bg-emerald-600' },
    { id: 'col-9', label: 'Selesai', color: 'bg-green-700' },
  ];

  return (
    <div className="space-y-6 pb-12 animate-fadeIn">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h2 className="text-2xl font-black text-slate-900 dark:text-white tracking-tight">
            Production Board (Kanban Sablon & Konveksi)
          </h2>
          <p className="text-xs text-slate-500 mt-1">
            Pantau progress dari order masuk, belanja bahan, potong, proofing, sablon, finishing, jahit, QC hingga selesai
          </p>
        </div>
      </div>

      {/* Kanban Horizontal Scroll Container */}
      <div className="flex overflow-x-auto gap-4 pb-6 min-h-[70vh] scrollbar-thin">
        {kanbanColumns.map((col) => {
          const columnOrders = orders.filter((o) => {
            return o.productionStage === col.label;
          });

          return (
            <div
              key={col.id}
              className="w-72 shrink-0 rounded-2xl bg-slate-100/80 p-3 border border-slate-200/80 flex flex-col justify-between dark:bg-slate-800/50 dark:border-slate-800"
            >
              {/* Column Header */}
              <div>
                <div className="flex items-center justify-between pb-3 mb-3 border-b border-slate-200 dark:border-slate-700">
                  <div className="flex items-center gap-2">
                    <span className={`h-3 w-3 rounded-full ${col.color}`} />
                    <h3 className="font-extrabold text-xs text-slate-800 dark:text-slate-200 uppercase tracking-wider">
                      {col.label}
                    </h3>
                  </div>
                  <span className="rounded-full bg-slate-200 px-2 py-0.5 text-[10px] font-black text-slate-700 dark:bg-slate-700 dark:text-slate-200">
                    {columnOrders.length}
                  </span>
                </div>

                {/* Column Cards */}
                <div className="space-y-3 max-h-[60vh] overflow-y-auto pr-1">
                  {columnOrders.map((ord) => {
                    const deadline = getDeadlineInfo(ord.deadline, ord.productionStage === 'Selesai');
                    return (
                      <div
                        key={ord.id}
                        className={`rounded-xl p-4 shadow-xs border hover:shadow-md transition dark:bg-slate-900 space-y-2.5 ${
                          deadline.isOverdue ? 'bg-red-50/40 border-red-300 dark:border-red-900' : 'bg-white border-slate-200/90 dark:border-slate-800'
                        }`}
                      >
                        <div className="flex items-center justify-between">
                          <span
                            onClick={() => onSelectOrder(ord)}
                            className="font-mono font-black text-xs text-indigo-600 dark:text-indigo-400 hover:underline cursor-pointer flex items-center gap-1.5"
                          >
                            {ord.orderNumber}
                            {deadline.isOverdue && (
                              <span className="flex h-2 w-2 relative" title="Terlambat / Melewati Deadline">
                                <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-red-400 opacity-75"></span>
                                <span className="relative inline-flex rounded-full h-2 w-2 bg-red-600"></span>
                              </span>
                            )}
                          </span>
                          <span className={`px-2 py-0.5 rounded-full text-[10px] font-black ${deadline.badgeClass}`}>
                            {deadline.status}
                          </span>
                        </div>

                        <div>
                          <h4 className="font-extrabold text-xs text-slate-900 dark:text-white truncate">
                            {ord.customerName}
                          </h4>
                          <p className="text-[11px] text-slate-500 font-medium truncate">
                            {ord.items[0]?.productName}
                          </p>
                        </div>

                        <div className="flex items-center justify-between text-[11px] text-slate-600 bg-slate-50 p-2 rounded-lg border border-slate-100 dark:bg-slate-800 dark:border-slate-700">
                          <div className="flex items-center gap-1.5 truncate">
                            <span className="font-extrabold text-slate-900 dark:text-white">{ord.items.reduce((s, i) => s + i.quantity, 0)} pcs</span>
                            {ord.items[0]?.modelCategory && (
                              <span className="text-[9px] font-bold bg-indigo-100 text-indigo-800 px-1.5 py-0.5 rounded dark:bg-indigo-950 dark:text-indigo-300 truncate">
                                {ord.items[0].modelCategory}
                              </span>
                            )}
                          </div>
                          <span className="text-slate-400 font-mono text-[10px] shrink-0">DL: {formatDateShort(ord.deadline)}</span>
                        </div>

                        {/* Move Stage Selector & Print SPK */}
                        <div className="pt-2 border-t border-slate-100 dark:border-slate-800 flex items-center justify-between gap-1">
                          <select
                            value={ord.productionStage}
                            disabled={userRole === 'admin'}
                            onChange={(e) => handleStageUpdate(ord.id, e.target.value as ProductionStage)}
                            className={`text-[10px] font-bold rounded-lg p-1 border-none ${
                              userRole === 'admin'
                                ? 'bg-slate-200 text-slate-500 cursor-not-allowed dark:bg-slate-800 dark:text-slate-400'
                                : 'bg-slate-100 text-slate-700 cursor-pointer dark:bg-slate-800 dark:text-slate-200'
                            }`}
                            title={userRole === 'admin' ? 'Role Admin (Sales) hanya dapat melihat progres produksi' : 'Ubah Tahap'}
                          >
                            <option value="Order Masuk">Order Masuk</option>
                            <option value="Belanja bahan">Belanja bahan</option>
                            <option value="Potong">Potong</option>
                            <option value="Proofing">Proofing</option>
                            <option value="Sablon">Sablon</option>
                            <option value="Finishing sablon">Finishing sablon</option>
                            <option value="Jahit">Jahit</option>
                            <option value="QC">QC</option>
                            <option value="Selesai">Selesai</option>
                          </select>

                          <div className="flex items-center gap-1">
                            {onPrintSPK && (
                              <button
                                onClick={() => onPrintSPK(ord)}
                                className="p-1 text-slate-600 hover:bg-slate-100 dark:text-slate-300 dark:hover:bg-slate-800 rounded cursor-pointer"
                                title="Cetak SPK Produksi (Jahit & Sablon)"
                              >
                                <Scissors className="h-3.5 w-3.5 text-indigo-600 dark:text-indigo-400" />
                              </button>
                            )}
                            <button
                              onClick={() => onSelectOrder(ord)}
                              className="p-1 text-indigo-600 hover:bg-indigo-50 dark:hover:bg-indigo-950 rounded cursor-pointer"
                              title="Buka Order"
                            >
                              <ArrowRight className="h-4 w-4" />
                            </button>
                          </div>
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
};
