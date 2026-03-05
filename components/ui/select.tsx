"use client"

import * as SelectPrimitive from '@radix-ui/react-select'
import { Check, ChevronDown } from 'lucide-react'
import { cn } from '@/lib/utils'

const Select = SelectPrimitive.Root

const SelectTrigger = ({ className, ...props }: SelectPrimitive.SelectTriggerProps & { className?: string }) => (
  <SelectPrimitive.Trigger
    className={cn(
      'flex h-9 min-w-[120px] items-center justify-between rounded-md border border-border bg-background px-3 text-xs text-foreground shadow-sm outline-none',
      'focus-visible:ring-2 focus-visible:ring-green-500/70 focus-visible:ring-offset-2 focus-visible:ring-offset-background',
      'data-[placeholder]:text-muted-foreground',
      className,
    )}
    {...props}
  >
    <SelectPrimitive.Value />
    <SelectPrimitive.Icon asChild>
      <ChevronDown className="ml-2 h-3 w-3 text-muted-foreground" />
    </SelectPrimitive.Icon>
  </SelectPrimitive.Trigger>
)

const SelectContent = ({
  className,
  children,
  ...props
}: SelectPrimitive.SelectContentProps & { className?: string }) => (
  <SelectPrimitive.Portal>
    <SelectPrimitive.Content
      className={cn(
        'z-50 min-w-[8rem] overflow-hidden rounded-md border border-border bg-popover text-foreground shadow-lg',
        'data-[side=bottom]:animate-in data-[side=bottom]:fade-in-0 data-[side=bottom]:slide-in-from-top-1',
        'data-[side=top]:animate-in data-[side=top]:fade-in-0 data-[side=top]:slide-in-from-bottom-1',
        className,
      )}
      {...props}
    >
      <SelectPrimitive.Viewport className="p-1 text-xs">{children}</SelectPrimitive.Viewport>
    </SelectPrimitive.Content>
  </SelectPrimitive.Portal>
)

const SelectItem = ({
  className,
  children,
  ...props
}: SelectPrimitive.SelectItemProps & { className?: string }) => (
  <SelectPrimitive.Item
    className={cn(
      'relative flex w-full cursor-default select-none items-center rounded-sm px-2 py-1.5 text-xs outline-none',
      'focus:bg-muted focus:text-foreground data-[state=checked]:bg-green-500/10 data-[state=checked]:text-foreground',
      className,
    )}
    {...props}
  >
    <span className="absolute left-1.5 inline-flex h-3 w-3 items-center justify-center">
      <SelectPrimitive.ItemIndicator>
        <Check className="h-3 w-3" />
      </SelectPrimitive.ItemIndicator>
    </span>
    <SelectPrimitive.ItemText className="ml-4">{children}</SelectPrimitive.ItemText>
  </SelectPrimitive.Item>
)

const SelectValue = SelectPrimitive.Value

export { Select, SelectTrigger, SelectContent, SelectItem, SelectValue }

