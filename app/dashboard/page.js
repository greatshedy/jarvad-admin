'use client';

import React, { useState, useEffect } from 'react';
import { useNavigation } from '@/context/NavigationContext';
import StatsSection from '@/components/StatsSection';
import DashboardCharts from '@/components/DashboardCharts';
import ManagementTable from '@/components/ManagementTable';
import ChildInvestmentTable from '@/components/ChildInvestmentTable';
import EstateForm from '@/components/EstateForm';
import ChildForm from '@/components/ChildForm';
import BulkEstateUpload from '@/components/BulkEstateUpload';
import FinanceView from '@/components/FinanceView';
import UsersView from '@/components/UsersView';
import ReportsView from '@/components/ReportsView';
import JardProcProducts from '@/components/JardProcProducts';
import JardProcOrders from '@/components/JardProcOrders';
import PartnersView from '@/components/PartnersView';
import Modal from '@/components/Modal';
import Loader from '@/components/Loader';
import { api } from '@/api';

const DashboardPage = () => {
  const { activeView, setActiveView } = useNavigation();
  const [houses, setHouses] = useState([]);
  const [childInvestments, setChildInvestments] = useState([]);
  const [dashboardStats, setDashboardStats] = useState(null);
  const [editingEstate, setEditingEstate] = useState(null);
  const [editingChild, setEditingChild] = useState(null);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isFetching, setIsFetching] = useState(true);
  const [fetchError, setFetchError] = useState(false);

  const fetchDashboardStats = async () => {
    try {
      const response = await api.get('/finance/summary');
      if (response.data.status === 200) {
        setDashboardStats(response.data.data);
      }
    } catch (error) {
      console.error("Error fetching dashboard stats:", error);
    }
  }

  const fetchHouses = async () => {
    try {
      setFetchError(false);
      console.log("[FETCH] Initializing pull from /get-house...");
      const response = await api.get('/get-house');
      console.log("[FETCH] Response Received:", response);
      if(response.data.status === 200){
        // Deep clone the entire dataset on fetch to ensure no shared references
        const sanitizedData = JSON.parse(JSON.stringify(response.data.data));
        setHouses(sanitizedData);
        console.log(`[FETCH] Success: ${sanitizedData.length} houses loaded.`);
      }
    } catch (error) {
      console.error("[FETCH] Error encountered:", error);
      setFetchError(true);
      if (error.code === 'ECONNABORTED') {
        console.error("[FETCH] Timeout: Request took longer than 60s.");
      }
    }
  }

  const fetchChildInvestments = async () => {
    try {
      console.log("[FETCH] Initializing pull from /get-child-investments...");
      const response = await api.get('/get-child-investments');
      if (response.data.status === 200) {
        setChildInvestments(response.data.data);
        console.log(`[FETCH] Success: ${response.data.data.length} child investments loaded.`);
      }
    } catch (error) {
      console.error("[FETCH] Error fetching child investments:", error);
    }
  }

  useEffect(() => {
    const initDashboard = async () => {
      setIsFetching(true);
      try {
        // Fetch primary structural data
        await Promise.all([
          fetchHouses(),
          fetchChildInvestments()
        ]);
        
        // Fetch dashboard metrics in background (does not block UI)
        fetchDashboardStats();
      } catch (error) {
        console.error("Dashboard initialization error:", error);
      } finally {
        setIsFetching(false);
      }
    };
    
    initDashboard();
  }, []);

  const handleAddHouse = async (houseData, imageFiles) => {
    try {
      setIsSubmitting(true);
      
      const formData = new FormData();
      formData.append('house_name', houseData.house_name);
      formData.append('house_about', houseData.house_about);
      formData.append('house_location', houseData.house_location);
      formData.append('house_status', houseData.house_status);
      formData.append('house_type', houseData.house_type);
      formData.append('house_is_promo', houseData.house_is_promo);
      formData.append('house_promo_type', houseData.house_promo_type);
      formData.append('house_promo_value', houseData.house_promo_value);
      formData.append('house_pricing_plan', JSON.stringify(houseData.house_pricing_plan));
      formData.append('house_landmarks', JSON.stringify(houseData.house_landmarks));
      formData.append('house_benefits', JSON.stringify(houseData.house_benefits));
      
      imageFiles.forEach(file => {
        formData.append('images', file);
      });

      const response = await api.post('/add-house', formData, {
        headers: { 'Content-Type': 'multipart/form-data' }
      });

      if(response.data.status === 201 || response.data.status === 200){
        await fetchHouses();
        setActiveView('estates');
      } else {
        alert('Failed to add house: ' + (response.data.message || 'Unknown error'));
      }
    } catch (error) {
      console.error("Error adding house:", error);
      alert('An error occurred while adding the house.');
    } finally {
      setIsSubmitting(false);
    }
  };


  const handleUpdateHouse = async (houseData, imageFiles, existingUrls) => {
    setIsSubmitting(true);
    try {
      const formData = new FormData();
      formData.append('house_name', houseData.house_name);
      formData.append('house_about', houseData.house_about);
      formData.append('house_location', houseData.house_location);
      formData.append('house_status', houseData.house_status);
      formData.append('house_type', houseData.house_type);
      formData.append('house_is_promo', houseData.house_is_promo);
      formData.append('house_promo_type', houseData.house_promo_type);
      formData.append('house_promo_value', houseData.house_promo_value);
      formData.append('house_pricing_plan', JSON.stringify(houseData.house_pricing_plan));
      formData.append('house_landmarks', JSON.stringify(houseData.house_landmarks));
      formData.append('house_benefits', JSON.stringify(houseData.house_benefits));
      formData.append('existing_images', JSON.stringify(existingUrls));
      
      imageFiles.forEach(file => {
        formData.append('images', file);
      });

      const response = await api.put(`/update-house/${editingEstate._id}`, formData, {
        headers: { 'Content-Type': 'multipart/form-data' }
      });

      if (response.data.status === 200) {
        await fetchHouses();
        setEditingEstate(null);
      }
    } catch (error) {
      console.error("Error updating house:", error);
      alert('Failed to update house.');
    } finally {
      setIsSubmitting(false);
    }
  };


  const handleAddChild = (childData) => {
    setChildInvestments([...childInvestments, { ...childData, id: Date.now(), status: 'Active' }]);
    setActiveView('child-investments');
  };

  const handleUpdateChild = (updatedChild) => {
    setChildInvestments(childInvestments.map(c => c.id === editingChild.id ? { ...c, ...updatedChild } : c));
    setEditingChild(null);
  };

  const handleDeleteChild = async (id) => {
    if (confirm('Are you sure you want to delete this investment?')) {
      try {
        const response = await api.delete(`/delete-child-investment/${id}`);
        if (response.data.status === 200) {
          setChildInvestments(childInvestments.filter(c => c._id !== id));
        }
      } catch (error) {
        console.error("Error deleting child:", error);
        alert('Failed to delete investment.');
      }
    }
  };

  const handleChangeChildStatus = async (id) => {
    try {
      const child = childInvestments.find(c => c._id === id);
      const newStatus = child.status === 'Active' ? 'Pending' : 'Active';
      const response = await api.patch(`/update-child-status/${id}`, { status: newStatus });
      if (response.data.status === 200) {
        setChildInvestments(childInvestments.map(c => 
          c._id === id ? { ...c, status: newStatus } : c
        ));
      }
    } catch (error) {
      console.error("Error changing child status:", error);
      alert('Failed to update status.');
    }
  };

  const handleDeleteHouse = async (id) => {
    if (confirm('Are you sure you want to delete this listing?')) {
      try {
        const response = await api.delete(`/delete-house/${id}`);
        if (response.data.status === 200) {
          setHouses(houses.filter(h => h._id !== id));
        }
      } catch (error) {
        console.error("Error deleting house:", error);
        alert('Failed to delete house.');
      }
    }
  };

  const handleChangeStatus = async (id) => {
    try {
      setIsSubmitting(true);
      const house = houses.find(h => h._id === id);
      const newStatus = house.house_status === 'Active' ? 'Sold' : 'Active';
      const data={
        house_status: newStatus
      }
      // Reverted back to a proper PATCH request sending the data in the body
      const response = await api.patch(`/update-house-status/${id}`, data);
      console.log("Status Change Response:", response);
      
      if (response.data.status === 200) {
        setHouses(houses.map(h => 
          h._id === id ? { ...h, house_status: newStatus } : h
        ));
        await fetchHouses();
      }
    } catch (error) {
      console.error("Error changing status:", error);
    } finally {
      setIsSubmitting(false);
    }
  };

  if (isFetching && houses.length === 0) {
    return <Loader fullPage message="Connecting to Backend..." />;
  }

  // Handle case where fetch errored (connection timeout)
  if (!isFetching && fetchError) {
    return (
      <div className="fixed inset-0 bg-white dark:bg-zinc-950 flex flex-col items-center justify-center p-6 text-center animate-in fade-in duration-500">
        <div className="w-20 h-20 bg-red-50 dark:bg-red-500/10 rounded-full flex items-center justify-center mb-6">
          <svg className="w-10 h-10 text-red-500" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z"></path></svg>
        </div>
        <h3 className="text-xl font-bold text-zinc-900 dark:text-white mb-2">Connection Timeout</h3>
        <p className="text-zinc-500 dark:text-zinc-400 max-w-sm mb-8">
          The dashboard couldn't reach the backend server. Please verify the backend is running and try again.
        </p>
        <button 
          onClick={() => {
            setIsFetching(true);
            setFetchError(false);
            fetchHouses();
          }}
          className="px-8 py-3 bg-indigo-600 text-white font-bold rounded-2xl hover:bg-indigo-700 transition-all flex items-center gap-2 shadow-lg shadow-indigo-600/20"
        >
          <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15"></path></svg>
          Reconnect
        </button>
      </div>
    );
  }

  return (
    <main className="max-w-7xl mx-auto px-6 py-8">
      {/* Dashboard Overview */}
      {activeView === 'dashboard' && (
        <div className="animate-in fade-in duration-500">
          <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 mb-10">
            <div>
              <h2 className="text-3xl font-extrabold tracking-tight text-zinc-900 dark:text-white">Dashboard Overview</h2>
              <p className="text-zinc-500 dark:text-zinc-400 mt-1">Real-time performance metrics and insights.</p>
            </div>
            <button 
              onClick={() => setActiveView(activeView === 'child-investments' ? 'add-child' : 'add-house')}
              className="px-6 py-3 bg-zinc-900 dark:bg-white text-white dark:text-zinc-900 font-bold rounded-2xl hover:opacity-90 transition-all flex items-center justify-center gap-2"
            >
              Quick Add {activeView === 'child-investments' ? 'Investment' : 'Property'}
            </button>
          </div>
          <StatsSection stats={dashboardStats} />
          <div className="grid grid-cols-1 gap-8 mb-10">
            <DashboardCharts data={dashboardStats?.revenue_history} />
          </div>
        </div>
      )}

      {/* Estates List View */}
      {activeView === 'estates' && (
        <div className="animate-in fade-in slide-in-from-bottom-4 duration-500">
          <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 mb-10">
            <div>
              <h2 className="text-3xl font-extrabold tracking-tight text-zinc-900 dark:text-white">Estates Management</h2>
              <p className="text-zinc-500 dark:text-zinc-400 mt-1">Manage and monitor all property listings.</p>
            </div>
            <button 
              onClick={() => setActiveView('add-house')}
              className="px-6 py-3 bg-indigo-600 text-white font-bold rounded-2xl hover:bg-indigo-700 transition-all flex items-center justify-center gap-2"
            >
              Add New Estate
            </button>
          </div>
          <ManagementTable 
            houses={houses} 
            onDelete={handleDeleteHouse} 
            onChangeStatus={handleChangeStatus}
            // onEdit={(id) => {
            //   const house = houses.find(h => h._id === id);
            //   // Deep clone to prevent any reference sharing with the main list
            //   setEditingEstate(JSON.parse(JSON.stringify(house)));
            // }}

            onEdit={async(id)=>{
              try{
                const response = await api.get(`/get-selected-house-by-id/${id}`);
                if(response.data.status === 200){
                  setEditingEstate(response.data.data);
                }
              }catch(error){
                console.error("Error fetching house:", error);
              }
            }}

          />
        </div>
      )}

      {/* Child Investments List View */}
      {activeView === 'child-investments' && (
        <div className="animate-in fade-in slide-in-from-bottom-4 duration-500">
          <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 mb-10">
            <div>
              <h2 className="text-3xl font-extrabold tracking-tight text-zinc-900 dark:text-white">Child Investment</h2>
              <p className="text-zinc-500 dark:text-zinc-400 mt-1">Manage all active child investment plans.</p>
            </div>
            <button 
              onClick={() => setActiveView('add-child')}
              className="px-6 py-3 bg-indigo-600 text-white font-bold rounded-2xl hover:bg-indigo-700 transition-all flex items-center justify-center gap-2"
            >
              Add Child Investment
            </button>
          </div>
          <ChildInvestmentTable 
            investments={childInvestments} 
            onDelete={handleDeleteChild} 
            onChangeStatus={handleChangeChildStatus}
            onEdit={(id) => setEditingChild(childInvestments.find(c => c._id === id))}
          />
        </div>
      )}

      {/* Finance View */}
      {activeView === 'finance' && (
        <FinanceView />
      )}

      {/* Partners Management */}
      {activeView === 'partners' && (
        <PartnersView />
      )}

      {/* Users Management */}
      {activeView === 'users' && (
        <UsersView />
      )}

      {/* Reports & Intelligence */}
      {activeView === 'reports' && (
        <ReportsView />
      )}

      {/* JardProc Management */}
      {activeView === 'jardproc' && (
        <JardProcProducts />
      )}

      {activeView === 'jardproc-orders' && (
        <JardProcOrders />
      )}

      {/* Forms View */}
      {(activeView === 'add-house' || activeView === 'add-child') && (
        <div className="max-w-4xl mx-auto py-10 animate-in fade-in slide-in-from-bottom-8 duration-500">
          <button 
            onClick={() => setActiveView(activeView === 'add-child' ? 'child-investments' : 'estates')}
            className="mb-8 flex items-center gap-2 text-zinc-500 hover:text-indigo-600 transition-all font-semibold"
          >
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M10 19l-7-7m0 0l7-7m-7 7h18"></path></svg>
            Back to {activeView === 'add-child' ? 'Child Investments' : 'Estates List'}
          </button>
          
          {activeView === 'add-house' ? (
            <div className="relative">
              {isSubmitting && <Loader overlay message="Publishing Property..." />}
              <EstateForm onSubmit={handleAddHouse} onCancel={() => setActiveView('estates')} />
            </div>
          ) : (
            <div className="relative">
              {isSubmitting && <Loader overlay message="Updating Records..." />}
              <ChildForm onSubmit={handleAddChild} onCancel={() => setActiveView('child-investments')} />
            </div>
          )}
        </div>
      )}

      {/* Bulk Estate Upload */}
      {activeView === 'bulk-estate-upload' && (
        <BulkEstateUpload />
      )}

      {/* Placeholder for other views */}
      {['users', 'reports', 'settings'].includes(activeView) && (
        <div className="flex flex-col items-center justify-center py-20 text-center animate-in zoom-in-95 duration-500">
          <div className="w-20 h-20 bg-zinc-100 dark:bg-zinc-800 rounded-full flex items-center justify-center mb-6">
            <svg className="w-10 h-10 text-zinc-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 6V4m0 2a2 2 0 100 4m0-4a2 2 0 110 4m-6 8a2 2 0 100-4m0 4a2 2 0 110-4m0 4v2m0-6V4m6 6v10m6-2a2 2 0 100-4m0 4a2 2 0 110-4m0 4v2m0-6V4"></path>
            </svg>
          </div>
          <h3 className="text-xl font-bold text-zinc-900 dark:text-white capitalize">{activeView} Module</h3>
          <p className="text-zinc-500 dark:text-zinc-400 mt-2">This feature is currently under development.</p>
          <button 
            onClick={() => setActiveView('dashboard')}
            className="mt-8 px-6 py-2 bg-zinc-900 dark:bg-white text-white dark:text-zinc-900 rounded-xl font-bold text-sm"
          >
            Return Home
          </button>
        </div>
      )}

      {/* Edit Modal for Estate */}
      <Modal 
        isOpen={!!editingEstate} 
        onClose={() => setEditingEstate(null)}
        title="Edit Estate Details"
      >
        <div className="relative">
          {isSubmitting && <Loader overlay message="Syncing Details..." />}
          <EstateForm 
            key={editingEstate?._id || 'edit'}
            initialData={editingEstate} 
            onSubmit={handleUpdateHouse} 
            onCancel={() => setEditingEstate(null)} 
          />
        </div>
      </Modal>

      {/* Edit Modal for Child Investment */}
      <Modal 
        isOpen={!!editingChild} 
        onClose={() => setEditingChild(null)}
        title="Edit Child Investment"
      >
        <ChildForm 
          initialData={editingChild} 
          onSubmit={handleUpdateChild} 
          onCancel={() => setEditingChild(null)} 
        />
      </Modal>
    </main>
  );
};

export default DashboardPage;