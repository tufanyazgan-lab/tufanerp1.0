import { z } from "zod";
import { HOME_TYPES, JOB_TYPES, SERVICE_TYPES } from "./domain";

export const wizardItemSchema = z.object({
  name: z.string().min(1),
  qty: z.number().min(0),
  unit: z.string().default("adet"),
  dimensions: z.string().optional(),
  approxWeight: z.number().optional(),
  isCustom: z.boolean().default(false),
  fragile: z.boolean().default(false),
  photoDataUrls: z.array(z.string()).default([]),
});
export type WizardItem = z.infer<typeof wizardItemSchema>;

export const wizardRoomSchema = z.object({
  key: z.string(),
  name: z.string().min(1),
  items: z.array(wizardItemSchema),
});
export type WizardRoom = z.infer<typeof wizardRoomSchema>;

export const wizardAddressSchema = z.object({
  kind: z.enum(["PICKUP", "DROPOFF"]),
  addressText: z.string().min(3, "Adres gerekli"),
  floor: z.number().int().min(-5).max(60).default(0),
  buildingElevator: z.boolean().default(false),
  mobileElevator: z.boolean().default(false),
  truckAccess: z.string().optional(),
});
export type WizardAddress = z.infer<typeof wizardAddressSchema>;

export const leadSubmitSchema = z.object({
  serviceType: z.enum(SERVICE_TYPES),
  jobType: z.enum(JOB_TYPES),
  homeType: z.enum(HOME_TYPES).nullable().optional(),
  rooms: z.array(wizardRoomSchema).default([]),
  extraItems: z.array(wizardItemSchema).default([]),
  cargoItems: z
    .array(wizardItemSchema.extend({ categoryKey: z.string() }))
    .default([]),
  addresses: z.array(wizardAddressSchema).min(1),
  distanceKm: z.number().min(0).default(0),
  estimatedHours: z.number().min(0).default(2),
  outOfCity: z.boolean().default(false),
  facadePhotoDataUrls: z.array(z.string()).default([]),
  needsStaffReview: z.boolean().default(false),
  notes: z.string().optional(),
  customer: z.object({
    name: z.string().min(2, "İsim gerekli"),
    phone: z
      .string()
      .min(10, "Telefon gerekli")
      .regex(/^[+0-9 ()-]+$/, "Geçersiz telefon"),
    email: z.string().email().optional().or(z.literal("")),
  }),
});
export type LeadSubmit = z.infer<typeof leadSubmitSchema>;
