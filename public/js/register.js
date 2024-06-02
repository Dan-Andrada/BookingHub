// js/register.js
import { auth, database, analytics, ref, set, get } from './firebaseConfig.js';
import { getFunctions, httpsCallable } from "https://www.gstatic.com/firebasejs/9.6.10/firebase-functions.js";

const functions = getFunctions(auth.app);
const createUser = httpsCallable(functions, "createUser");

const registerForm = document.getElementById("register-form");
const registerButton = document.getElementById("register-button");
const roleSelect = document.getElementById("role");
const additionalFieldsStudent = document.getElementById(
  "additional-fields-student"
);
const additionalFieldsAdmin = document.getElementById(
  "additional-fields-admin"
);
const additionalFieldsProfesor = document.getElementById(
  "additional-fields-profesor"
);
const additionalFieldsSecretar = document.getElementById(
  "additional-fields-secretar"
);

function populateDepartmentSelects() {
  const departmentsRef = ref(database, "departaments");
  const profSelect = document.getElementById("prof-departament");
  const secretarSelect = document.getElementById("secretar-departament");

  get(departmentsRef)
    .then((snapshot) => {
      if (snapshot.exists()) {
        const departments = snapshot.val();
        Object.keys(departments).forEach((key) => {
          const profOption = document.createElement("option");
          profOption.value = key;
          profOption.textContent = departments[key];
          profSelect.appendChild(profOption);

          const secretarOption = document.createElement("option");
          secretarOption.value = key;
          secretarOption.textContent = departments[key];
          secretarSelect.appendChild(secretarOption);
        });
      } else {
        console.log("Nu s-au găsit departamente.");
      }
    })
    .catch((error) => {
      console.error("Eroare la încărcarea departamentelor: ", error);
    });
}

document.addEventListener("DOMContentLoaded", populateDepartmentSelects);

document
  .getElementById("admin-phone")
  .addEventListener("keydown", function (e) {
    if (
      !e.key.match(/[0-9]/) &&
      e.key !== "Backspace" &&
      e.key !== "Tab" &&
      e.key !== "Delete" &&
      e.key !== "ArrowLeft" &&
      e.key !== "ArrowRight"
    ) {
      e.preventDefault();
    }
  });

roleSelect.addEventListener("change", function () {
  additionalFieldsStudent.style.display =
    this.value === "student" ? "block" : "none";
  additionalFieldsAdmin.style.display =
    this.value === "administrator" ? "block" : "none";
  additionalFieldsProfesor.style.display =
    this.value === "profesor" ? "block" : "none";
  additionalFieldsSecretar.style.display =
    this.value === "secretar" ? "block" : "none";
});

function hideAdditionalFields() {
  additionalFieldsStudent.style.display = "none";
  additionalFieldsAdmin.style.display = "none";
  additionalFieldsProfesor.style.display = "none";
  additionalFieldsSecretar.style.display = "none";
}

registerForm.addEventListener("reset", hideAdditionalFields);

function handleStudentRole(email, password, firstName, lastName) {
  const studentNumber = document.getElementById("student-number").value;
  const studyYear = document.getElementById("study-year").value;

  if (!studentNumber || !studyYear || studyYear < 1 || studyYear > 4) {
    toastr.info("Introduceți un an de studiu și un număr matricol!", {
      timeOut: 3000,
    });
    return;
  }

  verifyMatriculationNumberAndProceed(
    studentNumber,
    () => {
      const roleSpecificInfo = {
        studentNumber: studentNumber,
        studyYear: studyYear,
      };
      createUserAndSaveData(
        email,
        password,
        firstName,
        lastName,
        "student",
        roleSpecificInfo
      );
    },
    (errorMessage) => {
      toastr.error(errorMessage, {
        timeOut: 3000,
      });
    }
  );
}

function verifyMatriculationNumberAndProceed(
  studentNumber,
  onSuccess,
  onFailure
) {
  const matriculationNumbersRef = ref(
    database,
    "matriculationNumbers/" + studentNumber
  );
  get(matriculationNumbersRef)
    .then((snapshot) => {
      if (snapshot.exists()) {
        onFailure("Numărul matricol este deja înregistrat.");
      } else {
        set(ref(database, "matriculationNumbers/" + studentNumber), true)
          .then(() => onSuccess())
          .catch((error) => {
            console.error("Eroare la numărul matricol:", error);
            onFailure("Eroare la înregistrarea numărului matricol.");
          });
      }
    })
    .catch((error) => {
      console.error("Eroare la verificarea numărului matricol:", error);
      onFailure("A intervenit o eroare la verificarea numărului matricol.");
    });
}

