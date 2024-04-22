import { update, updateProfile, auth, database, signOut, set, ref, get, onAuthStateChanged, storage, storageRef, uploadBytes, getDownloadURL } from './firebaseConfig.js';

const userImage = document.getElementById("userImage");
const imageUpload = document.getElementById("imageUpload");

document.addEventListener("DOMContentLoaded", () => {
  const logoutLink = document.getElementById("logout-link");

  auth.onAuthStateChanged((user) => {
    if (!user) {
      window.location.replace("/index.html");
    } else {
      const uid = user.uid;
      const userRef = ref(database, "users/" + uid);

      get(userRef)
        .then((snapshot) => {
          if (snapshot.exists()) {
            const userData = snapshot.val();
            const userNameDisplay = document.getElementById("user-name");
            getUserDetails().then(createAndAppendUserCard).catch(console.error);

            userNameDisplay.textContent = userData.firstName || "Nume";

            if (userData.profilePicture) {
              userImage.src = userData.profilePicture;
            }
          } else {
            console.log("Nu s-au găsit date pentru utilizator.");
          }
        })
        .catch((error) => {
          console.error("Eroare la preluarea datelor utilizatorului:", error);
        });
    }
  });

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
  
  if (logoutLink) {
    logoutLink.addEventListener("click", (event) => {
      event.preventDefault();
      signOut(auth)
        .then(() => {
          console.log("User signed out.");
          window.location.replace("/index.html");
        })
        .catch((error) => {
          console.error("Sign out error", error);
        });
    });
  }
});

userImage.addEventListener("click", () => {
  imageUpload.click();
});

imageUpload.addEventListener("change", function (event) {
  const file = event.target.files[0];
  if (!file) {
    console.log("No file selected.");
    return;
  }

  const user = auth.currentUser;
  if (user) {
    const filePath = `profileImages/${user.uid}/${file.name}`;
    const fileRef = storageRef(storage, filePath);

    uploadBytes(fileRef, file)
      .then((snapshot) => {
        console.log("Uploaded a file!");

        getDownloadURL(snapshot.ref)
          .then((downloadURL) => {
            console.log("File available at", downloadURL);
            userImage.src = downloadURL;

            updateProfile(user, {
              photoURL: downloadURL,
            })
              .then(() => {
                console.log("Profile updated successfully!");
                update(ref(database, "users/" + user.uid), {
                  profilePicture: downloadURL,
                });
              })
              .then(() => {
                console.log("User profile image updated in database");
              })
              .catch((error) => {
                console.error(
                  "Error updating user profile image in database",
                  error
                );
              });
          })
          .catch((error) => {
            console.error("Error getting download URL", error);
          });
      })
      .catch((error) => {
        console.error("Error uploading file", error);
      });
  } else {
    console.log("No authenticated user.");
  }
});




