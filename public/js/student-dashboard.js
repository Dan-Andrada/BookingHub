import {
  update,
  updateProfile,
  auth,
  database,
  signOut,
  set,
  ref,
  get,
  onAuthStateChanged,
  storage,
  storageRef,
  uploadBytes,
  getDownloadURL,
} from "./firebaseConfig.js";
import {
  initializeUserProfile,
  uploadProfileImage,
  signOutUser,
} from "./userDetails.js";


document.addEventListener("DOMContentLoaded", () => {
  initializeUserProfile();
  uploadProfileImage();
  signOutUser();

  function getUserDetails() {
    return new Promise((resolve, reject) => {
      const user = auth.currentUser;
      if (user) {
        const uid = user.uid;
        get(ref(database, '/users/' + uid)).then((userSnapshot) => {
          if (userSnapshot.exists()) {
            const userData = userSnapshot.val();
            if (userData.role === 'student') {
              get(ref(database, '/students/' + uid)).then((studentSnapshot) => {
                if (studentSnapshot.exists()) {
                  const studentData = studentSnapshot.val();
                  resolve({ ...userData, studentNumber: studentData.studentNumber, studyYear: studentData.studyYear });
                } else {
                  resolve(userData);
                }
              }).catch(reject);
            } else {
              resolve(userData);
            }
          } else {
            reject('Detalii utilizator indisponibile.');
          }
        }).catch(reject);
      } else {
        reject('Utilizatorul nu este autentificat');
      }
    });
  }

  function createAndAppendUserCard(userData) {
    const container = document.getElementById("userCardContainer");
    const card = document.createElement("div");
    card.className = "user-card";

    card.innerHTML = `
    <h3>${userData.firstName} ${userData.lastName || ""}</h3>
    <p>${userData.role}</p>
    <p>Număr matricol ${userData.studentNumber || 'N/A'}</p>
    <p>An de studiu ${userData.studyYear || 'N/A'}</p>
    `;

    container.appendChild(card);
  }

  auth.onAuthStateChanged(user => {
    if (user) {
      getUserDetails(user).then(userData => {
        createAndAppendUserCard(userData);
      }).catch(console.error);
    } else {
      console.error("Utilizatorul nu este autentificat");
      window.location.replace("/login.html");
    }
  });

});