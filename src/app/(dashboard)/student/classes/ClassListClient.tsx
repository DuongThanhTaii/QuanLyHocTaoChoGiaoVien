'use client';

import { useState, useMemo } from 'react';
import Link from 'next/link';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Search } from 'lucide-react';
import { Input } from '@/components/ui/input';

interface ClassListClientProps {
  classes: any[];
  headerAction?: React.ReactNode;
  notice?: React.ReactNode;
}

export function ClassListClient({ classes, headerAction, notice }: ClassListClientProps) {
  const [searchTerm, setSearchTerm] = useState('');

  const filteredClasses = useMemo(() => {
    return classes.filter(c => 
      (c.name || '').toLowerCase().includes(searchTerm.toLowerCase()) || 
      (c.subject || '').toLowerCase().includes(searchTerm.toLowerCase())
    );
  }, [classes, searchTerm]);

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold tracking-tight text-zinc-900">Lớp học của tôi</h1>
          <p className="text-zinc-500">Danh sách các lớp học bạn đang tham gia.</p>
        </div>
        <div className="flex items-center gap-3 w-full sm:w-auto">
          <div className="flex items-center relative flex-1 sm:w-64">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-zinc-400" />
            <Input 
              placeholder="Tìm kiếm lớp học hoặc môn..." 
              className="pl-9 bg-white w-full"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
            />
          </div>
          {headerAction}
        </div>
      </div>
      
      {notice}

      {filteredClasses.length === 0 ? (
        <div className="text-center py-12 text-zinc-500 bg-white rounded-lg border border-zinc-200">
          {searchTerm ? 'Không tìm thấy lớp học nào phù hợp với tìm kiếm.' : 'Bạn chưa được thêm vào lớp học nào.'}
        </div>
      ) : (
        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
          {filteredClasses.map((classroom: any) => (
            <Card key={classroom.id} className="border-zinc-200 shadow-sm transition-all hover:shadow-md flex flex-col relative">
              <Link href={`/student/classes/${classroom.id}`} className="absolute inset-0 z-0" aria-label={`Vào lớp ${classroom.name}`}></Link>
              <CardHeader className="pb-4 relative z-10 pointer-events-none">
                <div className="h-1 w-12 rounded mb-3" style={{ backgroundColor: classroom.color || '#18181b' }} />
                <div className="flex flex-col">
                  <CardTitle className="text-xl text-zinc-900 truncate" title={classroom.name}>{classroom.name}</CardTitle>
                  <CardDescription className="mt-1">{classroom.subject || 'Chưa cập nhật môn học'}</CardDescription>
                </div>
              </CardHeader>
              <CardContent className="flex-1 relative z-10 pointer-events-none">
                <p className="line-clamp-2 text-sm text-zinc-500">
                  {classroom.description || 'Xem tài liệu và lịch học của lớp.'}
                </p>
              </CardContent>
            </Card>
          ))}
        </div>
      )}
    </div>
  );
}
