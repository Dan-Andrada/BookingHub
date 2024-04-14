import { auth, database, ref, set, get, remove } from "./firebaseConfig.js";

document.addEventListener("DOMContentLoaded", function () {
  const roomsList = document.getElementById("roomsList");
  const addRoomBtn = document.getElementById("addRoomBtn");

  auth.onAuthStateChanged((user) => {
    if (user) {
      getUserRole()
        .then((userRole) => {
          const addRoomBtn = document.getElementById("addRoomBtn");
          if (userRole === "administrator" || userRole === "secretar") {
            addRoomBtn.style.display = "block";
          }
        })
        .catch((error) => {
          console.error("Error getting user role:", error);
        });
    }
  });

  loadRooms();

  document
    .getElementById("editSalaForm")
    .addEventListener("submit", submitEditForm);
});

function loadRooms(searchQuery = "", capacityQuery = "") {
  const roomsList = document.getElementById("roomsList");
  const loadingSpinner = document.getElementById("loadingSpinner");
  loadingSpinner.style.display = "block";

  roomsList.innerHTML = ""; // Golim lista înainte de a încărca noi rezultate

  get(ref(database, "sali"))
    .then((snapshot) => {
      loadingSpinner.style.display = "none";
      if (snapshot.exists()) {
        const roomsData = snapshot.val();

        Object.entries(roomsData).forEach(([key, room]) => {
          if (matchesFilters(room, searchQuery, capacityQuery)) {
            createRoomCard(key, room);
          }
        });
      } else {
        roomsList.innerHTML = "<p>Nu există săli adăugate.</p>";
      }
    })
    .catch((error) => {
      console.error("Error fetching rooms:", error);
      loadingSpinner.style.display = "none";
      roomsList.innerHTML = "<p>Eroare la încărcarea sălilor.</p>";
    });
}

function matchesFilters(room, searchQuery, capacityQuery) {
  const matchesSearch =
    !searchQuery || room.nume_sala.toLowerCase().includes(searchQuery);
  let matchesCapacity = true;

  if (capacityQuery) {
    const roomCapacity = parseInt(room.capacitate, 10);
    switch (capacityQuery) {
      case "20":
        matchesCapacity = roomCapacity <= 20;
        break;
      case "20-50":
        matchesCapacity = roomCapacity > 20 && roomCapacity <= 50;
        break;
      case "50+":
        matchesCapacity = roomCapacity > 50;
        break;
    }
  }

  return matchesSearch && matchesCapacity;
}

function getUserRole() {
  return new Promise((resolve, reject) => {
    const user = auth.currentUser;
    if (user) {
      const uid = user.uid;
      get(ref(database, "/users/" + uid))
        .then((snapshot) => {
          const userData = snapshot.val();
          resolve(userData.role);
        })
        .catch(reject);
    } else {
      reject("No user logged in");
    }
  });
}

function createRoomCard(roomId, roomData) {
  const roomCard = document.createElement("div");
  roomCard.className = "room-card";
  roomCard.setAttribute("data-id", roomId);
  roomCard.innerHTML = `
    <h2>${roomData.nume_sala}</h2>
    <p>Capacitate: ${roomData.capacitate}</p>
    <p>Echipamente: ${roomData.echipamente}</p>
    <p>Descriere: ${roomData.descriere}</p>
  `;

  roomsList.appendChild(roomCard);

  getUserRole()
    .then((userRole) => {
      if (userRole === "administrator" || userRole === "secretar") {
        console.log(userRole);
        addEditButtons(roomCard, roomId);
      }
    })
    .catch((error) => {
      console.error("Error getting user role:", error);
    });
}

function addEditButtons(roomCard, roomId) {
  const editButton = document.createElement("button");
  editButton.className = "edit-btn";
  editButton.textContent = "✎";
  editButton.addEventListener("click", () => editRoom(roomId));

  const deleteButton = document.createElement("button");
  deleteButton.className = "delete-btn";
  deleteButton.textContent = "✖";
  deleteButton.addEventListener("click", () => deleteRoom(roomId));

  roomCard.appendChild(editButton);
  roomCard.appendChild(deleteButton);
}

function deleteRoom(roomId) {
  Swal.fire({
    text: "Ești sigur că vrei să ștergi sala?",
    showCancelButton: true,
    confirmButtonColor: "#007BFF",
    cancelButtonColor: "#6c757d",
    confirmButtonText: "Da, șterge!",
    cancelButtonText: "Anulează",
  }).then((result) => {
    if (result.isConfirmed) {
      const roomRef = ref(database, `sali/${roomId}`);
      remove(roomRef)
        .then(() => {
          console.log("Sala a fost ștearsă cu succes.");
          const roomElement = document.querySelector(
            `.room-card[data-id="${roomId}"]`
          );
          if (roomElement) {
            roomElement.remove();
          }
          Swal.fire("Șters!", "Sala a fost ștearsă.", "success");
        })
        .catch((error) => {
          console.error("Eroare la ștergerea sălii:", error);
          Swal.fire(
            "Eroare!",
            "A apărut o eroare la ștergerea sălii.",
            "error"
          );
        });
    }
  });
}

function editRoom(roomId) {
  get(ref(database, "sali/" + roomId)).then((snapshot) => {
    if (snapshot.exists()) {
      const roomData = snapshot.val();
      populateEditForm(roomId, roomData);
      showEditPopup();
    }
  });
}

function submitEditForm(e) {
  e.preventDefault();
  const roomId = document
    .getElementById("editSalaPopup")
    .getAttribute("data-current-room");
  const updatedRoomData = {
    nume_sala: document.getElementById("edit_nume_sala").value,
    capacitate: document.getElementById("edit_capacitate").value,
    echipamente: document.getElementById("edit_echipamente").value,
    descriere: document.getElementById("edit_descriere").value,
  };

  set(ref(database, `sali/${roomId}`), updatedRoomData)
    .then(() => {
      toastr.success("Informațiile sălii au fost actualizate cu succes.", {
        timeOut: 3000,
      });
      closeEditPopup();
      loadRooms();
    })
    .catch((error) => console.error("Eroare la actualizarea sălii:", error));
}

function populateEditForm(roomId, roomData) {
  document.getElementById("edit_nume_sala").value = roomData.nume_sala;
  document.getElementById("edit_capacitate").value = roomData.capacitate;
  document.getElementById("edit_echipamente").value = roomData.echipamente;
  document.getElementById("edit_descriere").value = roomData.descriere;
  document
    .getElementById("editSalaPopup")
    .setAttribute("data-current-room", roomId);
}

function showEditPopup() {
  const editPopup = document.getElementById("editSalaPopup");
  editPopup.style.display = "block";
  document.getElementById("overlay").classList.add("active");
}

document
  .getElementById("closeEditPopupBtn")
  .addEventListener("click", closeEditPopup);

function closeEditPopup() {
  document.getElementById("editSalaPopup").style.display = "none";
  document.getElementById("overlay").classList.remove("active");
}

document.getElementById("overlay").addEventListener("click", function (event) {
  if (event.target === this) {
    closeEditPopup();
  }
});

document.getElementById("searchBox").addEventListener("input", filterRooms);
document
  .getElementById("capacityFilter")
  .addEventListener("change", filterRooms);

function filterRooms() {
  const searchQuery = document.getElementById("searchBox").value.toLowerCase();
  const capacityQuery = document.getElementById("capacityFilter").value;

  loadRooms(searchQuery, capacityQuery);
}
