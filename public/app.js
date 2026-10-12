const API = "/api";
const state = { token: localStorage.getItem("learnspace_token"), user: JSON.parse(localStorage.getItem("learnspace_user") || "null"), courses: [], authMode: "register" };
const $ = (id) => document.getElementById(id);

function escapeHtml(value = "") {
  return String(value).replace(/[&<>"']/g, char => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" }[char]));
}
function authHeaders() {
  return state.token ? { Authorization: `Bearer ${state.token}` } : {};
}
async function api(path, options = {}) {
  const response = await fetch(`${API}${path}`, {
    ...options,
    headers: { "Content-Type": "application/json", ...authHeaders(), ...(options.headers || {}) }
  });
  const data = await response.json().catch(() => ({}));
  if (!response.ok) throw new Error(data.message || "Something went wrong.");
  return data;
}
function showToast(message) {
  const toast = $("toast");
  toast.textContent = message;
  toast.classList.add("show");
  clearTimeout(showToast.timer);
  showToast.timer = setTimeout(() => toast.classList.remove("show"), 2800);
}
function openModal(mode = "register") {
  setAuthMode(mode);
  $("auth-modal").classList.remove("hidden");
  document.body.style.overflow = "hidden";
}
function closeModal() {
  $("auth-modal").classList.add("hidden");
  document.body.style.overflow = "";
  $("auth-message").textContent = "";
  $("auth-form").reset();
}
function setAuthMode(mode) {
  state.authMode = mode;
  const isRegister = mode === "register";
  $("modal-title").textContent = isRegister ? "Create your account" : "Welcome back";
  $("modal-description").textContent = isRegister ? "Start learning with your community." : "Log in to continue learning.";
  $("name-field").classList.toggle("hidden", !isRegister);
  $("role-field").classList.toggle("hidden", !isRegister);
  $("auth-name").required = isRegister;
  $("auth-password").autocomplete = isRegister ? "new-password" : "current-password";
  $("auth-submit").textContent = isRegister ? "Create account" : "Log in";
  $("tab-register").classList.toggle("active", isRegister);
  $("tab-login").classList.toggle("active", !isRegister);
  $("auth-message").textContent = "";
  $("auth-message").className = "form-message";
}
function updateNavigation() {
  const loggedIn = Boolean(state.token && state.user);
  $("open-login").classList.toggle("hidden", loggedIn);
  $("open-register").classList.toggle("hidden", loggedIn);
  $("logout-btn").classList.toggle("hidden", !loggedIn);
  if (loggedIn) {
    $("dashboard-title").textContent = `Welcome, ${state.user.name.split(" ")[0]}!`;
    $("dashboard-subtitle").textContent = state.user.role === "teacher"
      ? "Manage your courses, classes, and learning resources."
      : "Your courses, upcoming classes, and learning resources in one place.";
  } else {
    $("dashboard-title").textContent = "Your dashboard";
    $("dashboard-subtitle").textContent = "Log in to see your courses, classes, and study resources.";
  }
}
function courseIcon(category = "") {
  const c = category.toLowerCase();
  if (c.includes("web") || c.includes("program")) return "💻";
  if (c.includes("data") || c.includes("ai")) return "📊";
  if (c.includes("design")) return "🎨";
  if (c.includes("math")) return "📐";
  if (c.includes("business")) return "📈";
  return "📘";
}
async function loadCourses() {
  try {
    state.courses = await api("/courses");
    renderCourses();
  } catch (error) {
    $("course-list").innerHTML = `<div class="empty-state">Unable to load courses. Please refresh the page.</div>`;
    $("course-count").textContent = "Not available";
  }
}
function renderCourses() {
  $("course-count").textContent = `${state.courses.length} course${state.courses.length === 1 ? "" : "s"} available`;
  if (!state.courses.length) {
    $("course-list").innerHTML = `<div class="empty-state">No courses yet. ${state.user?.role === "teacher" ? "Use your dashboard to create the first course." : "A teacher can add courses after logging in."}</div>`;
    return;
  }
  $("course-list").innerHTML = state.courses.map(course => {
    const enrolled = Array.isArray(course.students) && state.user && course.students.includes(state.user.id);
    let button = "";
    if (!state.user) button = `<button class="small-btn" data-action="login">Log in to join →</button>`;
    else if (state.user.role === "student") button = `<button class="small-btn" data-action="enroll" data-id="${course._id}" ${enrolled ? "disabled" : ""}>${enrolled ? "Enrolled ✓" : "Enroll now →"}</button>`;
    else button = `<span class="teacher-name">Teacher account</span>`;
    return `<article class="course-card"><div class="course-icon">${courseIcon(course.category)}</div>
      <div class="course-meta"><span class="pill">${escapeHtml(course.level || "Beginner")}</span><span>${escapeHtml(course.category || "General")}</span></div>
      <h3>${escapeHtml(course.title)}</h3><p>${escapeHtml(course.description)}</p>
      <div class="course-footer"><span class="teacher-name">👩‍🏫 ${escapeHtml(course.teacher?.name || "LearnSpace tutor")}</span>${button}</div></article>`;
  }).join("");
}
function card(title, icon, content, extraClass = "") {
  return `<section class="dashboard-card ${extraClass}"><div class="dash-icon">${icon}</div><h3>${title}</h3>${content}</section>`;
}
function formatDate(value) {
  const date = new Date(value);
  return Number.isNaN(date.getTime()) ? "Date not set" : date.toLocaleString([], { dateStyle: "medium", timeStyle: "short" });
}
async function loadDashboard() {
  updateNavigation();
  if (!state.token || !state.user) {
    $("dashboard-content").innerHTML = [
      card("My courses", "📚", "<p>Your enrolled or teaching courses will appear here after you log in.</p>"),
      card("Upcoming classes", "🗓️", "<p>Keep track of your scheduled learning sessions.</p>"),
      card("Study materials", "📝", "<p>Find notes and learning resources in one place.</p>")
    ].join("");
    renderCourses();
    return;
  }
  try {
    const [courses, sessions, materials] = await Promise.all([
      api(state.user.role === "teacher" ? "/courses/mine/teaching" : "/courses/mine/enrolled"),
      api("/classes"),
      api("/materials")
    ]);
    const courseContent = courses.length
      ? (state.user.role === "teacher"
          ? `<ul class="teacher-course-list">${courses.map(c => `<li><span>${escapeHtml(c.title)}</span><button type="button" class="small-btn danger-btn" data-action="delete-course" data-id="${c._id}">Delete</button></li>`).join("")}</ul>`
          : `<ul>${courses.map(c => `<li>${escapeHtml(c.title)}</li>`).join("")}</ul>`)
      : `<p>${state.user.role === "teacher" ? "You have not created any courses yet." : "You have not enrolled in a course yet."}</p>`;
    const classContent = sessions.length ? sessions.map(s => `<div class="item-row"><strong>${escapeHtml(s.title)}</strong><small>${escapeHtml(s.course?.title || "Course")}<br>${formatDate(s.startTime)}${s.teacher?.name ? `<br>Teacher: ${escapeHtml(s.teacher.name)}` : ""}${s.meetingUrl ? `<br><a class="item-link" href="${escapeHtml(s.meetingUrl)}" target="_blank" rel="noopener noreferrer">Join online class ↗</a>` : ""}</small></div>`).join("") : "<p>No classes scheduled yet.</p>";
    const materialContent = materials.length ? materials.map(m => `<div class="item-row"><strong>${escapeHtml(m.title)}</strong><small>${escapeHtml(m.course?.title || "Course")}<br><a class="item-link" href="${escapeHtml(m.resourceUrl)}" target="_blank" rel="noopener noreferrer">Open resource ↗</a>${m.description ? `<br>${escapeHtml(m.description)}` : ""}</small></div>`).join("") : "<p>No study materials available yet.</p>";
    let html = card(state.user.role === "teacher" ? "Courses I teach" : "My enrolled courses", "📚", courseContent);
    html += card("Upcoming classes", "🗓️", classContent);
    html += card("Study materials", "📝", materialContent);
    if (state.user.role === "teacher") html += teacherForms(courses);
    $("dashboard-content").innerHTML = html;
  } catch (error) {
    $("dashboard-content").innerHTML = `<div class="empty-state">Could not load dashboard: ${escapeHtml(error.message)}</div>`;
  }
}
function teacherForms(courses) {
  const courseOptions = courses.map(c => `<option value="${c._id}">${escapeHtml(c.title)}</option>`).join("");
  const noCourses = `<option value="">Create a course first</option>`;
  return `<section class="dashboard-card wide-card"><div class="dash-icon">✨</div><h3>Teacher tools</h3>
    <form id="create-course-form" class="inline-form"><h3>Create a course</h3>
      <div class="field"><label for="course-title">Course title</label><input id="course-title" name="title" required maxlength="120" placeholder="e.g. Full Stack Web Development"></div>
      <div class="field"><label for="course-description">Description</label><input id="course-description" name="description" required maxlength="2000" placeholder="What will students learn?"></div>
      <div class="field"><label for="course-category">Category</label><input id="course-category" name="category" placeholder="e.g. Programming"></div>
      <div class="field"><label for="course-level">Level</label><select id="course-level" name="level"><option>Beginner</option><option>Intermediate</option><option>Advanced</option></select></div>
      <button class="btn btn-primary" type="submit">Create course</button><p class="form-message" id="course-message"></p>
    </form>
    <form id="create-class-form" class="inline-form"><h3>Schedule a class</h3>
      <div class="field"><label for="class-course">Course</label><select id="class-course" name="courseId" required>${courseOptions || noCourses}</select></div>
      <div class="field"><label for="class-title">Class title</label><input id="class-title" name="title" required placeholder="e.g. Introduction to HTML"></div>
      <div class="field"><label for="class-time">Start date and time</label><input id="class-time" name="startTime" type="datetime-local" required></div>
      <div class="field"><label for="class-url">Online meeting link (optional)</label><input id="class-url" name="meetingUrl" type="url" placeholder="https://meet.google.com/..."></div>
      <button class="btn btn-primary" type="submit" ${courses.length ? "" : "disabled"}>Schedule class</button><p class="form-message" id="class-message"></p>
    </form>
    <form id="create-material-form" class="inline-form"><h3>Add study material</h3>
      <div class="field"><label for="material-course">Course</label><select id="material-course" name="courseId" required>${courseOptions || noCourses}</select></div>
      <div class="field"><label for="material-title">Resource title</label><input id="material-title" name="title" required placeholder="e.g. HTML Notes - PDF"></div>
      <div class="field"><label for="material-url">Resource URL</label><input id="material-url" name="resourceUrl" type="url" required placeholder="https://example.com/notes.pdf"></div>
      <div class="field"><label for="material-description">Description (optional)</label><input id="material-description" name="description" placeholder="Brief description"></div>
      <button class="btn btn-primary" type="submit" ${courses.length ? "" : "disabled"}>Add material</button><p class="form-message" id="material-message"></p>
    </form></section>`;
}
$("auth-form").addEventListener("submit", async (event) => {
  event.preventDefault();
  const message = $("auth-message");
  message.textContent = "Please wait…";
  message.className = "form-message";
  const body = {
    name: $("auth-name").value.trim(),
    email: $("auth-email").value.trim(),
    password: $("auth-password").value,
    role: $("auth-role").value
  };
  try {
    const result = await api(`/auth/${state.authMode}`, { method: "POST", body: JSON.stringify(body) });
    state.token = result.token;
    state.user = result.user;
    localStorage.setItem("learnspace_token", state.token);
    localStorage.setItem("learnspace_user", JSON.stringify(state.user));
    closeModal();
    updateNavigation();
    await loadCourses();
    await loadDashboard();
    showToast(`Welcome${state.user.name ? ", " + state.user.name.split(" ")[0] : ""}!`);
  } catch (error) {
    message.textContent = error.message;
    message.className = "form-message";
  }
});
document.addEventListener("click", async (event) => {
  const enrollButton = event.target.closest('[data-action="enroll"]');
  const loginButton = event.target.closest('[data-action="login"]');
  const deleteCourseButton = event.target.closest('[data-action="delete-course"]');
  if (loginButton) openModal("login");
  if (deleteCourseButton) {
    if (!state.user || state.user.role !== "teacher") {
      showToast("Only teachers can delete courses.");
      return;
    }
    const confirmed = window.confirm("Are you sure you want to delete this course?");
    if (!confirmed) return;
    deleteCourseButton.disabled = true;
    try {
      await api(`/courses/${deleteCourseButton.dataset.id}`, { method: "DELETE" });
      // Refresh both the public course list and dashboard immediately.
      await loadCourses();
      await loadDashboard();
      showToast("Course deleted successfully.");
    } catch (error) {
      deleteCourseButton.disabled = false;
      showToast(error.message);
    }
    return;
  }
  if (enrollButton) {
    if (!state.user) return openModal("login");
    try {
      await api(`/courses/${enrollButton.dataset.id}/enroll`, { method: "POST" });
      showToast("You are enrolled in the course!");
      await loadCourses();
      await loadDashboard();
    } catch (error) { showToast(error.message); }
  }
});

