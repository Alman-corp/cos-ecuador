import type {
  ContractTemplate,
  ContractDocument,
  ContractVersion,
  ContractParty,
  ContractStatus,
  ContractDiff,
  DiffChange,
  ClauseAnalysis,
  DocumentTemplate,
} from './contract-types';

import { getTemplate, renderTemplate, getAllTemplates, getTemplatesByCategory, computeFiniquitoTotal } from './template-engine';
import { analyzeClause, analyzeDocument, getClausesByCategory, getRecommendations, getHighRiskClauses, getComplianceSummary } from './clause-library';

const STORAGE_KEY = 'motor-legal-contracts';

function generateId(): string {
  return `contract-${Date.now()}-${Math.random().toString(36).substring(2, 9)}`;
}

function now(): string {
  return new Date().toISOString();
}

function loadContracts(): ContractDocument[] {
  try {
    if (typeof localStorage === 'undefined') return [];
    const data = localStorage.getItem(STORAGE_KEY);
    if (!data) return [];
    return JSON.parse(data);
  } catch {
    return [];
  }
}

function saveContracts(contracts: ContractDocument[]): void {
  try {
    if (typeof localStorage === 'undefined') return;
    localStorage.setItem(STORAGE_KEY, JSON.stringify(contracts));
  } catch (e) {
    console.error('Failed to save contracts to localStorage:', e);
  }
}

function getNextVersion(versions: ContractVersion[]): number {
  if (versions.length === 0) return 1;
  return Math.max(...versions.map(v => v.version)) + 1;
}

export function createContract(
  templateId: DocumentTemplate,
  variables: Record<string, string>,
  parties: ContractParty[],
  sections?: { include?: string[]; exclude?: string[] },
  notes?: string,
): ContractDocument {
  const template = getTemplate(templateId);
  const rendered = renderTemplate(templateId, variables, sections?.include, sections?.exclude);
  const version = 1;
  const timestamp = now();

  const contract: ContractDocument = {
    id: generateId(),
    templateId,
    title: rendered.title,
    content: rendered.content,
    variables,
    status: 'draft',
    version,
    versions: [
      {
        version,
        content: rendered.content,
        changedBy: 'system',
        changedAt: timestamp,
        changeDescription: 'Versión inicial del contrato',
      },
    ],
    parties,
    tags: template.tags.slice(),
    notes: notes || '',
    createdAt: timestamp,
    updatedAt: timestamp,
  };

  const contracts = loadContracts();
  contracts.push(contract);
  saveContracts(contracts);

  return contract;
}

export function updateContract(
  contractId: string,
  updates: {
    variables?: Record<string, string>;
    sections?: { include?: string[]; exclude?: string[] };
    status?: ContractStatus;
    parties?: ContractParty[];
    notes?: string;
    tags?: string[];
    changedBy?: string;
    changeDescription?: string;
  },
): ContractDocument | null {
  const contracts = loadContracts();
  const index = contracts.findIndex(c => c.id === contractId);
  if (index === -1) {
    console.error(`Contract ${contractId} not found`);
    return null;
  }

  const contract = contracts[index];
  const newVersion = getNextVersion(contract.versions);
  const timestamp = now();

  if (updates.variables) {
    contract.variables = { ...contract.variables, ...updates.variables };
  }

  if (updates.status) {
    contract.status = updates.status;
    if (updates.status === 'signed') {
      contract.signedAt = timestamp;
    }
  }

  if (updates.parties) {
    contract.parties = updates.parties;
  }

  if (updates.notes !== undefined) {
    contract.notes = updates.notes;
  }

  if (updates.tags) {
    contract.tags = updates.tags;
  }

  const template = getTemplate(contract.templateId as DocumentTemplate);
  const rendered = renderTemplate(
    contract.templateId as DocumentTemplate,
    contract.variables,
    updates.sections?.include,
    updates.sections?.exclude,
  );
  contract.content = rendered.content;
  contract.title = rendered.title;
  contract.version = newVersion;
  contract.versions.push({
    version: newVersion,
    content: rendered.content,
    changedBy: updates.changedBy || 'system',
    changedAt: timestamp,
    changeDescription: updates.changeDescription || `Actualización a versión ${newVersion}`,
  });
  contract.updatedAt = timestamp;

  contracts[index] = contract;
  saveContracts(contracts);

  return contract;
}

export function getContract(contractId: string): ContractDocument | null {
  const contracts = loadContracts();
  return contracts.find(c => c.id === contractId) || null;
}

export function getAllContracts(): ContractDocument[] {
  return loadContracts();
}

export function deleteContract(contractId: string): boolean {
  const contracts = loadContracts();
  const filtered = contracts.filter(c => c.id !== contractId);
  if (filtered.length === contracts.length) return false;
  saveContracts(filtered);
  return true;
}

