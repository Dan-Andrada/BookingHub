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
  setupDropdown
} from "./userDetails.js";

document.addEventListener("DOMContentLoaded", () => {
  initializeUserProfile();
  uploadProfileImage();
  setupDropdown();
  signOutUser("#logout");
  signOutUser("#logout-link");

  function getUserDetails() {
    return new Promise((resolve, reject) => {
      const user = auth.currentUser;
      if (user) {
        const uid = user.uid;
        get(ref(database, "/users/" + uid))
          .then((snapshot) => {
            if (snapshot.exists()) {
              const userData = snapshot.val();
              resolve(userData); 
            } else {
              reject("Detalii utilizator indisponibile.");
            }
          })
          .catch(reject);
      } else {
        reject("Utilizatorul nu este autentificat");
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