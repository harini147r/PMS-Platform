import React, { useState } from 'react';
import { Upload, FileSpreadsheet, Check, AlertTriangle, X, Download, Loader2 } from 'lucide-react';
import api from '../api';

export default function ExcelImportModal({ isOpen, onClose, onSuccess }) {
  const [file, setFile] = useState(null);
  const [loadingPreview, setLoadingPreview] = useState(false);
  const [loadingCommit, setLoadingCommit] = useState(false);
  const [previewData, setPreviewData] = useState(null);
  const [error, setError] = useState('');

  if (!isOpen) return null;

  const handleFileChange = async (e) => {
    const selected = e.target.files[0];
    if (!selected) return;
    if (!selected.name.endsWith('.xlsx')) {
      setError('Please select a valid Excel file (.xlsx)');
      return;
    }
    setFile(selected);
    setError('');

    // Instant Preview Upload
    const formData = new FormData();
    formData.append('file', selected);
    try {
      setLoadingPreview(true);
      const res = await api.post('/excel/preview', formData, {
        headers: { 'Content-Type': 'multipart/form-data' }
      });
      setPreviewData(res.data);
    } catch (err) {
      console.error(err);
      setError(err.response?.data?.detail || 'Failed to parse Excel file. Ensure columns match required headers.');
      setPreviewData(null);
    } finally {
      setLoadingPreview(false);
    }
  };

  const handleConfirmImport = async () => {
    if (!previewData || previewData.valid_count === 0) return;
    try {
      setLoadingCommit(true);
      const validRows = previewData.rows.filter(r => r.is_valid);
      const res = await api.post('/excel/confirm', { rows: validRows });
      onSuccess?.(res.data.imported_count);
      onClose();
    } catch (err) {
      console.error(err);
      setError(err.response?.data?.detail || 'Failed to commit records to database.');
    } finally {
      setLoadingCommit(false);
    }
  };

  const downloadSampleTemplate = async () => {
    const res = await api.get('/excel/student-template', { responseType: 'blob' });
    const url = URL.createObjectURL(res.data);
    const link = document.createElement('a');
    link.setAttribute('href', url);
    link.setAttribute('download', 'student_import_template.xlsx');
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-xs animate-in fade-in">
      <div className="bg-white w-full max-w-4xl rounded-2xl shadow-2xl border border-slate-200 overflow-hidden flex flex-col max-h-[90vh]">
        {/* Header */}
        <div className="px-6 py-4 border-b border-slate-200 flex items-center justify-between bg-slate-50">
          <div className="flex items-center space-x-3">
            <div className="p-2 bg-emerald-100 text-emerald-700 rounded-lg">
              <FileSpreadsheet className="w-5 h-5" />
            </div>
            <div>
              <h3 className="font-bold text-slate-800 text-base">Bulk Student Import (Excel .xlsx)</h3>
              <p className="text-xs text-slate-500">Upload, validate data types, inspect duplicates, and confirm import</p>
            </div>
          </div>
          <button 
            onClick={onClose}
            className="p-1 rounded-lg text-slate-400 hover:text-slate-700 hover:bg-slate-200/60"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Content Body */}
        <div className="p-6 overflow-y-auto space-y-5 flex-1">
          {error && (
            <div className="p-3 bg-rose-50 border border-rose-200 rounded-lg text-rose-700 text-xs flex items-center space-x-2">
              <AlertTriangle className="w-4 h-4 shrink-0" />
              <span>{error}</span>
            </div>
          )}

          {/* Upload Dropzone */}
          {!previewData && (
            <div className="space-y-4">
              <label className="border-2 border-dashed border-slate-300 hover:border-indigo-500 rounded-xl p-8 flex flex-col items-center justify-center cursor-pointer bg-slate-50/50 hover:bg-indigo-50/30 transition-all text-center">
                <Upload className="w-10 h-10 text-indigo-500 mb-2 animate-bounce" />
                <span className="text-sm font-semibold text-slate-700">Choose Excel File (.xlsx)</span>
                <span className="text-xs text-slate-400 mt-1">Supports standard student master rosters with automatic column mapping</span>
                <input 
                  type="file" 
                  accept=".xlsx" 
                  className="hidden" 
                  onChange={handleFileChange} 
                />
              </label>

              <div className="flex items-center justify-between p-3 bg-indigo-50/60 border border-indigo-100 rounded-xl">
                <div className="flex items-center space-x-2 text-xs text-indigo-900">
                  <Download className="w-4 h-4 text-indigo-600" />
                    <span>Need the standard placement master format?</span>
                </div>
                <button
                  type="button"
                  onClick={downloadSampleTemplate}
                  className="text-xs font-bold text-indigo-700 hover:text-indigo-900 bg-white px-3 py-1.5 rounded-lg border border-indigo-200 shadow-xs"
                >
                  Download Template
                </button>
              </div>
            </div>
          )}

          {loadingPreview && (
            <div className="py-12 flex flex-col items-center justify-center space-y-2">
              <Loader2 className="w-8 h-8 text-indigo-600 animate-spin" />
              <p className="text-xs font-semibold text-slate-600">Validating columns, required fields & duplicates...</p>
            </div>
          )}

          {/* Preview Table */}
          {previewData && !loadingPreview && (
            <div className="space-y-4">
              <div className="flex items-center justify-between flex-wrap gap-2 p-3 bg-slate-100 rounded-xl text-xs">
                <div className="flex items-center space-x-4">
                  <span className="font-semibold text-slate-700">Total Rows: {previewData.total_rows}</span>
                  <span className="font-bold text-emerald-700 flex items-center space-x-1">
                    <Check className="w-3.5 h-3.5" />
                    <span>Valid: {previewData.valid_count}</span>
                  </span>
                  {previewData.invalid_count > 0 && (
                    <span className="font-bold text-rose-700 flex items-center space-x-1">
                      <AlertTriangle className="w-3.5 h-3.5" />
                      <span>Errors / Duplicates: {previewData.invalid_count}</span>
                    </span>
                  )}
                </div>
                <button
                  type="button"
                  onClick={() => { setPreviewData(null); setFile(null); }}
                  className="text-xs text-indigo-600 hover:underline font-semibold"
                >
                  Upload different file
                </button>
              </div>

              {/* Scrollable Preview Table */}
              <div className="border border-slate-200 rounded-xl overflow-hidden max-h-64 overflow-y-auto">
                <table className="w-full text-left text-xs">
                  <thead className="bg-slate-100 sticky top-0 border-b border-slate-200 text-slate-600 font-semibold">
                    <tr>
                      <th className="p-2.5">Row</th>
                      <th className="p-2.5">Reg No</th>
                      <th className="p-2.5">Name</th>
                      <th className="p-2.5">Dept</th>
                      <th className="p-2.5">UG %</th>
                      <th className="p-2.5">Email</th>
                      <th className="p-2.5">Status</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100">
                    {previewData.rows.map((row, idx) => (
                      <tr key={idx} className={row.is_valid ? 'bg-white' : 'bg-rose-50/40'}>
                        <td className="p-2.5 font-medium text-slate-500">{row.row_index}</td>
                        <td className="p-2.5 font-bold text-slate-800">{row.reg_no}</td>
                        <td className="p-2.5 text-slate-800">{row.name}</td>
                        <td className="p-2.5 text-slate-600">{row.dept}</td>
                        <td className="p-2.5 font-medium text-slate-700">{row.ug_pct}%</td>
                        <td className="p-2.5 text-slate-600">{row.email}</td>
                        <td className="p-2.5">
                          {row.is_valid ? (
                            <span className="px-2 py-0.5 rounded-full bg-emerald-100 text-emerald-800 text-[10px] font-bold">
                              Valid
                            </span>
                          ) : (
                            <div className="space-y-0.5">
                              {row.errors.map((err, i) => (
                                <span key={i} className="block text-[10px] text-rose-700 font-medium">
                                  • {err}
                                </span>
                              ))}
                            </div>
                          )}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          )}
        </div>

        {/* Footer Actions */}
        <div className="px-6 py-4 border-t border-slate-200 flex items-center justify-between bg-slate-50">
          <button
            type="button"
            onClick={onClose}
            className="px-4 py-2 text-xs font-semibold text-slate-600 hover:text-slate-800 rounded-lg hover:bg-slate-200/70"
          >
            Cancel
          </button>
          {previewData && (
            <button
              type="button"
              disabled={loadingCommit || previewData.valid_count === 0}
              onClick={handleConfirmImport}
              className="px-5 py-2 text-xs font-bold text-white bg-indigo-600 hover:bg-indigo-700 disabled:opacity-50 rounded-lg shadow-sm flex items-center space-x-2"
            >
              {loadingCommit ? (
                <>
                  <Loader2 className="w-4 h-4 animate-spin" />
                  <span>Importing...</span>
                </>
              ) : (
                  <span>Import Valid Records ({previewData.valid_count})</span>
              )}
            </button>
          )}
        </div>
      </div>
    </div>
  );
}
