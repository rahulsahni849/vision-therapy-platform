import { z } from 'zod';

export const OrganizationSchema = z.object({
  id: z.string().uuid(),
  name: z.string(),
  createdAt: z.string().datetime(),
});

export const CreateOrganizationSchema = z.object({
  name: z.string().min(1, 'Organization name is required'),
});

export const UpdateOrganizationSchema = z.object({
  name: z.string().min(1).optional(),
});

export type Organization = z.infer<typeof OrganizationSchema>;
export type CreateOrganizationInput = z.infer<typeof CreateOrganizationSchema>;
export type UpdateOrganizationInput = z.infer<typeof UpdateOrganizationSchema>;
