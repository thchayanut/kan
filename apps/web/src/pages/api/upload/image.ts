import type { NextApiRequest, NextApiResponse } from "next";
import { PutObjectCommand, S3Client } from "@aws-sdk/client-s3";
import { getSignedUrl } from "@aws-sdk/s3-request-presigner";
import { env } from "next-runtime-env";

export default async function handler(
  req: NextApiRequest,
  res: NextApiResponse,
) {
  if (req.method !== "POST") {
    return res.status(405).json({ error: "Method not allowed" });
  }

  try {
    const { filename, contentType } = req.body;

    const client = new S3Client({
      region: env.S3_REGION,
      endpoint: env.S3_ENDPOINT,
      credentials: {
        accessKeyId: env.S3_ACCESS_KEY_ID,
        secretAccessKey: env.S3_SECRET_ACCESS_KEY,
      },
    });

    const signedUrl = await getSignedUrl(
      // @ts-ignore
      client,
      new PutObjectCommand({
        Bucket: env("NEXT_PUBLIC_AVATAR_BUCKET_NAME") ?? "",
        Key: filename,
      }),
    );

    return res.status(200).json({ url: signedUrl, key: filename });
  } catch (error) {
    return res.status(500).json({ error: (error as Error).message });
  }
}
