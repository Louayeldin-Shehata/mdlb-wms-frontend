import { prisma } from "@/lib/prisma";
import { computeBalanceFromSums } from "@/lib/inventoryMath";

export type VariantBalance = {
  variantId: string;
  onHand: number;
  reserved: number;
  available: number;
};

export async function getVariantBalance(variantId: string): Promise<VariantBalance> {
  const grouped = await prisma.inventoryLedgerEntry.groupBy({
    by: ["type"],
    where: { variantId },
    _sum: { quantity: true },
  });

  const sums: Record<string, number> = {};
  for (const g of grouped) sums[g.type] = g._sum.quantity ?? 0;

  const { onHand, reserved, available } = computeBalanceFromSums(sums);
  return { variantId, onHand, reserved, available };
}

