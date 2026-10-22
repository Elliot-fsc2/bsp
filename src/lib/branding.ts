import { mkdir, readFile, unlink, writeFile } from "node:fs/promises";
import { randomBytes } from "node:crypto";
import path from "node:path";
import sharp from "sharp";

export type BrandAssetKind = "logo" | "icon";

const media = {
  "image/png": { ext: "png", max: 4 * 1024 * 1024 },
  "image/jpeg": { ext: "jpg", max: 4 * 1024 * 1024 },
  "image/webp": { ext: "webp", max: 4 * 1024 * 1024 },
  "image/x-icon": { ext: "ico", max: 1024 * 1024 },
  "image/vnd.microsoft.icon": { ext: "ico", max: 1024 * 1024 },
} as const;

const mediaTypeByExtension: Record<string, string> = {
  png: "image/png",
  jpg: "image/jpeg",
  webp: "image/webp",
  ico: "image/x-icon",
};

const dataDirectory = path.join(process.cwd(), "data", "branding");
const defaultLogo = path.join(process.cwd(), "public", "images", "logo-mark.png");

export function isBrandAssetKind(value: unknown): value is BrandAssetKind {
  return value === "logo" || value === "icon";
}

function looksLikeImage(buffer: Buffer, type: string) {
  if (type === "image/png") return buffer.subarray(0, 8).equals(Buffer.from("89504e470d0a1a0a", "hex"));
  if (type === "image/jpeg") return buffer.length > 3 && buffer[0] === 0xff && buffer[1] === 0xd8 && buffer[2] === 0xff;
  if (type === "image/webp") return buffer.toString("ascii", 0, 4) === "RIFF" && buffer.toString("ascii", 8, 12) === "WEBP";
  if (type === "image/x-icon" || type === "image/vnd.microsoft.icon") {
    return buffer.subarray(0, 4).equals(Buffer.from([0, 0, 1, 0]));
  }
  return false;
}

export async function storeBrandAsset(kind: BrandAssetKind, file: File) {
  const incomingType = file.type.toLowerCase();
  const type = (
    (incomingType === "application/octet-stream" || !incomingType) && /\.ico$/i.test(file.name)
      ? "image/x-icon"
      : incomingType
  ) as keyof typeof media;
  const details = media[type];
  if (!details || (kind === "logo" && details.ext === "ico")) {
    throw new Error(kind === "logo" ? "Logo must be a PNG, JPG, or WEBP image." : "Tab icon must be a PNG, JPG, WEBP, or ICO image.");
  }
  if (file.size === 0 || file.size > details.max) {
    throw new Error(`File must be smaller than ${details.ext === "ico" ? "1 MB" : "4 MB"}.`);
  }
  const bytes = Buffer.from(await file.arrayBuffer());
  if (!looksLikeImage(bytes, type)) throw new Error("The selected file is not a valid image.");

  let output = bytes;
  let extension: string = details.ext;
  if (kind === "icon" && details.ext !== "ico") {
    try {
      output = await sharp(bytes, { limitInputPixels: 20_000_000 })
        .resize(128, 128, { fit: "contain", background: { r: 0, g: 0, b: 0, alpha: 0 } })
        .png({ compressionLevel: 9 })
        .toBuffer();
      extension = "png";
    } catch {
      throw new Error("The image could not be prepared as a browser tab icon.");
    }
  }

  const filename = `${kind}-${randomBytes(12).toString("hex")}.${extension}`;
  await mkdir(dataDirectory, { recursive: true });
  await writeFile(path.join(dataDirectory, filename), output);
  return filename;
}

export async function removeBrandAsset(filename: string | null | undefined) {
  if (!filename || !/^(logo|icon)-[a-f0-9]{24}\.(png|jpg|webp|ico)$/.test(filename)) return;
  await unlink(path.join(dataDirectory, filename)).catch(() => undefined);
}

export async function loadBrandAsset(kind: BrandAssetKind, filename: string | null | undefined) {
  if (filename && new RegExp(`^${kind}-[a-f0-9]{24}\\.(png|jpg|webp|ico)$`).test(filename)) {
    try {
      const data = await readFile(path.join(dataDirectory, filename));
      const extension = filename.split(".").pop() ?? "png";
      return { data, contentType: mediaTypeByExtension[extension] ?? "image/png" };
    } catch {
      // If a file is unavailable, keep the site branded with the default mark.
    }
  }
  return { data: await readFile(defaultLogo), contentType: "image/png" };
}
