const TICKET_STORAGE_KEY = 'eventhelper_new_tickets';

const getStoredTickets = () => {
  const raw = localStorage.getItem(TICKET_STORAGE_KEY);
  if (!raw) {
    return [];
  }

  try {
    return JSON.parse(raw) || [];
  } catch {
    return [];
  }
};

const saveStoredTickets = (tickets) => {
  localStorage.setItem(TICKET_STORAGE_KEY, JSON.stringify(tickets));
};

const TICKET_COUNTER_KEY = 'eventhelper_ticket_counter';

const getTicketCounter = () => {
  const raw = localStorage.getItem(TICKET_COUNTER_KEY);
  const counter = Number(raw);
  if (Number.isInteger(counter) && counter >= 0) {
    return counter;
  }

  const tickets = getStoredTickets();
  const fallback = tickets.reduce((max, item) => {
    const match = item.ticketNumber?.match(/^TKT-(\d+)$/);
    if (match) {
      const value = Number(match[1]);
      return value > max ? value : max;
    }
    return max;
  }, 0);

  setTicketCounter(fallback);
  return fallback;
};

const setTicketCounter = (value) => {
  localStorage.setItem(TICKET_COUNTER_KEY, String(value));
};

const createTicketNumber = () => {
  const counter = getTicketCounter() + 1;
  setTicketCounter(counter);
  return `TKT-${String(counter).padStart(4, '0')}`;
};

const clearInfoForm = () => {
  const schoolName = document.getElementById('help-school-name');
  const contactInfo = document.getElementById('help-contact-info');
  const message = document.getElementById('help-message');

  if (schoolName) schoolName.value = '';
  if (contactInfo) contactInfo.value = '';
  if (message) message.value = '';
};

const createStatusLabel = () => {
  const formSection = document.querySelector('#help-new-ticket')?.closest('section');
  if (!formSection) {
    return null;
  }

  const label = document.createElement('div');
  label.id = 'ticket-status';
  label.className = 'warn';
  label.style.display = 'none';
  label.style.marginTop = '1rem';
  formSection.appendChild(label);
  return label;
};

const getStatusLabel = () => {
  let label = document.getElementById('ticket-status');
  if (!label) {
    label = createStatusLabel();
  }
  return label;
};

const showTicketStatus = (text, type = 'success') => {
  const label = getStatusLabel();
  if (!label) {
    alert(text);
    return;
  }

  label.textContent = text;
  label.style.display = 'block';
  label.style.color = type === 'error' ? '#ff6b6b' : '#adff2f';
};

const updateTicketCounterDisplay = () => {
  const display = document.getElementById('ticket-counter-value');
  if (!display) {
    return;
  }

  const counter = getTicketCounter();
  display.textContent = `#${String(counter).padStart(4, '0')}`;
};

const resetTicketCounter = () => {
  if (!confirm('Ticketzähler wirklich zurücksetzen? Alle neuen Tickets erhalten danach wieder von vorn laufende Nummern.')) {
    return;
  }

  setTicketCounter(0);
  updateTicketCounterDisplay();
  showTicketStatus('Ticketzähler wurde zurückgesetzt.', 'success');
};

const promptForTicket = (label, defaultValue = '') => {
  const value = prompt(label, defaultValue);
  return value ? value.trim() : '';
};

const handleAdminNewTicket = () => {
  const schoolName = promptForTicket('Schulname für das neue Ticket eingeben:');
  if (!schoolName) {
    showTicketStatus('Ticket-Erstellung abgebrochen: Kein Schulname.', 'error');
    return;
  }

  const contactInfo = promptForTicket('Kontaktinformation (E-Mail oder Telefon) eingeben:');
  if (!contactInfo) {
    showTicketStatus('Ticket-Erstellung abgebrochen: Keine Kontaktinformation.', 'error');
    return;
  }

  const message = promptForTicket('Nachricht oder Kommentar (optional):');
  const urgency = promptForTicket('Dringlichkeit (niedrig, normal, hoch):', 'normal').toLowerCase();
  const validUrgency = ['niedrig', 'normal', 'hoch'].includes(urgency) ? urgency : 'normal';

  const ticket = {
    ticketNumber: createTicketNumber(),
    schoolName,
    contactInfo,
    message,
    createdAt: new Date().toISOString(),
    status: 'offen',
    urgency: validUrgency,
    source: 'Adminboard',
    note: '',
  };

  const tickets = getStoredTickets();
  tickets.push(ticket);
  saveStoredTickets(tickets);
  updateTicketCounterDisplay();
  showTicketStatus(`Admin-Ticket ${ticket.ticketNumber} erstellt.`, 'success');
  window.dispatchEvent(new Event('ticket-created'));
};


