import { initializeApp } from "https://www.gstatic.com/firebasejs/11.4.0/firebase-app.js";
import { getFirestore, collection, addDoc, getDocs, query, where } from "https://www.gstatic.com/firebasejs/11.4.0/firebase-firestore.js";

const firebaseConfig = {
  apiKey: "AIzaSyDje1w1JVPgCjyg49JYog-qlCrDLXiyYEo",
  authDomain: "poa-ej-db.firebaseapp.com",
  projectId: "poa-ej-db",
  storageBucket: "poa-ej-db.firebasestorage.app",
  messagingSenderId: "161916162237",
  appId: "1:161916162237:web:9f17c7a467d79a5945e7d4",
  measurementId: "G-SRVSEK2F55"
};

const app = initializeApp(firebaseConfig);
const db = getFirestore(app);

const users = {
    user1: 'pass1',
    user2: 'pass2',
    user3: 'pass3',
    admin: 'adminpass'
};

let currentUser = null;

async function login() {
    const username = document.getElementById('username').value;
    const password = document.getElementById('password').value;
    const error = document.getElementById('login-error');

    if (users[username] && users[username] === password) {
        currentUser = username;
        error.textContent = '';
        document.getElementById('login-container').style.display = 'none';
        if (username === 'admin') {
            document.getElementById('admin-container').style.display = 'block';
            await loadAdminSubmissions();
        } else {
          document.getElementById('form-container').style.display = 'block';
          await loadUserSubmissions();
        }
    } else {
        error.textContent = 'Usuario o contraseña incorrectos';
    }
}

async function submitForm() {
    const name = document.getElementById('name').value;
    const email = document.getElementById('email').value;
    try {
        await addDoc(collection(db, "submissions"), {
            user: currentUser,
            name: name,
            email: email
        });
        document.getElementById('myForm').reset();
        await loadUserSubmissions();
        if(currentUser === 'admin'){
          await loadAdminSubmissions();
        }
    } catch (e) {
        console.error("Error adding document: ", e);
    }
}

async function loadAdminSubmissions() {
    const table = document.getElementById('admin-table').getElementsByTagName('tbody')[0];
    table.innerHTML = '';
    try {
        const querySnapshot = await getDocs(collection(db, "submissions"));
        querySnapshot.forEach((doc) => {
            let sub = doc.data();
            let row = table.insertRow();
            let user = row.insertCell(0);
            let name = row.insertCell(1);
            let email = row.insertCell(2);
            user.textContent = sub.user;
            name.textContent = sub.name;
            email.textContent = sub.email;
        });
    } catch (e) {
        console.error("Error getting documents: ", e);
    }
}

async function loadUserSubmissions() {
  const table = document.getElementById('submissions-table').getElementsByTagName('tbody')[0];
  table.innerHTML = '';
  try {
    const q = query(collection(db, "submissions"), where("user", "==", currentUser));
    const querySnapshot = await getDocs(q);
    querySnapshot.forEach((doc) => {
      let sub = doc.data();
      let row = table.insertRow();
      let name = row.insertCell(0);
      let email = row.insertCell(1);
      name.textContent = sub.name;
      email.textContent = sub.email;
    });
  } catch (e) {
    console.error("Error getting documents: ", e);
  }
}


function exportToExcel() {
    // ... (Mantén la lógica de exportación a Excel)
}

function logout() {
    currentUser = null;
    document.getElementById('admin-container').style.display = 'none';
    document.getElementById('form-container').style.display = 'none';
    document.getElementById('login-container').style.display = 'block';
}

document.addEventListener('DOMContentLoaded', function() {
    const loginButton = document.getElementById('loginButton');
    loginButton.addEventListener('click', login);

    const submitButton = document.getElementById('submitButton');
    submitButton.addEventListener('click', submitForm);

    const logoutButton = document.getElementById('logoutButton');
    logoutButton.addEventListener('click', logout);

    const exportButton = document.getElementById('exportButton');
    exportButton.addEventListener('click', exportToExcel);
});