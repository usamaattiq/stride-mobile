import {
  isRemoteMediaUrl,
  uploadLocalFileToPresignedUrl,
} from "@/shared/services/mediaUploadService";

/**
 * Uploads photos a responder attached while offering on a sea/air request and
 * returns the stable URLs to persist with the offer or bid.
 */
export async function uploadOfferPhotos(
  photoUris: string[],
  uploadFailedMessage: string,
): Promise<string[]> {
  const urls: string[] = [];
  for (const uri of photoUris.filter((item) => item.length > 0)) {
    if (isRemoteMediaUrl(uri)) {
      urls.push(uri);
      continue;
    }
    try {
      const uploaded = await uploadLocalFileToPresignedUrl(uri, {
        purpose: "offer_attachment",
      });
      urls.push(uploaded.fileUrl);
    } catch {
      throw new Error(uploadFailedMessage);
    }
  }
  return urls;
}
