export enum Language {
  EN = 'EN',
  ID = 'ID'
}

export type FieldType = 'text' | 'date' | 'qr';

export interface TemplateField {
  id: string;
  type: FieldType;
  label: string; // e.g., "Recipient Name"
  key: string; // e.g., "recipientName"
  x: number; // Percentage 0-100
  y: number; // Percentage 0-100
  fontSize: number;
  fontFamily: string;
  color: string;
  align: 'left' | 'center' | 'right';
  fontWeight: 'normal' | 'bold';
}

export interface CertificateTemplate {
  id: string;
  name: string;
  backgroundImage: string; // Base64
  width: number;
  height: number;
  fields: TemplateField[];
  createdAt: number;
}

export interface CertificateData {
  id: string;
  templateId: string;
  certificateNumber: string;
  recipientName: string;
  recipientEmail?: string; // New field for Email
  recipientRole?: string;
  eventName: string;
  issueDate: string;
  customText?: string; 
  language: 'EN' | 'ID';
  status: 'draft' | 'published';
  emailSent?: boolean; // Track if email was clicked
}

export interface SystemConfig {
  organizationName: string;
  defaultLanguage: 'EN' | 'ID';
  prefixParticipant: string;
  prefixSpeaker: string;
  prefixInstructor: string;
  // EmailJS Configuration
  emailJsServiceId?: string;
  emailJsTemplateId?: string;
  emailJsPublicKey?: string;
}

export interface AppState {
  templates: CertificateTemplate[];
  certificates: CertificateData[];
  config?: SystemConfig;
}