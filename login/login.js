// den username erstellen
const input1 = document.getElementById("register-firstname");
const input2 = document.getElementById("register-lastname");
const usernameLabel = document.getElementById("register-username");

const updateLabel = () => {
    const first = input1?.value.trim() || '';
    const last = input2?.value.trim() || '';

    if (first.length > 0 && last.length > 0) {
        const result = first.charAt(0).toLowerCase() + last.toLowerCase();
        if (usernameLabel) {
            usernameLabel.textContent = result;
        }
    } else if (usernameLabel) {
        usernameLabel.textContent = "";
    }
};

input1?.addEventListener('input', updateLabel);
input2?.addEventListener('input', updateLabel);

// SchulPin auf 6 Zeichen begrenzen
const schoolpinInput = document.getElementById("register-schoolpin");
if (schoolpinInput) {
    schoolpinInput.addEventListener('input', () => {
        if (schoolpinInput.value.length > 6) {
            schoolpinInput.value = schoolpinInput.value.slice(0, 6);
        }
    });
}

// Warnung für Login-Probleme
const passwordLoginInput = document.getElementById("login-password");
const passwordRegisterInput = document.getElementById("register-password");
const warnLabel = document.getElementById("warn-login");

const updateWarnings = (event) => {
    const warnings = [];

    // Caps Lock erkennen
    if (event.getModifierState && event.getModifierState('CapsLock')) {
        warnings.push("! CapsLock ist aktiviert!");
    }

    // Warnung anzeigen oder verstecken
    if (warnings.length > 0) {
        warnLabel.textContent = warnings.join(" ");
        warnLabel.style.display = "block";
    } else {
        warnLabel.textContent = "";
        warnLabel.style.display = "none";
    }
};

// Event Listener auf ganzer Seite
document.addEventListener('keydown', updateWarnings);
document.addEventListener('keyup', updateWarnings);

// Login-Validierung für admin/sternbus8 und Weiterleitung zu admindash.html
const redirectToDashboard = () => {
    window.open('../administration/admindash.html', '_blank');
};

const showWarning = (message) => {
    const warnLabel = document.getElementById('warn-login');
    if (warnLabel) {
        warnLabel.textContent = message;
        warnLabel.style.display = 'block';
    } else {
        console.warn('warn-login Label nicht gefunden:', message);
    }
};

const clearWarning = () => {
    const warnLabel = document.getElementById('warn-login');
    if (warnLabel) {
        warnLabel.textContent = '';
        warnLabel.style.display = 'none';
    }
};

const handleLogin = (usernameInput, passwordInput) => {
    if (!usernameInput || !passwordInput) {
        console.warn('Loginfelder nicht gefunden.');
        return;
    }

    const username = usernameInput.value.trim();
    const password = passwordInput.value.trim();

    // Admin shortcut
    if (username === 'admin' && password === 'sternbus8') {
        // mark current user
        localStorage.setItem('eventhelper_currentUser', JSON.stringify({ username: 'admin', role: 'admin' }));
        redirectToDashboard();
        return;
    }

    // Try to match stored users
    const raw = localStorage.getItem('eventhelper_users');
    let users = [];
    try {
        users = raw ? JSON.parse(raw) || [] : [];
    } catch {
        users = [];
    }

    const usernameNorm = username.toLowerCase();
    const found = users.find((u) => String(u.username).toLowerCase() === usernameNorm && String(u.password).trim() === password);
    if (found) {
        localStorage.setItem('eventhelper_currentUser', JSON.stringify({ username: found.username, school: found.schoolName, role: 'student' }));
        // store current school name and pin separately for convenience
        if (found.schoolName) {
            localStorage.setItem('eventhelper_currentSchool', found.schoolName);
        }
        if (found.schoolPin) {
            localStorage.setItem('eventhelper_currentSchoolPin', String(found.schoolPin));
        }
        // go to student dashboard
        window.location.href = '../dashboard/dashboard.html';
    } else {
        showWarning('INTERR 201: Benutzername oder Passwort falsch.');
    }
};

// Helpers for registration/storage
const getStoredSchools = () => {
    const raw = localStorage.getItem('eventhelper_schools');
    if (!raw) return [];
    try { return JSON.parse(raw) || []; } catch { return []; }
};

const getStoredUsers = () => {
    const raw = localStorage.getItem('eventhelper_users');
    if (!raw) return [];
    try {
        const arr = JSON.parse(raw) || [];
        // dedupe by username + schoolPin (keep first)
        const seen = new Set();
        const dedup = [];
        let changed = false;
        for (const u of arr) {
            const key = `${String(u.username || '').trim().toLowerCase()}::${String(u.schoolPin || '').trim()}`;
            if (seen.has(key)) {
                changed = true;
                continue;
            }
            seen.add(key);
            dedup.push(u);
        }
        if (changed) {
            try { localStorage.setItem('eventhelper_users', JSON.stringify(dedup)); } catch (e) { /* ignore */ }
        }
        return dedup;
    } catch {
        return [];
    }
};

