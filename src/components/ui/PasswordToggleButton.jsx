import React from 'react';
import Icon from '../AppIcon';

// Botão de "olhinho" pra mostrar/ocultar senha — usado em todo input de senha
// do app (login, cadastro, perfil, admin). Posiciona-se absoluto dentro de um
// wrapper `relative` que envolve só o <input> (não o label/erro), senão a
// centralização vertical quebra quando o campo tem label acima.
const PasswordToggleButton = ({ visible, onToggle }) => (
  <button
    type="button"
    onClick={onToggle}
    tabIndex={-1}
    aria-label={visible ? 'Ocultar senha' : 'Mostrar senha'}
    className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600 dark:text-zinc-500 dark:hover:text-zinc-300 transition-colors"
  >
    <Icon name={visible ? 'EyeOff' : 'Eye'} size={18} />
  </button>
);

export default PasswordToggleButton;
