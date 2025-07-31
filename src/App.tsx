import React, { useState } from 'react';
import { CalendarView } from './components/CalendarView';
import { ReservationModal } from './components/ReservationModal';
import { ReservationsList } from './components/ReservationsList';
import { Navigation } from './components/Navigation';
import { useReservations } from './hooks/useReservations';
import { exportCalendarToPDF } from './utils/pdfExport';
import { Reservation } from './types/reservation';
import { CalendarDays, Loader } from 'lucide-react';

function App() {
  const {
    reservations,
    apartments,
    loading,
    error,
    addReservation,
    updateReservation,
    deleteReservation,
    getReservation,
    checkConflict
  } = useReservations();

  const [currentView, setCurrentView] = useState<'calendar' | 'list'>('calendar');
  const [modalState, setModalState] = useState<{
    isOpen: boolean;
    mode: 'create' | 'edit';
    reservation?: Reservation;
    initialDates?: { startDate: string; endDate: string };
  }>({
    isOpen: false,
    mode: 'create'
  });

  // Ouvrir le modal pour créer une nouvelle réservation
  const handleDateRangeSelect = (startDate: string, endDate: string) => {
    setModalState({
      isOpen: true,
      mode: 'create',
      initialDates: { startDate, endDate }
    });
  };

  // Ouvrir le modal pour éditer une réservation
  const handleReservationEdit = (reservation: Reservation) => {
    setModalState({
      isOpen: true,
      mode: 'edit',
      reservation
    });
  };

  // Fermer le modal
  const closeModal = () => {
    setModalState({
      isOpen: false,
      mode: 'create'
    });
  };

  // Sauvegarder une réservation (création ou modification)
  const handleSaveReservation = async (reservationData: Omit<Reservation, 'id'>) => {
    try {
      if (modalState.mode === 'create') {
        await addReservation(reservationData);
      } else if (modalState.reservation) {
        await updateReservation(modalState.reservation.id, reservationData);
      }
      closeModal();
    } catch (error) {
      // L'erreur sera gérée par le modal
      throw error;
    }
  };

  // Supprimer une réservation
  const handleDeleteReservation = async (id: string) => {
    try {
      await deleteReservation(id);
      closeModal();
    } catch (error) {
      console.error('Erreur lors de la suppression:', error);
    }
  };

  // Exporter en PDF
  const handlePrintPDF = () => {
    exportCalendarToPDF();
  };

  // Mettre à jour une réservation (pour le drag & drop)
  const handleReservationUpdate = async (id: string, updates: Partial<Omit<Reservation, 'id'>>) => {
    try {
      await updateReservation(id, updates);
    } catch (error) {
      console.error('Erreur lors de la mise à jour:', error);
      alert(error instanceof Error ? error.message : 'Erreur lors de la mise à jour');
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-100 flex items-center justify-center">
        <div className="text-center">
          <Loader className="animate-spin mx-auto mb-4" size={48} />
          <p className="text-gray-600">Chargement du calendrier...</p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="min-h-screen bg-gray-100 flex items-center justify-center">
        <div className="text-center max-w-md mx-auto p-6">
          <div className="bg-red-50 border border-red-200 rounded-lg p-6">
            <h2 className="text-lg font-semibold text-red-800 mb-2">
              Erreur de chargement
            </h2>
            <p className="text-red-600 mb-4">{error}</p>
            <button
              onClick={() => window.location.reload()}
              className="px-4 py-2 bg-red-600 text-white rounded-md hover:bg-red-700 transition-colors"
            >
              Recharger la page
            </button>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-100">
      {/* Header de l'application */}
      <header className="bg-white shadow-sm border-b">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between h-16">
            <div className="flex items-center">
              <CalendarDays className="text-blue-600 mr-3" size={32} />
              <div>
                <h1 className="text-xl font-bold text-gray-900">
                  Gestion des Réservations
                </h1>
                <p className="text-sm text-gray-500">
                  {reservations.length} réservation{reservations.length !== 1 ? 's' : ''} • {apartments.length} appartement{apartments.length !== 1 ? 's' : ''}
                </p>
              </div>
            </div>
          </div>
        </div>
      </header>

      {/* Navigation */}
      <Navigation currentView={currentView} onViewChange={setCurrentView} />

      {/* Contenu principal */}
      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {currentView === 'calendar' ? (
          <>
            {/* Instructions d'utilisation */}
            <div className="mb-6 bg-blue-50 border border-blue-200 rounded-lg p-4">
              <h3 className="text-sm font-medium text-blue-800 mb-2">
                Guide d'utilisation
              </h3>
              <ul className="text-sm text-blue-700 space-y-1">
                <li>• Cliquez et glissez pour sélectionner une période et créer une réservation</li>
                <li>• Double-cliquez sur une réservation pour la modifier</li>
                <li>• Glissez une réservation pour la déplacer (puis cliquez "Enregistrer")</li>
                <li>• Exportez le calendrier en PDF avec le bouton "Export PDF"</li>
              </ul>
            </div>

            {/* Calendrier */}
            <CalendarView
              reservations={reservations}
              apartments={apartments}
              onDateRangeSelect={handleDateRangeSelect}
              onReservationEdit={handleReservationEdit}
              onPrintPDF={handlePrintPDF}
              onReservationUpdate={handleReservationUpdate}
              checkConflict={checkConflict}
            />
          </>
        ) : (
          /* Liste des réservations */
          <ReservationsList
            reservations={reservations}
            apartments={apartments}
            onEdit={handleReservationEdit}
            onDelete={handleDeleteReservation}
          />
        )}

        {/* Modal de réservation */}
        <ReservationModal
          isOpen={modalState.isOpen}
          onClose={closeModal}
          onSave={handleSaveReservation}
          onDelete={modalState.mode === 'edit' ? handleDeleteReservation : undefined}
          reservation={modalState.reservation}
          apartments={apartments}
          initialDates={modalState.initialDates}
        />
      </main>

      {/* Footer */}
      <footer className="bg-white border-t mt-12">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
          <p className="text-center text-sm text-gray-500">
            Application de gestion des réservations • Données stockées localement
          </p>
        </div>
      </footer>
    </div>
  );
}

export default App;