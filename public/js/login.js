import { initializeApp } from "https://www.gstatic.com/firebasejs/9.6.0/firebase-app.js";

import { getDatabase, get, set, ref } from "https://www.gstatic.com/firebasejs/9.6.0/firebase-database.js";

import { getAuth, createUserWithEmailAndPassword, signInWithEmailAndPassword } from "https://www.gstatic.com/firebasejs/9.6.0/firebase-auth.js";

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

$(document).ready(function() {   //same as: $(function() { 
  var email = getCookieValue("email");
  var password = getCookieValue("password");
  signInWithEmailAndPassword(auth, email, password)
    .then(userCredential => {
      if (typeof (Storage) !== "undefined") {
        localStorage.setItem("email", email);
        localStorage.setItem("password", password);
        localStorage.setItem("returnUrl", "null");
        localStorage.setItem("user", userCredential.user.uid);
        localStorage.setItem("username")
      }
    })
    .catch(ignored => {
      alert("asdf");
      localStorage.setItem("email", "null");
      localStorage.setItem("password", "null");
      localStorage.setItem("returnUrl", "null");
      localStorage.setItem("user", "null");
    });
});