import React, { useState, useCallback, useMemo } from 'react';
import { Calendar, ChevronLeft, ChevronRight, FileDown, Save, X } from 'lucide-react';
import { Reservation, Apartment, DragState } from '../types/reservation';
import { 
  format, 
  startOfMonth, 
  endOfMonth, 
  eachDayOfInterval, 
  isSameMonth, 
  isToday,
  addMonths,
  subMonths,
  parseISO,
  isWithinInterval,
  isSameDay,
  startOfWeek,
  endOfWeek,
  addDays,
  differenceInDays
} from 'date-fns';
import { fr } from 'date-fns/locale';

interface CalendarViewProps {
  reservations: Reservation[];
  apartments: Apartment[];
  onDateRangeSelect: (startDate: string, endDate: string) => void;
  onReservationEdit: (reservation: Reservation) => void;
  onPrintPDF: () => void;
  onReservationUpdate: (id: string, updates: Partial<Omit<Reservation, 'id'>>) => void;
  checkConflict: (reservation: Omit<Reservation, 'id'>, excludeId?: string) => boolean;
}

export const CalendarView: React.FC<CalendarViewProps> = ({
  reservations,
  apartments,
  onDateRangeSelect,
  onReservationEdit,
  onPrintPDF,
  onReservationUpdate,
  checkConflict
}) => {
  const [currentDate, setCurrentDate] = useState(new Date());
  const [selectedRange, setSelectedRange] = useState<{ start: Date | null; end: Date | null }>({
    start: null,
    end: null
  });
  const [isSelecting, setIsSelecting] = useState(false);
  const [dragState, setDragState] = useState<DragState | null>(null);
  const [isDragging, setIsDragging] = useState(false);

  // Navigation du calendrier
  const goToPreviousMonth = () => setCurrentDate(subMonths(currentDate, 1));
  const goToNextMonth = () => setCurrentDate(addMonths(currentDate, 1));
  const goToToday = () => setCurrentDate(new Date());

  // Générer les jours du calendrier
  const calendarDays = useMemo(() => {
    const monthStart = startOfMonth(currentDate);
    const monthEnd = endOfMonth(currentDate);
    const calendarStart = startOfWeek(monthStart, { weekStartsOn: 1 });
    const calendarEnd = endOfWeek(monthEnd, { weekStartsOn: 1 });
    
    return eachDayOfInterval({ start: calendarStart, end: calendarEnd });
  }, [currentDate]);

  // Obtenir les réservations pour une date donnée
  const getReservationsForDate = useCallback((date: Date) => {
    return reservations.filter(reservation => {
      const start = parseISO(reservation.startDate);
      const end = parseISO(reservation.endDate);
      return isWithinInterval(date, { start, end });
    });
  }, [reservations]);

  // Gestion de la sélection de plage de dates
  const handleDateClick = useCallback((date: Date) => {
    if (dragState?.isActive) return; // Ignore les clics pendant le drag

    if (!isSelecting) {
      setSelectedRange({ start: date, end: null });
      setIsSelecting(true);
    } else {
      if (selectedRange.start) {
        const start = selectedRange.start <= date ? selectedRange.start : date;
        const end = selectedRange.start <= date ? date : selectedRange.start;
        
        setSelectedRange({ start, end });
        setIsSelecting(false);
        
        // Ouvrir le modal de création
        onDateRangeSelect(
          format(start, 'yyyy-MM-dd'),
          format(end, 'yyyy-MM-dd')
        );
        
        setSelectedRange({ start: null, end: null });
      }
    }
  }, [isSelecting, selectedRange.start, onDateRangeSelect, dragState?.isActive]);

  // Double-clic sur une réservation pour l'éditer
  const handleReservationDoubleClick = useCallback((reservation: Reservation, e: React.MouseEvent) => {
    e.stopPropagation();
    if (dragState?.isActive) return;
    onReservationEdit(reservation);
  }, [onReservationEdit, dragState?.isActive]);

  // Commencer le drag d'une réservation
  const handleReservationMouseDown = useCallback((reservation: Reservation, e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
    
    setDragState({
      reservationId: reservation.id,
      originalReservation: { ...reservation },
      isActive: false
    });
    setIsDragging(true);
  }, []);

  // Gestion du mouvement de la souris pour le drag
  const handleMouseMove = useCallback((date: Date) => {
    if (!isDragging || !dragState) return;
    
    const originalStart = parseISO(dragState.originalReservation.startDate);
    const originalEnd = parseISO(dragState.originalReservation.endDate);
    const duration = differenceInDays(originalEnd, originalStart);
    
    // Calculer les nouvelles dates basées sur la position de la souris
    let newStartDate = format(date, 'yyyy-MM-dd');
    let newEndDate = format(addDays(date, duration), 'yyyy-MM-dd');
    
    setDragState(prev => prev ? {
      ...prev,
      newStartDate,
      newEndDate,
      isActive: true
    } : null);
  }, [isDragging, dragState]);

  // Terminer le drag
  const handleMouseUp = useCallback(() => {
    setIsDragging(false);
  }, []);

  // Sauvegarder les modifications du drag
  const handleSaveDrag = useCallback(() => {
    if (!dragState || !dragState.newStartDate || !dragState.newEndDate) return;
    
    const updates = {
      startDate: dragState.newStartDate,
      endDate: dragState.newEndDate
    };
    
    // Vérifier les conflits
    const testReservation = {
      ...dragState.originalReservation,
      ...updates
    };
    
    if (checkConflict(testReservation, dragState.reservationId)) {
      alert('Conflit détecté : cette période est déjà réservée pour cet appartement.');
      return;
    }
    
    onReservationUpdate(dragState.reservationId, updates);
    setDragState(null);
  }, [dragState, onReservationUpdate, checkConflict]);

  // Annuler les modifications du drag
  const handleCancelDrag = useCallback(() => {
    setDragState(null);
  }, []);

  // Gestionnaires d'événements globaux pour le drag
  React.useEffect(() => {
    const handleGlobalMouseUp = () => {
      setIsDragging(false);
    };

    if (isDragging) {
      document.addEventListener('mouseup', handleGlobalMouseUp);
      return () => document.removeEventListener('mouseup', handleGlobalMouseUp);
    }
  }, [isDragging]);

  // Obtenir la réservation en cours de modification
  const getDraggedReservation = useCallback((reservationId: string): Reservation | null => {
    if (!dragState || dragState.reservationId !== reservationId || !dragState.isActive) {
      return null;
    }
    
    return {
      ...dragState.originalReservation,
      startDate: dragState.newStartDate || dragState.originalReservation.startDate,
      endDate: dragState.newEndDate || dragState.originalReservation.endDate
    };
  }, [dragState]);

  // Annuler la sélection
  const cancelSelection = useCallback(() => {
    setIsSelecting(false);
    setSelectedRange({ start: null, end: null });
  }, []);

  // Vérifier si une date est dans la plage sélectionnée
  const isDateInSelectedRange = useCallback((date: Date) => {
    if (!selectedRange.start) return false;
    if (!selectedRange.end) return isSameDay(date, selectedRange.start);
    
    const start = selectedRange.start <= selectedRange.end ? selectedRange.start : selectedRange.end;
    const end = selectedRange.start <= selectedRange.end ? selectedRange.end : selectedRange.start;
    
    return isWithinInterval(date, { start, end });
  }, [selectedRange]);

  return (
    <div id="calendar-container" className="bg-white rounded-lg shadow-lg">
      {/* Header du calendrier */}
      <div className="flex items-center justify-between p-6 border-b">
        <div className="flex items-center space-x-4">
          <h2 className="text-2xl font-bold text-gray-900 flex items-center">
            <Calendar className="mr-2" size={24} />
            {format(currentDate, 'MMMM yyyy', { locale: fr })}
          </h2>
          <button
            onClick={goToToday}
            className="px-3 py-1 text-sm bg-blue-100 text-blue-700 rounded-md hover:bg-blue-200 transition-colors"
          >
            Aujourd'hui
          </button>
        </div>
        
        <div className="flex items-center space-x-2">
          <button
            onClick={onPrintPDF}
            className="flex items-center px-4 py-2 bg-green-600 text-white rounded-md hover:bg-green-700 transition-colors"
          >
            <FileDown size={16} className="mr-2" />
            Export PDF
          </button>
          
          <button
            onClick={goToPreviousMonth}
            className="p-2 text-gray-600 hover:text-gray-900 hover:bg-gray-100 rounded-md transition-colors"
          >
            <ChevronLeft size={20} />
          </button>
          <button
            onClick={goToNextMonth}
            className="p-2 text-gray-600 hover:text-gray-900 hover:bg-gray-100 rounded-md transition-colors"
          >
            <ChevronRight size={20} />
          </button>
        </div>
      </div>

      {/* Légende des appartements */}
      <div className="p-4 border-b bg-gray-50">
        <div className="flex flex-wrap gap-4">
          {apartments.map((apartment) => (
            <div key={apartment.id} className="flex items-center">
              <div
                className="w-4 h-4 rounded mr-2"
                style={{ backgroundColor: apartment.color }}
              />
              <span className="text-sm text-gray-700">{apartment.name}</span>
            </div>
          ))}
        </div>
      </div>

      {/* Instructions */}
      {isSelecting && (
        <div className="p-4 bg-blue-50 border-b">
          <p className="text-sm text-blue-800">
            Cliquez sur une date pour terminer la sélection de période
            <button
              onClick={cancelSelection}
              className="ml-2 text-blue-600 hover:text-blue-800 underline"
            >
              Annuler
            </button>
          </p>
        </div>
      )}

      {/* Grille du calendrier */}
      <div className="p-4">
        {/* En-têtes des jours de la semaine */}
        <div className="grid grid-cols-7 gap-1 mb-2">
          {['Lun', 'Mar', 'Mer', 'Jeu', 'Ven', 'Sam', 'Dim'].map((day) => (
            <div key={day} className="p-2 text-center text-sm font-medium text-gray-500">
              {day}
            </div>
          ))}
        </div>

        {/* Grille des jours */}
        <div className="grid grid-cols-7 gap-1">
          {calendarDays.map((date) => {
            const dayReservations = getReservationsForDate(date);
            const isCurrentMonth = isSameMonth(date, currentDate);
            const isTodayDate = isToday(date);
            const isSelected = isDateInSelectedRange(date);

            return (
              <div
                key={date.toISOString()}
                onClick={() => handleDateClick(date)}
                onMouseEnter={() => handleMouseMove(date)}
                className={`
                  relative min-h-[100px] p-1 border border-gray-200 cursor-pointer transition-colors
                  ${isCurrentMonth ? 'bg-white hover:bg-gray-50' : 'bg-gray-100 text-gray-400'}
                  ${isTodayDate ? 'ring-2 ring-blue-500' : ''}
                  ${isSelected ? 'bg-blue-100 border-blue-300' : ''}
                `}
              >
                {/* Numéro du jour */}
                <div className={`text-sm font-medium ${isTodayDate ? 'text-blue-600' : ''}`}>
                  {format(date, 'd')}
                </div>

                {/* Réservations */}
                <div className="mt-1 space-y-1">
                  {dayReservations.map((reservation) => {
                    const draggedReservation = getDraggedReservation(reservation.id);
                    const displayReservation = draggedReservation || reservation;
                    
                    const isStart = isSameDay(parseISO(reservation.startDate), date);
                    const isEnd = isSameDay(parseISO(reservation.endDate), date);
                    const isDraggedReservation = draggedReservation !== null;
                    
                    return (
                      <div
                        key={reservation.id}
                        onDoubleClick={(e) => handleReservationDoubleClick(reservation, e)}
                        onMouseDown={(e) => handleReservationMouseDown(reservation, e)}
                        className={`
                          text-xs px-1 py-0.5 rounded text-white cursor-pointer relative group
                          hover:opacity-80 transition-all duration-200
                          ${isStart ? 'rounded-l' : ''}
                          ${isEnd ? 'rounded-r' : ''}
                          ${isDraggedReservation ? 'opacity-70 transform scale-105 shadow-lg' : ''}
                        `}
                        style={{ backgroundColor: displayReservation.color }}
                        title={`${displayReservation.apartment} - ${displayReservation.clientName} - ${displayReservation.notes || 'Pas de notes'}`}
                      >
                        <div className="truncate">
                          {isStart ? `${displayReservation.apartment} - ${displayReservation.clientName}` : ''}
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>
            );
          })}
        </div>
        
        {/* Boutons de sauvegarde/annulation pour le drag */}
        {dragState?.isActive && (
          <div className="fixed top-4 right-4 bg-white rounded-lg shadow-lg border p-4 z-50">
            <p className="text-sm text-gray-600 mb-3">
              Modifier la période de réservation ?
            </p>
            <div className="flex space-x-2">
              <button
                onClick={handleSaveDrag}
                className="flex items-center px-3 py-2 bg-green-600 text-white rounded-md hover:bg-green-700 transition-colors text-sm"
              >
                <Save size={14} className="mr-1" />
                Enregistrer
              </button>
              <button
                onClick={handleCancelDrag}
                className="flex items-center px-3 py-2 bg-gray-600 text-white rounded-md hover:bg-gray-700 transition-colors text-sm"
              >
                <X size={14} className="mr-1" />
                Annuler
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};