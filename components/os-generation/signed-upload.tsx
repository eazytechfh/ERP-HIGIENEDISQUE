"use client"

import { useRef } from "react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Upload, FileText, CheckCircle, X, Image as ImageIcon } from "lucide-react"

type SignedUploadProps = {
  arquivo: File | null
  onUpload: (file: File) => void
  onRemove: () => void
}

export function SignedUpload({ arquivo, onUpload, onRemove }: SignedUploadProps) {
  const inputRef = useRef<HTMLInputElement>(null)

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (file) {
      const validTypes = ['application/pdf', 'image/jpeg', 'image/png']
      if (validTypes.includes(file.type)) {
        onUpload(file)
      }
    }
  }

  const getFileIcon = (type: string) => {
    if (type === 'application/pdf') return <FileText className="h-5 w-5 text-red-500" />
    return <ImageIcon className="h-5 w-5 text-blue-500" />
  }

  return (
    <Card>
      <CardHeader className="pb-4">
        <CardTitle className="flex items-center gap-2">
          <Upload className="h-5 w-5 text-primary" />
          Upload da OS Assinada (Pos-Execucao)
        </CardTitle>
      </CardHeader>
      <CardContent>
        <div className="space-y-4">
          <p className="text-sm text-muted-foreground">
            Apos a execucao do servico, faca upload da OS assinada e digitalizada pelo cliente.
          </p>

          {arquivo ? (
            <div className="p-4 border rounded-lg bg-green-50 dark:bg-green-950/20 border-green-200 dark:border-green-800">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-3">
                  {getFileIcon(arquivo.type)}
                  <div>
                    <p className="font-medium text-sm">{arquivo.name}</p>
                    <p className="text-xs text-muted-foreground">
                      {(arquivo.size / 1024).toFixed(1)} KB
                    </p>
                  </div>
                  <Badge variant="default" className="ml-2">
                    <CheckCircle className="h-3 w-3 mr-1" />
                    Anexado
                  </Badge>
                </div>
                <Button
                  type="button"
                  variant="ghost"
                  size="sm"
                  onClick={onRemove}
                  className="text-destructive hover:text-destructive"
                >
                  <X className="h-4 w-4" />
                </Button>
              </div>
            </div>
          ) : (
            <div
              onClick={() => inputRef.current?.click()}
              className="border-2 border-dashed rounded-lg p-8 text-center cursor-pointer hover:border-primary/50 hover:bg-muted/30 transition-colors"
            >
              <Upload className="h-10 w-10 mx-auto text-muted-foreground mb-3" />
              <p className="font-medium mb-1">Clique para fazer upload</p>
              <p className="text-sm text-muted-foreground">
                Formatos aceitos: PDF, JPG, PNG
              </p>
            </div>
          )}

          <input
            ref={inputRef}
            type="file"
            accept=".pdf,.jpg,.jpeg,.png"
            onChange={handleFileChange}
            className="hidden"
          />

          <div className="p-3 bg-muted/50 rounded-lg text-sm text-muted-foreground">
            <p className="font-medium mb-1">Instrucoes:</p>
            <ol className="list-decimal list-inside space-y-1">
              <li>Imprima a OS antes de ir ao local de atendimento</li>
              <li>Colha a assinatura do cliente apos a execucao</li>
              <li>Digitalize ou fotografe a OS assinada</li>
              <li>Faca o upload do arquivo aqui</li>
            </ol>
          </div>
        </div>
      </CardContent>
    </Card>
  )
}
