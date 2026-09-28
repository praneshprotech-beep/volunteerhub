const apiPaths = {
  volunteers: "/api/volunteers",
  events: "/api/events",
  signups: "/api/signups",
  attendance: "/api/attendance-records"
};

const state = {
  volunteers: [],
  events: [],
  signups: [],
  attendance: [],
  apiErrors: [],
  currentView: "overview",
  editing: null
};

const eventPhotos = [
  "https://images.unsplash.com/photo-1559027615-cd4628902d4a?auto=format&fit=crop&w=900&q=80",
  "https://images.unsplash.com/photo-1469571486292-0ba58a3f068b?auto=format&fit=crop&w=900&q=80",
  "https://images.unsplash.com/photo-1531206715517-5c0ba140b2b8?auto=format&fit=crop&w=900&q=80"
];

const eventKinds = ["COMMUNITY DAY", "NEIGHBORHOOD CARE", "ON THE GROUND"];
const dialog = document.querySelector("#record-dialog");
const form = document.querySelector("#record-form");
const formFields = document.querySelector("#form-fields");

function escapeHtml(value) {
  return String(value ?? "").replace(/[&<>"']/g, (character) => ({
    "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;"
  })[character]);
}

function initials(name) {
  return String(name || "?").trim().split(/\s+/).slice(0, 2).map((part) => part.charAt(0)).join("").toUpperCase();
}

function relationshipId(value) {
  return value && typeof value === "object" ? value.id : value;
}

function volunteerName(signup) {
  return signup.volunteer?.name || "Unknown volunteer";
}

function eventName(record) {
  return record.event?.eventName || "Unknown event";
}

function formatDate(value, options = { month: "short", day: "numeric", year: "numeric" }) {
  if (!value) return "Date not set";
  const date = new Date(`${value}T00:00:00`);
  if (Number.isNaN(date.getTime())) return value;
  return new Intl.DateTimeFormat(undefined, options).format(date);
}

function dateBits(value) {
  if (!value) return { day: "--", month: "DATE" };
  const date = new Date(`${value}T00:00:00`);
  if (Number.isNaN(date.getTime())) return { day: "--", month: "DATE" };
  return {
    day: new Intl.DateTimeFormat(undefined, { day: "2-digit" }).format(date),
    month: new Intl.DateTimeFormat(undefined, { month: "short" }).format(date)
  };
}

function todayString() {
  const now = new Date();
  const localDate = new Date(now.getTime() - now.getTimezoneOffset() * 60000);
  return localDate.toISOString().slice(0, 10);
}

function showToast(message, kind = "success") {
  const region = document.querySelector("#toast-region");
  const toast = document.createElement("div");
  toast.className = `toast${kind === "error" ? " is-error" : ""}`;
  toast.innerHTML = `<span class="toast-mark" aria-hidden="true">${kind === "error" ? "!" : "✓"}</span><span class="toast-message">${escapeHtml(message)}</span>`;
  region.append(toast);
  window.setTimeout(() => {
    toast.classList.add("toast-exit");
    window.setTimeout(() => toast.remove(), 220);
  }, 4300);
}

async function apiRequest(path, options = {}) {
  const requestOptions = { ...options, headers: { ...(options.headers || {}) } };
  if (options.body !== undefined) {
    requestOptions.headers["Content-Type"] = "application/json";
    requestOptions.body = JSON.stringify(options.body);
  }

  let response;
  try {
    response = await fetch(path, requestOptions);
  } catch (error) {
    throw new Error("Cannot reach the VolunteerHub API. Check that the Spring Boot server is running.");
  }

  if (response.status === 204) return null;

  const contentType = response.headers.get("content-type") || "";
  let payload;
  if (contentType.includes("application/json")) {
    payload = await response.json().catch(() => null);
  } else {
    payload = await response.text().catch(() => "");
  }

  if (!response.ok) {
    const details = payload?.details && typeof payload.details === "object"
      ? Object.values(payload.details).filter(Boolean).join(" ")
      : "";
    const message = [payload?.message, details].filter(Boolean).join(" ")
      || (typeof payload === "string" && payload.trim())
      || `Request failed with status ${response.status}.`;
    throw new Error(message);
  }

  return payload;
}

