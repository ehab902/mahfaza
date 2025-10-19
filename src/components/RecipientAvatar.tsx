import React, { useState } from 'react';
import { User } from 'lucide-react';

interface RecipientAvatarProps {
  name: string;
  avatarUrl?: string | null;
  size?: 'sm' | 'md' | 'lg';
  className?: string;
}

export const RecipientAvatar: React.FC<RecipientAvatarProps> = ({
  name,
  avatarUrl,
  size = 'md',
  className = ''
}) => {
  const [imageError, setImageError] = useState(false);

  const getInitials = () => {
    const words = name.trim().split(' ');
    if (words.length >= 2) {
      return (words[0][0] + words[1][0]).toUpperCase();
    }
    return name.substring(0, 2).toUpperCase();
  };

  const sizeClasses = {
    sm: 'w-8 h-8 text-xs',
    md: 'w-12 h-12 text-sm',
    lg: 'w-16 h-16 text-base'
  };

  const iconSizes = {
    sm: 16,
    md: 20,
    lg: 24
  };

  if (avatarUrl && !imageError) {
    return (
      <img
        src={avatarUrl}
        alt={name}
        className={`${sizeClasses[size]} rounded-full object-cover ${className}`}
        onError={() => setImageError(true)}
      />
    );
  }

  return (
    <div
      className={`${sizeClasses[size]} rounded-full bg-gradient-to-br from-lime-accent/20 to-lime-accent/10 border border-lime-accent/30 flex items-center justify-center ${className}`}
    >
      {name ? (
        <span className="font-medium text-lime-accent">
          {getInitials()}
        </span>
      ) : (
        <User size={iconSizes[size]} className="text-lime-accent/60" />
      )}
    </div>
  );
};
