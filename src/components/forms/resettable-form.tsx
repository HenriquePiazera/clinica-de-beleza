'use client'

import { useEffect, useRef } from 'react'
import type { ComponentProps, ReactNode } from 'react'

type ResettableFormProps = Omit<ComponentProps<'form'>, 'action'> & {
  formKey?: string
  action: NonNullable<ComponentProps<'form'>['action']>
  children: ReactNode
}

export function ResettableForm({
  formKey,
  children,
  ...props
}: ResettableFormProps) {
  const formRef = useRef<HTMLFormElement>(null)
  const key = formKey ?? 'initial'
  const previousKey = useRef<string | null>(null)

  useEffect(() => {
    if (previousKey.current !== null && previousKey.current !== key) {
      formRef.current?.reset()
    }
    previousKey.current = key
  }, [key])

  return (
    <form ref={formRef} key={key} {...props}>
      {children}
    </form>
  )
}
