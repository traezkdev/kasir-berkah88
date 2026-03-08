import React, { useState, useEffect } from 'react';
import authFetch from '../../utils/authFetch';
import { toast } from 'react-hot-toast';
import AppIcon from '../../components/AppIcon';

const apiUrl = import.meta.env.VITE_API_URL;

// Teks default yang sama seperti di exportUtils.js
export const AUDIT_PDF_DEFAULTS = {
    company_name: 'KASIR BERKAH 88',
    company_subtitle: 'Sistem Manajemen Keuangan & Point of Sale Terintegrasi',
    company_tagline: 'Laporan Resmi Transparansi Operasional & Integritas Data',
    report_title: 'LAPORAN AUDIT & INTEGRITAS KEUANGAN',
    recipient_label: 'Pimpinan / Owner Kasir Berkah 88',
    opening_salutation: 'Dengan hormat,',
    opening_body: 'Berdasarkan hasil analisis sistem terhadap seluruh data transaksi, pengeluaran, dan pergerakan kas pada periode yang ditentukan, berikut adalah rincian konsolidasi keuangan:',
    closing_body: 'Demikian laporan audit ini disampaikan sebagai rujukan utama dalam pengambilan keputusan manajemen dan audit operasional berkala.',
    issuer_label: 'Diterbitkan Secara Otomatis oleh,',
    issuer_name: 'Sistem Audit Kasir Berkah 88',
    signer_title: 'Admin & Tim Keuangan',
    signature_note: '(Dicetak melalui modul Auditor - Digital Signature Verified)',
};

const FIELD_LABELS = {
    company_name: { label: 'Nama Perusahaan / Toko', hint: 'Terlihat di bagian kop surat (heading).' },
    company_subtitle: { label: 'Sub-judul Perusahaan', hint: 'Baris pertama keterangan di bawah nama perusahaan.' },
    company_tagline: { label: 'Tagline Perusahaan', hint: 'Baris kedua keterangan di bawah nama perusahaan.' },
    report_title: { label: 'Judul Laporan', hint: 'Judul utama dokumen, tampil sebagai heading tengah.' },
    recipient_label: { label: 'Penerima Surat', hint: 'Nama jabatan penerima (setelah "Kepada Yth,").' },
    opening_salutation: { label: 'Salam Pembuka', hint: 'Misal: "Dengan hormat,".' },
    opening_body: { label: 'Paragraf Pembuka', hint: 'Kalimat pengantar sebelum tabel data audit.', multiline: true },
    closing_body: { label: 'Paragraf Penutup', hint: 'Kalimat penutup setelah tabel dan kesimpulan.', multiline: true },
    issuer_label: { label: 'Label Penerbit', hint: 'Misal: "Diterbitkan Secara Otomatis oleh,".' },
    issuer_name: { label: 'Nama Penerbit / Sistem', hint: 'Nama sistem atau departemen yang menerbitkan.' },
    signer_title: { label: 'Jabatan Penandatangan', hint: 'Nama jabatan di atas garis tanda tangan.' },
    signature_note: { label: 'Catatan Tanda Tangan', hint: 'Teks kecil di bawah garis tanda tangan.', multiline: true },
};

