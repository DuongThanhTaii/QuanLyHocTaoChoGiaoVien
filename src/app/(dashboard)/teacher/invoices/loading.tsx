import { TableSkeleton } from "@/components/skeletons/TableSkeleton";

export default function TeacherInvoicesLoading() {
  return <TableSkeleton rows={7} columns={6} />;
}
