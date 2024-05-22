import { auth, database, ref, set, get, push, query, orderByChild, equalTo} from "./firebaseConfig.js";
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

  let currentFilter = "all";

  function loadEventsToCalendar() {
    const bookingsRef = query(ref(database, "rezervari"), orderByChild("status"), equalTo("acceptat"));
    //const bookingsRef = ref(database, "rezervari");
    get(bookingsRef)
      .then((snapshot) => {
        if (snapshot.exists()) {
          calendar.removeAllEvents();
          const eventsToAdd = [];
          snapshot.forEach((childSnapshot) => {
            const event = childSnapshot.val();
            let eventStart = new Date(event.start);
            let eventEnd = new Date(event.end);

            if (currentFilter === "all" || event.filterType === currentFilter) {
              if (event.recurrence && event.recurrence.type === "weekly") {
                for (let i = 0; i < event.recurrence.count; i++) {
                  eventsToAdd.push(
                    createEventObject(
                      event,
                      new Date(eventStart),
                      new Date(eventEnd)
                    )
                  );
                  eventStart.setDate(eventStart.getDate() + 7);
                  eventEnd.setDate(eventEnd.getDate() + 7);
                }
              } else {
                eventsToAdd.push(
                  createEventObject(event, eventStart, eventEnd)
                );
              }
            }
          });
          calendar.removeAllEvents();
          eventsToAdd.forEach((event) => calendar.addEvent(event));
          calendar.render();
        }
      })
      .catch((error) => {
        console.error("Error loading events:", error);
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
  addEventForm.addEventListener("submit", submitEventForm);
  addEventForm.addEventListener("reset", closeAddEventPopup);
  filterSelectCalendar.addEventListener("change", function () {
    currentFilter = this.value;
    loadEventsToCalendar();
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
      return;
    }

    if (currentHour % 2 !== 0) {
      currentHour++;
    }

    if (currentHour === 24) {
      currentHour = 0;
    }

    if (currentHour >= 22) {
      return;
    }

    const suggestedTime = `${currentHour.toString().padStart(2, "0")}:00`;
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

  function updateLocationSuggestions(inputText) {
    const roomsRef = ref(database, "sali");
    get(roomsRef)
      .then((snapshot) => {
        const locationList = document.getElementById("locationList");
        locationList.innerHTML = "";
        let count = 0;
        if (snapshot.exists()) {
          locationList.style.display = "block";
          snapshot.forEach((childSnapshot) => {
            if (count < 3) {
              const room = childSnapshot.val();
              if (room.nume_sala.toLowerCase().includes(inputText)) {
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
                count++;
              }
            }
          });
          if (count === 0) locationList.style.display = "none";
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
      status: "pending"
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

  get(ref(database, `users/${user.uid}`)).then((snapshot) => {
    if (snapshot.exists()) {
      const userInfo = snapshot.val();
      console.log("User info retrieved:", userInfo); 

      if (userInfo.role === 'secretar') {
        eventData.status = 'acceptat'; 
        console.log("Booking automatically approved for secretary.");
      } else {
        eventData.status = 'pending'; 
        console.log("Booking set to pending for non-secretary user.");
      }

    const bookingsRef = ref(database, "rezervari");
    const newBookingRef = push(bookingsRef);
    set(newBookingRef, eventData)
      .then(() => {
        console.log("Booking added successfully with pending status!");
        if (eventData.status === 'acceptat') {
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
  }).catch((error) => {
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