async function loadData({ quiet = false } = {}) {
  const resources = Object.keys(apiPaths);
  const results = await Promise.allSettled(resources.map((resource) => apiRequest(apiPaths[resource])));
  state.apiErrors = [];

  results.forEach((result, index) => {
    const resource = resources[index];
    if (result.status === "fulfilled" && Array.isArray(result.value)) {
      state[resource] = result.value;
    } else {
      state.apiErrors.push(resource);
    }
  });

  renderAll();
  updateConnection();

  if (state.apiErrors.length && !quiet) {
    showToast("Some field data could not be loaded. Check the API and try again.", "error");
  }
}

function updateConnection() {
  const banner = document.querySelector("#api-banner");
  const bannerMessage = document.querySelector("#api-banner-message");
  const light = document.querySelector("#connection-light");
  const label = document.querySelector("#connection-label");
  const isOnline = state.apiErrors.length === 0;

  banner.hidden = isOnline;
  bannerMessage.textContent = state.apiErrors.length === Object.keys(apiPaths).length
    ? "The API is unavailable. Start Spring Boot and retry to load community records."
    : `Could not load: ${state.apiErrors.join(", ")}. Other sections are still available.`;
  light.classList.toggle("is-online", isOnline);
  light.classList.toggle("is-offline", !isOnline);
  label.textContent = isOnline ? "Field data connected" : "Connection needs attention";
}

function signupCountFor(eventId) {
  return state.signups.filter((signup) => Number(relationshipId(signup.event)) === Number(eventId)).length;
}

function renderStats() {
  document.querySelector("#stat-volunteers").textContent = state.volunteers.length;
  document.querySelector("#stat-events").textContent = state.events.length;
  document.querySelector("#stat-signups").textContent = state.signups.length;
  document.querySelector("#stat-attendance").textContent = state.attendance.filter((record) => record.attended === true).length;
  document.querySelector("#hero-volunteer-count").textContent = state.volunteers.length;
  document.querySelector("#nav-event-count").textContent = state.events.length;
  document.querySelector("#nav-volunteer-count").textContent = state.volunteers.length;
}

function eventCardMarkup(event, index) {
  const date = dateBits(event.eventDate);
  const capacity = Number(event.volunteerCapacity || 0);
  const registered = signupCountFor(event.id);
  const percent = capacity > 0 ? Math.min(100, Math.round((registered / capacity) * 100)) : 0;
  const fillClass = percent >= 80 ? "capacity-fill is-near-full" : "capacity-fill";
  const photo = eventPhotos[index % eventPhotos.length];
  const category = eventKinds[index % eventKinds.length];

  return `<article class="event-card">
    <div class="event-image"><img src="${photo}" alt="Community volunteers at an event" loading="lazy"><span class="event-date-tag"><strong>${escapeHtml(date.day)}</strong><small>${escapeHtml(date.month)}</small></span></div>
    <div class="event-card-body">
      <div class="event-card-top"><span class="event-category">${category}</span><span class="event-more">${rowActions("event", event.id)}</span></div>
      <h3>${escapeHtml(event.eventName)}</h3>
      <p class="event-location"><span aria-hidden="true">⌖</span>${escapeHtml(event.location)}</p>
      <div class="capacity-block"><div class="capacity-label"><span>Community spots</span><strong>${registered} / ${capacity} joined</strong></div><div class="capacity-track" role="progressbar" aria-label="Event capacity" aria-valuemin="0" aria-valuemax="100" aria-valuenow="${percent}"><div class="${fillClass}" style="width:${percent}%"></div></div></div>
    </div>
  </article>`;
}

