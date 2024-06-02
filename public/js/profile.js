import { update, updateProfile, auth, database, ref, get, signOut, storage, storageRef, uploadBytes, getDownloadURL } from './firebaseConfig.js';

document.addEventListener('DOMContentLoaded', function() {
  const userNameDisplay = document.getElementById("user-name");
  const userImage = document.getElementById("userImage");
  const imageUpload = document.getElementById("imageUpload");
  const logoutLink = document.getElementById("logout");
  const dropdownArrow = document.querySelector('.dropdown-arrow');
  const userMenu = document.querySelector('.user-menu');

  auth.onAuthStateChanged(user => {
    if (user) {
      get(ref(database, `users/${user.uid}`)).then(snapshot => {
        if (snapshot.exists()) {
          const userData = snapshot.val();
          userNameDisplay.textContent = userData.firstName || "Nume";
          userImage.src = userData.profilePicture || 'path/to/default/image';
        }
      });
    }
  });

  userImage.addEventListener("click", () => {
    imageUpload.click();
  });

  imageUpload.addEventListener("change", function (event) {
    const file = event.target.files[0];
    if (file) {
      const filePath = `profileImages/${auth.currentUser.uid}/${file.name}`;
      const fileRef = storageRef(storage, filePath);
  
      uploadBytes(fileRef, file).then((snapshot) => {
        getDownloadURL(snapshot.ref).then((downloadURL) => {
          userImage.src = downloadURL;
          updateProfile(auth.currentUser, { photoURL: downloadURL });
        });
      });
    }
  });

  logoutLink.addEventListener("click", function(event) {
    event.preventDefault();
    signOut(auth).then(() => {
      window.location.replace("/index.html");
    }).catch(error => {
      console.error("Failed to sign out:", error);
    });
  });

  dropdownArrow.addEventListener('click', () => {
    userMenu.style.display = userMenu.style.display === 'block' ? 'none' : 'block';
  });

  window.addEventListener('click', function(event) {
    if (!event.target.matches('.dropdown-arrow') && !event.target.closest('.user-menu')) {
      userMenu.style.display = 'none';
    }
  });
});
