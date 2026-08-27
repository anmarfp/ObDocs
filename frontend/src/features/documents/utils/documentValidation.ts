import { z } from 'zod';
import { NotificationMode } from '../types/document.types';

export interface DocumentFormValues {
  title: string;
  categoryId: string;
  issuingBody?: string | null;
  issueDate: string;
  expirationDate?: string | null;
  alertLeadDays?: number;
  responsibleName?: string | null;
  responsibleEmail?: string | null;
  notes?: string | null;
  isRenewalInProgress?: boolean;
}

export const createDocumentFormSchema = (notificationMode: NotificationMode = 'ALL_ADMINS') => {
  return z.object({
    title: z
      .string()
      .trim()
      .min(1, 'O título do documento é obrigatório.')
      .max(200, 'O título pode ter no máximo 200 caracteres.'),
    categoryId: z
      .string()
      .min(1, 'Selecione uma categoria para o documento.'),
    issuingBody: z
      .string()
      .max(150, 'O órgão emissor pode ter no máximo 150 caracteres.')
      .optional()
      .nullable(),
    issueDate: z
      .string()
      .min(1, 'A data de emissão é obrigatória.')
      .refine((val) => !isNaN(Date.parse(val)), {
        message: 'Data de emissão inválida.',
      }),
    expirationDate: z
      .string()
      .optional()
      .nullable()
      .refine((val) => !val || val === '' || !isNaN(Date.parse(val)), {
        message: 'Data de vencimento inválida.',
      }),
    alertLeadDays: z
      .number()
      .int('A antecedência deve ser um número inteiro.')
      .min(1, 'A antecedência mínima é de 1 dia.')
      .optional(),
    responsibleName:
      notificationMode === 'ONLY_RESPONSIBLE'
        ? z
            .string()
            .trim()
            .min(1, 'O nome do responsável é obrigatório.')
            .max(150, 'Nome do responsável pode ter no máximo 150 caracteres.')
        : z
            .string()
            .max(150, 'Nome do responsável pode ter no máximo 150 caracteres.')
            .optional()
            .nullable(),
    responsibleEmail:
      notificationMode === 'ONLY_RESPONSIBLE'
        ? z
            .string()
            .trim()
            .min(1, 'O e-mail do responsável é obrigatório.')
            .email('E-mail do responsável em formato inválido.')
        : z
            .string()
            .optional()
            .nullable()
            .refine((val) => !val || val === '' || /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(val), {
              message: 'E-mail do responsável em formato inválido.',
            }),
    notes: z.string().optional().nullable(),
    isRenewalInProgress: z.boolean().optional(),
  });
};

export const renewFormSchema = z.object({
  issueDate: z
    .string()
    .min(1, 'A nova data de emissão é obrigatória.')
    .refine((val) => !isNaN(Date.parse(val)), {
      message: 'Data de emissão inválida.',
    }),
  expirationDate: z
    .string()
    .optional()
    .nullable()
    .refine((val) => !val || val === '' || !isNaN(Date.parse(val)), {
      message: 'Data de vencimento inválida.',
    }),
  notes: z.string().optional().nullable(),
});

export interface RenewFormValues {
  issueDate: string;
  expirationDate?: string | null;
  notes?: string | null;
}
