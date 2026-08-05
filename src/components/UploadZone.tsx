import { useRef, useState, type DragEvent, type ChangeEvent } from 'react'

interface UploadZoneProps {
  label: string
  hint: string
  accept?: string
  multiple?: boolean
  onFiles: (files: File[]) => void
}

export function UploadZone({
  label,
  hint,
  accept = 'image/png,image/jpeg,image/webp,image/gif',
  multiple = false,
  onFiles,
}: UploadZoneProps) {
  const inputRef = useRef<HTMLInputElement>(null)
  const [dragging, setDragging] = useState(false)

  const handleFiles = (list: FileList | null) => {
    if (!list?.length) return
    onFiles(Array.from(list))
  }

  const onDrop = (e: DragEvent) => {
    e.preventDefault()
    setDragging(false)
    handleFiles(e.dataTransfer.files)
  }

  const onChange = (e: ChangeEvent<HTMLInputElement>) => {
    handleFiles(e.target.files)
    e.target.value = ''
  }

  return (
    <button
      type="button"
      className={`upload-zone ${dragging ? 'dragging' : ''}`}
      onClick={() => inputRef.current?.click()}
      onDragOver={(e) => {
        e.preventDefault()
        setDragging(true)
      }}
      onDragLeave={() => setDragging(false)}
      onDrop={onDrop}
    >
      <span className="upload-icon" aria-hidden>
        <svg width="36" height="36" viewBox="0 0 36 36" fill="none">
          <rect x="4" y="8" width="28" height="22" rx="3" stroke="currentColor" strokeWidth="2" />
          <path d="M12 22l4-5 3 4 5-7 6 8" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
          <circle cx="13" cy="15" r="2" fill="currentColor" />
        </svg>
      </span>
      <span className="upload-label">{label}</span>
      <span className="upload-hint">{hint}</span>
      <input
        ref={inputRef}
        type="file"
        accept={accept}
        multiple={multiple}
        hidden
        onChange={onChange}
      />
    </button>
  )
}
