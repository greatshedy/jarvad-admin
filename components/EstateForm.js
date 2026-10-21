'use client';

import React, { useState } from 'react';

const PROPERTY_TYPE_OPTIONS = [
  { key: 'residential', label: 'Residential' },
  { key: 'residential-commercial', label: 'Residential Commercial' },
  { key: 'full_commercial', label: 'Full Commercial' },
];

const normalizePropertyTypeKey = (value) => {
  const normalized = String(value || '')
    .trim()
    .toLowerCase()
    .replace(/_/g, ' ')
    .replace(/-/g, ' ');
  if (normalized === 'residential') return 'residential';
  if (normalized === 'residential commercial') return 'residential-commercial';
  if (normalized === 'full commercial' || normalized === 'fully commercial' || normalized === 'commercial') {
    return 'full_commercial';
  }
  return normalized.replace(/\s+/g, '-');
};

const getPropertyTypeLabel = (value) =>
  PROPERTY_TYPE_OPTIONS.find((item) => item.key === normalizePropertyTypeKey(value))?.label || 'Unassigned';

const EstateForm = ({ onSubmit, onCancel, initialData }) => {
  const defaultState = {
    house_name: '',
    house_location: '',
    house_about: '',
    house_landmarks: [],
    house_benefits: [],
    house_image: [],
    house_pricing_plan: [],
    house_status: '',
    house_type: '',
    house_is_promo: false,
    house_promo_type: '',
    house_promo_value: 0,
    promo_visible: true,
    promo_starts_at: '',
    promo_ends_at: '',
    promo_label: '',
    promo_terms: '',
    promo_applies_to: 'unit_price',
    land_enabled: true,
    housing_enabled: false,
    property_type_prices: {
      residential: '',
      'residential-commercial': '',
      full_commercial: '',
    },
    housing_unit_types: [],
    housing_registration_fee: '',
    housing_savings_multiplier: '',
  };

  const [formData, setFormData] = useState({
    ...defaultState,
    ...initialData
  });

  // Ensure formData is reset and deep-cloned when initialData changes
  React.useEffect(() => {
    if (initialData) {
      // Create a fresh clone to break any remaining memory references
      const freshData = JSON.parse(JSON.stringify(initialData));

      // Normalize pricing plans to ensure numInstallments is ALWAYS an array
      if (freshData.house_pricing_plan) {
        freshData.house_pricing_plan = freshData.house_pricing_plan.map((plan) => ({
          ...plan,
          numInstallments: Array.isArray(plan.numInstallments)
            ? plan.numInstallments
            : (plan.numInstallments ? [String(plan.numInstallments)] : []),
        }));
      }

      const normalizeDateTimeInput = (value) => {
        if (!value) return '';
        const text = String(value);
        return text.length >= 16 ? text.slice(0, 16) : text;
      };

      setFormData({
        ...defaultState,
        ...freshData,
        promo_starts_at: normalizeDateTimeInput(freshData.promo_starts_at),
        promo_ends_at: normalizeDateTimeInput(freshData.promo_ends_at),
        property_type_prices: {
          ...defaultState.property_type_prices,
          ...(freshData.property_type_prices && typeof freshData.property_type_prices === 'object'
            ? freshData.property_type_prices
            : {}),
        },
        housing_unit_types: Array.isArray(freshData.housing_unit_types)
          ? freshData.housing_unit_types
          : [],
        // Explicitly ensuring house_image is a fresh, unique array
        house_image: [...(freshData.house_image || [])]
      });
    }
  }, [initialData]);

  const [imageFiles, setImageFiles] = useState([]);
  const [showPlanForm, setShowPlanForm] = useState(false);

  const [landmarkInput, setLandmarkInput] = useState('');
  const [benefitInput, setBenefitInput] = useState('');
  const [installmentInput, setInstallmentInput] = useState('');
  const [currentPlan, setCurrentPlan] = useState({
    propertyType: '',
    unitSqm: '',
    outrightPrice: '',
    percentageIncrease: '',
    numInstallments: [],
    downPayment: '',
  });

  const [showUnitForm, setShowUnitForm] = useState(false);
  const [currentUnit, setCurrentUnit] = useState({
    name: '',
    price: '',
    is_custom: false,
    enabled: true,
  });

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData((prev) => ({
      ...prev,
      [name]: value,
    }));
  };

  const handlePlanChange = (e) => {
    const { name, value } = e.target;
    setCurrentPlan((prev) => ({
      ...prev,
      [name]: value,
    }));
  };

  const savePlan = () => {
    const normalizedType = normalizePropertyTypeKey(currentPlan.propertyType);
    if (!normalizedType || !PROPERTY_TYPE_OPTIONS.some((item) => item.key === normalizedType)) {
      alert('Please select a property type.');
      return;
    }
    if (!currentPlan.unitSqm || !currentPlan.outrightPrice) {
      alert('Please fill in at least the unit/SQM and outright price.');
      return;
    }

    const plans = formData.house_pricing_plan || [];
    const sameTypePlan = plans.find(
      (plan) => normalizePropertyTypeKey(plan.propertyType) === normalizedType
    );

    if (sameTypePlan && sameTypePlan.id !== currentPlan.id) {
      const shouldReplace = window.confirm(
        `A ${getPropertyTypeLabel(normalizedType)} pricing plan already exists for this estate. Do you want to replace it?`
      );
      if (!shouldReplace) return;
    }

    setFormData((prev) => {
      const previousPlans = prev.house_pricing_plan || [];
      const planId = sameTypePlan?.id || currentPlan.id || Date.now();
      const nextPlan = {
        ...currentPlan,
        propertyType: normalizedType,
        price: currentPlan.outrightPrice,
        id: planId,
      };
      const nextPlans = previousPlans.filter(
        (plan) => plan.id !== planId && normalizePropertyTypeKey(plan.propertyType) !== normalizedType
      );
      nextPlans.push(nextPlan);
      nextPlans.sort(
        (a, b) =>
          PROPERTY_TYPE_OPTIONS.findIndex((item) => item.key === normalizePropertyTypeKey(a.propertyType)) -
          PROPERTY_TYPE_OPTIONS.findIndex((item) => item.key === normalizePropertyTypeKey(b.propertyType))
      );
      return {
        ...prev,
        house_pricing_plan: nextPlans,
      };
    });

    setCurrentPlan({
      propertyType: '',
      unitSqm: '',
      outrightPrice: '',
      percentageIncrease: '',
      numInstallments: [],
      downPayment: '',
    });
    setInstallmentInput('');
    setShowPlanForm(false);
  };

  const editPlan = (plan) => {
    setCurrentPlan({
      ...plan,
      propertyType: normalizePropertyTypeKey(plan.propertyType),
      unitSqm: plan.unitSqm ?? '',
      outrightPrice: plan.outrightPrice ?? plan.price ?? '',
      price: plan.outrightPrice ?? plan.price ?? '',
      percentageIncrease: plan.percentageIncrease ?? '',
      downPayment: plan.downPayment ?? '',
      numInstallments: Array.isArray(plan.numInstallments)
        ? plan.numInstallments
        : plan.numInstallments
        ? [String(plan.numInstallments)]
        : [],
    });
    setInstallmentInput('');
    setShowPlanForm(true);
  };

  const addStandardUnits = () => {
    const standard = [
      { name: 'One Bedroom Flat', price: '', is_custom: false, enabled: true },
      { name: 'Two Bedroom Flat', price: '', is_custom: false, enabled: true },
      { name: '3 Bedroom Duplex', price: '', is_custom: false, enabled: true },
      { name: 'Custom', price: '', is_custom: true, enabled: true },
    ].map((unit) => ({ ...unit, id: `${Date.now()}-${Math.random().toString(36).slice(2, 7)}` }));

    setFormData((prev) => {
      const existing = prev.housing_unit_types || [];
      const existingNames = new Set(existing.map((unit) => String(unit.name || '').toLowerCase()));
      return {
        ...prev,
        housing_unit_types: [
          ...existing,
          ...standard.filter((unit) => !existingNames.has(unit.name.toLowerCase())),
        ],
      };
    });
  };

  const saveUnit = () => {
    if (!currentUnit.name.trim()) {
      alert('Please enter a unit name');
      return;
    }
    if (!currentUnit.is_custom && Number(currentUnit.price) <= 0) {
      alert('Please enter the structure price');
      return;
    }
    setFormData((prev) => {
      const units = prev.housing_unit_types || [];
      const exists = Boolean(currentUnit.id) && units.some((unit) => unit.id === currentUnit.id);
      const savedUnit = {
        ...currentUnit,
        name: currentUnit.name.trim(),
        price: currentUnit.price,
      };
      return {
        ...prev,
        housing_unit_types: exists
          ? units.map((unit) => (unit.id === currentUnit.id ? savedUnit : unit))
          : [...units, { ...savedUnit, id: `${Date.now()}-${Math.random().toString(36).slice(2, 7)}` }],
      };
    });
    setCurrentUnit({ name: '', price: '', is_custom: false, enabled: true });
    setShowUnitForm(false);
  };

  const editUnit = (unit) => {
    setCurrentUnit({ ...unit });
    setShowUnitForm(true);
  };

  const removeUnit = (id) => {
    setFormData((prev) => ({
      ...prev,
      housing_unit_types: (prev.housing_unit_types || []).filter((unit) => unit.id !== id),
    }));
  };

  const handleAddInstallment = (e) => {
    if (e.key === ',' || e.key === 'Enter') {
      e.preventDefault();
      const val = installmentInput.trim().replace(/,$/, '');
      if (val && !currentPlan.numInstallments.includes(val)) {
        setCurrentPlan(prev => ({
          ...prev,
          numInstallments: [...prev.numInstallments, val]
        }));
        setInstallmentInput('');
      }
    }
  };

  const handleRemoveInstallment = (valToRemove) => {
    setCurrentPlan(prev => ({
      ...prev,
      numInstallments: prev.numInstallments.filter(v => v !== valToRemove)
    }));
  };

  const removePlan = (id) => {
    setFormData((prev) => ({
      ...prev,
      house_pricing_plan: prev.house_pricing_plan.filter((plan) => plan.id !== id),
    }));
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

          // Max dimension to help reduce size
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

          // Iterate quality to get under 200KB
          let quality = 0.8;
          let dataUrl = canvas.toDataURL('image/jpeg', quality);
          
          // Rough estimate of size from base64
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
    const existingCount = formData.house_image?.length || 0;
    const remainingSlots = 5 - existingCount;
    
    if (files.length > remainingSlots) {
      alert(`You can only add ${remainingSlots} more image(s). (Max 5 total)`);
    }

    const filesToProcess = files.slice(0, remainingSlots);

    for (const file of filesToProcess) {
      // Check original size (Max 10MB to avoid browser crash)
      if (file.size > 10 * 1024 * 1024) {
        alert(`Image "${file.name}" is too large (>10MB). Please resize manually.`);
        continue;
      }

      const compressedDataUrl = await compressImage(file);
      
      setFormData(prev => ({
        ...prev,
        house_image: [...(prev.house_image || []), compressedDataUrl]
      }));

      // Convert dataURL back to File for FormData submission if needed
      // (Actually, the current backend handling in admin expects these to be sent differently,
      // but keeping it consistent with the existing imageFiles state for now)
      const blob = await (await fetch(compressedDataUrl)).blob();
      const compressedFile = new File([blob], file.name, { type: 'image/jpeg' });
      setImageFiles(prev => [...prev, compressedFile]);
    }
  };

  const handleRemoveImage = (index) => {
    // Determine if this is a new image (base64) or an existing one (URL)
    const imgToRemove = formData.house_image[index];
    const isNewImage = imgToRemove.startsWith('data:');

    if (isNewImage) {
      // If it's a new image, we need to find its index in the imageFiles array
      // This is slightly tricky if there are multiple new images.
      // Let's find how many new images came before this one.
      const newImagesBefore = formData.house_image.slice(0, index).filter(img => img.startsWith('data:')).length;
      setImageFiles(prev => prev.filter((_, i) => i !== newImagesBefore));
    }

    setFormData(prev => ({
      ...prev,
      house_image: prev.house_image.filter((_, i) => i !== index)
    }));
  };


  const handleAddTag = (e, field, inputState, setInputState) => {
    if (e.key === ',' || e.key === 'Enter') {
      e.preventDefault();
      const val = inputState.trim().replace(/,$/, '');
      if (val && !formData[field].includes(val)) {
        setFormData(prev => ({
          ...prev,
          [field]: [...prev[field], val]
        }));
        setInputState('');
      }
    }
  };

  const handleRemoveTag = (field, tagToRemove) => {
    setFormData(prev => ({
      ...prev,
      [field]: prev[field].filter(t => t !== tagToRemove)
    }));
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    const missingUnitPrices = (formData.housing_unit_types || []).some(
      (unit) => !unit.is_custom && unit.enabled !== false && !(Number(unit.price) > 0)
    );
    if (formData.housing_enabled && missingUnitPrices) {
      alert('Please set a price for every non-custom housing option.');
      return;
    }
    if (formData.land_enabled) {
      const plans = formData.house_pricing_plan || [];
      const missingTypes = PROPERTY_TYPE_OPTIONS.filter(
        (option) =>
          !plans.some(
            (plan) =>
              normalizePropertyTypeKey(plan.propertyType) === option.key &&
              Number(plan.outrightPrice || plan.price || 0) > 0
          )
      );
      if (missingTypes.length > 0) {
        alert(
          `Please add a pricing plan for: ${missingTypes.map((item) => item.label).join(', ')}.`
        );
        return;
      }
    }
    if (onSubmit) {
      // Clean Handover: Deep clone the formData to ensure it's a completely fresh object
      const finalSubmissionData = JSON.parse(JSON.stringify(formData));
      finalSubmissionData.house_pricing_plan = (finalSubmissionData.house_pricing_plan || []).map((plan) => ({
        ...plan,
        propertyType: normalizePropertyTypeKey(plan.propertyType),
      }));
      
      // Separate existing URLs from new base64 images
      // (Backend now expects raw Files, but we keep URLs for "no-change" on edit)
      const existingUrls = finalSubmissionData.house_image.filter(img => !img.startsWith('data:'));
      
      console.log(`[FORM] Submitting data for "${finalSubmissionData.house_name}":`, finalSubmissionData);
      onSubmit(finalSubmissionData, imageFiles, existingUrls);

    } else {
      console.log('Final Submission Data:', formData);
      alert(`Estate "${formData.house_name}" ${initialData ? 'updated' : 'created'} with ${formData.house_pricing_plan.length} pricing plans!`);
    }
  };

  return (
    <div className="max-w-4xl mx-auto p-4 sm:p-6 bg-white dark:bg-zinc-900 rounded-2xl sm:rounded-[2.5rem] shadow-xl border border-zinc-200 dark:border-zinc-800 transition-all duration-300 hover:shadow-2xl">
      {!initialData && (
        <div className="mb-6 sm:mb-8 text-center sm:text-left">
          <h2 className="text-2xl sm:text-3xl font-bold text-zinc-900 dark:text-white">Add New Estate</h2>
          <p className="text-sm sm:text-base text-zinc-500 dark:text-zinc-400 mt-2">Fill in the details below to list a new property.</p>
        </div>
      )}

      <form onSubmit={handleSubmit} className="space-y-6">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {/* Estate Name */}
          <div className="space-y-2">
            <label htmlFor="house_name" className="text-sm font-semibold text-zinc-700 dark:text-zinc-300">
              Estate Name
            </label>
            <input
              type="text"
              id="house_name"
              name="house_name"
              value={formData.house_name}
              onChange={handleChange}
              placeholder="e.g. Lavender Courts"
              className="w-full px-4 py-2 sm:py-3 rounded-xl border border-zinc-300 dark:border-zinc-700 bg-transparent focus:ring-2 focus:ring-indigo-500 focus:border-transparent outline-none transition-all dark:text-white text-sm sm:text-base"
              required
            />
          </div>

          {/* House Status (Radio) */}
          <div className="space-y-2">
            <label className="text-sm font-semibold text-zinc-700 dark:text-zinc-300">
              House Status
            </label>
            <div className="grid grid-cols-2 gap-4">
              <button
                type="button"
                onClick={() => setFormData(prev => ({ ...prev, house_status: 'Active' }))}
                className={`flex items-center justify-center gap-2 px-4 py-2 sm:py-3 rounded-xl border transition-all ${
                  formData.house_status === 'Active'
                    ? 'border-emerald-500 bg-emerald-50 dark:bg-emerald-500/10 text-emerald-600'
                    : 'border-zinc-200 dark:border-zinc-800 bg-transparent text-zinc-500'
                }`}
              >
                <div className={`w-2 h-2 rounded-full ${formData.house_status === 'Active' ? 'bg-emerald-500 animate-pulse' : 'bg-zinc-300 dark:bg-zinc-700'}`} />
                <span className="text-sm font-bold">Active</span>
              </button>
              <button
                type="button"
                onClick={() => setFormData(prev => ({ ...prev, house_status: 'Sold' }))}
                className={`flex items-center justify-center gap-2 px-4 py-2 sm:py-3 rounded-xl border transition-all ${
                  formData.house_status === 'Sold'
                    ? 'border-amber-500 bg-amber-50 dark:bg-amber-500/10 text-amber-600'
                    : 'border-zinc-200 dark:border-zinc-800 bg-transparent text-zinc-500'
                }`}
              >
                <div className={`w-2 h-2 rounded-full ${formData.house_status === 'Sold' ? 'bg-amber-500' : 'bg-zinc-300 dark:bg-zinc-700'}`} />
                <span className="text-sm font-bold">Sold</span>
              </button>
            </div>
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {/* Estate Location */}
          <div className="space-y-2">
            <label htmlFor="house_location" className="text-sm font-semibold text-zinc-700 dark:text-zinc-300">
              Estate Location
            </label>
            <input
              type="text"
              id="house_location"
              name="house_location"
              value={formData.house_location}
              onChange={handleChange}
              placeholder="e.g. Lagos, Nigeria"
              className="w-full px-4 py-2 sm:py-3 rounded-xl border border-zinc-300 dark:border-zinc-700 bg-transparent focus:ring-2 focus:ring-indigo-500 focus:border-transparent outline-none transition-all dark:text-white text-sm sm:text-base"
              required
            />
          </div>

          {/* House Type */}
          <div className="space-y-2">
            <label htmlFor="house_type" className="text-sm font-semibold text-zinc-700 dark:text-zinc-300">
              House Type
            </label>
            <select
              id="house_type"
              name="house_type"
              value={formData.house_type}
              onChange={handleChange}
              className="w-full px-4 py-2 sm:py-3 rounded-xl border border-zinc-300 dark:border-zinc-700 bg-transparent focus:ring-2 focus:ring-indigo-500 focus:border-transparent outline-none transition-all dark:text-white text-sm sm:text-base"
            >
              <option value="" disabled className="text-zinc-400">Select house type</option>
              <option value="residential">Residential</option>
              <option value="residential-commercial">Residential-Commercial</option>
              <option value="full commercial">Full Commercial</option>
            </select>
          </div>
        </div>

        {/* Marketplace Modes */}
        <div className="pt-6 border-t border-zinc-200 dark:border-zinc-800 space-y-5">
          <div>
            <h3 className="text-lg sm:text-xl font-bold text-zinc-900 dark:text-white">Marketplace Modes</h3>
            <p className="text-sm text-zinc-500 dark:text-zinc-400 mt-1">
              Choose which JardHouz paths this estate appears in.
            </p>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <label className="flex items-center justify-between gap-4 p-4 rounded-2xl border border-zinc-200 dark:border-zinc-700 bg-zinc-50/50 dark:bg-zinc-900/30">
              <div>
                <p className="font-bold text-zinc-900 dark:text-white">Land / Estate</p>
                <p className="text-xs text-zinc-500 dark:text-zinc-400 mt-1">Show in the Land / Estate path.</p>
              </div>
              <input
                type="checkbox"
                checked={Boolean(formData.land_enabled)}
                onChange={(e) => setFormData((prev) => ({ ...prev, land_enabled: e.target.checked }))}
                className="w-5 h-5 accent-indigo-600"
              />
            </label>
            <label className="flex items-center justify-between gap-4 p-4 rounded-2xl border border-zinc-200 dark:border-zinc-700 bg-zinc-50/50 dark:bg-zinc-900/30">
              <div>
                <p className="font-bold text-zinc-900 dark:text-white">Housing</p>
                <p className="text-xs text-zinc-500 dark:text-zinc-400 mt-1">Show only when Housing is enabled.</p>
              </div>
              <input
                type="checkbox"
                checked={Boolean(formData.housing_enabled)}
                onChange={(e) => setFormData((prev) => ({ ...prev, housing_enabled: e.target.checked }))}
                className="w-5 h-5 accent-indigo-600"
              />
            </label>
          </div>

          {formData.housing_enabled && (
            <div className="p-5 rounded-3xl border border-emerald-200 dark:border-emerald-800 bg-emerald-50/40 dark:bg-emerald-900/10 space-y-5">
              <div>
                <h4 className="font-bold text-zinc-900 dark:text-white">Housing Settings</h4>
                <p className="text-xs text-zinc-500 dark:text-zinc-400 mt-1">
                  Leave fee or multiplier blank to use the global setting.
                </p>
              </div>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <label className="text-sm font-semibold text-zinc-700 dark:text-zinc-300">One-time Registration Fee (₦)</label>
                  <input
                    type="number"
                    value={formData.housing_registration_fee ?? ''}
                    onChange={(e) => setFormData((prev) => ({ ...prev, housing_registration_fee: e.target.value }))}
                    placeholder="Global default"
                    className="w-full px-4 py-3 rounded-xl border border-zinc-200 dark:border-zinc-700 bg-white dark:bg-zinc-900 focus:ring-2 focus:ring-indigo-500 outline-none dark:text-white"
                  />
                </div>
                <div className="space-y-2">
                  <label className="text-sm font-semibold text-zinc-700 dark:text-zinc-300">Savings Multiplier (x)</label>
                  <input
                    type="number"
                    step="0.1"
                    value={formData.housing_savings_multiplier ?? ''}
                    onChange={(e) => setFormData((prev) => ({ ...prev, housing_savings_multiplier: e.target.value }))}
                    placeholder="Global default (e.g. 2)"
                    className="w-full px-4 py-3 rounded-xl border border-zinc-200 dark:border-zinc-700 bg-white dark:bg-zinc-900 focus:ring-2 focus:ring-indigo-500 outline-none dark:text-white"
                  />
                </div>
              </div>

              <div className="flex flex-wrap items-center justify-between gap-3">
                <h4 className="font-bold text-zinc-900 dark:text-white">Housing Options</h4>
                <div className="flex flex-wrap gap-2">
                  <button
                    type="button"
                    onClick={addStandardUnits}
                    className="px-4 py-2 rounded-xl text-sm font-bold border border-emerald-300 dark:border-emerald-700 text-emerald-700 dark:text-emerald-300 hover:bg-emerald-100 dark:hover:bg-emerald-900/30"
                  >
                    Add Standard Options
                  </button>
                  <button
                    type="button"
                    onClick={() => {
                      setCurrentUnit({ name: '', price: '', is_custom: false, enabled: true });
                      setShowUnitForm(true);
                    }}
                    className="px-4 py-2 rounded-xl text-sm font-bold bg-emerald-600 text-white hover:bg-emerald-700"
                  >
                    Add Option
                  </button>
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                {(formData.housing_unit_types || []).map((unit) => (
                  <div key={unit.id} className="relative p-4 rounded-2xl border border-zinc-200 dark:border-zinc-700 bg-white dark:bg-zinc-900">
                    <div className="absolute top-3 right-3 flex items-center gap-2">
                      <button
                        type="button"
                        onClick={() => editUnit(unit)}
                        className="text-xs font-bold text-indigo-600 hover:text-indigo-700"
                      >
                        Edit
                      </button>
                      <button
                        type="button"
                        onClick={() => removeUnit(unit.id)}
                        className="text-zinc-400 hover:text-red-500"
                      >
                        <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M6 18L18 6M6 6l12 12" /></svg>
                      </button>
                    </div>
                    <p className="font-bold text-zinc-900 dark:text-white pr-16">{unit.name}</p>
                    <p className={`text-sm mt-1 ${!unit.is_custom && !Number(unit.price) ? 'text-rose-500 font-semibold' : 'text-zinc-500 dark:text-zinc-400'}`}>
                      {unit.is_custom
                        ? 'Custom value entered by user'
                        : Number(unit.price) > 0
                        ? `₦${Number(unit.price).toLocaleString()}`
                        : 'Set a price'}
                    </p>
                    {unit.is_custom ? (
                      <span className="inline-block mt-2 text-[10px] font-bold uppercase tracking-wider text-emerald-600">Custom</span>
                    ) : null}
                  </div>
                ))}
                {(formData.housing_unit_types || []).length === 0 && (
                  <p className="text-sm text-zinc-500 dark:text-zinc-400 col-span-full">
                    No housing options yet. Add the standard options or create your own.
                  </p>
                )}
              </div>

              {showUnitForm && (
                <div className="p-4 rounded-2xl border border-emerald-200 dark:border-emerald-800 bg-white dark:bg-zinc-900 space-y-4">
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div className="space-y-2">
                      <label className="text-sm font-semibold text-zinc-700 dark:text-zinc-300">Option Name</label>
                      <input
                        type="text"
                        value={currentUnit.name}
                        onChange={(e) => setCurrentUnit((prev) => ({ ...prev, name: e.target.value }))}
                        placeholder="e.g. One Bedroom Flat"
                        className="w-full px-4 py-3 rounded-xl border border-zinc-200 dark:border-zinc-700 bg-transparent focus:ring-2 focus:ring-indigo-500 outline-none dark:text-white"
                      />
                    </div>
                    <div className="space-y-2">
                      <label className="text-sm font-semibold text-zinc-700 dark:text-zinc-300">Structure Price (₦)</label>
                      <input
                        type="number"
                        value={currentUnit.price}
                        onChange={(e) => setCurrentUnit((prev) => ({ ...prev, price: e.target.value }))}
                        disabled={currentUnit.is_custom}
                        placeholder={currentUnit.is_custom ? 'User enters value' : 'e.g. 15000000'}
                        className="w-full px-4 py-3 rounded-xl border border-zinc-200 dark:border-zinc-700 bg-transparent focus:ring-2 focus:ring-indigo-500 outline-none dark:text-white disabled:opacity-50"
                      />
                    </div>
                  </div>
                  <label className="flex items-center gap-3 text-sm font-semibold text-zinc-700 dark:text-zinc-300">
                    <input
                      type="checkbox"
                      checked={currentUnit.is_custom}
                      onChange={(e) => setCurrentUnit((prev) => ({ ...prev, is_custom: e.target.checked }))}
                      className="w-4 h-4 accent-emerald-600"
                    />
                    Allow user to enter a custom structure value
                  </label>
                  <div className="flex gap-3">
                    <button type="button" onClick={saveUnit} className="px-5 py-2.5 rounded-xl bg-emerald-600 text-white font-bold">Save Option</button>
                    <button type="button" onClick={() => { setShowUnitForm(false); setCurrentUnit({ name: '', price: '', is_custom: false, enabled: true }); }} className="px-5 py-2.5 rounded-xl border border-zinc-300 dark:border-zinc-700 font-bold text-zinc-600 dark:text-zinc-300">Cancel</button>
                  </div>
                </div>
              )}
            </div>
          )}
        </div>

        {/* Estate Pics (Images) */}
        <div className="space-y-4">
          <label className="text-sm font-semibold text-zinc-700 dark:text-zinc-300 flex items-center justify-between">
            <span>Estate Pictures</span>
            <span className="text-xs font-medium text-zinc-400 dark:text-zinc-500">
              {formData.house_image?.length || 0} / 5 Images
            </span>
          </label>
          
          <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-5 gap-4">
            {/* Existing Previews */}
            {formData.house_image?.map((img, index) => (
              <div key={index} className="relative group aspect-square rounded-2xl overflow-hidden border border-zinc-200 dark:border-zinc-800 bg-zinc-50 dark:bg-zinc-800/50">
                <img src={img} alt={`Preview ${index}`} className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-110" />
                <div className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center backdrop-blur-[2px]">
                  <button
                    type="button"
                    onClick={() => handleRemoveImage(index)}
                    className="p-2 bg-white/20 hover:bg-red-500/80 text-white rounded-xl transition-all hover:scale-110"
                    title="Remove Image"
                  >
                    <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                    </svg>
                  </button>
                </div>
              </div>
            ))}

            {/* Upload Button */}
            {(formData.house_image?.length || 0) < 5 && (
              <div className="relative aspect-square">
                <input
                  type="file"
                  id="house_image"
                  name="house_image"
                  onChange={handleFileChange}
                  multiple
                  accept="image/*"
                  className="hidden"
                />
                <label
                  htmlFor="house_image"
                  className="flex flex-col items-center justify-center w-full h-full border-2 border-dashed border-zinc-200 dark:border-zinc-800 rounded-2xl cursor-pointer hover:bg-zinc-50 dark:hover:bg-zinc-800/50 transition-all hover:border-indigo-500 group"
                >
                  <div className="p-2 rounded-xl bg-zinc-100 dark:bg-zinc-800 text-zinc-400 group-hover:text-indigo-500 group-hover:bg-indigo-50 dark:group-hover:bg-indigo-500/10 transition-all mb-2">
                    <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 4v16m8-8H4" />
                    </svg>
                  </div>
                  <span className="text-[10px] sm:text-xs font-bold text-zinc-500 dark:text-zinc-400">Add Image</span>
                </label>
              </div>
            )}
          </div>
        </div>

        {/* About / Description */}
        <div className="space-y-2">
          <label htmlFor="house_about" className="text-sm font-semibold text-zinc-700 dark:text-zinc-300">
            About Estate
          </label>
          <textarea
            id="house_about"
            name="house_about"
            value={formData.house_about}
            onChange={handleChange}
            rows="3"
            placeholder="Tell us about this estate..."
            className="w-full px-4 py-2 sm:py-3 rounded-xl border border-zinc-300 dark:border-zinc-700 bg-transparent focus:ring-2 focus:ring-indigo-500 focus:border-transparent outline-none transition-all dark:text-white resize-none text-sm sm:text-base"
            required
          ></textarea>
        </div>

        {/* Landmarks */}
        <div className="space-y-3">
          <label className="text-sm font-semibold text-zinc-700 dark:text-zinc-300">
            Landmarks
          </label>
          <div className="flex flex-wrap gap-2 p-3 min-h-[100px] rounded-2xl border border-zinc-200 dark:border-zinc-800 bg-zinc-50/50 dark:bg-zinc-900/30 focus-within:ring-2 focus-within:ring-indigo-500 focus-within:border-transparent transition-all">
            {formData.house_landmarks?.map((tag, i) => (
              <span key={i} className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-white dark:bg-zinc-800 border border-zinc-200 dark:border-zinc-700 text-sm font-medium text-zinc-700 dark:text-zinc-300 animate-in zoom-in-95 duration-200">
                {tag}
                <button 
                  type="button" 
                  onClick={() => handleRemoveTag('house_landmarks', tag)}
                  className="hover:text-red-500 transition-colors"
                >
                  <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M6 18L18 6M6 6l12 12"></path></svg>
                </button>
              </span>
            ))}
            <input
              type="text"
              value={landmarkInput}
              onChange={(e) => setLandmarkInput(e.target.value)}
              onKeyDown={(e) => handleAddTag(e, 'house_landmarks', landmarkInput, setLandmarkInput)}
              onBlur={() => {
                if (landmarkInput.trim()) {
                  const val = landmarkInput.trim().replace(/,$/, '');
                  if (val && !formData.house_landmarks.includes(val)) {
                    setFormData(prev => ({ ...prev, house_landmarks: [...prev.house_landmarks, val] }));
                    setLandmarkInput('');
                  }
                }
              }}
              placeholder={formData.house_landmarks?.length === 0 ? "Type landmark and press comma..." : "Add more..."}
              className="flex-1 min-w-[150px] bg-transparent outline-none text-sm text-zinc-900 dark:text-white py-1"
            />
          </div>
        </div>

        {/* Benefits */}
        <div className="space-y-3">
          <label className="text-sm font-semibold text-zinc-700 dark:text-zinc-300">
            Benefits
          </label>
          <div className="flex flex-wrap gap-2 p-3 min-h-[100px] rounded-2xl border border-zinc-200 dark:border-zinc-800 bg-zinc-50/50 dark:bg-zinc-900/30 focus-within:ring-2 focus-within:ring-indigo-500 focus-within:border-transparent transition-all">
            {formData.house_benefits?.map((tag, i) => (
              <span key={i} className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-white dark:bg-zinc-800 border border-zinc-200 dark:border-zinc-700 text-sm font-medium text-zinc-700 dark:text-zinc-300 animate-in zoom-in-95 duration-200">
                {tag}
                <button 
                  type="button" 
                  onClick={() => handleRemoveTag('house_benefits', tag)}
                  className="hover:text-red-500 transition-colors"
                >
                  <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M6 18L18 6M6 6l12 12"></path></svg>
                </button>
              </span>
            ))}
            <input
              type="text"
              value={benefitInput}
              onChange={(e) => setBenefitInput(e.target.value)}
              onKeyDown={(e) => handleAddTag(e, 'house_benefits', benefitInput, setBenefitInput)}
              onBlur={() => {
                if (benefitInput.trim()) {
                  const val = benefitInput.trim().replace(/,$/, '');
                  if (val && !formData.house_benefits.includes(val)) {
                    setFormData(prev => ({ ...prev, house_benefits: [...prev.house_benefits, val] }));
                    setBenefitInput('');
                  }
                }
              }}
              placeholder={formData.house_benefits?.length === 0 ? "Type benefit and press comma..." : "Add more..."}
              className="flex-1 min-w-[150px] bg-transparent outline-none text-sm text-zinc-900 dark:text-white py-1"
            />
          </div>
        </div>

        {/* Promo Section */}
        <div className="pt-6 border-t border-zinc-200 dark:border-zinc-800">
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-lg sm:text-xl font-bold text-zinc-900 dark:text-white">Promotion</h3>
            <label className="relative inline-flex items-center cursor-pointer">
              <input
                type="checkbox"
                checked={formData.house_is_promo}
                onChange={(e) => setFormData(prev => ({ ...prev, house_is_promo: e.target.checked }))}
                className="sr-only peer"
              />
              <div className="w-11 h-6 bg-zinc-200 peer-focus:outline-none peer-focus:ring-2 peer-focus:ring-indigo-500 dark:peer-focus:ring-indigo-800 rounded-full peer dark:bg-zinc-700 peer-checked:after:translate-x-full rtl:peer-checked:after:-translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:start-[2px] after:bg-white after:border-zinc-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all dark:border-zinc-600 peer-checked:bg-indigo-600"></div>
              <span className="ms-3 text-sm font-semibold text-zinc-700 dark:text-zinc-300">
                {formData.house_is_promo ? 'Active' : 'Inactive'}
              </span>
            </label>
          </div>
          {formData.house_is_promo && (
            <div className="space-y-4 p-4 bg-indigo-50/50 dark:bg-indigo-900/10 border border-indigo-200 dark:border-indigo-800 rounded-2xl">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div className="space-y-2">
                  <label className="text-sm font-semibold text-zinc-700 dark:text-zinc-300">Promo Type</label>
                  <select
                    name="house_promo_type"
                    value={formData.house_promo_type}
                    onChange={handleChange}
                    className="w-full px-4 py-2 sm:py-3 rounded-xl border border-zinc-300 dark:border-zinc-700 bg-transparent focus:ring-2 focus:ring-indigo-500 focus:border-transparent outline-none transition-all dark:text-white text-sm sm:text-base"
                  >
                    <option value="" disabled>Select promo type</option>
                    <option value="percentage">Percentage Discount</option>
                    <option value="fixed">Fixed Price</option>
                  </select>
                </div>
                <div className="space-y-2">
                  <label className="text-sm font-semibold text-zinc-700 dark:text-zinc-300">
                    {formData.house_promo_type === 'percentage' ? 'Discount Percentage (%)' : 'Promo Price (₦)'}
                  </label>
                  <input
                    type="number"
                    name="house_promo_value"
                    value={formData.house_promo_value}
                    onChange={handleChange}
                    placeholder={formData.house_promo_type === 'percentage' ? 'e.g. 20' : 'e.g. 4000000'}
                    className="w-full px-4 py-2 sm:py-3 rounded-xl border border-zinc-300 dark:border-zinc-700 bg-transparent focus:ring-2 focus:ring-indigo-500 focus:border-transparent outline-none transition-all dark:text-white text-sm sm:text-base"
                  />
                </div>
                <div className="space-y-2">
                  <label className="text-sm font-semibold text-zinc-700 dark:text-zinc-300">Promo Label</label>
                  <input
                    type="text"
                    name="promo_label"
                    value={formData.promo_label || ''}
                    onChange={handleChange}
                    placeholder="e.g. Launch Promo"
                    className="w-full px-4 py-2 sm:py-3 rounded-xl border border-zinc-300 dark:border-zinc-700 bg-transparent focus:ring-2 focus:ring-indigo-500 outline-none dark:text-white"
                  />
                </div>
                <div className="space-y-2">
                  <label className="text-sm font-semibold text-zinc-700 dark:text-zinc-300">Applies To</label>
                  <select
                    name="promo_applies_to"
                    value={formData.promo_applies_to || 'unit_price'}
                    onChange={handleChange}
                    className="w-full px-4 py-2 sm:py-3 rounded-xl border border-zinc-300 dark:border-zinc-700 bg-transparent focus:ring-2 focus:ring-indigo-500 outline-none dark:text-white"
                  >
                    <option value="unit_price">All unit prices (Land/Estate + Housing)</option>
                    <option value="land_estate">Land/Estate property price only</option>
                    <option value="housing_unit">Housing unit price only</option>
                    <option value="registration_fee">Housing Registration Fee</option>
                    <option value="both">Everything (all prices + registration fee)</option>
                  </select>
                </div>
                <div className="space-y-2">
                  <label className="text-sm font-semibold text-zinc-700 dark:text-zinc-300">Starts At</label>
                  <input
                    type="datetime-local"
                    name="promo_starts_at"
                    value={formData.promo_starts_at || ''}
                    onChange={handleChange}
                    className="w-full px-4 py-2 sm:py-3 rounded-xl border border-zinc-300 dark:border-zinc-700 bg-transparent focus:ring-2 focus:ring-indigo-500 outline-none dark:text-white"
                  />
                </div>
                <div className="space-y-2">
                  <label className="text-sm font-semibold text-zinc-700 dark:text-zinc-300">Ends At</label>
                  <input
                    type="datetime-local"
                    name="promo_ends_at"
                    value={formData.promo_ends_at || ''}
                    onChange={handleChange}
                    className="w-full px-4 py-2 sm:py-3 rounded-xl border border-zinc-300 dark:border-zinc-700 bg-transparent focus:ring-2 focus:ring-indigo-500 outline-none dark:text-white"
                  />
                </div>
              </div>
              <label className="flex items-center justify-between gap-4 p-3 rounded-xl border border-indigo-200 dark:border-indigo-800 bg-white/70 dark:bg-zinc-900/40">
                <div>
                  <p className="font-semibold text-zinc-800 dark:text-zinc-200 text-sm">Show promo in the app</p>
                  <p className="text-[11px] text-zinc-500 dark:text-zinc-400 mt-0.5">
                    Hides the promo display. Use the main Promotion switch to end it. Existing enrollments keep their locked discount.
                  </p>
                </div>
                <input
                  type="checkbox"
                  checked={formData.promo_visible !== false}
                  onChange={(e) => setFormData((prev) => ({ ...prev, promo_visible: e.target.checked }))}
                  className="w-5 h-5 accent-indigo-600"
                />
              </label>
              <div className="space-y-2">
                <label className="text-sm font-semibold text-zinc-700 dark:text-zinc-300">Promo Terms</label>
                <textarea
                  name="promo_terms"
                  value={formData.promo_terms || ''}
                  onChange={handleChange}
                  rows="2"
                  placeholder="Terms shown with the promo"
                  className="w-full px-4 py-2 sm:py-3 rounded-xl border border-zinc-300 dark:border-zinc-700 bg-transparent focus:ring-2 focus:ring-indigo-500 outline-none dark:text-white resize-none"
                />
              </div>
            </div>
          )}
        </div>

        {/* Pricing Plans Section */}
        <div className="pt-6 border-t border-zinc-200 dark:border-zinc-800">
          <div className="flex items-center justify-between mb-6">
          <h3 className="text-lg sm:text-xl font-bold text-zinc-900 dark:text-white">Pricing Plans</h3>
          {!showPlanForm && (
            <button
              type="button"
              onClick={() => {
                setCurrentPlan({
                  propertyType: '',
                  unitSqm: '',
                  outrightPrice: '',
                  percentageIncrease: '',
                  numInstallments: [],
                  downPayment: '',
                });
                setInstallmentInput('');
                setShowPlanForm(true);
              }}
              className="inline-flex items-center gap-2 px-4 sm:px-6 py-2 sm:py-3 bg-indigo-600/10 dark:bg-indigo-600/20 text-indigo-600 dark:text-indigo-400 font-semibold rounded-xl hover:bg-indigo-600 hover:text-white transition-all active:scale-95 border border-indigo-600/20 text-sm sm:text-base"
            >
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 6v6m0 0v6m0-6h6m-6 0H6"></path>
                </svg>
                Add pricing plan
              </button>
            )}
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 mb-6">
            {PROPERTY_TYPE_OPTIONS.map((option) => {
              const configured = (formData.house_pricing_plan || []).some(
                (plan) =>
                  normalizePropertyTypeKey(plan.propertyType) === option.key &&
                  Number(plan.outrightPrice || plan.price || 0) > 0
              );
              return (
                <div
                  key={option.key}
                  className={`flex items-center justify-between gap-3 rounded-xl border px-4 py-3 ${
                    configured
                      ? 'border-emerald-200 dark:border-emerald-800 bg-emerald-50/60 dark:bg-emerald-900/10'
                      : 'border-rose-200 dark:border-rose-900/60 bg-rose-50/60 dark:bg-rose-950/20'
                  }`}
                >
                  <div>
                    <p className="text-xs font-black uppercase tracking-wide text-zinc-700 dark:text-zinc-200">{option.label}</p>
                    <p className={`text-[11px] font-semibold mt-1 ${configured ? 'text-emerald-600' : 'text-rose-500'}`}>
                      {configured ? 'Pricing configured' : 'Pricing missing'}
                    </p>
                  </div>
                  <span className={`text-sm font-black ${configured ? 'text-emerald-600' : 'text-rose-500'}`}>
                    {configured ? '✓' : '✕'}
                  </span>
                </div>
              );
            })}
          </div>

          {/* List of Added Plans */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 mb-8">
            {formData.house_pricing_plan.map((plan) => (
              <div key={plan.id} className="relative p-5 bg-zinc-50 dark:bg-zinc-800/50 border border-zinc-200 dark:border-zinc-700 rounded-2xl group transition-all hover:border-indigo-500/50">
                <div className="absolute top-4 right-4 flex items-center gap-2">
                  <button
                    type="button"
                    onClick={() => editPlan(plan)}
                    className="text-xs font-bold text-indigo-600 hover:text-indigo-700 transition-colors"
                  >
                    Edit
                  </button>
                  <button
                    type="button"
                    onClick={() => removePlan(plan.id)}
                    className="text-zinc-400 hover:text-red-500 transition-colors"
                  >
                    <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M6 18L18 6M6 6l12 12"></path>
                    </svg>
                  </button>
                </div>
                <div className="space-y-1 pr-16">
                  <p className="text-xs font-black text-indigo-600 dark:text-indigo-400 uppercase tracking-wider">
                    {getPropertyTypeLabel(plan.propertyType)}
                  </p>
                  <p className="text-sm font-bold text-zinc-500 dark:text-zinc-400 uppercase tracking-wider">{plan.unitSqm} SQM</p>
                  <p className="text-lg font-bold text-zinc-900 dark:text-white">Outright: ₦{Number(plan.outrightPrice || plan.price || 0).toLocaleString()}</p>
                </div>
                <div className="mt-4 pt-4 border-t border-zinc-200 dark:border-zinc-700 grid grid-cols-2 gap-4 text-xs">
                  <div>
                    <p className="text-zinc-500 dark:text-zinc-400 font-medium">Increment</p>
                    <p className="text-zinc-900 dark:text-zinc-200 font-bold">{plan.percentageIncrease || 0}%</p>
                  </div>
                  <div>
                    <p className="text-zinc-500 dark:text-zinc-400 font-medium">Installments</p>
                    <p className="text-zinc-900 dark:text-zinc-200 font-bold">
                      {Array.isArray(plan.numInstallments) ? plan.numInstallments.join(', ') : (plan.numInstallments || 0)} Months
                    </p>
                  </div>
                </div>
              </div>
            ))}
          </div>

          {/* Sub-form for Adding a Plan */}
          {showPlanForm && (
            <div className="p-6 bg-indigo-50/50 dark:bg-indigo-900/10 border border-indigo-200 dark:border-indigo-800 rounded-3xl animate-in fade-in slide-in-from-top-4 duration-300">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div className="space-y-2 col-span-full">
                  <label className="text-sm font-semibold text-zinc-700 dark:text-zinc-300">Property Type</label>
                  <select
                    name="propertyType"
                    value={currentPlan.propertyType}
                    onChange={handlePlanChange}
                    className="w-full px-4 py-3 rounded-xl border border-zinc-200 dark:border-zinc-700 bg-white dark:bg-zinc-900 focus:ring-2 focus:ring-indigo-500 outline-none dark:text-white"
                  >
                    <option value="" disabled>Select property type</option>
                    {PROPERTY_TYPE_OPTIONS.map((item) => (
                      <option key={item.key} value={item.key}>{item.label}</option>
                    ))}
                  </select>
                  <p className="text-xs text-zinc-500 dark:text-zinc-400">
                    Each property type can have one pricing plan. If it already exists, you will be asked to replace it.
                  </p>
                </div>
                <div className="space-y-2">
                  <label className="text-sm font-semibold text-zinc-700 dark:text-zinc-300">Plan unit / SQM</label>
                  <input
                    type="text"
                    name="unitSqm"
                    value={currentPlan.unitSqm}
                    onChange={handlePlanChange}
                    placeholder="e.g. 500"
                    className="w-full px-4 py-3 rounded-xl border border-zinc-200 dark:border-zinc-700 bg-white dark:bg-zinc-900 focus:ring-2 focus:ring-indigo-500 outline-none dark:text-white"
                  />
                </div>
                <div className="space-y-2">
                  <label className="text-sm font-semibold text-zinc-700 dark:text-zinc-300">Outright price (₦)</label>
                  <input
                    type="number"
                    name="outrightPrice"
                    value={currentPlan.outrightPrice}
                    onChange={handlePlanChange}
                    placeholder="e.g. 5000000"
                    className="w-full px-4 py-3 rounded-xl border border-zinc-200 dark:border-zinc-700 bg-white dark:bg-zinc-900 focus:ring-2 focus:ring-indigo-500 outline-none dark:text-white"
                  />
                </div>
                <div className="space-y-2">
                  <label className="text-sm font-semibold text-zinc-700 dark:text-zinc-300">Percentage increase (%)</label>
                  <input
                    type="number"
                    name="percentageIncrease"
                    value={currentPlan.percentageIncrease}
                    onChange={handlePlanChange}
                    placeholder="e.g. 10"
                    className="w-full px-4 py-3 rounded-xl border border-zinc-200 dark:border-zinc-700 bg-white dark:bg-zinc-900 focus:ring-2 focus:ring-indigo-500 outline-none dark:text-white"
                  />
                </div>
                <div className="space-y-2 col-span-full">
                  <label className="text-sm font-semibold text-zinc-700 dark:text-zinc-300">How many default installments?</label>
                  <div className="flex flex-wrap gap-2 p-3 min-h-[60px] rounded-xl border border-zinc-200 dark:border-zinc-700 bg-white dark:bg-zinc-900 focus-within:ring-2 focus-within:ring-indigo-500 transition-all">
                    {currentPlan.numInstallments.map((val, i) => (
                      <span key={i} className="inline-flex items-center gap-1.5 px-3 py-1 rounded-lg bg-indigo-50 dark:bg-indigo-500/10 border border-indigo-200 dark:border-indigo-800 text-xs font-bold text-indigo-600 dark:text-indigo-400">
                        {val} Months
                        <button type="button" onClick={() => handleRemoveInstallment(val)} className="hover:text-red-500">
                          <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M6 18L18 6M6 6l12 12"></path></svg>
                        </button>
                      </span>
                    ))}
                    <input
                      type="text"
                      value={installmentInput}
                      onChange={(e) => setInstallmentInput(e.target.value)}
                      onKeyDown={handleAddInstallment}
                      onBlur={() => {
                        if (installmentInput.trim()) {
                          const val = installmentInput.trim().replace(/,$/, '');
                          if (val && !currentPlan.numInstallments.includes(val)) {
                            setCurrentPlan(prev => ({ ...prev, numInstallments: [...prev.numInstallments, val] }));
                            setInstallmentInput('');
                          }
                        }
                      }}
                      placeholder={currentPlan.numInstallments.length === 0 ? "Type months (e.g. 12) and press comma..." : "Add more..."}
                      className="flex-1 min-w-[120px] bg-transparent outline-none text-sm text-zinc-900 dark:text-white"
                    />
                  </div>
                </div>
                <div className="space-y-2">
                  <label className="text-sm font-semibold text-zinc-700 dark:text-zinc-300">Down payment percentage (%)</label>
                  <input
                    type="number"
                    name="downPayment"
                    value={currentPlan.downPayment}
                    onChange={handlePlanChange}
                    placeholder="e.g. 30"
                    className="w-full px-4 py-3 rounded-xl border border-zinc-200 dark:border-zinc-700 bg-white dark:bg-zinc-900 focus:ring-2 focus:ring-indigo-500 outline-none dark:text-white"
                  />
                </div>
              </div>
              <div className="flex gap-4 mt-8">
                <button
                  type="button"
                  onClick={savePlan}
                  className="flex-1 bg-indigo-600 text-white font-bold py-3 px-6 rounded-xl hover:bg-indigo-700 transition-all active:scale-95"
                >
                  Save Plan
                </button>
                <button
                  type="button"
                  onClick={() => {
                    setShowPlanForm(false);
                    setCurrentPlan({
                      propertyType: '',
                      unitSqm: '',
                      outrightPrice: '',
                      percentageIncrease: '',
                      numInstallments: [],
                      downPayment: '',
                    });
                    setInstallmentInput('');
                  }}
                  className="px-6 py-3 border border-zinc-300 dark:border-zinc-700 text-zinc-600 dark:text-zinc-400 font-bold rounded-xl hover:bg-zinc-50 dark:hover:bg-zinc-800 transition-all"
                >
                  Cancel
                </button>
              </div>
            </div>
          )}
        </div>

        {/* Submit and Cancel Buttons */}
        <div className="pt-4 flex flex-col sm:flex-row gap-3 sm:gap-4">
          <button
            type="submit"
            className="order-1 sm:order-2 flex-1 bg-indigo-600 hover:bg-indigo-700 text-white font-bold py-3 sm:py-4 px-6 sm:px-8 rounded-xl transition-all duration-300 shadow-lg shadow-indigo-500/30 text-sm sm:text-base active:scale-95"
          >
            {initialData ? 'Update Estate Details' : 'Create Estate Listing'}
          </button>
          {onCancel && (
            <button
              type="button"
              onClick={onCancel}
              className="order-2 sm:order-1 px-6 sm:px-8 py-3 sm:py-4 bg-zinc-100 dark:bg-zinc-800 text-zinc-600 dark:text-zinc-300 font-bold rounded-xl hover:bg-zinc-200 dark:hover:bg-zinc-700 transition-all active:scale-95 text-sm sm:text-base"
            >
              Cancel
            </button>
          )}
        </div>
      </form>
    </div>
  );
};

export default EstateForm;
