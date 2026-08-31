import { CardGridSkeleton } from "@/components/skeletons/CardGridSkeleton";

export default function TeacherContentLoading() {
  return <CardGridSkeleton count={4} columns="grid-cols-1 md:grid-cols-2" />;
}
