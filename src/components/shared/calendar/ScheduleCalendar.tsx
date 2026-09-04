'use client';

import React, { useState, useMemo } from 'react';
import { startOfWeek, addDays, format, subWeeks, addWeeks, isSameDay, startOfMonth, endOfMonth, endOfWeek, isSameMonth, subMonths, addMonths, eachDayOfInterval } from 'date-fns';
import { vi } from 'date-fns/locale';
import { ChevronLeft, ChevronRight, Clock, MapPin } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Tabs, TabsList, TabsTrigger } from '@/components/ui/tabs';
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
    name: string;
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
  const [viewMode, setViewMode] = useState<'week'|'month'>('week');

  // Extract unique classes for filter
  const uniqueClasses = useMemo(() => {
    const classMap = new Map<string, { id: string, name: string }>();
    slots.forEach(s => {
      if (s.classes) {
        classMap.set(s.classes.id, { id: s.classes.id, name: s.classes.name });
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
    if (!selectedClass || selectedClass === 'all') return slots;
    return slots.filter(s => s.class_id === selectedClass);
  }, [slots, selectedClass]);

  const handlePrev = () => {
    if (viewMode === 'week') setCurrentDate(subWeeks(currentDate, 1));
    else setCurrentDate(subMonths(currentDate, 1));
  };

  const handleNext = () => {
    if (viewMode === 'week') setCurrentDate(addWeeks(currentDate, 1));
    else setCurrentDate(addMonths(currentDate, 1));
  };

  const today = () => setCurrentDate(new Date());

  const handleSlotClick = (classId: string) => {
    if (userRole === 'teacher') {
      router.push(`/teacher/classes/${classId}`);
    } else if (userRole === 'student') {
      router.push(`/student/classes/${classId}`);
    } else {
      router.push(`/parent/classes/${classId}`);
    }
  };

  const getSlotsForDay = (date: Date) => {
    const jsDay = date.getDay();
    return filteredSlots
      .filter(s => s.day_of_week === jsDay)
      .sort((a, b) => a.start_time.localeCompare(b.start_time));
  };

  const formatTime = (timeStr: string) => {
    return timeStr.substring(0, 5);
  };

  // Calculate week view days
  const startOfCurrentWeek = startOfWeek(currentDate, { weekStartsOn: 1 });
  const weekDays = Array.from({ length: 7 }).map((_, i) => addDays(startOfCurrentWeek, i));

  // Calculate month view days
  const monthStart = startOfMonth(currentDate);
  const monthEnd = endOfMonth(currentDate);
  const monthStartDay = startOfWeek(monthStart, { weekStartsOn: 1 });
  const monthEndDay = endOfWeek(monthEnd, { weekStartsOn: 1 });
  const monthDays = eachDayOfInterval({ start: monthStartDay, end: monthEndDay });

  return (
    <div className="flex flex-col bg-card rounded-2xl border border-border overflow-hidden shadow-sm">
      {/* Toolbar */}
      <div className="flex flex-col lg:flex-row items-stretch lg:items-center justify-between p-3 sm:p-4 border-b border-border gap-3 bg-muted/20">
        <div className="flex items-center gap-1.5 sm:gap-2">
          <Button variant="outline" size="sm" onClick={today}>Hôm nay</Button>
          <div className="flex items-center gap-1">
            <Button variant="ghost" size="icon" onClick={handlePrev} className="h-8 w-8"><ChevronLeft className="h-4 w-4" /></Button>
            <Button variant="ghost" size="icon" onClick={handleNext} className="h-8 w-8"><ChevronRight className="h-4 w-4" /></Button>
          </div>
          <h2 className="text-base sm:text-lg font-semibold ml-1 sm:ml-2 capitalize truncate">
            {format(currentDate, 'MMMM yyyy', { locale: vi })}
          </h2>
        </div>
        
        <div className="flex items-center gap-2 sm:gap-3 w-full lg:w-auto">
          <Tabs value={viewMode} onValueChange={(v) => setViewMode(v as any)} className="w-[132px] sm:w-[140px] shrink-0">
            <TabsList className="grid w-full grid-cols-2">
              <TabsTrigger value="week">Tuần</TabsTrigger>
              <TabsTrigger value="month">Tháng</TabsTrigger>
            </TabsList>
          </Tabs>

          <Select value={selectedClass} onValueChange={(val) => val && setSelectedClass(val)}>
            <SelectTrigger className="min-w-0 flex-1 lg:w-[200px] h-9 bg-background">
              <SelectValue placeholder="Tất cả lớp học">
                {selectedClass === 'all' ? 'Tất cả lớp học' : uniqueClasses.find(c => c.id === selectedClass)?.name || 'Tất cả lớp học'}
              </SelectValue>
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
      <div className="bg-muted/10">
        {/* Compact agenda for phones and tablets. It avoids an oversized seven-column canvas. */}
        <div className="lg:hidden p-3 sm:p-4">
          {(() => {
            const mobileDays = (viewMode === 'week' ? weekDays : monthDays).filter((day) => {
              if (viewMode === 'month' && !isSameMonth(day, currentDate)) return false;
              return getSlotsForDay(day).length > 0;
            });

            if (mobileDays.length === 0) {
              return <div className="rounded-xl border border-dashed border-border bg-card px-4 py-10 text-center text-sm text-muted-foreground">Chưa có lịch học trong khoảng thời gian này.</div>;
            }

            return <div className="space-y-3">
              {mobileDays.map((day) => {
                const daySlots = getSlotsForDay(day);
                const isToday = isSameDay(day, new Date());
                return <section key={day.toISOString()} className="flex gap-3">
                  <div className="w-[58px] shrink-0 pt-2 text-center">
                    <p className={`text-[11px] font-semibold uppercase ${isToday ? 'text-primary' : 'text-muted-foreground'}`}>{format(day, 'EEE', { locale: vi })}</p>
                    <p className={`mt-0.5 text-xl font-bold leading-6 ${isToday ? 'text-primary' : 'text-foreground'}`}>{format(day, 'd')}</p>
                  </div>
                  <div className="min-w-0 flex-1 space-y-2">
                    {daySlots.map((slot) => <div
                      key={slot.id}
                      role="button"
                      tabIndex={0}
                      onClick={() => handleSlotClick(slot.class_id)}
                      onKeyDown={(event) => { if (event.key === 'Enter' || event.key === ' ') handleSlotClick(slot.class_id); }}
                      className={`cursor-pointer rounded-xl border p-3 transition-shadow hover:shadow-md focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary ${classColors.get(slot.class_id)}`}
                    >
                      <div className="flex items-start justify-between gap-3">
                        <p className="min-w-0 flex-1 text-sm font-semibold leading-5">{slot.title || slot.classes?.name || 'Buổi học'}</p>
                        <span className="inline-flex shrink-0 items-center gap-1 whitespace-nowrap pt-0.5 text-[11px] font-medium opacity-90"><Clock className="size-3" />{formatTime(slot.start_time)} - {formatTime(slot.end_time)}</span>
                      </div>
                      {slot.room && <p className="mt-1 inline-flex items-center gap-1 text-[11px] opacity-80"><MapPin className="size-3" />{slot.room}</p>}
                    </div>)}
                  </div>
                </section>;
              })}
            </div>;
          })()}
        </div>

        {/* Full calendar for desktop. The grid height now follows its compact minimum instead of the viewport. */}
        <div className="hidden lg:flex min-w-[800px] flex-col overflow-auto">
          {/* Header Row */}
          <div className="grid grid-cols-7 border-b border-border bg-card sticky top-0 z-10">
            {weekDays.map((day, i) => (
              <div key={i} className={`p-3 text-center border-r border-border last:border-r-0 ${isSameDay(day, new Date()) ? 'bg-primary/5 dark:bg-primary/10 border-b-2 border-b-primary' : ''}`}>
                <div className="text-xs font-bold uppercase text-foreground">
                  {format(day, 'EEEE', { locale: vi })}
                </div>
                {viewMode === 'week' && (
                  <div className={`text-xl font-bold w-8 h-8 flex items-center justify-center rounded-full mx-auto mt-1 ${isSameDay(day, new Date()) ? 'bg-primary text-primary-foreground' : 'text-foreground'}`}>
                    {format(day, 'd')}
                  </div>
                )}
              </div>
            ))}
          </div>

          {/* Slots Grid */}
          {viewMode === 'week' ? (
            <div className="grid grid-cols-7 min-h-[230px]">
              {weekDays.map((day, i) => {
                const daySlots = getSlotsForDay(day);
                const isToday = isSameDay(day, new Date());
                return (
                  <div key={i} className={`p-2 border-r border-border last:border-r-0 flex flex-col gap-2 ${isToday ? 'bg-primary/5 dark:bg-primary/10' : ''}`}>
                    {daySlots.map(slot => (
                      <div
                        key={slot.id} 
                        onClick={() => handleSlotClick(slot.class_id)}
                        className={`p-3 rounded-lg border cursor-pointer hover:shadow-md transition-all group ${classColors.get(slot.class_id)}`}
                      >
                        <div className="font-semibold text-sm mb-1 leading-tight group-hover:underline">
                          {slot.title || slot.classes?.name || 'Buổi học'}
                        </div>
                        <div className="flex items-center gap-1.5 text-xs opacity-90 mb-1">
                          <Clock className="w-3 h-3" />
                          <span>{formatTime(slot.start_time)} - {formatTime(slot.end_time)}</span>
                        </div>
                      </div>
                    ))}
                  </div>
                );
              })}
            </div>
          ) : (
            <div className="grid grid-cols-7 auto-rows-[112px]">
              {monthDays.map((day, i) => {
                const daySlots = getSlotsForDay(day);
                const isToday = isSameDay(day, new Date());
                const isCurrentMonth = isSameMonth(day, currentDate);
                return (
                  <div key={i} className={`p-1.5 border-b border-r border-border last:border-r-0 flex flex-col gap-1 ${isToday ? 'bg-primary/5 dark:bg-primary/10 border-primary ring-1 ring-inset ring-primary z-10' : ''} ${!isCurrentMonth ? 'opacity-40 bg-muted/30' : ''}`}>
                    <div className={`text-right text-sm font-medium mb-1 ${isToday ? 'text-primary font-bold' : 'text-muted-foreground'}`}>
                      {format(day, 'd')}
                    </div>
                    <div className="flex-1 overflow-y-auto flex flex-col gap-1">
                      {daySlots.map(slot => (
                        <div 
                          key={slot.id} 
                          onClick={() => handleSlotClick(slot.class_id)}
                          className={`px-1.5 py-1 rounded border text-[10px] leading-tight cursor-pointer hover:opacity-80 transition-opacity truncate ${classColors.get(slot.class_id)}`}
                        >
                          <span className="font-semibold">{formatTime(slot.start_time)}</span> {slot.title || slot.classes?.name || 'Ca học'}
                        </div>
                      ))}
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
