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

  const materials = getStoredMaterials();
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
document.addEventListener('DOMContentLoaded', initMaterialList);