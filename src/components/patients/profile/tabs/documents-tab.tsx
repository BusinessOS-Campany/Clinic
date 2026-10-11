import { Download, FolderOpen } from "lucide-react";
import { getTranslations } from "next-intl/server";
import type { loadDocuments } from "@/lib/patient-profile/queries";
import { fmtDate } from "@/lib/format";
import { hasStoredFile } from "@/lib/documents/storage";
import {
  ProfileEmpty,
  ProfileRecordList,
  type ProfileRecord,
} from "@/components/patients/profile/profile-records";
import { Button } from "@/components/ui/button";

type Item = Awaited<ReturnType<typeof loadDocuments>>[number];

function fileSize(bytes: number | null): string | null {
  if (!bytes) return null;
  if (bytes < 1024) return `${bytes} B`;
  if (bytes < 1024 * 1024) return `${Math.round(bytes / 1024)} KB`;
  return `${Math.round(bytes / (1024 * 1024))} MB`;
}

export async function DocumentsTab({
  items,
  locale,
}: {
  items: Item[];
  locale: string;
}) {
  const t = await getTranslations("patients");

  const records: ProfileRecord[] = items.map((item) => {
    const hasFile = hasStoredFile(item.storageKey);
    return {
      id: item.id,
      title: item.fileName,
      subtitle: fmtDate(item.createdAt, locale),
      badges: [
        {
          label: t(`documentCategory_${item.category}`),
          variant: "info" as const,
        },
      ],
      facts: [
        ...(item.mimeType ? [{ label: t("mimeType"), value: item.mimeType }] : []),
        ...(fileSize(item.sizeBytes)
          ? [{ label: t("fileSize"), value: fileSize(item.sizeBytes) as string }]
          : []),
      ],
      note: item.notes,
      actions: hasFile ? (
        <Button asChild variant="ghost" size="icon">
          <a
            href={`/api/documents/${item.id}`}
            target="_blank"
            aria-label={t("downloadFile")}
            className="text-muted-foreground hover:text-foreground"
          >
            <Download />
          </a>
        </Button>
      ) : undefined,
    };
  });

  return (
    <div className="flex flex-col gap-4">
      {records.length === 0 ? (
        <ProfileEmpty icon={FolderOpen} title={t("noDocuments")} />
      ) : (
        <ProfileRecordList records={records} />
      )}
    </div>
  );
}