function handleAdministratorRole(email, password, firstName, lastName) {
  const adminPhone = document.getElementById("admin-phone").value;

  if (!adminPhone) {
    toastr.info("Introduceți un număr de telefon pentru administrator.", {
      timeOut: 3000,
    });
    return;
  }

  const roleSpecificInfo = {
    adminPhone: adminPhone,
  };

  createUserAndSaveData(
    email,
    password,
    firstName,
    lastName,
    "administrator",
    roleSpecificInfo
  );
}

function handleProfesorRole(email, password, firstName, lastName) {
  const profDepartament = document.getElementById("prof-departament").value;

  if (!profDepartament) {
    toastr.info("Alegeți un departament.", {
      timeOut: 3000,
    });
    return;
  }

  const roleSpecificInfo = {
    profDepartament: profDepartament,
  };

  createUserAndSaveData(
    email,
    password,
    firstName,
    lastName,
    "profesor",
    roleSpecificInfo
  );
}

function handleSecretarRole(email, password, firstName, lastName) {
  const secretarDepartament = document.getElementById(
    "secretar-departament"
  ).value;

  if (!secretarDepartament) {
    toastr.info("Alegeți un departament.", {
      timeOut: 3000,
    });
    return;
  }

  const roleSpecificInfo = {
    secretarDepartament: secretarDepartament,
  };

  createUserAndSaveData(
    email,
    password,
    firstName,
    lastName,
    "secretar",
    roleSpecificInfo
  );
}

function createUserAndSaveData(
  email,
  password,
  firstName,
  lastName,
  role,
  roleSpecificInfo
) {
  createUser({ email, password, firstName, lastName, role })
    .then((result) => {
      if (!result.data.uid) {
        throw new Error("UID nu este definit după crearea userului.");
      }
      const uid = result.data.uid;

      set(ref(database, "users/" + uid), {
        firstName: firstName,
        lastName: lastName,
        email: email,
        role: role,
      })
        .then(() => {
          let path;
          switch (role) {
            case "student":
              path = `students/${uid}`;
              break;
            case "administrator":
              path = `admins/${uid}`;
              break;
            case "profesor":
              path = "teachers/" + uid;
              break;
            case "secretar":
              path = `secretaries/${uid}`;
              break;
            default:
              throw new Error("Invalid role");
          }
          if (path) {
            return set(ref(database, path), roleSpecificInfo);
          }
        })
        .then(() => {
          toastr.success("Utilizatorul a fost creat cu succes!", {
            timeOut: 3000,
          });
          registerForm.reset();
        })
        .catch((error) => {
          console.error("Eroare la salvarea datelor:", error);
          toastr.error("Eroare la crearea contului. " + error.message, {
            timeOut: 3000,
          });
        });
    })
    .catch((error) => {
      console.error("Eroare la crearea utilizatorului:", error);
      toastr.error("Eroare la crearea contului. " + error.message, {
        timeOut: 3000,
      });
    });
}

registerButton.addEventListener("click", function (event) {
  event.preventDefault();

  const email = document.getElementById("register-email").value;
  const password = document.getElementById("register-password").value;
  const firstName = document.getElementById("first-name").value;
  const lastName = document.getElementById("last-name").value;
  const role = roleSelect.value;

  if (password.length < 6) {  
    toastr.error("Parola trebuie să aibă cel puțin 6 caractere.", {
      timeOut: 3000,
    });
    return;
  }

  if (lastName === "" || firstName === "") {
    toastr.info("Numele și prenumele sunt obligatorii!", {
      timeOut: 3000,
    });
    return false;
  }

  if (!validateEmail(email)) {
    toastr.info("Introduceți o adresă de email validă pentru UPT.", {
      timeOut: 3000,
    });
    return;
  }

  switch (role) {
    case "student":
      handleStudentRole(email, password, firstName, lastName);
      break;
    case "administrator":
      handleAdministratorRole(email, password, firstName, lastName);
      break;
    case "profesor":
      handleProfesorRole(email, password, firstName, lastName);
      break;
    case "secretar":
      handleSecretarRole(email, password, firstName, lastName);
      break;
    default:
      toastr.info("Selectează un rol.", {
        timeOut: 3000,
      });
  }
});

function validateEmail(email) {
  const emailPattern = /.+upt\.ro$/;
  return emailPattern.test(email);
}