const buildTicketElement = (ticket) => {
  const card = document.createElement('article');
  card.className = 'ticket-card';
  card.dataset.ticketNumber = ticket.ticketNumber;

  const title = document.createElement('h3');
  title.textContent = `Ticket ${ticket.ticketNumber}`;
  card.appendChild(title);

  const school = document.createElement('p');
  school.innerHTML = `<strong>Schulname:</strong> ${ticket.schoolName}`;
  card.appendChild(school);

  const contact = document.createElement('p');
  contact.innerHTML = `<strong>Kontakt:</strong> ${ticket.contactInfo}`;
  card.appendChild(contact);

  const meta = document.createElement('div');
  meta.className = 'ticket-meta';
  meta.innerHTML = `
    <span class="ticket-badge">Status: ${ticket.status}</span>
    <span class="ticket-badge">Dringlichkeit: ${ticket.urgency}</span>
    <span class="ticket-badge">Quelle: ${ticket.source}</span>
  `;
  card.appendChild(meta);

  card.addEventListener('click', () => openTicketModal(ticket.ticketNumber));
  return card;
};

const renderTicketList = () => {
  const container = document.getElementById('ticket-list');
  if (!container) {
    return;
  }

  const tickets = getStoredTickets();
  container.innerHTML = '';

  if (tickets.length === 0) {
    const empty = document.createElement('p');
    empty.textContent = 'Zurzeit gibt es keine neuen Anfragen.';
    empty.style.color = '#ffffff';
    container.appendChild(empty);
    return;
  }

  tickets.slice().reverse().forEach((ticket) => {
    container.appendChild(buildTicketElement(ticket));
  });
};

const openTicketModal = (ticketNumber) => {
  const tickets = getStoredTickets();
  const ticket = tickets.find((item) => item.ticketNumber === ticketNumber);
  const modal = document.getElementById('ticket-detail-modal');
  if (!ticket || !modal) {
    return;
  }

  modal.classList.remove('hidden');
  modal.setAttribute('aria-hidden', 'false');

  document.getElementById('modal-ticket-number').textContent = `Ticket ${ticket.ticketNumber}`;
  document.getElementById('modal-school-name').value = ticket.schoolName;
  document.getElementById('modal-contact-info').value = ticket.contactInfo;
  document.getElementById('modal-created-at').value = new Date(ticket.createdAt).toLocaleString('de-DE');
  document.getElementById('modal-source').value = ticket.source;
  document.getElementById('modal-message').value = ticket.message || '';
  document.getElementById('modal-status').value = ticket.status;
  document.getElementById('modal-urgency').value = ticket.urgency;
  document.getElementById('modal-note').value = ticket.note || '';
  document.getElementById('ticket-save').dataset.ticketNumber = ticket.ticketNumber;
  document.getElementById('ticket-delete').dataset.ticketNumber = ticket.ticketNumber;
};

const closeTicketModal = () => {
  const modal = document.getElementById('ticket-detail-modal');
  if (!modal) {
    return;
  }

  modal.classList.add('hidden');
  modal.setAttribute('aria-hidden', 'true');
};