function getSortedEvents() {
  return [...state.events].sort((first, second) => String(first.eventDate || "").localeCompare(String(second.eventDate || "")));
}

function renderEvents() {
  const allEvents = getSortedEvents();
  const dashboardEvents = allEvents.slice(0, 3);
  const query = document.querySelector('[data-filter="events"]')?.value.trim().toLowerCase() || "";
  const filteredEvents = allEvents.filter((event) => `${event.eventName} ${event.location}`.toLowerCase().includes(query));

  document.querySelector("#dashboard-events").innerHTML = dashboardEvents.length
    ? dashboardEvents.map(eventCardMarkup).join("")
    : emptyState("No events on the calendar yet.", "Add an event to give your community a place to show up.");
  document.querySelector("#events-grid").innerHTML = filteredEvents.length
    ? filteredEvents.map(eventCardMarkup).join("")
    : emptyState(query ? "No events match that search." : "The calendar is ready for its first event.", "Create a community event and start gathering people.");
  document.querySelector("#events-summary").textContent = `${allEvents.length} ${allEvents.length === 1 ? "event" : "events"} in the community calendar`;
}

function renderVolunteers() {
  const query = document.querySelector('[data-filter="volunteers"]')?.value.trim().toLowerCase() || "";
  const volunteers = state.volunteers.filter((volunteer) => `${volunteer.name} ${volunteer.email} ${volunteer.phone}`.toLowerCase().includes(query));
  document.querySelector("#volunteers-summary").textContent = `${state.volunteers.length} people in the volunteer community`;
  document.querySelector("#volunteers-grid").innerHTML = volunteers.length
    ? volunteers.map((volunteer, index) => {
      const signupTotal = state.signups.filter((signup) => Number(relationshipId(signup.volunteer)) === Number(volunteer.id)).length;
      return `<article class="volunteer-card">
        <div class="volunteer-card-head"><div class="volunteer-profile"><span class="avatar avatar-tone-${index % 5}">${escapeHtml(initials(volunteer.name))}</span><div class="volunteer-profile-copy"><h3>${escapeHtml(volunteer.name)}</h3><p>Community volunteer</p></div></div>${rowActions("volunteer", volunteer.id)}</div>
        <div class="volunteer-contact"><span><b aria-hidden="true">@</b>${escapeHtml(volunteer.email)}</span><span><b aria-hidden="true">⌕</b>${escapeHtml(volunteer.phone)}</span></div>
        <div class="volunteer-card-foot"><span>Showing up since day one</span><span class="activity-count">${signupTotal} ${signupTotal === 1 ? "signup" : "signups"}</span></div>
      </article>`;
    }).join("")
    : emptyState(query ? "No volunteers match that search." : "Your community starts with one person.", "Add a volunteer profile to begin building your roster.");
}

function personCell(volunteer) {
  const person = volunteer || {};
  return `<div class="table-person"><span class="avatar avatar-tone-${Math.abs(Number(person.id || 0)) % 5}">${escapeHtml(initials(person.name))}</span><span><strong>${escapeHtml(person.name || "Unknown volunteer")}</strong><small>${escapeHtml(person.email || "")}</small></span></div>`;
}

function rowActions(resource, id) {
  return `<div class="row-actions"><button class="row-action" type="button" data-action="edit" data-resource="${resource}" data-id="${escapeHtml(id)}" aria-label="Edit record" title="Edit">✎</button><button class="row-action is-danger" type="button" data-action="delete" data-resource="${resource}" data-id="${escapeHtml(id)}" aria-label="Delete record" title="Delete">×</button></div>`;
}

function statusClass(status) {
  const normalized = String(status || "").toLowerCase();
  if (normalized.includes("cancel") || normalized.includes("declin")) return "status-pill is-coral";
  if (normalized.includes("pending") || normalized.includes("wait")) return "status-pill is-warm";
  return "status-pill";
}

