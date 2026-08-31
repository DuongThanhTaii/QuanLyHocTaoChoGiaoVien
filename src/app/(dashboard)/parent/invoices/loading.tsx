import { TableSkeleton } from "@/components/skeletons/TableSkeleton";

export default function ParentInvoicesLoading() {
  return <TableSkeleton rows={5} columns={5} />;
}
