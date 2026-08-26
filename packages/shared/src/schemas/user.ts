import { z } from 'zod';

export const RoleEnum = z.enum(['ADMIN', 'PRACTITIONER', 'PATIENT']);

export const UserProfileSchema = z.object({
  id: z.string().uuid(),
  email: z.string().email(),
  firstName: z.string(),
  lastName: z.string(),
  role: RoleEnum,
  organizationId: z.string().uuid(),
  createdAt: z.string().datetime(),
});

export const UpdateUserProfileSchema = z.object({
  firstName: z.string().min(1).optional(),
  lastName: z.string().min(1).optional(),
});

export const UserListSchema = z.array(UserProfileSchema);

export type UserProfile = z.infer<typeof UserProfileSchema>;
export type Role = z.infer<typeof RoleEnum>;
