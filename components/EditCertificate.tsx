import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { CertificateData, CertificateTemplate } from '../types';
import * as storageService from '../services/storageService';
import { Save, ArrowLeft, AlertCircle, FileText } from 'lucide-react';

const EditCertificate: React.FC = () => {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  
  const [certData, setCertData] = useState<CertificateData | null>(null);
  const [templates, setTemplates] = useState<CertificateTemplate[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (id) {
        const data = storageService.getCertificateById(id);
        const templateList = storageService.getTemplates();
        setTemplates(templateList);
        
        if (data) {
            setCertData(data);
        } else {
            alert("Data sertifikat tidak ditemukan");
            navigate('/admin/certificates');
        }
        setLoading(false);
    }
  }, [id, navigate]);

  const handleSave = () => {
    if (certData) {
        storageService.updateCertificate(certData);
        alert("Perubahan berhasil disimpan.");
        navigate('/admin/certificates');
    }
  };

  const handleChange = (field: keyof CertificateData, value: string) => {
    if (certData) {
        setCertData({ ...certData, [field]: value });
    }
  };

  if (loading) return <div className="p-8">Loading...</div>;
  if (!certData) return null;

  return (
    <div className="p-8 max-w-4xl mx-auto">
       <button 
         onClick={() => navigate('/admin/certificates')}
         className="flex items-center text-slate-500 hover:text-slate-800 mb-6"
       >
         <ArrowLeft className="w-4 h-4 mr-2" /> Kembali ke Daftar
       </button>

       <div className="flex items-center space-x-3 mb-6">
         <div className="p-3 bg-amber-100 rounded-lg">
            <FileText className="w-6 h-6 text-amber-600" />
         </div>
         <div>
             <h1 className="text-2xl font-bold text-slate-900">Edit Data Sertifikat</h1>
             <p className="text-slate-500">Nomor: {certData.certificateNumber}</p>
         </div>
       </div>

       <div className="bg-white rounded-xl shadow-sm border border-slate-200 p-8 space-y-6">
          <div className="bg-blue-50 p-4 rounded-lg flex items-start space-x-3 mb-6">
             <AlertCircle className="w-5 h-5 text-blue-600 mt-0.5" />
             <div className="text-sm text-blue-800">
                <strong>Catatan:</strong> Mengubah data di sini akan langsung memperbarui tampilan sertifikat saat diverifikasi oleh publik. Pastikan ejaan nama dan gelar sudah benar.
             </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div>
                  <label className="block text-sm font-medium text-slate-700 mb-1">Nama Penerima</label>
                  <input 
                    type="text" 
                    value={certData.recipientName}
                    onChange={(e) => handleChange('recipientName', e.target.value)}
                    className="w-full p-2 border border-slate-300 rounded-md focus:ring-2 focus:ring-blue-500"
                  />
              </div>

              <div>
                  <label className="block text-sm font-medium text-slate-700 mb-1">Email Penerima</label>
                  <input 
                    type="email" 
                    value={certData.recipientEmail || ''}
                    onChange={(e) => handleChange('recipientEmail', e.target.value)}
                    className="w-full p-2 border border-slate-300 rounded-md focus:ring-2 focus:ring-blue-500"
                    placeholder="contoh@email.com"
                  />
              </div>

              <div>
                  <label className="block text-sm font-medium text-slate-700 mb-1">Peran / Role</label>
                  <input 
                    type="text" 
                    value={certData.recipientRole || ''}
                    onChange={(e) => handleChange('recipientRole', e.target.value)}
                    className="w-full p-2 border border-slate-300 rounded-md focus:ring-2 focus:ring-blue-500"
                  />
              </div>

              <div>
                  <label className="block text-sm font-medium text-slate-700 mb-1">Nama Kegiatan</label>
                  <input 
                    type="text" 
                    value={certData.eventName}
                    onChange={(e) => handleChange('eventName', e.target.value)}
                    className="w-full p-2 border border-slate-300 rounded-md focus:ring-2 focus:ring-blue-500"
                  />
              </div>

              <div>
                  <label className="block text-sm font-medium text-slate-700 mb-1">Tanggal Terbit</label>
                  <input 
                    type="date" 
                    value={certData.issueDate}
                    onChange={(e) => handleChange('issueDate', e.target.value)}
                    className="w-full p-2 border border-slate-300 rounded-md focus:ring-2 focus:ring-blue-500"
                  />
              </div>
              
               <div>
                  <label className="block text-sm font-medium text-slate-700 mb-1">Template Desain</label>
                  <select
                    value={certData.templateId}
                    onChange={(e) => handleChange('templateId', e.target.value)}
                    className="w-full p-2 border border-slate-300 rounded-md"
                  >
                      {templates.map(t => (
                          <option key={t.id} value={t.id}>{t.name}</option>
                      ))}
                  </select>
              </div>

              <div>
                  <label className="block text-sm font-medium text-slate-700 mb-1">Bahasa</label>
                  <select
                    value={certData.language}
                    onChange={(e) => handleChange('language', e.target.value)}
                    className="w-full p-2 border border-slate-300 rounded-md"
                  >
                      <option value="ID">Bahasa Indonesia</option>
                      <option value="EN">English</option>
                  </select>
              </div>

              <div className="md:col-span-2">
                   <label className="block text-sm font-medium text-slate-700 mb-1">Custom Text / Apresiasi</label>
                   <textarea 
                     value={certData.customText || ''}
                     onChange={(e) => handleChange('customText', e.target.value)}
                     className="w-full p-2 border border-slate-300 rounded-md focus:ring-2 focus:ring-blue-500 h-24"
                   />
              </div>
          </div>

          <div className="pt-6 border-t border-slate-100 flex justify-end space-x-4">
              <button 
                onClick={() => navigate('/admin/certificates')}
                className="px-4 py-2 text-slate-600 bg-white border border-slate-300 rounded-lg hover:bg-slate-50 font-medium"
              >
                  Batal
              </button>
              <button 
                onClick={handleSave}
                className="px-6 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 font-bold flex items-center shadow-lg shadow-blue-200"
              >
                  <Save className="w-4 h-4 mr-2" />
                  Simpan Perubahan
              </button>
          </div>
       </div>
    </div>
  );
};

export default EditCertificate;