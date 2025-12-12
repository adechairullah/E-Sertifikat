import React, { useState, useEffect, useRef } from 'react';
import { CertificateTemplate, CertificateData, SystemConfig } from '../types';
import * as storageService from '../services/storageService';
import * as geminiService from '../services/geminiService';
import { v4 as uuidv4 } from 'uuid';
import { Download, Loader2, Wand2, UploadCloud, FileSpreadsheet, List, AlertCircle, Info, CheckCircle, XCircle, X } from 'lucide-react';
import { useNavigate } from 'react-router-dom';

// --- Toast Notification Component ---
interface ToastProps {
    type: 'success' | 'error' | 'info';
    message: string;
    onClose: () => void;
}

const Toast: React.FC<ToastProps> = ({ type, message, onClose }) => {
    useEffect(() => {
        const timer = setTimeout(onClose, 5000);
        return () => clearTimeout(timer);
    }, [onClose]);

    const bgColors = {
        success: 'bg-green-50 border-green-200 text-green-800',
        error: 'bg-red-50 border-red-200 text-red-800',
        info: 'bg-blue-50 border-blue-200 text-blue-800'
    };
    
    const icons = {
        success: <CheckCircle className="w-5 h-5 text-green-500" />,
        error: <XCircle className="w-5 h-5 text-red-500" />,
        info: <Info className="w-5 h-5 text-blue-500" />
    };

    return (
        <div className={`fixed top-4 right-4 z-50 flex items-start p-4 mb-4 rounded-lg border shadow-lg max-w-sm animate-fade-in ${bgColors[type]}`}>
            <div className="mr-3 mt-0.5">{icons[type]}</div>
            <div className="flex-1 text-sm font-medium">{message}</div>
            <button onClick={onClose} className="ml-3 text-slate-400 hover:text-slate-600">
                <X className="w-4 h-4" />
            </button>
        </div>
    );
};

