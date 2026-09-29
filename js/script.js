// ================================
// Greeting Based on Time
// ================================

function updateGreeting() {
  const hour = new Date().getHours();
  const greeting = document.getElementById("greeting");

  let message = "";

  if (hour < 12) {
    message = "🌅 Good Morning, Jainam Shah!";
  } else if (hour < 17) {
    message = "☀️ Good Afternoon, Jainam Shah!";
  } else if (hour < 21) {
    message = "🌇 Good Evening, Jainam Shah!";
  } else {
    message = "🌙 Good Night, Jainam Shah!";
  }

  greeting.textContent = message;
}

updateGreeting();

// ================================
// Live Date & Time
// ================================

function updateDateTime() {
  const now = new Date();

  const dateOptions = {
    weekday: "long",
    year: "numeric",
    month: "long",
    day: "numeric",
  };

  document.getElementById("date").textContent = now.toLocaleDateString(
    "en-IN",
    dateOptions,
  );

  const timeEl = document.getElementById("time");
  if (timeEl) {
    timeEl.textContent = now.toLocaleTimeString("en-IN");
  }
}

updateDateTime();

setInterval(updateDateTime, 1000);

// ================================
// Search Quick Services
// ================================

const searchBox = document.getElementById("search");

searchBox.addEventListener("keyup", function () {
  const value = this.value.toLowerCase();

  const services = document.querySelectorAll(".service");

  services.forEach(function (service) {
    const text = service.textContent.toLowerCase();

    if (text.includes(value)) {
      service.style.display = "block";
    } else {
      service.style.display = "none";
    }
  });
});

// ================================
// Card Click Effect
// ================================

const cards = document.querySelectorAll(".card");

cards.forEach((card) => {
  card.addEventListener("click", () => {
    card.style.transform = "scale(0.96)";

    setTimeout(() => {
      card.style.transform = "";
    }, 150);
  });
});

// ================================
// Service Click Message
// ================================

const serviceCards = document.querySelectorAll(".service");

serviceCards.forEach((service) => {
  service.addEventListener("click", () => {
    alert(
      service.textContent +
        " service will be connected to Web Services in the future.",
    );
  });
});

// ================================
// Announcement Hover Effect
// (re-attached after API data renders, see attachAnnouncementHoverEffect)
// ================================

function attachAnnouncementHoverEffect() {
  const announcements = document.querySelectorAll(".announcement");

  announcements.forEach((item) => {
    item.addEventListener("mouseenter", () => {
      item.style.borderLeftWidth = "8px";
    });

    item.addEventListener("mouseleave", () => {
      item.style.borderLeftWidth = "5px";
    });
  });
}

// ================================
// LAB 2: REST API Integration
// JSONPlaceholder -> fetch() -> response.json() -> render into existing UI
// ================================

const API_BASE = "https://jsonplaceholder.typicode.com";

// ---- 1. Student Profile: GET /users/1 ----

async function loadProfile() {
  try {
    const response = await fetch(`${API_BASE}/users/1`);

    if (!response.ok) {
      throw new Error("API request failed with status " + response.status);
    }

    const user = await response.json();

    document.getElementById("profile-name").textContent = user.name;
    document.getElementById("profile-username").textContent = user.username;
    document.getElementById("profile-email").textContent = user.email;
    document.getElementById("profile-phone").textContent = user.phone;
  } catch (error) {
    console.error("Error loading profile:", error);

    const card = document.getElementById("profileCard");
    card.innerHTML =
      '<p class="error-msg">Unable to load data. Please try again.</p>';
  }
}

// ---- 2. Announcements: GET /posts?_limit=5 ----

let allAnnouncements = [];

async function loadAnnouncements() {
  const container = document.getElementById("announcementsContainer");

  try {
    const response = await fetch(`${API_BASE}/posts?_limit=5`);

    if (!response.ok) {
      throw new Error("API request failed with status " + response.status);
    }

    const posts = await response.json();
    allAnnouncements = posts;

    displayAnnouncements(allAnnouncements);
  } catch (error) {
    console.error("Error loading announcements:", error);

    container.innerHTML =
      '<p class="error-msg">Unable to load data. Please try again.</p>';
  }
}

function displayAnnouncements(posts) {
  const container = document.getElementById("announcementsContainer");

  if (posts.length === 0) {
    container.innerHTML = '<p class="loading-msg">No announcements found.</p>';
    return;
  }

  container.innerHTML = posts
    .map(
      (post) => `
        <div class="announcement">
          <h4>${post.title}</h4>
          <p>${post.body}</p>
        </div>
      `,
    )
    .join("");

  attachAnnouncementHoverEffect();
}

// ---- 3. Assignments: GET /todos?userId=1&_limit=5 ----

let allAssignments = [];
let currentFilter = "all";

async function loadAssignments() {
  const list = document.getElementById("assignmentsList");

  try {
    const response = await fetch(`${API_BASE}/todos?userId=1&_limit=5`);

    if (!response.ok) {
      throw new Error("API request failed with status " + response.status);
    }

    const todos = await response.json();
    allAssignments = todos;

    renderAssignments();
  } catch (error) {
    console.error("Error loading assignments:", error);

    list.innerHTML =
      '<li class="error-msg">Unable to load data. Please try again.</li>';
  }
}

function renderAssignments() {
  const list = document.getElementById("assignmentsList");

  let filtered = allAssignments;

  if (currentFilter === "completed") {
    filtered = allAssignments.filter((todo) => todo.completed);
  } else if (currentFilter === "pending") {
    filtered = allAssignments.filter((todo) => !todo.completed);
  }

  if (filtered.length === 0) {
    list.innerHTML = '<li class="loading-msg">No assignments in this view.</li>';
    return;
  }

  list.innerHTML = filtered
    .map((todo) => {
      const statusClass = todo.completed ? "completed" : "pending";
      const icon = todo.completed
        ? '<i class="fa-solid fa-circle-check status-icon"></i>'
        : '<i class="fa-regular fa-circle status-icon"></i>';

      return `<li class="${statusClass}">${icon}<span>${todo.title}</span></li>`;
    })
    .join("");
}

// Filter interaction: All / Pending / Completed

const filterButtons = document.querySelectorAll(".filter-btn");

filterButtons.forEach((btn) => {
  btn.addEventListener("click", () => {
    filterButtons.forEach((b) => b.classList.remove("active"));
    btn.classList.add("active");

    currentFilter = btn.dataset.filter;
    renderAssignments();
  });
});

// ---- Kick off all three API calls ----

loadProfile();
loadAnnouncements();
loadAssignments();
