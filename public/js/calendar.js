import { auth, database, analytics, sendPasswordResetEmail, signInWithEmailAndPassword, ref, set, get } from './firebaseConfig.js';

document.addEventListener('DOMContentLoaded', function() {
  var calendarEl = document.getElementById('calendar');

  var calendar = new FullCalendar.Calendar(calendarEl, {
    initialView: 'dayGridMonth',
    headerToolbar: {
      left: 'prev,next today',
      center: 'title',
      right: 'dayGridMonth,timeGridWeek,timeGridDay'
    },
    // Opționale: adaugă alte opțiuni cum ar fi butoane, interacțiuni etc.
    dateClick: function(info) {
      // Handler pentru click pe o dată
      alert('Date: ' + info.dateStr);
      // Arată formularul de adăugare eveniment sau deschide un popup/modal
    },
    events: {
      // URL-ul endpoint-ului tău pentru a prelua evenimentele utilizatorului
      url: '/path/to/your/events/api',
      method: 'GET'
    },
    selectable: true,
    selectHelper: true,
    select: function(start, end) {
      // Handler pentru selectarea unui interval de timp
      var title = prompt('Event Title:');
      if (title) {
        calendar.addEvent({
          title: title,
          start: start,
          end: end,
          allDay: true
        });
        // Adaugă evenimentul în backend-ul tău
      }
      calendar.unselect();
    },
    editable: true,
    // alte opțiuni ...
  });

  calendar.render();
});
