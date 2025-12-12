import React, { useState, useEffect } from 'react';
import { Save, RefreshCw, Trash2, Shield, Settings, CheckCircle } from 'lucide-react';
import * as storageService from '../services/storageService';
import { SystemConfig } from '../types';

const AdminSettings: React.FC = () => {
  const [config, setConfig] = useState<SystemConfig>({
    organizationName: '',
    defaultLanguage: 'ID',
    prefixParticipant: '',
    prefixSpeaker: '',
    prefixInstructor: '',
    emailJsServiceId: '',
    emailJsTemplateId: '',
    emailJsPublicKey: ''
  });
  const [saved, setSaved] = useState(false);

  useEffect(() => {
    const current = storageService.getSystemConfig();
    setConfig(current);
  }, []);

  const handleSave = () => {
    storageService.saveSystemConfig(config);
    setSaved(true);
    setTimeout(() => setSaved(false), 3000);
  };

  const handleClearDatabase = () => {
      if (window.confirm("APAKAH ANDA YAKIN? Ini akan menghapus SEMUA template dan sertifikat secara permanen.")) {
          storageService.clearAllData();
          alert("Database berhasil direset. Silakan refresh halaman secara manual untuk melihat perubahan.");
      }
  };

  return (
    <div className="max-w-4xl mx-auto p-8 relative">
      {saved && (
        <div className="fixed top-4 right-4 bg-green-100 border border-green-200 text-green-800 px-4 py-3 rounded-lg shadow-lg flex items-center animate-fade-in z-50">
            <CheckCircle className="w-5 h-5 mr-2 text-green-600" />
            Konfigurasi berhasil disimpan.
        </div>
      )}

      <div className="flex items-center space-x-3 mb-8">
        <div className="p-3 bg-slate-900 rounded-lg">
            <Settings className="w-8 h-8 text-blue-400" />
        </div>
        <div>
            <h1 className="text-3xl font-bold text-slate-800">Konfigurasi Sistem</h1>
            <p className="text-slate-500">Pengaturan backend untuk nilai default dan integrasi sistem.</p>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-8 mb-8">
        {/* General Settings */}
        <div className="bg-white p-6 rounded-xl shadow-sm border border-slate-200">
          <h2 className="text-lg font-bold text-slate-900 mb-4 flex items-center">
             <Shield className="w-5 h-5 mr-2 text-blue-600" />
             Pengaturan Umum
          </h2>
          
          <div className="space-y-4">
            <div>
                <label className="block text-sm font-medium text-slate-700 mb-1">Nama Organisasi</label>
                <input 
                    type="text" 
                    value={config.organizationName}
                    onChange={(e) => setConfig({...config, organizationName: e.target.value})}
                    className="w-full p-2 border border-slate-300 rounded-md focus:ring-2 focus:ring-blue-500"
                    placeholder="e.g. Politeknik ATI Padang"
                />
                <p className="text-xs text-slate-500 mt-1">Ditampilkan di metadata dan judul default.</p>
            </div>

            <div>
                <label className="block text-sm font-medium text-slate-700 mb-1">Bahasa Default</label>
                <select 
                    value={config.defaultLanguage}
                    onChange={(e) => setConfig({...config, defaultLanguage: e.target.value as 'EN'|'ID'})}
                    className="w-full p-2 border border-slate-300 rounded-md"
                >
                    <option value="ID">Bahasa Indonesia</option>
                    <option value="EN">English (US)</option>
                </select>
                <p className="text-xs text-slate-500 mt-1">Bahasa default untuk penerbitan sertifikat baru.</p>
            </div>
          </div>
        </div>

        {/* Numbering Automation */}
        <div className="bg-white p-6 rounded-xl shadow-sm border border-slate-200">
           <h2 className="text-lg font-bold text-slate-900 mb-4 flex items-center">
             <RefreshCw className="w-5 h-5 mr-2 text-green-600" />
             Format Nomor Sertifikat
          </h2>
           <p className="text-xs text-slate-500 mb-4">
                Sistem akan otomatis memilih format berdasarkan peran peserta saat import data. Gunakan <code>{'{YEAR}'}</code> untuk tahun.
           </p>

           <div className="space-y-4">
            <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1 uppercase tracking-wider">Untuk Peserta</label>
                <input 
                    type="text" 
                    value={config.prefixParticipant}
                    onChange={(e) => setConfig({...config, prefixParticipant: e.target.value})}
                    className="w-full p-2 border border-slate-300 rounded-md font-mono text-sm"
                    placeholder="SRT-PST/{YEAR}/"
                />
            </div>
            <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1 uppercase tracking-wider">Untuk Narasumber / Pemateri</label>
                <input 
                    type="text" 
                    value={config.prefixSpeaker}
                    onChange={(e) => setConfig({...config, prefixSpeaker: e.target.value})}
                    className="w-full p-2 border border-slate-300 rounded-md font-mono text-sm"
                    placeholder="SRT-NRS/{YEAR}/"
                />
            </div>
            <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1 uppercase tracking-wider">Untuk Instruktur / Panitia</label>
                <input 
                    type="text" 
                    value={config.prefixInstructor}
                    onChange={(e) => setConfig({...config, prefixInstructor: e.target.value})}
                    className="w-full p-2 border border-slate-300 rounded-md font-mono text-sm"
                    placeholder="SRT-INS/{YEAR}/"
                />
            </div>
           </div>
        </div>
      </div>

      <div className="flex justify-between items-center">
          <button 
            onClick={handleClearDatabase}
            className="flex items-center px-4 py-2 text-red-600 hover:bg-red-50 rounded-md transition-colors text-sm font-medium"
          >
              <Trash2 className="w-4 h-4 mr-2" />
              Reset Database
          </button>

          <button 
            onClick={handleSave}
            className={`flex items-center px-6 py-3 text-white rounded-lg font-bold transition-all ${saved ? 'bg-green-600' : 'bg-blue-600 hover:bg-blue-700'}`}
          >
            <Save className="w-5 h-5 mr-2" />
            {saved ? 'Tersimpan!' : 'Simpan Konfigurasi'}
          </button>
      </div>
    </div>
  );
};

export default AdminSettings;