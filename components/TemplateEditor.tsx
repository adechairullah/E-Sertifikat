import React, { useState, useRef, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { CertificateTemplate, TemplateField } from '../types';
import { v4 as uuidv4 } from 'uuid';
import CertificateRenderer from './CertificateRenderer';
import { Plus, Save, Trash2, Upload, Layout, Move, ArrowLeft, ZoomIn, ZoomOut } from 'lucide-react';
import * as storageService from '../services/storageService';

const DEFAULT_FIELDS: TemplateField[] = [
  { id: '1', key: 'recipientName', label: 'Nama Penerima', type: 'text', x: 50, y: 40, fontSize: 48, fontFamily: 'Playfair Display', color: '#1e293b', align: 'center', fontWeight: 'bold' },
  { id: '6', key: 'recipientRole', label: 'Peran (Role)', type: 'text', x: 50, y: 48, fontSize: 24, fontFamily: 'Inter', color: '#334155', align: 'center', fontWeight: 'normal' },
  { id: '2', key: 'eventName', label: 'Nama Acara', type: 'text', x: 50, y: 56, fontSize: 24, fontFamily: 'Inter', color: '#475569', align: 'center', fontWeight: 'normal' },
  { id: '3', key: 'issueDate', label: 'Tanggal', type: 'date', x: 20, y: 80, fontSize: 16, fontFamily: 'Inter', color: '#64748b', align: 'left', fontWeight: 'normal' },
  { id: '4', key: 'certificateNumber', label: 'No. Sertifikat', type: 'text', x: 80, y: 80, fontSize: 14, fontFamily: 'Inter', color: '#94a3b8', align: 'right', fontWeight: 'normal' },
  { id: '5', key: 'qr_verification', label: 'QR Code', type: 'qr', x: 50, y: 75, fontSize: 20, fontFamily: 'Inter', color: '#000000', align: 'center', fontWeight: 'normal' },
];

const TemplateEditor: React.FC = () => {
  const { templateId } = useParams();
  const navigate = useNavigate();
  
  const [name, setName] = useState('');
  const [backgroundImage, setBackgroundImage] = useState<string>('');
  const [width, setWidth] = useState(800);
  const [height, setHeight] = useState(600);
  const [fields, setFields] = useState<TemplateField[]>([]);
  const [selectedFieldId, setSelectedFieldId] = useState<string | null>(null);
  const [createdAt, setCreatedAt] = useState(Date.now());
  
  // View Controls
  const [zoom, setZoom] = useState(0.5);

  // Drag and Drop State
  const [draggingId, setDraggingId] = useState<string | null>(null);
  const containerRef = useRef<HTMLDivElement>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  // Load existing data
  useEffect(() => {
    if (templateId) {
        const existing = storageService.getTemplateById(templateId);
        if (existing) {
            setName(existing.name);
            setBackgroundImage(existing.backgroundImage);
            setWidth(existing.width);
            setHeight(existing.height);
            setFields(existing.fields);
            setCreatedAt(existing.createdAt);
        }
    } else {
        // New Template Defaults
        setFields(DEFAULT_FIELDS);
    }
  }, [templateId]);

  const handleImageUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      const reader = new FileReader();
      reader.onload = (event) => {
        const img = new Image();
        img.onload = () => {
            setWidth(img.width);
            setHeight(img.height);
            setBackgroundImage(event.target?.result as string);
            // Auto adjust zoom for large images
            if (img.width > 1200) setZoom(0.4);
        }
        img.src = event.target?.result as string;
      };
      reader.readAsDataURL(file);
    }
  };

  const addField = () => {
    const newField: TemplateField = {
      ...DEFAULT_FIELDS[0],
      id: uuidv4(),
      label: 'Text Baru',
      key: 'customText',
      y: 50,
      x: 50
    };
    setFields([...fields, newField]);
    setSelectedFieldId(newField.id);
  };

  const updateField = (id: string, updates: Partial<TemplateField>) => {
    setFields(fields.map(f => f.id === id ? { ...f, ...updates } : f));
  };

  const removeField = (id: string) => {
    setFields(fields.filter(f => f.id !== id));
    if (selectedFieldId === id) setSelectedFieldId(null);
  };

  const handleSave = () => {
    if (!name || !backgroundImage) {
      alert("Harap isi nama template dan upload gambar background.");
      return;
    }

    const template: CertificateTemplate = {
      id: templateId || uuidv4(),
      name,
      backgroundImage,
      width,
      height,
      fields,
      createdAt
    };

    storageService.saveTemplate(template);
    navigate('/admin/templates');
  };

  // --- Drag and Drop Logic ---

  const handleMouseDown = (e: React.MouseEvent, id: string) => {
    e.stopPropagation();
    e.preventDefault();
    setDraggingId(id);
    setSelectedFieldId(id);
  };

  const handleMouseMove = (e: React.MouseEvent) => {
    if (!draggingId || !containerRef.current) return;
    
    e.preventDefault();
    const rect = containerRef.current.getBoundingClientRect();
    
    const x = e.clientX - rect.left;
    const y = e.clientY - rect.top;
    
    const xPercent = (x / rect.width) * 100;
    const yPercent = (y / rect.height) * 100;

    const clampedX = Math.max(0, Math.min(100, xPercent));
    const clampedY = Math.max(0, Math.min(100, yPercent));

    updateField(draggingId, { x: clampedX, y: clampedY });
  };

  const handleMouseUp = () => {
    setDraggingId(null);
  };

  const selectedField = fields.find(f => f.id === selectedFieldId);

  return (
    <div className="flex flex-col h-full overflow-hidden bg-slate-50" onMouseUp={handleMouseUp} onMouseLeave={handleMouseUp}>
      {/* Toolbar */}
      <div className="flex items-center justify-between p-4 bg-white border-b border-slate-200 shadow-sm z-10">
        <div className="flex items-center space-x-4">
          <button onClick={() => navigate('/admin/templates')} className="p-2 text-slate-500 hover:text-slate-800 hover:bg-slate-100 rounded-full">
            <ArrowLeft className="w-5 h-5" />
          </button>
          <div>
              <h1 className="text-lg font-bold text-slate-900">{templateId ? 'Edit Template' : 'Template Baru'}</h1>
              <input
                type="text"
                placeholder="Nama Template (e.g. Sertifikat Webinar)"
                value={name}
                onChange={(e) => setName(e.target.value)}
                className="mt-1 px-2 py-1 border-b border-transparent hover:border-slate-300 focus:border-blue-500 outline-none text-sm text-slate-600 w-64 bg-transparent"
              />
          </div>
          
          {/* Zoom Controls */}
          <div className="flex items-center space-x-2 bg-slate-100 rounded-lg p-1 ml-4 border border-slate-200">
             <button 
                onClick={() => setZoom(z => Math.max(0.1, z - 0.1))}
                className="p-1 hover:bg-white rounded shadow-sm text-slate-600"
                title="Zoom Out"
             >
                <ZoomOut className="w-4 h-4" />
             </button>
             <span className="text-xs font-mono w-12 text-center text-slate-600 font-bold">{Math.round(zoom * 100)}%</span>
             <button 
                onClick={() => setZoom(z => Math.min(2.0, z + 0.1))}
                className="p-1 hover:bg-white rounded shadow-sm text-slate-600"
                title="Zoom In"
             >
                <ZoomIn className="w-4 h-4" />
             </button>
          </div>
        </div>

        <div className="flex space-x-2">
            <button
                onClick={() => fileInputRef.current?.click()}
                className="flex items-center px-4 py-2 text-sm font-medium text-slate-700 bg-white border border-slate-300 rounded-md hover:bg-slate-50 transition-colors"
            >
                <Upload className="w-4 h-4 mr-2" />
                {backgroundImage ? 'Ganti Bg' : 'Upload Bg'}
            </button>
            <input 
                type="file" 
                ref={fileInputRef} 
                onChange={handleImageUpload} 
                className="hidden" 
                accept="image/*"
            />
          <button
            onClick={handleSave}
            className="flex items-center px-4 py-2 text-sm font-medium text-white bg-blue-600 rounded-md hover:bg-blue-700 transition-colors shadow-sm"
          >
            <Save className="w-4 h-4 mr-2" />
            Simpan
          </button>
        </div>
      </div>

      <div className="flex flex-1 overflow-hidden">
        {/* Canvas Area */}
        <div className="flex-1 bg-slate-100 flex justify-center items-center overflow-auto p-8 relative">
            {backgroundImage ? (
                <div 
                    ref={containerRef}
                    onMouseMove={handleMouseMove}
                    className="relative shadow-2xl transition-all duration-200"
                    style={{ width: 'fit-content', height: 'fit-content' }}
                >
                     <CertificateRenderer 
                        template={{ id: 'preview', name, backgroundImage, width, height, fields, createdAt: 0 }}
                        data={{ recipientName: 'John Doe', recipientRole: 'Peserta', eventName: 'Sample Event Name', issueDate: '2024-05-20', certificateNumber: 'DEMO-123' }}
                        scale={zoom} 
                        className="block" // Ensure it's block for container sizing
                     />
                     
                     {/* Overlay Layer for Interaction */}
                     <div className="absolute inset-0 pointer-events-none">
                         {fields.map(f => (
                             <div 
                                key={f.id}
                                onMouseDown={(e) => handleMouseDown(e, f.id)}
                                style={{ 
                                    left: `${f.x}%`, 
                                    top: `${f.y}%`,
                                    transform: `translate(${f.align === 'center' ? '-50%' : f.align === 'right' ? '-100%' : '0'}, 0)`
                                }}
                                className={`
                                    absolute px-2 py-1 flex items-center gap-1
                                    rounded cursor-move pointer-events-auto select-none transition-colors border
                                    ${selectedFieldId === f.id 
                                        ? 'bg-blue-600/90 text-white border-blue-500 shadow-lg ring-2 ring-white z-50' 
                                        : 'bg-white/80 text-slate-800 border-slate-300 hover:bg-blue-50 hover:border-blue-300 z-10'}
                                `}
                             >
                                 <Move className="w-3 h-3 opacity-50" />
                                 <span className="text-xs font-bold whitespace-nowrap">{f.key}</span>
                             </div>
                         ))}
                     </div>
                </div>
            ) : (
                <div className="flex flex-col items-center justify-center w-full max-w-2xl h-96 border-4 border-dashed border-slate-300 rounded-2xl bg-white/50">
                    <Layout className="w-16 h-16 text-slate-300 mb-4" />
                    <p className="text-lg text-slate-500 font-medium">Mulai dengan mengupload gambar background sertifikat.</p>
                    <p className="text-sm text-slate-400">Format: JPG, PNG</p>
                    <button 
                        onClick={() => fileInputRef.current?.click()}
                        className="mt-6 px-6 py-2 bg-blue-100 text-blue-700 font-bold rounded-full hover:bg-blue-200 transition-colors"
                    >
                        Upload Gambar
                    </button>
                </div>
            )}
        </div>

        {/* Sidebar Controls */}
        <div className="w-80 bg-white border-l border-slate-200 flex flex-col h-full shadow-xl z-20">
            <div className="p-4 border-b border-slate-100">
                <h3 className="text-xs font-bold text-slate-400 uppercase tracking-wider mb-3">Layer Elemen</h3>
                <button 
                    onClick={addField}
                    className="w-full flex justify-center items-center py-2 px-4 bg-slate-50 border border-slate-200 rounded-md text-slate-700 hover:bg-blue-50 hover:text-blue-600 hover:border-blue-200 transition-all font-medium text-sm"
                >
                    <Plus className="w-4 h-4 mr-2" /> Tambah Teks / Data
                </button>
            </div>

            <div className="flex-1 overflow-y-auto p-2 space-y-2">
                {fields.map(field => (
                    <div 
                        key={field.id} 
                        onClick={() => setSelectedFieldId(field.id)}
                        className={`
                            p-3 rounded-lg border cursor-pointer flex justify-between items-center transition-all group
                            ${selectedFieldId === field.id 
                                ? 'border-blue-500 bg-blue-50 shadow-sm' 
                                : 'border-transparent hover:bg-slate-50 hover:border-slate-200'}
                        `}
                    >
                        <div className="flex items-center overflow-hidden">
                            <div className={`w-2 h-2 rounded-full mr-3 ${selectedFieldId === field.id ? 'bg-blue-500' : 'bg-slate-300'}`} />
                            <span className={`text-sm font-medium truncate ${selectedFieldId === field.id ? 'text-blue-900' : 'text-slate-600'}`}>
                                {field.key}
                            </span>
                        </div>
                        <button 
                            onClick={(e) => { e.stopPropagation(); removeField(field.id); }} 
                            className="p-1 text-slate-300 hover:text-red-500 hover:bg-red-50 rounded opacity-0 group-hover:opacity-100 transition-all"
                        >
                            <Trash2 className="w-4 h-4" />
                        </button>
                    </div>
                ))}
            </div>

            {selectedField && (
                <div className="border-t border-slate-200 bg-slate-50 p-5">
                    <div className="flex justify-between items-center mb-4">
                        <h3 className="text-sm font-bold text-slate-900">Properti Layer</h3>
                        <span className="text-xs text-slate-500 bg-white px-2 py-1 rounded border border-slate-200">{selectedField.type}</span>
                    </div>
                    
                    <div className="space-y-4">
                         <div>
                            <label className="block text-xs font-semibold text-slate-500 mb-1">Data Key (Isi Konten)</label>
                            <select 
                                value={selectedField.key} 
                                onChange={(e) => updateField(selectedField.id, { key: e.target.value })}
                                className="w-full text-sm border-slate-300 rounded-md focus:ring-blue-500 focus:border-blue-500"
                            >
                                <option value="recipientName">Nama Penerima</option>
                                <option value="recipientRole">Peran / Role</option>
                                <option value="eventName">Nama Acara</option>
                                <option value="issueDate">Tanggal Terbit</option>
                                <option value="certificateNumber">Nomor Sertifikat</option>
                                <option value="customText">Custom Text / Apresiasi</option>
                                <option value="qr_verification">QR Code Verifikasi</option>
                            </select>
                        </div>

                        <div className="grid grid-cols-2 gap-3">
                            <div>
                                <label className="block text-xs font-semibold text-slate-500 mb-1">Posisi X %</label>
                                <input 
                                    type="number" 
                                    value={Math.round(selectedField.x)} 
                                    onChange={(e) => updateField(selectedField.id, { x: Number(e.target.value) })}
                                    className="w-full text-sm border-slate-300 rounded-md"
                                />
                            </div>
                            <div>
                                <label className="block text-xs font-semibold text-slate-500 mb-1">Posisi Y %</label>
                                <input 
                                    type="number" 
                                    value={Math.round(selectedField.y)} 
                                    onChange={(e) => updateField(selectedField.id, { y: Number(e.target.value) })}
                                    className="w-full text-sm border-slate-300 rounded-md"
                                />
                            </div>
                        </div>

                        <div>
                             <label className="block text-xs font-semibold text-slate-500 mb-1 flex justify-between">
                                <span>{selectedField.key === 'qr_verification' ? 'Ukuran (Scale)' : 'Ukuran Font'}</span>
                                <span className="text-slate-400">{selectedField.fontSize}px</span>
                             </label>
                             <input 
                                 type="range" min="10" max="150"
                                 value={selectedField.fontSize} 
                                 onChange={(e) => updateField(selectedField.id, { fontSize: Number(e.target.value) })}
                                 className="w-full h-2 bg-slate-200 rounded-lg appearance-none cursor-pointer accent-blue-600"
                             />
                        </div>

                        <div className="grid grid-cols-2 gap-3">
                             <div>
                                <label className="block text-xs font-semibold text-slate-500 mb-1">Warna</label>
                                <div className="flex items-center space-x-2">
                                    <input 
                                        type="color" 
                                        value={selectedField.color} 
                                        onChange={(e) => updateField(selectedField.id, { color: e.target.value })}
                                        className="w-8 h-8 p-0 border-0 rounded overflow-hidden cursor-pointer shadow-sm"
                                    />
                                    <span className="text-xs text-slate-500 font-mono">{selectedField.color}</span>
                                </div>
                             </div>
                             <div>
                                <label className="block text-xs font-semibold text-slate-500 mb-1">Align (Rata)</label>
                                <div className="flex bg-white rounded-md border border-slate-300 overflow-hidden">
                                    {['left', 'center', 'right'].map((align) => (
                                        <button
                                            key={align}
                                            onClick={() => updateField(selectedField.id, { align: align as any })}
                                            className={`flex-1 py-1.5 hover:bg-slate-50 ${selectedField.align === align ? 'bg-blue-100 text-blue-700' : 'text-slate-400'}`}
                                        >
                                            {align.charAt(0).toUpperCase()}
                                        </button>
                                    ))}
                                </div>
                             </div>
                        </div>
                        
                         {selectedField.key !== 'qr_verification' && (
                            <div className="grid grid-cols-2 gap-3">
                                <div>
                                    <label className="block text-xs font-semibold text-slate-500 mb-1">Jenis Font</label>
                                    <select 
                                        value={selectedField.fontFamily} 
                                        onChange={(e) => updateField(selectedField.id, { fontFamily: e.target.value })}
                                        className="w-full text-xs border-slate-300 rounded-md"
                                    >
                                        <option value="Inter">Sans Serif</option>
                                        <option value="Playfair Display">Serif</option>
                                        <option value="Courier New">Monospace</option>
                                    </select>
                                </div>
                                <div>
                                    <label className="block text-xs font-semibold text-slate-500 mb-1">Tebal</label>
                                    <select 
                                        value={selectedField.fontWeight} 
                                        onChange={(e) => updateField(selectedField.id, { fontWeight: e.target.value as any })}
                                        className="w-full text-xs border-slate-300 rounded-md"
                                    >
                                        <option value="normal">Normal</option>
                                        <option value="bold">Bold</option>
                                    </select>
                                </div>
                            </div>
                        )}
                    </div>
                </div>
            )}
        </div>
      </div>
    </div>
  );
};

export default TemplateEditor;