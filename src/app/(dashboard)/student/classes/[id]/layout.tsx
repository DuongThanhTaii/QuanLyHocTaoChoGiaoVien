import { StudentClassTabs } from './StudentClassTabs';
export default async function StudentClassLayout({ children, params }: { children: React.ReactNode; params: Promise<{ id: string }> }) { const { id } = await params; return <div className="space-y-6"><StudentClassTabs classId={id} /><div className="pt-4">{children}</div></div>; }
