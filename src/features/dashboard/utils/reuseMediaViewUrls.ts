/** Drop signature query params so rotating view URLs compare as the same object. */
export function mediaObjectKey(url: string): string {
  const queryAt = url.indexOf("?");
  return queryAt === -1 ? url : url.slice(0, queryAt);
}

function sameObjectKeys(
  previous: string[] | undefined,
  next: string[] | undefined,
): boolean {
  if (!previous || !next || previous.length !== next.length) {
    return false;
  }
  return previous.every(
    (key, index) => mediaObjectKey(key) === mediaObjectKey(next[index] ?? ""),
  );
}

/**
 * Presigned view URLs rotate on each snapshot poll. Reuse the previous view
 * URLs whenever the underlying object keys are unchanged so Image sources stay
 * stable (passenger shared-request vehicle photos, sea/air attachments).
 */
export function reuseStableViewUrls(
  previousKeys: string[] | undefined,
  previousViews: string[] | undefined,
  nextKeys: string[] | undefined,
  nextViews: string[] | undefined,
): string[] | undefined {
  if (previousViews?.length && sameObjectKeys(previousKeys, nextKeys)) {
    return previousViews;
  }
  return nextViews;
}

type AttachmentPhotosLike = {
  photoUrls: string[];
  photoDisplayUris?: string[];
};

export function reuseAttachmentPhotos<T extends AttachmentPhotosLike>(
  previous: T | null | undefined,
  next: T | null | undefined,
): T | null | undefined {
  if (!next || !previous) {
    return next;
  }
  return {
    ...next,
    photoDisplayUris: reuseStableViewUrls(
      previous.photoUrls,
      previous.photoDisplayUris,
      next.photoUrls,
      next.photoDisplayUris,
    ),
  };
}

type VehiclePhotosLike = {
  photoUrl?: string | null;
  photoViewUrl?: string | null;
  photoUrls?: string[];
  photoDisplayUris?: string[];
};

export function reuseVehicleViewUrls<T extends VehiclePhotosLike>(
  previous: T | null | undefined,
  next: T | null | undefined,
): T | null | undefined {
  if (!next || !previous) {
    return next;
  }
  const photoDisplayUris = reuseStableViewUrls(
    previous.photoUrls,
    previous.photoDisplayUris,
    next.photoUrls,
    next.photoDisplayUris,
  );
  const sameCover =
    previous.photoUrl != null &&
    next.photoUrl != null &&
    mediaObjectKey(previous.photoUrl) === mediaObjectKey(next.photoUrl);
  const photoViewUrl =
    sameCover && previous.photoViewUrl
      ? previous.photoViewUrl
      : next.photoViewUrl;
  return {
    ...next,
    photoDisplayUris,
    photoViewUrl,
  };
}

type OfferMediaLike = {
  id: string;
  photos?: AttachmentPhotosLike | null;
  vehicle?: VehiclePhotosLike | null;
};

export function reuseOfferSummaries<T extends OfferMediaLike>(
  previous: T[] | undefined,
  next: T[],
): T[] {
  if (!previous?.length) {
    return next;
  }
  const previousById = new Map(previous.map((offer) => [offer.id, offer]));
  return next.map((offer) => {
    const prior = previousById.get(offer.id);
    if (!prior) {
      return offer;
    }
    return {
      ...offer,
      photos: reuseAttachmentPhotos(prior.photos, offer.photos),
      vehicle: reuseVehicleViewUrls(prior.vehicle, offer.vehicle),
    };
  });
}
