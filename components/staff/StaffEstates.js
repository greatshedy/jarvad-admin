'use client';

import React, { useEffect, useState } from 'react';
import { staffApi } from '@/staffApi';
import Loader from '../Loader';
import Modal from '../Modal';
import EstateForm from '../EstateForm';
import ManagementTable from '../ManagementTable';

const StaffEstates = () => {
  const [houses, setHouses] = useState([]);
  const [isFetching, setIsFetching] = useState(true);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [showCreate, setShowCreate] = useState(false);
  const [editingEstate, setEditingEstate] = useState(null);
  const [error, setError] = useState('');

  const fetchHouses = async () => {
    try {
      setIsFetching(true);
      setError('');
      const response = await staffApi.get('/houses');
      if (response.data.status === 200) {
        setHouses(response.data.data || []);
      } else {
        setError(response.data.message || 'Unable to load estates.');
      }
    } catch (err) {
      setError(err.response?.data?.detail || err.response?.data?.message || 'Unable to load estates.');
    } finally {
      setIsFetching(false);
    }
  };

  useEffect(() => {
    fetchHouses();
  }, []);

  const buildFormData = (houseData, imageFiles, existingUrls) => {
    const formData = new FormData();
    formData.append('house_name', houseData.house_name);
    formData.append('house_about', houseData.house_about);
    formData.append('house_location', houseData.house_location);
    formData.append('house_status', houseData.house_status);
    formData.append('house_type', houseData.house_type);
    formData.append('house_is_promo', houseData.house_is_promo);
    formData.append('house_promo_type', houseData.house_promo_type);
    formData.append('house_promo_value', houseData.house_promo_value);
    formData.append('promo_visible', houseData.promo_visible !== false);
    formData.append('promo_starts_at', houseData.promo_starts_at || '');
    formData.append('promo_ends_at', houseData.promo_ends_at || '');
    formData.append('promo_label', houseData.promo_label || '');
    formData.append('promo_terms', houseData.promo_terms || '');
    formData.append('promo_applies_to', houseData.promo_applies_to || 'unit_price');
    formData.append('land_enabled', houseData.land_enabled !== false);
    formData.append('housing_enabled', Boolean(houseData.housing_enabled));
    formData.append('property_type_prices', JSON.stringify(houseData.property_type_prices || {}));
    formData.append('housing_unit_types', JSON.stringify(houseData.housing_unit_types || []));
    formData.append('housing_registration_fee', houseData.housing_registration_fee ?? '');
    formData.append('housing_savings_multiplier', houseData.housing_savings_multiplier ?? '');
    formData.append('house_pricing_plan', JSON.stringify(houseData.house_pricing_plan));
    formData.append('house_landmarks', JSON.stringify(houseData.house_landmarks));
    formData.append('house_benefits', JSON.stringify(houseData.house_benefits));
    formData.append('existing_images', JSON.stringify(existingUrls || []));

    (imageFiles || []).forEach((file) => {
      formData.append('images', file);
    });

    return formData;
  };

  const handleCreate = async (houseData, imageFiles) => {
    try {
      setIsSubmitting(true);
      setError('');
      const response = await staffApi.post('/houses', buildFormData(houseData, imageFiles, []), {
        headers: { 'Content-Type': 'multipart/form-data' },
      });
      if (response.data.status === 200) {
        setShowCreate(false);
        await fetchHouses();
      } else {
        setError(response.data.message || 'Unable to create estate.');
      }
    } catch (err) {
      setError(err.response?.data?.detail || err.response?.data?.message || 'Unable to create estate.');
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleUpdate = async (houseData, imageFiles, existingUrls) => {
    if (!editingEstate?._id) return;
    try {
      setIsSubmitting(true);
      setError('');
      const response = await staffApi.put(
        `/houses/${editingEstate._id}`,
        buildFormData(houseData, imageFiles, existingUrls),
        { headers: { 'Content-Type': 'multipart/form-data' } }
      );
      if (response.data.status === 200) {
        setEditingEstate(null);
        await fetchHouses();
      } else {
        setError(response.data.message || 'Unable to update estate.');
      }
    } catch (err) {
      setError(err.response?.data?.detail || err.response?.data?.message || 'Unable to update estate.');
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleEdit = async (id) => {
    try {
      setError('');
      const response = await staffApi.get(`/houses/${id}`);
      if (response.data.status === 200) {
        setEditingEstate(response.data.data);
      } else {
        setError(response.data.message || 'Unable to load estate.');
      }
    } catch (err) {
      setError(err.response?.data?.detail || err.response?.data?.message || 'Unable to load estate.');
    }
  };

  const handleChangeStatus = async (id) => {
    const house = houses.find((item) => item._id === id);
    const nextStatus = house?.house_status === 'Active' ? 'Sold' : 'Active';
    try {
      setError('');
      const response = await staffApi.patch(`/houses/${id}/status`, { house_status: nextStatus });
      if (response.data.status === 200) {
        await fetchHouses();
      } else {
        setError(response.data.message || 'Unable to update status.');
      }
    } catch (err) {
      setError(err.response?.data?.detail || err.response?.data?.message || 'Unable to update status.');
    }
  };

  if (isFetching && houses.length === 0) return <Loader message="Loading estates..." />;

  return (
    <div className="animate-in fade-in duration-500">
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 mb-10">
        <div>
          <h2 className="text-3xl font-extrabold tracking-tight text-zinc-900 dark:text-white">Estates</h2>
          <p className="text-zinc-500 dark:text-zinc-400 mt-1">
            Create and update estate listings. Deleting estates is restricted to administrators.
          </p>
        </div>
        <button
          onClick={() => setShowCreate(true)}
          className="px-6 py-3 bg-emerald-600 text-white font-bold rounded-2xl hover:bg-emerald-700 transition-all flex items-center justify-center gap-2"
        >
          Add New Estate
        </button>
      </div>

      {error && (
        <div className="mb-6 rounded-2xl bg-rose-50 dark:bg-rose-500/10 border border-rose-200 dark:border-rose-500/20 p-4 text-sm text-rose-600 dark:text-rose-400">
          {error}
        </div>
      )}

      <ManagementTable
        houses={houses}
        onEdit={handleEdit}
        onChangeStatus={handleChangeStatus}
        canDelete={false}
      />

      <Modal isOpen={showCreate} onClose={() => setShowCreate(false)} title="Add New Estate">
        <div className="relative">
          {isSubmitting && <Loader overlay message="Creating estate..." />}
          <EstateForm onSubmit={handleCreate} onCancel={() => setShowCreate(false)} />
        </div>
      </Modal>

      <Modal isOpen={!!editingEstate} onClose={() => setEditingEstate(null)} title="Edit Estate Details">
        <div className="relative">
          {isSubmitting && <Loader overlay message="Saving estate..." />}
          {editingEstate && (
            <EstateForm
              key={editingEstate._id}
              initialData={editingEstate}
              onSubmit={handleUpdate}
              onCancel={() => setEditingEstate(null)}
            />
          )}
        </div>
      </Modal>
    </div>
  );
};

export default StaffEstates;
