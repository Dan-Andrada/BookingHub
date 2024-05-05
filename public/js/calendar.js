import {
  auth,
  database,
  analytics,
  ref,
  set,
  get,
  query,
  orderByChild,
  startAt,
  endAt,
  push,
} from "./firebaseConfig.js";
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
  const filterSelectCalendar = document.getElementById("filter-select-calendar");
  const filterSelectForm = document.getElementById("filter-select-form");
  const overlay = document.getElementById("overlay");

  if (
    !calendarEl ||
    !addEventButton ||
    !eventPopup ||
    !addEventForm ||
    !eventSelect
  ) {
    console.error("One or more elements are missing in your HTML structure.");
    return;
  }

  updateDateTimeInputs();
  populateEventTypesSelect();
  populateFilterSelect(filterSelectCalendar);
  populateFilterSelect(filterSelectForm);

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

  let currentFilter = 'all';  // Valoarea implicită pentru a afișa toate evenimentele

  function loadEventsToCalendar() {
    const bookingsRef = ref(database, "rezervari");
    get(bookingsRef)
      .then((snapshot) => {
        if (snapshot.exists()) {
          calendar.removeAllEvents(); // Îndepărtează toate evenimentele pentru a evita duplicarea
          const eventsToAdd = []; // Colectează evenimentele pentru adăugare
          snapshot.forEach((childSnapshot) => {
            const event = childSnapshot.val();
            let eventStart = new Date(event.start);
            let eventEnd = new Date(event.end);

            if (currentFilter === 'all' || event.filterType === currentFilter) {
              if (event.recurrence && event.recurrence.type === "weekly") {
                for (let i = 0; i < event.recurrence.count; i++) {
                  eventsToAdd.push(createEventObject(event, new Date(eventStart), new Date(eventEnd)));
                  eventStart.setDate(eventStart.getDate() + 7);
                  eventEnd.setDate(eventEnd.getDate() + 7);
                }
              } else {
                eventsToAdd.push(createEventObject(event, eventStart, eventEnd));
              }
            }
          });
          // Adaugă toate evenimentele odată
          eventsToAdd.forEach(event => calendar.addEvent(event));
          calendar.render(); // Reîmprospătează evenimentele o singură dată după adăugare
        } else {
          console.log("No events found");
        }
      })
      .catch((error) => {
        console.error("Error loading events:", error);
      });
}