document.addEventListener("submit", async (event) => {
  const form = event.target;
  if (!["create-course-form", "create-class-form", "create-material-form"].includes(form.id)) return;
  event.preventDefault();
  const messageId = {
    "create-course-form": "course-message",
    "create-class-form": "class-message",
    "create-material-form": "material-message"
  }[form.id];
  const msg = $(messageId);
  msg.textContent = "Please wait…";
  msg.className = "form-message";
  const data = Object.fromEntries(new FormData(form).entries());
  const route = {
    "create-course-form": "/courses",
    "create-class-form": "/classes",
    "create-material-form": "/materials"
  }[form.id];
  try {
    await api(route, { method: "POST", body: JSON.stringify(data) });
    showToast({
      "create-course-form": "Course created successfully.",
      "create-class-form": "Class scheduled successfully.",
      "create-material-form": "Study material added."
    }[form.id]);
    await loadCourses();
    await loadDashboard();
  } catch (error) {
    msg.textContent = error.message;
    msg.className = "form-message";
  }
});
$("open-login").addEventListener("click", () => openModal("login"));
$("open-register").addEventListener("click", () => openModal("register"));
$("hero-register").addEventListener("click", () => openModal("register"));
$("bottom-register").addEventListener("click", () => openModal("register"));
$("close-modal").addEventListener("click", closeModal);
$("modal-backdrop").addEventListener("click", closeModal);
$("tab-register").addEventListener("click", () => setAuthMode("register"));
$("tab-login").addEventListener("click", () => setAuthMode("login"));
$("logout-btn").addEventListener("click", async () => {
  state.token = null; state.user = null;
  localStorage.removeItem("learnspace_token"); localStorage.removeItem("learnspace_user");
  updateNavigation(); await loadCourses(); await loadDashboard();
  showToast("You have logged out.");
});
(async function init() {
  if (state.token) {
    try {
      const result = await api("/auth/me");
      state.user = result.user;
      localStorage.setItem("learnspace_user", JSON.stringify(state.user));
    } catch {
      state.token = null; state.user = null;
      localStorage.removeItem("learnspace_token"); localStorage.removeItem("learnspace_user");
    }
  }
  updateNavigation();
  await loadCourses();
  await loadDashboard();
})();