export function changeContractStatus(contractId: string, newStatus: ContractStatus, changedBy?: string): ContractDocument | null {
  return updateContract(contractId, { status: newStatus, changedBy, changeDescription: `Cambio de estado a: ${newStatus}` });
}

export function signContract(contractId: string, signedBy?: string): ContractDocument | null {
  const result = changeContractStatus(contractId, 'signed', signedBy || 'system');
  return result;
}

export function generateContract(templateId: DocumentTemplate, variables: Record<string, string>): string {
  const rendered = renderTemplate(templateId, variables);
  return rendered.content;
}

export function getContractDiff(contractId: string, fromVersion?: number, toVersion?: number): ContractDiff | null {
  const contract = getContract(contractId);
  if (!contract || contract.versions.length < 2) return null;

  const sortedVersions = [...contract.versions].sort((a, b) => b.version - a.version);

  const oldV = fromVersion !== undefined
    ? sortedVersions.find(v => v.version === fromVersion)
    : sortedVersions[sortedVersions.length - 1];

  const newV = toVersion !== undefined
    ? sortedVersions.find(v => v.version === toVersion)
    : sortedVersions[0];

  if (!oldV || !newV || oldV.version >= newV.version) return null;

  const changes: DiffChange[] = [];
  const oldLines = oldV.content.split('\n');
  const newLines = newV.content.split('\n');
  const maxLines = Math.max(oldLines.length, newLines.length);

  for (let i = 0; i < maxLines; i++) {
    if (i >= oldLines.length) {
      if (newLines[i].trim()) {
        changes.push({
          type: 'addition',
          section: detectSection(newLines, i),
          newText: newLines[i],
          line: i + 1,
        });
      }
    } else if (i >= newLines.length) {
      if (oldLines[i].trim()) {
        changes.push({
          type: 'deletion',
          section: detectSection(oldLines, i),
          oldText: oldLines[i],
          line: i + 1,
        });
      }
    } else if (oldLines[i] !== newLines[i]) {
      if (oldLines[i].trim() || newLines[i].trim()) {
        changes.push({
          type: 'modification',
          section: detectSection(newLines, i),
          oldText: oldLines[i],
          newText: newLines[i],
          line: i + 1,
        });
      }
    }
  }

  return {
    oldVersion: oldV.version,
    newVersion: newV.version,
    changes,
  };
}

function detectSection(lines: string[], lineIndex: number): string {
  for (let i = lineIndex; i >= 0 && i < lines.length; i--) {
    const trimmed = lines[i].trim();
    if (trimmed && !trimmed.startsWith('=') && !trimmed.startsWith('-')) {
      const sectionMatch = trimmed.match(/^((?:CLÁUSULA|CLAUSULA|ARTÍCULO|ARTICULO|PRIMERA|SEGUNDA|TERCERA|CUARTA|QUINTA|SEXTA|SÉPTIMA|SEPTIMA|OCTAVA|NOVENA|DÉCIMA|DECIMA|UNDÉCIMA|UNDECIMA).*)/i);
      if (sectionMatch) return sectionMatch[1];
    }
  }
  return 'general';
}

export function getTemplates(): ContractTemplate[] {
  return getAllTemplates();
}

export function getTemplateById(id: DocumentTemplate): ContractTemplate {
  return getTemplate(id);
}

export function searchTemplates(query: string): ContractTemplate[] {
  const lower = query.toLowerCase();
  return getAllTemplates().filter(t =>
    t.name.toLowerCase().includes(lower) ||
    t.description.toLowerCase().includes(lower) ||
    t.tags.some(tag => tag.toLowerCase().includes(lower)) ||
    t.category.toLowerCase().includes(lower),
  );
}

export function analyzeContractClauses(contractId: string): ClauseAnalysis[] {
  const contract = getContract(contractId);
  if (!contract) {
    throw new Error(`Contract ${contractId} not found`);
  }
  return analyzeDocument(contract);
}

export function analyzeText(text: string): ClauseAnalysis {
  return analyzeClause(text);
}

export function getClauseCategory(category: string) {
  return getClausesByCategory(category as any);
}

export function getDocumentRecommendations(analyses: ClauseAnalysis[]): string[] {
  return getRecommendations(analyses);
}

