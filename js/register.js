// js/register.js
import { auth, database, analytics, createUserWithEmailAndPassword, ref, set, get } from './firebaseConfig.js';

const registerForm = document.getElementById('register-form');
const registerButton = document.getElementById('register-button');
const roleSelect = document.getElementById('role');
const additionalFieldsStudent = document.getElementById('additional-fields-student');
const additionalFieldsAdmin = document.getElementById('additional-fields-admin');
const additionalFieldsProfesor = document.getElementById('additional-fields-profesor');
const additionalFieldsSecretar = document.getElementById('additional-fields-secretar');

function populateDepartmentSelects() {
    const departmentsRef = ref(database, 'departaments');
    const profSelect = document.getElementById('prof-departament');
    const secretarSelect = document.getElementById('secretar-departament');

    get(departmentsRef).then((snapshot) => {
        if (snapshot.exists()) {
            const departments = snapshot.val();
            Object.keys(departments).forEach((key) => {
                const profOption = document.createElement('option');
                profOption.value = key;
                profOption.textContent = departments[key];
                profSelect.appendChild(profOption);

                const secretarOption = document.createElement('option');
                secretarOption.value = key;
                secretarOption.textContent = departments[key];
                secretarSelect.appendChild(secretarOption);
            });
        } else {
            console.log("Nu s-au găsit departamente.");
        }
    }).catch((error) => {
        console.error("Eroare la încărcarea departamentelor: ", error);
    });
}

document.addEventListener('DOMContentLoaded', populateDepartmentSelects);

document.getElementById('admin-phone').addEventListener('keydown', function(e) {

    if (!e.key.match(/[0-9]/) && e.key !== 'Backspace' && e.key !== 'Tab' && e.key !== 'Delete' && e.key !== 'ArrowLeft' && e.key !== 'ArrowRight') {
        e.preventDefault();
    }
});

roleSelect.addEventListener('change', function() {

    additionalFieldsStudent.style.display = (this.value === 'student') ? 'block' : 'none';
    additionalFieldsAdmin.style.display = (this.value === 'administrator') ? 'block' : 'none';
    additionalFieldsProfesor.style.display = (this.value === 'profesor') ? 'block' : 'none';
    additionalFieldsSecretar.style.display = (this.value === 'secretar') ? 'block' : 'none';
});

function hideAdditionalFields() {

    additionalFieldsStudent.style.display = 'none';
    additionalFieldsAdmin.style.display = 'none';
    additionalFieldsProfesor.style.display = 'none';
    additionalFieldsSecretar.style.display = 'none';
}

registerForm.addEventListener('reset', hideAdditionalFields);  

registerButton.addEventListener('click', function(event) {
    event.preventDefault();

    const email = document.getElementById('register-email').value;
    const password = document.getElementById('register-password').value;
    const firstName = document.getElementById('first-name').value;
    const lastName = document.getElementById('last-name').value;
    const role = roleSelect.value;

    let roleSpecificInfo = {};

    switch (role) {
        case 'student':
            handleStudentRole(email, password, firstName, lastName);
            break;
        case 'administrator':
            handleAdministratorRole(email, password, firstName, lastName);
            break;
        case 'profesor':
            handleProfesorRole(email, password, firstName, lastName);
            break;
        case 'secretar':
            handleSecretarRole(email, password, firstName, lastName);
            break;
        default:
            alert("Te rog să selectezi un rol.");
            return;
    }

function handleStudentRole() {
    const studentNumber = document.getElementById('student-number').value;
    const studyYear = document.getElementById('study-year').value;
    if (!studentNumber || !studyYear || studyYear < 1 || studyYear > 4) {
        alert('Te rog să completezi numărul matricol și anul de studiu mai mic decât 4');
        return;
    }
    verifyMatriculationNumberAndProceed(studentNumber, studyYear);
}

function verifyMatriculationNumberAndProceed(studentNumber, studyYear) {
    const matriculationNumbersRef = ref(database, 'matriculationNumbers/' + studentNumber);
    get(matriculationNumbersRef).then((snapshot) => {
        if (snapshot.exists()) {
            alert('Numărul matricol este deja înregistrat.');
        } else {
            createUserAndSaveData(email, password, firstName, lastName, 'student', { studentNumber, studyYear });
        }
    });
}

function handleAdministratorRole() {
    const adminPhone = document.getElementById('admin-phone').value;
    if (!adminPhone) {
        alert('Te rog să completezi numărul de telefon pentru administrator.');
        return;
    }
    createUserAndSaveData(email, password, firstName, lastName, 'administrator', { adminPhone });
}

function handleProfesorRole() {
    const profDepartament = document.getElementById('prof-departament').value;
    if (!profDepartament) {
        alert('Te rog să completezi departamentul.');
        return;
    }
    createUserAndSaveData(email, password, firstName, lastName, 'profesor', { profDepartament });
}

function handleSecretarRole() {
    const secretarDepartament = document.getElementById('secretar-departament').value;
    if (!secretarDepartament) {
        alert('Te rog să completezi departamentul.');
        return;
    }
    createUserAndSaveData(email, password, firstName, lastName, 'secretar', { secretarDepartament });
}

function createUserAndSaveData(email, password, firstName, lastName, role, roleSpecificInfo) {
    createUserWithEmailAndPassword(auth, email, password)
        .then((userCredential) => {
            const user = userCredential.user;
    
            set(ref(database, 'users/' + user.uid), {
                firstName: firstName,
                lastName: lastName,
                email: email,
                role: role
            }).then(() => {
                switch (role) {
                    case 'student':
                        set(ref(database, 'students/' + user.uid), {
                            studentNumber: roleSpecificInfo.studentNumber,
                            studyYear: roleSpecificInfo.studyYear
                        });
                        set(ref(database, 'matriculationNumbers/' + roleSpecificInfo.studentNumber), true);
                        break;
                    case 'administrator':
                        set(ref(database, 'admins/' + user.uid), {
                            adminPhone: roleSpecificInfo.adminPhone
                        });
                        break;
                    case 'profesor':
                        set(ref(database, 'teachers/' + user.uid), {
                            profDepartament: roleSpecificInfo.profDepartament
                        });
                        break;
                    case 'secretar':
                        set(ref(database, 'secretaries/' + user.uid), {
                            secretarDepartament: roleSpecificInfo.secretarDepartament
                        });
                        break;
                }
                alert('Cont creat cu succes!');
                registerForm.reset();
            });
        })
        .catch((error) => {
            alert(`Eroare la înregistrare: ${error.message}`);
        });
    }
    });
    

