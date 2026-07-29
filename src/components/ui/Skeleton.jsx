import React from 'react';

export const Skeleton = ({ className = '' }) => (
  <div className={`animate-pulse bg-[#E4E4E7] dark:bg-[#3F3F46] rounded-xl ${className}`} />
);

export const SkeletonRestauranteCard = () => (
  <div className="bg-white dark:bg-[#27272A] rounded-2xl overflow-hidden border border-[#E4E4E7] dark:border-[#3F3F46] animate-pulse">
    <div className="h-44 bg-[#F4F4F5] dark:bg-[#3F3F46]" />
    <div className="p-4 space-y-2.5">
      <div className="h-4 bg-[#E4E4E7] dark:bg-[#3F3F46] rounded-lg w-3/4" />
      <div className="h-3 bg-[#F4F4F5] dark:bg-[#3F3F46] rounded-lg w-1/2" />
      <div className="flex gap-2 mt-3">
        <div className="h-5 bg-[#F4F4F5] dark:bg-[#3F3F46] rounded-full w-20" />
        <div className="h-5 bg-[#F4F4F5] dark:bg-[#3F3F46] rounded-full w-24" />
      </div>
    </div>
  </div>
);

export const SkeletonProdutoCard = () => (
  <div className="flex gap-4 p-4 bg-white dark:bg-[#27272A] rounded-2xl border border-[#E4E4E7] dark:border-[#3F3F46] animate-pulse">
    <div className="flex-1 space-y-2.5">
      <div className="h-4 bg-[#E4E4E7] dark:bg-[#3F3F46] rounded-lg w-3/4" />
      <div className="h-3 bg-[#F4F4F5] dark:bg-[#3F3F46] rounded-lg w-full" />
      <div className="h-3 bg-[#F4F4F5] dark:bg-[#3F3F46] rounded-lg w-2/3" />
      <div className="h-7 bg-[#E4E4E7] dark:bg-[#3F3F46] rounded-xl w-24 mt-3" />
    </div>
    <div className="w-28 h-24 bg-[#F4F4F5] dark:bg-[#3F3F46] rounded-xl flex-shrink-0" />
  </div>
);

export default Skeleton;
