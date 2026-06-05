import { handleUpload, type HandleUploadBody } from "@vercel/blob/client";
import type { VercelRequest, VercelResponse } from "@vercel/node";

/**
 * Serverless endpoint that authorizes client-side uploads to Vercel Blob.
 *
 * The browser never sees BLOB_READ_WRITE_TOKEN — it only asks this function
 * for a short-lived upload token (onBeforeGenerateToken) and then streams the
 * file straight to Blob storage. This keeps the RW token server-side only.
 */
export default async function handler(req: VercelRequest, res: VercelResponse) {
  if (req.method !== "POST") {
    return res.status(405).json({ error: "Method not allowed" });
  }

  const body = req.body as HandleUploadBody;

  try {
    const jsonResponse = await handleUpload({
      body,
      request: req,
      // Reads process.env.BLOB_READ_WRITE_TOKEN automatically.
      onBeforeGenerateToken: async (_pathname) => {
        return {
          allowedContentTypes: [
            "image/jpeg",
            "image/png",
            "image/webp",
            "image/gif",
            "image/avif",
            "image/svg+xml",
          ],
          addRandomSuffix: true,
          maximumSizeInBytes: 10 * 1024 * 1024, // 10 MB
        };
      },
      // Runs server-side after the upload finishes. No-op for now.
      onUploadCompleted: async () => {},
    });

    return res.status(200).json(jsonResponse);
  } catch (error) {
    return res.status(400).json({ error: (error as Error).message });
  }
}
