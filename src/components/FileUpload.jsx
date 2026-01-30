import React, { useRef, useState } from 'react';
import { Upload, X, FileText } from 'lucide-react';

const FileUpload = ({ label, accept = "image/*,.pdf", required = false, onFileSelect }) => {
    const [file, setFile] = useState(null);
    const inputRef = useRef(null);

    const handleFileChange = (e) => {
        if (e.target.files && e.target.files[0]) {
            const selectedFile = e.target.files[0];
            setFile(selectedFile);
            if (onFileSelect) onFileSelect(selectedFile);
        }
    };

    const clearFile = () => {
        setFile(null);
        if (inputRef.current) inputRef.current.value = '';
        if (onFileSelect) onFileSelect(null);
    };

    return (
        <div className="mb-4">
            <label className="block text-xs font-semibold text-slate-700 mb-2 uppercase tracking-wide">
                {label} {required && <span className="text-red-500">*</span>}
            </label>

            {!file ? (
                <div
                    onClick={() => inputRef.current?.click()}
                    className="group mt-1 flex flex-col items-center justify-center px-6 pt-6 pb-6 border-2 border-dashed border-slate-300 rounded-xl cursor-pointer hover:border-brand-teal hover:bg-brand-teal/5 transition-all h-32"
                >
                    <div className="bg-slate-100 p-2 rounded-full mb-2 group-hover:bg-brand-teal/10 transition-colors">
                        <Upload className="h-6 w-6 text-slate-400 group-hover:text-brand-teal transition-colors" />
                    </div>
                    <p className="text-sm font-medium text-slate-600 group-hover:text-brand-teal transition-colors">Click to upload or drag & drop</p>
                </div>
            ) : (
                <div className="mt-1 flex items-center justify-between p-3 border border-brand-teal/20 rounded-xl bg-brand-teal/5">
                    <div className="flex items-center space-x-3 overflow-hidden">
                        <div className="h-10 w-10 bg-brand-teal/10 rounded-lg flex items-center justify-center flex-shrink-0">
                            <FileText className="h-5 w-5 text-brand-teal" />
                        </div>
                        <div className="min-w-0">
                            <p className="text-sm font-medium text-slate-900 truncate">{file.name}</p>
                            <p className="text-xs text-slate-500">Ready to upload</p>
                        </div>
                    </div>
                    <button
                        type="button"
                        onClick={clearFile}
                        className="text-slate-400 hover:text-red-500 p-2 transition-colors rounded-full hover:bg-white"
                    >
                        <X className="h-4 w-4" />
                    </button>
                </div>
            )}

            <input
                ref={inputRef}
                type="file"
                className="hidden"
                accept={accept}
                onChange={handleFileChange}
            />
        </div>
    );
};

export default FileUpload;
