'use client';

import React, { useState } from 'react';

const ChildForm = ({ onSubmit, onCancel, initialData }) => {
  const [childData, setChildData] = useState(initialData || {
    name: '',
    age: '',
  });

  const handleSubmit = (e) => {
    e.preventDefault();
    onSubmit(childData);
  };

  return (
    <div className="bg-white dark:bg-zinc-900 rounded-3xl p-8 shadow-2xl border border-zinc-100 dark:border-zinc-800 max-w-md mx-auto">
      <div className="mb-6">
        <h3 className="text-2xl font-bold text-zinc-900 dark:text-white">Add Child</h3>
        <p className="text-sm text-zinc-500 dark:text-zinc-400 mt-2">Enter the details of the child to register.</p>
      </div>

      <form onSubmit={handleSubmit} className="space-y-6">
        <div className="space-y-2">
          <label className="text-sm font-semibold text-zinc-700 dark:text-zinc-300">Child Name</label>
          <input
            type="text"
            required
            value={childData.name}
            onChange={(e) => setChildData({ ...childData, name: e.target.value })}
            placeholder="e.g. John Doe"
            className="w-full px-4 py-3 rounded-xl border border-zinc-200 dark:border-zinc-700 bg-transparent focus:ring-2 focus:ring-indigo-500 outline-none dark:text-white"
          />
        </div>

        <div className="space-y-2">
          <label className="text-sm font-semibold text-zinc-700 dark:text-zinc-300">Child Age</label>
          <input
            type="number"
            required
            value={childData.age}
            onChange={(e) => setChildData({ ...childData, age: e.target.value })}
            placeholder="e.g. 5"
            className="w-full px-4 py-3 rounded-xl border border-zinc-200 dark:border-zinc-700 bg-transparent focus:ring-2 focus:ring-indigo-500 outline-none dark:text-white"
          />
        </div>

        <div className="flex gap-4 pt-4">
          <button
            type="submit"
            className="flex-1 bg-indigo-600 text-white font-bold py-3 rounded-xl hover:bg-indigo-700 transition-all active:scale-95 shadow-lg shadow-indigo-500/20"
          >
            Add Child
          </button>
          <button
            type="button"
            onClick={onCancel}
            className="px-6 py-3 border border-zinc-200 dark:border-zinc-700 text-zinc-500 dark:text-zinc-400 font-bold rounded-xl hover:bg-zinc-50 dark:hover:bg-zinc-800 transition-all"
          >
            Cancel
          </button>
        </div>
      </form>
    </div>
  );
};

export default ChildForm;
