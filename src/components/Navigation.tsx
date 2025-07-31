import React from 'react';
import { Calendar, List } from 'lucide-react';

interface NavigationProps {
  currentView: 'calendar' | 'list';
  onViewChange: (view: 'calendar' | 'list') => void;
}

export const Navigation: React.FC<NavigationProps> = ({ currentView, onViewChange }) => {
  return (
    <nav className="bg-white shadow-sm border-b">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex space-x-8">
          <button
            onClick={() => onViewChange('calendar')}
            className={`
              flex items-center px-3 py-4 text-sm font-medium border-b-2 transition-colors
              ${currentView === 'calendar'
                ? 'border-blue-500 text-blue-600'
                : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
              }
            `}
          >
            <Calendar size={20} className="mr-2" />
            Calendrier
          </button>
          
          <button
            onClick={() => onViewChange('list')}
            className={`
              flex items-center px-3 py-4 text-sm font-medium border-b-2 transition-colors
              ${currentView === 'list'
                ? 'border-blue-500 text-blue-600'
                : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
              }
            `}
          >
            <List size={20} className="mr-2" />
            Liste des réservations
          </button>
        </div>
      </div>
    </nav>
  );
};