function renderSignups() {
  const query = document.querySelector('[data-filter="signups"]')?.value.trim().toLowerCase() || "";
  const rows = [...state.signups].filter((signup) => `${volunteerName(signup)} ${eventName(signup)} ${signup.status || ""}`.toLowerCase().includes(query));
  document.querySelector("#signups-summary").textContent = `${state.signups.length} signup records`;
  document.querySelector("#signups-table").innerHTML = rows.length
    ? rows.map((signup) => `<tr>
      <td>${personCell(signup.volunteer)}</td>
      <td><span class="table-event"><span class="table-event-dot"></span>${escapeHtml(eventName(signup))}</span></td>
      <td>${escapeHtml(formatDate(signup.signupDate))}</td>
      <td><span class="${statusClass(signup.status)}">${escapeHtml(signup.status)}</span></td>
      <td>${rowActions("signup", signup.id)}</td>
    </tr>`).join("")
    : tableEmpty("No signup records to show.");

  const recent = [...state.signups].slice(-4).reverse();
  document.querySelector("#dashboard-signups").innerHTML = recent.length
    ? recent.map((signup, index) => `<div class="mini-signup"><span class="avatar avatar-tone-${index % 5}">${escapeHtml(initials(volunteerName(signup)))}</span><span class="mini-signup-copy"><strong>${escapeHtml(volunteerName(signup))}</strong><span>${escapeHtml(eventName(signup))}</span></span><span class="mini-signup-date">${escapeHtml(formatDate(signup.signupDate, { month: "short", day: "numeric" }))}</span></div>`).join("")
    : `<div class="empty-table">First signup, first spark. Invite someone in.</div>`;
}

function renderAttendance() {
  const query = document.querySelector('[data-filter="attendance"]')?.value.trim().toLowerCase() || "";
  const rows = state.attendance.filter((record) => `${record.volunteer?.name || ""} ${record.event?.eventName || ""}`.toLowerCase().includes(query));
  document.querySelector("#attendance-summary").textContent = `${state.attendance.length} attendance records`;
  document.querySelector("#attendance-table").innerHTML = rows.length
    ? rows.map((record) => `<tr>
      <td>${personCell(record.volunteer)}</td>
      <td><span class="table-event"><span class="table-event-dot"></span>${escapeHtml(eventName(record))}</span></td>
      <td><span class="${record.attended ? "status-pill" : "status-pill is-muted"}">${record.attended ? "Attended" : "Not attended"}</span></td>
      <td><span class="hours-value">${escapeHtml(record.contributedHours ?? "—")}</span>${record.contributedHours === 1 ? " hr" : record.contributedHours == null ? "" : " hrs"}</td>
      <td>${rowActions("attendance", record.id)}</td>
    </tr>`).join("")
    : tableEmpty("No attendance records to show.");
}

function emptyState(title, message) {
  return `<div class="empty-state"><div><strong>${escapeHtml(title)}</strong><p>${escapeHtml(message)}</p></div></div>`;
}

function tableEmpty(message) {
  return `<tr><td class="empty-table" colspan="5">${escapeHtml(message)}</td></tr>`;
}

function renderAll() {
  renderStats();
  renderEvents();
  renderVolunteers();
  renderSignups();
  renderAttendance();
}

function switchView(view) {
  if (!document.querySelector(`[data-panel="${view}"]`)) return;
  state.currentView = view;
  document.querySelectorAll("[data-panel]").forEach((panel) => {
    const active = panel.dataset.panel === view;
    panel.classList.toggle("is-visible", active);
    panel.hidden = !active;
  });
  document.querySelectorAll(".nav-link[data-view]").forEach((link) => link.classList.toggle("is-active", link.dataset.view === view));
  document.querySelector("#breadcrumb-current").textContent = ({
    overview: "Mission overview", events: "Events", volunteers: "Volunteers", signups: "Signups", attendance: "Attendance"
  })[view];
  document.querySelector("#sidebar").classList.remove("is-open");
  document.querySelector("#menu-toggle").setAttribute("aria-expanded", "false");
  window.scrollTo({ top: 0, behavior: "smooth" });
}

