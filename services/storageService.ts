import { AppState, CertificateData, CertificateTemplate, SystemConfig } from '../types';

const STORAGE_KEY = 'certitrust_db_v1';

const DEFAULT_CONFIG: SystemConfig = {
  organizationName: 'Politeknik ATI Padang',
  defaultLanguage: 'ID',
  prefixParticipant: 'SRT-PST/{YEAR}/',
  prefixSpeaker: 'SRT-NRS/{YEAR}/',
  prefixInstructor: 'SRT-INS/{YEAR}/',
  emailJsServiceId: '',
  emailJsTemplateId: '',
  emailJsPublicKey: ''
};

const getInitialState = (): AppState => {
  const stored = localStorage.getItem(STORAGE_KEY);
  if (stored) {
    const parsed = JSON.parse(stored);
    return {
        ...parsed,
        config: { ...DEFAULT_CONFIG, ...parsed.config } // Ensure new config keys exist if loading old data
    };
  }
  return {
    templates: [],
    certificates: [],
    config: DEFAULT_CONFIG
  };
};

export const getTemplates = (): CertificateTemplate[] => {
  return getInitialState().templates;
};

export const saveTemplate = (template: CertificateTemplate): void => {
  const state = getInitialState();
  const existingIndex = state.templates.findIndex(t => t.id === template.id);
  
  if (existingIndex >= 0) {
    state.templates[existingIndex] = template;
  } else {
    state.templates.push(template);
  }
  
  localStorage.setItem(STORAGE_KEY, JSON.stringify(state));
};

export const deleteTemplate = (id: string): void => {
  const state = getInitialState();
  state.templates = state.templates.filter(t => t.id !== id);
  localStorage.setItem(STORAGE_KEY, JSON.stringify(state));
};

export const getCertificates = (): CertificateData[] => {
  return getInitialState().certificates;
};

export const saveCertificate = (cert: CertificateData): void => {
  const state = getInitialState();
  const existingIndex = state.certificates.findIndex(c => c.id === cert.id);
  
  if (existingIndex >= 0) {
    state.certificates[existingIndex] = cert;
  } else {
    state.certificates.push(cert);
  }
  
  localStorage.setItem(STORAGE_KEY, JSON.stringify(state));
};

export const bulkSaveCertificates = (certs: CertificateData[]): void => {
  const state = getInitialState();
  // Append new certificates to the existing list
  state.certificates = [...state.certificates, ...certs];
  localStorage.setItem(STORAGE_KEY, JSON.stringify(state));
};

// Update existing certificate data
export const updateCertificate = (updatedCert: CertificateData): void => {
  const state = getInitialState();
  const index = state.certificates.findIndex(c => c.id === updatedCert.id);
  
  if (index !== -1) {
    state.certificates[index] = updatedCert;
    localStorage.setItem(STORAGE_KEY, JSON.stringify(state));
  }
};

export const deleteCertificate = (id: string): void => {
  const state = getInitialState();
  state.certificates = state.certificates.filter(c => c.id !== id);
  localStorage.setItem(STORAGE_KEY, JSON.stringify(state));
};

export const getCertificateById = (id: string): CertificateData | undefined => {
  return getInitialState().certificates.find(c => c.id === id || c.certificateNumber === id);
};

export const getTemplateById = (id: string): CertificateTemplate | undefined => {
  return getInitialState().templates.find(t => t.id === id);
};

export const getUniqueEvents = (): string[] => {
    const certs = getInitialState().certificates;
    const events = new Set(certs.map(c => c.eventName));
    return Array.from(events).filter(Boolean);
};

// --- Configuration Backend Methods ---

export const getSystemConfig = (): SystemConfig => {
  return getInitialState().config || DEFAULT_CONFIG;
};

export const saveSystemConfig = (config: SystemConfig): void => {
  const state = getInitialState();
  state.config = config;
  localStorage.setItem(STORAGE_KEY, JSON.stringify(state));
};

// Dangerous: Clear all data
export const clearAllData = (): void => {
    localStorage.removeItem(STORAGE_KEY);
}