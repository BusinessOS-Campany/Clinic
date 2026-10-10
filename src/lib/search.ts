/**
 * Prisma search helpers.
 *
 * PostgreSQL `ILIKE` (Prisma `mode: "insensitive"`) raises
 * `invalid multibyte character for locale` (SQLSTATE 22021) when the database
 * runs under a `C` collation locale and the query contains non-ASCII input.
 * Arabic name queries therefore fall back to case-sensitive `LIKE`, which
 * works fine for scripts that have no letter casing.
 */
import type { Prisma } from "@/lib/generated/prisma/client";

export function textSearchMode(q: string): "insensitive" | undefined {
  // eslint-disable-next-line no-control-regex
  return /^[\x00-\x7F]*$/.test(q) ? "insensitive" : undefined;
}

/**
 * Builds the common patient OR-clause used by the list page and the
 * typeahead API. ASCII queries use case-insensitive matching for MRN/ID,
 * while name/phone matching stays case-sensitive to remain safe under the
 * database's C locale.
 */
export function patientSearchOr(q: string): Prisma.PatientWhereInput[] {
  const mode = textSearchMode(q);
  return [
    { mrn: { contains: q, ...(mode ? { mode } : {}) } },
    { patientId: { contains: q, ...(mode ? { mode } : {}) } },
    { firstNameAr: { contains: q } },
    { secondNameAr: { contains: q } },
    { lastNameAr: { contains: q } },
    { firstNameEn: { contains: q } },
    { lastNameEn: { contains: q } },
    { phone: { contains: q } },
    { phone2: { contains: q } },
  ];
}
