import React from 'react';

const ProductSkeleton = ({ count = 6, className = '' }) => {
  return (
    <div className={`grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4 ${className}`}>
      {Array.from({ length: count })?.map((_, index) => (
        <div key={index} className="bg-card rounded-lg border border-border overflow-hidden animate-pulse">
          <div className="aspect-[4/3] bg-muted"></div>
          <div className="p-4">
            <div className="h-4 bg-muted rounded mb-2"></div>
            <div className="h-3 bg-muted rounded mb-3 w-3/4"></div>
            <div className="flex items-center justify-between">
              <div className="h-5 bg-muted rounded w-16"></div>
              <div className="h-8 bg-muted rounded w-20"></div>
            </div>
          </div>
        </div>
      ))}
    </div>
  );
};

export default ProductSkeleton;