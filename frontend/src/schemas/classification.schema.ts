import { z } from 'zod';

export const classificationResponseSchema = z.object({
  report: z.object({
    id: z.string(),
    text: z.string(),
    sector: z.string().optional(),
    createdAt: z.string(),
  }),
  classification: z.object({
    id: z.string(),
    reportId: z.string(),
    category: z.string(),
    riskLevel: z.enum(['Crítico', 'Médio', 'Baixo']),
    confidence: z.number(),
    xaiExplanation: z.string(),
    xaiHighlightedTerms: z.array(z.string()),
    xaiJustification: z.string(),
    createdAt: z.string(),
  }),
});

export const normQueryResponseSchema = z.object({
  normTitle: z.string(),
  normResponse: z.string(),
  sourceExcerpt: z.string(),
  correctiveAction: z.string(),
  foundInKnowledgeBase: z.boolean(),
});
