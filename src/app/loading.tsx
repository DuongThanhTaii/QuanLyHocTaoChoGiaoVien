import { CardGridSkeleton } from "@/components/skeletons/CardGridSkeleton";

export default function GlobalLoading() {
  return (
    <div className="p-6 max-w-6xl mx-auto">
      <CardGridSkeleton count={6} />
    </div>
  );
}
