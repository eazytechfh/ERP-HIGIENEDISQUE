"use client"

import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog"
import { Button } from "@/components/ui/button"
import { AlertTriangle, CheckCircle2, Loader2 } from "lucide-react"

export interface ConfirmDetailItem {
  label: string
  value: string
}

export interface ConfirmActionDialogProps {
  open: boolean
  title: string
  description?: string
  details?: ConfirmDetailItem[]
  /** Mensagem de alerta de possível duplicidade */
  warningMessage?: string
  confirmLabel?: string
  cancelLabel?: string
  isLoading?: boolean
  onConfirm: () => void
  onCancel: () => void
}

/**
 * Diálogo de confirmação reutilizável para ações que criam ou modificam registros.
 * Exibe um resumo dos dados que serão salvos e, se necessário, um aviso de duplicidade.
 */
export function ConfirmActionDialog({
  open,
  title,
  description,
  details,
  warningMessage,
  confirmLabel = "Confirmar",
  cancelLabel = "Cancelar",
  isLoading = false,
  onConfirm,
  onCancel,
}: ConfirmActionDialogProps) {
  return (
    <Dialog
      open={open}
      onOpenChange={(v) => {
        if (!v && !isLoading) onCancel()
      }}
    >
      <DialogContent className="max-w-md">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            {warningMessage ? (
              <AlertTriangle className="h-5 w-5 text-amber-500 shrink-0" />
            ) : (
              <CheckCircle2 className="h-5 w-5 text-green-600 shrink-0" />
            )}
            {title}
          </DialogTitle>
          {description && (
            <DialogDescription>{description}</DialogDescription>
          )}
        </DialogHeader>

        {details && details.length > 0 && (
          <div className="rounded-lg border bg-muted/40 divide-y text-sm">
            {details.map((item, i) => (
              <div
                key={i}
                className="flex items-start justify-between px-3 py-2 gap-4"
              >
                <span className="text-muted-foreground shrink-0">{item.label}</span>
                <span className="font-medium text-right break-words max-w-[60%]">
                  {item.value || "—"}
                </span>
              </div>
            ))}
          </div>
        )}

        {warningMessage && (
          <div className="flex items-start gap-2 rounded-lg border border-amber-200 bg-amber-50 px-3 py-2.5 text-sm text-amber-800">
            <AlertTriangle className="h-4 w-4 mt-0.5 shrink-0" />
            <span>{warningMessage}</span>
          </div>
        )}

        <DialogFooter className="gap-2 sm:gap-0">
          <Button variant="outline" onClick={onCancel} disabled={isLoading}>
            {cancelLabel}
          </Button>
          <Button onClick={onConfirm} disabled={isLoading}>
            {isLoading && <Loader2 className="h-4 w-4 mr-2 animate-spin" />}
            {confirmLabel}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}
