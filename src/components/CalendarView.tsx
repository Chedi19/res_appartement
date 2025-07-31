import React, { useState, useCallback, useMemo } from 'react';
import { Calendar, ChevronLeft, ChevronRight, FileDown } from 'lucide-react';
import { Reservation, Apartment } from '../types/reservation';
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
  endOfWeek
} from 'date-fns';
import { fr } from 'date-fns/locale';

interface CalendarViewProps {
  reservations: Reservation[];
  apartments: Apartment[];
  onDateRangeSelect: (startDate: string, endDate: string) => void;
  onReservationEdit: (reservation: Reservation) => void;
  onPrintPDF: () => void;
}

interface DragState {
  reservationId: string;
  dragType: 'extend-start' | 'extend-end' | null;
  originalReservation: Reservation;
}

export const CalendarView: React.FC<CalendarViewProps> = ({
  reservations,
  apartments,
  onDateRangeSelect,
  onReservationEdit,
  onPrintPDF
}) => {
  const [currentDate, setCurrentDate] = useState(new Date());
  const [selectedRange, setSelectedRange] = useState<{ start: Date | null; end: Date | null }>({
    start: null,
    end: null
  });
  const [isSelecting, setIsSelecting] = useState(false);
  const [dragState, setDragState] = useState<DragState | null>(null);

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
    if (dragState) return; // Ignore les clics pendant le drag

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
  }, [isSelecting, selectedRange.start, onDateRangeSelect, dragState]);

  // Double-clic sur une réservation pour l'éditer
  const handleReservationDoubleClick = useCallback((reservation: Reservation, e: React.MouseEvent) => {
    e.stopPropagation();
    onReservationEdit(reservation);
  }, [onReservationEdit]);

  // Gestion du drag pour étendre les réservations
  const handleDragStart = useCallback((reservation: Reservation, dragType: 'extend-start' | 'extend-end', e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
    
    setDragState({
      reservationId: reservation.id,
      dragType,
      originalReservation: { ...reservation }
    });
  }, []);

  const handleDragOver = useCallback((date: Date, e: React.DragEvent) => {
    if (!dragState) return;
    e.preventDefault();
  }, [dragState]);

  const handleDrop = useCallback((date: Date, e: React.DragEvent) => {
    if (!dragState) return;
    e.preventDefault();
    
    // Ici, on devrait mettre à jour la réservation avec la nouvelle date
    // et afficher les boutons Save/Cancel
    // Pour cette implémentation, on reset juste le drag state
    setDragState(null);
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
                onDragOver={(e) => handleDragOver(date, e)}
                onDrop={(e) => handleDrop(date, e)}
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
                    const isStart = isSameDay(parseISO(reservation.startDate), date);
                    const isEnd = isSameDay(parseISO(reservation.endDate), date);
                    
                    return (
                      <div
                        key={reservation.id}
                        onDoubleClick={(e) => handleReservationDoubleClick(reservation, e)}
                        className={`
                          text-xs px-1 py-0.5 rounded text-white cursor-pointer
                          hover:opacity-80 transition-opacity relative group
                          ${isStart ? 'rounded-l' : ''}
                          ${isEnd ? 'rounded-r' : ''}
                        `}
                        style={{ backgroundColor: reservation.color }}
                        title={`${reservation.apartment} - ${reservation.notes || 'Pas de notes'}`}
                      >
                        {/* Handles pour étendre la réservation */}
                        {isStart && (
                          <div
                            className="absolute left-0 top-0 w-2 h-full cursor-w-resize opacity-0 group-hover:opacity-100 bg-white bg-opacity-30"
                            onMouseDown={(e) => handleDragStart(reservation, 'extend-start', e)}
                          />
                        )}
                        {isEnd && (
                          <div
                            className="absolute right-0 top-0 w-2 h-full cursor-e-resize opacity-0 group-hover:opacity-100 bg-white bg-opacity-30"
                            onMouseDown={(e) => handleDragStart(reservation, 'extend-end', e)}
                          />
                        )}
                        
                        <div className="truncate">
                          {isStart ? reservation.apartment : ''}
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
};