function fieldMarkup({ name, label, type = "text", required = true, wide = false, value = "", placeholder = "", min, max, step, options, hint }) {
  const requiredAttr = required ? "required" : "";
  const wideClass = wide ? " is-wide" : "";
  const constraints = [min !== undefined ? `min="${escapeHtml(min)}"` : "", max !== undefined ? `max="${escapeHtml(max)}"` : "", step !== undefined ? `step="${escapeHtml(step)}"` : ""].filter(Boolean).join(" ");
  let control;

  if (type === "select") {
    const optionMarkup = (options || []).map((option) => `<option value="${escapeHtml(option.value)}" ${String(option.value) === String(value) ? "selected" : ""}>${escapeHtml(option.label)}</option>`).join("");
    const placeholder = options?.length ? `Choose ${escapeHtml(label.toLowerCase())}` : "Add records first";
    control = `<select id="field-${name}" name="${name}" ${requiredAttr}><option value="" disabled ${value ? "" : "selected"}>${placeholder}</option>${optionMarkup}</select>`;
  } else {
    control = `<input id="field-${name}" name="${name}" type="${type}" value="${escapeHtml(value)}" placeholder="${escapeHtml(placeholder)}" ${requiredAttr} ${constraints}>`;
  }

  return `<div class="field${wideClass}"><label for="field-${name}">${escapeHtml(label)}${required ? " *" : ""}</label>${control}${hint ? `<span class="field-hint">${escapeHtml(hint)}</span>` : ""}</div>`;
}

function buildForm(resource, record) {
  const editing = Boolean(record);
  if (resource === "volunteer") {
    return [
      fieldMarkup({ name: "name", label: "Full name", value: record?.name || "", placeholder: "e.g. Maya Patel", wide: true }),
      fieldMarkup({ name: "email", label: "Email address", type: "email", value: record?.email || "", placeholder: "name@example.org", wide: true }),
      fieldMarkup({ name: "phone", label: "Phone number", type: "tel", value: record?.phone || "", placeholder: "555-0100", wide: true })
    ].join("");
  }

  if (resource === "event") {
    return [
      fieldMarkup({ name: "eventName", label: "Event name", value: record?.eventName || "", placeholder: "Community garden day", wide: true }),
      fieldMarkup({ name: "eventDate", label: "Event date", type: "date", value: record?.eventDate || "", min: todayString() }),
      fieldMarkup({ name: "volunteerCapacity", label: "Volunteer capacity", type: "number", value: record?.volunteerCapacity ?? "", min: 1, step: 1 }),
      fieldMarkup({ name: "location", label: "Location", value: record?.location || "", placeholder: "Neighborhood or venue", wide: true })
    ].join("");
  }

  if (resource === "signup") {
    const volunteerOptions = state.volunteers.map((volunteer) => ({ value: volunteer.id, label: `${volunteer.name} · ${volunteer.email}` }));
    const eventOptions = state.events.map((event) => ({ value: event.id, label: `${event.eventName} · ${formatDate(event.eventDate)}` }));
    return [
      fieldMarkup({ name: "volunteerId", label: "Volunteer", type: "select", value: relationshipId(record?.volunteer) ?? "", options: volunteerOptions, hint: volunteerOptions.length ? "" : "Add a volunteer before recording a signup." }),
      fieldMarkup({ name: "eventId", label: "Event", type: "select", value: relationshipId(record?.event) ?? "", options: eventOptions, hint: eventOptions.length ? "" : "Add an event before recording a signup." }),
      fieldMarkup({ name: "signupDate", label: "Signup date", type: "date", value: record?.signupDate || todayString(), max: todayString() }),
      fieldMarkup({ name: "status", label: "Status", value: record?.status || "CONFIRMED", placeholder: "e.g. CONFIRMED" })
    ].join("");
  }

  if (resource === "attendance") {
    const volunteerOptions = state.volunteers.map((volunteer) => ({ value: volunteer.id, label: `${volunteer.name} · ${volunteer.email}` }));
    const eventOptions = state.events.map((event) => ({ value: event.id, label: `${event.eventName} · ${formatDate(event.eventDate)}` }));
    return [
      fieldMarkup({ name: "volunteerId", label: "Volunteer", type: "select", value: relationshipId(record?.volunteer) ?? "", options: volunteerOptions, hint: volunteerOptions.length ? "" : "Add a volunteer before recording attendance." }),
      fieldMarkup({ name: "eventId", label: "Event", type: "select", value: relationshipId(record?.event) ?? "", options: eventOptions, hint: eventOptions.length ? "" : "Add an event before recording attendance." }),
      fieldMarkup({ name: "attended", label: "Attendance", type: "select", value: record?.attended === true ? "true" : record?.attended === false ? "false" : "", options: [{ value: "true", label: "Attended" }, { value: "false", label: "Did not attend" }] }),
      fieldMarkup({ name: "contributedHours", label: "Contributed hours", type: "number", required: false, value: record?.contributedHours ?? "", min: 0, step: 1, hint: "The service validates hours against attendance." })
    ].join("");
  }

  return editing ? "" : "";
}

