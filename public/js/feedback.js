import { auth, database, ref, set, push } from './firebaseConfig.js';

document.addEventListener('DOMContentLoaded', function() {
  document.getElementById('feedback-form').addEventListener('submit', async (e) => {
    e.preventDefault();

    const user = auth.currentUser;
    if (!user) {
      alert("Trebuie să fii autentificat pentru a trimite feedback.");
      return;
    }

    const rating = document.getElementById('rating').value;
    const comments = document.getElementById('comments').value;

    const feedbackRef = push(ref(database, 'feedback'));

    set(feedbackRef, {
      userId: user.uid,
      rating,
      comments,
      timestamp: Date.now() 
    }).then(() => {
      toastr.success("Feedback trimis cu succes!", {
        timeOut: 3000,
      });
      document.getElementById('feedback-form').reset();
    }).catch((error) => {
      console.error('Eroare la trimiterea feedback-ului:', error);
    });
  });
});