const ImportCertificate: React.FC = () => {
  const navigate = useNavigate();
  const [templates, setTemplates] = useState<CertificateTemplate[]>([]);
  const [selectedTemplateId, setSelectedTemplateId] = useState<string>('');
  
  // Settings
  const [language, setLanguage] = useState<'EN' | 'ID'>('ID');
  const [systemConfig, setSystemConfig] = useState<SystemConfig | null>(null);
  const [eventName, setEventName] = useState('');
  const [issueDate, setIssueDate] = useState(new Date().toISOString().split('T')[0]);

  // Data Input
  const [inputType, setInputType] = useState<'manual' | 'csv'>('manual');
  const [manualText, setManualText] = useState(''); // "Name, Role, Email" per line
  const [recipients, setRecipients] = useState<{name: string, email: string, role: string}[]>([]);
  
  // AI
  const [generatedWording, setGeneratedWording] = useState('');
  const [isGenerating, setIsGenerating] = useState(false);
  const [isIssuing, setIsIssuing] = useState(false);
  
  // Notifications
  const [notification, setNotification] = useState<{type: 'success' | 'error' | 'info', message: string} | null>(null);

  const fileInputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    setTemplates(storageService.getTemplates());
    
    // Load System Configuration
    const config: SystemConfig = storageService.getSystemConfig();
    setSystemConfig(config);
    setLanguage(config.defaultLanguage);
  }, []);

  // Parse Manual Text
  useEffect(() => {
    if (inputType === 'manual') {
        const lines = manualText.split('\n').filter(l => l.trim().length > 0);
        const parsed = lines.map(line => {
            // Split by comma
            const parts = line.split(',').map(p => p.trim());
            
            // Format: Name, Role, Email (Optional)
            let name = parts[0];
            let role = parts[1] || (language === 'ID' ? 'Peserta' : 'Participant');
            let email = parts[2] || '';

            // Heuristic Safety Check: 
            // If user typed "Name, Email, Role" instead of "Name, Role, Email"
            // We detect if parts[1] has '@' and parts[2] does not.
            if (role.includes('@') && !email.includes('@')) {
                 const temp = role;
                 role = parts[2] || (language === 'ID' ? 'Peserta' : 'Participant');
                 email = temp;
            }

            return { name, email, role };
        });
        setRecipients(parsed);
    }
  }, [manualText, inputType, language]);

  const handleCSVUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
        const reader = new FileReader();
        reader.onload = (event) => {
            const text = event.target?.result as string;
            const lines = text.split('\n');
            const parsed: {name: string, email: string, role: string}[] = [];
            
            // Simple CSV parser
            // Expect header or first line
            // Try to detect columns
            const headers = lines[0].toLowerCase().split(',').map(h => h.trim());
            
            let nameIdx = 0;
            let emailIdx = -1;
            let roleIdx = 1;

            // Smart detection
            headers.forEach((h, i) => {
                if (h.includes('nam')) nameIdx = i;
                if (h.includes('mail') || h.includes('surel')) emailIdx = i;
                if (h.includes('role') || h.includes('peran') || h.includes('jabatan')) roleIdx = i;
            });

            const startIndex = (lines[0].toLowerCase().includes('name') || lines[0].toLowerCase().includes('nama')) ? 1 : 0;
            
            for(let i = startIndex; i < lines.length; i++) {
                const line = lines[i].trim();
                if(line) {
                    // Handle quotes in CSV roughly
                    const parts = line.split(',').map(p => p.trim().replace(/"/g, ''));
                    
                    if (parts[nameIdx]) {
                        parsed.push({
                            name: parts[nameIdx],
                            email: emailIdx > -1 ? parts[emailIdx] : '',
                            role: parts[roleIdx] || (language === 'ID' ? 'Peserta' : 'Participant')
                        });
                    }
                }
            }
            setRecipients(parsed);
            setNotification({ type: 'success', message: `Berhasil memuat ${parsed.length} data dari CSV.` });
        };
        reader.readAsText(file);
    }
  };

  const handleAiGenerate = async () => {
    if (!eventName) {
        setNotification({ type: 'error', message: 'Harap isi Nama Acara terlebih dahulu.' });
        return;
    }
    setIsGenerating(true);
    const sampleRole = recipients.length > 0 ? recipients[0].role : (language === 'ID' ? 'Peserta' : 'Participant');
    
    const text = await geminiService.generateCertificateWording(eventName, sampleRole, language);
    setGeneratedWording(text);
    setIsGenerating(false);
  };

  const handleIssue = async () => {
    // 1. Validation
    if (!selectedTemplateId) {
        setNotification({ type: 'error', message: 'Mohon pilih Template terlebih dahulu.' });
        return;
    }
    if (!eventName) {
        setNotification({ type: 'error', message: 'Mohon isi Nama Acara.' });
        return;
    }
    if (recipients.length === 0) {
        setNotification({ type: 'error', message: 'Tidak ada data penerima. Mohon isi data manual atau upload CSV.' });
        return;
    }

    setIsIssuing(true);
    setNotification({ type: 'info', message: 'Sedang memproses penerbitan sertifikat...' });

    // 2. Generate Data
    const currentYear = new Date().getFullYear().toString();
    const newCerts: CertificateData[] = [];

    try {
        recipients.forEach((rec, index) => {
            // Determine prefix based on Role
            const roleLower = rec.role.toLowerCase();
            let prefixTemplate = systemConfig?.prefixParticipant || 'SRT-PST/{YEAR}/';

            if (roleLower.includes('nara') || roleLower.includes('speak') || roleLower.includes('pemateri')) {
                prefixTemplate = systemConfig?.prefixSpeaker || 'SRT-NRS/{YEAR}/';
            } else if (roleLower.includes('instru') || roleLower.includes('panitia') || roleLower.includes('tutor')) {
                prefixTemplate = systemConfig?.prefixInstructor || 'SRT-INS/{YEAR}/';
            }

            const prefix = prefixTemplate.replace('{YEAR}', currentYear);
            
            // Generate Number
            const seq = (index + 1).toString().padStart(4, '0');
            const randomSuffix = Math.floor(Math.random() * 999).toString().padStart(3, '0');
            const certNum = `${prefix}${seq}-${randomSuffix}`;

            newCerts.push({
                id: uuidv4(),
                templateId: selectedTemplateId,
                certificateNumber: certNum,
                recipientName: rec.name,
                recipientEmail: rec.email,
                recipientRole: rec.role,
                eventName: eventName,
                issueDate: issueDate,
                language: language,
                customText: generatedWording || (language === 'ID' ? `Diberikan kepada ${rec.name}` : `Awarded to ${rec.name}`),
                status: 'published',
                emailSent: false
            });
        });

        // 3. Save to Storage (CRITICAL Step)
        storageService.bulkSaveCertificates(newCerts);
        
        // Notify success
        setNotification({ type: 'success', message: `${newCerts.length} Sertifikat berhasil diterbitkan!` });

    } catch (error) {
        console.error("Save Error", error);
        setNotification({ type: 'error', message: "Gagal menyimpan data ke database sistem." });
        setIsIssuing(false);
        return;
    }

    // 4. Finish
    setIsIssuing(false);
    setTimeout(() => {
        navigate('/admin/certificates');
    }, 1500);
  };

  return (
    <div className="max-w-5xl mx-auto p-6 bg-white rounded-xl shadow-sm border border-slate-200 relative">
      {notification && (
        <Toast 
            type={notification.type} 
            message={notification.message} 
            onClose={() => setNotification(null)} 
        />
      )}

      <div className="flex justify-between items-center mb-6">
          <h2 className="text-2xl font-bold text-slate-900">
              Penerbitan Sertifikat Baru
          </h2>
          <div className="flex items-center space-x-2 bg-slate-100 p-1 rounded-lg">
              <button 
                onClick={() => setLanguage('ID')}
                className={`px-3 py-1 text-sm font-medium rounded-md ${language === 'ID' ? 'bg-white shadow text-blue-600' : 'text-slate-500'}`}
              >
                  🇮🇩 Indonesia
              </button>
              <button 
                onClick={() => setLanguage('EN')}
                className={`px-3 py-1 text-sm font-medium rounded-md ${language === 'EN' ? 'bg-white shadow text-blue-600' : 'text-slate-500'}`}
              >
                  🇺🇸 English
              </button>
          </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        {/* Left Column: Config */}
        <div className="lg:col-span-1 space-y-6">
            <div>
                <label className="block text-sm font-medium text-slate-700 mb-2">
                    1. Pilih Template <span className="text-red-500">*</span>
                </label>
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
                    <p className="text-xs text-red-500 mt-1 flex items-center">
                        <AlertCircle className="w-3 h-3 mr-1" />
                        Belum ada template. Buat di menu Template.
                    </p>
                )}
            </div>

            <div>
                <label className="block text-sm font-medium text-slate-700 mb-2">
                    2. Detail Acara <span className="text-red-500">*</span>
                </label>
                <input 
                    type="text" 
                    placeholder="Nama Acara (e.g. Workshop AI)"
                    value={eventName}
                    onChange={(e) => setEventName(e.target.value)}
                    className="w-full p-2 border border-slate-300 rounded-md mb-2"
                />
                <input 
                    type="date" 
                    value={issueDate}
                    onChange={(e) => setIssueDate(e.target.value)}
                    className="w-full p-2 border border-slate-300 rounded-md"
                />
            </div>

            <div className="bg-slate-50 p-4 rounded border border-slate-100">
                 <div className="flex items-start text-xs text-slate-600">
                    <Info className="w-4 h-4 mr-2 mt-0.5 text-blue-500" />
                    <p>Format nomor sertifikat akan otomatis disesuaikan berdasarkan Peran/Role sesuai Konfigurasi Sistem.</p>
                 </div>
            </div>

            <div className="bg-purple-50 p-4 rounded-md border border-purple-100">
                <div className="flex justify-between items-center mb-2">
                    <label className="block text-sm font-bold text-purple-800">AI Wording Generator</label>
                    <Wand2 className="w-4 h-4 text-purple-600" />
                </div>
                <button 
                    onClick={handleAiGenerate}
                    disabled={isGenerating || !eventName}
                    className="w-full py-2 bg-purple-600 text-white text-xs font-medium rounded hover:bg-purple-700 disabled:opacity-50 flex justify-center items-center mb-3"
                >
                    {isGenerating ? <Loader2 className="w-3 h-3 animate-spin mr-1"/> : null}
                    Buat Kata-kata Otomatis
                </button>
                <textarea 
                    value={generatedWording}
                    onChange={(e) => setGeneratedWording(e.target.value)}
                    placeholder="Hasil text AI akan muncul di sini..."
                    className="w-full p-2 text-sm border border-purple-200 rounded-md h-24 focus:ring-purple-500"
                />
            </div>
        </div>

        {/* Right Column: Data Import */}
        <div className="lg:col-span-2 space-y-6 border-l border-slate-100 pl-0 lg:pl-8">
            <div>
                <label className="block text-sm font-medium text-slate-700 mb-4">
                    3. Data Penerima <span className="text-red-500">*</span>
                </label>
                
                <div className="flex space-x-4 mb-4">
                    <button 
                        onClick={() => setInputType('manual')}
                        className={`flex items-center px-4 py-2 text-sm rounded-md transition-colors ${inputType === 'manual' ? 'bg-blue-100 text-blue-700 font-medium' : 'bg-white text-slate-600 border border-slate-200 hover:bg-slate-50'}`}
                    >
                        <List className="w-4 h-4 mr-2" />
                        Input Manual
                    </button>
                    <button 
                        onClick={() => setInputType('csv')}
                        className={`flex items-center px-4 py-2 text-sm rounded-md transition-colors ${inputType === 'csv' ? 'bg-green-100 text-green-700 font-medium' : 'bg-white text-slate-600 border border-slate-200 hover:bg-slate-50'}`}
                    >
                        <FileSpreadsheet className="w-4 h-4 mr-2" />
                        Import CSV
                    </button>
                </div>

                {inputType === 'manual' ? (
                    <div>
                        <textarea 
                            value={manualText}
                            onChange={(e) => setManualText(e.target.value)}
                            placeholder="Budi Santoso, Peserta, budi@email.com&#10;Ani Wijaya, Narasumber"
                            className="w-full h-48 p-3 border border-slate-300 rounded-md font-mono text-sm"
                        />
                        <p className="text-xs text-slate-500 mt-1">
                            Format: <strong>Nama, Peran, Email (Opsional)</strong> (Satu data per baris)
                        </p>
                    </div>
                ) : (
                    <div className="border-2 border-dashed border-slate-300 rounded-lg p-8 flex flex-col items-center justify-center text-center bg-slate-50">
                        <UploadCloud className="w-10 h-10 text-slate-400 mb-3" />
                        <p className="text-sm text-slate-600 mb-4">
                            Upload file .csv (Header otomatis dideteksi: Name, Email, Role)
                        </p>
                        <input 
                            type="file" 
                            accept=".csv"
                            ref={fileInputRef}
                            onChange={handleCSVUpload}
                            className="hidden"
                        />
                        <button 
                            onClick={() => fileInputRef.current?.click()}
                            className="px-4 py-2 bg-white border border-slate-300 rounded-md text-sm font-medium text-slate-700 shadow-sm hover:bg-slate-50"
                        >
                            Pilih File
                        </button>
                    </div>
                )}
            </div>

            {recipients.length > 0 && (
                <div className="mt-6">
                    <h4 className="text-sm font-bold text-slate-800 mb-3">
                        Preview ({recipients.length} penerima)
                    </h4>
                    <div className="max-h-64 overflow-y-auto border border-slate-200 rounded-md">
                        <table className="w-full text-sm text-left">
                            <thead className="bg-slate-50 text-slate-500 font-medium border-b">
                                <tr>
                                    <th className="px-4 py-2">No</th>
                                    <th className="px-4 py-2">Nama</th>
                                    <th className="px-4 py-2">Peran</th>
                                    <th className="px-4 py-2">Email</th>
                                    <th className="px-4 py-2 text-xs">Prefix Format</th>
                                </tr>
                            </thead>
                            <tbody className="divide-y divide-slate-100">
                                {recipients.map((r, idx) => {
                                    // Determine prefix preview
                                    const roleLower = r.role.toLowerCase();
                                    let type = 'Peserta';
                                    if (roleLower.includes('nara') || roleLower.includes('speak') || roleLower.includes('pemateri')) type = 'Narasumber';
                                    else if (roleLower.includes('instru') || roleLower.includes('tutor')) type = 'Instruktur';
                                    
                                    return (
                                        <tr key={idx} className="hover:bg-slate-50">
                                            <td className="px-4 py-2 text-slate-400">{idx + 1}</td>
                                            <td className="px-4 py-2 font-medium text-slate-900">{r.name}</td>
                                            <td className="px-4 py-2 text-slate-600">{r.role}</td>
                                            <td className="px-4 py-2 text-slate-500 text-xs font-mono">{r.email || '-'}</td>
                                            <td className="px-4 py-2 text-xs text-slate-400 font-mono">{type}</td>
                                        </tr>
                                    );
                                })}
                            </tbody>
                        </table>
                    </div>
                </div>
            )}

            <div className="pt-4 pb-8 space-y-4">
                <button 
                    onClick={handleIssue}
                    disabled={recipients.length === 0 || isIssuing}
                    className="w-full py-4 bg-blue-600 text-white font-bold rounded-lg hover:bg-blue-700 disabled:bg-slate-300 transition-colors flex justify-center items-center shadow-lg shadow-blue-200"
                >
                    {isIssuing ? <Loader2 className="w-5 h-5 mr-2 animate-spin" /> : <Download className="w-5 h-5 mr-2" />}
                    {isIssuing ? 'Terbitkan & Simpan' : 'Terbitkan & Simpan'}
                </button>
            </div>
        </div>
      </div>
    </div>
  );
};

export default ImportCertificate;