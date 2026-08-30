'use client';

import React, { useState, useMemo } from 'react';
import { startOfWeek, addDays, format, subWeeks, addWeeks, isSameDay } from 'date-fns';
import { vi } from 'date-fns/locale';
import { ChevronLeft, ChevronRight, Calendar as CalendarIcon, Clock, MapPin } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { useRouter } from 'next/navigation';

export type ScheduleSlot = {
  id: string;
  class_id: string;
  title: string | null;
  day_of_week: number;
  start_time: string;
  end_time: string;
  room: string | null;
  classes: {
    id: string;
    class_code: string;
    class_name: string;
  } | null;
};

interface ScheduleCalendarProps {
  slots: ScheduleSlot[];
  userRole: 'teacher' | 'student' | 'parent';
}

const COLORS = [
  'bg-blue-100 border-blue-200 text-blue-800 dark:bg-blue-900/30 dark:border-blue-800 dark:text-blue-300',
  'bg-green-100 border-green-200 text-green-800 dark:bg-green-900/30 dark:border-green-800 dark:text-green-300',
  'bg-purple-100 border-purple-200 text-purple-800 dark:bg-purple-900/30 dark:border-purple-800 dark:text-purple-300',
  'bg-orange-100 border-orange-200 text-orange-800 dark:bg-orange-900/30 dark:border-orange-800 dark:text-orange-300',
  'bg-pink-100 border-pink-200 text-pink-800 dark:bg-pink-900/30 dark:border-pink-800 dark:text-pink-300',
  'bg-teal-100 border-teal-200 text-teal-800 dark:bg-teal-900/30 dark:border-teal-800 dark:text-teal-300',
];

