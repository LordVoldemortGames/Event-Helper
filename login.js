// den username erstellen
const input1 = document.getElementById("firstname-register");
const input2 = document.getElementById("lastname-register");
const label = document.getElementById("username-display");

const updateLabel = () => {
    const first = input1.value.trim();
    const last = input2.value.trim();

    if (first.length > 0 && last.length > 0) {
        // Erster Buchstabe von firstname + lastname (alles klein)
        const result = first.charAt(0).toLowerCase() + last.toLowerCase();
        
        // Den Text in das Label schreiben
        document.getElementById("username-display").textContent = result;
    } else {
        document.getElementById("username-display").textContent = ""; // Leer machen, wenn Felder leer sind
    }
};

input1.addEventListener('input', updateLabel);
input2.addEventListener('input', updateLabel);

// SchulPin auf 6 Zeichen begrenzen
const schoolpinInput = document.getElementById("schoolpin-register");
schoolpinInput.addEventListener('input', () => {
    if (schoolpinInput.value.length > 6) {
        schoolpinInput.value = schoolpinInput.value.slice(0, 6);
    }
});


