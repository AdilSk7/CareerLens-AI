import { useState, useRef } from 'react';
import type { ChangeEvent } from 'react';
import { Paperclip, FileText, X, Loader2, CheckCircle2, AlertCircle } from 'lucide-react';
import { useAuth } from '../contexts/AuthContext';

interface JobDescriptionInputProps {
  value: string;
  onChange: (value: string) => void;
  placeholder?: string;
}

export function JobDescriptionInput({ value, onChange, placeholder }: JobDescriptionInputProps) {
  const { currentUser } = useAuth();
  const [isUploading, setIsUploading] = useState(false);
  const [uploadError, setUploadError] = useState("");
  const [filename, setFilename] = useState("");
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleFileChange = async (e: ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    if (file.size > 10 * 1024 * 1024) {
      setUploadError("File is too large. Maximum size is 10MB.");
      if (fileInputRef.current) fileInputRef.current.value = '';
      return;
    }

    const ext = file.name.split('.').pop()?.toLowerCase();
    if (!['pdf', 'docx', 'pptx', 'txt'].includes(ext || '')) {
       setUploadError("Unsupported file type. Please upload a PDF, DOCX, PPTX, or TXT file.");
       if (fileInputRef.current) fileInputRef.current.value = '';
       return;
    }

    setUploadError("");
    setIsUploading(true);

    try {
      const token = await currentUser?.getIdToken();
      const formData = new FormData();
      formData.append("file", file);

      const res = await fetch(`${import.meta.env.VITE_API_BASE_URL}/api/job-description/extract`, {
        method: "POST",
        headers: {
          "Authorization": `Bearer ${token}`
        },
        body: formData
      });

      const data = await res.json();
      if (!res.ok) {
        throw new Error(data.detail || "Failed to extract job description");
      }

      setFilename(file.name);
      onChange(data.data.extracted_text);
    } catch (err: any) {
      setUploadError(err.message);
    } finally {
      setIsUploading(false);
      if (fileInputRef.current) fileInputRef.current.value = '';
    }
  };

  const removeFile = () => {
    setFilename("");
  };

  return (
    <div className="w-full flex flex-col gap-3">
      {/* File Upload Status Banner */}
      {isUploading ? (
        <div className="flex items-center gap-3 p-3 bg-indigo-50 dark:bg-indigo-900/20 border border-indigo-100 dark:border-indigo-900/50 rounded-lg text-indigo-700 dark:text-indigo-400">
           <Loader2 className="w-5 h-5 animate-spin" />
           <span className="text-sm font-medium">Extracting job description...</span>
        </div>
      ) : uploadError ? (
        <div className="flex items-start gap-3 p-3 bg-red-50 dark:bg-red-900/20 border border-red-100 dark:border-red-900/50 rounded-lg text-red-700 dark:text-red-400">
           <AlertCircle className="w-5 h-5 flex-shrink-0 mt-0.5" />
           <div className="text-sm font-medium flex-1">
             <p>{uploadError}</p>
             <p className="text-xs opacity-80 mt-1">Please paste the Job Description manually or try another file.</p>
           </div>
           <button type="button" onClick={() => setUploadError("")} className="ml-auto p-1 hover:bg-black/5 dark:hover:bg-white/10 rounded-md transition-colors"><X className="w-4 h-4"/></button>
        </div>
      ) : filename ? (
        <div className="flex items-center justify-between p-3 bg-green-50 dark:bg-green-900/20 border border-green-100 dark:border-green-900/50 rounded-lg">
           <div className="flex items-center gap-3 text-green-700 dark:text-green-400">
             <FileText className="w-5 h-5" />
             <div className="text-sm font-medium">
               <span className="flex items-center gap-2 line-clamp-1">{filename} <CheckCircle2 className="w-4 h-4 flex-shrink-0" /></span>
             </div>
           </div>
           <div className="flex items-center gap-2 flex-shrink-0">
             <button type="button" onClick={() => fileInputRef.current?.click()} className="text-xs font-bold text-green-700 dark:text-green-400 hover:opacity-70 px-2 py-1">
               Replace
             </button>
             <button type="button" onClick={removeFile} className="text-xs font-bold text-slate-500 hover:text-slate-800 dark:text-slate-400 dark:hover:text-slate-200 px-2 py-1">
               Remove
             </button>
           </div>
        </div>
      ) : null}

      {/* Main Text Area + Overlay for dragging / upload */}
      <div className="relative w-full rounded-xl border border-slate-200 dark:border-[#24334A] bg-slate-50 dark:bg-[#142038] overflow-hidden focus-within:border-indigo-500 focus-within:ring-1 focus-within:ring-indigo-500 transition-shadow">
        <textarea 
          className="w-full p-4 bg-transparent dark:text-white focus:outline-none min-h-[160px] resize-y"
          value={value}
          onChange={(e) => onChange(e.target.value)}
          placeholder={placeholder || "Paste or type the job description here..."}
        />
        
        {/* We place the "OR Upload" area at the bottom inside the text area container */}
        <div className="border-t border-slate-200/60 dark:border-[#24334A] bg-slate-100/50 dark:bg-[#0B1220] p-3 flex flex-col sm:flex-row items-center justify-between gap-3 text-sm text-slate-500 dark:text-slate-400">
           <div className="flex items-center gap-2 font-medium">
             <span className="hidden sm:inline">Prefer a document?</span>
           </div>
           
           <input 
             type="file" 
             ref={fileInputRef} 
             onChange={handleFileChange} 
             accept=".pdf,.docx,.pptx,.txt" 
             className="hidden" 
           />
           <button 
             onClick={() => fileInputRef.current?.click()}
             type="button"
             className="w-full sm:w-auto inline-flex items-center justify-center gap-2 px-4 py-2 bg-white dark:bg-[#1C2A44] border border-slate-200 dark:border-[#2F4160] hover:bg-slate-50 dark:hover:bg-[#253655] hover:border-slate-300 dark:hover:border-[#3D557B] rounded-lg shadow-sm font-semibold transition-all dark:text-white"
           >
             <Paperclip className="w-4 h-4" />
             Upload JD (.pdf, .docx, .pptx, .txt)
           </button>
        </div>
      </div>
    </div>
  );
}