export function ScheduleCalendar({ slots, userRole }: ScheduleCalendarProps) {
  const router = useRouter();
  const [currentDate, setCurrentDate] = useState(new Date());
  const [selectedClass, setSelectedClass] = useState<string>('all');

  // Lấy các ngày trong tuần
  const startOfCurrentWeek = startOfWeek(currentDate, { weekStartsOn: 1 });
  const weekDays = Array.from({ length: 7 }).map((_, i) => addDays(startOfCurrentWeek, i));

  // Extract unique classes for filter
  const uniqueClasses = useMemo(() => {
    const classMap = new Map<string, { id: string, name: string }>();
    slots.forEach(s => {
      if (s.classes) {
        classMap.set(s.classes.id, { id: s.classes.id, name: `${s.classes.class_code} - ${s.classes.class_name}` });
      }
    });
    return Array.from(classMap.values());
  }, [slots]);

  // Lấy màu cho lớp
  const classColors = useMemo(() => {
    const map = new Map<string, string>();
    uniqueClasses.forEach((c, i) => {
      map.set(c.id, COLORS[i % COLORS.length]);
    });
    return map;
  }, [uniqueClasses]);

  // Lọc slot theo lớp
  const filteredSlots = useMemo(() => {
    if (selectedClass === 'all') return slots;
    return slots.filter(s => s.class_id 
=== selectedClass);
  }, [slots, selectedClass]);

  const nextWeek = () => setCurrentDate(addWeeks(currentDate, 1));
  const prevWeek = () => setCurrentDate(subWeeks(currentDate, 1));
  const today = () => setCurrentDate(new Date());

  const handleSlotClick = (classId: string) => {
    if (userRole 
=== 'teacher') {
      router.push(`/teacher/classes/${classId}`);
    } else if (userRole 
=== 'student') {
      router.push(`/student/classes/${classId}`);
    } else {
      router.push(`/parent/classes/${classId}`); // If parent has this route
    }
  };

  // Convert JS day 0-6 (Sun-Sat) to the day_of_week format used in DB (assume 0=Sun, 1=Mon, ..., 6=Sat)
  const getSlotsForDay = (date: Date) => {
    const jsDay = date.getDay(); // 0 is Sunday
    // if db day_of_week is exactly mapping to Date.getDay()
    return filteredSlots
      .filter(s => s.day_of_week 
=== jsDay)
      .sort((a, b) => a.start_time.localeCompare(b.start_time));
  };

  const formatTime = (timeStr: string) => {
    // timeStr is usually "HH:mm:ss"
    return timeStr.substring(0, 5);
  };

  return (
    <div className="flex flex-col h-full bg-card rounded-xl border border-border overflow-hidden shadow-sm">
      {/* Toolbar */}
      <div className="flex flex-col sm:flex-row items-center justify-between p-4 border-b border-border gap-4 bg-muted/20">
        <div className="flex items-center gap-2">
          <Button variant="outline" size="sm" onClick={today}>Hôm nay</Button>
          <div className="flex items-center gap-1">
            <Button variant="ghost" size="icon" onClick={prevWeek} className="h-8 w-8"><ChevronLeft className="h-4 w-4" /></Button>
            <Button variant="ghost" size="icon" onClick={nextWeek} className="h-8 w-8"><ChevronRight className="h-4 w-4" /></Button>
          </div>
          <h2 className="text-lg font-semibold ml-2 capitalize w-48">
            {format(currentDate, 'MMMM yyyy', { locale: vi })}
          </h2>
        </div>
        
        <div className="flex items-center gap-3 w-full sm:w-auto">
          <Select value={selectedClass} onValueChange={setSelectedClass}>
            <SelectTrigger className="w-[200px] h-9 bg-background">
              <SelectValue placeholder="Tất cả lớp học" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">Tất cả lớp học</SelectItem>
              {uniqueClasses.map(c => (
                <SelectItem key={c.id} value={c.id}>{c.name}</SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
      </div>

      {/* Calendar Grid */}
      <div className="flex-1 overflow-auto bg-muted/10">
        <div className="min-w-[800px] h-full flex flex-col">
          {/* Header Row */}
          <div className="grid grid-cols-7 border-b border-border bg-card sticky top-0 z-10">
            {weekDays.map((day, i) => {
              const isToday = isSameDay(day, new Date());
              return (
                <div key={i} className={`p-3 text-center border-r border-border last:border-r-0 ${isToday ? 'bg-primary/5' : ''}`}>
                  <div className={`text-xs font-medium uppercase mb-1 ${isToday ? 'text-primary' : 'text-muted-foreground'}`}>
                    {format(day, 'EEEE', { locale: vi })}
                  </div>
                  <div className={`text-xl font-bold w-8 h-8 flex items-center justify-center rounded-full mx-auto ${isToday ? 'bg-primary text-primary-foreground' : 'text-foreground'}`}>
                    {format(day, 'd')}
                  </div>
                </div>
              );
            })}
          </div>

          {/* Slots Row */}
          <div className="grid grid-cols-7 flex-1 min-h-[400px]">
            {weekDays.map((day, i) => {
              const daySlots = getSlotsForDay(day);
              const isToday = isSameDay(day, new Date());
              return (
                <div key={i} className={`p-2 border-r border-border last:border-r-0 flex flex-col gap-2 ${isToday ? 'bg-primary/[0.02]' : ''}`}>
                  {daySlots.length === 0 ? (
                    <div className="flex-1 flex items-center justify-center">
                      {/* Empty state */}
                    </div>
                  ) : (
                    daySlots.map(slot => (
                      <div 
                        key={slot.id} 
                        onClick={() => handleSlotClick(slot.class_id)}
                        className={`p-3 rounded-lg border cursor-pointer hover:shadow-md transition-all group ${classColors.get(slot.class_id)}`}
                      >
                        <div className="font-semibold text-sm mb-1 leading-tight group-hover:underline">
                          {slot.title || slot.classes?.class_name || 'Buỗi học'}
                        </div>
                        {slot.classes?.class_code && (
                          <div className="text-xs opacity-80 mb-2 font-medium">
                            {slot.classes.class_code}
                          </div>
                        )}
                        <div className="flex items-center gap-1.5 text-xs opacity-90 mb-1">
                          <Clock className="w-3 h-3" />
                          <span>{formatTime(slot.start_time)} - '{formatTime(slot.end_time)}</span>
                        </div>
                        {slot.room && (
                          <div className="flex items-center gap-1.5 text-xs opacity-90">
                            <MapPin className="w-3 h-3" />
                            <span className="truncate">{slot.room}</span>
                          </div>
                        )}
                      </div>
                    ))
                  )}
                </div>
              );
            })}
          </div>
        </div>
      </div>
    </div>
  );
}
