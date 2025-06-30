   // Sidebar toggle functions
    function toggleSidebar() {
      const sidebar = document.getElementById("sidebar");
      const backdrop = document.getElementById("backdrop");
      const mainContent = document.getElementById("main-content");

      sidebar.classList.toggle("-translate-x-full");
      backdrop.classList.toggle("hidden");
      mainContent.classList.toggle("translate-x-4");
    }

    function closeSidebar() {
      document.getElementById("sidebar").classList.add("-translate-x-full");
      document.getElementById("backdrop").classList.add("hidden");
      document.getElementById("main-content").classList.remove("translate-x-4");
    }