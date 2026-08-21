import { prisma } from "./db";

export async function audit(
  entity: string,
  entityId: string,
  action: string,
  opts: { actor?: string; before?: unknown; after?: unknown } = {}
) {
  await prisma.auditLog.create({
    data: {
      entity,
      entityId,
      action,
      actor: opts.actor,
      before: opts.before === undefined ? null : JSON.stringify(opts.before),
      after: opts.after === undefined ? null : JSON.stringify(opts.after),
    },
  });
}
