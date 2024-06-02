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
        get(ref(database, '/users/' + uid)).then((userSnapshot) => {
          if (userSnapshot.exists()) {
            const userData = userSnapshot.val();
            if (userData.role === 'profesor') {
              get(ref(database, '/teachers/' + uid)).then((secSnapshot) => {
                if (secSnapshot.exists()) {
                  const teachersData = secSnapshot.val();
                  const departmentId = teachersData.profDepartament;
                  get(ref(database, '/departaments/' + departmentId)).then((depSnapshot) => {
                    if (depSnapshot.exists()) {
                      const departmentName = depSnapshot.val();
                      resolve({ ...userData, departament: departmentName });
                    } else {
                      resolve({ ...userData, departament: 'N/A' });
                    }
                  }).catch(reject);
                } else {
                  resolve({ ...userData, departament: 'N/A' }); 
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
    ${userData.role === 'profesor' ? `<p> ${userData.departament || 'N/A'}</p>` : ''}
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