import React from 'react';
import Input from '../../../components/ui/Input';
import { Checkbox } from '../../../components/ui/Checkbox';

const OperatingHoursForm = ({ 
  formData, 
  onInputChange, 
  errors = {},
  className = '' 
}) => {
  const daysOfWeek = [
    { key: 'monday', label: 'Segunda-feira' },
    { key: 'tuesday', label: 'Terça-feira' },
    { key: 'wednesday', label: 'Quarta-feira' },
    { key: 'thursday', label: 'Quinta-feira' },
    { key: 'friday', label: 'Sexta-feira' },
    { key: 'saturday', label: 'Sábado' },
    { key: 'sunday', label: 'Domingo' }
  ];

  const handleDayToggle = (dayKey, checked) => {
    const updatedHours = {
      ...formData?.operatingHours,
      [dayKey]: {
        ...formData?.operatingHours?.[dayKey],
        isOpen: checked,
        openTime: checked ? (formData?.operatingHours?.[dayKey]?.openTime || '09:00') : '',
        closeTime: checked ? (formData?.operatingHours?.[dayKey]?.closeTime || '22:00') : ''
      }
    };
    
    onInputChange({ 
      target: { 
        name: 'operatingHours', 
        value: updatedHours 
      } 
    });
  };

  const handleTimeChange = (dayKey, timeType, value) => {
    const updatedHours = {
      ...formData?.operatingHours,
      [dayKey]: {
        ...formData?.operatingHours?.[dayKey],
        [timeType]: value
      }
    };
    
    onInputChange({ 
      target: { 
        name: 'operatingHours', 
        value: updatedHours 
      } 
    });
  };

  const copyToAllDays = (sourceDay) => {
    const sourceHours = formData?.operatingHours?.[sourceDay];
    if (!sourceHours) return;

    const updatedHours = { ...formData?.operatingHours };
    daysOfWeek?.forEach(day => {
      if (day?.key !== sourceDay) {
        updatedHours[day.key] = {
          isOpen: sourceHours?.isOpen,
          openTime: sourceHours?.openTime,
          closeTime: sourceHours?.closeTime
        };
      }
    });

    onInputChange({ 
      target: { 
        name: 'operatingHours', 
        value: updatedHours 
      } 
    });
  };

  return (
    <div className={`space-y-6 ${className}`}>
      <div className="border-b border-border pb-4">
        <h3 className="text-lg font-semibold text-foreground mb-2">
          Horário de Funcionamento
        </h3>
        <p className="text-sm text-muted-foreground">
          Configure os horários de funcionamento do seu estabelecimento
        </p>
      </div>
      <div className="space-y-4">
        {daysOfWeek?.map((day) => {
          const dayData = formData?.operatingHours?.[day?.key] || { isOpen: false, openTime: '', closeTime: '' };
          
          return (
            <div key={day?.key} className="bg-card border border-border rounded-lg p-4">
              <div className="flex flex-col md:flex-row md:items-center gap-4">
                <div className="flex items-center space-x-3 min-w-[200px]">
                  <Checkbox
                    checked={dayData?.isOpen}
                    onChange={(e) => handleDayToggle(day?.key, e?.target?.checked)}
                  />
                  <label className="font-medium text-foreground">
                    {day?.label}
                  </label>
                </div>

                {dayData?.isOpen && (
                  <div className="flex items-center space-x-4 flex-1">
                    <div className="flex items-center space-x-2">
                      <Input
                        type="time"
                        value={dayData?.openTime}
                        onChange={(e) => handleTimeChange(day?.key, 'openTime', e?.target?.value)}
                        className="w-32"
                      />
                      <span className="text-muted-foreground">às</span>
                      <Input
                        type="time"
                        value={dayData?.closeTime}
                        onChange={(e) => handleTimeChange(day?.key, 'closeTime', e?.target?.value)}
                        className="w-32"
                      />
                    </div>

                    <button
                      type="button"
                      onClick={() => copyToAllDays(day?.key)}
                      className="text-xs text-primary hover:text-primary/80 transition-colors duration-200 whitespace-nowrap"
                    >
                      Copiar para todos
                    </button>
                  </div>
                )}

                {!dayData?.isOpen && (
                  <div className="flex-1">
                    <span className="text-sm text-muted-foreground">Fechado</span>
                  </div>
                )}
              </div>
            </div>
          );
        })}
      </div>
      {errors?.operatingHours && (
        <div className="p-3 bg-error/10 border border-error/20 rounded-lg">
          <p className="text-sm text-error">{errors?.operatingHours}</p>
        </div>
      )}
      <div className="bg-muted/50 p-4 rounded-lg">
        <h4 className="font-medium text-foreground mb-2">
          Dicas para Horário de Funcionamento
        </h4>
        <ul className="text-sm text-muted-foreground space-y-1">
          <li>• Configure horários realistas que você consegue manter</li>
          <li>• Considere horários de pico para maximizar vendas</li>
          <li>• Você pode alterar os horários a qualquer momento no painel</li>
          <li>• Clientes só podem fazer pedidos durante o horário de funcionamento</li>
        </ul>
      </div>
    </div>
  );
};

export default OperatingHoursForm;