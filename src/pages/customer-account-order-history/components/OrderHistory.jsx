import React, { useState } from 'react';
import Icon from '../../../components/AppIcon';
import Image from '../../../components/AppImage';
import Button from '../../../components/ui/Button';
import Input from '../../../components/ui/Input';

const OrderHistory = ({ 
  orders, 
  onReorder, 
  onViewDetails,
  primaryColor = '#2563EB' 
}) => {
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState('all');
  const [dateFilter, setDateFilter] = useState('all');

  const statusColors = {
    delivered: 'text-success bg-success/10',
    cancelled: 'text-error bg-error/10',
    preparing: 'text-warning bg-warning/10',
    'out-for-delivery': 'text-primary bg-primary/10'
  };

  const statusLabels = {
    delivered: 'Entregue',
    cancelled: 'Cancelado',
    preparing: 'Preparando',
    'out-for-delivery': 'Saiu para entrega'
  };

  const filteredOrders = orders?.filter(order => {
    const matchesSearch = order?.restaurant?.name?.toLowerCase()?.includes(searchTerm?.toLowerCase()) ||
                         order?.items?.some(item => item?.name?.toLowerCase()?.includes(searchTerm?.toLowerCase()));
    
    const matchesStatus = statusFilter === 'all' || order?.status === statusFilter;
    
    const matchesDate = dateFilter === 'all' || (() => {
      const orderDate = new Date(order.date);
      const now = new Date();
      const diffTime = Math.abs(now - orderDate);
      const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
      
      switch (dateFilter) {
        case 'week': return diffDays <= 7;
        case 'month': return diffDays <= 30;
        case '3months': return diffDays <= 90;
        default: return true;
      }
    })();

    return matchesSearch && matchesStatus && matchesDate;
  });

  const formatDate = (dateString) => {
    const date = new Date(dateString);
    return date?.toLocaleDateString('pt-BR', {
      day: '2-digit',
      month: '2-digit',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  const formatCurrency = (value) => {
    return new Intl.NumberFormat('pt-BR', {
      style: 'currency',
      currency: 'BRL'
    })?.format(value);
  };

  return (
    <div className="bg-card rounded-lg border border-border p-6">
      <div className="flex items-center justify-between mb-6">
        <h2 className="text-xl font-semibold text-foreground">Histórico de Pedidos</h2>
        <span className="text-sm text-muted-foreground">
          {filteredOrders?.length} pedido{filteredOrders?.length !== 1 ? 's' : ''}
        </span>
      </div>
      {/* Filters */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
        <Input
          type="search"
          placeholder="Buscar por restaurante ou prato..."
          value={searchTerm}
          onChange={(e) => setSearchTerm(e?.target?.value)}
          className="w-full"
        />
        
        <select
          value={statusFilter}
          onChange={(e) => setStatusFilter(e?.target?.value)}
          className="px-3 py-2 bg-input border border-border rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-primary focus:border-transparent"
        >
          <option value="all">Todos os status</option>
          <option value="delivered">Entregue</option>
          <option value="cancelled">Cancelado</option>
          <option value="preparing">Preparando</option>
          <option value="out-for-delivery">Saiu para entrega</option>
        </select>

        <select
          value={dateFilter}
          onChange={(e) => setDateFilter(e?.target?.value)}
          className="px-3 py-2 bg-input border border-border rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-primary focus:border-transparent"
        >
          <option value="all">Todos os períodos</option>
          <option value="week">Última semana</option>
          <option value="month">Último mês</option>
          <option value="3months">Últimos 3 meses</option>
        </select>
      </div>
      {/* Orders List */}
      <div className="space-y-4">
        {filteredOrders?.length === 0 ? (
          <div className="text-center py-12">
            <Icon name="ShoppingBag" size={48} className="text-muted-foreground mx-auto mb-4" />
            <h3 className="text-lg font-medium text-foreground mb-2">Nenhum pedido encontrado</h3>
            <p className="text-muted-foreground">
              {searchTerm || statusFilter !== 'all' || dateFilter !== 'all' ?'Tente ajustar os filtros de busca' :'Você ainda não fez nenhum pedido'
              }
            </p>
          </div>
        ) : (
          filteredOrders?.map((order) => (
            <div
              key={order?.id}
              className="border border-border rounded-lg p-4 hover:border-primary/50 transition-all duration-200"
            >
              <div className="flex items-start justify-between mb-3">
                <div className="flex items-center space-x-3">
                  <div className="w-12 h-12 rounded-lg overflow-hidden bg-muted flex-shrink-0">
                    <Image
                      src={order?.restaurant?.logo}
                      alt={order?.restaurant?.name}
                      className="w-full h-full object-cover"
                    />
                  </div>
                  <div>
                    <h3 className="font-medium text-foreground">{order?.restaurant?.name}</h3>
                    <p className="text-sm text-muted-foreground">
                      Pedido #{order?.id} • {formatDate(order?.date)}
                    </p>
                  </div>
                </div>

                <div className="flex items-center space-x-3">
                  <span className={`px-2 py-1 text-xs font-medium rounded-full ${statusColors?.[order?.status]}`}>
                    {statusLabels?.[order?.status]}
                  </span>
                  <span className="font-semibold text-foreground">
                    {formatCurrency(order?.total)}
                  </span>
                </div>
              </div>

              {/* Order Items Preview */}
              <div className="mb-3">
                <p className="text-sm text-muted-foreground">
                  {order?.items?.slice(0, 2)?.map(item => item?.name)?.join(', ')}
                  {order?.items?.length > 2 && ` e mais ${order?.items?.length - 2} item${order?.items?.length - 2 > 1 ? 's' : ''}`}
                </p>
              </div>

              {/* Action Buttons */}
              <div className="flex items-center justify-between pt-3 border-t border-border">
                <div className="flex items-center space-x-2">
                  <Button
                    variant="ghost"
                    size="sm"
                    iconName="Eye"
                    iconPosition="left"
                    onClick={() => onViewDetails(order)}
                  >
                    Ver detalhes
                  </Button>
                  
                  {order?.status === 'delivered' && (
                    <Button
                      variant="ghost"
                      size="sm"
                      iconName="RotateCcw"
                      iconPosition="left"
                      onClick={() => onReorder(order)}
                    >
                      Pedir novamente
                    </Button>
                  )}
                </div>

                <div className="flex items-center space-x-2">
                  {order?.rating ? (
                    <div className="flex items-center space-x-1">
                      <Icon name="Star" size={16} className="text-warning fill-current" />
                      <span className="text-sm font-medium">{order?.rating}</span>
                    </div>
                  ) : order?.status === 'delivered' && (
                    <Button
                      variant="outline"
                      size="sm"
                      iconName="Star"
                      iconPosition="left"
                    >
                      Avaliar
                    </Button>
                  )}
                  
                  {(order?.status === 'preparing' || order?.status === 'out-for-delivery') && (
                    <Button
                      variant="outline"
                      size="sm"
                      iconName="MapPin"
                      iconPosition="left"
                      style={{ borderColor: primaryColor, color: primaryColor }}
                    >
                      Rastrear
                    </Button>
                  )}
                </div>
              </div>
            </div>
          ))
        )}
      </div>
      {/* Load More Button */}
      {filteredOrders?.length > 0 && filteredOrders?.length >= 10 && (
        <div className="text-center mt-6">
          <Button variant="outline">
            Carregar mais pedidos
          </Button>
        </div>
      )}
    </div>
  );
};

export default OrderHistory;