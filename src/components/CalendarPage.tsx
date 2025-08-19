import FullCalendar from "@fullcalendar/react";
import dayGridPlugin from "@fullcalendar/daygrid";
import interactionPlugin from "@fullcalendar/interaction";
import { useState } from "react";

export default function DashboardCalendar() {
  const [events, setEvents] = useState([
    { title: "Sample Event", date: "2025-07-12" },
  ]);

  const handleDateClick = (arg: any) => {
    const title = prompt("Enter event title:");
    if (title) {
      setEvents([...events, { title, date: arg.dateStr }]);
    }
  };

  const handleEventClick = (clickInfo: any) => {
    const confirmDelete = window.confirm(
        `Do you want to delete the event '${clickInfo.event.title}'?`
    );
    if (confirmDelete) {
        const updatedEvents = events.filter(
        (event) => !(event.title === clickInfo.event.title && event.date === clickInfo.event.startStr)
        );
        setEvents(updatedEvents);
    }
    };

  return (
    <FullCalendar
      plugins={[dayGridPlugin, interactionPlugin]}
      initialView="dayGridMonth"
      events={events}
      dateClick={handleDateClick}
      eventClick={handleEventClick}
      height="auto"
    />
  );
}
