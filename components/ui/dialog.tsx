"use client"

import * as React from "react"
import { X } from "lucide-react"

import { cn } from "@/lib/utils"

const CLOSE_DURATION = 150

function Dialog({
  children,
  open,
  onOpenChange,
}: {
  children: React.ReactNode
  open?: boolean
  onOpenChange?: (open: boolean) => void
}) {
  const [mounted, setMounted] = React.useState(open ?? false)
  const [closing, setClosing] = React.useState(false)

  React.useEffect(() => {
    if (open) {
      setClosing(false)
      setMounted(true)
    } else if (mounted) {
      setClosing(true)
      const t = setTimeout(() => {
        setMounted(false)
        setClosing(false)
      }, CLOSE_DURATION)
      return () => clearTimeout(t)
    }
  }, [open])

  if (!mounted) return null
  return (
    <DialogContext.Provider value={{ closing, onClose: () => onOpenChange?.(false) }}>
      {children}
    </DialogContext.Provider>
  )
}

const DialogContext = React.createContext<{ closing: boolean; onClose: () => void }>({
  closing: false,
  onClose: () => {},
})

function DialogPortal({ children }: { children: React.ReactNode }) {
  return <>{children}</>
}

function DialogOverlay({ className, onClick, ...props }: React.HTMLAttributes<HTMLDivElement>) {
  const { closing } = React.useContext(DialogContext)
  return (
    <div
      className={cn(
        "fixed inset-0 z-50 bg-black/50",
        closing ? "animate-dialog-overlay-out" : "animate-dialog-overlay-in",
        className
      )}
      {...props}
    />
  )
}

function DialogContent({
  className,
  children,
  onClose,
  showClose = true,
  ...props
}: React.HTMLAttributes<HTMLDivElement> & { onClose?: () => void; showClose?: boolean }) {
  const { closing, onClose: ctxClose } = React.useContext(DialogContext)
  const handleClose = onClose ?? ctxClose
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      <DialogOverlay onClick={showClose ? handleClose : undefined} />
      <div
        role="dialog"
        aria-modal="true"
        className={cn(
          "relative z-50 w-full max-w-md rounded-lg bg-card p-6 shadow-xl border border-border",
          closing ? "animate-dialog-content-out" : "animate-dialog-content-in",
          className
        )}
        {...props}
      >
        {showClose && (
          <button
            type="button"
            onClick={handleClose}
            className="absolute right-4 top-4 rounded-sm text-muted-foreground opacity-70 transition-opacity hover:opacity-100"
            aria-label="Close"
          >
            <X className="h-4 w-4" />
          </button>
        )}
        {children}
      </div>
    </div>
  )
}

function DialogHeader({ className, ...props }: React.HTMLAttributes<HTMLDivElement>) {
  return (
    <div className={cn("flex flex-col space-y-1.5 mb-4", className)} {...props} />
  )
}

function DialogFooter({ className, ...props }: React.HTMLAttributes<HTMLDivElement>) {
  return (
    <div className={cn("flex justify-end gap-2 mt-4", className)} {...props} />
  )
}

function DialogTitle({ className, ...props }: React.HTMLAttributes<HTMLHeadingElement>) {
  return (
    <h2 className={cn("text-base font-semibold text-foreground", className)} {...props} />
  )
}

function DialogDescription({ className, ...props }: React.HTMLAttributes<HTMLParagraphElement>) {
  return (
    <p className={cn("text-sm text-muted-foreground", className)} {...props} />
  )
}

export {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogOverlay,
  DialogPortal,
  DialogTitle,
}
