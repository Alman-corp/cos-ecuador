// Types for contracts, templates, clauses, and analysis

export interface ContractTemplate {
  id: string;
  name: string;
  description: string;
  category: ContractCategory;
  jurisdiction: 'EC' | 'US' | 'MX' | 'CO' | 'OTHER';
  language: 'es' | 'en';
  version: string;
  tags: string[];
  variables: TemplateVariable[];
  sections: TemplateSection[];
  createdAt: string;
  updatedAt: string;
}

export type ContractCategory =
  | 'commercial' | 'labor' | 'corporate' | 'civil'
  | 'confidentiality' | 'services' | 'rental' | 'sale'
  | 'partnership' | 'consulting' | 'supplier' | 'other';

export interface TemplateVariable {
  id: string;
  name: string;
  label: string;
  type: 'string' | 'number' | 'date' | 'boolean' | 'select' | 'money';
  required: boolean;
  defaultValue?: string;
  options?: string[];
  placeholder?: string;
  validation?: RegExp;
  helpText?: string;
}

export interface TemplateSection {
  id: string;
  title: string;
  content: string; // with {{variable}} placeholders
  optional: boolean;
  order: number;
  clauses?: string[];
}

export interface ContractDocument {
  id: string;
  templateId: string;
  title: string;
  content: string;
  variables: Record<string, string>;
  status: ContractStatus;
  version: number;
  versions: ContractVersion[];
  parties: ContractParty[];
  signedAt?: string;
  validFrom?: string;
  validUntil?: string;
  tags: string[];
  notes: string;
  createdAt: string;
  updatedAt: string;
}

export type ContractStatus = 'draft' | 'review' | 'approved' | 'signed' | 'expired' | 'cancelled';

export interface ContractVersion {
  version: number;
  content: string;
  changedBy: string;
  changedAt: string;
  changeDescription: string;
}

export interface ContractParty {
  name: string;
  role: 'issuer' | 'recipient' | 'guarantor';
  documentType: 'ruc' | 'cedula' | 'passport';
  documentNumber: string;
  legalRepresentative?: string;
  address?: string;
  email?: string;
}

export interface ClauseAnalysis {
  clauseId: string;
  clauseText: string;
  category: ClauseCategory;
  risk: 'low' | 'medium' | 'high';
  recommendations: string[];
  compliance: ClauseCompliance[];
}

export type ClauseCategory =
  | 'termination' | 'confidentiality' | 'liability' | 'payment'
  | 'penalty' | 'jurisdiction' | 'force_majeure' | 'non_compete'
  | 'intellectual_property' | 'warranty' | 'indemnity' | 'other';

export interface ClauseCompliance {
  regulation: string;
  compliant: boolean;
  description: string;
  recommendation?: string;
}

export interface ContractDiff {
  oldVersion: number;
  newVersion: number;
  changes: DiffChange[];
}

export interface DiffChange {
  type: 'addition' | 'deletion' | 'modification';
  section: string;
  oldText?: string;
  newText?: string;
  line: number;
}

export type DocumentTemplate =
  | 'contrato-servicios-profesionales'
  | 'contrato-confidencialidad-nda'
  | 'contrato-arrendamiento'
  | 'contrato-compraventa'
  | 'contrato-laboral'
  | 'contrato-plazo-fijo'
  | 'acta-constitucion'
  | 'poder-general'
  | 'contrato-prestamo'
  | 'contrato-sociedad'
  | 'contrato-consultoria'
  | 'contrato-proveedor'
  | 'carta-compromiso'
  | 'finiquito'
  | 'cesion-derechos'
  | 'contrato-franquicia';
