import { z } from 'zod';
import { Sector } from '@/@types/enums';
import { MIN_REPORT_CHARS, MAX_REPORT_CHARS } from '@/lib/constants';

export const reportFormSchema = z.object({
  text: z
    .string()
    .min(1, 'A descrição do ocorrido é obrigatória.')
    .min(MIN_REPORT_CHARS, `A descrição deve ter pelo menos ${MIN_REPORT_CHARS} caracteres.`)
    .max(MAX_REPORT_CHARS, `A descrição deve ter no máximo ${MAX_REPORT_CHARS} caracteres.`),
  sector: z
    .nativeEnum(Sector)
    .optional(),
});

export type ReportFormValues = z.infer<typeof reportFormSchema>;
