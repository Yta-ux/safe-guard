import type { Sector } from './enums';

export interface Report {
  id: string;
  text: string;
  sector?: Sector | string;
  createdAt: string;
}

export interface ReportFormData {
  text: string;
  fullDocumentText?: string;
  sector?: string;
}
