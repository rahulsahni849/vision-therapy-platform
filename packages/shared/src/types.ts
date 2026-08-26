import { z } from 'zod';

export const ActivityModuleManifest = z.object({
  key: z.string(),
  name: z.string(),
  category: z.string(),
  configSchema: z.record(z.any()),
  version: z.string().default('1.0.0'),
});

export const SessionMetricResult = z.object({
  key: z.string(),
  value: z.number(),
});

export const ActivityModule = z.object({
  manifest: ActivityModuleManifest,
  scoreSession: z.function().args(z.any()).returns(z.array(SessionMetricResult)),
});

export type ActivityModuleType = {
  manifest: {
    key: string;
    name: string;
    category: string;
    configSchema: Record<string, any>;
    version: string;
  };
  scoreSession: (rawResult: unknown) => Array<{ key: string; value: number }>;
};

export const JWT_PAYLOAD = z.object({
  sub: z.string().uuid(),
  email: z.string().email(),
  orgId: z.string().uuid(),
  role: z.enum(['ADMIN', 'PRACTITIONER', 'PATIENT']),
});

export type JWT_PAYLOAD_TYPE = z.infer<typeof JWT_PAYLOAD>;
