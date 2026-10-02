import { FileSpreadsheet, Printer, Upload } from 'lucide-react'
import { Button, useToast } from '@/components/ui'

/** Import / Export / Print buttons shared by inventory and report screens. */
export function TableActions({ importable, printable = false }: { importable?: boolean; printable?: boolean }) {
  const toast = useToast()
  return (
    <>
      {importable && (
        <Button size="sm" icon={<Upload className="size-4" />} onClick={() => toast.demo('Excel import with column mapping is available in the production version.')}>
          Import
        </Button>
      )}
      <Button size="sm" icon={<FileSpreadsheet className="size-4" />} onClick={() => toast.demo('Demo: Excel export will be available in the production version.')}>
        Export
      </Button>
      {printable && (
        <Button size="sm" icon={<Printer className="size-4" />} onClick={() => toast.demo('Demo: Printing will be available in the production version.')}>
          Print
        </Button>
      )}
    </>
  )
}
