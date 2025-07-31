import { useState, useEffect, useCallback } from 'react';
import { Reservation, Apartment } from '../types/reservation';
import { isWithinInterval, parseISO } from 'date-fns';

const STORAGE_KEY = 'booking-reservations';
const APARTMENTS_KEY = 'booking-apartments';

// Données par défaut
const defaultApartments: Apartment[] = [
  { id: '1', name: 'Appartement A', color: '#3B82F6' },
  { id: '2', name: 'Appartement B', color: '#10B981' },
  { id: '3', name: 'Appartement C', color: '#F59E0B' },
  { id: '4', name: 'Appartement D', color: '#EF4444' },
  { id: '5', name: 'Appartement E', color: '#8B5CF6' },
];

const defaultReservations: Reservation[] = [
  {
    id: '1',
    apartment: 'Appartement A',
    startDate: '2025-01-15',
    endDate: '2025-01-20',
    notes: 'Famille Martin',
    color: '#3B82F6'
  },
  {
    id: '2',
    apartment: 'Appartement B',
    startDate: '2025-01-18',
    endDate: '2025-01-25',
    notes: 'Séjour d\'affaires',
    color: '#10B981'
  },
  {
    id: '3',
    apartment: 'Appartement C',
    startDate: '2025-01-22',
    endDate: '2025-01-28',
    notes: 'Vacances d\'hiver',
    color: '#F59E0B'
  }
];

export const useReservations = () => {
  const [reservations, setReservations] = useState<Reservation[]>([]);
  const [apartments, setApartments] = useState<Apartment[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Charger les données depuis localStorage
  useEffect(() => {
    try {
      const storedReservations = localStorage.getItem(STORAGE_KEY);
      const storedApartments = localStorage.getItem(APARTMENTS_KEY);

      if (storedReservations) {
        setReservations(JSON.parse(storedReservations));
      } else {
        setReservations(defaultReservations);
        localStorage.setItem(STORAGE_KEY, JSON.stringify(defaultReservations));
      }

      if (storedApartments) {
        setApartments(JSON.parse(storedApartments));
      } else {
        setApartments(defaultApartments);
        localStorage.setItem(APARTMENTS_KEY, JSON.stringify(defaultApartments));
      }
    } catch (err) {
      setError('Erreur lors du chargement des données');
      setReservations(defaultReservations);
      setApartments(defaultApartments);
    } finally {
      setLoading(false);
    }
  }, []);

  // Sauvegarder les réservations
  const saveReservations = useCallback((newReservations: Reservation[]) => {
    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(newReservations));
      setReservations(newReservations);
      setError(null);
    } catch (err) {
      setError('Erreur lors de la sauvegarde');
      throw new Error('Impossible de sauvegarder les données');
    }
  }, []);

  // Vérifier les conflits de réservation
  const checkConflict = useCallback((newReservation: Omit<Reservation, 'id'>, excludeId?: string): boolean => {
    const newStart = parseISO(newReservation.startDate);
    const newEnd = parseISO(newReservation.endDate);

    return reservations
      .filter(r => r.id !== excludeId && r.apartment === newReservation.apartment)
      .some(reservation => {
        const existingStart = parseISO(reservation.startDate);
        const existingEnd = parseISO(reservation.endDate);

        // Vérifier le chevauchement
        return (
          isWithinInterval(newStart, { start: existingStart, end: existingEnd }) ||
          isWithinInterval(newEnd, { start: existingStart, end: existingEnd }) ||
          isWithinInterval(existingStart, { start: newStart, end: newEnd })
        );
      });
  }, [reservations]);

  // Ajouter une réservation
  const addReservation = useCallback((reservation: Omit<Reservation, 'id'>) => {
    if (checkConflict(reservation)) {
      throw new Error('Cette période est déjà réservée pour cet appartement');
    }

    const apartment = apartments.find(apt => apt.name === reservation.apartment);
    const newReservation: Reservation = {
      ...reservation,
      id: Date.now().toString(),
      color: apartment?.color || '#6B7280'
    };

    const newReservations = [...reservations, newReservation];
    saveReservations(newReservations);
    return newReservation;
  }, [reservations, apartments, checkConflict, saveReservations]);

  // Modifier une réservation
  const updateReservation = useCallback((id: string, updates: Partial<Omit<Reservation, 'id'>>) => {
    const existingReservation = reservations.find(r => r.id === id);
    if (!existingReservation) {
      throw new Error('Réservation introuvable');
    }

    const updatedReservation = { ...existingReservation, ...updates };

    if (checkConflict(updatedReservation, id)) {
      throw new Error('Cette période est déjà réservée pour cet appartement');
    }

    if (updates.apartment) {
      const apartment = apartments.find(apt => apt.name === updates.apartment);
      updatedReservation.color = apartment?.color || '#6B7280';
    }

    const newReservations = reservations.map(r => 
      r.id === id ? updatedReservation : r
    );
    saveReservations(newReservations);
    return updatedReservation;
  }, [reservations, apartments, checkConflict, saveReservations]);

  // Supprimer une réservation
  const deleteReservation = useCallback((id: string) => {
    const newReservations = reservations.filter(r => r.id !== id);
    saveReservations(newReservations);
  }, [reservations, saveReservations]);

  // Obtenir une réservation par ID
  const getReservation = useCallback((id: string) => {
    return reservations.find(r => r.id === id);
  }, [reservations]);

  return {
    reservations,
    apartments,
    loading,
    error,
    addReservation,
    updateReservation,
    deleteReservation,
    getReservation,
    checkConflict
  };
};