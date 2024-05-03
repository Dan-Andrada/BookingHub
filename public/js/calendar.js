import { auth, database, analytics, ref, set, get, query, orderByChild, startAt, endAt, push } from "./firebaseConfig.js";
import { Calendar } from "https://cdn.skypack.dev/@fullcalendar/core";
import dayGridPlugin from "https://cdn.skypack.dev/@fullcalendar/daygrid";
import timeGridPlugin from "https://cdn.skypack.dev/@fullcalendar/timegrid";
import interactionPlugin from "https://cdn.skypack.dev/@fullcalendar/interaction";
import listPlugin from "https://cdn.skypack.dev/@fullcalendar/list";

document.addEventListener("DOMContentLoaded", function () {
  const calendarEl = document.getElementById("calendar");
  const addEventButton = document.getElementById("addEventButton");
  const eventPopup = document.getElementById("eventPopup");
  const addEventForm = document.getElementById("addEventForm");
  const eventSelect = document.getElementById("event-type-select");
  const overlay = document.getElementById("overlay");

  if (!calendarEl || !addEventButton || !eventPopup || !addEventForm || !eventSelect) {
    console.error("One or more elements are missing in your HTML structure.");
    return;
  }

  updateDateTimeInputs();
  populateEventTypesSelect();

  const calendar = new Calendar(calendarEl, {
    plugins: [dayGridPlugin, timeGridPlugin, listPlugin, interactionPlugin],
    initialView: "dayGridMonth",
    locale: "ro",
    headerToolbar: {
      left: "prev,next today",
      center: "title",
      right: "dayGridMonth,timeGridWeek,timeGridDay,listMonth",
    },
    buttonText: {
      today: "Azi",
      month: "Lună",
      week: "Săptămână",
      day: "Zi",
      list: "Listă",
    },
  });

  
function loadEventsToCalendar() {

  const bookingsRef = ref(database, 'rezervari');
  get(bookingsRef).then((snapshot) => {
    if (snapshot.exists()) {
      snapshot.forEach((child) => {
        const eventData = child.val();
        calendar.addEvent({
          title: eventData.title,
          start: eventData.start,
          end: eventData.end,
          allDay: eventData.allDay,
          extendedProps: {
            location: eventData.location,
            eventType: eventData.eventType
          }
        });
      });
    } else {
      console.log("No events found");
    }
  }).catch((error) => {
    console.error("Error loading events:", error);
  });
}

  calendar.render();
  loadEventsToCalendar();
  addEventButton.addEventListener("click", showAddEventPopup);
  overlay.addEventListener("click", closeAddEventPopup);
  addEventForm.addEventListener("submit", submitEventForm);
  addEventForm.addEventListener("reset", closeAddEventPopup);

  document.getElementById('recurrence').addEventListener('change', handleRecurrenceChange);

  function updateDateTimeInputs() {
    const now = new Date();
    const dateNow = now.toISOString().split('T')[0];
    const timeNow = now.toTimeString().split(':').slice(0,2).join(':');

    const startDateInput = document.getElementById('eventStartDate');
    const startTimeInput = document.getElementById('eventStartTime');
    const endDateInput = document.getElementById('eventEndDate');
    const endTimeInput = document.getElementById('eventEndTime');

    startDateInput.min = dateNow;
    startTimeInput.min = timeNow;
    endDateInput.min = dateNow;
    endTimeInput.min = timeNow;

    startDateInput.value = dateNow;
    startTimeInput.value = timeNow;
    endDateInput.value = dateNow;
    endTimeInput.value = timeNow;

    startDateInput.addEventListener('change', function() {
      endDateInput.value = this.value;
    });

    startTimeInput.addEventListener('change', function() {
      const startTime = this.value.split(':');
      let hours = parseInt(startTime[0], 10);
      let minutes = startTime[1];

      hours += 2;
      if (hours >= 24) {
        hours -= 24;
      }

      endTimeInput.value = `${hours.toString().padStart(2, '0')}:${minutes}`;
    });
  }

  function handleRecurrenceChange() {
    const selectedRecurrenceType = this.value;
    const recurrenceGroups = document.querySelectorAll('.recurrence-group');
    recurrenceGroups.forEach(group => group.style.display = 'none');

    if (selectedRecurrenceType !== 'none') {
      document.getElementById(selectedRecurrenceType + 'Options').style.display = 'block';
    }
  }

  function populateEventTypesSelect() {
    const eventTypesRef = ref(database, "eventTypes");
    get(eventTypesRef)
      .then((snapshot) => {
        if (snapshot.exists()) {
          const eventTypes = Object.values(snapshot.val()).sort();
          eventTypes.forEach((eventType) => {
            const optionElement = document.createElement("option");
            optionElement.value = eventType;
            optionElement.textContent = eventType;
            eventSelect.appendChild(optionElement);
          });
        } else {
          console.log("Nu s-au găsit tipuri de evenimente.");
        }
      })
      .catch((error) => {
        console.error("Eroare la încărcarea tipurilor de evenimente: ", error);
      });
  }

  document.getElementById("eventLocation").addEventListener("input", function(e) {
    const inputText = e.target.value.toLowerCase(); // Convert input to lower case for case-insensitive comparison
    updateLocationSuggestions(inputText);
  });
  
  function updateLocationSuggestions(inputText) {
    const roomsRef = ref(database, 'sali');
    get(roomsRef)
      .then((snapshot) => {
        const locationList = document.getElementById("locationList");
        locationList.innerHTML = "";
        let count = 0; // Initialize counter for limiting the results
        if (snapshot.exists()) {
          locationList.style.display = 'block';
          snapshot.forEach((childSnapshot) => {
            if (count < 3) { // Only process if less than 3 have been added
              const room = childSnapshot.val();
              if (room.nume_sala.toLowerCase().includes(inputText)) { // Case-insensitive search
                const item = document.createElement("div");
                item.className = "dropdown-item";
                item.innerHTML = `
                  <span class="icon">📚</span>
                  <div class="room-details">
                    <span class="room-name">${room.nume_sala}</span>
                    <div class="room-availability" style="color: ${room.isAvailable ? '#4CAF50' : '#f44336'};">
                      ${room.isAvailable ? 'Disponibilă' : 'Disponibilă'}
                    </div>
                  </div>
                  <span class="room-capacity">Capacity: ${room.capacitate}</span>
                `;
                item.onclick = function() {
                  document.getElementById("eventLocation").value = room.nume_sala;
                  locationList.style.display = 'none';
                };
                locationList.appendChild(item);
                count++; // Increment the counter
              }
            }
          });
          if (count === 0) locationList.style.display = 'none'; // Hide if no results
        } else {
          locationList.style.display = 'none';
        }
      })
      .catch((error) => {
        console.error("Error fetching rooms:", error);
      });
  }

  document.addEventListener("click", function(event) {
    const locationList = document.getElementById("locationList");
    const eventLocationInput = document.getElementById("eventLocation");
  
    if (!eventLocationInput.contains(event.target) && !locationList.contains(event.target)) {
      locationList.style.display = 'none';
    }
  });
  

  function submitEventForm(event) {
    event.preventDefault();
  
    const startDate = new Date(document.getElementById('eventStartDate').value + 'T' + document.getElementById('eventStartTime').value);
    const endDate = new Date(document.getElementById('eventEndDate').value + 'T' + document.getElementById('eventEndTime').value);
    const eventName = document.getElementById("eventName").value;
    const eventType = document.getElementById("event-type-select").value;
    const location = document.getElementById("eventLocation").value;
    const recurrenceType = document.getElementById("recurrence").value;
  
    if (endDate <= startDate) {
      alert("Data și ora de sfârșit trebuie să fie după data și ora de început.");
      return;
    }
  
    let eventData = {
      title: eventName + " (" + eventType + ")",
      start: startDate.toISOString(),
      end: endDate.toISOString(),
      allDay: false,
      location: location,
      recurrence: recurrenceType
    };
  
    // Check availability and handle recurrence
    if (recurrenceType === 'weekly') {
      // Handle weekly recurrence
      handleWeeklyBooking(eventData, startDate, endDate);
    } else {
      // Handle non-recurring booking
      addBooking(eventData);
    }
  }
  
  function handleWeeklyBooking(eventData, startDate, endDate) {
    // Calculate all the occurrences based on the selected weekly interval and day
    let current = new Date(startDate);
    const endRecurrence = new Date(current);
    endRecurrence.setFullYear(current.getFullYear() + 1); // For example, end after one year
  
    while (current <= endRecurrence) {
      // Check availability for each date
      checkAvailabilityAndBook({ ...eventData, start: current.toISOString(), end: new Date(current.getTime() + (endDate - startDate)).toISOString() });
      current.setDate(current.getDate() + 7); // Move to next week
    }
  }
  
  function checkAvailabilityAndBook(eventData) {
    const bookingsRef = ref(database, `rezervari`);
    const queryRef = query(bookingsRef, orderByChild('location'), equalTo(eventData.location));
  
    get(queryRef).then(snapshot => {
      let isAvailable = true;
      snapshot.forEach(booking => {
        const b = booking.val();
        // Check for time overlap
        if (!(eventData.end <= b.start || eventData.start >= b.end)) {
          isAvailable = false;
        }
      });
  
      if (isAvailable) {
        // Save the booking
        const newBookingRef = push(bookingsRef);
        set(newBookingRef, eventData).then(() => {
          console.log("Booking added successfully!");
          calendar.addEvent(eventData);
        });
      } else {
        console.error("Booking failed: Room is not available during the selected times.");
      }
    }).catch(error => {
      console.error("Error checking availability:", error);
    });
  }
  
  function addBooking(eventData) {
    const bookingsRef = ref(database, 'rezervari');
    const newBookingRef = push(bookingsRef);
    set(newBookingRef, eventData).then(() => {
      console.log("Booking added successfully!");
      calendar.addEvent(eventData);
      closeAddEventPopup();
    }).catch(error => {
      console.error("Failed to add booking:", error);
    });
  }
  

  function showAddEventPopup() {
    updateDateTimeInputs(); 
    eventPopup.style.display = "block";
    overlay.style.display = "block";
  }

  function closeAddEventPopup() {
    eventPopup.style.display = "none";
    overlay.style.display = "none";
    addEventForm.reset(); 
    const recurrenceGroups = document.querySelectorAll('.recurrence-group');
    recurrenceGroups.forEach(group => group.style.display = 'none'); 
  }
});
