export function computeBalanceFromSums(sums: Partial<Record<string, number>>) {
  const receive = sums.RECEIVE ?? 0;
  const adjust = sums.ADJUST ?? 0;
  const fulfill = sums.FULFILL ?? 0;
  const reserve = sums.RESERVE ?? 0;
  const release = sums.RELEASE ?? 0;

  const onHand = receive + adjust - fulfill;
  const reserved = reserve - release;
  const available = onHand - reserved;

  return { onHand, reserved, available };
}

