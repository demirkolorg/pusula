import { Skeleton } from "@/components/ui/skeleton";

// Sprint 4 / S4-13 — Proje detay sayfası loading boundary.
// Kanban iskeleti: 3 liste sütunu, her birinde 3-4 kart placeholder'ı.
export default function ProjeDetayLoading() {
  return (
    <div className="flex flex-1 flex-col gap-4">
      <div className="flex items-center justify-between gap-3">
        <Skeleton className="h-8 w-64 rounded-md" />
        <Skeleton className="h-9 w-28 rounded-md" />
      </div>
      <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 lg:grid-cols-3">
        {Array.from({ length: 3 }).map((_, sutunIdx) => (
          <div
            key={`liste-iskelet-${sutunIdx}`}
            className="bg-muted/30 flex flex-col gap-2 rounded-lg p-3"
          >
            <Skeleton className="h-6 w-24 rounded" />
            {Array.from({ length: 3 }).map((_, kartIdx) => (
              <Skeleton
                key={`kart-iskelet-${sutunIdx}-${kartIdx}`}
                className="h-16 rounded-md"
              />
            ))}
          </div>
        ))}
      </div>
    </div>
  );
}
