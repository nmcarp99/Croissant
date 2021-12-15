// Import the functions you need from the SDKs you need
import { initializeApp } from "https://www.gstatic.com/firebasejs/9.6.0/firebase-app.js";

import {
  getDatabase,
  onValue,
  get,
  set,
  ref
} from "https://www.gstatic.com/firebasejs/9.6.0/firebase-database.js";

import {
  getAuth,
  createUserWithEmailAndPassword,
  signInWithEmailAndPassword,
  signOut
} from "https://www.gstatic.com/firebasejs/9.6.0/firebase-auth.js";
// TODO: Add SDKs for Firebase products that you want to use
// https://firebase.google.com/docs/web/setup#available-libraries

// Your web app's Firebase configuration
// For Firebase JS SDK v7.20.0 and later, measurementId is optional
const firebaseConfig = {
  apiKey: "AIzaSyC4RqcDxT7VxBCYHaYG6R-YfZBxKXofskI",
  authDomain: "croissant-ca00a.firebaseapp.com",
  projectId: "croissant-ca00a",
  storageBucket: "croissant-ca00a.appspot.com",
  messagingSenderId: "395794205573",
  appId: "1:395794205573:web:44d99c00230309d75f12ec",
  measurementId: "G-REXDFL4V2H"
};

// Initialize Firebase
const app = initializeApp(firebaseConfig);
const database = getDatabase(app);
const auth = getAuth();

window.signUp = () => {
  let email = $("#email").val();
  let password = $("#password").val();
  let username = $("#username").val();

  createUserWithEmailAndPassword(auth, email, password)
    .then(userCredential => {
      const user = userCredential.user;

      set(ref(database, "users/" + user.uid), {
        username: username,
        email: email
      });

      location.href = "/login";
    })
    .catch(error => {
      alert(error.code + ": " + error.message);
    });

  return false; // do not reload the page
};

window.logIn = () => {
  let email = $("#email").val();
  let password = $("#password").val();

  signInWithEmailAndPassword(auth, email, password)
    .then(userCredential => {
      const user = userCredential.user;
      const usernameRef = ref(database, "/users/" + user.uid + "/username");

      get(usernameRef).then(snap => {
        localStorage.setItem("username", snap.val());
      });

      localStorage.setItem("user", userCredential.user.uid);
      localStorage.setItem("email", email);

      location.href = "/";
    })
    .catch(error => {
      alert(error.code + ": " + error.message);
    });

  return false; // do not reload the page;
};

window.signOut = () => {
  signOut(auth).then(() => {
    location.reload();
  });
};

window.auth = auth;

window.onStateChange;

auth.onAuthStateChanged(window.onStateChange);