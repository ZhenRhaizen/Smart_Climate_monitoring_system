import { initializeApp } from "https://www.gstatic.com/firebasejs/10.12.0/firebase-app.js";
    import { getAuth, createUserWithEmailAndPassword, updateProfile } from "https://www.gstatic.com/firebasejs/10.12.0/firebase-auth.js";

    // Your Firebase config
    const firebaseConfig = {
      apiKey: "AIzaSyDL4nR_DCsGmQZgB8OIH6EQUO4XcXPdcn8",
      authDomain: "smartclimatemonitorsystem.firebaseapp.com",
      projectId: "smartclimatemonitorsystem",
      storageBucket: "smartclimatemonitorsystem.appspot.com",
      messagingSenderId: "865844912759",
      appId: "1:865844912759:web:31a7e8f24f8379215adc72"
    };

    const app = initializeApp(firebaseConfig);
    const auth = getAuth(app);

    const signupForm = document.getElementById("signup-form");
    signupForm.addEventListener("submit", async (e) => {
      e.preventDefault();

      const username = signupForm.username.value.trim();
      const email = signupForm.email.value.trim();
      const password = signupForm.password.value;

      try {
        const userCredential = await createUserWithEmailAndPassword(auth, email, password);
        await updateProfile(userCredential.user, { displayName: username });

        alert(`Welcome, ${username}! Your account has been created.`);
        signupForm.reset();
        window.location.href = "index.html";
      } catch (error) {
        alert(`Error: ${error.message}`);
      }
    });

    // Show/hide password toggle
    const togglePassword = document.getElementById("togglePassword");
    const passwordInput = document.getElementById("password");
    togglePassword.addEventListener("change", () => {
      passwordInput.type = togglePassword.checked ? "text" : "password";
    });