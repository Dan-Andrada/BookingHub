// Importă modulele FullCalendar folosind Skypack
import { Calendar } from 'https://cdn.skypack.dev/@fullcalendar/core';
import dayGridPlugin from 'https://cdn.skypack.dev/@fullcalendar/daygrid';
import interactionPlugin from 'https://cdn.skypack.dev/@fullcalendar/interaction';
import listPlugin from 'https://cdn.skypack.dev/@fullcalendar/list';

document.addEventListener('DOMContentLoaded', function() {
  const calendarEl = document.getElementById('calendar');
  const calendar = new Calendar(calendarEl, {
    plugins: [dayGridPlugin, interactionPlugin, listPlugin],
    initialView: 'dayGridMonth',
    headerToolbar: {
      left: 'prev,next today',
      center: 'title',
      right: 'dayGridMonth,listWeek'
    },
    events: [
        // Exemplu de eveniment
        {
            title: 'Our anniversary <3',
            start: '2024-04-23'
        }
        // Poti adauga mai multe evenimente aici
    ],
    editable: true,
    selectable: true,
    selectMirror: true,
    dayMaxEvents: true
    // Adaugă aici alte opțiuni specifice
  });

  calendar.render();
});
