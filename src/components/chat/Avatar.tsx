import { cn } from '@/lib/utils';

interface AvatarProps {
  src: string;
  alt: string;
  size?: 'sm' | 'md' | 'lg';
  isOnline?: boolean;
  showStatus?: boolean;
  className?: string;
}

const sizeClasses = {
  sm: 'w-8 h-8',
  md: 'w-10 h-10',
  lg: 'w-12 h-12',
};

const statusSizeClasses = {
  sm: 'w-2 h-2 border-[1.5px]',
  md: 'w-2.5 h-2.5 border-2',
  lg: 'w-3 h-3 border-2',
};

export function Avatar({ 
  src, 
  alt, 
  size = 'md', 
  isOnline = false,
  showStatus = false,
  className 
}: AvatarProps) {
  return (
    <div className={cn('relative flex-shrink-0', className)} onClick={className?.includes('cursor-pointer') ? undefined : undefined}>
      <img
        src={src}
        alt={alt}
        className={cn(
          sizeClasses[size],
          'rounded-full object-cover bg-muted'
        )}
      />
      {showStatus && (
        <span
          className={cn(
            'absolute bottom-0 right-0 rounded-full border-background',
            statusSizeClasses[size],
            isOnline ? 'bg-status-online' : 'bg-status-offline'
          )}
          style={{
            transform: 'translate(0%, 0%)'
          }}
        />
      )}
    </div>
  );
}
