import { auth, database, ref, get, query, orderByChild, equalTo, update } from './firebaseConfig.js';

document.addEventListener('DOMContentLoaded', function() {
    const bookingsList = document.getElementById('myBookings');
    const pendingList = document.getElementById('pendingRequests');
    const secretarySection = document.getElementById('secretarySection');

    auth.onAuthStateChanged(user => {
        if (user) {
            console.log('User authenticated', user.uid);
            get(ref(database, `users/${user.uid}`)).then((snapshot) => {
                const userInfo = snapshot.val();
                console.log('User info retrieved', userInfo);
                if (userInfo && userInfo.role === 'secretar') {
                    secretarySection.style.display = 'block';
                    loadPendingBookings(); 
                }
                loadBookings(user.uid);
            });
        } else {
            console.log('No user is authenticated');
        }
    });

    function loadBookings(userId) {
        const bookingsRef = query(ref(database, 'rezervari'), orderByChild('userId'), equalTo(userId));
        get(bookingsRef).then((snapshot) => {
            if (snapshot.exists()) {
                bookingsList.innerHTML = '';
                snapshot.forEach(childSnapshot => {
                    const booking = childSnapshot.val();
                    const bookingElement = document.createElement('li');
                    bookingElement.textContent = `Rezervare la: ${booking.location} - Status: ${booking.status || 'N/A'}`;
                    bookingsList.appendChild(bookingElement);
                });
            } else {
                bookingsList.innerHTML = '<li>No bookings found.</li>';
                console.log('No bookings found for the user:', userId);
            }
        }).catch(error => {
            console.error('Failed to retrieve bookings:', error);
        });
    }

    function loadPendingBookings() {
      const pendingRef = query(ref(database, 'rezervari'), orderByChild('status'), equalTo('pending'));
      get(pendingRef).then((snapshot) => {
          if (snapshot.exists()) {
              pendingList.innerHTML = '';
              snapshot.forEach(childSnapshot => {
                  const booking = childSnapshot.val();
                  const bookingId = childSnapshot.key;
                  const bookingElement = document.createElement('li');
                  bookingElement.textContent = `Cerere de la: ${booking.userId} pentru ${booking.location}`;

                  const acceptButton = document.createElement('button');
                  acceptButton.textContent = 'Acceptă';
                  acceptButton.onclick = function() {
                      updateBookingStatus(bookingId, 'acceptat');
                  };
  
                  const declineButton = document.createElement('button');
                  declineButton.textContent = 'Refuză';
                  declineButton.onclick = function() {
                      updateBookingStatus(bookingId, 'declined');
                  };

                  bookingElement.appendChild(acceptButton);
                  bookingElement.appendChild(declineButton);
  
                  pendingList.appendChild(bookingElement);
              });
          } else {
              pendingList.innerHTML = '<li>Nu există cereri în așteptare.</li>';
              console.log('No pending bookings found');
          }
      }).catch(error => {
          console.error('Failed to retrieve pending bookings:', error);
      });
  }
  
  function updateBookingStatus(bookingId, status) {
      update(ref(database, `rezervari/${bookingId}`), { status: status })
          .then(() => {
              console.log('Status updated successfully:', status);
              window.location.reload(); 
          })
          .catch(error => {
              console.error('Error updating booking status:', error);
          });
  }
});  