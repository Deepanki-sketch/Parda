import React, { useState } from 'react';
import {
  X,
  Upload,
  FileCheck,
  FileText,
  Lock,
  Plus,
  Trash2,
  AlertCircle,
  CheckCircle2,
  RefreshCw,
  FolderPlus,
  ShieldCheck,
  HeartPulse,
} from 'lucide-react';
import {
  addPatientDocument,
  removePatientDocument,
  updateActivePatient,
  ethToInr,
  inrToEth,
} from '../services/patientAuthService';
import { computeSha256 } from '../services/cryptoService';

export default function AddHealthRecordModal({
  isOpen,
  onClose,
  currentPatient,
  onRecordUpdated,
  addAuditLog,
}) {
  const [activeTab, setActiveTab] = useState('files'); // 'files' | 'clinical' | 'prescriptions'
  const [isProcessing, setIsProcessing] = useState(false);
  const [statusMessage, setStatusMessage] = useState('');
  const [errorMessage, setErrorMessage] = useState('');

  // File Upload State
  const [selectedFile, setSelectedFile] = useState(null);
  const [fileCategory, setFileCategory] = useState('Diagnostic Report');
  const [fileNotes, setFileNotes] = useState('');

  // Clinical Update State
  const [conditionCode, setConditionCode] = useState(currentPatient?.condition?.code || 'I10');
  const [conditionDisplay, setConditionDisplay] = useState(currentPatient?.condition?.display || '');
  const [conditionSeverity, setConditionSeverity] = useState(currentPatient?.condition?.severity || 'Moderate');
  const [conditionNotes, setConditionNotes] = useState(currentPatient?.condition?.notes || '');

  // Prescription Update State
  const [medication, setMedication] = useState(currentPatient?.prescription?.medication || '');
  const [dosage, setDosage] = useState(currentPatient?.prescription?.dosage || '');
  const [refills, setRefills] = useState(currentPatient?.prescription?.refills || 2);
  const [allergies, setAllergies] = useState(currentPatient?.allergies || '');

  if (!isOpen) return null;

  const handleFileSelect = (e) => {
    const file = e.target.files[0];
    if (file) {
      setSelectedFile(file);
      setErrorMessage('');
    }
  };

  const handleFileUploadSubmit = async (e) => {
    e.preventDefault();
    if (!selectedFile) {
      setErrorMessage('Please select a file to encrypt and upload.');
      return;
    }

    setIsProcessing(true);
    setErrorMessage('');
    setStatusMessage('Encrypting file in browser RAM with AES-256-GCM...');

    try {
      const res = await addPatientDocument({
        file: selectedFile,
        category: fileCategory,
        notes: fileNotes,
      });

      setIsProcessing(false);
      setStatusMessage(`File "${selectedFile.name}" encrypted and securely attached!`);
      setSelectedFile(null);
      setFileNotes('');

      if (addAuditLog) {
        addAuditLog({
          type: 'DOCUMENT_ENCRYPTED',
          title: 'New Medical Document Encrypted',
          detail: `${selectedFile.name} (${fileCategory}) encrypted client-side | SHA-256: ${res.document.fileHash.slice(0, 16)}...`,
          time: new Date().toLocaleTimeString(),
        });
      }

      if (onRecordUpdated) {
        onRecordUpdated(res.patient);
      }

      setTimeout(() => setStatusMessage(''), 3000);
    } catch (err) {
      setIsProcessing(false);
      setErrorMessage(err.message || 'File upload failed.');
    }
  };

  const handleRemoveFile = (docId, fileName) => {
    const updated = removePatientDocument(docId);
    if (updated && onRecordUpdated) {
      onRecordUpdated(updated);
    }
    if (addAuditLog) {
      addAuditLog({
        type: 'DOCUMENT_REMOVED',
        title: 'Medical File Removed from Vault',
        detail: `Removed file ${fileName || docId}`,
        time: new Date().toLocaleTimeString(),
      });
    }
  };

  const handleClinicalSubmit = (e) => {
    e.preventDefault();
    setIsProcessing(true);
    setErrorMessage('');

    try {
      const updated = updateActivePatient({
        condition: {
          code: conditionCode,
          display: conditionDisplay,
          severity: conditionSeverity,
          recordedDate: new Date().toISOString().split('T')[0],
          notes: conditionNotes,
        },
      });

      setIsProcessing(false);
      setStatusMessage('Clinical diagnoses updated & re-encrypted!');

      if (addAuditLog) {
        addAuditLog({
          type: 'CLINICAL_UPDATED',
          title: 'Patient Diagnosis Updated',
          detail: `Condition set to ${conditionCode} - ${conditionDisplay} (${conditionSeverity})`,
          time: new Date().toLocaleTimeString(),
        });
      }

      if (onRecordUpdated) {
        onRecordUpdated(updated);
      }

      setTimeout(() => setStatusMessage(''), 3000);
    } catch (err) {
      setIsProcessing(false);
      setErrorMessage(err.message || 'Failed to update clinical record.');
    }
  };

  const handlePrescriptionSubmit = (e) => {
    e.preventDefault();
    setIsProcessing(true);
    setErrorMessage('');

    try {
      const updated = updateActivePatient({
        prescription: {
          medication,
          dosage,
          refills: parseInt(refills, 10) || 1,
          prescriber: currentPatient?.prescription?.prescriber || 'Attending Physician',
        },
        allergies,
      });

      setIsProcessing(false);
      setStatusMessage('Prescription & allergy profile updated!');

      if (addAuditLog) {
        addAuditLog({
          type: 'PRESCRIPTION_UPDATED',
          title: 'Prescription & Allergies Updated',
          detail: `Rx: ${medication} | Allergies: ${allergies}`,
          time: new Date().toLocaleTimeString(),
        });
      }

      if (onRecordUpdated) {
        onRecordUpdated(updated);
      }

      setTimeout(() => setStatusMessage(''), 3000);
    } catch (err) {
      setIsProcessing(false);
      setErrorMessage(err.message || 'Failed to update prescription.');
    }
  };

  const attachedFiles = currentPatient?.attachedFiles || [];

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 bg-forest-950/85 backdrop-blur-md overflow-y-auto">
      <div className="relative w-full max-w-2xl my-8 bg-forest-900 border border-sage-500/25 rounded-lg shadow-2xl overflow-hidden font-sans text-ivory-200">
        
        {/* Header */}
        <div className="px-6 py-4 bg-forest-800/90 border-b border-sage-500/20 flex items-center justify-between">
          <div className="flex items-center space-x-3">
            <div className="w-8 h-8 rounded bg-forest-700 border border-brass-500/40 flex items-center justify-center text-brass-400">
              <FolderPlus className="w-4 h-4" />
            </div>
            <div>
              <h2 className="text-base font-serif font-medium text-ivory-200 tracking-tight">
                Add Medical Files & Update Vault
              </h2>
              <p className="text-xs text-sage-muted font-mono mt-0.5">
                Patient: <span className="text-brass-400 font-semibold">{currentPatient?.name}</span> • Client-Side AES-256-GCM
              </p>
            </div>
          </div>

          <button
            onClick={onClose}
            className="p-1.5 rounded text-sage-muted hover:text-ivory-200 hover:bg-forest-700 transition-colors"
            title="Close"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Tab Navigation */}
        <div className="flex border-b border-sage-500/15 bg-forest-850 px-6 pt-2">
          <button
            onClick={() => { setActiveTab('files'); setErrorMessage(''); setStatusMessage(''); }}
            className={`px-4 py-2 text-xs font-medium border-b-2 transition-all flex items-center space-x-1.5 ${
              activeTab === 'files'
                ? 'border-brass-500 text-ivory-200 bg-forest-800/40'
                : 'border-transparent text-sage-muted hover:text-ivory-200'
            }`}
          >
            <Upload className="w-3.5 h-3.5 text-brass-400" />
            <span>Upload Medical Files ({attachedFiles.length})</span>
          </button>
          <button
            onClick={() => { setActiveTab('clinical'); setErrorMessage(''); setStatusMessage(''); }}
            className={`px-4 py-2 text-xs font-medium border-b-2 transition-all flex items-center space-x-1.5 ${
              activeTab === 'clinical'
                ? 'border-brass-500 text-ivory-200 bg-forest-800/40'
                : 'border-transparent text-sage-muted hover:text-ivory-200'
            }`}
          >
            <HeartPulse className="w-3.5 h-3.5 text-brass-400" />
            <span>Diagnosis & Conditions</span>
          </button>
          <button
            onClick={() => { setActiveTab('prescriptions'); setErrorMessage(''); setStatusMessage(''); }}
            className={`px-4 py-2 text-xs font-medium border-b-2 transition-all flex items-center space-x-1.5 ${
              activeTab === 'prescriptions'
                ? 'border-brass-500 text-ivory-200 bg-forest-800/40'
                : 'border-transparent text-sage-muted hover:text-ivory-200'
            }`}
          >
            <FileText className="w-3.5 h-3.5 text-brass-400" />
            <span>Prescriptions & Allergies</span>
          </button>
        </div>

        {/* Status Alerts */}
        {errorMessage && (
          <div className="mx-6 mt-4 p-3 rounded bg-rose-950/40 border border-rose-500/30 flex items-center space-x-2 text-xs text-rose-300">
            <AlertCircle className="w-4 h-4 text-rose-400 shrink-0" />
            <span>{errorMessage}</span>
          </div>
        )}

        {statusMessage && (
          <div className="mx-6 mt-4 p-3 rounded bg-emerald-950/40 border border-emerald-500/30 flex items-center space-x-2 text-xs text-emerald-300">
            <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0" />
            <span>{statusMessage}</span>
          </div>
        )}

        {/* Tab 1: Upload Files */}
        {activeTab === 'files' && (
          <div className="p-6 space-y-5">
            <form onSubmit={handleFileUploadSubmit} className="space-y-4">
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                <div>
                  <label className="block text-xs font-mono text-sage-muted mb-1">
                    Document Category
                  </label>
                  <select
                    value={fileCategory}
                    onChange={(e) => setFileCategory(e.target.value)}
                    className="w-full bg-forest-800 border border-sage-500/25 rounded px-2.5 py-1.5 text-xs text-ivory-200 focus:outline-none focus:border-brass-500"
                  >
                    <option value="Diagnostic Report">Diagnostic Report</option>
                    <option value="Prescription">Prescription</option>
                    <option value="Cardiology / ECG">Cardiology / ECG</option>
                    <option value="Lab Report">Lab Report</option>
                    <option value="Discharge Summary">Discharge Summary</option>
                    <option value="Radiology / MRI / CT">Radiology / MRI / CT</option>
                    <option value="Insurance Policy Doc">Insurance Policy Doc</option>
                  </select>
                </div>

                <div className="sm:col-span-2">
                  <label className="block text-xs font-mono text-sage-muted mb-1">
                    Select File to Encrypt
                  </label>
                  <label className="flex items-center justify-between px-3 py-1.5 border border-dashed border-sage-500/30 hover:border-brass-500 rounded bg-forest-800 cursor-pointer transition-colors">
                    <span className="text-xs text-sage-muted truncate max-w-[240px]">
                      {selectedFile ? selectedFile.name : 'Choose PDF, Scan, or Lab Report...'}
                    </span>
                    <span className="px-2 py-0.5 rounded bg-forest-700 text-[10px] font-mono text-brass-400">
                      Browse
                    </span>
                    <input
                      type="file"
                      onChange={handleFileSelect}
                      className="hidden"
                      accept=".pdf,.png,.jpg,.jpeg,.json,.txt"
                    />
                  </label>
                </div>
              </div>

              <div>
                <label className="block text-xs font-mono text-sage-muted mb-1">
                  Clinical Notes / Context (Optional)
                </label>
                <input
                  type="text"
                  value={fileNotes}
                  onChange={(e) => setFileNotes(e.target.value)}
                  placeholder="e.g. Follow-up report from Dr. Jenkins, blood pressure reading"
                  className="w-full bg-forest-800 border border-sage-500/25 rounded px-3 py-1.5 text-xs text-ivory-200 focus:outline-none focus:border-brass-500"
                />
              </div>

              <div className="flex items-center justify-between pt-1">
                <div className="text-[11px] font-mono text-emerald-400 flex items-center gap-1.5">
                  <Lock className="w-3.5 h-3.5 text-brass-400" />
                  <span>Encrypted via WebCrypto AES-256 before leaving browser</span>
                </div>

                <button
                  type="submit"
                  disabled={isProcessing || !selectedFile}
                  className="px-4 py-2 rounded bg-brass-500 hover:bg-brass-400 text-forest-950 font-medium text-xs flex items-center space-x-1.5 shadow-sm disabled:opacity-50 cursor-pointer"
                >
                  {isProcessing ? (
                    <RefreshCw className="w-3.5 h-3.5 animate-spin" />
                  ) : (
                    <>
                      <Upload className="w-3.5 h-3.5" />
                      <span>Encrypt & Attach Document</span>
                    </>
                  )}
                </button>
              </div>
            </form>

            {/* List of currently attached files */}
            <div className="pt-3 border-t border-sage-500/15 space-y-2">
              <div className="text-xs font-mono text-sage-muted flex justify-between items-center">
                <span>Existing Encrypted Vault Documents ({attachedFiles.length})</span>
                <span className="text-[10px] text-brass-400">SHA-256 Integrity Anchored</span>
              </div>

              {attachedFiles.length === 0 ? (
                <div className="p-4 rounded bg-forest-850 text-center text-xs text-sage-muted italic">
                  No medical documents attached yet.
                </div>
              ) : (
                <div className="space-y-2 max-h-56 overflow-y-auto pr-1">
                  {attachedFiles.map((doc) => (
                    <div
                      key={doc.id}
                      className="p-3 rounded bg-forest-800/80 border border-sage-500/20 flex items-center justify-between gap-3 text-xs"
                    >
                      <div className="flex items-start space-x-2.5 min-w-0">
                        <FileCheck className="w-4 h-4 text-brass-400 shrink-0 mt-0.5" />
                        <div className="min-w-0">
                          <div className="font-medium text-ivory-200 truncate">{doc.name}</div>
                          <div className="text-[10px] text-sage-muted font-mono flex flex-wrap items-center gap-2 mt-0.5">
                            <span className="text-brass-400">{doc.category}</span>
                            <span>•</span>
                            <span>{doc.sizeFormatted}</span>
                            <span>•</span>
                            <span>Uploaded {doc.uploadDate}</span>
                          </div>
                          <div className="text-[10px] font-mono text-sage-muted/70 truncate mt-0.5">
                            Hash: {doc.fileHash}
                          </div>
                        </div>
                      </div>

                      <button
                        type="button"
                        onClick={() => handleRemoveFile(doc.id, doc.name)}
                        className="text-sage-muted hover:text-rose-400 p-1 rounded transition-colors shrink-0"
                        title="Remove document from vault"
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>
        )}

        {/* Tab 2: Clinical Conditions */}
        {activeTab === 'clinical' && (
          <div className="p-6 space-y-4">
            <form onSubmit={handleClinicalSubmit} className="space-y-4">
              <div>
                <label className="block text-xs font-mono text-sage-muted mb-1">
                  ICD-10 Diagnostic Code
                </label>
                <input
                  type="text"
                  required
                  value={conditionCode}
                  onChange={(e) => setConditionCode(e.target.value)}
                  className="w-full bg-forest-800 border border-sage-500/25 rounded px-3 py-2 text-sm text-ivory-200 font-mono focus:outline-none focus:border-brass-500"
                />
              </div>

              <div>
                <label className="block text-xs font-mono text-sage-muted mb-1">
                  Clinical Diagnosis Display
                </label>
                <input
                  type="text"
                  required
                  value={conditionDisplay}
                  onChange={(e) => setConditionDisplay(e.target.value)}
                  className="w-full bg-forest-800 border border-sage-500/25 rounded px-3 py-2 text-sm text-ivory-200 focus:outline-none focus:border-brass-500"
                />
              </div>

              <div>
                <label className="block text-xs font-mono text-sage-muted mb-1">
                  Severity Level
                </label>
                <select
                  value={conditionSeverity}
                  onChange={(e) => setConditionSeverity(e.target.value)}
                  className="w-full bg-forest-800 border border-sage-500/25 rounded px-3 py-2 text-sm text-ivory-200 focus:outline-none focus:border-brass-500"
                >
                  <option value="Mild">Mild</option>
                  <option value="Moderate">Moderate</option>
                  <option value="Severe">Severe</option>
                  <option value="Acute">Acute</option>
                  <option value="Chronic Stable">Chronic Stable</option>
                </select>
              </div>

              <div>
                <label className="block text-xs font-mono text-sage-muted mb-1">
                  Clinical Notes / History
                </label>
                <textarea
                  rows={3}
                  value={conditionNotes}
                  onChange={(e) => setConditionNotes(e.target.value)}
                  className="w-full bg-forest-800 border border-sage-500/25 rounded px-3 py-2 text-xs text-ivory-200 focus:outline-none focus:border-brass-500"
                />
              </div>

              <div className="flex justify-end pt-2">
                <button
                  type="submit"
                  disabled={isProcessing}
                  className="px-4 py-2 rounded bg-brass-500 hover:bg-brass-400 text-forest-950 font-medium text-xs flex items-center space-x-1.5 cursor-pointer disabled:opacity-50"
                >
                  {isProcessing ? (
                    <RefreshCw className="w-3.5 h-3.5 animate-spin" />
                  ) : (
                    <>
                      <ShieldCheck className="w-3.5 h-3.5" />
                      <span>Save & Re-Encrypt Diagnosis</span>
                    </>
                  )}
                </button>
              </div>
            </form>
          </div>
        )}

        {/* Tab 3: Prescriptions & Allergies */}
        {activeTab === 'prescriptions' && (
          <div className="p-6 space-y-4">
            <form onSubmit={handlePrescriptionSubmit} className="space-y-4">
              <div>
                <label className="block text-xs font-mono text-sage-muted mb-1">
                  Medication & Strength
                </label>
                <input
                  type="text"
                  required
                  value={medication}
                  onChange={(e) => setMedication(e.target.value)}
                  placeholder="e.g. Lisinopril 10mg Oral Tablet"
                  className="w-full bg-forest-800 border border-sage-500/25 rounded px-3 py-2 text-sm text-ivory-200 focus:outline-none focus:border-brass-500"
                />
              </div>

              <div>
                <label className="block text-xs font-mono text-sage-muted mb-1">
                  Dosage Instructions
                </label>
                <input
                  type="text"
                  required
                  value={dosage}
                  onChange={(e) => setDosage(e.target.value)}
                  placeholder="e.g. Once daily with water"
                  className="w-full bg-forest-800 border border-sage-500/25 rounded px-3 py-2 text-sm text-ivory-200 focus:outline-none focus:border-brass-500"
                />
              </div>

              <div>
                <label className="block text-xs font-mono text-sage-muted mb-1">
                  Allowed Refills
                </label>
                <input
                  type="number"
                  min="0"
                  max="10"
                  value={refills}
                  onChange={(e) => setRefills(e.target.value)}
                  className="w-full bg-forest-800 border border-sage-500/25 rounded px-3 py-2 text-sm text-ivory-200 font-mono focus:outline-none focus:border-brass-500"
                />
              </div>

              <div>
                <label className="block text-xs font-mono text-sage-muted mb-1">
                  Drug Allergies (Critical Trauma Warning)
                </label>
                <input
                  type="text"
                  value={allergies}
                  onChange={(e) => setAllergies(e.target.value)}
                  placeholder="e.g. Penicillin, Sulfa drugs, or NKDA"
                  className="w-full bg-forest-800 border border-sage-500/25 rounded px-3 py-2 text-sm text-ivory-200 focus:outline-none focus:border-brass-500"
                />
              </div>

              <div className="flex justify-end pt-2">
                <button
                  type="submit"
                  disabled={isProcessing}
                  className="px-4 py-2 rounded bg-brass-500 hover:bg-brass-400 text-forest-950 font-medium text-xs flex items-center space-x-1.5 cursor-pointer disabled:opacity-50"
                >
                  {isProcessing ? (
                    <RefreshCw className="w-3.5 h-3.5 animate-spin" />
                  ) : (
                    <>
                      <ShieldCheck className="w-3.5 h-3.5" />
                      <span>Save & Re-Encrypt Rx Profile</span>
                    </>
                  )}
                </button>
              </div>
            </form>
          </div>
        )}

      </div>
    </div>
  );
}
