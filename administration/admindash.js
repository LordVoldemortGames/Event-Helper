const SCHOOL_STORAGE_KEY = 'eventhelper_schools';

const getStoredSchools = () => {
  const raw = localStorage.getItem(SCHOOL_STORAGE_KEY);
  if (!raw) {
    return [];
  }

  try {
    return JSON.parse(raw) || [];
  } catch {
    return [];
  }
};

const saveStoredSchools = (schools) => {
  localStorage.setItem(SCHOOL_STORAGE_KEY, JSON.stringify(schools));
};

const generateSchoolId = () => {
  return `SCH-${Date.now()}-${Math.random().toString(36).slice(2, 8)}`;
};

const zeitCode = () => {
  return String(Date.now()).slice(-6);
};

const generateUniqueSchoolPin = () => {
  const existingPins = new Set(getStoredSchools().map((school) => school.schulpin));
  let pin = zeitCode();
  let attempts = 0;

  while (existingPins.has(pin) && attempts < 1000) {
    pin = String((Number(pin) + 1) % 1000000).padStart(6, '0');
    attempts += 1;
  }

  return pin;
};

const isValidSchoolPin = (pin) => {
  return /^[0-9]{6}$/.test(pin);
};

let currentEditSchoolId = null;

const setSchoolModalTitle = (text) => {
  const title = document.getElementById('admin-schools-modal-title');
  if (title) {
    title.textContent = text;
  }
};

const clearSchoolForm = (school = null) => {
  const nameField = document.getElementById('admin-school-name');
  const locationField = document.getElementById('admin-school-location');
  const notesField = document.getElementById('admin-school-notes');
  const pinField = document.getElementById('admin-school-pin');
  const errorField = document.getElementById('admin-school-error');

  if (school) {
    if (nameField) nameField.value = school.name;
    if (locationField) locationField.value = school.ort;
    if (notesField) notesField.value = school.notizen;
    if (pinField) pinField.value = school.schulpin;
    currentEditSchoolId = school.id;
    setSchoolModalTitle('Schule bearbeiten');
  } else {
    if (nameField) nameField.value = '';
    if (locationField) locationField.value = '';
    if (notesField) notesField.value = '';
    if (pinField) pinField.value = generateUniqueSchoolPin();
    currentEditSchoolId = null;
    setSchoolModalTitle('Neue Schule anlegen');
  }

  if (errorField) {
    errorField.textContent = '';
    errorField.style.display = 'none';
  }
};

const showSchoolError = (message) => {
  const errorField = document.getElementById('admin-school-error');
  if (!errorField) {
    alert(message);
    return;
  }

  errorField.textContent = message;
  errorField.style.display = 'block';
};

const deleteSchool = (schoolId) => {
  const schools = getStoredSchools();
  const remaining = schools.filter((school) => school.id !== schoolId);

  if (schools.length === remaining.length) {
    return;
  }

  if (!confirm('Schule wirklich löschen?')) {
    return;
  }

  saveStoredSchools(remaining);
  renderSchoolList();
};

const buildSchoolElement = (school) => {
  const card = document.createElement('article');
  card.className = 'ticket-card';
  card.dataset.schoolId = school.id;

  const title = document.createElement('h3');
  title.textContent = school.name;
  card.appendChild(title);

  const location = document.createElement('p');
  location.innerHTML = `<strong>Ort:</strong> ${school.ort}`;
  card.appendChild(location);

  const pin = document.createElement('p');
  pin.innerHTML = `<strong>SchulPIN:</strong> ${school.schulpin}`;
  card.appendChild(pin);

  if (school.notizen) {
    const notes = document.createElement('p');
    notes.innerHTML = `<strong>Notizen:</strong> ${school.notizen}`;
    card.appendChild(notes);
  }

  card.style.cursor = 'pointer';
  card.title = 'Klicken zum Bearbeiten';
  card.addEventListener('click', () => openSchoolModal(school));

  return card;
};

const renderSchoolList = () => {
  const container = document.getElementById('admin-school-list');
  if (!container) {
    return;
  }

  const schools = getStoredSchools();
  container.innerHTML = '';

  if (schools.length === 0) {
    const empty = document.createElement('p');
    empty.textContent = 'Zurzeit sind keine Schulen gespeichert.';
    empty.style.color = '#ffffff';
    container.appendChild(empty);
    return;
  }

  schools.slice().reverse().forEach((school) => {
    container.appendChild(buildSchoolElement(school));
  });
};

