// Materialliste-Funktionalität
const MATERIAL_STORAGE_KEY = 'eventhelper_materials';

const getStoredMaterials = () => {
  const raw = localStorage.getItem(MATERIAL_STORAGE_KEY);
  if (!raw) {
    return [];
  }

  try {
    const materials = JSON.parse(raw) || [];
    // Migriere alte Daten zu neuen Feldern
    return materials.map(material => {
      if (material.name && !material.model) {
        // Alte Daten migrieren
        return {
          model: material.name,
          brand: material.category || 'Unbekannt',
          inventory: `INV-${Date.now()}-${Math.random().toString(36).substr(2, 5)}`,
          status: 'verfügbar',
          notes: material.notes || ''
        };
      }
      // Stelle sicher, dass alle Materialien einen Status haben
      if (!material.status) {
        material.status = 'verfügbar';
      }
      return material;
    });
  } catch {
    return [];
  }
};

const saveStoredMaterials = (materials) => {
  localStorage.setItem(MATERIAL_STORAGE_KEY, JSON.stringify(materials));
};

const createMaterialElement = (material, index) => {
  const row = document.createElement('tr');
  row.className = 'material-row';
  row.dataset.index = index;

  const statusClass = material.status === 'verfügbar' ? 'status-available' :
                     material.status === 'ausgeliehen' ? 'status-borrowed' :
                     material.status === 'defekt' ? 'status-defect' : 'status-maintenance';

  row.innerHTML = `
    <td>${material.model}</td>
    <td>${material.brand}</td>
    <td>${material.inventory}</td>
    <td><span class="status-badge ${statusClass}">${material.status}</span></td>
  `;

  return row;
};

const renderMaterialList = () => {
  const tbody = document.getElementById('dash-material-list');
  if (!tbody) {
    return;
  }

  const materials = getStoredMaterials().slice().sort((a, b) => {
    const ai = String(a.inventory || '');
    const bi = String(b.inventory || '');
    return ai.localeCompare(bi, undefined, { numeric: true, sensitivity: 'base' });
  });
  tbody.innerHTML = '';

  if (materials.length === 0) {
    const emptyRow = document.createElement('tr');
    const emptyCell = document.createElement('td');
    emptyCell.colSpan = 4;
    emptyCell.textContent = 'Keine Materialien in der Liste.';
    emptyCell.style.color = '#ffffff';
    emptyCell.style.textAlign = 'center';
    emptyCell.style.padding = '2rem';
    emptyRow.appendChild(emptyCell);
    tbody.appendChild(emptyRow);
    return;
  }

  materials.forEach((material, index) => {
    tbody.appendChild(createMaterialElement(material, index));
  });
};

const showMaterialForm = (material = null, index = null) => {
  openMaterialModal(material, index);
};

// Modal-Funktionen
const openMaterialModal = (material = null, index = null) => {
  const modal = document.getElementById('dash-material-modal');
  const title = document.getElementById('dash-material-modal-title');
  const modelInput = document.getElementById('dash-modal-material-model');
  const brandInput = document.getElementById('dash-modal-material-brand');
  const inventoryInput = document.getElementById('dash-modal-material-inventory');
  const statusInput = document.getElementById('dash-modal-material-status');
  const categoryInput = document.getElementById('dash-modal-material-class');
  const notesInput = document.getElementById('dash-modal-material-notes');
  const deleteButton = document.getElementById('dash-material-modal-delete');

  if (!modal || !title || !modelInput || !brandInput || !inventoryInput || !statusInput || !notesInput) {
    return;
  }

  if (material) {
    title.textContent = 'Material bearbeiten';
    modelInput.value = material.model;
    brandInput.value = material.brand;
    inventoryInput.value = material.inventory;
    statusInput.value = material.status;
    categoryInput.value = material.category || '';
    notesInput.value = material.notes || '';
    modal.dataset.editIndex = index;
    if (deleteButton) deleteButton.style.display = 'inline-block';
  } else {
    title.textContent = 'Neues Material hinzufügen';
    modelInput.value = '';
    brandInput.value = '';
    inventoryInput.value = '';
    statusInput.value = '';
    categoryInput.value = '';
    notesInput.value = '';
    delete modal.dataset.editIndex;
    if (deleteButton) deleteButton.style.display = 'none';
  }

  modal.classList.remove('hidden');
  modal.setAttribute('aria-hidden', 'false');
};

