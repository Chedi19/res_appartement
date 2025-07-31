export interface Reservation {
  id: string;
  apartment: string;
  startDate: string;
  endDate: string;
  notes?: string;
  color?: string;
}

export interface Apartment {
  id: string;
  name: string;
  color: string;
}

export interface DateRange {
  startDate: Date;
  endDate: Date;
}

export interface CalendarEvent {
  id: string;
  title: string;
  start: Date;
  end: Date;
  color: string;
  apartment: string;
  notes?: string;
}