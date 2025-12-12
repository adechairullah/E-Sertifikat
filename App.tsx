import React, { useState, useEffect } from 'react';
import { MemoryRouter, Routes, Route, useLocation, useNavigate } from 'react-router-dom';
import TemplateList from './components/TemplateList';
import TemplateEditor from './components/TemplateEditor';
import ImportCertificate from './components/ImportCertificate';
import CertificateList from './components/CertificateList';
import EditCertificate from './components/EditCertificate';
import PublicVerification from './components/PublicVerification';
import AdminSettings from './components/AdminSettings';
import EventLetterGenerator from './components/EventLetterGenerator';
import LegacyImport from './components/LegacyImport';
import { ShieldCheck, LayoutTemplate, Users, LogOut, Settings, FileBadge, BarChart3, Home, FileText, Database } from 'lucide-react';
import * as storageService from './services/storageService';

const AdminLayout: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const location = useLocation();
  const navigate = useNavigate();
  
  const menuItems = [
      { path: '/admin', label: 'Dashboard', icon: Home, exact: true },
      { path: '/admin/templates', label: 'Template Sertifikat', icon: LayoutTemplate },
      { path: '/admin/issue', label: 'Terbitkan Baru', icon: Users },
      { path: '/admin/certificates', label: 'Data Sertifikat', icon: FileBadge },
      { path: '/admin/letter-generator', label: 'Laporan Distribusi', icon: FileText },
      { path: '/admin/legacy-import', label: 'Migrasi Data', icon: Database },
      { path: '/admin/settings', label: 'Konfigurasi', icon: Settings },
  ];

  return (
    <div className="flex h-screen bg-slate-50 font-sans">
        <aside className="w-64 bg-slate-900 text-slate-300 flex flex-col shadow-2xl z-20">
            <div className="p-6 flex items-center space-x-3 text-white border-b border-slate-800">
                <ShieldCheck className="w-8 h-8 text-blue-500" />
                <div>
                    <span className="text-lg font-bold tracking-tight block leading-none">Admin Panel</span>
                    <span className="text-xs text-slate-500 font-medium">Politeknik ATI Padang</span>
                </div>
            </div>
            
            <nav className="flex-1 px-3 space-y-1 mt-6">
                {menuItems.map(item => {
                    const Icon = item.icon;
                    // Strict check for dashboard, prefix check for others
                    const isActive = item.exact 
                        ? location.pathname === item.path 
                        : location.pathname.startsWith(item.path) && location.pathname !== '/admin';
                        
                    return (
                        <button 
                            key={item.path} 
                            onClick={() => navigate(item.path)}
                            className={`w-full flex items-center px-4 py-3 rounded-lg transition-all duration-200 group text-left ${isActive ? 'bg-blue-600 text-white shadow-lg shadow-blue-900/50 translate-x-1' : 'hover:bg-slate-800 hover:text-white'}`}
                        >
                            <Icon className={`w-5 h-5 mr-3 ${isActive ? 'text-white' : 'text-slate-400 group-hover:text-white'}`} />
                            <span className="font-medium text-sm">{item.label}</span>
                        </button>
                    );
                })}
            </nav>

            <div className="p-4 border-t border-slate-800">
                <button 
                    onClick={() => navigate('/')} 
                    className="w-full flex items-center px-4 py-3 text-slate-400 hover:text-white transition-colors text-sm rounded-lg hover:bg-slate-800 text-left"
                >
                    <LogOut className="w-5 h-5 mr-3" />
                    Keluar / Halaman Publik
                </button>
            </div>
        </aside>
        <main className="flex-1 overflow-auto bg-slate-50 relative">
            {children}
        </main>
    </div>
  );
};