const openSchoolModal = (school = null) => {
  const modal = document.getElementById('admin-schools-detail');
  if (!modal) {
    return;
  }

  clearSchoolForm(school);
  modal.classList.remove('hidden');
  modal.setAttribute('aria-hidden', 'false');
};

const closeSchoolModal = () => {
  const modal = document.getElementById('admin-schools-detail');
  if (!modal) {
    return;
  }

  modal.classList.add('hidden');
  modal.setAttribute('aria-hidden', 'true');
};

const saveSchoolFromModal = () => {
  const nameField = document.getElementById('admin-school-name');
  const locationField = document.getElementById('admin-school-location');
  const notesField = document.getElementById('admin-school-notes');
  const pinField = document.getElementById('admin-school-pin');

  const name = nameField?.value.trim();
  const ort = locationField?.value.trim();
  const notizen = notesField?.value.trim();
  const schulpin = pinField?.value.trim();

  if (!name) {
    showSchoolError('Bitte gib einen Schulnamen ein.');
    return;
  }

  if (!ort) {
    showSchoolError('Bitte gib den Ort der Schule ein.');
    return;
  }

  if (!isValidSchoolPin(schulpin)) {
    showSchoolError('Die SchulPIN muss genau 6 Ziffern sein.');
    return;
  }

  const schools = getStoredSchools();
  const existingPin = schools.some((school) => school.schulpin === schulpin && school.id !== currentEditSchoolId);
  if (existingPin) {
    showSchoolError('Die SchulPIN ist bereits vergeben. Bitte wähle eine andere.');
    return;
  }

  if (currentEditSchoolId) {
    const index = schools.findIndex((item) => item.id === currentEditSchoolId);
    if (index !== -1) {
      schools[index] = {
        ...schools[index],
        name,
        ort,
        notizen,
        schulpin,
      };
    }
  } else {
    const school = {
      id: generateSchoolId(),
      name,
      ort,
      notizen,
      schulpin,
      createdAt: new Date().toISOString(),
    };
    schools.push(school);
  }

  saveStoredSchools(schools);
  renderSchoolList();
  closeSchoolModal();
};

const deleteSchoolFromModal = () => {
  if (!currentEditSchoolId) {
    return;
  }

  if (!confirm('Schule wirklich löschen?')) {
    return;
  }

  if (!confirm('Bitte final bestätigen: Soll die Schule endgültig gelöscht werden?')) {
    return;
  }

  deleteSchool(currentEditSchoolId);
  closeSchoolModal();
};

const initAdminSchools = () => {
  const adminNewSchoolButton = document.getElementById('admin-new-school');
  const saveButton = document.getElementById('admin-school-save');
  const cancelButton = document.getElementById('admin-school-cancel');
  const deleteButton = document.getElementById('admin-school-delete');
  const closeButton = document.getElementById('admin-schools-modal-close');
  const modal = document.getElementById('admin-schools-detail');

  renderSchoolList();

  if (adminNewSchoolButton) {
    adminNewSchoolButton.addEventListener('click', () => openSchoolModal(null));
  }

  if (saveButton) {
    saveButton.addEventListener('click', saveSchoolFromModal);
  }

  if (deleteButton) {
    deleteButton.addEventListener('click', (event) => {
      event.preventDefault();
      deleteSchoolFromModal();
    });
  }

  if (cancelButton) {
    cancelButton.addEventListener('click', (event) => {
      event.preventDefault();
      closeSchoolModal();
    });
  }

  if (closeButton) {
    closeButton.addEventListener('click', closeSchoolModal);
  }

  if (modal) {
    modal.addEventListener('click', (event) => {
      if (event.target === modal) {
        closeSchoolModal();
      }
    });
  }

  window.addEventListener('storage', (event) => {
    if (event.key === SCHOOL_STORAGE_KEY) {
      renderSchoolList();
    }
  });

  document.addEventListener('keydown', (event) => {
    if (event.key === 'Escape') {
      closeSchoolModal();
    }
  });
};

if (document.readyState === 'loading') {
  document.addEventListener('DOMContentLoaded', initAdminSchools);
} else {
  initAdminSchools();
}
