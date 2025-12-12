import React, { useState, useEffect, useRef } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import * as storageService from '../services/storageService';
import { CertificateData, CertificateTemplate } from '../types';
import CertificateRenderer, { CertificateRendererHandle } from './CertificateRenderer';
import { Search, CheckCircle, XCircle, Download, ShieldCheck, ArrowRight, Shield } from 'lucide-react';
import jsPDF from 'jspdf';

const PublicVerification: React.FC = () => {
  const navigate = useNavigate();
  const { id } = useParams<{ id: string }>();
  
  const [inputId, setInputId] = useState('');
  const [result, setResult] = useState<{data: CertificateData, template: CertificateTemplate} | null>(null);
  const [error, setError] = useState('');
  const [lang, setLang] = useState<'EN' | 'ID'>('ID');
  const rendererRef = useRef<CertificateRendererHandle>(null);

  const t = {
      EN: {
          title: "Certificate Verification",
          subtitle: "Verify the authenticity of certificates issued by Politeknik ATI Padang.",
          placeholder: "Enter Certificate Number...",
          verifyBtn: "Check Now",
          download: "Download PDF",
          verifiedTitle: "Authenticity Verified",
          verifiedDesc: "This certificate is valid and officially registered in our system.",
          issuedOn: "Issued Date",
          notFound: "Certificate not found or invalid.",
          missingTemplate: "Certificate data found, but template is missing.",
          verifying: "Verifying...",
          recipient: "Recipient Name",
          event: "Event Context",
          admin: "Admin Login",
          footer: "© 2024 Politeknik ATI Padang. All Rights Reserved."
      },
      ID: {
          title: "Verifikasi E-Sertifikat",
          subtitle: "Cek keaslian sertifikat digital resmi yang diterbitkan oleh Politeknik ATI Padang.",
          placeholder: "Masukkan Nomor Sertifikat...",
          verifyBtn: "Cek Keaslian",
          download: "Unduh Sertifikat (PDF)",
          verifiedTitle: "Terverifikasi Asli",
          verifiedDesc: "Sertifikat ini valid dan terdaftar secara resmi di dalam sistem kami.",
          issuedOn: "Tanggal Terbit",
          notFound: "Nomor sertifikat tidak ditemukan atau tidak valid.",
          missingTemplate: "Sertifikat ditemukan, namun data template rusak.",
          verifying: "Memeriksa...",
          recipient: "Nama Penerima",
          event: "Kegiatan / Acara",
          admin: "Login Admin",
          footer: "© 2024 Politeknik ATI Padang. Hak Cipta Dilindungi."
      }
  };

  const verify = (idToCheck: string) => {
    if (!idToCheck) return;
    setError('');
    setResult(null);
    
    const cleanId = idToCheck.trim();
    const cert = storageService.getCertificateById(cleanId);
    
    // Simulate network delay for UX
    setTimeout(() => {
        if (cert) {
            const template = storageService.getTemplateById(cert.templateId);
            if (template) {
                setResult({ data: cert, template });
                if (cert.language) setLang(cert.language);
            } else {
                setError(t[lang].missingTemplate);
            }
        } else {
            setError(t[lang].notFound);
        }
    }, 600);
  };

  const handleDownload = () => {
    if (!rendererRef.current || !result) return;
    
    const canvas = rendererRef.current.getCanvas();
    if (canvas) {
        // OPTIMIZATION: Use JPEG with 0.85 quality instead of PNG
        // This significantly reduces file size for certificates with background images
        const imgData = canvas.toDataURL('image/jpeg', 0.85);
        
        const pdf = new jsPDF({
            orientation: canvas.width > canvas.height ? 'landscape' : 'portrait',
            unit: 'px',
            format: [canvas.width, canvas.height]
        });
        
        pdf.addImage(imgData, 'JPEG', 0, 0, canvas.width, canvas.height);
        pdf.save(`${result.data.certificateNumber}.pdf`);
    }
  };

  // Trigger verification if URL param exists (MemoryRouter compatible)
  useEffect(() => {
     if (id) {
         const decodedId = decodeURIComponent(id);
         setInputId(decodedId);
         verify(decodedId);
     }
  }, [id]);

  return (
    <div className="min-h-screen flex flex-col font-sans bg-slate-50 text-slate-800">
        
      {/* Navbar */}
      <nav className="w-full bg-white/80 backdrop-blur-md sticky top-0 z-50 border-b border-slate-200">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
            <div className="flex justify-between items-center h-16">
                <div className="flex items-center space-x-2">
                    <ShieldCheck className="w-8 h-8 text-blue-700" />
                    <span className="font-bold text-xl tracking-tight text-slate-900 hidden md:block">Politeknik ATI Padang</span>
                    <span className="font-bold text-xl tracking-tight text-slate-900 md:hidden">E-Sertifikat</span>
                </div>
                <div className="flex items-center space-x-4">
                    <button onClick={() => setLang('ID')} className={`text-sm font-semibold ${lang === 'ID' ? 'text-blue-600' : 'text-slate-500'}`}>ID</button>
                    <span className="text-slate-300">|</span>
                    <button onClick={() => setLang('EN')} className={`text-sm font-semibold ${lang === 'EN' ? 'text-blue-600' : 'text-slate-500'}`}>EN</button>
                    <button 
                        onClick={() => navigate('/admin')} 
                        className="ml-4 px-4 py-2 text-sm font-medium text-white bg-slate-900 rounded-lg hover:bg-slate-800 transition-colors"
                    >
                        {t[lang].admin}
                    </button>
                </div>
            </div>
        </div>
      </nav>

      <main className="flex-grow flex flex-col items-center justify-center p-4 relative overflow-hidden">
        {/* Decorative Background Elements */}
        <div className="absolute top-0 left-0 w-full h-full overflow-hidden -z-10">
            <div className="absolute -top-20 -right-20 w-96 h-96 bg-blue-200 rounded-full mix-blend-multiply filter blur-3xl opacity-30 animate-blob"></div>
            <div className="absolute top-40 -left-20 w-96 h-96 bg-purple-200 rounded-full mix-blend-multiply filter blur-3xl opacity-30 animate-blob animation-delay-2000"></div>
        </div>

        {/* Hero Section */}
        <div className="w-full max-w-3xl text-center space-y-6 mt-10 mb-10 animate-fade-in">
            <div className="inline-flex items-center px-3 py-1 rounded-full bg-blue-50 text-blue-700 text-xs font-bold uppercase tracking-widest mb-2 border border-blue-100">
                Official Validation System
            </div>
            <h1 className="text-4xl md:text-6xl font-extrabold text-slate-900 tracking-tight leading-tight">
                {t[lang].title}
            </h1>
            <p className="text-lg text-slate-600 max-w-2xl mx-auto leading-relaxed">
                {t[lang].subtitle}
            </p>
        </div>

        {/* Search Box */}
        <div className="w-full max-w-xl relative group z-10 animate-slide-up">
            <div className="absolute -inset-1 bg-gradient-to-r from-blue-600 to-purple-600 rounded-2xl blur opacity-25 group-hover:opacity-50 transition duration-1000 group-hover:duration-200"></div>
            <div className="relative flex items-center bg-white rounded-xl shadow-2xl p-2">
                <Search className="w-6 h-6 text-slate-400 ml-3" />
                <input 
                    type="text" 
                    value={inputId}
                    onChange={(e) => setInputId(e.target.value)}
                    placeholder={t[lang].placeholder}
                    className="flex-1 px-4 py-3 outline-none text-lg text-slate-800 placeholder:text-slate-400 bg-transparent"
                    onKeyDown={(e) => e.key === 'Enter' && verify(inputId)}
                />
                <button 
                    onClick={() => verify(inputId)}
                    className="bg-slate-900 hover:bg-slate-800 text-white px-6 py-3 rounded-lg font-medium transition-all flex items-center shadow-lg transform active:scale-95"
                >
                    <span className="hidden sm:inline mr-2">{t[lang].verifyBtn}</span>
                    <ArrowRight className="w-4 h-4" />
                </button>
            </div>
        </div>

        {/* Error Message */}
        {error && (
            <div className="mt-8 flex items-center space-x-3 bg-red-50 text-red-700 px-6 py-4 rounded-xl border border-red-100 shadow-sm animate-bounce-slow max-w-md">
                <XCircle className="w-6 h-6 flex-shrink-0" />
                <span className="font-medium">{error}</span>
            </div>
        )}

        {/* Result Card */}
        {result && (
            <div className="w-full max-w-5xl mt-12 animate-fade-in pb-20">
                <div className="bg-white rounded-2xl shadow-2xl border border-slate-100 overflow-hidden">
                    {/* Header Indicator */}
                    <div className="bg-gradient-to-r from-emerald-50 to-teal-50 px-8 py-6 border-b border-emerald-100 flex flex-col md:flex-row items-center justify-between text-center md:text-left">
                        <div className="flex items-center mb-4 md:mb-0">
                            <div className="bg-emerald-100 p-3 rounded-full mr-4">
                                <CheckCircle className="w-8 h-8 text-emerald-600" />
                            </div>
                            <div>
                                <h2 className="text-xl font-bold text-emerald-900">{t[lang].verifiedTitle}</h2>
                                <p className="text-sm text-emerald-700">{t[lang].verifiedDesc}</p>
                            </div>
                        </div>
                        <div className="flex flex-col items-center md:items-end">
                            <span className="text-xs font-bold text-slate-400 uppercase tracking-wider">{t[lang].issuedOn}</span>
                            <span className="text-lg font-mono font-medium text-slate-700">{result.data.issueDate}</span>
                        </div>
                    </div>

                    <div className="grid grid-cols-1 lg:grid-cols-12">
                        {/* Certificate Preview */}
                        <div className="lg:col-span-8 bg-slate-100 p-8 flex justify-center items-center overflow-auto border-b lg:border-b-0 lg:border-r border-slate-200">
                             <div className="w-full flex justify-center shadow-xl rounded-sm overflow-hidden">
                                <CertificateRenderer 
                                    ref={rendererRef}
                                    template={result.template} 
                                    data={result.data}
                                    scale={0.5} 
                                />
                             </div>
                        </div>

                        {/* Details Panel */}
                        <div className="lg:col-span-4 p-8 flex flex-col justify-between bg-white">
                            <div className="space-y-6">
                                <div>
                                    <label className="text-xs font-bold text-slate-400 uppercase tracking-wider block mb-1">{t[lang].recipient}</label>
                                    <h3 className="text-2xl font-serif font-bold text-slate-900 border-l-4 border-blue-500 pl-4">{result.data.recipientName}</h3>
                                    {result.data.recipientRole && (
                                        <p className="text-sm text-slate-500 pl-4 mt-1">{result.data.recipientRole}</p>
                                    )}
                                </div>
                                
                                <div>
                                    <label className="text-xs font-bold text-slate-400 uppercase tracking-wider block mb-1">{t[lang].event}</label>
                                    <p className="text-lg font-medium text-slate-700 leading-snug">{result.data.eventName}</p>
                                </div>

                                <div className="p-4 bg-slate-50 rounded-lg border border-slate-100">
                                    <div className="flex justify-between text-sm mb-2">
                                        <span className="text-slate-500">ID:</span>
                                        <span className="font-mono font-bold text-slate-800">{result.data.certificateNumber}</span>
                                    </div>
                                    <div className="flex justify-between text-sm">
                                        <span className="text-slate-500">Status:</span>
                                        <span className="text-emerald-600 font-bold bg-emerald-50 px-2 py-0.5 rounded text-xs uppercase">Valid</span>
                                    </div>
                                </div>
                            </div>

                            <button 
                                onClick={handleDownload}
                                className="w-full mt-8 py-4 bg-blue-600 hover:bg-blue-700 text-white font-bold rounded-xl shadow-lg hover:shadow-blue-200 transition-all flex justify-center items-center group"
                            >
                                <Download className="w-5 h-5 mr-2 group-hover:-translate-y-1 transition-transform" />
                                {t[lang].download}
                            </button>
                        </div>
                    </div>
                </div>
            </div>
        )}
      </main>

      <footer className="py-6 text-center text-slate-400 text-sm">
          {t[lang].footer}
      </footer>
    </div>
  );
};

export default PublicVerification;