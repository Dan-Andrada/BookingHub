import { database, ref, set, get, remove } from './firebaseConfig.js';

document.addEventListener('DOMContentLoaded', function() {
  const roomsList = document.getElementById('roomsList');

  loadRooms();

  document.getElementById('editSalaForm').addEventListener('submit', submitEditForm);
});

function loadRooms() {
  get(ref(database, 'sali')).then((snapshot) => {
    if (snapshot.exists()) {
      const roomsData = snapshot.val();
      roomsList.innerHTML = ''; 
      Object.entries(roomsData).forEach(([key, room]) => createRoomCard(key, room));
    } else {
      roomsList.innerHTML = '<p>Nu există săli adăugate.</p>';
    }
  }).catch((error) => {
    console.error('Error fetching rooms:', error);
    roomsList.innerHTML = '<p>Eroare la încărcarea sălilor.</p>';
  });
}

function createRoomCard(roomId, roomData) {
  const roomCard = document.createElement('div');
  roomCard.className = 'room-card';
  roomCard.setAttribute('data-id', roomId); 
  roomCard.innerHTML = `
    <h2>${roomData.nume_sala}</h2>
    <p>Capacitate: ${roomData.capacitate}</p>
    <p>Echipamente: ${roomData.echipamente}</p>
    <p>Descriere: ${roomData.descriere}</p>
    <button class="edit-btn">✎</button>
    <button class="delete-btn">✖</button>
  `;
  
  roomCard.querySelector('.edit-btn').addEventListener('click', () => editRoom(roomId));
  roomCard.querySelector('.delete-btn').addEventListener('click', () => deleteRoom(roomId));
  
  roomsList.appendChild(roomCard);
}

function deleteRoom(roomId) {
  
  Swal.fire({
    text: 'Ești sigur că vrei să ștergi sala?',
    showCancelButton: true,
    confirmButtonColor: '#007BFF',
    cancelButtonColor: '#6c757d',
    confirmButtonText: 'Da, șterge!',
    cancelButtonText: 'Anulează'
  }).then((result) => {
    if (result.isConfirmed) {
      const roomRef = ref(database, `sali/${roomId}`);
      remove(roomRef).then(() => {
        console.log('Sala a fost ștearsă cu succes.');
        const roomElement = document.querySelector(`.room-card[data-id="${roomId}"]`);
        if (roomElement) {
          roomElement.remove();
        }
        Swal.fire(
          'Șters!',
          'Sala a fost ștearsă.',
          'success'
        );
      }).catch((error) => {
        console.error('Eroare la ștergerea sălii:', error);
        Swal.fire(
          'Eroare!',
          'A apărut o eroare la ștergerea sălii.',
          'error',
        );
      });
    }
  });
}

function editRoom(roomId) {
  get(ref(database, 'sali/' + roomId)).then((snapshot) => {
    if (snapshot.exists()) {
      const roomData = snapshot.val();
      populateEditForm(roomId, roomData);
      showEditPopup();
    }
  });
}

function submitEditForm(e) {
  e.preventDefault();
  const roomId = document.getElementById('editSalaPopup').getAttribute('data-current-room');
  const updatedRoomData = {
    nume_sala: document.getElementById('edit_nume_sala').value,
    capacitate: document.getElementById('edit_capacitate').value,
    echipamente: document.getElementById('edit_echipamente').value,
    descriere: document.getElementById('edit_descriere').value,
  };

  set(ref(database, `sali/${roomId}`), updatedRoomData).then(() => {
    toastr.success("Informațiile sălii au fost actualizate cu succes.", {
      timeOut: 3000, 
    });
    closeEditPopup();
    loadRooms(); 
  }).catch((error) => console.error('Eroare la actualizarea sălii:', error));
}

function populateEditForm(roomId, roomData) {
  document.getElementById('edit_nume_sala').value = roomData.nume_sala;
  document.getElementById('edit_capacitate').value = roomData.capacitate;
  document.getElementById('edit_echipamente').value = roomData.echipamente;
  document.getElementById('edit_descriere').value = roomData.descriere;
  document.getElementById('editSalaPopup').setAttribute('data-current-room', roomId);
}

function showEditPopup() {
  const editPopup = document.getElementById('editSalaPopup');
  editPopup.style.display = 'block'; 
  document.getElementById('overlay').classList.add('active');
}

document.getElementById('closeEditPopupBtn').addEventListener('click', closeEditPopup);

function closeEditPopup() {
  document.getElementById('editSalaPopup').style.display = 'none';
  document.getElementById('overlay').classList.remove('active');
 
}

document.getElementById('overlay').addEventListener('click', function(event) {
  if (event.target === this) {
    closeEditPopup();
  }
});