const closeMaterialModal = () => {
  const modal = document.getElementById('dash-material-modal');
  if (!modal) {
    return;
  }
  modal.classList.add('hidden');
  modal.setAttribute('aria-hidden', 'true');
};

const saveMaterialFromModal = () => {
  const modelInput = document.getElementById('dash-modal-material-model');
  const brandInput = document.getElementById('dash-modal-material-brand');
  const inventoryInput = document.getElementById('dash-modal-material-inventory');
  const statusInput = document.getElementById('dash-modal-material-status');
  const categoryInput = document.getElementById('dash-modal-material-class');
  const notesInput = document.getElementById('dash-modal-material-notes');
  const modal = document.getElementById('dash-material-modal');

  if (!modelInput || !brandInput || !inventoryInput || !statusInput || !notesInput || !modal) {
    return;
  }

  const model = modelInput.value.trim();
  const brand = brandInput.value.trim();
  const inventory = inventoryInput.value.trim();
  const status = statusInput.value;
  const category = categoryInput?.value.trim() || '';
  const notes = notesInput.value.trim();

  if (!model || !brand || !inventory || !status) {
    alert('Bitte füllen Sie alle erforderlichen Felder aus.');
    return;
  }

  const material = { model, brand, inventory, status, category, notes };
  const materials = getStoredMaterials();

  if (modal.dataset.editIndex !== undefined) {
    const index = parseInt(modal.dataset.editIndex);
    materials[index] = material;
  } else {
    materials.push(material);
  }

  saveStoredMaterials(materials);
  renderMaterialList();
  closeMaterialModal();
};

const deleteMaterialFromModal = () => {
  const modal = document.getElementById('dash-material-modal');
  if (!modal || modal.dataset.editIndex === undefined) {
    return;
  }

  const index = parseInt(modal.dataset.editIndex);
  if (!confirm('Material wirklich löschen?')) {
    return;
  }

  const materials = getStoredMaterials();
  materials.splice(index, 1);
  saveStoredMaterials(materials);
  renderMaterialList();
  closeMaterialModal();
};

const hideMaterialForm = () => {
  const form = document.getElementById('material-form');
  form.classList.add('hidden');
};

const saveMaterial = () => {
  const modelInput = document.getElementById('material-model');
  const brandInput = document.getElementById('material-brand');
  const inventoryInput = document.getElementById('material-inventory');
  const statusInput = document.getElementById('material-status');
  const notesInput = document.getElementById('material-notes');
  const form = document.getElementById('material-form');

  const model = modelInput.value.trim();
  const brand = brandInput.value.trim();
  const inventory = inventoryInput.value.trim();
  const status = statusInput.value;
  const notes = notesInput.value.trim();

  if (!model || !brand || !inventory || !status) {
    alert('Bitte füllen Sie alle erforderlichen Felder aus.');
    return;
  }

  const material = { model, brand, inventory, status, notes };
  const materials = getStoredMaterials();

  if (form.dataset.editIndex !== undefined) {
    const index = parseInt(form.dataset.editIndex);
    materials[index] = material;
  } else {
    materials.push(material);
  }

  saveStoredMaterials(materials);
  renderMaterialList();
  hideMaterialForm();
};

const deleteMaterial = (index) => {
  if (!confirm('Material wirklich löschen?')) {
    return;
  }

  const materials = getStoredMaterials();
  materials.splice(index, 1);
  saveStoredMaterials(materials);
  renderMaterialList();
};

