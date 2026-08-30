'use client';

import { useState, useMemo } from 'react';
import Link from 'next/link';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import { Users, Search, PlusCircle } from 'lucide-react';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';

interface ClassListClientProps {
  classes: any[];
}

export function ClassListClient({ classes }: ClassListClientProps) {
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
          <p className="text-zinc-500">Quản lý các lớp học và học sinh bạn đang giảng dạy.</p>
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
          <Link href="/teacher/classes/create">
            <Button className="bg-zinc-900 hover:bg-zinc-800 text-white whitespace-nowrap">
              <PlusCircle className="mr-2 h-4 w-4" /> Tạo lớp mới
            </Button>
          </Link>
        </div>
      </div>

      {filteredClasses.length === 0 ? (
        <div className="text-center py-12 text-zinc-500 bg-white rounded-lg border border-zinc-200">
          {searchTerm ? 'Không tìm thấy lớp học nào phù hợp với tìm kiếm.' : 'Chưa có lớp học nào. Hãy tạo lớp học đầu tiên của bạn.'}
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {filteredClasses.map((c: any) => (
            <Card key={c.id} className="border-zinc-200 shadow-sm transition-all hover:shadow-md flex flex-col relative">
              <Link href={`/teacher/classes/${c.id}`} className="absolute inset-0 z-0" aria-label={`Vào lớp ${c.name}`}></Link>
              <CardHeader className="pb-4 relative z-10 pointer-events-none">
                <div className="h-1 w-12 rounded mb-3" style={{ backgroundColor: c.color || '#18181b' }} />
                <div className="flex flex-col">
                  <CardTitle className="text-xl text-zinc-900 truncate" title={c.name}>{c.name}</CardTitle>
                  <CardDescription className="mt-1">{c.subject || 'Chưa cập nhật môn học'}</CardDescription>
                </div>
              </CardHeader>
              <CardContent className="flex-1 relative z-10 pointer-events-none">
                <div className="flex flex-col gap-2">
                  <div className="flex items-center text-sm text-zinc-600 gap-2">
                    <Users className="h-4 w-4" />
                    <span>{c.studentsCount} học sinh</span>
                  </div>
                  <div className="text-sm font-medium text-zinc-900 mt-1">
                    {(c.feeAmount || 0).toLocaleString('vi-VN')} đ/buổi
                  </div>
                </div>
              </CardContent>
              <CardFooter className="pt-4 border-t border-zinc-100 flex gap-2 relative z-10">
                <Link href={`/teacher/classes/${c.id}/schedule`} className="inline-flex items-center justify-center whitespace-nowrap rounded-md text-sm font-medium ring-offset-background transition-colors border border-input bg-background hover:bg-accent hover:text-accent-foreground h-9 px-4 py-2 w-full text-zinc-700">
                  Lịch học
                </Link>
                <Link href={`/teacher/classes/${c.id}/attendance`} className="inline-flex items-center justify-center whitespace-nowrap rounded-md text-sm font-medium ring-offset-background transition-colors bg-zinc-900 text-white hover:bg-zinc-800 h-9 px-4 py-2 w-full">
                  Điểm danh
                </Link>
              </CardFooter>
            </Card>
          ))}
        </div>
      )}
    </div>
  );
}
