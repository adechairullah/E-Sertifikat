import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { CertificateTemplate } from '../types';
import * as storageService from '../services/storageService';
import { Plus, Edit, Trash2, FileText, Calendar } from 'lucide-react';

const TemplateList: React.FC = () => {
  const navigate = useNavigate();
  const [templates, setTemplates] = useState<CertificateTemplate[]>([]);

  useEffect(() => {
    refreshTemplates();
  }, []);

  const refreshTemplates = () => {
    setTemplates(storageService.getTemplates());
  };

  const handleDelete = (id: string) => {
    if (window.confirm("Apakah Anda yakin ingin menghapus template ini?")) {
      storageService.deleteTemplate(id);
      refreshTemplates();
    }
  };

  return (
    <div className="p-8 max-w-6xl mx-auto">
      <div className="flex justify-between items-center mb-8">
        <div>
          <h1 className="text-3xl font-bold text-slate-900">Template Sertifikat</h1>
          <p className="text-slate-500">Kelola desain dan tata letak sertifikat Anda.</p>
        </div>
        <button 
          onClick={() => navigate('/admin/templates/new')} 
          className="flex items-center px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors shadow-sm font-medium"
        >
          <Plus className="w-5 h-5 mr-2" />
          Buat Template Baru
        </button>
      </div>

      {templates.length === 0 ? (
        <div className="text-center py-20 bg-white rounded-xl border border-dashed border-slate-300">
          <FileText className="w-16 h-16 text-slate-300 mx-auto mb-4" />
          <h3 className="text-lg font-medium text-slate-900">Belum ada template</h3>
          <p className="text-slate-500 mb-6">Mulai dengan membuat desain sertifikat pertama Anda.</p>
          <button 
            onClick={() => navigate('/admin/templates/new')} 
            className="text-blue-600 hover:text-blue-800 font-medium"
          >
            Buat Template &rarr;
          </button>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {templates.map((template) => (
            <div key={template.id} className="bg-white rounded-xl shadow-sm border border-slate-200 overflow-hidden hover:shadow-md transition-shadow flex flex-col">
              <div className="h-40 bg-slate-100 relative overflow-hidden group">
                 {/* Preview Background */}
                 <img 
                    src={template.backgroundImage} 
                    alt={template.name}
                    className="w-full h-full object-cover opacity-90 group-hover:scale-105 transition-transform duration-500"
                 />
                 <div className="absolute inset-0 bg-black/50 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center space-x-3">
                    <button 
                        onClick={() => navigate(`/admin/templates/edit/${template.id}`)}
                        className="p-2 bg-white rounded-full text-slate-900 hover:text-blue-600"
                    >
                        <Edit className="w-5 h-5" />
                    </button>
                 </div>
              </div>
              <div className="p-5 flex-1 flex flex-col">
                <div className="flex justify-between items-start mb-2">
                    <h3 className="font-bold text-lg text-slate-900 truncate pr-2">{template.name}</h3>
                </div>
                <div className="text-sm text-slate-500 mb-4 flex-1">
                    <div className="flex items-center mb-1">
                        <Calendar className="w-3 h-3 mr-1.5" />
                        Dibuat: {new Date(template.createdAt).toLocaleDateString('id-ID')}
                    </div>
                    <div className="flex items-center">
                        <FileText className="w-3 h-3 mr-1.5" />
                        Elemen: {template.fields.length}
                    </div>
                </div>
                <div className="flex justify-between items-center pt-4 border-t border-slate-100">
                    <span className="text-xs text-slate-400 font-mono">{template.width}x{template.height}px</span>
                    <button 
                        onClick={() => handleDelete(template.id)}
                        className="text-red-500 hover:text-red-700 text-sm font-medium flex items-center"
                    >
                        <Trash2 className="w-4 h-4 mr-1" /> Hapus
                    </button>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
};

export default TemplateList;