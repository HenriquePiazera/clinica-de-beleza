'use client'

import { useState, useTransition } from 'react'
import { Button } from '@/components/ui/button'
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@/components/ui/dialog'

type DestructiveActionButtonProps = {
  action: () => Promise<void>
  buttonLabel: string
  title: string
  description: string
  variant?: 'destructive' | 'outline'
  className?: string
}

export function DestructiveActionButton({
  action,
  buttonLabel,
  title,
  description,
  variant = 'destructive',
  className,
}: DestructiveActionButtonProps) {
  const [open, setOpen] = useState(false)
  const [isPending, startTransition] = useTransition()

  function handleConfirm() {
    startTransition(async () => {
      await action()
      setOpen(false)
    })
  }

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button
          type="button"
          variant={variant}
          className={className ?? 'min-h-11 w-full'}
          disabled={isPending}
        >
          {buttonLabel}
        </Button>
      </DialogTrigger>
      <DialogContent className="max-w-[calc(100vw-2rem)] sm:max-w-lg">
        <DialogHeader>
          <DialogTitle>{title}</DialogTitle>
          <DialogDescription>{description}</DialogDescription>
        </DialogHeader>
        <DialogFooter className="gap-2 sm:gap-0">
          <Button
            type="button"
            variant="outline"
            className="min-h-11"
            onClick={() => setOpen(false)}
            disabled={isPending}
          >
            Voltar
          </Button>
          <Button
            type="button"
            variant="destructive"
            className="min-h-11"
            onClick={handleConfirm}
            disabled={isPending}
          >
            {isPending ? 'Aguarde...' : 'Confirmar'}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}
