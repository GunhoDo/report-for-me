/**
 * PRD F3 Structured Report – Executive Summary, Source-wise, Action Item
 */
export interface ExecutiveSummary {
  bullets: string[]; // 3줄 이내
}

export interface SourceAnalysis {
  sourceId: string;
  url: string;
  content: string;
  citation?: string;
}

export interface ActionItem {
  text: string;
  perspective?: string;
}

export interface ReportStructure {
  executiveSummary: ExecutiveSummary;
  sourceAnalyses: SourceAnalysis[];
  actionItem: ActionItem;
}
