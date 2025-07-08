/**
 * NAVBAR.JS - Gestione della barra di navigazione
 * 
 * Questo file gestisce la creazione dinamica della barra di navigazione
 * e l'autenticazione dell'utente. Include funzioni per:
 * - Stampa della navbar con elementi dinamici
 * - Controllo dello stato di login
 * - Gestione del logout
 * - Aggiornamento dei crediti
 */

// ============================================================================
// FUNZIONI PRINCIPALI
// ============================================================================

/**
 * Stampa la barra di navigazione completa
 * Crea dinamicamente la navbar in base allo stato di login dell'utente
 */
async function printNavBar() {
    const basePath = '../images/';
    const logoIcon = `${basePath}logo.png`;
    const navbarContainer = document.getElementById('menu');
    let HTML_code;

    // Costruzione della struttura base della navbar
    HTML_code = `
        <nav class="navbar navbar-expand-lg">
        <div class="container-fluid px-2" id="NavigationBar">
            <!-- Pulsante hamburger per dispositivi mobili -->
                <button class="navbar-toggler" type="button" data-bs-toggle="collapse" data-bs-target="#navbarNav" aria-controls="navbarNav" aria-expanded="false" aria-label="Toggle navigation">
                    <span class="navbar-toggler-icon"></span>
                </button>
            <!-- Link di navigazione -->
                <div class="collapse navbar-collapse" id="navbarNav">
                    <ul class="navbar-nav">
                            <li class="nav-item ">
                                <a class="nav-link border-link" href="/card">Trova supereroe</a>
                            </li>`;

    // Aggiunta elementi specifici per utenti loggati
    if (checkUserLogged()) {
        HTML_code += `
                        <li class="nav-item">
                            <a class="nav-link border-link" href="/album">Album</a>
                        </li>
                        <li class="nav-item">
                            <a class="nav-link border-link" href="/exchange">Scambi</a>
                        </li>
                        <li class="nav-item">
                            <a class="nav-link border-link" href="/package">Pacchetti</a>
                        </li>
                        <li class="nav-item">
                            <a class="nav-link border-link " href="/get-credits"> Crediti:<span class="current_credits"> ${await get_credits()}</span></a>
                        </li>
                        <li class="nav-item dropdown">
                            <a class="nav-link dropdown-toggle" href="#" id="userdropdown" role="button" data-bs-toggle="dropdown"> <i alt="icona utente" class="fas fa-user" ></i> ${localStorage.getItem("name")}</a> 
                                <ul class="dropdown-menu">
                                    <li><a class="dropdown-item" href="/user"> <i class= "fas fa-address-card"></i> Profilo utente</a></li>
                                    <li><a class="dropdown-item" role="button" onclick=logout()><i class= "fas fa-right-from-bracket"></i> Logout</a></li>
                                </ul>
                        </li>`;
    } else {
        // Elementi per utenti non loggati
        HTML_code += `
                        <li class="nav-item">
                            <a id="login_Link" data-bs-toggle="modal" data-bs-target="#loginModal" class= "nav-link">Accedi</a>
                        </li>`;
        
        try {
            const response = await fetch('/login');
            const text = await response.text();
            HTML_code += text;
        } catch (error) {
            console.error('Errore nel caricamento del modal di login:', error);
        }
    }

    // Chiusura dei tag HTML
    HTML_code += `
                    </ul>
                </div>
            </div>
        </nav>`;

    navbarContainer.innerHTML = HTML_code;
    setFixedNavbarTheme();
}



// ============================================================================
// GESTIONE AUTENTICAZIONE
// ============================================================================

/**
 * Controlla se l'utente è loggato e reindirizza se necessario
 * 
 * Verifica se le credenziali utente sono memorizzate nel localStorage.
 * Se l'utente è loggato ma si trova in una pagina che richiede login,
 * viene reindirizzato alla homepage.
 * 
 * @returns {boolean} true se l'utente è loggato, false altrimenti
 */
function checkUserLogged() {
    const id = localStorage.getItem("_id");
    const email = localStorage.getItem("email");
    const username = localStorage.getItem("username");
    
    if (email && username && id) {
        return true;
    } else {
        // Reindirizzamento se l'utente non è loggato e si trova in una pagina protetta
        const protectedPages = ['/album', '/get-credits', '/package', '/exchange', '/user', '/sell_cards', '/create_exchanges'];
        if (protectedPages.includes(window.location.pathname)) {
            window.location.href = '/';
        }
        return false;
    }
}

/**
 * Effettua il logout dell'utente
 * Cancella tutti i dati dal localStorage e reindirizza alla homepage
 */
function logout() {
    localStorage.clear();
    window.location.href = '/';
}

// ============================================================================
// GESTIONE CREDITI
// ============================================================================

/**
 * Aggiorna i crediti visualizzati nella navbar
 * Recupera i crediti correnti e aggiorna tutti gli elementi con classe 'current_credits'
 */
async function printCredits() {
    const elements = document.getElementsByClassName('current_credits');
    const credits = await get_credits();
    
    Array.from(elements).forEach(element => {
        element.textContent = credits;
    });
}

/**
 * Recupera i crediti dell'utente dal server
 * 
 * @returns {Promise<string>} Il numero di crediti dell'utente
 */
async function get_credits() {
    return await fetch(`/print-credits/${localStorage.getItem("username")}`, {
        method: 'GET',
        headers: {
            'Accept': 'application/json',
            'Content-Type': 'application/json',
        },
    })
    .then(response => response.json())
    .then(response => response.credits);
}

// ============================================================================
// FUNZIONI DI SUPPORTO
// ============================================================================

/**
 * Carica il contenuto HTML del modal di login
 */
async function loadHTML() {
    fetch('/login')
        .then(response => response.text())
        .then(data => {
            htmlContent = data;
        });
}

// ============================================================================
// INIZIALIZZAZIONE
// ============================================================================

// Inizializzazione della navbar per tutte le pagine tranne /user
if (!['/user'].includes(window.location.pathname)) {
    // Attende il caricamento completo del DOM
    window.addEventListener('load', () => {
        printNavBar().catch(error => {
            console.error("Errore nel caricamento della navbar:", error);
        });
    });
}