const initMaterialList = () => {
  // Initiale Materialien hinzufügen, falls keine vorhanden sind
  const materials = getStoredMaterials();
  if (materials.length === 0) {
    const initialMaterials = [
      { model: 'Epson EB-S41', brand: 'Epson', inventory: 'PROJ-001', status: 'verfügbar', notes: 'Beamer für Präsentationen' },
      { model: 'ActivBoard Touch', brand: 'Promethean', inventory: 'WB-001', status: 'verfügbar', notes: 'Interaktives Whiteboard' },
      { model: 'MacBook Pro 16"', brand: 'Apple', inventory: 'NB-001', status: 'ausgeliehen', notes: 'Leihgerät für Events' }
    ];
    saveStoredMaterials(initialMaterials);
  }

  renderMaterialList();

  // Event Listener
  const addButton = document.getElementById('dash-add-material');
  if (addButton) {
    addButton.addEventListener('click', () => openMaterialModal());
  }

  // Event Listener für Modal
  const modal = document.getElementById('dash-material-modal');
  const modalClose = document.getElementById('dash-material-modal-close');
  const modalSave = document.getElementById('dash-material-modal-save');
  const modalDelete = document.getElementById('dash-material-modal-delete');
  const modalCancel = document.getElementById('dash-material-modal-cancel');

  if (modal) {
    // Schließe Modal beim Klick außerhalb
    modal.addEventListener('click', (event) => {
      if (event.target === modal) {
        closeMaterialModal();
      }
    });
  }

  if (modalClose) {
    modalClose.addEventListener('click', closeMaterialModal);
  }

  if (modalSave) {
    modalSave.addEventListener('click', saveMaterialFromModal);
  }

  if (modalDelete) {
    modalDelete.addEventListener('click', deleteMaterialFromModal);
  }

  if (modalCancel) {
    modalCancel.addEventListener('click', closeMaterialModal);
  }

  // Event Delegation für dynamische Tabellenzeilen
  const materialList = document.getElementById('dash-material-list');
  if (materialList) {
    materialList.addEventListener('click', (event) => {
      const row = event.target.closest('tr');
      if (!row || !row.dataset.index) return;

      const index = parseInt(row.dataset.index);
      const materials = getStoredMaterials();

      // Linksklick öffnet Bearbeitungsmodal
      if (event.button === 0) {
        openMaterialModal(materials[index], index);
      }
    });

    // Rechtsklick für Löschen
    materialList.addEventListener('contextmenu', (event) => {
      event.preventDefault();
      const row = event.target.closest('tr');
      if (!row || !row.dataset.index) return;

      const index = parseInt(row.dataset.index);
      if (confirm('Material wirklich löschen?')) {
        const materials = getStoredMaterials();
        materials.splice(index, 1);
        saveStoredMaterials(materials);
        renderMaterialList();
      }
    });
  }
};

// Initialisierung
const getCurrentSchoolName = () => {
  try {
    const direct = localStorage.getItem('eventhelper_currentSchool');
    if (direct) return String(direct);

    const raw = localStorage.getItem('eventhelper_currentUser');
    if (raw) {
      const u = JSON.parse(raw);
      if (u && u.school) return String(u.school);
    }
  } catch (e) {
    // ignore
  }
  return null;
};

// Date helpers
const formatDateDE = (iso) => {
  if (!iso) return '';
  // accept YYYY-MM-DD or full ISO
  const d = new Date(iso);
  if (Number.isNaN(d.getTime())) return iso;
  const dd = String(d.getDate()).padStart(2, '0');
  const mm = String(d.getMonth() + 1).padStart(2, '0');
  const yyyy = d.getFullYear();
  return `${dd}.${mm}.${yyyy}`;
};

const applySchoolNameToLabel = () => {
  const label = document.getElementById('school-name');
  if (!label) return;
  const name = getCurrentSchoolName();
  if (name) {
    label.textContent = name;
  } else {
    label.textContent = 'INTERR: 101';
  }
};

// Projects
const PROJECT_STORAGE_KEY = 'eventhelper_projects';

const getStoredUsers = () => {
  const raw = localStorage.getItem('eventhelper_users');
  if (!raw) return [];
  try {
    const arr = JSON.parse(raw) || [];
    const seen = new Set();
    const dedup = [];
    let changed = false;
    for (const u of arr) {
      const key = `${String(u.username || '').trim().toLowerCase()}::${String(u.schoolPin || '').trim()}`;
      if (seen.has(key)) { changed = true; continue; }
      seen.add(key);
      dedup.push(u);
    }
    if (changed) {
      try { localStorage.setItem('eventhelper_users', JSON.stringify(dedup)); } catch (e) { }
    }
    return dedup;
  } catch { return []; }
};

const getStoredSchools = () => {
  const raw = localStorage.getItem('eventhelper_schools');
  if (!raw) return [];
  try { return JSON.parse(raw) || []; } catch { return []; }
};

