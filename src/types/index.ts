// Database types
export interface DatabaseColumn {
  name: string;
  index: number;
  dataType: 'string' | 'number' | 'date' | 'boolean';
  sampleValues: (string | number | boolean | null)[];
}

export interface Database {
  id: string;
  name: string;
  type: 'index' | 'target';
  columns: DatabaseColumn[];
  data: Record<string, any>[];
  headerRow: number;
  uploadDate: Date;
}

// Patient selection types
export interface FilterCondition {
  id: string;
  column: string;
  operator: 'equals' | 'notEquals' | 'contains' | 'greaterThan' | 'lessThan' | 'between' | 'in';
  value: any;
  logic?: 'AND' | 'OR';
}

export interface PatientSelection {
  method: 'filter' | 'idList' | 'nameList' | 'manual';
  filters?: FilterCondition[];
  idList?: string[];
  nameList?: string[];
  selectedRows?: number[];
}

// Column matching types
export interface ColumnMatch {
  sourceColumn: string;
  targetColumn: string;
  confidence: number;
  method: 'exact' | 'common' | 'llm' | 'manual';
  verified: boolean;
}

export interface ColumnMatchingResult {
  matches: ColumnMatch[];
  unmatchedSource: string[];
  unmatchedTarget: string[];
}

// Project types
export interface Project {
  id: string;
  name: string;
  description?: string;
  indexDatabase?: Database;
  targetDatabase?: Database;
  patientSelection?: PatientSelection;
  columnMatching?: ColumnMatchingResult;
  aiMatchUsageCount?: number; // Track number of AI column matching uses
  createdAt: Date;
  updatedAt: Date;
  status: 'draft' | 'in-progress' | 'completed';
}

// LLM types
export interface LLMColumnMatchRequest {
  sourceColumns: string[];
  targetColumns: string[];
  context?: string;
}

export interface LLMColumnMatchResponse {
  matches: Array<{
    source: string;
    target: string;
    confidence: number;
    reasoning: string;
  }>;
}

// Export types
export interface ExportOptions {
  format: 'xlsx' | 'csv';
  includeHeaders: boolean;
  preserveFormatting: boolean;
}

// Error types
export interface AppError {
  code: string;
  message: string;
  details?: any;
}
