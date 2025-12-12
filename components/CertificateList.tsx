import React, { useState, useEffect } from 'react';
import { CertificateData } from '../types';
import * as storageService from '../services/storageService';
import { Search, Filter, Eye, Trash2, FileBadge, Edit } from 'lucide-react';
import { useNavigate } from 'react-router-dom';

const CertificateList: React.FC = () => {
  const navigate = useNavigate();
  const [certificates, setCertificates] = useState<CertificateData[]>([]);
  const [filteredCerts, setFilteredCerts] = useState<CertificateData[]>([]);
  
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedEvent, setSelectedEvent] = useState<string>('All');
  const [events, setEvents] = useState<string[]>([]);

  useEffect(() => {
    loadData();
  }, []);

  const loadData = () => {
    const data = storageService.getCertificates();
    const sorted = [...data].reverse();
    setCertificates(sorted);
    
    const uniqueEvents = Array.from(new Set(sorted.map(c => c.eventName))).filter(Boolean);
    setEvents(uniqueEvents);
  };

  useEffect(() => {
    let result = certificates;

    if (selectedEvent !== 'All') {
      result = result.filter(c => c.eventName === selectedEvent);
    }

    if (searchTerm) {
      const lower = searchTerm.toLowerCase();
      result = result.filter(c => 
        c.recipientName.toLowerCase().includes(lower) || 
        c.certificateNumber.toLowerCase().includes(lower)
      );
    }

    setFilteredCerts(result);
  }, [certificates, selectedEvent, searchTerm]);

  const handleDelete = (id: string) => {
    if (window.confirm("Yakin ingin menghapus sertifikat ini? Data tidak bisa dikembalikan.")) {
      storageService.deleteCertificate(id);
      loadData();
    }
  };

  return (
    <div className="p-8 max-w-6xl mx-auto">
      <div className="flex justify-between items-center mb-8">
        <div>
          <h1 className="text-3xl font-bold text-slate-900">Data Sertifikat</h1>
          <p className="text-slate-500">Lihat dan kelola semua sertifikat yang telah diterbitkan.</p>
        </div>
        <button 
            onClick={() => navigate('/admin/issue')}
            className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 shadow-sm font-medium transition-colors"
        >
            + Terbitkan Baru
        </button>
      </div>

      <div className="bg-white p-4 rounded-xl shadow-sm border border-slate-200 mb-6 flex flex-col md:flex-row gap-4 justify-between items-center">
        <div className="relative w-full md:w-96">
            <Search className="absolute left-3 top-2.5 text-slate-400 w-5 h-5" />
            <input 
                type="text" 
                placeholder="Cari nama penerima atau no. sertifikat..." 
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="w-full pl-10 pr-4 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:outline-none"
            />
        </div>
        
        <div className="flex items-center space-x-2 w-full md:w-auto">
            <Filter className="text-slate-400 w-5 h-5" />
            <select 
                value={selectedEvent}
                onChange={(e) => setSelectedEvent(e.target.value)}
                className="p-2 border border-slate-300 rounded-lg text-slate-700 focus:ring-blue-500 focus:border-blue-500"
            >
                <option value="All">Semua Kegiatan</option>
                {events.map((evt, idx) => (
                    <option key={idx} value={evt}>{evt}</option>
                ))}
            </select>
        </div>
      </div>

      <div className="bg-white rounded-xl shadow-sm border border-slate-200 overflow-hidden">
        {filteredCerts.length === 0 ? (
            <div className="text-center py-16">
                <FileBadge className="w-12 h-12 text-slate-300 mx-auto mb-3" />
                <p className="text-slate-500">Tidak ada data sertifikat yang cocok.</p>
            </div>
        ) : (
            <div className="overflow-x-auto">
                <table className="w-full text-left border-collapse">
                    <thead>
                        <tr className="bg-slate-50 border-b border-slate-200 text-xs uppercase tracking-wider text-slate-500 font-semibold">
                            <th className="px-6 py-4">No. Sertifikat</th>
                            <th className="px-6 py-4">Penerima</th>
                            <th className="px-6 py-4">Kontak (Email)</th>
                            <th className="px-6 py-4">Kegiatan</th>
                            <th className="px-6 py-4 text-right">Aksi</th>
                        </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-100">
                        {filteredCerts.map((cert) => (
                            <tr key={cert.id} className="hover:bg-slate-50 transition-colors">
                                <td className="px-6 py-4 font-mono text-sm text-slate-600">{cert.certificateNumber}</td>
                                <td className="px-6 py-4">
                                    <div className="font-bold text-slate-900">{cert.recipientName}</div>
                                    <div className="text-xs text-slate-500">{cert.recipientRole}</div>
                                </td>
                                <td className="px-6 py-4 text-sm text-slate-700">
                                    {cert.recipientEmail ? (
                                        <div className="flex items-center space-x-2">
                                            <span className="truncate max-w-[150px]">{cert.recipientEmail}</span>
                                        </div>
                                    ) : (
                                        <span className="text-slate-400 italic">No Email</span>
                                    )}
                                </td>
                                <td className="px-6 py-4 text-sm text-slate-700 max-w-xs truncate">{cert.eventName}</td>
                                <td className="px-6 py-4 text-right">
                                    <div className="flex justify-end space-x-2">
                                        <button 
                                            onClick={() => navigate(`/verify/${encodeURIComponent(cert.certificateNumber)}`)}
                                            className="p-2 text-blue-600 hover:bg-blue-50 rounded-full inline-block"
                                            title="Lihat / Verifikasi"
                                        >
                                            <Eye className="w-4 h-4" />
                                        </button>
                                        <button 
                                            onClick={() => navigate(`/admin/certificates/edit/${cert.id}`)}
                                            className="p-2 text-amber-500 hover:bg-amber-50 rounded-full inline-block"
                                            title="Edit Data"
                                        >
                                            <Edit className="w-4 h-4" />
                                        </button>
                                        <button 
                                            onClick={() => handleDelete(cert.id)}
                                            className="p-2 text-red-500 hover:bg-red-50 rounded-full"
                                            title="Hapus"
                                        >
                                            <Trash2 className="w-4 h-4" />
                                        </button>
                                    </div>
                                </td>
                            </tr>
                        ))}
                    </tbody>
                </table>
            </div>
        )}
      </div>
      <div className="mt-4 text-xs text-slate-400 text-right">
        Menampilkan {filteredCerts.length} data
      </div>
    </div>
  );
};

export default CertificateList;