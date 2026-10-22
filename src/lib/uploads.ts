import { mkdir, readFile, unlink, writeFile } from "node:fs/promises";
import { randomBytes } from "node:crypto";
import path from "node:path";
import sharp from "sharp";

export type UploadBucket = "profiles" | "lessons" | "levels" | "banners";

const EXTENSIONS: Record<string, string> = {
  "image/png": "png",
  "image/jpeg": "jpg",
  "image/webp": "webp",
};

const MAX_BYTES = 6 * 1024 * 1024;

function bucketDirectory(bucket: UploadBucket) {
  return path.join(process.cwd(), "public", "uploads", bucket);
}

export async function storeImage(bucket: UploadBucket, file: File) {
  const extension = EXTENSIONS[file.type];
  if (!extension) throw new Error("Only PNG, JPG, and WEBP images are supported.");
  if (file.size <= 0 || file.size > MAX_BYTES) throw new Error("Image must be between 1 KB and 6 MB.");
  const bytes = Buffer.from(await file.arrayBuffer());
  let image: ReturnType<typeof sharp>;
  try {
    image = sharp(bytes, { limitInputPixels: 30_000_000 });
    const metadata = await image.metadata();
    if (!metadata.width || !metadata.height || metadata.width > 8000 || metadata.height > 8000) {
      throw new Error("Image dimensions are not supported.");
    }
  } catch {
    throw new Error("The selected file is not a valid image.");
  }
  const output = await image
    .resize({ width: 1600, height: 1600, fit: "inside", withoutEnlargement: true })
    .jpeg({ quality: 82, mozjpeg: true })
    .toBuffer();
  const filename = `${randomBytes(14).toString("hex")}.jpg`;
  await mkdir(bucketDirectory(bucket), { recursive: true });
  await writeFile(path.join(bucketDirectory(bucket), filename), output);
  return `/uploads/${bucket}/${filename}`;
}

export async function removeImage(publicPath: string | null | undefined) {
  if (!publicPath) return;
  const match = publicPath.match(/^\/uploads\/(profiles|lessons|levels|banners)\/([a-f0-9]{28}\.[a-z]+)$/);
  if (!match) return;
  await unlink(path.join(process.cwd(), "public", "uploads", match[1], match[2])).catch(() => undefined);
}

export async function readImage(publicPath: string) {
  const match = publicPath.match(/^\/uploads\/(profiles|lessons|levels|banners)\/([a-f0-9]{28}\.[a-z0-9]+)$/);
  if (!match) return null;
  try {
    return await readFile(path.join(process.cwd(), "public", "uploads", match[1], match[2]));
  } catch {
    return null;
  }
}