const updateTicketFromModal = () => {
  const ticketNumber = document.getElementById('ticket-save').dataset.ticketNumber;
  const tickets = getStoredTickets();
  const index = tickets.findIndex((item) => item.ticketNumber === ticketNumber);
  if (index === -1) {
    return;
  }

  const status = document.getElementById('modal-status').value;
  const urgency = document.getElementById('modal-urgency').value;
  const note = document.getElementById('modal-note').value.trim();

  if (status === 'geschlossen') {
    tickets.splice(index, 1);
    saveStoredTickets(tickets);
    closeTicketModal();
    renderTicketList();
    return;
  }

  tickets[index].status = status;
  tickets[index].urgency = urgency;
  tickets[index].note = note;
  tickets[index].lastUpdated = new Date().toISOString();
  saveStoredTickets(tickets);
  closeTicketModal();
  renderTicketList();
};

const deleteTicketFromModal = () => {
  const ticketNumber = document.getElementById('ticket-delete').dataset.ticketNumber;
  const tickets = getStoredTickets();
  const filtered = tickets.filter((item) => item.ticketNumber !== ticketNumber);
  saveStoredTickets(filtered);
  closeTicketModal();
  renderTicketList();
};

const handleNewTicket = () => {
  const schoolName = document.getElementById('help-school-name')?.value.trim();
  const contactInfo = document.getElementById('help-contact-info')?.value.trim();
  const message = document.getElementById('help-message')?.value.trim();

  if (!schoolName || !contactInfo) {
    showTicketStatus('Bitte fülle Schulname und Kontaktinformation aus.', 'error');
    return;
  }

  const ticket = {
    ticketNumber: createTicketNumber(),
    schoolName,
    contactInfo,
    message,
    createdAt: new Date().toISOString(),
    status: 'offen',
    urgency: 'normal',
    source: 'Hilfeseite',
    note: '',
  };

  const tickets = getStoredTickets();
  tickets.push(ticket);
  saveStoredTickets(tickets);
  showTicketStatus(`Ticket ${ticket.ticketNumber} wurde erstellt.`, 'success');
  clearInfoForm();
  window.dispatchEvent(new Event('ticket-created'));
};

const initInfoPage = () => {
  const ticketButton = document.getElementById('help-new-ticket');
  if (!ticketButton) {
    return;
  }

  ticketButton.addEventListener('click', handleNewTicket);
};

const initAdminPage = () => {
  const list = document.getElementById('ticket-list');
  if (!list) {
    return;
  }

  renderTicketList();
  updateTicketCounterDisplay();

  const adminNewButton = document.getElementById('new-ticket-admin');
  const resetCounterButton = document.getElementById('reset-ticket-counter');

  if (adminNewButton) {
    adminNewButton.addEventListener('click', handleAdminNewTicket);
  }

  if (resetCounterButton) {
    resetCounterButton.addEventListener('click', resetTicketCounter);
  }

  window.addEventListener('storage', (event) => {
    if (event.key === TICKET_STORAGE_KEY || event.key === TICKET_COUNTER_KEY) {
      renderTicketList();
      updateTicketCounterDisplay();
    }
  });

  window.addEventListener('ticket-created', () => {
    renderTicketList();
    updateTicketCounterDisplay();
  });

  const closeButton = document.getElementById('ticket-modal-close');
  const modal = document.getElementById('ticket-detail-modal');
  const saveButton = document.getElementById('ticket-save');
  const deleteButton = document.getElementById('ticket-delete');

  if (closeButton) {
    closeButton.addEventListener('click', closeTicketModal);
  }

  if (modal) {
    modal.addEventListener('click', (event) => {
      if (event.target === modal) {
        closeTicketModal();
      }
    });
  }

  if (saveButton) {
    saveButton.addEventListener('click', updateTicketFromModal);
  }

  if (deleteButton) {
    deleteButton.addEventListener('click', deleteTicketFromModal);
  }

  document.addEventListener('keydown', (event) => {
    if (event.key === 'Escape') {
      closeTicketModal();
    }
  });
};

if (document.readyState === 'loading') {
  document.addEventListener('DOMContentLoaded', () => {
    initInfoPage();
    initAdminPage();
  });
} else {
  initInfoPage();
  initAdminPage();
}