function resourceName(resource) {
  return ({ volunteer: "Volunteer", event: "Event", signup: "Signup", attendance: "Attendance record" })[resource] || "Record";
}

function openRecordDialog(resource, id = null) {
  const collection = ({ volunteer: "volunteers", event: "events", signup: "signups", attendance: "attendance" })[resource];
  const record = id == null ? null : state[collection].find((item) => Number(item.id) === Number(id));
  if (id != null && !record) {
    showToast(`${resourceName(resource)} could not be found in the current list.`, "error");
    return;
  }

  state.editing = { resource, id: record?.id ?? null };
  document.querySelector("#dialog-eyebrow").textContent = editingLabel(resource, Boolean(record));
  document.querySelector("#dialog-title").textContent = `${record ? "Edit" : "Add"} ${resourceName(resource).toLowerCase()}`;
  document.querySelector("#dialog-description").textContent = dialogDescription(resource, Boolean(record));
  document.querySelector("#dialog-submit").innerHTML = `${record ? "Save changes" : "Save record"} <span aria-hidden="true">↗</span>`;
  document.querySelector("#form-error").hidden = true;
  formFields.innerHTML = buildForm(resource, record);

  dialog.showModal();
}

function editingLabel(resource, editing) {
  if (resource === "signup") return editing ? "UPDATE THE COMMITMENT" : "MAKE IT OFFICIAL";
  if (resource === "attendance") return editing ? "UPDATE FIELD NOTES" : "LOG THE MOMENT";
  return editing ? "KEEP THE DETAILS CURRENT" : "ADD TO THE MISSION";
}

function dialogDescription(resource, editing) {
  const action = editing ? "Update" : "Add";
  return ({
    volunteer: `${action} a person to the VolunteerHub community.`,
    event: `${action} an event and make room for people to help.`,
    signup: `${action} a volunteer’s commitment to an event.`,
    attendance: `${action} an attendance record for a volunteer and event.`
  })[resource];
}

function readPayload(resource) {
  const values = new FormData(form);
  if (resource === "volunteer") {
    return { name: values.get("name").trim(), email: values.get("email").trim(), phone: values.get("phone").trim() };
  }
  if (resource === "event") {
    return {
      eventName: values.get("eventName").trim(),
      eventDate: values.get("eventDate"),
      location: values.get("location").trim(),
      volunteerCapacity: Number(values.get("volunteerCapacity"))
    };
  }
  if (resource === "signup") {
    return {
      volunteerId: Number(values.get("volunteerId")),
      eventId: Number(values.get("eventId")),
      signupDate: values.get("signupDate") || null,
      status: values.get("status").trim()
    };
  }
  return {
    volunteerId: Number(values.get("volunteerId")),
    eventId: Number(values.get("eventId")),
    attended: values.get("attended") === "true",
    contributedHours: values.get("contributedHours") === "" ? null : Number(values.get("contributedHours"))
  };
}

