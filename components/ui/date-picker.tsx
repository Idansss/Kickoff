'use client'

import { useState } from 'react'
import { format, parse, isValid } from 'date-fns'
import { DayPicker } from 'react-day-picker'
import * as Popover from '@radix-ui/react-popover'
import { CalendarIcon } from 'lucide-react'
import { cn } from '@/lib/utils'

interface DatePickerProps {
  value?: string        // ISO date string "yyyy-MM-dd" or ""
  onChange: (value: string) => void
  placeholder?: string
  className?: string
}

export function DatePicker({ value, onChange, placeholder = 'Pick a date', className }: DatePickerProps) {
  const [open, setOpen] = useState(false)

  const selected = value ? parse(value, 'yyyy-MM-dd', new Date()) : undefined
  const validSelected = selected && isValid(selected) ? selected : undefined

  const handleSelect = (day: Date | undefined) => {
    onChange(day ? format(day, 'yyyy-MM-dd') : '')
    setOpen(false)
  }

  return (
    <Popover.Root open={open} onOpenChange={setOpen}>
      <Popover.Trigger asChild>
        <button
          type="button"
          className={cn(
            'flex h-8 w-full items-center justify-between rounded-md border border-border bg-background px-3 text-xs text-foreground shadow-sm',
            'focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-green-500/70 focus-visible:ring-offset-2 focus-visible:ring-offset-background',
            !validSelected && 'text-muted-foreground',
            className,
          )}
        >
          <span>{validSelected ? format(validSelected, 'dd/MM/yyyy') : placeholder}</span>
          <CalendarIcon className="h-3.5 w-3.5 text-muted-foreground flex-shrink-0" />
        </button>
      </Popover.Trigger>

      <Popover.Portal>
        <Popover.Content
          side="bottom"
          align="start"
          sideOffset={4}
          className={cn(
            'z-50 rounded-xl border border-border bg-background text-foreground',
            'shadow-[0_8px_30px_rgba(0,0,0,0.15)]',
            'data-[state=open]:animate-in data-[state=open]:fade-in-0 data-[state=open]:zoom-in-95',
            'data-[state=closed]:animate-out data-[state=closed]:fade-out-0 data-[state=closed]:zoom-out-95',
          )}
        >
          <DayPicker
            mode="single"
            selected={validSelected}
            onSelect={handleSelect}
            showOutsideDays
            className="p-3"
            classNames={{
              months: 'flex flex-col',
              month: 'space-y-3',
              month_caption: 'flex items-center justify-between px-1 pb-1',
              caption_label: 'text-sm font-semibold text-foreground',
              nav: 'flex items-center gap-1',
              button_previous: cn(
                'inline-flex h-7 w-7 items-center justify-center rounded-md',
                'border border-border bg-background text-muted-foreground',
                'hover:bg-muted hover:text-foreground transition-colors',
              ),
              button_next: cn(
                'inline-flex h-7 w-7 items-center justify-center rounded-md',
                'border border-border bg-background text-muted-foreground',
                'hover:bg-muted hover:text-foreground transition-colors',
              ),
              month_grid: 'w-full border-collapse',
              weekdays: 'flex',
              weekday: 'w-9 text-center text-[11px] font-medium text-muted-foreground pb-1',
              weeks: '',
              week: 'flex',
              day: 'p-0',
              day_button: cn(
                'h-9 w-9 rounded-md text-xs font-normal transition-colors text-foreground',
                'hover:bg-muted',
                'focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-green-500/70',
              ),
              selected: '[&>button]:bg-green-600 [&>button]:text-white [&>button]:hover:bg-green-700 [&>button]:font-semibold',
              today: '[&>button]:border [&>button]:border-green-500 [&>button]:font-bold',
              outside: '[&>button]:text-muted-foreground/40 [&>button]:hover:bg-transparent',
              disabled: '[&>button]:text-muted-foreground/30 [&>button]:cursor-not-allowed [&>button]:hover:bg-transparent',
            }}
            footer={
              <div className="flex items-center justify-between border-t border-border px-3 pb-3 pt-2 mt-1">
                <button
                  type="button"
                  onClick={() => { onChange(''); setOpen(false) }}
                  className="text-xs font-medium text-green-600 hover:underline"
                >
                  Clear
                </button>
                <button
                  type="button"
                  onClick={() => handleSelect(new Date())}
                  className="text-xs font-medium text-green-600 hover:underline"
                >
                  Today
                </button>
              </div>
            }
          />
        </Popover.Content>
      </Popover.Portal>
    </Popover.Root>
  )
}
