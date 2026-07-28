import type { RiskLevel } from './enums';
import type { Report } from './report.types';

export interface ClassificationResult {
  id: string;
  reportId: string;
  category: string;
  riskLevel: RiskLevel;
  confidence: number;
  xaiExplanation: string;
  xaiHighlightedTerms: string[];
  xaiJustification: string;
  isManualOverride?: boolean;
  correctionReason?: string;
  createdAt: string;
}

export interface ReportWithClassification extends Report {
  classification: ClassificationResult;
}

export interface NormQueryResult {
  normTitle: string;
  normResponse: string;
  sourceExcerpt: string;
  correctiveAction: string;
  foundInKnowledgeBase: boolean;
}

export interface ClassifyReportResponse {
  report: Report;
  classification: ClassificationResult;
}