function closeDialog() {
  dialog.close();
  state.editing = null;
  form.reset();
}

async function submitRecord(event) {
  event.preventDefault();
  if (!state.editing) return;

  const { resource, id } = state.editing;
  const path = `${apiPaths[resource === "attendance" ? "attendance" : `${resource}s`]}${id == null ? "" : `/${id}`}`;
  const submitButton = document.querySelector("#dialog-submit");
  const errorBox = document.querySelector("#form-error");
  submitButton.disabled = true;
  errorBox.hidden = true;

  try {
    await apiRequest(path, { method: id == null ? "POST" : "PUT", body: readPayload(resource) });
    closeDialog();
    await loadData({ quiet: true });
    showToast(`${resourceName(resource)} ${id == null ? "added" : "updated"} successfully.`);
  } catch (error) {
    errorBox.textContent = error.message;
    errorBox.hidden = false;
    showToast(error.message, "error");
  } finally {
    submitButton.disabled = false;
  }
}

async function deleteRecord(resource, id) {
  const collection = ({ volunteer: "volunteers", event: "events", signup: "signups", attendance: "attendance" })[resource];
  const item = state[collection].find((entry) => Number(entry.id) === Number(id));
  const label = item?.name || item?.eventName || resourceName(resource).toLowerCase();
  if (!window.confirm(`Delete ${label}? This cannot be undone.`)) return;

  const path = `${apiPaths[collection]}/${id}`;
  try {
    await apiRequest(path, { method: "DELETE" });
    await loadData({ quiet: true });
    showToast(`${resourceName(resource)} deleted.`);
  } catch (error) {
    showToast(error.message, "error");
  }
}

function setTodayLabel() {
  const now = new Date();
  document.querySelector("#today-label").textContent = new Intl.DateTimeFormat(undefined, {
    weekday: "short", month: "short", day: "numeric"
  }).format(now);
}

document.addEventListener("click", (event) => {
  const viewButton = event.target.closest("[data-view]");
  if (viewButton) {
    if (viewButton.tagName === "A") event.preventDefault();
    switchView(viewButton.dataset.view);
    return;
  }

  const createButton = event.target.closest("[data-create]");
  if (createButton) {
    openRecordDialog(createButton.dataset.create);
    return;
  }

  const actionButton = event.target.closest("[data-action]");
  if (actionButton) {
    if (actionButton.dataset.action === "edit") openRecordDialog(actionButton.dataset.resource, actionButton.dataset.id);
    if (actionButton.dataset.action === "delete") deleteRecord(actionButton.dataset.resource, actionButton.dataset.id);
  }
});

document.addEventListener("input", (event) => {
  const filter = event.target.dataset.filter;
  if (filter === "events") renderEvents();
  if (filter === "volunteers") renderVolunteers();
  if (filter === "signups") renderSignups();
  if (filter === "attendance") renderAttendance();
});

form.addEventListener("submit", submitRecord);
document.querySelector("#dialog-close").addEventListener("click", closeDialog);
document.querySelector("#dialog-cancel").addEventListener("click", closeDialog);
document.querySelector("#retry-load").addEventListener("click", () => loadData());
document.querySelector("#menu-toggle").addEventListener("click", (event) => {
  const sidebar = document.querySelector("#sidebar");
  const expanded = sidebar.classList.toggle("is-open");
  event.currentTarget.setAttribute("aria-expanded", String(expanded));
});
dialog.addEventListener("click", (event) => {
  if (event.target === dialog) closeDialog();
});

setTodayLabel();
loadData();