export default function AuditPdfTemplateModal({ isOpen, onClose }) {
    const [template, setTemplate] = useState({ ...AUDIT_PDF_DEFAULTS });
    const [isSaving, setIsSaving] = useState(false);
    const [isLoadingSettings, setIsLoadingSettings] = useState(false);

    useEffect(() => {
        if (isOpen) {
            loadTemplate();
        }
    }, [isOpen]);

    const loadTemplate = async () => {
        setIsLoadingSettings(true);
        try {
            const res = await authFetch(`${apiUrl}/api/all-settings`);
            const data = await res.json();
            if (res.ok && data.data) {
                const saved = {};
                Object.keys(AUDIT_PDF_DEFAULTS).forEach(key => {
                    const settingKey = `audit_pdf_${key}`;
                    saved[key] = data.data[settingKey] || AUDIT_PDF_DEFAULTS[key];
                });
                setTemplate(saved);
            }
        } catch (err) {
            console.error('Gagal memuat template:', err);
        } finally {
            setIsLoadingSettings(false);
        }
    };

    const handleChange = (key, value) => {
        setTemplate(prev => ({ ...prev, [key]: value }));
    };

    const handleReset = (key) => {
        setTemplate(prev => ({ ...prev, [key]: AUDIT_PDF_DEFAULTS[key] }));
    };

    const handleResetAll = () => {
        setTemplate({ ...AUDIT_PDF_DEFAULTS });
        toast.success('Semua field dikembalikan ke default');
    };

    const handleSave = async () => {
        setIsSaving(true);
        try {
            const settingsToSave = {};
            Object.keys(template).forEach(key => {
                settingsToSave[`audit_pdf_${key}`] = template[key];
            });

            const res = await authFetch(`${apiUrl}/api/settings`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(settingsToSave),
            });

            if (res.ok) {
                toast.success('Template PDF berhasil disimpan!');
                onClose();
            } else {
                const err = await res.json();
                toast.error(err.error || 'Gagal menyimpan template');
            }
        } catch (err) {
            toast.error('Kesalahan jaringan');
        } finally {
            setIsSaving(false);
        }
    };

    if (!isOpen) return null;

    return (
        <div
            className="fixed inset-0 bg-black/60 backdrop-blur-md flex items-end sm:items-center justify-center z-[2000] p-0 sm:p-4"
            onClick={onClose}
        >
            <div
                className="bg-white dark:bg-slate-900 rounded-t-3xl sm:rounded-3xl shadow-2xl w-full max-w-2xl max-h-[95vh] sm:max-h-[90vh] flex flex-col"
                onClick={e => e.stopPropagation()}
            >
                {/* Drag Handle */}
                <div className="w-12 h-1.5 bg-gray-300 dark:bg-gray-600 rounded-full mx-auto my-3 sm:hidden" />

                {/* Header */}
                <div className="flex items-center justify-between px-6 py-4 border-b border-gray-100 dark:border-slate-800 shrink-0">
                    <div className="flex items-center gap-3">
                        <div className="w-10 h-10 rounded-2xl bg-rose-50 dark:bg-rose-500/10 flex items-center justify-center text-rose-500">
                            <AppIcon name="FileText" size={20} />
                        </div>
                        <div>
                            <h3 className="text-base font-black text-gray-900 dark:text-white uppercase tracking-tight">Kelola Template PDF Audit</h3>
                            <p className="text-[10px] font-bold text-gray-400 dark:text-slate-500 uppercase tracking-widest">Kustomisasi teks pada laporan resmi</p>
                        </div>
                    </div>
                    <button
                        onClick={onClose}
                        className="w-9 h-9 rounded-full flex items-center justify-center hover:bg-gray-100 dark:hover:bg-slate-800 transition-colors text-gray-500"
                    >
                        <AppIcon name="X" size={18} />
                    </button>
                </div>

                {/* Body */}
                <div className="overflow-y-auto flex-1 p-6 space-y-5">
                    {isLoadingSettings ? (
                        <div className="flex flex-col items-center justify-center py-16 gap-3">
                            <AppIcon name="Loader2" size={32} className="animate-spin text-rose-500" />
                            <p className="text-sm font-bold text-gray-400">Memuat template tersimpan...</p>
                        </div>
                    ) : (
                        <>
                            {/* Section Kop Surat */}
                            <div>
                                <p className="text-[10px] font-black text-rose-500 uppercase tracking-[0.2em] mb-3 flex items-center gap-1.5">
                                    <AppIcon name="Building2" size={11} /> Bagian Kop Surat
                                </p>
                                <div className="space-y-3">
                                    {['company_name', 'company_subtitle', 'company_tagline'].map(key => (
                                        <FieldInput
                                            key={key}
                                            fieldKey={key}
                                            value={template[key]}
                                            onChange={handleChange}
                                            onReset={handleReset}
                                            isDefault={template[key] === AUDIT_PDF_DEFAULTS[key]}
                                        />
                                    ))}
                                </div>
                            </div>

                            {/* Section Informasi Laporan */}
                            <div>
                                <p className="text-[10px] font-black text-indigo-500 uppercase tracking-[0.2em] mb-3 flex items-center gap-1.5">
                                    <AppIcon name="FileSignature" size={11} /> Informasi Laporan
                                </p>
                                <div className="space-y-3">
                                    {['report_title', 'recipient_label'].map(key => (
                                        <FieldInput
                                            key={key}
                                            fieldKey={key}
                                            value={template[key]}
                                            onChange={handleChange}
                                            onReset={handleReset}
                                            isDefault={template[key] === AUDIT_PDF_DEFAULTS[key]}
                                        />
                                    ))}
                                </div>
                            </div>

                            {/* Section Isi Surat */}
                            <div>
                                <p className="text-[10px] font-black text-emerald-600 uppercase tracking-[0.2em] mb-3 flex items-center gap-1.5">
                                    <AppIcon name="AlignLeft" size={11} /> Isi Surat
                                </p>
                                <div className="space-y-3">
                                    {['opening_salutation', 'opening_body', 'closing_body'].map(key => (
                                        <FieldInput
                                            key={key}
                                            fieldKey={key}
                                            value={template[key]}
                                            onChange={handleChange}
                                            onReset={handleReset}
                                            isDefault={template[key] === AUDIT_PDF_DEFAULTS[key]}
                                        />
                                    ))}
                                </div>
                            </div>

                            {/* Section Penutup & Tanda Tangan */}
                            <div>
                                <p className="text-[10px] font-black text-amber-600 uppercase tracking-[0.2em] mb-3 flex items-center gap-1.5">
                                    <AppIcon name="PenLine" size={11} /> Penutup & Tanda Tangan
                                </p>
                                <div className="space-y-3">
                                    {['issuer_label', 'issuer_name', 'signer_title', 'signature_note'].map(key => (
                                        <FieldInput
                                            key={key}
                                            fieldKey={key}
                                            value={template[key]}
                                            onChange={handleChange}
                                            onReset={handleReset}
                                            isDefault={template[key] === AUDIT_PDF_DEFAULTS[key]}
                                        />
                                    ))}
                                </div>
                            </div>
                        </>
                    )}
                </div>

                {/* Footer */}
                <div className="shrink-0 px-6 py-4 border-t border-gray-100 dark:border-slate-800 flex items-center justify-between gap-3">
                    <button
                        onClick={handleResetAll}
                        className="text-[10px] font-black text-gray-400 uppercase tracking-widest hover:text-rose-500 transition-colors flex items-center gap-1.5"
                    >
                        <AppIcon name="RotateCcw" size={12} />
                        Reset Semua ke Default
                    </button>
                    <div className="flex items-center gap-2">
                        <button
                            onClick={onClose}
                            className="px-5 py-2.5 rounded-2xl text-xs font-black uppercase tracking-widest text-gray-600 dark:text-slate-300 bg-gray-100 dark:bg-slate-800 hover:bg-gray-200 dark:hover:bg-slate-700 transition-colors"
                        >
                            Batal
                        </button>
                        <button
                            onClick={handleSave}
                            disabled={isSaving}
                            className="px-6 py-2.5 rounded-2xl text-xs font-black uppercase tracking-widest text-white bg-rose-500 hover:bg-rose-600 transition-colors flex items-center gap-2 disabled:opacity-60 disabled:cursor-not-allowed"
                        >
                            {isSaving ? (
                                <AppIcon name="Loader2" size={14} className="animate-spin" />
                            ) : (
                                <AppIcon name="Save" size={14} />
                            )}
                            {isSaving ? 'Menyimpan...' : 'Simpan Template'}
                        </button>
                    </div>
                </div>
            </div>
        </div>
    );
}

