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

    if (username === 'admin' && password === 'sternbus8') {
        redirectToDashboard();
    } else {
        showWarning('INTERR 201: Benutzername oder Passwort falsch.');
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
};

if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', initLogin);
} else {
    initLogin();
}


