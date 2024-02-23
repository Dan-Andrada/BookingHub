import { auth, signOut } from './firebaseConfig.js';

document.addEventListener('DOMContentLoaded', function() {

    const logoutLink = document.getElementById('logout-link');

    if (logoutLink) {
        logoutLink.addEventListener('click', (e) => {
            e.preventDefault();
            signOut(auth).then(() => {
                console.log('User signed out.');
                window.location.href = '/index.html';
            }).catch((error) => {
                console.error('Sign out error', error);
            });
        });
    } else {
        console.log('Elementul de logout nu a fost găsit.');
    }
});
