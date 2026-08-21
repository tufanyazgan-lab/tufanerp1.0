"use server";

import { prisma } from "@/lib/db";

export interface TemplateData {
  homeRooms: Record<string, Array<{ key: string; name: string }>>;
  roomItems: Record<string, Array<{ name: string; defaultQty: number; unit: string; approxWeight: number | null }>>;
  extraItems: Array<{ name: string; defaultQty: number; unit: string; approxWeight: number | null }>;
  cargoCategories: Array<{ key: string; name: string }>;
  cargoItems: Record<string, Array<{ name: string; defaultQty: number; unit: string; approxWeight: number | null }>>;
}

export async function getTemplates(): Promise<TemplateData> {
  const [homeTemplates, catalog, categories] = await Promise.all([
    prisma.homeTemplate.findMany({ orderBy: { sortNo: "asc" } }),
    prisma.catalogItem.findMany({ where: { active: true }, orderBy: { sortNo: "asc" } }),
    prisma.cargoCategory.findMany({ where: { active: true }, orderBy: { sortNo: "asc" } }),
  ]);

  const homeRooms: TemplateData["homeRooms"] = {};
  for (const t of homeTemplates) {
    (homeRooms[t.homeType] ??= []).push({ key: t.roomKey, name: t.roomName });
  }

  const roomItems: TemplateData["roomItems"] = {};
  const cargoItems: TemplateData["cargoItems"] = {};
  const extraItems: TemplateData["extraItems"] = [];

  for (const c of catalog) {
    const item = { name: c.name, defaultQty: c.defaultQty, unit: c.unit, approxWeight: c.approxWeight };
    if (c.scope === "ROOM_TEMPLATE") (roomItems[c.groupKey] ??= []).push(item);
    else if (c.scope === "CARGO") (cargoItems[c.groupKey] ??= []).push(item);
    else if (c.scope === "EXTRA") extraItems.push(item);
  }

  return {
    homeRooms,
    roomItems,
    extraItems,
    cargoCategories: categories.map((c) => ({ key: c.key, name: c.name })),
    cargoItems,
  };
}
