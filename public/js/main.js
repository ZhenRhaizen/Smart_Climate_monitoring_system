// js/account.js

function toggleSidebar() {
  document.getElementById("sidebar").classList.toggle("-translate-x-full");
  document.getElementById("backdrop").classList.toggle("hidden");
  document.getElementById("main-content").classList.toggle("translate-x-4");
}

function closeSidebar() {
  document.getElementById("sidebar").classList.add("-translate-x-full");
  document.getElementById("backdrop").classList.add("hidden");
  document.getElementById("main-content").classList.remove("translate-x-4");
}

function toggleAllPasswords(checkbox) {
  const fields = ['oldPassword', 'newPassword'];
  fields.forEach(id => {
    const input = document.getElementById(id);
    if (input) input.type = checkbox.checked ? 'text' : 'password';
  });
}