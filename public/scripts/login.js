/**
 * LOGIN.JS - Gestione del processo di autenticazione
 * 
 * Questo file gestisce il processo di login degli utenti, includendo:
 * - Validazione dei dati inseriti
 * - Invio della richiesta di autenticazione al server
 * - Gestione delle risposte e messaggi di feedback
 * - Memorizzazione dei dati utente nel localStorage
 */

// ============================================================================
// FUNZIONI PRINCIPALI
// ============================================================================

/**
 * Gestisce il processo di login dell'utente
 * 
 * Valida i dati inseriti e invia una richiesta POST al server per l'autenticazione.
 * Se il login ha successo, memorizza le informazioni utente nel localStorage
 * e mostra un messaggio di successo; altrimenti mostra un messaggio di errore.
 */
function login() {
    // Validazione preliminare del form
    if (!validateForm()) {
        return;
    }

    // Raccolta dei dati dal form
    const usernameOrEmail = document.getElementById('usernameOrEmail');
    const password = document.getElementById('password');
    
    const data = {
        email: usernameOrEmail.value,
        username: usernameOrEmail.value,
        password: password.value
    };

    // Preparazione del contenitore per i messaggi
    const container = document.getElementsByClassName('resultContainer')[0];
    container.innerHTML = '';

    // Invio della richiesta POST al server
    fetch("/login", {
        method: "POST",
        headers: {
            "Content-Type": "application/json"
        },
        body: JSON.stringify(data)
    }).then(response => {
        if (response.ok) {
            // Login riuscito
            response.json().then(responseData => {
                // Messaggio di successo
                container.innerHTML += `
                    <div class="alert alert-success" role="alert" aria-hidden="true">
                        <h4 class="alert-heading">Accesso effettuato con successo!</h4>
                    </div>`;

                // Memorizzazione dei dati utente nel localStorage
                localStorage.setItem("_id", responseData._id);
                localStorage.setItem("email", responseData.email);
                localStorage.setItem("username", responseData.username);
                localStorage.setItem("name", responseData.name);
                localStorage.setItem("credits", responseData.credits);

                // Reindirizzamento alla homepage dopo 1 secondo
                setTimeout(() => {
                    window.location.href = '/';
                }, 1000);
            });
        } else {
            // Login fallito
            container.innerHTML += `
                <div class="alert alert-danger" role="alert" aria-hidden="true">
                    <h4 class="alert-heading">Accesso fallito! Verifica le tue credenziali</h4>
                </div>`;
        }
    });
}
// ============================================================================
// VALIDAZIONE
// ============================================================================

/**
 * Valida i dati inseriti dall'utente per il login
 * 
 * Recupera i dati inseriti per username/email e password, li valida
 * e restituisce true se i dati sono validi e il form può essere inviato.
 * Se i dati non sono validi, aggiunge classi di errore agli elementi
 * di input e mostra un messaggio di errore.
 * 
 * @returns {boolean} true se i dati sono validi e il form può essere inviato, false altrimenti
 */
function validateForm() {
    const usernameOrEmail = document.getElementById('usernameOrEmail');
    const password = document.getElementById('password');

    // Rimozione delle classi di errore precedenti
    usernameOrEmail.classList.remove('border', 'border-danger');
    password.classList.remove('border', 'border-danger');

    // Validazione email con regex
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    const isValidEmail = emailRegex.test(usernameOrEmail.value);

    // Validazione username/email
    if (!isValidEmail && (
        !usernameOrEmail.value ||
        usernameOrEmail.value.length < 4 ||
        usernameOrEmail.value.length > 16
    )) {
        usernameOrEmail.classList.add('border', 'border-danger');
        alert("Username/Email non valido!");
        return false;
    }

    // Validazione password
    if (!password.value || password.value.length < 7) {
        password.classList.add('border', 'border-danger');
        alert("La password deve contenere almeno 7 caratteri!");
        return false;
    }

    return true;
}

