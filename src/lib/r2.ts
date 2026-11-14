import { getCloudflareContext } from "@opennextjs/cloudflare";

export function ambilMedia(): R2Bucket {
  return (getCloudflareContext().env as unknown as { MEDIA: R2Bucket }).MEDIA;
}