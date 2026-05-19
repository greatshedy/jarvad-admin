'use client';

import React, { useState, useEffect } from 'react';
import { api } from '@/api';
import Loader from './Loader';

const JardProcOrders = () => {
  const [orders, setOrders] = useState([]);
  const [isFetching, setIsFetching] = useState(true);

  const fetchOrders = async () => {
    try {
      setIsFetching(true);
      const response = await api.get('/get-all-orders');
      if (response.data.status === 200) {
        setOrders(response.data.data);
      }
    } catch (error) {
      console.error("Error fetching orders:", error);
    } finally {
      setIsFetching(false);
    }
  };

  useEffect(() => {
    fetchOrders();
  }, []);

  const handleUpdateStatus = async (orderId, newStatus) => {
    try {
      const response = await api.patch(`/update-order-status/${orderId}`, { status: newStatus });
      if (response.data.status === 200) {
        setOrders(orders.map(o => o.order_id === orderId ? { ...o, status: newStatus } : o));
      }
    } catch (error) {
      console.error("Error updating order status:", error);
    }
  };

  const getStatusColor = (status) => {
    switch (status.toLowerCase()) {
      case 'pending': return 'bg-amber-100 text-amber-600 dark:bg-amber-500/10';
      case 'shipped': return 'bg-indigo-100 text-indigo-600 dark:bg-indigo-500/10';
      case 'delivered': return 'bg-emerald-100 text-emerald-600 dark:bg-emerald-500/10';
      case 'cancelled': return 'bg-rose-100 text-rose-600 dark:bg-rose-500/10';
      default: return 'bg-zinc-100 text-zinc-600 dark:bg-zinc-500/10';
    }
  };

  if (isFetching) return <Loader message="Loading orders..." />;

  return (
    <div className="animate-in fade-in duration-500">
      <div className="mb-10">
        <h2 className="text-3xl font-extrabold tracking-tight text-zinc-900 dark:text-white">Customer Orders</h2>
        <p className="text-zinc-500 dark:text-zinc-400 mt-1">Track and manage JardProc marketplace sales.</p>
      </div>

      <div className="bg-white dark:bg-zinc-900 border border-zinc-100 dark:border-zinc-800 rounded-[32px] overflow-hidden shadow-xl shadow-zinc-200/50 dark:shadow-none">
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="border-b border-zinc-50 dark:border-zinc-800">
                <th className="px-8 py-6 text-sm font-bold text-zinc-400 uppercase tracking-wider">Order ID</th>
                <th className="px-8 py-6 text-sm font-bold text-zinc-400 uppercase tracking-wider">Customer</th>
                <th className="px-8 py-6 text-sm font-bold text-zinc-400 uppercase tracking-wider">Items</th>
                <th className="px-8 py-6 text-sm font-bold text-zinc-400 uppercase tracking-wider">Total</th>
                <th className="px-8 py-6 text-sm font-bold text-zinc-400 uppercase tracking-wider">Status</th>
                <th className="px-8 py-6 text-sm font-bold text-zinc-400 uppercase tracking-wider text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-zinc-50 dark:divide-zinc-800">
              {orders.map((order) => (
                <tr key={order._id} className="group hover:bg-zinc-50/50 dark:hover:bg-zinc-800/50 transition-colors">
                  <td className="px-8 py-6">
                    <span className="font-mono font-bold text-zinc-900 dark:text-white">{order.order_id}</span>
                    <p className="text-xs text-zinc-400 mt-1">{new Date(order.created_at).toLocaleDateString()}</p>
                  </td>
                  <td className="px-8 py-6">
                    <div className="flex items-center gap-3">
                      <div className="w-10 h-10 rounded-full bg-indigo-50 dark:bg-indigo-500/10 flex items-center justify-center text-indigo-600 font-bold">
                        {order.user_info?.user_name?.[0]?.toUpperCase() || 'U'}
                      </div>
                      <div>
                        <p className="font-bold text-zinc-900 dark:text-white">{order.user_info?.user_name || 'Unknown'}</p>
                        <p className="text-xs text-zinc-400">{order.user_info?.email || 'N/A'}</p>
                      </div>
                    </div>
                  </td>
                  <td className="px-8 py-6">
                    <p className="text-sm text-zinc-600 dark:text-zinc-300">
                      {order.items?.length} items
                    </p>
                    <p className="text-xs text-zinc-400 truncate max-w-[200px]">
                      {order.items?.map(i => i.name).join(', ')}
                    </p>
                  </td>
                  <td className="px-8 py-6">
                    <span className="font-black text-zinc-900 dark:text-white">₦{order.final_total.toLocaleString()}</span>
                  </td>
                  <td className="px-8 py-6">
                    <span className={`px-4 py-1.5 rounded-full text-xs font-black uppercase tracking-widest ${getStatusColor(order.status)}`}>
                      {order.status}
                    </span>
                  </td>
                  <td className="px-8 py-6 text-right">
                    <div className="flex items-center justify-end gap-2">
                      <select 
                        onChange={(e) => handleUpdateStatus(order.order_id, e.target.value)}
                        value={order.status}
                        className="bg-zinc-100 dark:bg-zinc-800 border-none rounded-xl text-xs font-bold text-zinc-900 dark:text-white p-2 outline-none cursor-pointer focus:ring-2 focus:ring-indigo-500 transition-all"
                      >
                        <option value="Pending">Pending</option>
                        <option value="Shipped">Shipped</option>
                        <option value="Delivered">Delivered</option>
                        <option value="Cancelled">Cancelled</option>
                      </select>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
        {orders.length === 0 && (
          <div className="py-20 text-center">
            <p className="text-zinc-500 dark:text-zinc-400">No orders found.</p>
          </div>
        )}
      </div>
    </div>
  );
};

export default JardProcOrders;
