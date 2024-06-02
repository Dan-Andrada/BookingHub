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

      form.addEventListener("submit", async (e) => {
        e.preventDefault();

        const numeSala = document.getElementById("nume_sala").value.trim();
        const capacitate = document.getElementById("capacitate").value.trim();
        const echipamente = document.getElementById("echipamente").value.trim();
        const descriere = document.getElementById("descriere").value.trim();

        if (!numeSala || !capacitate || !echipamente || !descriere) {
          toastr.error("Toate câmpurile sunt obligatorii!", { timeOut: 3000 });
          return;
        }

        const capacitateNum = parseInt(capacitate, 10);
        if (isNaN(capacitateNum) || capacitateNum <= 0) {
          toastr.error("Capacitatea trebuie să fie un număr valid mai mare decât 0!", { timeOut: 3000 });
          return;
        }

        try {
          const saliSnapshot = await get(ref(database, "/sali"));
          const sali = saliSnapshot.val() || {};
          const salaExists = Object.values(sali).some(sala => sala.nume_sala === numeSala);

          if (salaExists) {
            toastr.info("Numele sălii există deja!", { timeOut: 5000 });
          } else {
            await set(ref(database, `sali/${Date.now()}`), {
              nume_sala: numeSala,
              capacitate: capacitateNum,
              echipamente: echipamente,
              descriere: descriere,
            });
            toastr.success("Sala a fost adăugată cu succes!", { timeOut: 5000 });
            form.reset();
          }
        } catch (error) {
          console.error("Eroare la adăugarea sau verificarea sălii: ", error);
          toastr.error("Eroare la procesarea cererii.", { timeOut: 3000 });
        }
      });
    }
  });
});
