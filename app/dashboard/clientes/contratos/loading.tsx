export default function Loading() {
  return (
    <div className="min-h-screen bg-muted/30 flex items-center justify-center">
      <div className="flex flex-col items-center gap-4">
        <div className="w-8 h-8 border-4 border-primary border-t-transparent rounded-full animate-spin"></div>
        <p className="text-muted-foreground">Carregando...</p>
      </div>
    </div>
  )
}
