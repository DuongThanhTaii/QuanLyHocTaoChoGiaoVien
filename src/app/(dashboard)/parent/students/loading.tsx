import { CardGridSkeleton } from "@/components/skeletons/CardGridSkeleton";

export default function ParentStudentsLoading() {
  return <CardGridSkeleton count={2} columns="grid-cols-1 md:grid-cols-2" />;
}
