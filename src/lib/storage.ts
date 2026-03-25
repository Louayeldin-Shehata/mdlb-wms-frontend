import "server-only";

import { S3Client, PutObjectCommand } from "@aws-sdk/client-s3";
import { getSignedUrl } from "@aws-sdk/s3-request-presigner";

function requiredEnv(name: string): string {
  const v = process.env[name];
  if (!v) throw new Error(`Missing env var ${name}`);
  return v;
}

export type PresignPutInput = {
  key: string;
  contentType: string;
};

export type PresignPutResult = {
  key: string;
  url: string;
  publicUrl?: string;
};

export async function presignPutObject({
  key,
  contentType,
}: PresignPutInput): Promise<PresignPutResult> {
  const bucket = requiredEnv("STORAGE_BUCKET");
  const region = process.env.STORAGE_REGION || "us-east-1";
  const endpoint = process.env.STORAGE_ENDPOINT || undefined;

  const client = new S3Client({
    region,
    endpoint: endpoint || undefined,
    credentials: {
      accessKeyId: requiredEnv("STORAGE_ACCESS_KEY_ID"),
      secretAccessKey: requiredEnv("STORAGE_SECRET_ACCESS_KEY"),
    },
  });

  const command = new PutObjectCommand({
    Bucket: bucket,
    Key: key,
    ContentType: contentType,
  });

  const url = await getSignedUrl(client, command, { expiresIn: 60 * 5 });

  const publicBase = process.env.STORAGE_PUBLIC_BASE_URL || "";
  const publicUrl = publicBase ? `${publicBase.replace(/\/$/, "")}/${key}` : undefined;

  return {
    key,
    url,
    publicUrl,
  };
}

