
import React, { useState, useEffect } from 'react'

export default function SourceSelector({ selected, onSelect }) {
  const [uploadedPdfs, setUploadedPdfs] = useState([])
  const [uploading, setUploading] = useState(false)

  const samples = [
    { name: 'NCERT Class XI Physics (sample)', path: '/pdfs/sample_ncert_class11_physics.pdf' },
  ]

  useEffect(() => {
    const stored = localStorage.getItem('uploadedPdfs')
    if (stored) {
      setUploadedPdfs(JSON.parse(stored))
    }
  }, [])

  const handleUpload = async (event) => {
    const file = event.target.files[0]
    if (!file) return

    setUploading(true)
    try {
      const reader = new FileReader()
      reader.onload = async () => {
        const base64 = reader.result.split(',')[1]
        const res = await fetch(`${process.env.NEXT_PUBLIC_BASE_PATH}/api/uploadPdf`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ fileName: file.name, fileData: base64 })
        })
        const data = await res.json()
        if (res.ok) {
          const newPdf = { name: file.name, path: data.path }
          const updated = [...uploadedPdfs, newPdf]
          setUploadedPdfs(updated)
          localStorage.setItem('uploadedPdfs', JSON.stringify(updated))
          onSelect(newPdf.path)  // Automatically select the newly uploaded PDF
        } else {
          alert('Upload failed: ' + data.error)
        }
      }
      reader.readAsDataURL(file)
    } catch (error) {
      console.error(error)
      alert('Upload failed')
    } finally {
      setUploading(false)
    }
  }

  return (
    <div className="bg-white p-4 rounded shadow">
      <h3 className="font-semibold mb-2">Source Selector</h3>
      <div className="space-y-2">
        <button onClick={()=> onSelect('all-uploaded')} className={`w-full text-left p-2 rounded ${selected==='all-uploaded'?'bg-indigo-50':''}`}>All uploaded PDFs</button>
        {samples.map(s => (
          <button key={s.path} onClick={()=> onSelect(s.path)} className={`w-full text-left p-2 rounded ${selected===s.path?'bg-indigo-50':''}`}>
            {s.name}
          </button>
        ))}
        {uploadedPdfs.map(s => (
          <div key={s.path} className="flex items-center justify-between w-full rounded hover:bg-gray-50 p-2">
            <button onClick={() => onSelect(s.path)} className={`text-left flex-1 ${selected === s.path ? 'bg-indigo-50' : ''}`}>
              {s.name} (uploaded)
            </button>
            <button
              onClick={() => {
                const updated = uploadedPdfs.filter(pdf => pdf.path !== s.path)
                setUploadedPdfs(updated)
                localStorage.setItem('uploadedPdfs', JSON.stringify(updated))
                if (selected === s.path) {
                  onSelect(null)
                }
              }}
              className="ml-2 text-red-600 hover:text-red-800"
              aria-label={`Delete ${s.name}`}
              title={`Delete ${s.name}`}
            >
              &#x2715;
            </button>
          </div>
        ))}
      </div>
      <div className="mt-3">
        <label className="block text-sm">Upload PDF</label>
        <input type="file" accept="application/pdf" onChange={handleUpload} className="mt-1" disabled={uploading} />
        <p className="text-xs text-gray-500 mt-1">{uploading ? 'Uploading...' : 'Upload your own PDF coursebook.'}</p>
      </div>
    </div>
  )
}
