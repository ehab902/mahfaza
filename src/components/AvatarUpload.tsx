import React, { useState, useRef } from 'react';
import { Camera, X, Loader2 } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';

interface AvatarUploadProps {
  currentAvatar?: string;
  onImageSelect: (file: File) => void;
  onImageRemove: () => void;
  uploading?: boolean;
  agentName?: string;
}

export function AvatarUpload({
  currentAvatar,
  onImageSelect,
  onImageRemove,
  uploading = false,
  agentName = ''
}: AvatarUploadProps) {
  const [preview, setPreview] = useState<string | null>(currentAvatar || null);
  const [hovering, setHovering] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      const reader = new FileReader();
      reader.onloadend = () => {
        setPreview(reader.result as string);
      };
      reader.readAsDataURL(file);
      onImageSelect(file);
    }
  };

  const handleRemove = (e: React.MouseEvent) => {
    e.stopPropagation();
    setPreview(null);
    onImageRemove();
    if (fileInputRef.current) {
      fileInputRef.current.value = '';
    }
  };

  const handleClick = () => {
    if (!uploading) {
      fileInputRef.current?.click();
    }
  };

  const getInitial = () => {
    return agentName ? agentName.charAt(0).toUpperCase() : 'A';
  };

  return (
    <div className="flex flex-col items-center gap-3">
      <div
        className="relative group cursor-pointer"
        onClick={handleClick}
        onMouseEnter={() => setHovering(true)}
        onMouseLeave={() => setHovering(false)}
      >
        <div className="w-32 h-32 rounded-full overflow-hidden border-4 border-lime-accent/30 shadow-lg relative">
          {preview ? (
            <img
              src={preview}
              alt="Avatar"
              className="w-full h-full object-cover"
            />
          ) : (
            <div className="w-full h-full bg-gradient-to-br from-lime-accent to-lime-500 flex items-center justify-center">
              <span className="text-4xl font-bold text-dark-text">
                {getInitial()}
              </span>
            </div>
          )}

          <AnimatePresence>
            {hovering && !uploading && (
              <motion.div
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
                className="absolute inset-0 bg-black/60 flex items-center justify-center"
              >
                <Camera className="w-8 h-8 text-white" />
              </motion.div>
            )}
          </AnimatePresence>

          {uploading && (
            <div className="absolute inset-0 bg-black/60 flex items-center justify-center">
              <Loader2 className="w-8 h-8 text-white animate-spin" />
            </div>
          )}
        </div>

        {preview && !uploading && hovering && (
          <button
            onClick={handleRemove}
            className="absolute -top-2 -right-2 w-8 h-8 bg-red-500 hover:bg-red-600 rounded-full flex items-center justify-center shadow-lg transition-colors z-10"
          >
            <X className="w-4 h-4 text-white" />
          </button>
        )}

        <input
          ref={fileInputRef}
          type="file"
          accept="image/jpeg,image/jpg,image/png,image/webp"
          onChange={handleFileSelect}
          className="hidden"
          disabled={uploading}
        />
      </div>

      <div className="text-center">
        <p className="text-sm text-light-text-secondary dark:text-dark-text-secondary">
          {uploading ? 'جاري رفع الصورة...' : 'انقر لرفع صورة الوكيل'}
        </p>
        <p className="text-xs text-light-text-secondary dark:text-dark-text-secondary mt-1">
          JPG، PNG أو WebP (الحد الأقصى 2MB)
        </p>
      </div>
    </div>
  );
}
