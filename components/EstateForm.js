'use client';

import React, { useState } from 'react';

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

      setFormData({
        ...defaultState,
        ...freshData,
        // Explicitly ensuring house_image is a fresh, unique array
        house_image: [...(freshData.house_image || [])]
      });
    }
  }, [initialData]);

  const [showPlanForm, setShowPlanForm] = useState(false);
  const [landmarkInput, setLandmarkInput] = useState('');
  const [benefitInput, setBenefitInput] = useState('');
  const [installmentInput, setInstallmentInput] = useState('');
  const [currentPlan, setCurrentPlan] = useState({
    unitSqm: '',
    outrightPrice: '',
    percentageIncrease: '',
    numInstallments: [],
    downPayment: '',
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
    if (!currentPlan.unitSqm || !currentPlan.outrightPrice) {
      alert('Please fill in at least the Unit and Outright Price');
      return;
    }
    setFormData((prev) => ({
      ...prev,
      house_pricing_plan: [...(prev.house_pricing_plan || []), { ...currentPlan, id: Date.now() }],
    }));
    setCurrentPlan({
      unitSqm: '',
      outrightPrice: '',
      percentageIncrease: '',
      numInstallments: [],
      downPayment: '',
    });
    setInstallmentInput('');
    setShowPlanForm(false);
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

  const handleFileChange = (e) => {
    const files = Array.from(e.target.files);
    const existingCount = formData.house_image?.length || 0;
    const remainingSlots = 5 - existingCount;
    
    if (files.length > remainingSlots) {
      alert(`You can only add ${remainingSlots} more image(s). (Max 5 total)`);
    }

    const filesToProcess = files.slice(0, remainingSlots);

    filesToProcess.forEach(file => {
      const reader = new FileReader();
      reader.onloadend = () => {
        setFormData(prev => ({
          ...prev,
          house_image: [...(prev.house_image || []), reader.result]
        }));
      };
      reader.readAsDataURL(file);
    });
  };

  const handleRemoveImage = (index) => {
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
    if (onSubmit) {
      // Clean Handover: Deep clone the formData to ensure it's a completely fresh object
      const finalSubmissionData = JSON.parse(JSON.stringify(formData));
      console.log(`[FORM] Submitting data for "${finalSubmissionData.house_name}":`, finalSubmissionData);
      onSubmit(finalSubmissionData);
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

        {/* Pricing Plans Section */}
        <div className="pt-6 border-t border-zinc-200 dark:border-zinc-800">
          <div className="flex items-center justify-between mb-6">
          <h3 className="text-lg sm:text-xl font-bold text-zinc-900 dark:text-white">Pricing Plans</h3>
          {!showPlanForm && (
            <button
              type="button"
              onClick={() => setShowPlanForm(true)}
              className="inline-flex items-center gap-2 px-4 sm:px-6 py-2 sm:py-3 bg-indigo-600/10 dark:bg-indigo-600/20 text-indigo-600 dark:text-indigo-400 font-semibold rounded-xl hover:bg-indigo-600 hover:text-white transition-all active:scale-95 border border-indigo-600/20 text-sm sm:text-base"
            >
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 6v6m0 0v6m0-6h6m-6 0H6"></path>
                </svg>
                Add pricing plan
              </button>
            )}
          </div>

          {/* List of Added Plans */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 mb-8">
            {formData.house_pricing_plan.map((plan) => (
              <div key={plan.id} className="relative p-5 bg-zinc-50 dark:bg-zinc-800/50 border border-zinc-200 dark:border-zinc-700 rounded-2xl group transition-all hover:border-indigo-500/50">
                <button
                  type="button"
                  onClick={() => removePlan(plan.id)}
                  className="absolute top-4 right-4 text-zinc-400 hover:text-red-500 transition-colors"
                >
                  <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M6 18L18 6M6 6l12 12"></path>
                  </svg>
                </button>
                <div className="space-y-1">
                  <p className="text-sm font-bold text-indigo-600 dark:text-indigo-400 uppercase tracking-wider">{plan.unitSqm} SQM</p>
                  <p className="text-lg font-bold text-zinc-900 dark:text-white capitalize">Outright: ₦{Number(plan.outrightPrice).toLocaleString()}</p>
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
                  onClick={() => setShowPlanForm(false)}
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
