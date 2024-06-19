import { auth, database, ref, get, storage, storageRef, uploadBytes, getDownloadURL, updateProfile, update } from './firebaseConfig.js';

document.addEventListener('DOMContentLoaded', function() {
  const userCardContainer = document.getElementById("userCardContainer");

  // Preia userId din URL
  function getUserIdFromURL() {
    const urlParams = new URLSearchParams(window.location.search);
    return urlParams.get('userId');
  }

  const userIdFromURL = getUserIdFromURL();

  async function getUserAdditionalData(userId, role) {
    let additionalData = {};

    switch (role) {
      case 'student':
        additionalData = await get(ref(database, `students/${userId}`)).then(snapshot => snapshot.exists() ? snapshot.val() : {});
        break;
      case 'profesor':
        additionalData = await get(ref(database, `teachers/${userId}`)).then(snapshot => snapshot.exists() ? snapshot.val() : {});
        break;
      case 'secretar':
        additionalData = await get(ref(database, `secretaries/${userId}`)).then(snapshot => snapshot.exists() ? snapshot.val() : {});
        break;
      case 'administrator':
        additionalData = await get(ref(database, `admins/${userId}`)).then(snapshot => snapshot.exists() ? snapshot.val() : {});
        break;
    }

    return additionalData;
  }

  async function getDepartmentName(departmentId) {
    console.log(`Fetching department name for ID: ${departmentId}`);
    const departmentSnapshot = await get(ref(database, `departaments/${departmentId}`));
    if (departmentSnapshot.exists()) {
      return departmentSnapshot.val();
    } else {
      console.error(`Department with ID ${departmentId} not found.`);
      return 'N/A';
    }
  }

  async function createAndAppendUserCard(userData, isCurrentUser) {
    const additionalData = await getUserAdditionalData(userData.uid, userData.role);
    console.log(`Additional data for user ${userData.uid}:`, additionalData);

    if (userData.role === 'profesor' || userData.role === 'secretar') {
      additionalData.departmentName = await getDepartmentName(additionalData.profDepartament || additionalData.secretarDepartament);
      console.log(`Department name: ${additionalData.departmentName}`);
    }

    const card = document.createElement("div");
    card.className = "user-card";

    card.innerHTML = `
      <img src="${userData.profilePicture || 'public/images/default-avatar.png'}" alt="User Image" id="profileImage">
      ${isCurrentUser ? '<input type="file" id="imageUpload" style="display: none;">' : ''}
      <h3>${userData.firstName} ${userData.lastName || ""}</h3>
      <p><strong>Email:</strong> ${userData.email}</p>
      <p><strong>Rol:</strong> ${userData.role}</p>
      ${userData.role === 'student' ? `
      <p><strong>Număr Matricol:</strong> ${additionalData.studentNumber || 'N/A'}</p>
      <p><strong>Anul de Studiu:</strong> ${additionalData.studyYear || 'N/A'}</p>
      ` : ''}
      ${userData.role === 'profesor' ? `
      <p><strong>Departament:</strong> ${additionalData.departmentName || 'N/A'}</p>
      ` : ''}
      ${userData.role === 'secretar' ? `
      <p><strong>Departament:</strong> ${additionalData.departmentName || 'N/A'}</p>
      ` : ''}
      ${userData.role === 'administrator' ? `
      <p><strong>Număr de telefon:</strong> ${additionalData.adminPhone || 'N/A'}</p>
      ` : ''}
    `;

    userCardContainer.appendChild(card);

    if (isCurrentUser) {
      const profileImage = card.querySelector("#profileImage");
      const imageUpload = card.querySelector("#imageUpload");

      profileImage.addEventListener("click", () => {
        imageUpload.click();
      });

      imageUpload.addEventListener("change", function (event) {
        const file = event.target.files[0];
        if (file) {
          const filePath = `profileImages/${auth.currentUser.uid}/${file.name}`;
          const fileRef = storageRef(storage, filePath);
      
          uploadBytes(fileRef, file).then((snapshot) => {
            getDownloadURL(snapshot.ref).then((downloadURL) => {
              profileImage.src = downloadURL;
              updateProfile(auth.currentUser, { photoURL: downloadURL });
              update(ref(database, `users/${auth.currentUser.uid}`), { profilePicture: downloadURL });
            });
          });
        }
      });
    }
  }

  function loadUserProfile(userId) {
    get(ref(database, `users/${userId}`)).then(snapshot => {
      if (snapshot.exists()) {
        const userData = snapshot.val();
        userData.uid = userId; 
        createAndAppendUserCard(userData, auth.currentUser && auth.currentUser.uid === userId);
      }
    }).catch(error => {
      console.error("Failed to load user profile:", error);
    });
  }

  if (userIdFromURL) {
    loadUserProfile(userIdFromURL);
  } else {
    console.log("No userId found in URL, loading profile for authenticated user.");
    auth.onAuthStateChanged(user => {
      if (user) {
        loadUserProfile(user.uid);
      }
    });
  }
});
