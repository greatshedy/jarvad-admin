'use client';

import React, { useState, useRef } from 'react';
import Papa from 'papaparse';
import { api } from '@/api';

const FIELDS = [
  { key: 'house_name', label: 'Estate Name', required: true },
  { key: 'house_location', label: 'Location', required: true },
  { key: 'house_about', label: 'Description', required: true },
  { key: 'house_status', label: 'Status', type: 'select', options: ['Active', 'Sold'] },
  { key: 'house_type', label: 'Type', type: 'select', options: ['residential', 'residential-commercial', 'full commercial'] },
  { key: 'house_landmarks', label: 'Landmarks (pipe | sep)' },
  { key: 'house_benefits', label: 'Benefits (pipe | sep)' },
  { key: 'house_is_promo', label: 'Promo', type: 'select', options: ['false', 'true'] },
  { key: 'house_promo_type', label: 'Promo Type', type: 'select', options: ['', 'percentage', 'fixed'] },
  { key: 'house_promo_value', label: 'Promo Value' },
];

const UPLOAD_FIELDS = ['house_pricing_plan', ...FIELDS.map(f => f.key)];

const BulkEstateUpload = () => {
  const [rows, setRows] = useState([]);
  const [fileName, setFileName] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [results, setResults] = useState(null);
  const fileInputRef = useRef(null);

  const downloadTemplate = async () => {
    try {
      const response = await api.get('/bulk-estate-template', { responseType: 'blob' });
      const url = window.URL.createObjectURL(new Blob([response.data]));
      const link = document.createElement('a');
      link.href = url;
      link.setAttribute('download', 'estate_template.csv');
      document.body.appendChild(link);
      link.click();
      link.remove();
      window.URL.revokeObjectURL(url);
    } catch (error) {
      alert('Failed to download template.');
    }
  };

  const handleFile = (e) => {
    const file = e.target.files[0];
    if (!file) return;
    setFileName(file.name);
    setResults(null);
    Papa.parse(file, {
      header: true,
      skipEmptyLines: true,
      complete: (parsed) => {
        const valid = parsed.data.map((row, i) => ({
          id: Date.now() + i,
          _valid: true,
          ...UPLOAD_FIELDS.reduce((acc, key) => ({ ...acc, [key]: row[key] || '' }), {}),
        }));
        setRows(valid);
      },
      error: () => {
        alert('Failed to parse file. Please check the format.');
      }
    });
  };

  const handleCellChange = (id, field, value) => {
    setRows(prev => prev.map(r => r.id === id ? { ...r, [field]: value } : r));
  };

  const handleRemoveRow = (id) => {
    setRows(prev => prev.filter(r => r.id !== id));
  };

  const validateRow = (row) => {
    const missing = FIELDS.filter(f => f.required && !row[f.key]?.toString().trim());
    return missing.length === 0;
  };

  const handleSubmitAll = async () => {
    if (rows.length === 0) return;
    const invalid = rows.filter(r => !validateRow(r));
    if (invalid.length > 0) {
      alert(`Please fill all required fields (Estate Name, Location, Description) for all rows before submitting. ${invalid.length} row(s) have missing data.`);
      return;
    }
    setIsSubmitting(true);
    try {
      const houses = rows.map(r => ({
        house_name: r.house_name,
        house_location: r.house_location,
        house_about: r.house_about,
        house_status: r.house_status || 'Active',
        house_type: r.house_type || '',
        house_landmarks: r.house_landmarks || '',
        house_benefits: r.house_benefits || '',
        house_pricing_plan: r.house_pricing_plan || '[]',
        house_is_promo: r.house_is_promo === 'true',
        house_promo_type: r.house_promo_type || '',
        house_promo_value: r.house_promo_value || 0,
      }));
      const response = await api.post('/bulk-add-houses', { houses });
      if (response.data.status === 200) {
        setResults(response.data.data);
        if (response.data.data.errors?.length > 0) {
          alert(`Created ${response.data.data.created} estates. ${response.data.data.errors.length} row(s) had errors.`);
        } else {
          alert(`Successfully created ${response.data.data.created} estates!`);
        }
      }
    } catch (error) {
      alert('Failed to submit estates: ' + (error?.response?.data?.message || error.message));
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleClearAll = () => {
    setRows([]);
    setFileName('');
    setResults(null);
    if (fileInputRef.current) fileInputRef.current.value = '';
  };

  return (
    <div className="max-w-7xl mx-auto p-4 sm:p-6">
      <div className="mb-6">
        <h2 className="text-2xl sm:text-3xl font-bold text-zinc-900 dark:text-white">Bulk Estate Upload</h2>
        <p className="text-sm sm:text-base text-zinc-500 dark:text-zinc-400 mt-2">
          Upload a CSV or Excel file to create multiple estates at once.
        </p>
      </div>

      <div className="flex flex-wrap gap-4 mb-6">
        <button onClick={downloadTemplate} className="btn btn-primary inline-flex items-center gap-2 px-4 py-2 sm:px-6 sm:py-3 bg-indigo-600/10 dark:bg-indigo-600/20 text-indigo-600 dark:text-indigo-400 font-semibold rounded-xl hover:bg-indigo-600 hover:text-white transition-all border border-indigo-600/20 text-sm sm:text-base">
          <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 10v6m0 0l-3-3m3 3l3-3m2 8H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z"></path></svg>
          Download Sample CSV
        </button>

        <label className="inline-flex items-center gap-2 px-4 py-2 sm:px-6 sm:py-3 bg-zinc-100 dark:bg-zinc-800 text-zinc-700 dark:text-zinc-300 font-semibold rounded-xl hover:bg-zinc-200 dark:hover:bg-zinc-700 transition-all cursor-pointer border border-zinc-300 dark:border-zinc-700 text-sm sm:text-base">
          <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M7 16a4 4 0 01-.88-7.903A5 5 0 1115.9 6L16 6a5 5 0 011 9.9M15 13l-3-3m0 0l-3 3m3-3v12"></path></svg>
          {fileName || 'Upload CSV'}
          <input ref={fileInputRef} type="file" accept=".csv" onChange={handleFile} className="hidden" />
        </label>

        {rows.length > 0 && (
          <button onClick={handleClearAll} className="px-4 py-2 sm:px-6 sm:py-3 bg-zinc-100 dark:bg-zinc-800 text-zinc-600 dark:text-zinc-400 font-semibold rounded-xl hover:bg-zinc-200 dark:hover:bg-zinc-700 transition-all border border-zinc-300 dark:border-zinc-700 text-sm sm:text-base">
            Clear All
          </button>
        )}
      </div>

      {rows.length > 0 && (
        <>
          <div className="flex items-center justify-between mb-4">
            <p className="text-sm font-semibold text-zinc-600 dark:text-zinc-400">
              {rows.length} estate{rows.length !== 1 ? 's' : ''} parsed
            </p>
            <button
              onClick={handleSubmitAll}
              disabled={isSubmitting}
              className="px-6 py-3 bg-indigo-600 text-white font-bold rounded-xl hover:bg-indigo-700 transition-all disabled:opacity-50 text-sm sm:text-base flex items-center gap-2"
            >
              {isSubmitting ? (
                <>
                  <svg className="animate-spin h-5 w-5" viewBox="0 0 24 24"><circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" fill="none" /><path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" /></svg>
                  Importing...
                </>
              ) : (
                `Import All (${rows.length})`
              )}
            </button>
          </div>

          <div className="overflow-x-auto thin-scrollbar border border-zinc-200 dark:border-zinc-800 rounded-2xl">
            <table className="min-w-[900px] w-full text-left border-collapse">
              <thead>
                <tr className="bg-zinc-50 dark:bg-zinc-800/50">
                  <th className="p-3 text-xs font-bold text-zinc-500 dark:text-zinc-400 uppercase w-10">#</th>
                  <th className="p-3 text-xs font-bold text-zinc-500 dark:text-zinc-400 uppercase w-10"></th>
                  {FIELDS.map(f => (
                    <th key={f.key} className="p-3 text-xs font-bold text-zinc-500 dark:text-zinc-400 uppercase whitespace-nowrap">
                      {f.label} {f.required && <span className="text-red-500">*</span>}
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody className="divide-y divide-zinc-100 dark:divide-zinc-800">
                {rows.map((row, idx) => (
                  <tr key={row.id} className="hover:bg-zinc-50 dark:hover:bg-zinc-800/30 transition-all">
                    <td className="p-3 text-xs text-zinc-400 font-mono">{idx + 1}</td>
                    <td className="p-3">
                      <button onClick={() => handleRemoveRow(row.id)} className="text-zinc-400 hover:text-red-500 transition-colors" title="Remove row">
                        <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M6 18L18 6M6 6l12 12"></path></svg>
                      </button>
                    </td>
                    {FIELDS.map(f => (
                      <td key={f.key} className="p-2">
                        {f.type === 'select' ? (
                          <select
                            value={row[f.key] || ''}
                            onChange={(e) => handleCellChange(row.id, f.key, e.target.value)}
                            className="w-full px-2 py-1.5 rounded-lg border border-zinc-200 dark:border-zinc-700 bg-transparent text-xs focus:ring-2 focus:ring-indigo-500 outline-none dark:text-white"
                          >
                            {f.options.map(o => (
                              <option key={o} value={o}>{o || '(none)'}</option>
                            ))}
                          </select>
                        ) : f.key === 'house_about' ? (
                          <textarea
                            value={row[f.key] || ''}
                            onChange={(e) => handleCellChange(row.id, f.key, e.target.value)}
                            rows={2}
                            className="w-full px-2 py-1.5 rounded-lg border border-zinc-200 dark:border-zinc-700 bg-transparent text-xs focus:ring-2 focus:ring-indigo-500 outline-none dark:text-white resize-none"
                          />
                        ) : (
                          <input
                            type="text"
                            value={row[f.key] || ''}
                            onChange={(e) => handleCellChange(row.id, f.key, e.target.value)}
                            placeholder={f.label}
                            className="w-full px-2 py-1.5 rounded-lg border border-zinc-200 dark:border-zinc-700 bg-transparent text-xs focus:ring-2 focus:ring-indigo-500 outline-none dark:text-white"
                          />
                        )}
                      </td>
                    ))}
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          {results && results.errors?.length > 0 && (
            <div className="mt-6 p-4 bg-red-50 dark:bg-red-500/10 border border-red-200 dark:border-red-800 rounded-2xl">
              <h4 className="text-sm font-bold text-red-600 dark:text-red-400 mb-2">Row Errors</h4>
              <ul className="text-xs text-red-600 dark:text-red-400 space-y-1">
                {results.errors.map((e, i) => (
                  <li key={i}>Row {e.row} ({e.name}): {e.error}</li>
                ))}
              </ul>
            </div>
          )}
        </>
      )}

      {rows.length === 0 && !fileName && (
        <div className="text-center py-20 border-2 border-dashed border-zinc-200 dark:border-zinc-800 rounded-3xl">
          <svg className="w-16 h-16 mx-auto text-zinc-300 dark:text-zinc-600 mb-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="1.5" d="M7 16a4 4 0 01-.88-7.903A5 5 0 1115.9 6L16 6a5 5 0 011 9.9M15 13l-3-3m0 0l-3 3m3-3v12"></path></svg>
          <h3 className="text-lg font-bold text-zinc-500 dark:text-zinc-400">No file selected</h3>
          <p className="text-sm text-zinc-400 dark:text-zinc-500 mt-2">Download the sample CSV, fill it in, then upload here.</p>
        </div>
      )}
    </div>
  );
};

export default BulkEstateUpload;
