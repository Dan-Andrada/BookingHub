import { update, updateProfile, auth, database, signOut, set, ref, get, onAuthStateChanged, storage, storageRef, uploadBytes, getDownloadURL } from './firebaseConfig.js';

const userImage = document.getElementById('userImage');
const imageUpload = document.getElementById('imageUpload');

document.addEventListener('DOMContentLoaded', () => {

  const logoutLink = document.getElementById('logout-link'); 

  auth.onAuthStateChanged((user) => {

    if (!user) {
      window.location.replace('/index.html');
    } else {
      const uid = user.uid;
      const userRef = ref(database, 'users/' + uid);
  
      get(userRef).then((snapshot) => {
        if (snapshot.exists()) {
          const userData = snapshot.val();
          const userNameDisplay = document.getElementById('user-name');
          
          userNameDisplay.textContent = userData.firstName || 'Nume'; 
  
          if (userData.profilePicture) {
            userImage.src = userData.profilePicture;
          }
        } else {
          console.log("Nu s-au găsit date pentru utilizator.");
        }
      }).catch((error) => {
        console.error('Eroare la preluarea datelor utilizatorului:', error);
      });
    }
  });
  if (logoutLink) { 
    logoutLink.addEventListener('click', (event) => {
      event.preventDefault(); 
      signOut(auth).then(() => {
        console.log('User signed out.');
        window.location.replace('/index.html'); 
      }).catch((error) => {
        console.error('Sign out error', error);
      });
    });
  }

});

userImage.addEventListener('click', () => {
  imageUpload.click();
});

imageUpload.addEventListener('change', function(event) {
  const file = event.target.files[0];
  if (!file) {
    console.log("No file selected.");
    return;
  }
  
  const user = auth.currentUser;
  if (user) {
    const filePath = `profileImages/${user.uid}/${file.name}`;
    const fileRef = storageRef(storage, filePath);

    uploadBytes(fileRef, file).then((snapshot) => {
      console.log('Uploaded a file!');
      
      getDownloadURL(snapshot.ref).then((downloadURL) => {
        console.log('File available at', downloadURL);
        userImage.src = downloadURL;

        updateProfile(user, {
          photoURL: downloadURL
        }).then(() => {
          console.log("Profile updated successfully!");
          update(ref(database, 'users/' + user.uid), {
            profilePicture: downloadURL,
          });
        }).then(() => {
          console.log('User profile image updated in database');
        }).catch((error) => {
          console.error('Error updating user profile image in database', error);
        });
      
      }).catch((error) => {
        console.error("Error getting download URL", error);
      });
    }).catch((error) => {
      console.error("Error uploading file", error);
    });
  } else {
    console.log("No authenticated user.");
  }
});