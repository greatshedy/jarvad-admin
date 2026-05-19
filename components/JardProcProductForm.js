'use client';

import React, { useState, useEffect } from 'react';

const JardProcProductForm = ({ onSubmit, onCancel, initialData }) => {
  const categories = [
    'Food Item',
    'Building Materials',
    'Electronics',
    'Furniture',
    'Clothing',
    'Other'
  ];

  const [formData, setFormData] = useState({
    name: '',
    description: '',
    price: '',
    category: 'Food Item',
    stock: '',
    images: [],
    volume_value: '',
    volume_unit: 'kg',
    variants: [],
    ...initialData
  });

  const [imageFiles, setImageFiles] = useState([]);

  useEffect(() => {
    if (initialData) {
      setFormData({
        ...initialData,
        images: Array.isArray(initialData.image) ? initialData.image : [initialData.image],
        volume_value: initialData.volume_value || '',
        volume_unit: initialData.volume_unit || 'kg',
        variants: initialData.variants || []
      });
    }
  }, [initialData]);

  // Keep price and stock calculated and in-sync from variations if Building Materials has them
  useEffect(() => {
    if (formData.category === 'Building Materials' && formData.variants && formData.variants.length > 0) {
      const prices = formData.variants.map(v => parseFloat(v.price) || 0).filter(p => p > 0);
      const minPrice = prices.length > 0 ? Math.min(...prices) : 0;
      
      const totalStock = formData.variants.reduce((sum, v) => sum + (parseInt(v.stock) || 0), 0);
      
      setFormData(prev => ({
        ...prev,
        price: minPrice.toString(),
        stock: totalStock.toString()
      }));
    }
  }, [formData.variants, formData.category]);

  const addVariant = () => {
    setFormData(prev => ({
      ...prev,
      variants: [
        ...(prev.variants || []),
        { name: '', scale_value: '1', scale_unit: 'tons', price: '', stock: '' }
      ]
    }));
  };

  const removeVariant = (index) => {
    setFormData(prev => {
      const updatedVariants = (prev.variants || []).filter((_, i) => i !== index);
      return {
        ...prev,
        variants: updatedVariants
      };
    });
  };

  const handleVariantChange = (index, field, value) => {
    setFormData(prev => {
      const updatedVariants = (prev.variants || []).map((v, i) => {
        if (i === index) {
          return { ...v, [field]: value };
        }
        return v;
      });
      return {
        ...prev,
        variants: updatedVariants
      };
    });
  };

  const compressImage = (file) => {
    return new Promise((resolve) => {
      const reader = new FileReader();
      reader.readAsDataURL(file);
      reader.onload = (event) => {
        const img = new Image();
        img.src = event.target.result;
        img.onload = () => {
          const canvas = document.createElement('canvas');
          let width = img.width;
          let height = img.height;
          const MAX_DIM = 1200;
          if (width > height) {
            if (width > MAX_DIM) {
              height *= MAX_DIM / width;
              width = MAX_DIM;
            }
          } else {
            if (height > MAX_DIM) {
              width *= MAX_DIM / height;
              height = MAX_DIM;
            }
          }
          canvas.width = width;
          canvas.height = height;
          const ctx = canvas.getContext('2d');
          ctx.drawImage(img, 0, 0, width, height);
          let quality = 0.8;
          let dataUrl = canvas.toDataURL('image/jpeg', quality);
          while (dataUrl.length * 0.75 > 200 * 1024 && quality > 0.1) {
            quality -= 0.1;
            dataUrl = canvas.toDataURL('image/jpeg', quality);
          }
          resolve(dataUrl);
        };
      };
    });
  };

  const handleFileChange = async (e) => {
    const files = Array.from(e.target.files);
    const existingCount = formData.images?.length || 0;
    const remainingSlots = 3 - existingCount;
    
    if (files.length > remainingSlots) {
      alert(`You can only add ${remainingSlots} more image(s). (Max 3 total)`);
    }

    const filesToProcess = files.slice(0, remainingSlots);

    for (const file of filesToProcess) {
      const compressedDataUrl = await compressImage(file);
      setFormData(prev => ({
        ...prev,
        images: [...(prev.images || []), compressedDataUrl]
      }));
      const blob = await (await fetch(compressedDataUrl)).blob();
      const compressedFile = new File([blob], file.name, { type: 'image/jpeg' });
      setImageFiles(prev => [...prev, compressedFile]);
    }
  };

  const removeImage = (index) => {
    const imgToRemove = formData.images[index];
    const isNewImage = imgToRemove.startsWith('data:');

    if (isNewImage) {
      const newImagesBefore = formData.images.slice(0, index).filter(img => img.startsWith('data:')).length;
      setImageFiles(prev => prev.filter((_, i) => i !== newImagesBefore));
    }

    setFormData(prev => ({
      ...prev,
      images: prev.images.filter((_, i) => i !== index)
    }));
  };

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    const existingUrls = formData.images.filter(img => !img.startsWith('data:'));
    onSubmit(formData, imageFiles, existingUrls);
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-6">
      <div className="space-y-4">
        {/* Image Upload Grid */}
        <div className="grid grid-cols-3 gap-4">
          {formData.images?.map((img, index) => (
            <div key={index} className="relative aspect-square rounded-2xl overflow-hidden shadow-lg border border-zinc-100 dark:border-zinc-800 group">
              <img src={img} alt="Product" className="w-full h-full object-cover" />
              <button 
                type="button"
                onClick={() => removeImage(index)}
                className="absolute inset-0 bg-black/40 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity"
              >
                <svg className="w-8 h-8 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16"></path></svg>
              </button>
            </div>
          ))}
          {formData.images?.length < 3 && (
            <label className="aspect-square flex flex-col items-center justify-center border-2 border-dashed border-zinc-200 dark:border-zinc-800 rounded-2xl hover:border-indigo-500 transition-all bg-zinc-50/50 dark:bg-zinc-900/50 cursor-pointer group">
              <div className="w-10 h-10 bg-white dark:bg-zinc-800 rounded-xl flex items-center justify-center text-zinc-400 mb-1 shadow-sm border border-zinc-100 dark:border-zinc-700 group-hover:text-indigo-500 transition-all">
                <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 4v16m8-8H4"></path></svg>
              </div>
              <span className="text-[10px] font-bold text-zinc-500">Add Image</span>
              <input type="file" accept="image/*" className="hidden" onChange={handleFileChange} multiple />
            </label>
          )}
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <div className="space-y-2">
            <label className="text-sm font-bold text-zinc-700 dark:text-zinc-300">Product Name</label>
            <input
              type="text"
              name="name"
              value={formData.name}
              onChange={handleChange}
              placeholder="e.g. Organic Tomatoes"
              className="w-full px-5 py-3 rounded-2xl border border-zinc-200 dark:border-zinc-800 bg-white dark:bg-zinc-900 outline-none focus:ring-2 focus:ring-indigo-500 transition-all dark:text-white"
              required
            />
          </div>

          <div className="space-y-2">
            <label className="text-sm font-bold text-zinc-700 dark:text-zinc-300">Category</label>
            <select
              name="category"
              value={formData.category}
              onChange={handleChange}
              className="w-full px-5 py-3 rounded-2xl border border-zinc-200 dark:border-zinc-800 bg-white dark:bg-zinc-900 outline-none focus:ring-2 focus:ring-indigo-500 transition-all dark:text-white font-medium"
            >
              {categories.map(cat => <option key={cat} value={cat}>{cat}</option>)}
            </select>
          </div>
        </div>

        {/* Dynamic Fields for Food Items */}
        {formData.category === 'Food Item' && (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6 p-6 rounded-3xl bg-indigo-50/30 dark:bg-indigo-950/10 border border-indigo-100/50 dark:border-indigo-900/20 animate-in slide-in-from-top-4 duration-300">
            <div className="space-y-2">
              <label className="text-sm font-bold text-zinc-700 dark:text-zinc-300 flex items-center gap-1.5">
                <span>Food Volume</span>
                <span className="text-[9px] text-indigo-600 dark:text-indigo-400 bg-indigo-100/50 dark:bg-indigo-950/50 px-2 py-0.5 rounded font-mono font-black">Specific</span>
              </label>
              <input
                type="number"
                step="any"
                name="volume_value"
                value={formData.volume_value}
                onChange={handleChange}
                placeholder="e.g. 5"
                className="w-full px-5 py-3 rounded-2xl border border-zinc-200 dark:border-zinc-800 bg-white dark:bg-zinc-900 outline-none focus:ring-2 focus:ring-indigo-500 transition-all dark:text-white"
                required
              />
            </div>
            <div className="space-y-2">
              <label className="text-sm font-bold text-zinc-700 dark:text-zinc-300">Volume Unit</label>
              <select
                name="volume_unit"
                value={formData.volume_unit}
                onChange={handleChange}
                className="w-full px-5 py-3 rounded-2xl border border-zinc-200 dark:border-zinc-800 bg-white dark:bg-zinc-900 outline-none focus:ring-2 focus:ring-indigo-500 transition-all dark:text-white font-medium"
              >
                <option value="kg">Kilograms (kg)</option>
                <option value="L">Liters (L)</option>
              </select>
            </div>
          </div>
        )}

        {/* Dynamic Fields for Building Materials */}
        {formData.category === 'Building Materials' && (
          <div className="space-y-4 p-6 rounded-3xl bg-zinc-50/50 dark:bg-zinc-900/30 border border-zinc-100 dark:border-zinc-800 animate-in slide-in-from-top-4 duration-300">
            <div className="flex items-center justify-between">
              <div>
                <h4 className="text-sm font-bold text-zinc-800 dark:text-zinc-200">Scale Variations</h4>
                <p className="text-[11px] text-zinc-500 mt-0.5">Define sub-types and scales (e.g. Sharp Sand in tons/kg).</p>
              </div>
              <button
                type="button"
                onClick={addVariant}
                className="px-4 py-2 bg-indigo-600 hover:bg-indigo-700 text-white text-xs font-bold rounded-xl transition-all shadow-md shadow-indigo-500/10 flex items-center gap-1.5 active:scale-95"
              >
                <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 4v16m8-8H4"></path></svg>
                Add Option / Scale
              </button>
            </div>

            {formData.variants && formData.variants.length > 0 ? (
              <div className="space-y-3">
                {formData.variants.map((v, index) => (
                  <div key={index} className="grid grid-cols-1 sm:grid-cols-12 gap-3 p-4 rounded-2xl bg-white dark:bg-zinc-950 border border-zinc-150 dark:border-zinc-900 shadow-sm relative group animate-in zoom-in-95 duration-200">
                    
                    {/* Variant Name Column */}
                    <div className="sm:col-span-4 space-y-1">
                      <label className="text-[10px] font-bold text-zinc-400">Variant Name</label>
                      <input
                        type="text"
                        value={v.name}
                        onChange={(e) => handleVariantChange(index, 'name', e.target.value)}
                        placeholder="e.g. Sharp Sand"
                        className="w-full px-3 py-2 rounded-xl border border-zinc-200 dark:border-zinc-800 bg-white dark:bg-zinc-900 text-xs outline-none focus:ring-1 focus:ring-indigo-500 transition-all dark:text-white"
                        required
                      />
                    </div>

                    {/* Scale Value Column */}
                    <div className="sm:col-span-2 space-y-1">
                      <label className="text-[10px] font-bold text-zinc-400">Scale Value</label>
                      <input
                        type="number"
                        step="any"
                        value={v.scale_value}
                        onChange={(e) => handleVariantChange(index, 'scale_value', e.target.value)}
                        placeholder="e.g. 1"
                        className="w-full px-3 py-2 rounded-xl border border-zinc-200 dark:border-zinc-800 bg-white dark:bg-zinc-900 text-xs outline-none focus:ring-1 focus:ring-indigo-500 transition-all dark:text-white"
                        required
                      />
                    </div>

                    {/* Scale Unit Column */}
                    <div className="sm:col-span-2 space-y-1">
                      <label className="text-[10px] font-bold text-zinc-400">Scale Unit</label>
                      <select
                        value={v.scale_unit}
                        onChange={(e) => handleVariantChange(index, 'scale_unit', e.target.value)}
                        className="w-full px-3 py-2 rounded-xl border border-zinc-200 dark:border-zinc-800 bg-white dark:bg-zinc-900 text-xs outline-none focus:ring-1 focus:ring-indigo-500 transition-all dark:text-white font-medium"
                      >
                        <option value="tons">tons</option>
                        <option value="kg">kg</option>
                        <option value="truck">truck</option>
                        <option value="bags">bags</option>
                        <option value="yards">yards</option>
                        <option value="pieces">pieces</option>
                      </select>
                    </div>

                    {/* Variant Price Column */}
                    <div className="sm:col-span-2 space-y-1">
                      <label className="text-[10px] font-bold text-zinc-400">Price (₦)</label>
                      <input
                        type="number"
                        value={v.price}
                        onChange={(e) => handleVariantChange(index, 'price', e.target.value)}
                        placeholder="Price"
                        className="w-full px-3 py-2 rounded-xl border border-zinc-200 dark:border-zinc-800 bg-white dark:bg-zinc-900 text-xs outline-none focus:ring-1 focus:ring-indigo-500 transition-all dark:text-white"
                        required
                      />
                    </div>

                    {/* Variant Stock Column */}
                    <div className="sm:col-span-2 space-y-1 flex items-end gap-2">
                      <div className="flex-1 space-y-1">
                        <label className="text-[10px] font-bold text-zinc-400">Stock</label>
                        <input
                          type="number"
                          value={v.stock}
                          onChange={(e) => handleVariantChange(index, 'stock', e.target.value)}
                          placeholder="Stock"
                          className="w-full px-3 py-2 rounded-xl border border-zinc-200 dark:border-zinc-800 bg-white dark:bg-zinc-900 text-xs outline-none focus:ring-1 focus:ring-indigo-500 transition-all dark:text-white"
                          required
                        />
                      </div>
                      <button
                        type="button"
                        onClick={() => removeVariant(index)}
                        className="p-2 text-zinc-400 hover:text-rose-500 transition-colors self-end mb-0.5"
                      >
                        <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16"></path></svg>
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <div className="text-center py-6 border border-dashed border-zinc-200 dark:border-zinc-800 rounded-2xl bg-white dark:bg-zinc-900/20 text-zinc-400 text-xs font-medium">
                No variants added yet. Global price and stock will be used instead.
              </div>
            )}
          </div>
        )}

        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <div className="space-y-2">
            <label className="text-sm font-bold text-zinc-700 dark:text-zinc-300 flex items-center justify-between">
              <span>Price (₦)</span>
              {formData.category === 'Building Materials' && formData.variants?.length > 0 && (
                <span className="text-[9px] text-amber-600 dark:text-amber-400 bg-amber-500/10 dark:bg-amber-950/30 px-1.5 py-0.5 rounded font-black">From variants</span>
              )}
            </label>
            <input
              type="number"
              name="price"
              value={formData.price}
              onChange={handleChange}
              placeholder="e.g. 500"
              className="w-full px-5 py-3 rounded-2xl border border-zinc-200 dark:border-zinc-800 bg-white dark:bg-zinc-900 outline-none focus:ring-2 focus:ring-indigo-500 transition-all dark:text-white disabled:opacity-50 disabled:cursor-not-allowed disabled:bg-zinc-50 dark:disabled:bg-zinc-900/50"
              required
              disabled={formData.category === 'Building Materials' && formData.variants?.length > 0}
            />
          </div>

          <div className="space-y-2">
            <label className="text-sm font-bold text-zinc-700 dark:text-zinc-300 flex items-center justify-between">
              <span>Stock Quantity</span>
              {formData.category === 'Building Materials' && formData.variants?.length > 0 && (
                <span className="text-[9px] text-amber-600 dark:text-amber-400 bg-amber-500/10 dark:bg-amber-950/30 px-1.5 py-0.5 rounded font-black">Summed from variants</span>
              )}
            </label>
            <input
              type="number"
              name="stock"
              value={formData.stock}
              onChange={handleChange}
              placeholder="e.g. 100"
              className="w-full px-5 py-3 rounded-2xl border border-zinc-200 dark:border-zinc-800 bg-white dark:bg-zinc-900 outline-none focus:ring-2 focus:ring-indigo-500 transition-all dark:text-white disabled:opacity-50 disabled:cursor-not-allowed disabled:bg-zinc-50 dark:disabled:bg-zinc-900/50"
              required
              disabled={formData.category === 'Building Materials' && formData.variants?.length > 0}
            />
          </div>
        </div>

        <div className="space-y-2">
          <label className="text-sm font-bold text-zinc-700 dark:text-zinc-300">Description</label>
          <textarea
            name="description"
            value={formData.description}
            onChange={handleChange}
            placeholder="Describe the product..."
            rows="3"
            className="w-full px-5 py-3 rounded-2xl border border-zinc-200 dark:border-zinc-800 bg-white dark:bg-zinc-900 outline-none focus:ring-2 focus:ring-indigo-500 transition-all dark:text-white resize-none"
            required
          ></textarea>
        </div>
      </div>

      <div className="flex gap-4 pt-6">
        <button
          type="button"
          onClick={onCancel}
          className="flex-1 px-8 py-4 bg-zinc-100 dark:bg-zinc-800 text-zinc-600 dark:text-zinc-400 font-bold rounded-2xl hover:bg-zinc-200 dark:hover:bg-zinc-700 transition-all"
        >
          Cancel
        </button>
        <button
          type="submit"
          className="flex-[2] px-8 py-4 bg-indigo-600 text-white font-bold rounded-2xl hover:bg-indigo-700 shadow-lg shadow-indigo-500/30 transition-all active:scale-95"
        >
          {initialData ? 'Update Product' : 'Add Product'}
        </button>
      </div>
    </form>
  );
};

export default JardProcProductForm;
