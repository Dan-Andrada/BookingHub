import {
  auth,
  database,
  ref,
  set,
  get,
  push,
  query,
  orderByChild,
  equalTo,
} from "./firebaseConfig.js";
import { Calendar } from "https://cdn.skypack.dev/@fullcalendar/core";
import dayGridPlugin from "https://cdn.skypack.dev/@fullcalendar/daygrid";
import timeGridPlugin from "https://cdn.skypack.dev/@fullcalendar/timegrid";
import interactionPlugin from "https://cdn.skypack.dev/@fullcalendar/interaction";
import listPlugin from "https://cdn.skypack.dev/@fullcalendar/list";

function getUserInfo(userId, callback) {
  const userRef = ref(database, `users/${userId}`);
  get(userRef)
    .then((snapshot) => {
      if (snapshot.exists()) {
        callback(snapshot.val());
      } else {
        console.log("No user data found for ID:", userId);
        callback(null);
      }
    })
    .catch((error) => {
      console.error("Failed to retrieve user data:", error);
      callback(null);
    });
}

document.addEventListener("DOMContentLoaded", function () {
  const calendarEl = document.getElementById("calendar");
  const addEventButton = document.getElementById("addEventButton");
  const eventPopup = document.getElementById("eventPopup");
  const addEventForm = document.getElementById("addEventForm");
  const eventSelect = document.getElementById("event-type-select");
  const filterSelectCalendar = document.getElementById(
    "filter-select-calendar"
  );
  const roomSelect = document.getElementById("filter-room-select");
  const filterSelectForm = document.getElementById("filter-select-form");
  const overlay = document.getElementById("overlay");
  const exportCalendarButton = document.getElementById("exportCalendarButton");

  exportCalendarButton.addEventListener("click", function() {
    const events = calendar.getEvents();
    if (events.length > 0) {
      const icsData = createICSFromEvents(events);
      downloadICSFile(icsData, 'export-calendar.ics');
    } else {
      alert("Nu există evenimente în calendar pentru a exporta.");
    }
  });

  function createICSFromEvents(events) {
    let icsComponents = [
      'BEGIN:VCALENDAR',
      'VERSION:2.0',
      'PRODID:-//Your Organization//Your Calendar//EN'
    ];

    events.forEach(event => {
      const start = formatDateToICS(new Date(event.start));
      const end = formatDateToICS(new Date(event.end));
      icsComponents.push(
        'BEGIN:VEVENT',
        `UID:${event.id}@yourdomain.com`,
        `SUMMARY:${event.title}`,
        `DTSTART:${start}`,
        `DTEND:${end}`,
        `DESCRIPTION:${event.extendedProps.description}`,
        `LOCATION:${event.extendedProps.location}`,
        'END:VEVENT'
      );
    });

    icsComponents.push('END:VCALENDAR');
    return icsComponents.join('\r\n');
  }

  function downloadICSFile(data, filename) {
    const blob = new Blob([data], { type: 'text/calendar;charset=utf-8;' });
    const link = document.createElement('a');
    link.href = URL.createObjectURL(blob);
    link.style.display = 'none';
    link.download = filename;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  }

  function formatDateToICS(date) {
    if (!(date instanceof Date)) {
        date = new Date(date);
    }
    
    return date.toISOString();
}


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
  populateRoomSelect();
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
    dayMaxEvents: 2,
    moreLinkContent: function (args) {
      return "+" + args.num + " mai multe";
    },
    moreLinkClick: "popover",
    eventClick: function (info) {
      const event = info.event;
      const eventTypeClass = `event-type-${event.extendedProps.eventType}`;
      getUserInfo(event.extendedProps.userId, function (userData) {
        let userNameDisplay = userData
          ? `${userData.firstName} ${userData.lastName}`
          : "Unknown User";
        let popoverContent = `
          <div>
            <strong>${event.title}</strong><br/>
            <strong>📍</strong> ${event.extendedProps.location}<br/>
            <strong>📃</strong> ${event.extendedProps.description || "N/A"}<br/>
            <strong>🕒</strong> ${new Date(
              event.start
            ).toLocaleTimeString()} - ${new Date(
          event.end
        ).toLocaleTimeString()}<br/>
            <strong>👤</strong> ${userNameDisplay}
          </div>
        `;
        let popoverElement = document.createElement("div");
        popoverElement.className = `event-popover ${eventTypeClass}`;
        popoverElement.innerHTML = popoverContent;
        document.body.appendChild(popoverElement);
        let popperInstance = Popper.createPopper(info.el, popoverElement, {
          placement: "auto",
          modifiers: [{ name: "offset", options: { offset: [0, 8] } }],
        });

        function hidePopoverOnClickOutside(event) {
          if (
            !popoverElement.contains(event.target) &&
            !info.el.contains(event.target)
          ) {
            popoverElement.remove();
            document.removeEventListener("click", hidePopoverOnClickOutside);
          }
        }
        document.addEventListener("click", hidePopoverOnClickOutside);
      });
    },
  });

  function loadEventsToCalendar() {

    let activeFilter = null;
    let filterValue = null;

    if (!filterSelectCalendar.disabled && filterSelectCalendar.value !== "all") {
      activeFilter = "filterType";
      filterValue = filterSelectCalendar.value;
    } else if (!roomSelect.disabled && roomSelect.value !== "all") {
      activeFilter = "location";
      filterValue = roomSelect.value;
    }

    let queryRef = ref(database, "rezervari");
    if (activeFilter && filterValue) {
      queryRef = query(queryRef, orderByChild(activeFilter), equalTo(filterValue));
    } else {
      queryRef = query(queryRef, orderByChild("status"), equalTo("acceptat"));
    }

    get(queryRef).then(snapshot => {
      calendar.removeAllEvents();
      if (snapshot.exists()) {
        snapshot.forEach(childSnapshot => {
          const event = childSnapshot.val();
          if (event.status === "acceptat" && (!activeFilter || event[activeFilter] === filterValue)) {
            let eventStart = new Date(event.start);
            let eventEnd = new Date(event.end);
            calendar.addEvent(createEventObject(event, eventStart, eventEnd));
          }
        });
      }
      calendar.render();
    }).catch(error => {
      console.error("Error loading events:", error);
    });
}

  filterSelectCalendar.addEventListener("change", function () {
    if (this.value !== "all") {
      roomSelect.disabled = true;
    } else {
      roomSelect.disabled = false;
    }
    loadEventsToCalendar();
  });

  roomSelect.addEventListener("change", function () {
    if (this.value !== "all") {
      filterSelectCalendar.disabled = true;
    } else {
      filterSelectCalendar.disabled = false;
    }
    loadEventsToCalendar();
  });

  function populateRoomSelect() {
    
    const roomsRef = ref(database, "sali"); 
    get(roomsRef).then(snapshot => {
      if (snapshot.exists()) {
        snapshot.forEach(childSnapshot => {
          const room = childSnapshot.val();
          const option = document.createElement('option');
          option.value = room.nume_sala; 
          option.textContent = room.nume_sala;
          roomSelect.appendChild(option);
        });
      } else {
        console.log("No rooms found.");
      }
    }).catch(error => {
      console.error("Error fetching rooms:", error);
    });
  }
  

  function createEventObject(event, start, end) {
    return {
      title: event.title + " (" + event.location + ")",
      start: start.toISOString().replace("Z", ""),
      end: end.toISOString().replace("Z", ""),
      backgroundColor: determineEventColor(event.eventType),
      borderColor: determineEventColor(event.eventType),
      textColor: "#ffffff",
      extendedProps: {
        location: event.location,
        eventType: event.eventType,
        description: event.description,
        userId: event.userId,
      },
    };
  }

  function determineEventColor(eventType) {
    switch (eventType) {
      case "curs":
        return "#007bff"; // albastru
      case "laborator":
        return "#28a745"; // verde
      case "seminar":
        return "#dc3545"; //roz
      case "examen":
        return "#dcdc38"; //galben
      default:
        return "#6c757d"; //gri
    }
  }

  calendar.render();
  loadEventsToCalendar();
  addEventButton.addEventListener("click", showAddEventPopup);
  overlay.addEventListener("click", closeAddEventPopup);

  auth.onAuthStateChanged(function(user) {
    if (user) {
      addEventButton.style.display = "block";
      addEventButton.addEventListener("click", showAddEventPopup);
    } else {
      addEventButton.style.display = "none";
    }
  });

  document.getElementById("addEventForm").addEventListener("submit", async function(event) {
    event.preventDefault(); 
  
    const selectedLocation = document.getElementById("eventLocation").value;
    const startInput = document.getElementById("eventStartDate").value + 'T' + document.getElementById("eventStartTime").value;
    const endInput = document.getElementById("eventEndDate").value + 'T' + document.getElementById("eventEndTime").value;
  
    const startDate = new Date(startInput);
    const endDate = new Date(endInput);

    const isAvailable = await checkRoomAvailability(selectedLocation, startDate, endDate);
  
    if (!isAvailable) {
      toastr.error("Sala selectată nu este disponibilă. Vă rugăm să alegeți altă sală.", {
        timeOut: 5000,
      });
    } else {
      submitEventForm(event);
    }
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

    for (let hour = 8; hour <= 20; hour += 2) {
      const option = document.createElement("option");
      option.value = `${hour.toString().padStart(2, "0")}:00`;
      option.textContent = `${hour.toString().padStart(2, "0")}:00`;
      startTimeInput.appendChild(option);
    }

    startDateInput.addEventListener("change", function () {
      endDateInput.value = this.value;
      startTimeInput.dispatchEvent(new Event("change"));
    });

    startTimeInput.addEventListener("change", function () {
      console.log("Start time changed");
      endTimeInput.innerHTML = "";
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

    startTimeInput.dispatchEvent(new Event("change"));

    suggestNextStartTime();
  }

  function suggestNextStartTime() {
    const now = new Date();
    let currentHour = now.getHours();
    const currentMinute = now.getMinutes();

    if (currentHour >= 22) {
      now.setDate(now.getDate() + 1);
      currentHour = 8;
    } else if (currentHour % 2 !== 0 || currentMinute > 0) {
      currentHour += 2 - (currentHour % 2);
    }

    if (currentHour >= 20) {
      now.setDate(now.getDate() + 1);
      currentHour = 8;
    }

    const suggestedStartTime = `${currentHour.toString().padStart(2, "0")}:00`;
    const suggestedEndTime = `${(currentHour + 2)
      .toString()
      .padStart(2, "0")}:00`;

    document.getElementById("eventStartDate").value = now
      .toISOString()
      .split("T")[0];
    document.getElementById("eventStartTime").value = suggestedStartTime;
    document.getElementById("eventEndDate").value = now
      .toISOString()
      .split("T")[0];
    document.getElementById("eventEndTime").value = suggestedEndTime;
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
    get(filterRef)
      .then((snapshot) => {
        if (snapshot.exists()) {
          filterSelect.innerHTML =
            '<option value="all">Toate evenimentele</option>';
          Object.values(snapshot.val()).forEach((filterType) => {
            const optionElement = document.createElement("option");
            optionElement.value = filterType;
            optionElement.textContent = filterType;
            filterSelect.appendChild(optionElement);
          });
        } else {
          console.log("No filters found.");
        }
      })
      .catch((error) => {
        console.error("Error loading filters: ", error);
      });
  }

  document
    .getElementById("eventLocation")
    .addEventListener("input", function (e) {
      const inputText = e.target.value.toLowerCase();
      updateLocationSuggestions(inputText);
    });

  function toLocalISOString(date) {
    const offset = date.getTimezoneOffset() * 60000;
    const localISOTime = new Date(date.getTime() - offset).toISOString();
    return localISOTime;
  }

  function checkRoomAvailability(roomId, localStartDate, localEndDate) {
    const startISO = toLocalISOString(localStartDate);
    const endISO = toLocalISOString(localEndDate);
  
    console.log(`Checking availability for ${roomId} between ${startISO} and ${endISO}`);
  
    const bookingsRef = query(
      ref(database, "rezervari"),
      orderByChild("location"),
      equalTo(roomId)
    );
  
    return get(bookingsRef)
      .then((snapshot) => {
        let isAvailable = true;
        if (snapshot.exists()) {
          snapshot.forEach((reservationSnapshot) => {
            const reservation = reservationSnapshot.val();
            console.log(`Comparing with booking from ${reservation.start} to ${reservation.end}`);
            if (startISO < reservation.end && endISO > reservation.start) {
              console.log("Overlap found, room is not available");
              isAvailable = false;
              return true; 
            }
          });
        } else {
          console.log("No bookings found for this room.");
        }
        console.log(`Room ${roomId} availability: ${isAvailable}`);
        return isAvailable;
      })
      .catch((error) => {
        console.error("Failed to check room availability:", error);
        return false; 
      });
  }
  

  function updateLocationSuggestions(inputText) {
    const startInput = document.getElementById("eventStartDate").value + 'T' + document.getElementById("eventStartTime").value;
    const endInput = document.getElementById("eventEndDate").value + 'T' + document.getElementById("eventEndTime").value;
  
    const startDate = new Date(startInput);
    const endDate = new Date(endInput);
  
    const roomsRef = ref(database, "sali");
    get(roomsRef).then(snapshot => {
      const locationList = document.getElementById("locationList");
      locationList.innerHTML = "";
      let count = 0;
      if (snapshot.exists()) {
        locationList.style.display = "block";
        snapshot.forEach(childSnapshot => {
          if (count >= 3) return; 
  
          const room = childSnapshot.val();
          const roomName = room.nume_sala;  
 
          checkRoomAvailability(roomName, startDate, endDate).then(isAvailable => {
            if (roomName.toLowerCase().includes(inputText.toLowerCase())) {
              const item = document.createElement("div");
              item.className = "dropdown-item";
              item.innerHTML = `
                <span class="icon">📚</span>
                <div class="room-details">
                  <span class="room-name">${roomName}</span>
                  <div class="room-availability" style="color: ${isAvailable ? "#4CAF50" : "#f44336"};">
                    ${isAvailable ? "Disponibilă" : "Indisponibilă"}
                  </div>
                </div>
                <span class="room-capacity">Capacitate: ${room.capacitate}</span>
              `;
              item.onclick = function () {
                document.getElementById("eventLocation").value = roomName;
                locationList.style.display = "none";
              };
              locationList.appendChild(item);
            }
            count++;
          });
        });
        if (count === 0) {
          //locationList.innerHTML = "<div>Nicio sală disponibilă.</div>";
          locationList.style.display = "block";
        }
      } else {
       // locationList.innerHTML = "<div>Nicio sală disponibilă.</div>";
        locationList.style.display = "block";
      }
    }).catch(error => {
      console.error("Error fetching rooms:", error);
      locationList.innerHTML = `<div>Eroare la încărcare: ${error.message}</div>`;
      locationList.style.display = "block";
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

    const userId = auth.currentUser.uid;
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
      : null;

    const fullStart = new Date(`${startDate}T${startTime}:00Z`);
    const fullEnd = new Date(`${endDate}T${endTime}:00Z`);
    const now = new Date();

    if (fullStart < now) {
      toastr.error("Nu puteți face o rezervare în trecut!", {
        timeOut: 5000,
      });
      return;
    }

    let eventData = {
      title: eventName,
      start: fullStart.toISOString(),
      end: fullEnd.toISOString(),
      userId: userId,
      location: location,
      description: eventDescription,
      eventType: eventType,
      filterType: filterType,
      status: "pending",
    };

    if (recurrenceType && recurrenceType !== "none" && recurrenceCount) {
      eventData.recurrence = {
        type: recurrenceType,
        count: recurrenceCount,
      };
    }
    addBooking(eventData);
  }

  function addBooking(eventData) {
    const user = auth.currentUser;
    if (!user) {
      console.error("No user logged in");
      return;
    }

    console.log("Current user ID:", user.uid);

    get(ref(database, `users/${user.uid}`))
      .then((snapshot) => {
        if (snapshot.exists()) {
          const userInfo = snapshot.val();
          console.log("User info retrieved:", userInfo);

          if (userInfo.role === "secretar") {
            eventData.status = "acceptat";
            console.log("Booking automatically approved for secretary.");
          } else {
            eventData.status = "pending";
            console.log("Booking set to pending for non-secretary user.");
          }

          const bookingsRef = ref(database, "rezervari");
          const newBookingRef = push(bookingsRef);
          set(newBookingRef, eventData)
            .then(() => {
              console.log("Booking added successfully with pending status!");
              if (eventData.status === "acceptat") {
                calendar.addEvent({
                  ...eventData,
                  title: eventData.title + " (" + eventData.location + ")",
                  start: new Date(eventData.start).toISOString(),
                  end: new Date(eventData.end).toISOString(),
                });
                loadEventsToCalendar();
              }
              closeAddEventPopup();
            })
            .catch((error) => {
              console.error("Failed to add booking:", error);
            });
        } else {
          console.error("User data not found");
        }
      })
      .catch((error) => {
        console.error("Error retrieving user data:", error);
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