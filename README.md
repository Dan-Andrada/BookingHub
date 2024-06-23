# UPT Booking Hub

UPT Booking Hub este o aplicație web pentru gestionarea rezervărilor sălilor în cadrul Universității Politehnica Timișoara.

## Caracteristici
- Autentificare și autorizare a utilizatorilor
- Rezervări unice și recurente
- Vizualizarea rezervărilor într-un calendar
- Gestionarea feedback-ului de la utilizatori
- Exportarea calendarului în format ICS

## Precondiții

- [Node.js](https://nodejs.org/en)
- [Firebase Account](https://firebase.google.com/)

## Instalare

1. **Clonarea repository-ului:**

   ```bash
   git clone https://github.com/Dan-Andrada/BookingHub.git
   cd BookingHub

2. **Instalarea dependințelor:**

   ```bash
    npm install

3. **Configurarea Firebase:**

    Configurează Firebase utilizând [Using Firebase CLI](https://firebase.google.com/docs/web/setup).

4. **Rulare:**

   ```bash
    npm start      
*
   Aplicația va fi disponibilă la (http://127.0.0.1:5501/).

   ## Dependențe

- `@fullcalendar/core`: Biblioteca principală FullCalendar pentru afișarea calendarului.
- `@fullcalendar/daygrid`: Plugin FullCalendar pentru vizualizarea calendarului în mod grilă zilnică.
- `@fullcalendar/list`: Plugin FullCalendar pentru vizualizarea evenimentelor în mod listă.
- `@fullcalendar/timegrid`: Plugin FullCalendar pentru vizualizarea calendarului în mod grilă de timp.
- `ionicons`: Set de iconițe pentru utilizarea în interfața utilizatorului.
- `moment`: Biblioteca de manipulare a datelor și timpului.
- `toastr`: Bibliotecă pentru afișarea notificărilor toast.
