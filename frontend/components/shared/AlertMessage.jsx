'use client';
import { RocketIcon } from "@radix-ui/react-icons";
import {
  Alert,
  AlertDescription,
  AlertTitle,
} from "@/components/ui/alert";

/**
 * Composant d'alerte réutilisable
 * @param {string} type - Type d'alerte: 'success', 'info', 'warning', 'error'
 * @param {string} title - Titre de l'alerte
 * @param {string|React.ReactNode} message - Message de l'alerte
 * @param {boolean} breakAll - Si true, permet aux longs textes de se casser (pour les hash)
 */
const AlertMessage = ({ type = 'info', title = 'Information', message, breakAll = false }) => {
  // Définir les couleurs de fond en fonction du type
  const bgColors = {
    success: 'bg-lime-200',
    info: 'bg-blue-100',
    warning: 'bg-amber-200',
    error: 'bg-red-400'
  };

  const bgColor = bgColors[type] || bgColors.info;

  return (
    <Alert className={`mb-2 ${bgColor} text-xs sm:text-sm`}>
      <RocketIcon className="h-3 w-3 sm:h-4 sm:w-4" />
      <AlertTitle>{title}</AlertTitle>
      <AlertDescription className={breakAll ? 'break-all' : ''}>
        {message}
      </AlertDescription>
    </Alert>
  );
};

export default AlertMessage; 