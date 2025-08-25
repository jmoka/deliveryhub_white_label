import React from 'react';

const CategoryChips = ({ 
  categories = [], 
  activeCategory = null, 
  onCategorySelect = () => {},
  className = '' 
}) => {
  return (
    <div className={`sticky top-20 md:top-24 z-40 bg-card border-b border-border ${className}`}>
      <div className="px-4 py-3">
        <div className="flex space-x-2 overflow-x-auto scrollbar-hide">
          <button
            onClick={() => onCategorySelect(null)}
            className={`flex-shrink-0 px-4 py-2 rounded-full text-sm font-medium transition-all duration-200 ${
              activeCategory === null
                ? 'bg-primary text-primary-foreground shadow-sm'
                : 'bg-muted text-muted-foreground hover:bg-muted/80'
            }`}
          >
            Todos
          </button>
          {categories?.map((category) => (
            <button
              key={category?.id}
              onClick={() => onCategorySelect(category?.id)}
              className={`flex-shrink-0 px-4 py-2 rounded-full text-sm font-medium transition-all duration-200 ${
                activeCategory === category?.id
                  ? 'bg-primary text-primary-foreground shadow-sm'
                  : 'bg-muted text-muted-foreground hover:bg-muted/80'
              }`}
            >
              {category?.name} ({category?.itemCount})
            </button>
          ))}
        </div>
      </div>
    </div>
  );
};

export default CategoryChips;