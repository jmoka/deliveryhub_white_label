import React from 'react';
import Icon from '../../../components/AppIcon';

const CategorySidebar = ({ 
  categories = [], 
  activeCategory = null, 
  onCategorySelect = () => {},
  className = '' 
}) => {
  return (
    <div className={`hidden lg:block w-64 bg-card border-r border-border ${className}`}>
      <div className="sticky top-24 p-6">
        <h2 className="text-lg font-semibold text-foreground mb-4">Categorias</h2>
        <nav className="space-y-2">
          <button
            onClick={() => onCategorySelect(null)}
            className={`w-full flex items-center justify-between px-4 py-3 rounded-lg text-left transition-all duration-200 ${
              activeCategory === null
                ? 'bg-primary text-primary-foreground shadow-sm'
                : 'text-muted-foreground hover:text-foreground hover:bg-muted'
            }`}
          >
            <div className="flex items-center space-x-3">
              <Icon name="Grid3X3" size={18} />
              <span className="font-medium">Todos os Itens</span>
            </div>
          </button>
          
          {categories?.map((category) => (
            <button
              key={category?.id}
              onClick={() => onCategorySelect(category?.id)}
              className={`w-full flex items-center justify-between px-4 py-3 rounded-lg text-left transition-all duration-200 ${
                activeCategory === category?.id
                  ? 'bg-primary text-primary-foreground shadow-sm'
                  : 'text-muted-foreground hover:text-foreground hover:bg-muted'
              }`}
            >
              <div className="flex items-center space-x-3">
                <Icon name={category?.icon || 'Package'} size={18} />
                <span className="font-medium">{category?.name}</span>
              </div>
              <span className="text-sm bg-muted text-muted-foreground px-2 py-1 rounded-full">
                {category?.itemCount}
              </span>
            </button>
          ))}
        </nav>
      </div>
    </div>
  );
};

export default CategorySidebar;