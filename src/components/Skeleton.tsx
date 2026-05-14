import React from 'react';
import { cn } from '../lib/utils';

interface SkeletonProps {
  className?: string;
}

export const Skeleton: React.FC<SkeletonProps> = ({ className }) => {
  return (
    <div 
      className={cn(
        "animate-pulse rounded-md bg-gray-200", 
        className
      )} 
    />
  );
};

export const ProductCardSkeleton: React.FC = () => {
  return (
    <div className="rounded-3xl border border-gray-100 bg-white p-4 space-y-4">
      <Skeleton className="aspect-square w-full rounded-2xl" />
      <div className="space-y-3">
        <Skeleton className="h-6 w-3/4 rounded-lg" />
        <Skeleton className="h-4 w-1/4 rounded-lg" />
        <div className="pt-4 flex items-center justify-between">
          <div className="space-y-2">
            <Skeleton className="h-3 w-12 rounded-lg" />
            <Skeleton className="h-6 w-24 rounded-lg" />
          </div>
          <Skeleton className="h-12 w-12 rounded-2xl" />
        </div>
      </div>
    </div>
  );
};