const Dashboard: React.FC = () => {
    const navigate = useNavigate();
    const templates = storageService.getTemplates();
    const certificates = storageService.getCertificates();
    
    // Stats Logic
    const statsByEvent = certificates.reduce((acc, curr) => {
        acc[curr.eventName] = (acc[curr.eventName] || 0) + 1;
        return acc;
    }, {} as Record<string, number>);

    const maxCount = Math.max(...Object.values(statsByEvent), 1);

    return (
        <div className="p-10 max-w-7xl mx-auto">
            <header className="mb-10">
                <h1 className="text-3xl font-bold text-slate-900 mb-2">Selamat Datang, Admin</h1>
                <p className="text-slate-500">Ringkasan aktivitas penerbitan sertifikat Politeknik ATI Padang.</p>
            </header>

            {/* Quick Stats Cards */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-10">
                <div className="bg-white p-6 rounded-xl shadow-sm border border-slate-200 flex flex-col justify-between h-40 relative overflow-hidden group">
                    <div className="absolute right-0 top-0 w-32 h-32 bg-blue-50 rounded-full -mr-10 -mt-10 transition-transform group-hover:scale-110"></div>
                    <div>
                        <h3 className="text-sm font-bold text-slate-500 uppercase tracking-wider mb-1">Total Template</h3>
                        <p className="text-4xl font-extrabold text-slate-800">{templates.length}</p>
                    </div>
                    <button 
                        onClick={() => navigate('/admin/templates')} 
                        className="text-sm font-bold text-blue-600 hover:text-blue-800 flex items-center z-10 w-fit"
                    >
                        Kelola Desain <LayoutTemplate className="w-4 h-4 ml-1" />
                    </button>
                </div>

                <div className="bg-white p-6 rounded-xl shadow-sm border border-slate-200 flex flex-col justify-between h-40 relative overflow-hidden group">
                     <div className="absolute right-0 top-0 w-32 h-32 bg-emerald-50 rounded-full -mr-10 -mt-10 transition-transform group-hover:scale-110"></div>
                    <div>
                        <h3 className="text-sm font-bold text-slate-500 uppercase tracking-wider mb-1">Sertifikat Terbit</h3>
                        <p className="text-4xl font-extrabold text-slate-800">{certificates.length}</p>
                    </div>
                    <button 
                        onClick={() => navigate('/admin/certificates')} 
                        className="text-sm font-bold text-emerald-600 hover:text-emerald-800 flex items-center z-10 w-fit"
                    >
                        Lihat Data <FileBadge className="w-4 h-4 ml-1" />
                    </button>
                </div>

                <div className="bg-gradient-to-br from-blue-600 to-indigo-700 p-6 rounded-xl shadow-lg text-white flex flex-col justify-between h-40 relative overflow-hidden">
                    <div className="absolute right-0 bottom-0 w-40 h-40 bg-white/10 rounded-full -mr-10 -mb-10"></div>
                    <div>
                        <h3 className="text-sm font-bold text-blue-100 uppercase tracking-wider mb-1">Aksi Cepat</h3>
                        <p className="text-xl font-bold">Terbitkan Sertifikat Baru</p>
                    </div>
                    <button 
                        onClick={() => navigate('/admin/issue')} 
                        className="px-4 py-2 bg-white/20 hover:bg-white/30 backdrop-blur-sm rounded-lg text-sm font-bold w-fit transition-colors flex items-center"
                    >
                        Mulai Proses <Users className="w-4 h-4 ml-2" />
                    </button>
                </div>
            </div>

            {/* Event Statistics Chart */}
            <div className="bg-white p-8 rounded-xl shadow-sm border border-slate-200">
                <div className="flex items-center justify-between mb-6">
                    <h2 className="text-lg font-bold text-slate-900 flex items-center">
                        <BarChart3 className="w-5 h-5 mr-2 text-slate-400" />
                        Statistik Per Kegiatan
                    </h2>
                </div>
                
                {Object.keys(statsByEvent).length === 0 ? (
                    <div className="text-center py-10 text-slate-400 bg-slate-50 rounded-lg border border-dashed border-slate-200">
                        Belum ada data kegiatan.
                    </div>
                ) : (
                    <div className="space-y-4">
                        {Object.entries(statsByEvent).map(([event, count], idx) => {
                            const percentage = (count / maxCount) * 100;
                            return (
                                <div key={idx} className="group">
                                    <div className="flex justify-between text-sm mb-1">
                                        <span className="font-medium text-slate-700">{event}</span>
                                        <span className="font-mono text-slate-500">{count} Sertifikat</span>
                                    </div>
                                    <div className="w-full bg-slate-100 rounded-full h-3 overflow-hidden">
                                        <div 
                                            className="bg-blue-600 h-3 rounded-full transition-all duration-1000 ease-out group-hover:bg-blue-500" 
                                            style={{ width: `${percentage}%` }}
                                        ></div>
                                    </div>
                                </div>
                            )
                        })}
                    </div>
                )}
            </div>
        </div>
    )
}

const App: React.FC = () => {
  // Parse initial hash to support deep linking in MemoryRouter
  const getInitialRoute = () => {
    try {
        const hash = window.location.hash;
        if (hash && hash.length > 1) {
            return hash.substring(1); // Remove '#'
        }
    } catch (e) {
        console.error("Failed to parse initial hash", e);
    }
    return '/';
  };

  return (
    <MemoryRouter initialEntries={[getInitialRoute()]}>
      <Routes>
        {/* Public Routes */}
        <Route path="/" element={<PublicVerification />} />
        <Route path="/verify/:id" element={<PublicVerification />} />

        {/* Admin Routes */}
        <Route path="/admin" element={<AdminLayout><Dashboard /></AdminLayout>} />
        
        {/* Templates: List, Create, Edit */}
        <Route path="/admin/templates" element={
            <AdminLayout>
                <TemplateList />
            </AdminLayout>
        } />
        <Route path="/admin/templates/new" element={
            <AdminLayout>
                <div className="h-full">
                    <TemplateEditor />
                </div>
            </AdminLayout>
        } />
        <Route path="/admin/templates/edit/:templateId" element={
            <AdminLayout>
                <div className="h-full">
                    <TemplateEditor />
                </div>
            </AdminLayout>
        } />
        
        <Route path="/admin/issue" element={
            <AdminLayout>
                 <div className="p-8">
                    <ImportCertificate />
                 </div>
            </AdminLayout>
        } />

        <Route path="/admin/certificates" element={
            <AdminLayout>
                 <CertificateList />
            </AdminLayout>
        } />

        <Route path="/admin/certificates/edit/:id" element={
            <AdminLayout>
                 <EditCertificate />
            </AdminLayout>
        } />
        
        <Route path="/admin/letter-generator" element={
            <AdminLayout>
                 <EventLetterGenerator />
            </AdminLayout>
        } />

        <Route path="/admin/legacy-import" element={
            <AdminLayout>
                 <LegacyImport />
            </AdminLayout>
        } />

        <Route path="/admin/settings" element={
            <AdminLayout>
                 <AdminSettings />
            </AdminLayout>
        } />
      </Routes>
    </MemoryRouter>
  );
};

export default App;