const saveStoredUsers = (users) => {
    localStorage.setItem('eventhelper_users', JSON.stringify(users));
};

const handleRegister = () => {
    const first = input1?.value.trim() || '';
    const last = input2?.value.trim() || '';
    const password = passwordRegisterInput?.value.trim() || '';
    const rawPin = schoolpinInput?.value || '';
    const pin = String(rawPin).trim();

    if (!first || !last || !password || !pin) {
        showWarning('Bitte alle Registrierungsfelder ausfüllen.');
        return;
    }

    // normalize PIN to 6-digit string (preserve leading zeros)
    const normPin = pin.padStart(6, '0');

    if (!/^\d{6}$/.test(normPin)) {
        showWarning('Die SchulPIN muss genau 6 Ziffern sein.');
        return;
    }
    const schools = getStoredSchools();
    const school = schools.find((s) => String(s.schulpin) === normPin);
    if (!school) {
        showWarning('Keine Schule mit dieser PIN gefunden.');
        return;
    }

    const username = (first.charAt(0) || '').toLowerCase() + last.toLowerCase();

    const users = getStoredUsers();
    // prevent duplicate username for same school
    const exists = users.some((u) => u.username === username && String(u.schoolPin) === normPin);
    if (exists) {
        showWarning('Benutzername bereits vorhanden. Bitte wähle einen anderen Namen.');
        return;
    }

    const newUser = {
        username,
        password,
        firstname: first,
        lastname: last,
        schoolPin: normPin,
        schoolName: school.name,
        createdAt: new Date().toISOString(),
    };

    users.push(newUser);
    saveStoredUsers(users);

    // auto-fill login fields and perform login
    const loginUsernameInput = document.getElementById('login-username');
    const loginPasswordInput = document.getElementById('login-password');
    if (loginUsernameInput && loginPasswordInput) {
        loginUsernameInput.value = username;
        loginPasswordInput.value = password;
        // small timeout to ensure UI updated
        setTimeout(() => handleLogin(loginUsernameInput, loginPasswordInput), 100);
    } else {
        // fallback: just store as current user and redirect
        localStorage.setItem('eventhelper_currentUser', JSON.stringify({ username, school: school.name, role: 'student' }));
        localStorage.setItem('eventhelper_currentSchool', school.name);
        localStorage.setItem('eventhelper_currentSchoolPin', String(normPin));
        window.location.href = '../dashboard/dashboard.html';
    }
};

const initLogin = () => {
    clearWarning();

    const usernameInput = document.getElementById('login-username');
    const passwordInput = document.getElementById('login-password');
    const loginButton = document.getElementById('login-button');

    const triggerLoginClick = (event) => {
        if (event.key === 'Enter') {
            event.preventDefault();
            if (loginButton) {
                loginButton.click();
            } else {
                handleLogin(usernameInput, passwordInput);
            }
        }
    };

    if (loginButton) {
        loginButton.addEventListener('click', (event) => {
            event.preventDefault();
            handleLogin(usernameInput, passwordInput);
        });
    }

    if (usernameInput) {
        usernameInput.addEventListener('keydown', triggerLoginClick);
    }

    if (passwordInput) {
        passwordInput.addEventListener('keydown', triggerLoginClick);
    }

    const registerButton = document.getElementById('register-button');
    if (registerButton) {
        registerButton.addEventListener('click', (event) => {
            event.preventDefault();
            handleRegister();
        });
    }

    const registerUsernameLabel = document.getElementById('register-username');
    if (registerUsernameLabel) {
        registerUsernameLabel.style.cursor = 'pointer';
        registerUsernameLabel.title = 'Klicken um Registrierung auszulösen';
        registerUsernameLabel.addEventListener('click', (event) => {
            event.preventDefault();
            handleRegister();
        });
    }

    const registerInputs = [
        document.getElementById('register-firstname'),
        document.getElementById('register-lastname'),
        document.getElementById('register-password'),
        document.getElementById('register-schoolpin'),
    ];

    registerInputs.forEach((inp) => {
        if (inp) {
            inp.addEventListener('keydown', (e) => {
                if (e.key === 'Enter') {
                    e.preventDefault();
                    handleRegister();
                }
            });
        }
    });
};

if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', initLogin);
} else {
    initLogin();
}

