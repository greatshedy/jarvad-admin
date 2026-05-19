'use client';

import React, { useState, useEffect } from 'react';
import { api } from '@/api';
import Loader from './Loader';
import Modal from './Modal';
import JardProcProductForm from './JardProcProductForm';

const JardProcProducts = () => {
  const [products, setProducts] = useState([]);
  const [isFetching, setIsFetching] = useState(true);
  const [isUploading, setIsUploading] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [showFormModal, setShowFormModal] = useState(false);
  const [selectedProduct, setSelectedProduct] = useState(null);
  const [selectedCategory, setSelectedCategory] = useState("All");

  const categories = [
    'All',
    'Food Item',
    'Building Materials',
    'Electronics',
    'Furniture',
    'Clothing',
    'Other'
  ];

  const fetchProducts = async () => {
    try {
      setIsFetching(true);
      const response = await api.get(`/get-products?category=${selectedCategory}`);
      if (response.data.status === 200) {
        setProducts(response.data.data);
      }
    } catch (error) {
      console.error("Error fetching products:", error);
    } finally {
      setIsFetching(false);
    }
  };

  useEffect(() => {
    fetchProducts();
  }, [selectedCategory]);

  const handleBulkUpload = async (e) => {
    const file = e.target.files[0];
    if (!file) return;

    try {
      setIsUploading(true);
      const formData = new FormData();
      formData.append('file', file);

      const response = await api.post('/bulk-upload-products', formData, {
        headers: { 'Content-Type': 'multipart/form-data' }
      });

      if (response.data.status === 200) {
        alert(response.data.message);
        fetchProducts();
      } else {
        alert('Upload failed: ' + response.data.message);
      }
    } catch (error) {
      console.error("Error uploading products:", error);
      alert('An error occurred during upload.');
    } finally {
      setIsUploading(false);
      e.target.value = ''; // Reset input
    }
  };

  const handleProductSubmit = async (data, imageFiles, existingUrls) => {
    try {
      setIsSubmitting(true);
      const formData = new FormData();
      formData.append('name', data.name);
      formData.append('description', data.description);
      formData.append('price', data.price);
      formData.append('category', data.category);
      formData.append('stock', data.stock);
      formData.append('existing_images', JSON.stringify(existingUrls));
      
      if (data.volume_value !== undefined && data.volume_value !== null && data.volume_value !== "") {
        formData.append('volume_value', data.volume_value);
      }
      if (data.volume_unit) {
        formData.append('volume_unit', data.volume_unit);
      }
      if (data.variants && data.variants.length > 0) {
        formData.append('variants', JSON.stringify(data.variants));
      }
      
      imageFiles.forEach(file => {
        formData.append('images', file);
      });

      const endpoint = selectedProduct ? `/update-product/${selectedProduct._id}` : '/add-product';
      const options = { headers: { 'Content-Type': 'multipart/form-data' } };
      const response = await (selectedProduct ? api.put(endpoint, formData, options) : api.post(endpoint, formData, options));

      if (response.data.status === 200) {
        setShowFormModal(false);
        setSelectedProduct(null);
        fetchProducts();
      } else {
        alert('Action failed: ' + response.data.message);
      }
    } catch (error) {
      console.error("Error submitting product:", error);
      alert('An error occurred.');
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleDeleteProduct = async (id) => {
    if (window.confirm('Are you sure you want to delete this product?')) {
      try {
        const response = await api.delete(`/delete-product/${id}`);
        if (response.data.status === 200) {
          fetchProducts();
        }
      } catch (error) {
        console.error("Error deleting product:", error);
      }
    }
  };

  if (isFetching && products.length === 0) return <Loader message="Loading products..." />;

  return (
    <div className="animate-in fade-in duration-500">
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 mb-10">
        <div>
          <h2 className="text-3xl font-extrabold tracking-tight text-zinc-900 dark:text-white flex items-center gap-3">
            <span>Shop Inventory</span>
            {isFetching && (
              <span className="inline-block w-4 h-4 border-2 border-indigo-600 border-t-transparent rounded-full animate-spin"></span>
            )}
          </h2>
          <p className="text-zinc-500 dark:text-zinc-400 mt-1">Manage JardProc marketplace products and stock.</p>
        </div>
        <div className="flex items-center gap-3">
          <label className="cursor-pointer px-6 py-3 bg-zinc-100 dark:bg-zinc-800 text-zinc-900 dark:text-white font-bold rounded-2xl hover:bg-zinc-200 dark:hover:bg-zinc-700 transition-all flex items-center gap-2">
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-8l-4-4m0 0L8 8m4-4v12"></path></svg>
            Bulk Upload
            <input type="file" accept=".csv" className="hidden" onChange={handleBulkUpload} disabled={isUploading} />
          </label>
          <button 
            onClick={() => {
              setSelectedProduct(null);
              setShowFormModal(true);
            }}
            className="px-6 py-3 bg-indigo-600 text-white font-bold rounded-2xl hover:bg-indigo-700 transition-all flex items-center justify-center gap-2 active:scale-95"
          >
            Add Product
          </button>
        </div>
      </div>

      {/* Categories Filter Pills Row */}
      <div className="flex items-center gap-2 overflow-x-auto pb-4 mb-8 no-scrollbar scroll-smooth">
        {categories.map((cat) => (
          <button
            key={cat}
            onClick={() => setSelectedCategory(cat)}
            className={`px-5 py-2.5 rounded-full text-xs font-bold whitespace-nowrap transition-all duration-300 ${
              selectedCategory === cat
                ? "bg-indigo-600 text-white shadow-lg shadow-indigo-500/20 scale-105"
                : "bg-zinc-100 dark:bg-zinc-800 text-zinc-600 dark:text-zinc-400 hover:bg-zinc-250 dark:hover:bg-zinc-700"
            }`}
          >
            {cat}
          </button>
        ))}
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {products.map((product) => (
          <div key={product._id} className="bg-white dark:bg-zinc-900 border border-zinc-100 dark:border-zinc-800 rounded-3xl overflow-hidden group hover:shadow-2xl hover:shadow-indigo-500/10 transition-all duration-500">
            <div className="aspect-square relative overflow-hidden bg-zinc-100 dark:bg-zinc-800">
              <img 
                src={Array.isArray(product.image) ? product.image[0] : product.image} 
                alt={product.name}
                className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-700"
              />
              <div className="absolute top-4 right-4 bg-white/90 dark:bg-zinc-900/90 backdrop-blur-md px-3 py-1 rounded-full text-xs font-bold text-indigo-600">
                {product.category}
              </div>
            </div>
            <div className="p-6">
              <div className="flex items-start justify-between mb-2">
                <h3 className="font-bold text-zinc-900 dark:text-white text-lg">{product.name}</h3>
                <span className="font-black text-indigo-600">₦{product.price.toLocaleString()}</span>
              </div>
              <p className="text-sm text-zinc-500 dark:text-zinc-400 line-clamp-2 mb-4">{product.description}</p>
              <div className="flex items-center justify-between pt-4 border-t border-zinc-50 dark:border-zinc-800">
                <div className="flex items-center gap-2">
                  <div className={`w-2 h-2 rounded-full ${product.stock > 0 ? 'bg-emerald-500' : 'bg-rose-500'}`}></div>
                  <span className="text-xs font-bold text-zinc-500">{product.stock} in stock</span>
                </div>
                <div className="flex items-center gap-2">
                  <button 
                    onClick={() => {
                      setSelectedProduct(product);
                      setShowFormModal(true);
                    }}
                    className="p-2 text-zinc-400 hover:text-indigo-600 transition-colors"
                  >
                    <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z"></path></svg>
                  </button>
                  <button 
                    onClick={() => handleDeleteProduct(product._id)}
                    className="p-2 text-zinc-400 hover:text-rose-500 transition-colors"
                  >
                    <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16"></path></svg>
                  </button>
                </div>
              </div>
            </div>
          </div>
        ))}
      </div>

      {products.length === 0 && (
        <div className="flex flex-col items-center justify-center py-20 text-center">
          <div className="w-20 h-20 bg-zinc-100 dark:bg-zinc-800 rounded-full flex items-center justify-center mb-6 animate-pulse">
            <svg className="w-10 h-10 text-zinc-400" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M20 7l-8-4-8 4m16 0l-8 4m8-4v10l-8 4m0-10L4 7m8 4v10M4 7v10l8 4"></path></svg>
          </div>
          <h3 className="text-xl font-bold text-zinc-900 dark:text-white">No products found</h3>
          <p className="text-zinc-500 dark:text-zinc-400 mt-2">There are no products listed under the "{selectedCategory}" category.</p>
        </div>
      )}

      {/* Product Form Modal */}
      <Modal
        isOpen={showFormModal}
        onClose={() => {
          setShowFormModal(false);
          setSelectedProduct(null);
        }}
        title={selectedProduct ? "Edit Product" : "Add New Product"}
      >
        <div className="relative">
          {isSubmitting && <Loader overlay message="Saving product..." />}
          <JardProcProductForm
            initialData={selectedProduct}
            onSubmit={handleProductSubmit}
            onCancel={() => {
              setShowFormModal(false);
              setSelectedProduct(null);
            }}
          />
        </div>
      </Modal>
    </div>
  );
};

export default JardProcProducts;
