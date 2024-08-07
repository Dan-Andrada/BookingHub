import {
  auth,
  database,
  analytics,
  sendPasswordResetEmail,
  signInWithEmailAndPassword,
  ref,
  set,
  get,
} from "./firebaseConfig.js";

const loginForm = document.getElementById("login-form");
const loginButton = document.querySelector(".login-button");
const modal = document.getElementById("password-reset-modal");
const forgotPasswordBtn = document.querySelector(".forgot-password");
const passwordResetEmail = document.getElementById("password-reset-email");
const passwordResetButton = document.getElementById("password-reset-button");
const veziCaUtilizatorButton = document.getElementById("vezi-ca-utilizator");

veziCaUtilizatorButton.addEventListener("click", function () {
  window.location.href = "../public/calendar.html";
});

const rolePages = {
  student: "public/student-dashboard.html",
  profesor: "public/profesor-dashboard.html",
  secretar: "public/secretar-dashboard.html",
  administrator: "public/admin-dashboard.html",
};

let attemptsInfo = {
  email: "",
  attempts: 0,
  lockoutTime: 0,
};

const emailInput = document.getElementById("email");
const passwordInput = document.getElementById("password");

function toggleLoginButton() {
  if (emailInput.value && passwordInput.value) {
    loginButton.classList.add("active");
  } else {
    loginButton.classList.remove("active");
  }
}

emailInput.addEventListener("input", toggleLoginButton);
passwordInput.addEventListener("input", toggleLoginButton);

loginButton.addEventListener("click", function () {
  const email = emailInput.value;
  const password = passwordInput.value;
  const currentTime = new Date().getTime();

  const emailPattern = /.+upt\.ro$/; // rgex pentru a verifica dacă emailul se termină cu @upt.ro

  if (email !== attemptsInfo.email) {
  
    attemptsInfo.email = email;
    attemptsInfo.attempts = 0;
    attemptsInfo.lockoutTime = 0;
  }

  if (attemptsInfo.attempts >= 3 && currentTime < attemptsInfo.lockoutTime) {
    const waitTime = (attemptsInfo.lockoutTime - currentTime) / 1000 / 60;
    toastr.error(
      `Prea multe încercări eșuate. Vă rugăm să așteptați ${waitTime.toFixed(
        1
      )} minute.`,
      {
        timeOut: 3000,
      }
    );
    return;
  }

  if (!emailPattern.test(email)) {
    toastr.info("Vă rugăm să introduceți o adresă de email validă de la UPT.", {
      timeOut: 3000,
    });
    return;
  }

  signInWithEmailAndPassword(auth, email, password)
    .then((userCredential) => {
      attemptsInfo.attempts = 0;
      const uid = userCredential.user.uid;

      return get(ref(database, `users/${uid}`));
    })
    .then((snapshot) => {
      if (snapshot.exists()) {
        const userData = snapshot.val();
        const userRole = userData.role;
        const redirectTo = rolePages[userRole];

        if (redirectTo) {
          window.location.href = redirectTo;
        } else {
          console.log(
            "Rolul utilizatorului nu are o pagină de redirecționare definită"
          );
          passwordInput.value = "";
        }
      } else {
        console.log("Nu s-au putut obține informațiile utilizatorului.");
        passwordInput.value = "";
      }
    })
    .catch((error) => {
      const errorCode = error.code;
      const errorMessage = error.message;
      console.error(`Eroare la autentificare: ${errorCode}`, errorMessage);
      toastr.error(`Eroare la autentificare: ${errorMessage}`, {
        timeOut: 3000,
      });
      passwordInput.value = "";

      attemptsInfo.attempts++;
      if (attemptsInfo.attempts >= 3) {
        attemptsInfo.lockoutTime = new Date().getTime() + 15 * 60 * 1000;
      }
      toastr.info(`Mai aveți ${3 - attemptsInfo.attempts} încercări.`, {
        timeOut: 3000,
      });
      passwordInput.value = "";
    });
});

forgotPasswordBtn.onclick = function () {
  modal.style.display = "block";
};

document.querySelector(".close").onclick = function () {
  modal.style.display = "none";
};

window.onclick = function (event) {
  if (event.target == modal) {
    modal.style.display = "none";
  }
};

passwordResetButton.addEventListener("click", () => {
  const email = passwordResetEmail.value;
  sendPasswordResetEmail(auth, email)
    .then(() => {
      toastr.info(
        "Instrucțiunile de resetare a parolei au fost trimise prin e-mail.",
        {
          timeOut: 3000,
        }
      );
      modal.style.display = "none";
      passwordResetEmail.value = "";
    })
    .catch((error) => {
      toastr.error("A apărut o eroare: " + error.message, {
        timeOut: 3000,
      });
    });
});
