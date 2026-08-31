import { TableSkeleton } from "@/components/skeletons/TableSkeleton";

export default function StudentRequestsLoading() {
  return <TableSkeleton rows={4} columns={4} />;
}
