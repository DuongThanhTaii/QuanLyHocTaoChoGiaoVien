import { TableSkeleton } from "@/components/skeletons/TableSkeleton";

export default function StudentInvoicesLoading() {
  return <TableSkeleton rows={5} columns={5} />;
}
