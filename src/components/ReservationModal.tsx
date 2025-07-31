import React, { useState, useEffect } from 'react';
import { X, Calendar, MapPin, FileText, Trash2, User } from 'lucide-react';
import { Reservation, Apartment } from '../types/reservation';
import { format, parseISO } from 'date-fns';
import { fr } from 'date-fns/locale';

interface ReservationModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSave: (reservation: Omit<Reservation, 'id'>) => void;
  onDelete?: (id: string) => void;
  reservation?: Reservation;
  apartments: Apartment[];
  initialDates?: {
    startDate: string;
    endDate: string;
  };
}

export const ReservationModal: React.FC<ReservationModalProps> = ({
  isOpen,
  onClose,
  onSave,
  onDelete,
  reservation,
  apartments,
  initialDates
}) => {
  const [formData, setFormData] = useState({
    apartment: '',
    clientName: '',
    startDate: '',
    endDate: '',
    notes: ''
  });
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);

  useEffect(() => {
    if (isOpen) {
      if (reservation) {
        // Mode édition
        setFormData({
          apartment: reservation.apartment,
          clientName: reservation.clientName,
          startDate: reservation.startDate,
          endDate: reservation.endDate,
          notes: reservation.notes || ''
        });
      } else if (initialDates) {
        // Nouveau avec dates pré-remplies
        setFormData({
          apartment: apartments[0]?.name || '',
          clientName: '',
          startDate: initialDates.startDate,
          endDate: initialDates.endDate,
          notes: ''
        });
      } else {
        // Nouveau vide
        setFormData({
          apartment: apartments[0]?.name || '',
          clientName: '',
          startDate: '',
          endDate: '',
          notes: ''
        });
      }
      setErrors({});
      setShowDeleteConfirm(false);
    }
  }, [isOpen, reservation, apartments, initialDates]);

  const validateForm = (): boolean => {
    const newErrors: Record<string, string> = {};

    if (!formData.apartment) {
      newErrors.apartment = 'Veuillez sélectionner un appartement';
    }

    if (!formData.clientName.trim()) {
      newErrors.clientName = 'Le nom du réservataire est requis';
    }

    if (!formData.startDate) {
      newErrors.startDate = 'Date de début requise';
    }

    if (!formData.endDate) {
      newErrors.endDate = 'Date de fin requise';
    }

    if (formData.startDate && formData.endDate) {
      const start = parseISO(formData.startDate);
      const end = parseISO(formData.endDate);
      
      if (start >= end) {
        newErrors.endDate = 'La date de fin doit être après la date de début';
      }
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSave = () => {
    if (validateForm()) {
      try {
        onSave(formData);
        onClose();
      } catch (error) {
        setErrors({ general: error instanceof Error ? error.message : 'Erreur lors de la sauvegarde' });
      }
    }
  };

  const handleDelete = () => {
    if (reservation && onDelete) {
      onDelete(reservation.id);
      onClose();
    }
  };

  const handleInputChange = (field: string, value: string) => {
    setFormData(prev => ({ ...prev, [field]: value }));
    if (errors[field]) {
      setErrors(prev => ({ ...prev, [field]: '' }));
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-lg shadow-xl w-full max-w-md max-h-[90vh] overflow-y-auto">
        {/* Header */}
        <div className="flex items-center justify-between p-6 border-b">
          <h2 className="text-xl font-semibold text-gray-900">
            {reservation ? 'Modifier la réservation' : 'Nouvelle réservation'}
          </h2>
          <button
            onClick={onClose}
            className="text-gray-400 hover:text-gray-600 transition-colors"
          >
            <X size={24} />
          </button>
        </div>

        {/* Content */}
        <div className="p-6 space-y-4">
          {errors.general && (
            <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded">
              {errors.general}
            </div>
          )}

          {/* Appartement */}
          <div>
            <label className="flex items-center text-sm font-medium text-gray-700 mb-2">
              <MapPin size={16} className="mr-2" />
              Appartement
            </label>
            <select
              value={formData.apartment}
              onChange={(e) => handleInputChange('apartment', e.target.value)}
              className={`w-full px-3 py-2 border rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 ${
                errors.apartment ? 'border-red-300' : 'border-gray-300'
              }`}
            >
              {apartments.map((apt) => (
                <option key={apt.id} value={apt.name}>
                  {apt.name}
                </option>
              ))}
            </select>
            {errors.apartment && (
              <p className="text-red-500 text-sm mt-1">{errors.apartment}</p>
            )}
          </div>

          {/* Nom du réservataire */}
          <div>
            <label className="flex items-center text-sm font-medium text-gray-700 mb-2">
              <User size={16} className="mr-2" />
              Nom du réservataire
            </label>
            <input
              type="text"
              value={formData.clientName}
              onChange={(e) => handleInputChange('clientName', e.target.value)}
              placeholder="Nom et prénom du client"
              className={`w-full px-3 py-2 border rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 ${
                errors.clientName ? 'border-red-300' : 'border-gray-300'
              }`}
            />
            {errors.clientName && (
              <p className="text-red-500 text-sm mt-1">{errors.clientName}</p>
            )}
          </div>

          {/* Dates */}
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="flex items-center text-sm font-medium text-gray-700 mb-2">
                <Calendar size={16} className="mr-2" />
                Date de début
              </label>
              <input
                type="date"
                value={formData.startDate}
                onChange={(e) => handleInputChange('startDate', e.target.value)}
                className={`w-full px-3 py-2 border rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 ${
                  errors.startDate ? 'border-red-300' : 'border-gray-300'
                }`}
              />
              {errors.startDate && (
                <p className="text-red-500 text-sm mt-1">{errors.startDate}</p>
              )}
            </div>

            <div>
              <label className="flex items-center text-sm font-medium text-gray-700 mb-2">
                <Calendar size={16} className="mr-2" />
                Date de fin
              </label>
              <input
                type="date"
                value={formData.endDate}
                onChange={(e) => handleInputChange('endDate', e.target.value)}
                className={`w-full px-3 py-2 border rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 ${
                  errors.endDate ? 'border-red-300' : 'border-gray-300'
                }`}
              />
              {errors.endDate && (
                <p className="text-red-500 text-sm mt-1">{errors.endDate}</p>
              )}
            </div>
          </div>

          {/* Affichage des dates formatées */}
          {formData.startDate && formData.endDate && !errors.startDate && !errors.endDate && (
            <div className="bg-blue-50 border border-blue-200 p-3 rounded-md">
              <p className="text-sm text-blue-800">
                Du {format(parseISO(formData.startDate), 'EEEE d MMMM yyyy', { locale: fr })} au{' '}
                {format(parseISO(formData.endDate), 'EEEE d MMMM yyyy', { locale: fr })}
              </p>
            </div>
          )}

          {/* Notes */}
          <div>
            <label className="flex items-center text-sm font-medium text-gray-700 mb-2">
              <FileText size={16} className="mr-2" />
              Notes (optionnel)
            </label>
            <textarea
              value={formData.notes}
              onChange={(e) => handleInputChange('notes', e.target.value)}
              placeholder="Nom du client, remarques..."
              rows={3}
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 resize-none"
            />
          </div>
        </div>

        {/* Footer */}
        <div className="flex items-center justify-between p-6 border-t bg-gray-50">
          <div>
            {reservation && onDelete && (
              <button
                onClick={() => setShowDeleteConfirm(true)}
                className="flex items-center px-4 py-2 text-red-600 hover:text-red-700 hover:bg-red-50 rounded-md transition-colors"
              >
                <Trash2 size={16} className="mr-2" />
                Supprimer
              </button>
            )}
          </div>
          
          <div className="flex space-x-3">
            <button
              onClick={onClose}
              className="px-4 py-2 text-gray-600 hover:text-gray-800 transition-colors"
            >
              Annuler
            </button>
            <button
              onClick={handleSave}
              className="px-6 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 transition-colors"
            >
              {reservation ? 'Modifier' : 'Créer'}
            </button>
          </div>
        </div>
      </div>

      {/* Confirmation de suppression */}
      {showDeleteConfirm && (
        <div className="fixed inset-0 bg-black bg-opacity-75 flex items-center justify-center z-60">
          <div className="bg-white rounded-lg p-6 max-w-sm mx-4">
            <h3 className="text-lg font-semibold text-gray-900 mb-4">
              Confirmer la suppression
            </h3>
            <p className="text-gray-600 mb-6">
              Êtes-vous sûr de vouloir supprimer cette réservation ? Cette action est irréversible.
            </p>
            <div className="flex space-x-3">
              <button
                onClick={() => setShowDeleteConfirm(false)}
                className="flex-1 px-4 py-2 text-gray-600 border border-gray-300 rounded-md hover:bg-gray-50 transition-colors"
              >
                Annuler
              </button>
              <button
                onClick={handleDelete}
                className="flex-1 px-4 py-2 bg-red-600 text-white rounded-md hover:bg-red-700 transition-colors"
              >
                Supprimer
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};