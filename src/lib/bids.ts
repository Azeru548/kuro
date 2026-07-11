import { MAX_BIDS_PER_REQUEST, type Bid, type HelperProfile } from "./types";

export function countActiveBids(bids: Bid[], requestId: string) {
  return bids.filter(
    (b) =>
      b.requestId === requestId &&
      (b.status === "pending" || b.status === "accepted")
  ).length;
}

export function getBidForHelper(
  bids: Bid[],
  requestId: string,
  helperId: string
) {
  return bids.find(
    (b) =>
      b.requestId === requestId &&
      b.helperId === helperId &&
      b.status !== "cancelled" &&
      b.status !== "expired"
  );
}

export function canPlaceBid(params: {
  bids: Bid[];
  requestId: string;
  helper: HelperProfile;
  offerPrice: number;
}) {
  const { bids, requestId, helper, offerPrice } = params;
  const existing = getBidForHelper(bids, requestId, helper.id);

  if (existing?.status === "pending" || existing?.status === "accepted") {
    return { ok: false as const, reason: "You already bid on this helper." };
  }

  if (countActiveBids(bids, requestId) >= MAX_BIDS_PER_REQUEST) {
    return {
      ok: false as const,
      reason: `You can bid on at most ${MAX_BIDS_PER_REQUEST} helpers.`,
    };
  }

  if (!helper.available) {
    return { ok: false as const, reason: "This helper is currently unavailable." };
  }

  if (offerPrice < helper.minPrice) {
    return {
      ok: false as const,
      reason: `Offer is below this helper's minimum of ₦${helper.minPrice.toLocaleString()}.`,
    };
  }

  return { ok: true as const };
}
