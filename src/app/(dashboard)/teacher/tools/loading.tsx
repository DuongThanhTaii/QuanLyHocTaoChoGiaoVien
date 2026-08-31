import { CardGridSkeleton } from "@/components/skeletons/CardGridSkeleton";

export default function TeacherToolsLoading() {
  return <CardGridSkeleton count={4} columns="grid-cols-1 md:grid-cols-2" />;
}
