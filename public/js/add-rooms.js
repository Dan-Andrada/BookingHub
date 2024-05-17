import {
  auth,
  database,
  query,
  child,
  orderByChild,
  equalTo,
  analytics,
  ref,
  set,
  get,
} from "./firebaseConfig.js";

document.addEventListener("DOMContentLoaded", () => {
  auth.onAuthStateChanged((user) => {
    if (!user) {
      window.location.replace("/index.html");
    } else {
      const form = document.getElementById("addSalaForm");

      form.addEventListener("submit", (e) => {
        e.preventDefault();

        const numeSala = document.getElementById("nume_sala").value;
        const capacitate = document.getElementById("capacitate").value;
        const echipamente = document.getElementById("echipamente").value;
        const descriere = document.getElementById("descriere").value;

        const saliRef = ref(database, "sali");

        const salaId = Date.now().toString();

        get(ref(database, "/sali"))
          .then((snapshot) => {
            let existingRoom = false;

            const sali = snapshot.val();
            for (let id in sali) {
              if (sali[id].nume_sala === numeSala) {
                existingRoom = true;
                break;
              }
            }

            if (existingRoom) {
              toastr.info("Numele sălii există deja!", {
                timeOut: 5000,
              });
            } else {
              const newSalaRef = ref(database, "sali/" + salaId);
              set(newSalaRef, {
                nume_sala: numeSala,
                capacitate: parseInt(capacitate, 10),
                echipamente: echipamente,
                descriere: descriere,
              })
                .then(() => {
                  toastr.success("Sala a fost adăugată cu succes!", {
                    timeOut: 5000,
                  });
                  form.reset();
                })
                .catch((error) => {
                  console.error("Eroare la adăugarea sălii: ", error);
                });
            }
          })
          .catch((error) => {
            console.error(
              "Eroare la verificarea existenței numelui sălii: ",
              error
            );
          });
      });
    }
  });
});
