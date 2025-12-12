import React, { useState, useEffect, useRef } from 'react';
import { CertificateTemplate, CertificateData } from '../types';
import * as storageService from '../services/storageService';
import { v4 as uuidv4 } from 'uuid';
import { UploadCloud, ArrowRight, Save, Database, AlertTriangle, FileSpreadsheet, CheckCircle } from 'lucide-react';
import { useNavigate } from 'react-router-dom';

interface CsvRow {
    [key: string]: string;
}

const LegacyImport: React.FC = () => {
  const navigate = useNavigate();
  const [step, setStep] = useState<1 | 2 | 3>(1);
  const [templates, setTemplates] = useState<CertificateTemplate[]>([]);
  const [selectedTemplateId, setSelectedTemplateId] = useState<string>('');
  
  // CSV Data
  const [csvHeaders, setCsvHeaders] = useState<string[]>([]);
  const [csvData, setCsvData] = useState<CsvRow[]>([]);
  
  // Mapping State: System Field -> CSV Header
  const [mapping, setMapping] = useState({
      certificateNumber: '',
      recipientName: '',
      recipientEmail: '',
      recipientRole: '',
      eventName: '',
      issueDate: ''
  });

  const fileInputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    setTemplates(storageService.getTemplates());
  }, []);

  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
        const reader = new FileReader();
        reader.onload = (event) => {
            const text = event.target?.result as string;
            const lines = text.split('\n').filter(l => l.trim().length > 0);
            
            if (lines.length < 2) {
                alert("File CSV kosong atau format salah.");
                return;
            }

            // Parse Headers
            const headers = lines[0].split(',').map(h => h.trim().replace(/"/g, ''));
            setCsvHeaders(headers);

            // Parse Data
            const rows: CsvRow[] = [];
            for(let i = 1; i < lines.length; i++) {
                const values = lines[i].split(',').map(v => v.trim().replace(/"/g, ''));
                if (values.length === headers.length) {
                    const row: CsvRow = {};
                    headers.forEach((h, index) => {
                        row[h] = values[index];
                    });
                    rows.push(row);
                }
            }
            
            setCsvData(rows);
            setStep(2);
            
            // Auto-guess mapping
            const newMapping = { ...mapping };
            headers.forEach(h => {
                const lower = h.toLowerCase();
                if (lower.includes('nomor') || lower.includes('number') || lower.includes('no')) newMapping.certificateNumber = h;
                else if (lower.includes('nama') || lower.includes('name')) newMapping.recipientName = h;
                else if (lower.includes('email') || lower.includes('surel') || lower.includes('mail')) newMapping.recipientEmail = h;
                else if (lower.includes('peran') || lower.includes('role') || lower.includes('status')) newMapping.recipientRole = h;
                else if (lower.includes('acara') || lower.includes('event') || lower.includes('kegiatan')) newMapping.eventName = h;
                else if (lower.includes('tanggal') || lower.includes('date')) newMapping.issueDate = h;
            });
            setMapping(newMapping);
        };
        reader.readAsText(file);
    }
  };

  const handleImport = () => {
      if (!selectedTemplateId) {
          alert("Harap pilih template visual untuk data ini.");
          return;
      }
      
      const importedCerts: CertificateData[] = csvData.map(row => {
          return {
              id: uuidv4(), // Generate new system ID
              templateId: selectedTemplateId,
              certificateNumber: row[mapping.certificateNumber] || `MIG-${uuidv4().substring(0,8)}`,
              recipientName: row[mapping.recipientName] || 'Unknown',
              recipientEmail: row[mapping.recipientEmail] || '',
              recipientRole: row[mapping.recipientRole] || 'Peserta',
              eventName: row[mapping.eventName] || 'Kegiatan Lama',
              issueDate: row[mapping.issueDate] || new Date().toISOString().split('T')[0],
              language: 'ID',
              customText: 'Arsip Sertifikat Lama',
              status: 'published'
          };
      });

      storageService.bulkSaveCertificates(importedCerts);
      setStep(3);
  };

  return (
    <div className="p-8 max-w-4xl mx-auto">
      <div className="flex items-center space-x-3 mb-8">
        <div className="p-3 bg-amber-100 rounded-lg">
            <Database className="w-8 h-8 text-amber-600" />
        </div>
        <div>
            <h1 className="text-3xl font-bold text-slate-800">Migrasi Data Lama</h1>
            <p className="text-slate-500">Import database sertifikat dari sistem terdahulu via CSV.</p>
        </div>
      </div>

      {/* Progress Stepper */}
      <div className="flex items-center mb-8">
          <div className={`w-8 h-8 rounded-full flex items-center justify-center font-bold ${step >= 1 ? 'bg-blue-600 text-white' : 'bg-slate-200 text-slate-500'}`}>1</div>
          <div className={`h-1 w-20 ${step >= 2 ? 'bg-blue-600' : 'bg-slate-200'}`}></div>
          <div className={`w-8 h-8 rounded-full flex items-center justify-center font-bold ${step >= 2 ? 'bg-blue-600 text-white' : 'bg-slate-200 text-slate-500'}`}>2</div>
          <div className={`h-1 w-20 ${step >= 3 ? 'bg-blue-600' : 'bg-slate-200'}`}></div>
          <div className={`w-8 h-8 rounded-full flex items-center justify-center font-bold ${step >= 3 ? 'bg-blue-600 text-white' : 'bg-slate-200 text-slate-500'}`}>3</div>
      </div>

      {step === 1 && (
          <div className="bg-white p-10 rounded-xl shadow-sm border-2 border-dashed border-slate-300 flex flex-col items-center justify-center text-center">
              <FileSpreadsheet className="w-16 h-16 text-slate-300 mb-4" />
              <h3 className="text-lg font-bold text-slate-700 mb-2">Upload File CSV</h3>
              <p className="text-slate-500 max-w-md mb-6">
                  Pastikan file Anda berformat .csv. Baris pertama harus berisi header (judul kolom).
              </p>
              <input 
                  type="file" 
                  accept=".csv"
                  ref={fileInputRef}
                  onChange={handleFileUpload}
                  className="hidden"
              />
              <button 
                  onClick={() => fileInputRef.current?.click()}
                  className="px-6 py-3 bg-blue-600 text-white rounded-lg font-bold hover:bg-blue-700 shadow-lg shadow-blue-200 flex items-center"
              >
                  <UploadCloud className="w-5 h-5 mr-2" />
                  Pilih File CSV
              </button>
          </div>
      )}

      {step === 2 && (
          <div className="bg-white p-6 rounded-xl shadow-sm border border-slate-200">
              <h3 className="text-lg font-bold text-slate-900 mb-4">Mapping Data & Konfigurasi</h3>
              
              <div className="bg-blue-50 p-4 rounded-lg flex items-start space-x-3 mb-6">
                  <AlertTriangle className="w-5 h-5 text-blue-600 mt-0.5" />
                  <div className="text-sm text-blue-800">
                      Silakan pasangkan kolom dari file CSV Anda (kiri) ke kolom sistem baru (kanan).
                  </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                  <div className="space-y-4">
                      <h4 className="font-bold text-slate-700 border-b pb-2">1. Petakan Kolom CSV</h4>
                      
                      {[
                          { key: 'certificateNumber', label: 'Nomor Sertifikat' },
                          { key: 'recipientName', label: 'Nama Penerima' },
                          { key: 'recipientEmail', label: 'Email Penerima' },
                          { key: 'recipientRole', label: 'Peran / Role' },
                          { key: 'eventName', label: 'Nama Kegiatan' },
                          { key: 'issueDate', label: 'Tanggal Terbit' },
                      ].map((field) => (
                          <div key={field.key}>
                              <label className="block text-xs font-semibold text-slate-500 mb-1">{field.label} (Sistem)</label>
                              <div className="flex items-center space-x-2">
                                  <ArrowRight className="w-4 h-4 text-slate-400" />
                                  <select 
                                      value={(mapping as any)[field.key]}
                                      onChange={(e) => setMapping({...mapping, [field.key]: e.target.value})}
                                      className="flex-1 p-2 border border-slate-300 rounded-md text-sm"
                                  >
                                      <option value="">-- Abaikan / Kosong --</option>
                                      {csvHeaders.map(h => (
                                          <option key={h} value={h}>{h}</option>
                                      ))}
                                  </select>
                              </div>
                          </div>
                      ))}
                  </div>

                  <div className="space-y-4">
                      <h4 className="font-bold text-slate-700 border-b pb-2">2. Pilih Template Visual</h4>
                      <p className="text-xs text-slate-500">
                          Data lama memerlukan template agar bisa ditampilkan saat diverifikasi.
                      </p>
                      
                      <div>
                          <label className="block text-sm font-medium text-slate-700 mb-2">Gunakan Template</label>
                          <select 
                              value={selectedTemplateId} 
                              onChange={(e) => setSelectedTemplateId(e.target.value)}
                              className="w-full p-2 border border-slate-300 rounded-md focus:ring-2 focus:ring-blue-500"
                          >
                              <option value="">-- Pilih Template --</option>
                              {templates.map(t => (
                                  <option key={t.id} value={t.id}>{t.name}</option>
                              ))}
                          </select>
                          {templates.length === 0 && (
                            <p className="text-xs text-red-500 mt-1">Buat template dulu di menu Template.</p>
                          )}
                      </div>
                      
                      <div className="bg-slate-100 p-4 rounded text-sm text-slate-600">
                          <strong>Ringkasan:</strong><br/>
                          Jumlah Data: {csvData.length} baris<br/>
                          Status: Siap Import
                      </div>

                      <button 
                        onClick={handleImport}
                        disabled={!selectedTemplateId}
                        className="w-full py-3 bg-green-600 text-white font-bold rounded-lg hover:bg-green-700 disabled:bg-slate-300 shadow-lg shadow-green-200 mt-4 flex justify-center items-center"
                      >
                          <Save className="w-5 h-5 mr-2" />
                          Proses Import Data
                      </button>
                  </div>
              </div>
          </div>
      )}

      {step === 3 && (
          <div className="text-center py-20 bg-white rounded-xl shadow-sm border border-slate-200">
              <div className="w-20 h-20 bg-green-100 text-green-600 rounded-full flex items-center justify-center mx-auto mb-6">
                  <CheckCircle className="w-10 h-10" />
              </div>
              <h2 className="text-2xl font-bold text-slate-900 mb-2">Import Berhasil!</h2>
              <p className="text-slate-600 mb-8">
                  {csvData.length} data sertifikat lama berhasil ditambahkan ke database sistem baru.
              </p>
              <div className="flex justify-center space-x-4">
                  <button 
                    onClick={() => navigate('/admin/certificates')}
                    className="px-6 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 font-medium"
                  >
                      Lihat Data Sertifikat
                  </button>
                  <button 
                    onClick={() => {
                        setStep(1);
                        setCsvData([]);
                        setCsvHeaders([]);
                    }}
                    className="px-6 py-2 border border-slate-300 text-slate-700 rounded-lg hover:bg-slate-50 font-medium"
                  >
                      Import Lagi
                  </button>
              </div>
          </div>
      )}
    </div>
  );
};

export default LegacyImport;