function createEventObject(event, start, end) {
  return {
    title: event.title + " (" + event.location + ")",
    start: start.toISOString(),
    end: end.toISOString(),
    backgroundColor: determineEventColor(event.eventType),
    extendedProps: {
      location: event.location,
      eventType: event.eventType,
    },
  };
}

 
  function determineEventColor(eventSelect) {
    switch (eventSelect) {
      case "curs":
        return "#007bff"; 
      case "laborator":
        return "#28a745"; 
      case "seminar":
        return "#dc3545"; 
      default:
        return "#6c757d"; 
    }
  }

  calendar.render();
  loadEventsToCalendar();
  addEventButton.addEventListener("click", showAddEventPopup);
  overlay.addEventListener("click", closeAddEventPopup);
  addEventForm.addEventListener("submit", submitEventForm);
  addEventForm.addEventListener("reset", closeAddEventPopup);
  filterSelectCalendar.addEventListener('change', function() {
    currentFilter = this.value;
    loadEventsToCalendar();  // Reface interogarea și reîncarcă evenimentele conform noului filtru
  });

  document
    .getElementById("recurrence")
    .addEventListener("change", handleRecurrenceChange);

  function updateDateTimeInputs() {
    const now = new Date();
    const dateNow = now.toISOString().split("T")[0];
    const startDateInput = document.getElementById("eventStartDate");
    const startTimeInput = document.getElementById("eventStartTime");
    const endDateInput = document.getElementById("eventEndDate");
    const endTimeInput = document.getElementById("eventEndTime");

    startDateInput.min = dateNow;
    startDateInput.value = dateNow;
    endDateInput.min = dateNow;
    endDateInput.value = dateNow;

    // Populate start time options
    for (let hour = 8; hour <= 20; hour += 2) {
      const option = document.createElement("option");
      option.value = `${hour.toString().padStart(2, "0")}:00`;
      option.textContent = `${hour.toString().padStart(2, "0")}:00`;
      startTimeInput.appendChild(option);
    }

    // Set end date the same as start date initially and on change
    startDateInput.addEventListener("change", function () {
      endDateInput.value = this.value;
      startTimeInput.dispatchEvent(new Event("change")); // Update end time options when start date changes
    });

    // Populate end time options dynamically based on start time selection
    startTimeInput.addEventListener("change", function () {
      endTimeInput.innerHTML = ""; // Clear previous options
      const selectedHour = parseInt(this.value.split(":")[0], 10);
      for (let hour = selectedHour + 2; hour <= 22; hour += 2) {
        const option = document.createElement("option");
        option.value = `${hour.toString().padStart(2, "0")}:00`;
        option.textContent = `${hour.toString().padStart(2, "0")}:00`;
        endTimeInput.appendChild(option);
      }
      if (selectedHour + 2 <= 22) {
        endTimeInput.value = `${(selectedHour + 2)
          .toString()
          .padStart(2, "0")}:00`;
      }
    });

    startTimeInput.dispatchEvent(new Event("change")); // Trigger change to populate end time initially

    // Suggest next start time
    suggestNextStartTime();
  }

  // Function to suggest next start time
  function suggestNextStartTime() {
    const now = new Date();
    const currentHour = now.getHours();
    const currentMinute = now.getMinutes();
    const roundedHour = currentMinute >= 30 ? currentHour + 1 : currentHour;
    const suggestedHour = roundedHour < 22 ? roundedHour : 22;
    const suggestedTime = `${suggestedHour.toString().padStart(2, "0")}:00`;
    document.getElementById("eventStartTime").value = suggestedTime;
  }

  function handleRecurrenceChange() {
    const selectedRecurrenceType = this.value;
    const recurrenceGroups = document.querySelectorAll(".recurrence-group");
    recurrenceGroups.forEach((group) => (group.style.display = "none"));

    if (selectedRecurrenceType !== "none") {
      document.getElementById(
        selectedRecurrenceType + "Options"
      ).style.display = "block";
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

  function populateFilterSelect(filterSelect) {
    const filterRef = ref(database, "filtre");
    get(filterRef).then((snapshot) => {
      if (snapshot.exists()) {
        filterSelect.innerHTML = '<option value="all">Toate evenimentele</option>'; // Reset and add default option
        Object.values(snapshot.val()).forEach((filterType) => {
          const optionElement = document.createElement("option");
          optionElement.value = filterType;
          optionElement.textContent = filterType;
          filterSelect.appendChild(optionElement);
        });
      } else {
        console.log("No filters found.");
      }
    }).catch((error) => {
      console.error("Error loading filters: ", error);
    });
  }

  document
    .getElementById("eventLocation")
    .addEventListener("input", function (e) {
      const inputText = e.target.value.toLowerCase(); // Convert input to lower case for case-insensitive comparison
      updateLocationSuggestions(inputText);
    });

  function updateLocationSuggestions(inputText) {
    const roomsRef = ref(database, "sali");
    get(roomsRef)
      .then((snapshot) => {
        const locationList = document.getElementById("locationList");
        locationList.innerHTML = "";
        let count = 0; // Initialize counter for limiting the results
        if (snapshot.exists()) {
          locationList.style.display = "block";
          snapshot.forEach((childSnapshot) => {
            if (count < 3) {
              // Only process if less than 3 have been added
              const room = childSnapshot.val();
              if (room.nume_sala.toLowerCase().includes(inputText)) {
                // Case-insensitive search
                const item = document.createElement("div");
                item.className = "dropdown-item";
                item.innerHTML = `
                  <span class="icon">📚</span>
                  <div class="room-details">
                    <span class="room-name">${room.nume_sala}</span>
                    <div class="room-availability" style="color: ${
                      room.isAvailable ? "#4CAF50" : "#f44336"
                    };">
                      ${room.isAvailable ? "Disponibilă" : "Disponibilă"}
                    </div>
                  </div>
                  <span class="room-capacity">Capacity: ${
                    room.capacitate
                  }</span>
                `;
                item.onclick = function () {
                  document.getElementById("eventLocation").value =
                    room.nume_sala;
                  locationList.style.display = "none";
                };
                locationList.appendChild(item);
                count++; // Increment the counter
              }
            }
          });
          if (count === 0) locationList.style.display = "none"; // Hide if no results
        } else {
          locationList.style.display = "none";
        }
      })
      .catch((error) => {
        console.error("Error fetching rooms:", error);
      });
  }

  document.addEventListener("click", function (event) {
    const locationList = document.getElementById("locationList");
    const eventLocationInput = document.getElementById("eventLocation");

    if (
      !eventLocationInput.contains(event.target) &&
      !locationList.contains(event.target)
    ) {
      locationList.style.display = "none";
    }
  });

  function submitEventForm(event) {
    event.preventDefault();

    const eventName = document.getElementById("eventName").value;
    const eventDescription = document.getElementById("eventDescription").value;
    const eventType = document.getElementById("event-type-select").value;
    const filterType = document.getElementById("filter-select-form").value;
    const location = document.getElementById("eventLocation").value;
    const startDate = document.getElementById("eventStartDate").value;
    const startTime = document.getElementById("eventStartTime").value;
    const endDate = document.getElementById("eventEndDate").value;
    const endTime = document.getElementById("eventEndTime").value;
    const recurrenceType = document.getElementById("recurrence").value;
    const recurrenceCount = document.getElementById("recurEveryWeek").value
      ? parseInt(document.getElementById("recurEveryWeek").value)
      : null; // Assume that this field may not exist

    const fullStart = new Date(`${startDate}T${startTime}:00Z`);
    const fullEnd = new Date(`${endDate}T${endTime}:00Z`);

    let eventData = {
      title: eventName,
      start: fullStart.toISOString(),
      end: fullEnd.toISOString(),
      location: location,
      description: eventDescription,
      eventType: eventType,
      filterType: filterType
    };

    // Include the recurrence only if it's specifically defined and not 'none'
    if (recurrenceType && recurrenceType !== "none" && recurrenceCount) {
      eventData.recurrence = {
        type: recurrenceType,
        count: recurrenceCount,
      };
    }

    addBooking(eventData);
  }

  function addBooking(eventData) {
    const bookingsRef = ref(database, "rezervari");
    const newBookingRef = push(bookingsRef);
    set(newBookingRef, eventData)
      .then(() => {
        console.log("Booking added successfully!");
        calendar.addEvent({
          ...eventData,
          title: eventData.title + " (" + eventData.location + ")",
        });
        closeAddEventPopup();
      })
      .catch((error) => {
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
    const recurrenceGroups = document.querySelectorAll(".recurrence-group");
    recurrenceGroups.forEach((group) => (group.style.display = "none"));
  }
});
