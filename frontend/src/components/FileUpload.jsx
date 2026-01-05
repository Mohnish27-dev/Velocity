import { useCallback } from 'react'
import { useDropzone } from 'react-dropzone'
import { Upload, FileText } from 'lucide-react'

export default function FileUpload({ onFileSelect, disabled = false }) {
  const onDrop = useCallback((acceptedFiles) => {
    if (acceptedFiles.length > 0) {
      onFileSelect(acceptedFiles[0])
    }
  }, [onFileSelect])

  const { getRootProps, getInputProps, isDragActive } = useDropzone({
    onDrop,
    accept: {
      'application/pdf': ['.pdf']
    },
    maxFiles: 1,
    maxSize: 5 * 1024 * 1024, // 5MB
    disabled
  })

  return (
    <div
      {...getRootProps()}
      className={`
        border-2 border-dashed rounded-xl p-12 text-center cursor-pointer
        transition-all duration-300
        ${isDragActive 
          ? 'border-indigo-500 bg-indigo-500/10' 
          : 'border-neutral-700 hover:border-neutral-600 bg-neutral-800/30 hover:bg-neutral-800/50'}
        ${disabled ? 'opacity-50 cursor-not-allowed' : ''}
      `}
    >
      <input {...getInputProps()} />
      <div className="flex flex-col items-center">
        <div className={`w-16 h-16 rounded-full flex items-center justify-center mb-4 transition-colors ${
          isDragActive ? 'bg-indigo-500/20' : 'bg-neutral-800'
        }`}>
          {isDragActive ? (
            <FileText className="w-8 h-8 text-indigo-400" />
          ) : (
            <Upload className="w-8 h-8 text-neutral-500" />
          )}
        </div>
        {isDragActive ? (
          <p className="text-lg font-medium text-indigo-400">Drop the PDF file here...</p>
        ) : (
          <>
            <p className="text-lg font-medium text-white mb-1">Drag & drop your resume PDF here</p>
            <p className="text-sm text-neutral-500 mb-4">or click to browse</p>
            <div className="inline-flex items-center gap-2 px-4 py-2 bg-neutral-800 rounded-lg">
              <FileText className="w-4 h-4 text-neutral-500" />
              <span className="text-xs text-neutral-500">PDF files only • Max 5MB</span>
            </div>
          </>
        )}
      </div>
    </div>
  )
}