const getStoredProjects = () => {
  const raw = localStorage.getItem(PROJECT_STORAGE_KEY);
  if (!raw) return [];
  try { return JSON.parse(raw) || []; } catch { return []; }
};

const saveStoredProjects = (projects) => {
  localStorage.setItem(PROJECT_STORAGE_KEY, JSON.stringify(projects));
};

const generateProjectId = () => `PRJ-${Date.now()}-${Math.random().toString(36).slice(2,8)}`;

const createProjectElement = (project) => {
  const card = document.createElement('article');
  card.className = 'ticket-card';
  card.dataset.projectId = project.id;

  const title = document.createElement('h3');
  title.textContent = project.name;
  card.appendChild(title);
  const metaTop = document.createElement('p');
  metaTop.style.margin = '0 0 6px 0';
  metaTop.style.fontSize = '0.9rem';
  metaTop.style.color = 'rgba(255,255,255,0.85)';
  metaTop.innerHTML = project.date ? `<strong>Datum:</strong> ${formatDateDE(project.date)}` : '';
  card.appendChild(metaTop);

  const desc = document.createElement('p');
  desc.textContent = project.description || '';
  card.appendChild(desc);

  const meta = document.createElement('p');
  const parts = (project.participants || []).length;
  const mats = (project.materials || []).length;
  meta.innerHTML = `<strong>Teilnehmer:</strong> ${parts} • <strong>Material:</strong> ${mats}`;
  card.appendChild(meta);

  card.style.cursor = 'pointer';
  card.title = 'Klicken zum Bearbeiten';
  card.addEventListener('click', () => openProjectModal(project));

  return card;
};

const renderProjects = () => {
  const container = document.getElementById('dash-project-list');
  if (!container) return;
  const projects = getStoredProjects().slice().sort((a, b) => {
    // sort by date descending (newest first). Handle missing dates.
    const da = a.date ? new Date(a.date) : null;
    const db = b.date ? new Date(b.date) : null;
    if (da && db) return db - da;
    if (da && !db) return -1;
    if (!da && db) return 1;
    return 0;
  });
  container.innerHTML = '';
  if (projects.length === 0) {
    const empty = document.createElement('p');
    empty.textContent = 'Zurzeit sind keine Projekte vorhanden.';
    empty.style.color = '#ffffff';
    container.appendChild(empty);
    return;
  }
  projects.slice().reverse().forEach((p) => container.appendChild(createProjectElement(p)));
};