function FieldInput({ fieldKey, value, onChange, onReset, isDefault }) {
    const meta = FIELD_LABELS[fieldKey] || { label: fieldKey, hint: '' };
    return (
        <div className="group bg-gray-50 dark:bg-slate-800/50 rounded-2xl p-4 border border-gray-100 dark:border-slate-700 hover:border-rose-200 dark:hover:border-rose-500/30 transition-colors">
            <div className="flex items-center justify-between mb-1.5">
                <label className="text-[10px] font-black text-gray-500 dark:text-slate-400 uppercase tracking-widest">
                    {meta.label}
                </label>
                {!isDefault && (
                    <button
                        onClick={() => onReset(fieldKey)}
                        className="text-[9px] font-black text-rose-400 uppercase tracking-widest hover:text-rose-600 flex items-center gap-1 transition-colors"
                    >
                        <AppIcon name="RotateCcw" size={9} />
                        Reset
                    </button>
                )}
            </div>
            {meta.multiline ? (
                <textarea
                    value={value}
                    onChange={e => onChange(fieldKey, e.target.value)}
                    rows={3}
                    className="w-full bg-white dark:bg-slate-900 text-sm text-gray-800 dark:text-white font-medium rounded-xl px-3 py-2 border border-gray-200 dark:border-slate-700 focus:outline-none focus:ring-2 focus:ring-rose-400 transition-all resize-none"
                />
            ) : (
                <input
                    type="text"
                    value={value}
                    onChange={e => onChange(fieldKey, e.target.value)}
                    className="w-full bg-white dark:bg-slate-900 text-sm text-gray-800 dark:text-white font-medium rounded-xl px-3 py-2.5 border border-gray-200 dark:border-slate-700 focus:outline-none focus:ring-2 focus:ring-rose-400 transition-all"
                />
            )}
            {meta.hint && (
                <p className="text-[9px] font-bold text-gray-400 dark:text-slate-600 uppercase tracking-wide mt-1">{meta.hint}</p>
            )}
        </div>
    );
}