export function exportToMarkdown(contractId: string): string | null {
  const contract = getContract(contractId);
  if (!contract) return null;

  const lines: string[] = [];
  lines.push(`# ${contract.title}`);
  lines.push('');
  lines.push(`**ID:** ${contract.id}`);
  lines.push(`**Estado:** ${contract.status}`);
  lines.push(`**Versión:** ${contract.version}`);
  lines.push(`**Creado:** ${contract.createdAt}`);
  lines.push(`**Actualizado:** ${contract.updatedAt}`);
  if (contract.signedAt) lines.push(`**Firmado:** ${contract.signedAt}`);
  if (contract.validFrom) lines.push(`**Válido desde:** ${contract.validFrom}`);
  if (contract.validUntil) lines.push(`**Válido hasta:** ${contract.validUntil}`);
  lines.push('');

  lines.push('## Partes');
  lines.push('| Nombre | Rol | Documento |');
  lines.push('|--------|-----|-----------|');
  for (const party of contract.parties) {
    lines.push(`| ${party.name} | ${party.role} | ${party.documentType}: ${party.documentNumber} |`);
  }
  lines.push('');

  lines.push('## Variables utilizadas');
  lines.push('| Variable | Valor |');
  lines.push('|----------|-------|');
  for (const [key, val] of Object.entries(contract.variables)) {
    lines.push(`| ${key} | ${val} |`);
  }
  lines.push('');

  lines.push('## Contenido');
  lines.push('');
  lines.push(contract.content);
  lines.push('');

  lines.push('## Historial de versiones');
  lines.push('| Versión | Fecha | Cambios |');
  lines.push('|---------|-------|---------|');
  for (const v of [...contract.versions].sort((a, b) => b.version - a.version)) {
    lines.push(`| ${v.version} | ${v.changedAt} | ${v.changeDescription} |`);
  }
  lines.push('');

  if (contract.notes) {
    lines.push('## Notas');
    lines.push(contract.notes);
    lines.push('');
  }

  return lines.join('\n');
}

export function getContractMetadata(contractId: string): Record<string, any> | null {
  const contract = getContract(contractId);
  if (!contract) return null;

  return {
    title: contract.title,
    templateId: contract.templateId,
    status: contract.status,
    version: contract.version,
    totalVersions: contract.versions.length,
    parties: contract.parties.map(p => ({ name: p.name, role: p.role })),
    tags: contract.tags,
    createdAt: contract.createdAt,
    updatedAt: contract.updatedAt,
    signedAt: contract.signedAt || null,
    charCount: contract.content.length,
    wordCount: contract.content.split(/\s+/).filter(w => w.length > 0).length,
    variableCount: Object.keys(contract.variables).length,
  };
}

export function simulateSignature(contractId: string, partyName: string, documentNumber: string): { success: boolean; message: string; signedAt: string } {
  const contract = getContract(contractId);
  if (!contract) {
    return { success: false, message: `Contrato ${contractId} no encontrado`, signedAt: '' };
  }

  const party = contract.parties.find(p => p.name === partyName && p.documentNumber === documentNumber);
  if (!party) {
    return {
      success: false,
      message: `Parte "${partyName}" con documento ${documentNumber} no encontrada en el contrato`,
      signedAt: '',
    };
  }

  const timestamp = now();
  const updated = changeContractStatus(contractId, 'signed', partyName);
  if (updated) {
    return {
      success: true,
      message: `Contrato firmado electrónicamente por ${partyName}`,
      signedAt: timestamp,
    };
  }

  return { success: false, message: 'Error al firmar el contrato', signedAt: '' };
}

export function createFiniquito(
  variables: Record<string, string>,
  parties: ContractParty[],
  notes?: string,
): ContractDocument {
  const total = computeFiniquitoTotal(variables);
  const enhancedVars = {
    ...variables,
    decimo_tercero_decimo_cuarto_sum: String(total),
    total_liquidacion: String(total),
  };
  return createContract('finiquito', enhancedVars, parties, undefined, notes);
}

export function duplicateContract(contractId: string): ContractDocument | null {
  const original = getContract(contractId);
  if (!original) return null;

  const newContract: ContractDocument = {
    ...JSON.parse(JSON.stringify(original)),
    id: generateId(),
    status: 'draft',
    version: 1,
    versions: [{
      version: 1,
      content: original.content,
      changedBy: 'system',
      changedAt: now(),
      changeDescription: `Duplicado del contrato ${original.id}`,
    }],
    createdAt: now(),
    updatedAt: now(),
    signedAt: undefined,
  };

  const contracts = loadContracts();
  contracts.push(newContract);
  saveContracts(contracts);

  return newContract;
}

export function searchContracts(query: string): ContractDocument[] {
  const lower = query.toLowerCase();
  return loadContracts().filter(c =>
    c.title.toLowerCase().includes(lower) ||
    c.id.toLowerCase().includes(lower) ||
    c.tags.some(t => t.toLowerCase().includes(lower)) ||
    c.parties.some(p => p.name.toLowerCase().includes(lower) || p.documentNumber.includes(lower)) ||
    c.notes.toLowerCase().includes(lower),
  );
}

export function getContractsByStatus(status: ContractStatus): ContractDocument[] {
  return loadContracts().filter(c => c.status === status);
}

export function getContractsByParty(documentNumber: string): ContractDocument[] {
  return loadContracts().filter(c => c.parties.some(p => p.documentNumber === documentNumber));
}

export {
  analyzeClause,
  analyzeDocument,
  getRecommendations,
  getHighRiskClauses,
  getComplianceSummary,
  computeFiniquitoTotal,
  renderTemplate,
};