const openProjectModal = (project = null) => {
  const modal = document.getElementById('dash-project-modal');
  if (!modal) return;

  const nameInput = document.getElementById('dash-modal-project-name');
  const descInput = document.getElementById('dash-modal-project-description');
  const dateInput = document.getElementById('dash-modal-project-date');
  const notesInput = document.getElementById('dash-modal-project-notes');
  const participantsWrap = document.getElementById('dash-modal-project-participants');
  const materialsWrap = document.getElementById('dash-modal-project-materials');
  const deleteButton = document.getElementById('dash-project-modal-delete');

  if (!nameInput || !descInput || !notesInput || !participantsWrap || !materialsWrap || !dateInput) return;

  // populate participants (from stored users) — only users for current school's PIN
  const usersAll = getStoredUsers();
  const schools = getStoredSchools();
  // Prefer an explicitly stored current school PIN for unambiguous filtering
  const storedPin = localStorage.getItem('eventhelper_currentSchoolPin');
  let currentSchoolPin = storedPin ? String(storedPin).trim() : null;
  const currentSchoolName = getCurrentSchoolName();
  // If no PIN in session, try to derive from stored school name (fallback)
  if (!currentSchoolPin && currentSchoolName) {
    const s = schools.find((ss) => String(ss.name) === String(currentSchoolName));
    if (s) {
      currentSchoolPin = String(s.schulpin || '').trim();
      // normalize to 6 digits and persist for future sessions
      currentSchoolPin = currentSchoolPin.padStart(6, '0');
      try { localStorage.setItem('eventhelper_currentSchoolPin', currentSchoolPin); } catch (e) { }
    }
  }
  // normalize pin to 6 chars if present
  if (currentSchoolPin) currentSchoolPin = String(currentSchoolPin).trim().padStart(6, '0');

  let users = [];
  if (currentSchoolPin) {
    users = usersAll.filter((u) => {
      const up = String(u.schoolPin || '').trim();
      if (!up) return false;
      return up.padStart(6, '0') === currentSchoolPin;
    });
  } else if (currentSchoolName) {
    users = usersAll.filter((u) => String(u.schoolName || '').trim() === String(currentSchoolName).trim());
  } else {
    users = [];
  }

  participantsWrap.innerHTML = '';
  if (users.length === 0) {
    const note = document.createElement('p');
    note.textContent = 'Keine Teilnehmer für diese Schule gefunden.';
    note.style.color = 'rgba(255,255,255,0.7)';
    participantsWrap.appendChild(note);
    // continue, still leave wrapper with note
  }
  const seen = new Set();
  users.forEach((u) => {
    const username = String(u.username || '').trim();
    if (!username || seen.has(username)) return;
    seen.add(username);

    const item = document.createElement('div');
    item.className = 'proj-participant-item';
    item.dataset.username = username;
    item.style.display = 'inline-block';
    item.style.margin = '4px';
    item.style.padding = '6px 10px';
    item.style.borderRadius = '6px';
    item.style.border = '1px solid rgba(255,255,255,0.06)';
    item.style.cursor = 'pointer';
    item.style.userSelect = 'none';
    item.style.backgroundColor = 'transparent';
    item.textContent = `${u.firstname || ''} ${u.lastname || ''} (${username})`;
    item.addEventListener('click', () => {
      const selected = item.classList.toggle('selected');
      item.style.backgroundColor = selected ? 'rgba(42,157,143,0.15)' : 'transparent';
    });
    participantsWrap.appendChild(item);
  });

  // populate materials as clickable list (toggle background on click)
  const materials = getStoredMaterials().slice().sort((a, b) => {
    const ai = String(a.inventory || '');
    const bi = String(b.inventory || '');
    return ai.localeCompare(bi, undefined, { numeric: true, sensitivity: 'base' });
  });
  materialsWrap.innerHTML = '';
  materials.forEach((m, idx) => {
    const inventory = m.inventory || `${m.model}-${idx}`;
    const item = document.createElement('div');
    item.className = 'proj-material-item';
    item.dataset.inventory = inventory;
    item.style.padding = '6px 8px';
    item.style.margin = '4px 0';
    item.style.borderRadius = '6px';
    item.style.border = '1px solid rgba(255,255,255,0.04)';
    item.style.cursor = 'pointer';
    item.style.userSelect = 'none';
    item.style.backgroundColor = 'transparent';
    item.textContent = `${m.model} • ${m.brand} (${inventory})`;
    item.addEventListener('click', () => {
      const selected = item.classList.toggle('selected');
      item.style.backgroundColor = selected ? 'rgba(230, 126, 34, 0.12)' : 'transparent';
    });
    materialsWrap.appendChild(item);
  });

  if (project) {
    nameInput.value = project.name || '';
    // set date value (expect YYYY-MM-DD)
    if (project.date) {
      try { dateInput.value = project.date; } catch (e) { dateInput.value = ''; }
    } else {
      dateInput.value = '';
    }
    descInput.value = project.description || '';
    notesInput.value = project.notes || '';
    modal.dataset.projectId = project.id;
    // check checkboxes
    const partSet = new Set(project.participants || []);
    Array.from(participantsWrap.querySelectorAll('.proj-participant-item')).forEach((el) => {
      if (partSet.has(el.dataset.username)) {
        el.classList.add('selected');
        el.style.backgroundColor = 'rgba(42,157,143,0.15)';
      }
    });
    const matSet = new Set(project.materials || []);
    Array.from(materialsWrap.querySelectorAll('.proj-material-item')).forEach((el) => {
      if (matSet.has(el.dataset.inventory)) {
        el.classList.add('selected');
        el.style.backgroundColor = 'rgba(230, 126, 34, 0.12)';
      }
    });
    if (deleteButton) deleteButton.style.display = 'inline-block';
  } else {
    nameInput.value = '';
    // default date to today
    const today = new Date();
    const yyyy = today.getFullYear();
    const mm = String(today.getMonth() + 1).padStart(2, '0');
    const dd = String(today.getDate()).padStart(2, '0');
    dateInput.value = `${yyyy}-${mm}-${dd}`;
    descInput.value = '';
    notesInput.value = '';
    delete modal.dataset.projectId;
    if (deleteButton) deleteButton.style.display = 'none';
  }

  modal.classList.remove('hidden');
  modal.setAttribute('aria-hidden', 'false');
};

