import React, { useState, useMemo } from 'react';
import { Search, Filter, Calendar, MapPin, User, FileText, Edit, Trash2 } from 'lucide-react';
import { Reservation, Apartment, ReservationFilters } from '../types/reservation';
import { format, parseISO, isWithinInterval } from 'date-fns';
import { fr } from 'date-fns/locale';

interface ReservationsListProps {
  reservations: Reservation[];
  apartments: Apartment[];
  onEdit: (reservation: Reservation) => void;
  onDelete: (id: string) => void;
}

export const ReservationsList: React.FC<ReservationsListProps> = ({
  reservations,
  apartments,
  onEdit,
  onDelete
}) => {
  const [filters, setFilters] = useState<ReservationFilters>({});
  const [sortBy, setSortBy] = useState<'startDate' | 'clientName' | 'apartment'>('startDate');
  const [sortOrder, setSortOrder] = useState<'asc' | 'desc'>('asc');

  // Filtrer et trier les réservations
  const filteredAndSortedReservations = useMemo(() => {
    let filtered = reservations.filter(reservation => {
      // Filtre par appartement
      if (filters.apartment && reservation.apartment !== filters.apartment) {
        return false;
      }

      // Filtre par nom du client
      if (filters.clientName && !reservation.clientName.toLowerCase().includes(filters.clientName.toLowerCase())) {
        return false;
      }

      // Filtre par plage de dates
      if (filters.startDate && filters.endDate) {
        const filterStart = parseISO(filters.startDate);
        const filterEnd = parseISO(filters.endDate);
        const reservationStart = parseISO(reservation.startDate);
        const reservationEnd = parseISO(reservation.endDate);

        // Vérifier si la réservation chevauche avec la plage de filtre
        const overlaps = isWithinInterval(reservationStart, { start: filterStart, end: filterEnd }) ||
                        isWithinInterval(reservationEnd, { start: filterStart, end: filterEnd }) ||
                        isWithinInterval(filterStart, { start: reservationStart, end: reservationEnd });

        if (!overlaps) {
          return false;
        }
      }

      return true;
    });

    // Trier les résultats
    filtered.sort((a, b) => {
      let aValue: string | Date;
      let bValue: string | Date;

      switch (sortBy) {
        case 'startDate':
          aValue = parseISO(a.startDate);
          bValue = parseISO(b.startDate);
          break;
        case 'clientName':
          aValue = a.clientName.toLowerCase();
          bValue = b.clientName.toLowerCase();
          break;
        case 'apartment':
          aValue = a.apartment.toLowerCase();
          bValue = b.apartment.toLowerCase();
          break;
        default:
          return 0;
      }

      if (aValue < bValue) return sortOrder === 'asc' ? -1 : 1;
      if (aValue > bValue) return sortOrder === 'asc' ? 1 : -1;
      return 0;
    });

    return filtered;
  }, [reservations, filters, sortBy, sortOrder]);

  const handleSort = (field: 'startDate' | 'clientName' | 'apartment') => {
    if (sortBy === field) {
      setSortOrder(sortOrder === 'asc' ? 'desc' : 'asc');
    } else {
      setSortBy(field);
      setSortOrder('asc');
    }
  };

  const clearFilters = () => {
    setFilters({});
  };

  const getSortIcon = (field: string) => {
    if (sortBy !== field) return null;
    return sortOrder === 'asc' ? '↑' : '↓';
  };

  return (
    <div className="bg-white rounded-lg shadow-lg">
      {/* Header */}
      <div className="p-6 border-b">
        <h2 className="text-2xl font-bold text-gray-900 mb-4">
          Liste des réservations
        </h2>
        
        {/* Filtres */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 mb-4">
          {/* Filtre par appartement */}
          <div>
            <label className="flex items-center text-sm font-medium text-gray-700 mb-2">
              <MapPin size={16} className="mr-2" />
              Appartement
            </label>
            <select
              value={filters.apartment || ''}
              onChange={(e) => setFilters(prev => ({ ...prev, apartment: e.target.value || undefined }))}
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
            >
              <option value="">Tous les appartements</option>
              {apartments.map(apt => (
                <option key={apt.id} value={apt.name}>{apt.name}</option>
              ))}
            </select>
          </div>

          {/* Filtre par nom du client */}
          <div>
            <label className="flex items-center text-sm font-medium text-gray-700 mb-2">
              <User size={16} className="mr-2" />
              Nom du client
            </label>
            <input
              type="text"
              value={filters.clientName || ''}
              onChange={(e) => setFilters(prev => ({ ...prev, clientName: e.target.value || undefined }))}
              placeholder="Rechercher un client..."
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
          </div>

          {/* Filtre par date de début */}
          <div>
            <label className="flex items-center text-sm font-medium text-gray-700 mb-2">
              <Calendar size={16} className="mr-2" />
              Date de début
            </label>
            <input
              type="date"
              value={filters.startDate || ''}
              onChange={(e) => setFilters(prev => ({ ...prev, startDate: e.target.value || undefined }))}
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
          </div>

          {/* Filtre par date de fin */}
          <div>
            <label className="flex items-center text-sm font-medium text-gray-700 mb-2">
              <Calendar size={16} className="mr-2" />
              Date de fin
            </label>
            <input
              type="date"
              value={filters.endDate || ''}
              onChange={(e) => setFilters(prev => ({ ...prev, endDate: e.target.value || undefined }))}
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
          </div>
        </div>

        {/* Actions des filtres */}
        <div className="flex items-center justify-between">
          <p className="text-sm text-gray-600">
            {filteredAndSortedReservations.length} réservation{filteredAndSortedReservations.length !== 1 ? 's' : ''} trouvée{filteredAndSortedReservations.length !== 1 ? 's' : ''}
          </p>
          <button
            onClick={clearFilters}
            className="flex items-center px-3 py-2 text-gray-600 hover:text-gray-800 hover:bg-gray-100 rounded-md transition-colors"
          >
            <Filter size={16} className="mr-2" />
            Effacer les filtres
          </button>
        </div>
      </div>

      {/* Tableau */}
      <div className="overflow-x-auto">
        <table className="w-full">
          <thead className="bg-gray-50">
            <tr>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                ID
              </th>
              <th 
                className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider cursor-pointer hover:bg-gray-100"
                onClick={() => handleSort('apartment')}
              >
                <div className="flex items-center">
                  Appartement
                  <span className="ml-1">{getSortIcon('apartment')}</span>
                </div>
              </th>
              <th 
                className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider cursor-pointer hover:bg-gray-100"
                onClick={() => handleSort('clientName')}
              >
                <div className="flex items-center">
                  Client
                  <span className="ml-1">{getSortIcon('clientName')}</span>
                </div>
              </th>
              <th 
                className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider cursor-pointer hover:bg-gray-100"
                onClick={() => handleSort('startDate')}
              >
                <div className="flex items-center">
                  Période
                  <span className="ml-1">{getSortIcon('startDate')}</span>
                </div>
              </th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                Notes
              </th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                Actions
              </th>
            </tr>
          </thead>
          <tbody className="bg-white divide-y divide-gray-200">
            {filteredAndSortedReservations.map((reservation) => {
              const apartment = apartments.find(apt => apt.name === reservation.apartment);
              
              return (
                <tr key={reservation.id} className="hover:bg-gray-50">
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                    #{reservation.id.slice(-6)}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <div className="flex items-center">
                      <div
                        className="w-4 h-4 rounded mr-3"
                        style={{ backgroundColor: apartment?.color || '#6B7280' }}
                      />
                      <span className="text-sm font-medium text-gray-900">
                        {reservation.apartment}
                      </span>
                    </div>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <div className="flex items-center">
                      <User size={16} className="text-gray-400 mr-2" />
                      <span className="text-sm text-gray-900">
                        {reservation.clientName}
                      </span>
                    </div>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                    <div>
                      <div className="font-medium">
                        {format(parseISO(reservation.startDate), 'dd/MM/yyyy', { locale: fr })}
                      </div>
                      <div className="text-gray-500">
                        au {format(parseISO(reservation.endDate), 'dd/MM/yyyy', { locale: fr })}
                      </div>
                    </div>
                  </td>
                  <td className="px-6 py-4 text-sm text-gray-500">
                    <div className="max-w-xs truncate" title={reservation.notes}>
                      {reservation.notes || '-'}
                    </div>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm font-medium">
                    <div className="flex space-x-2">
                      <button
                        onClick={() => onEdit(reservation)}
                        className="text-blue-600 hover:text-blue-900 p-1 rounded hover:bg-blue-50 transition-colors"
                        title="Modifier"
                      >
                        <Edit size={16} />
                      </button>
                      <button
                        onClick={() => {
                          if (window.confirm('Êtes-vous sûr de vouloir supprimer cette réservation ?')) {
                            onDelete(reservation.id);
                          }
                        }}
                        className="text-red-600 hover:text-red-900 p-1 rounded hover:bg-red-50 transition-colors"
                        title="Supprimer"
                      >
                        <Trash2 size={16} />
                      </button>
                    </div>
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>

        {filteredAndSortedReservations.length === 0 && (
          <div className="text-center py-12">
            <Search size={48} className="mx-auto text-gray-400 mb-4" />
            <h3 className="text-lg font-medium text-gray-900 mb-2">
              Aucune réservation trouvée
            </h3>
            <p className="text-gray-500">
              Essayez de modifier vos critères de recherche
            </p>
          </div>
        )}
      </div>
    </div>
  );
};