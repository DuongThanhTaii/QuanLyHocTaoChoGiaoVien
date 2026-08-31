'use client';

import * as React from 'react';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { Button } from '@/components/ui/button';
import { Calendar as CalendarIcon, ChevronLeft, ChevronRight, Check } from 'lucide-react';
import { cn } from '@/lib/utils';

interface DateRangePickerProps {
  startDate: string; // YYYY-MM-DD
  endDate: string;   // YYYY-MM-DD
  onApply: (start: string, end: string) => void;
  className?: string;
  triggerButton?: React.ReactNode;
}

export function DateRangePicker({
  startDate,
  endDate,
  onApply,
  className,
  triggerButton,
}: DateRangePickerProps) {
  const [open, setOpen] = React.useState(false);

  // Month currently viewed in the calendar
  const initialDate = startDate ? new Date(startDate) : new Date();
  const [currentViewDate, setCurrentViewDate] = React.useState<Date>(
    isNaN(initialDate.getTime()) ? new Date() : initialDate
  );

  // Temporary selection state
  const [tempStart, setTempStart] = React.useState<string>(startDate);
  const [tempEnd, setTempEnd] = React.useState<string>(endDate);
  const [hoverDate, setHoverDate] = React.useState<string | null>(null);

  React.useEffect(() => {
    setTempStart(startDate);
    setTempEnd(endDate);
  }, [startDate, endDate]);

  const year = currentViewDate.getFullYear();
  const month = currentViewDate.getMonth(); // 0-indexed

  function handlePrevMonth() {
    setCurrentViewDate(new Date(year, month - 1, 1));
  }

  function handleNextMonth() {
    setCurrentViewDate(new Date(year, month + 1, 1));
  }

  // Days in current month
  const firstDayOfWeek = new Date(year, month, 1).getDay(); // 0 = Sun, 1 = Mon...
  // Convert to Mon=0, Tue=1... Sun=6
  const startDayOffset = (firstDayOfWeek + 6) % 7;
  const daysInMonth = new Date(year, month + 1, 0).getDate();

  // Days in previous month for leading blanks
  const daysInPrevMonth = new Date(year, month, 0).getDate();

  const calendarDays = [];
  for (let i = startDayOffset - 1; i >= 0; i--) {
    calendarDays.push({
      day: daysInPrevMonth - i,
      monthOffset: -1,
      dateStr: new Date(year, month - 1, daysInPrevMonth - i).toISOString().split('T')[0]
    });
  }
  for (let d = 1; d <= daysInMonth; d++) {
    const dStr = `${year}-${String(month + 1).padStart(2, '0')}-${String(d).padStart(2, '0')}`;
    calendarDays.push({
      day: d,
      monthOffset: 0,
      dateStr: dStr
    });
  }
  const remainingCells = 42 - calendarDays.length;
  for (let d = 1; d <= remainingCells; d++) {
    calendarDays.push({
      day: d,
      monthOffset: 1,
      dateStr: new Date(year, month + 1, d).toISOString().split('T')[0]
    });
  }

  function handleDateClick(dateStr: string) {
    if (!tempStart || (tempStart && tempEnd)) {
      // Start new selection
      setTempStart(dateStr);
      setTempEnd('');
    } else if (tempStart && !tempEnd) {
      if (dateStr < tempStart) {
        setTempEnd(tempStart);
        setTempStart(dateStr);
      } else {
        setTempEnd(dateStr);
      }
    }
  }

  function handleApply() {
    if (tempStart && tempEnd) {
      onApply(tempStart, tempEnd);
      setOpen(false);
    } else if (tempStart && !tempEnd) {
      onApply(tempStart, tempStart);
      setOpen(false);
    }
  }

  function applyPreset(daysAgo: number) {
    const end = new Date();
    const start = new Date();
    start.setDate(start.getDate() - daysAgo);

    const sStr = start.toISOString().split('T')[0];
    const eStr = end.toISOString().split('T')[0];
    setTempStart(sStr);
    setTempEnd(eStr);
    setCurrentViewDate(start);
    onApply(sStr, eStr);
    setOpen(false);
  }

  function applyThisMonth() {
    const now = new Date();
    const start = new Date(now.getFullYear(), now.getMonth(), 1);
    const end = new Date(now.getFullYear(), now.getMonth() + 1, 0);
    const sStr = start.toISOString().split('T')[0];
    const eStr = end.toISOString().split('T')[0];
    setTempStart(sStr);
    setTempEnd(eStr);
    setCurrentViewDate(start);
    onApply(sStr, eStr);
    setOpen(false);
  }

  const effectiveEnd = tempEnd || (tempStart && hoverDate && hoverDate > tempStart ? hoverDate : '');

  // Format label for trigger
  const formatDisplay = (dStr: string) => {
    if (!dStr) return '';
    const [y, m, d] = dStr.split('-');
    return `${d}/${m}/${y}`;
  };

  const displayText = startDate && endDate
    ? `${formatDisplay(startDate)} - ${formatDisplay(endDate)}`
    : 'Chọn khoảng ngày';

  return (
    <Popover open={open} onOpenChange={setOpen}>
      <PopoverTrigger
        className={cn(
          'inline-flex items-center gap-1.5 rounded-lg text-xs font-medium outline-none transition-all cursor-pointer',
          className
        )}
      >
        {triggerButton || (
          <div
            className="inline-flex items-center gap-1.5 h-8 px-2.5 rounded-lg border border-zinc-200 dark:border-zinc-700 bg-background hover:bg-muted text-foreground text-xs font-medium shadow-2xs"
          >
            <CalendarIcon className="w-3.5 h-3.5 text-muted-foreground" />
            <span>{displayText}</span>
          </div>
        )}
      </PopoverTrigger>

      <PopoverContent align="end" className="w-auto p-3 shadow-xl border-zinc-200 dark:border-zinc-800 bg-popover z-50">
        <div className="flex flex-col sm:flex-row gap-3">
          {/* Quick Presets */}
          <div className="flex sm:flex-col gap-1 border-b sm:border-b-0 sm:border-r border-border pb-2 sm:pb-0 sm:pr-3 min-w-[110px]">
            <span className="text-[11px] font-semibold text-muted-foreground px-2 py-1 hidden sm:block">
              Khoảng nhanh
            </span>
            <button
              type="button"
              onClick={() => applyPreset(7)}
              className="text-left px-2 py-1.5 rounded-md text-xs hover:bg-muted text-foreground transition-colors"
            >
              7 ngày qua
            </button>
            <button
              type="button"
              onClick={() => applyPreset(14)}
              className="text-left px-2 py-1.5 rounded-md text-xs hover:bg-muted text-foreground transition-colors"
            >
              14 ngày qua
            </button>
            <button
              type="button"
              onClick={() => applyPreset(30)}
              className="text-left px-2 py-1.5 rounded-md text-xs hover:bg-muted text-foreground transition-colors"
            >
              30 ngày qua
            </button>
            <button
              type="button"
              onClick={applyThisMonth}
              className="text-left px-2 py-1.5 rounded-md text-xs hover:bg-muted text-foreground transition-colors"
            >
              Tháng này
            </button>
          </div>

          {/* Calendar Grid */}
          <div className="space-y-2">
            {/* Header: Month & Year Navigator */}
            <div className="flex items-center justify-between px-1">
              <span className="text-xs font-bold text-foreground">
                Tháng {month + 1}, {year}
              </span>
              <div className="flex items-center gap-1">
                <button
                  type="button"
                  onClick={handlePrevMonth}
                  className="p-1 rounded-md hover:bg-muted text-muted-foreground hover:text-foreground transition-colors"
                >
                  <ChevronLeft className="w-4 h-4" />
                </button>
                <button
                  type="button"
                  onClick={handleNextMonth}
                  className="p-1 rounded-md hover:bg-muted text-muted-foreground hover:text-foreground transition-colors"
                >
                  <ChevronRight className="w-4 h-4" />
                </button>
              </div>
            </div>

            {/* Weekday Names */}
            <div className="grid grid-cols-7 gap-1 text-center text-[11px] font-semibold text-muted-foreground">
              <span>T2</span>
              <span>T3</span>
              <span>T4</span>
              <span>T5</span>
              <span>T6</span>
              <span>T7</span>
              <span className="text-red-500">CN</span>
            </div>

            {/* Day Cells */}
            <div className="grid grid-cols-7 gap-1 text-center text-xs">
              {calendarDays.map((item, idx) => {
                const isCurrentMonth = item.monthOffset === 0;
                const isStart = item.dateStr === tempStart;
                const isEnd = item.dateStr === effectiveEnd;
                const isInRange =
                  tempStart &&
                  effectiveEnd &&
                  item.dateStr > tempStart &&
                  item.dateStr < effectiveEnd;

                return (
                  <button
                    key={idx}
                    type="button"
                    onClick={() => handleDateClick(item.dateStr)}
                    onMouseEnter={() => !tempEnd && tempStart && setHoverDate(item.dateStr)}
                    className={cn(
                      'h-7 w-7 rounded-md flex items-center justify-center font-medium transition-colors text-[11px]',
                      !isCurrentMonth && 'text-muted-foreground/30 pointer-events-none',
                      isCurrentMonth && 'text-foreground hover:bg-muted',
                      isInRange && 'bg-primary/15 text-primary rounded-none first:rounded-l-md last:rounded-r-md',
                      (isStart || isEnd) &&
                        'bg-primary text-primary-foreground font-bold shadow-xs hover:bg-primary'
                    )}
                  >
                    {item.day}
                  </button>
                );
              })}
            </div>

            {/* Footer with Apply button */}
            <div className="flex items-center justify-between pt-2 border-t border-border mt-2">
              <div className="text-[10px] text-muted-foreground">
                {tempStart ? (
                  <span>
                    {formatDisplay(tempStart)} {tempEnd ? `→ ${formatDisplay(tempEnd)}` : ''}
                  </span>
                ) : (
                  <span>Chọn ngày bắt đầu</span>
                )}
              </div>
              <div className="flex gap-1.5">
                <Button
                  type="button"
                  variant="ghost"
                  size="xs"
                  onClick={() => setOpen(false)}
                  className="text-xs h-7 px-2"
                >
                  Hủy
                </Button>
                <Button
                  type="button"
                  size="xs"
                  onClick={handleApply}
                  disabled={!tempStart}
                  className="text-xs h-7 px-2.5 bg-primary text-primary-foreground font-semibold"
                >
                  <Check className="w-3 h-3 mr-1" /> Áp dụng
                </Button>
              </div>
            </div>
          </div>
        </div>
      </PopoverContent>
    </Popover>
  );
}
