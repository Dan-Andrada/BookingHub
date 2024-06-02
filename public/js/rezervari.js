import {
  auth,
  database,
  ref,
  get,
  query,
  orderByChild,
  equalTo,
  update,
  remove,
  startAt
} from "./firebaseConfig.js";

document.addEventListener("DOMContentLoaded", function () {
  const bookingsList = document.getElementById("myBookings");
  const pendingList = document.getElementById("pendingRequests");
  const upcomingEventsList = document.getElementById("upcomingEvents");  
  const secretarySection = document.getElementById("secretarySection");
  const declineModal = document.getElementById("declineModal");
  const closeBtn = document.querySelector(".close");
  const submitDecline = document.getElementById("submitDecline");
  const deleteButtons = document.querySelectorAll(".delete-button");

  function formatDate(isoString) {
    const date = new Date(isoString.replace("Z", ""));
    return date.toLocaleDateString("ro-RO");
  }

  function formatTime(isoString) {
    const time = new Date(isoString.replace("Z", ""));
    return time.toLocaleTimeString("ro-RO", { timeStyle: "short" });
  }

  auth.onAuthStateChanged((user) => {
    if (user) {
      console.log("User authenticated", user.uid);
      get(ref(database, `users/${user.uid}`)).then((snapshot) => {
        const userInfo = snapshot.val();
        console.log("User info retrieved", userInfo);
        if (userInfo && userInfo.role === "secretar") {
          secretarySection.style.display = "block";
          loadPendingBookings();
        }
        loadBookings(user.uid);
        loadUpcomingEvents();
      });
    } else {
      console.log("No user is authenticated");
    }
  });

  function loadBookings(userId) {

    const bookingsRef = query(
      ref(database, "rezervari"),
      orderByChild("userId"),
      equalTo(userId)
    );
    get(bookingsRef)
      .then((snapshot) => {
        bookingsList.innerHTML = "";
        upcomingEventsList.innerHTML = "";
        if (snapshot.exists()) {
          snapshot.forEach((childSnapshot) => {
            const booking = childSnapshot.val();
            const bookingId = childSnapshot.key;

            const formattedDate = formatDate(booking.start);
            const startTime = formatTime(booking.start);
            const endTime = formatTime(booking.end);

            const bookingElement = document.createElement("div");
            bookingElement.className = "booking-item";
            bookingElement.innerHTML = `
          <div class="booking-info">
            Rezervare la: ${
              booking.location
            } (${formattedDate}, ${startTime} - ${endTime}) pentru ${
              booking.title
            } - Status: ${booking.status || "N/A"}
          </div>
          <button class="delete-button" data-booking-id="${bookingId}">Ștergere</button>
        `;

            bookingsList.appendChild(bookingElement);

            bookingElement
              .querySelector(".delete-button")
              .addEventListener("click", function () {
                deleteBooking(this.getAttribute("data-booking-id"));
              });
          });
        } else {
          bookingsList.innerHTML = "<li>No bookings found.</li>";
        }
      })
      .catch((error) => {
        console.error("Failed to retrieve bookings:", error);
      });
  }

  function loadUpcomingEvents() {
    const now = new Date().toISOString();
    const upcomingRef = query(ref(database, "rezervari"), orderByChild("start"), startAt(now));

    get(upcomingRef).then((snapshot) => {
        if (snapshot.exists()) {
            const upcomingEventsList = document.getElementById('upcomingEvents');
            upcomingEventsList.innerHTML = ''; // Clear existing entries
            snapshot.forEach((childSnapshot) => {
                const booking = childSnapshot.val();
                if (booking.status === "acceptat") {
                    const startTime = formatTime(booking.start);
                    const endTime = formatTime(booking.end);
                    const date = formatDate(booking.start);
                    const bookingElement = document.createElement('li');
                    bookingElement.textContent = `${booking.title} la ${booking.location} pe ${date}, de la ${startTime} până la ${endTime}`;
                    upcomingEventsList.appendChild(bookingElement);
                }
            });
        } else {
            document.getElementById('upcomingEvents').innerHTML = '<li>No upcoming events found.</li>';
        }
    }).catch(error => {
        console.error('Failed to retrieve upcoming events:', error);
    });
}

  closeBtn.onclick = function () {
    declineModal.style.display = "none";
  };

  window.onclick = function (event) {
    if (event.target == declineModal) {
      declineModal.style.display = "none";
    }
  };

  function loadPendingBookings() {
    const pendingRef = query(
      ref(database, "rezervari"),
      orderByChild("status"),
      equalTo("pending")
    );
    get(pendingRef)
      .then((snapshot) => {
        if (snapshot.exists()) {
          pendingList.innerHTML = "";
          snapshot.forEach((childSnapshot) => {
            const booking = childSnapshot.val();
            const bookingId = childSnapshot.key;

            const formattedDate = formatDate(booking.start);
            const startTime = formatTime(booking.start);
            const endTime = formatTime(booking.end);

            get(ref(database, `users/${booking.userId}`))
              .then((userSnapshot) => {
                const user = userSnapshot.val();
                const userName = user
                  ? `${user.firstName} ${user.lastName}`
                  : "Necunoscut";

                const bookingElement = document.createElement("li");
                bookingElement.className = "request-item";
                const requestInfo = document.createElement("div");
                requestInfo.className = "request-info";
                bookingElement.textContent = `Cerere de la: ${userName} pentru ${booking.location}`;
                bookingElement.appendChild(requestInfo);

                bookingElement.innerHTML = `
                        <div class="request-info">
                            Cerere de la: ${userName} pentru ${booking.location}
                            în data de ${formattedDate}, de la ${startTime} până la ${endTime}.
                            <br>Titlu: ${booking.title}
                            <br>Tip: ${booking.eventType}, destinat ${
                  booking.filterType
                }
                            <br>Descriere: ${booking.description || "N/A"}
                        </div>
                    `;

                const acceptButton = document.createElement("button");
                acceptButton.className = "action-button accept-button";
                acceptButton.textContent = "Acceptă";
                acceptButton.onclick = function () {
                  updateBookingStatus(bookingId, "acceptat");
                };

                const declineButton = document.createElement("button");
                declineButton.className = "action-button decline-button";
                declineButton.textContent = "Refuză";
                declineButton.onclick = function () {
                  requestDeclineReason(bookingId);
                };

                bookingElement.appendChild(acceptButton);
                bookingElement.appendChild(declineButton);

                pendingList.appendChild(bookingElement);
              })
              .catch((error) => {
                console.error("Failed to retrieve user details:", error);
              });
          });
        } else {
          pendingList.innerHTML = "<li>Nu există cereri în așteptare.</li>";
          console.log("No pending bookings found");
        }
      })
      .catch((error) => {
        console.error("Failed to retrieve pending bookings:", error);
      });
  }

  function requestDeclineReason(bookingId) {
    declineModal.style.display = "block";
    submitDecline.onclick = function () {
      const reason = document.getElementById("declineReason").value;
      if (reason) {
        updateBookingStatus(bookingId, "declined", reason);
        declineModal.style.display = "none";
        document.getElementById("declineReason").value = "";
      } else {
        toastr.error("Există un conflict cu o altă rezervare acceptată. Nu se poate accepta această rezervare.", {
          timeOut: 5000,
        });
      }
    };
  }

  function updateBookingStatus(bookingId, status, reason = null) {

    const bookingRef = ref(database, `rezervari/${bookingId}`);
    get(bookingRef).then((snapshot) => {
      if (snapshot.exists()) {
        const bookingData = snapshot.val();
        if (status === "acceptat") {
          const conflictingBookingsRef = query(
            ref(database, "rezervari"),
            orderByChild('location'),
            equalTo(bookingData.location)
          );
  
          get(conflictingBookingsRef).then((conflictsSnapshot) => {
            let conflictExists = false;
            conflictsSnapshot.forEach((conflictSnapshot) => {
              const conflictBooking = conflictSnapshot.val();
              if (conflictBooking.bookingId !== bookingId && conflictBooking.status === 'acceptat' &&
                  !(new Date(bookingData.end) <= new Date(conflictBooking.start) ||
                    new Date(bookingData.start) >= new Date(conflictBooking.end))) {
                conflictExists = true;
              }
            });
  
            if (conflictExists) {
              toastr.error("Există un conflict cu o altă rezervare acceptată. Nu se poate accepta această rezervare.", {
                timeOut: 5000,
              });
              return; 
            } else {
              proceedWithStatusUpdate(bookingRef, status, reason);
            }
          });
        } else {
          proceedWithStatusUpdate(bookingRef, status, reason);
        }
      } else {
        console.error("Rezervarea nu a fost găsită.");
      }
    });
  }
  
  function proceedWithStatusUpdate(bookingRef, status, reason) {
    const updateData = { status: status };
    if (reason && status === "declined") {
      updateData.declineReason = reason;
    }
  
    update(bookingRef, updateData)
      .then(() => {
        console.log("Status updated successfully:", status);
        window.location.reload(); 
      })
      .catch((error) => {
        console.error("Error updating booking status:", error);
      });
  }
  

  function deleteBooking(bookingId) {
    Swal.fire({
      title: 'Ești sigur?',
      text: "Nu vei putea reveni asupra acestei acțiuni!",
      icon: 'warning',
      showCancelButton: true,
      confirmButtonColor: "#007BFF",
      cancelButtonColor: "#6c757d",
      confirmButtonText: "Da, șterge!",
      cancelButtonText: "Anulează!"
    }).then((result) => {
      if (result.isConfirmed) {
        const bookingRef = ref(database, `rezervari/${bookingId}`);
        remove(bookingRef)
          .then(() => {
            Swal.fire(
              'Șters!',
              'Rezervarea a fost ștearsă.',
              'success'
            );
            window.location.reload(); 
          })
          .catch((error) => {
            Swal.fire(
              'Eroare!',
              'Rezervarea nu a putut fi ștearsă: ' + error.message,
              'error'
            );
          });
      }
    })
  }
  
  deleteButtons.forEach((button) => {
    button.addEventListener("click", function () {
      const bookingId = this.getAttribute("data-booking-id");
      deleteBooking(bookingId);
    });
  });
});