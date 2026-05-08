import { Skeleton } from "@/components/ui/skeleton";

// Sprint 4 / S4-12 — Panel genel loading boundary'si.
// Sayfa segment'i yüklenirken Next.js bu komponenti render eder
// (`loading.tsx` convention). Skeleton tarafı zaten `role="status"
// + aria-live` taşır (S4-5).
export default function PanelLoading() {
  return (
    <div className="flex flex-1 flex-col gap-4 p-2">
      <Skeleton className="h-8 w-48 rounded-md" />
      <Skeleton className="h-32 w-full rounded-lg" />
      <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
        <Skeleton className="h-40 rounded-lg" />
        <Skeleton className="h-40 rounded-lg" />
        <Skeleton className="h-40 rounded-lg" />
      </div>
    </div>
  );
}
