import { update, updateProfile, auth, database, ref, get, signOut, storage, storageRef, uploadBytes, getDownloadURL } from './firebaseConfig.js';

export function initializeUserProfile() {
  const userNameDisplay = document.getElementById("user-name");
  auth.onAuthStateChanged(user => {
    if (user) {
      get(ref(database, `users/${user.uid}`)).then(snapshot => {
        if (snapshot.exists()) {
          const userData = snapshot.val();
          userNameDisplay.textContent = userData.firstName || "Nume";
          if (userData.profilePicture) {
            document.getElementById("userImage").src = userData.profilePicture;
          }
        }
      });
    }
  });
}

export function uploadProfileImage() {
  const userImage = document.getElementById("userImage");
  const imageUpload = document.getElementById("imageUpload");

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
}

export function signOutUser(selector) {
  const logoutElement = document.querySelector(selector);
  if (logoutElement) {
    logoutElement.addEventListener("click", event => {
      event.preventDefault();
      signOut(auth).then(() => {
        window.location.replace("/index.html");
      }).catch(error => {
        console.error("Failed to sign out:", error);
        alert("Logout failed. Please try again.");
      });
    });
  } else {
    console.error("Logout element not found for selector:", selector);
  }
}

export function setupDropdown() {
  const dropdownArrow = document.querySelector('.dropdown-arrow');
  const userMenu = document.querySelector('.user-menu');

  if (dropdownArrow) {
    dropdownArrow.addEventListener('click', () => {
      userMenu.style.display = userMenu.style.display === 'block' ? 'none' : 'block';
    });

    window.addEventListener('click', function(event) {
      if (!event.target.matches('.dropdown-arrow') && !event.target.matches('.user-name') && !event.target.closest('.user-menu')) {
        userMenu.style.display = 'none';
      }
    });
  }
}

