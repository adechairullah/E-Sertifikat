import React, { useState, useEffect } from 'react';
import { jsPDF } from 'jspdf';
import autoTable from 'jspdf-autotable';
import * as storageService from '../services/storageService';
import { CertificateData } from '../types';
import { FileText, Printer, Filter } from 'lucide-react';

const EventLetterGenerator: React.FC = () => {
  const [events, setEvents] = useState<string[]>([]);
  const [selectedEvent, setSelectedEvent] = useState<string>('');
  const [certificates, setCertificates] = useState<CertificateData[]>([]);

  useEffect(() => {
    setEvents(storageService.getUniqueEvents());
  }, []);

  useEffect(() => {
    if (selectedEvent) {
      const all = storageService.getCertificates();
      const filtered = all.filter(c => c.eventName === selectedEvent);
      // Sort by name
      filtered.sort((a, b) => a.recipientName.localeCompare(b.recipientName));
      setCertificates(filtered);
    } else {
      setCertificates([]);
    }
  }, [selectedEvent]);

  const generatePDF = () => {
    const doc = new jsPDF();
    const pageWidth = doc.internal.pageSize.width;
    
    // --- Header ---
    doc.setFont("helvetica", "bold");
    doc.setFontSize(18);
    doc.text("LAPORAN DISTRIBUSI SERTIFIKAT", pageWidth / 2, 20, { align: "center" });
    
    doc.setFontSize(12);
    doc.setFont("helvetica", "normal");
    doc.text(`Kegiatan: ${selectedEvent}`, pageWidth / 2, 28, { align: "center" });
    doc.text(`Tanggal Cetak: ${new Date().toLocaleDateString('id-ID')}`, pageWidth / 2, 34, { align: "center" });

    doc.setLineWidth(0.5);
    doc.line(15, 40, pageWidth - 15, 40);

    // --- Instructions ---
    doc.setFont("helvetica", "bold");
    doc.setFontSize(10);
    doc.text("Panduan Download:", 15, 50);
    doc.setFont("helvetica", "normal");
    doc.text("1. Klik link pada kolom 'Link Download' untuk membuka halaman verifikasi.", 15, 55);
    doc.text("2. Tekan tombol 'Unduh Sertifikat (PDF)' pada halaman tersebut.", 15, 60);

    // Handle Safe Origin
    const origin = window.location.origin && window.location.origin !== 'null' 
        ? window.location.origin 
        : 'https://certitrust.demo';

    // --- Table ---
    const tableData = certificates.map((cert, index) => {
        const url = `${origin}/#/verify/${cert.certificateNumber}`;
        return [
            index + 1,
            cert.recipientName,
            cert.recipientRole,
            cert.certificateNumber,
            url // Raw URL for now, autotable hook makes it clickable
        ];
    });

    autoTable(doc, {
        startY: 70,
        head: [['No', 'Nama Peserta', 'Peran', 'No. Sertifikat', 'Link Download']],
        body: tableData,
        theme: 'grid',
        styles: { fontSize: 9, cellPadding: 2 },
        headStyles: { fillColor: [52, 73, 94], textColor: 255 },
        columnStyles: {
            0: { cellWidth: 10 },
            4: { cellWidth: 60, textColor: [0, 0, 255], fontStyle: 'italic' } // Make link look blue
        },
        didDrawCell: (data) => {
            if (data.section === 'body' && data.column.index === 4) {
                const url = data.cell.raw as string;
                // Add link annotation
                doc.link(data.cell.x, data.cell.y, data.cell.width, data.cell.height, { url: url });
            }
        }
    });

    // Save
    const safeFilename = selectedEvent.replace(/[^a-z0-9]/gi, '_').toLowerCase();
    doc.save(`Laporan_Sertifikat_${safeFilename}.pdf`);
  };

  return (
    <div className="p-8 max-w-5xl mx-auto">
        <div className="flex items-center space-x-3 mb-8">
            <div className="p-3 bg-indigo-100 rounded-lg">
                <FileText className="w-8 h-8 text-indigo-600" />
            </div>
            <div>
                <h1 className="text-3xl font-bold text-slate-900">Laporan Distribusi</h1>
                <p className="text-slate-500">Cetak laporan dan link download untuk peserta kegiatan.</p>
            </div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
            {/* Configuration Panel */}
            <div className="lg:col-span-1 space-y-6">
                <div className="bg-white p-6 rounded-xl shadow-sm border border-slate-200">
                    <h3 className="font-bold text-slate-900 mb-4 flex items-center">
                        <Filter className="w-4 h-4 mr-2" /> Pilih Kegiatan
                    </h3>
                    <select 
                        value={selectedEvent}
                        onChange={(e) => setSelectedEvent(e.target.value)}
                        className="w-full p-2 border border-slate-300 rounded-md focus:ring-2 focus:ring-indigo-500 mb-4"
                    >
                        <option value="">-- Pilih Kegiatan --</option>
                        {events.map((evt, idx) => (
                            <option key={idx} value={evt}>{evt}</option>
                        ))}
                    </select>

                    <button 
                        onClick={generatePDF}
                        disabled={!selectedEvent || certificates.length === 0}
                        className="w-full mt-4 py-3 bg-indigo-600 text-white font-bold rounded-lg hover:bg-indigo-700 disabled:bg-slate-300 shadow-lg shadow-indigo-200 flex justify-center items-center transition-all"
                    >
                        <Printer className="w-5 h-5 mr-2" />
                        Download PDF
                    </button>
                    
                    <div className="mt-4 text-xs text-slate-500 bg-slate-50 p-3 rounded">
                        PDF ini berisi tabel data peserta beserta link aktif yang dapat diklik untuk mengunduh sertifikat masing-masing.
                    </div>
                </div>
            </div>

            {/* Preview Panel */}
            <div className="lg:col-span-2">
                <div className="bg-white rounded-xl shadow-sm border border-slate-200 overflow-hidden h-full flex flex-col">
                    <div className="p-4 border-b border-slate-100 bg-slate-50 flex justify-between items-center">
                        <h3 className="font-bold text-slate-700">Preview Daftar</h3>
                        <span className="text-xs font-medium text-slate-500 bg-white px-2 py-1 rounded border border-slate-200">
                            {certificates.length} Penerima
                        </span>
                    </div>
                    
                    {certificates.length === 0 ? (
                        <div className="flex-1 flex flex-col items-center justify-center text-slate-400 p-10">
                            <FileText className="w-16 h-16 mb-4 opacity-20" />
                            <p>Pilih kegiatan untuk melihat daftar.</p>
                        </div>
                    ) : (
                        <div className="flex-1 overflow-auto p-0">
                            <table className="w-full text-sm text-left">
                                <thead className="bg-slate-50 text-slate-600 font-medium border-b sticky top-0">
                                    <tr>
                                        <th className="px-4 py-3">No</th>
                                        <th className="px-4 py-3">Nama</th>
                                        <th className="px-4 py-3">Peran</th>
                                        <th className="px-4 py-3">No. Sertifikat</th>
                                    </tr>
                                </thead>
                                <tbody className="divide-y divide-slate-100">
                                    {certificates.map((cert, idx) => (
                                        <tr key={cert.id} className="hover:bg-slate-50">
                                            <td className="px-4 py-2 text-slate-400">{idx + 1}</td>
                                            <td className="px-4 py-2 font-medium text-slate-800">{cert.recipientName}</td>
                                            <td className="px-4 py-2 text-slate-600">{cert.recipientRole}</td>
                                            <td className="px-4 py-2 font-mono text-xs text-slate-500">{cert.certificateNumber}</td>
                                        </tr>
                                    ))}
                                </tbody>
                            </table>
                        </div>
                    )}
                </div>
            </div>
        </div>
    </div>
  );
};

export default EventLetterGenerator;