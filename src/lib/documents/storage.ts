import {
  existsSync,
  mkdirSync,
  readFileSync,
  rmSync,
  writeFileSync,
} from "node:fs";
import path from "node:path";

export const MAX_DOCUMENT_SIZE = 25 * 1024 * 1024;

function storageRoot(): string {
  return (
    process.env.DOCUMENT_STORAGE_DIR ||
    path.join(process.cwd(), "storage", "patient-documents")
  );
}

function resolveKey(storageKey: string): string {
  const root = path.resolve(storageRoot());
  const abs = path.resolve(root, storageKey);
  if (!abs.startsWith(root + path.sep)) throw new Error("invalid-storage-key");
  return abs;
}

function safeName(fileName: string): string {
  const cleaned = fileName
    .replace(/[^a-z0-9._-]+/gi, "-")
    .replace(/^-+|-+$/g, "")
    .slice(0, 120);
  return cleaned || "file";
}

export function saveDocumentBuffer(
  patientId: string,
  fileName: string,
  buffer: Buffer,
): string {
  const dir = path.join(storageRoot(), "patients", patientId);
  mkdirSync(dir, { recursive: true });
  const storageKey = `patients/${patientId}/${Date.now()}-${safeName(fileName)}`;
  writeFileSync(resolveKey(storageKey), buffer);
  return storageKey;
}

export function readDocumentBuffer(storageKey: string): Buffer | null {
  try {
    return readFileSync(resolveKey(storageKey));
  } catch {
    return null;
  }
}

export function deleteDocumentFile(storageKey: string): void {
  try {
    rmSync(resolveKey(storageKey), { force: true });
  } catch {
    // ignore missing files
  }
}

export function hasStoredFile(storageKey: string): boolean {
  try {
    return existsSync(resolveKey(storageKey));
  } catch {
    return false;
  }
}