const closeProjectModal = () => {
  const modal = document.getElementById('dash-project-modal');
  if (!modal) return;
  modal.classList.add('hidden');
  modal.setAttribute('aria-hidden', 'true');
};

const saveProjectFromModal = () => {
  const modal = document.getElementById('dash-project-modal');
  const nameInput = document.getElementById('dash-modal-project-name');
  const dateInput = document.getElementById('dash-modal-project-date');
  const descInput = document.getElementById('dash-modal-project-description');
  const notesInput = document.getElementById('dash-modal-project-notes');
  const participantsWrap = document.getElementById('dash-modal-project-participants');
  const materialsWrap = document.getElementById('dash-modal-project-materials');
  if (!modal || !nameInput || !participantsWrap || !materialsWrap) return;

  const name = nameInput.value.trim();
  if (!name) { alert('Bitte einen Projektnamen eingeben.'); return; }

  const participants = Array.from(participantsWrap.querySelectorAll('.proj-participant-item.selected')).map(el => el.dataset.username);
  const materials = Array.from(materialsWrap.querySelectorAll('.proj-material-item.selected')).map(el => el.dataset.inventory);

  const projects = getStoredProjects();

  if (modal.dataset.projectId) {
    const idx = projects.findIndex(p => p.id === modal.dataset.projectId);
    if (idx !== -1) {
      projects[idx] = {
        ...projects[idx],
        name,
        date: (dateInput && dateInput.value) ? dateInput.value : projects[idx].date || '',
        description: descInput.value.trim(),
        notes: notesInput.value.trim(),
        participants,
        materials,
        updatedAt: new Date().toISOString(),
      };
    }
  } else {
    const project = {
      id: generateProjectId(),
      name,
      date: (dateInput && dateInput.value) ? dateInput.value : '',
      description: descInput.value.trim(),
      notes: notesInput.value.trim(),
      participants,
      materials,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    };
    projects.push(project);
  }

  saveStoredProjects(projects);
  renderProjects();
  closeProjectModal();
};

const deleteProjectFromModal = () => {
  const modal = document.getElementById('dash-project-modal');
  if (!modal || !modal.dataset.projectId) return;
  if (!confirm('Projekt wirklich löschen?')) return;
  const projects = getStoredProjects();
  const remaining = projects.filter(p => p.id !== modal.dataset.projectId);
  saveStoredProjects(remaining);
  renderProjects();
  closeProjectModal();
};

const initProjectList = () => {
  renderProjects();
  const newBtn = document.getElementById('dash-new-project');
  if (newBtn) newBtn.addEventListener('click', () => openProjectModal(null));

  const modal = document.getElementById('dash-project-modal');
  if (!modal) return;
  const modalClose = document.getElementById('dash-project-modal-close');
  const modalSave = document.getElementById('dash-project-modal-save');
  const modalDelete = document.getElementById('dash-project-modal-delete');
  const modalCancel = document.getElementById('dash-project-modal-cancel');

  if (modalClose) modalClose.addEventListener('click', closeProjectModal);
  if (modalSave) modalSave.addEventListener('click', saveProjectFromModal);
  if (modalDelete) modalDelete.addEventListener('click', deleteProjectFromModal);
  if (modalCancel) modalCancel.addEventListener('click', closeProjectModal);

  modal.addEventListener('click', (event) => { if (event.target === modal) closeProjectModal(); });
};

// Logout
const handleLogout = () => {
  try {
    localStorage.removeItem('eventhelper_currentUser');
    localStorage.removeItem('eventhelper_currentSchool');
    localStorage.removeItem('eventhelper_currentSchoolPin');
  } catch (e) {
    // ignore
  }
  window.location.href = '../login/login.html';
};

document.addEventListener('DOMContentLoaded', () => {
  applySchoolNameToLabel();
  initMaterialList();
  initProjectList();
  const logoutBtn = document.getElementById('dash-logout');
  if (logoutBtn) {
    logoutBtn.addEventListener('click', () => {
      if (confirm('Wirklich ausloggen?')) handleLogout();
    });
  }
});