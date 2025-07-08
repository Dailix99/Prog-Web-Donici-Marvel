// Classe per la gestione di una select ricercabile per i supereroi
class SearchableSelect {
    constructor(config) {
        // Inizializzazione delle variabili e degli elementi del DOM
        this.apiUrl = config.apiUrl;
        this.resultsDropdown = document.getElementById('resultsDropdown');
        this.searchResults = document.getElementById('searchResults');
        this.loadingIndicator = document.getElementById('loadingIndicator');
        this.selectedValue = document.getElementById('selected_Superhero');
        this.searchInput = document.getElementById('select_superhero');
        this.debounceTimeout = null;
        this.minChars = config.minChars || 4;
        this.init();
    }

    init() {
        // Listener per l'input di ricerca
        this.searchInput.addEventListener('input', () => {
            clearTimeout(this.debounceTimeout);
            this.debounceTimeout = setTimeout(() => {
                const query = this.searchInput.value.trim();
                if (query.length >= this.minChars) {
                    this.performSearch(query);
                } else {
                    this.hideResults();
                }
            }, 300); // Ritardo per il debounce
        });

        // Chiude il menu a tendina quando si clicca fuori
        document.addEventListener('click', (e) => {
            if (!this.searchInput.contains(e.target) && 
                !this.resultsDropdown.contains(e.target)) {
                this.hideResults();
            }
        });

        // Mostra il menu a tendina quando si mette il focus sull'input
        this.searchInput.addEventListener('focus', () => {
            if (this.searchResults.children.length > 0) {
                this.showResults();
            }
        });
    }

    async performSearch(query) {
        try {
            this.showLoading();
            
            // Creazione della query per la ricerca
            query="nameStartsWith="+query+"&orderBy=name&"

            await getMarvelCarachters(query).then (async response  => {
                if (window.location.pathname === '/create_exchange') {
                    const user_Id = localStorage.getItem("_id");
                    const album_ID = localStorage.getItem("album_ID");
                    
                    if (user_Id && album_ID) {
                        const filteredData = [];
                        for (const character of response.data) {
                            try {
                                const checkResponse = await fetch('/check_card_album', {
                                    method: "POST",
                                    headers: { "Content-Type": "application/json" },
                                    body: JSON.stringify({
                                        user_Id: user_Id,
                                        album_Id: album_ID,
                                        card_Id: character.id
                                    })
                                });
                                const result = await checkResponse.json();
                                if (result.length < 1) {
                                    filteredData.push(character);
                                }
                            } catch (err) {
                                console.error('Errore durante il controllo della carta:', err);
                            }
                        }
                        response.data = filteredData;
                    }
                }
                this.displayResults(response.data);
                if (response.code!=200) {
                throw new Error('Risposta di rete non valida'+response.code);
                }
            })
            .catch(error => {
                console.error('Errore durante il recupero dei dati:', error);
                this.displayError('Errore durante la ricerca dei risultati');
            })


        } catch (error) {
            console.error('Errore durante il recupero dei dati:', error);
            this.displayError('Errore durante la ricerca dei risultati');
        } finally {
            this.hideLoading();
        }
    }

    displayResults(data) {
        this.searchResults.innerHTML = '';
        if (data.length === 0) {
            const noResults = document.createElement('li');
            noResults.className = 'search-item text-muted';
            noResults.textContent = 'Nessun risultato valido trovato';
            this.searchResults.appendChild(noResults);
        } else {
            data.forEach(item => {
                const li = document.createElement('li');
                li.className = 'search-item';
                li.textContent = item.name; // Modificare se la struttura dei dati cambia
                li.dataset.value = item.id; // Modificare se la struttura dei dati cambia
                
                li.addEventListener('click', () => {
                    this.selectItem(item);
                });
                
                this.searchResults.appendChild(li);
            });
        }
        
        this.showResults();
    }

    async selectItem(item) {
        this.selectedValue.value = item.id; // Imposta l'id del supereroe selezionato
        this.searchInput.value = item.name; // Imposta il nome del supereroe selezionato
        this.hideResults();
        
        // Trigger dell'evento di selezione
        const event = new CustomEvent('item-selected', { 
            detail: item 
        });
        this.searchInput.dispatchEvent(event);
        if (['/card' ].includes(window.location.pathname))
            {
                document.getElementById('character_details').innerHTML=``;
                var Div_Car =
                '<div class="card card-shine-effect-metal" id="char-'+item.id+'">'+
                    '<div class="card-header">'+
                        item.name+
                    '</div>'+
                    //'<hr>'+
                    '<div class="card-content">'+
                        '<img src="'+item.thumbnail.path.replace(/"/g, "")+'.'+item.thumbnail.extension+'">'+
                    '</div>'+
                    '<div class="card-body">'+
                    item.description+
                    '</div>'+
                    '<div class="card-footer">'+
                    'Dati forniti da ©Marvel'+
                    '</div>'+
                '</div>';
                document.getElementById("CardContainer").innerHTML = Div_Car;
                // Se l'utente è loggato e ha selezionato un album e possiede la carta nell'album, mostro tutti i dati
                var user_Id = localStorage.getItem("_id");
                var album_ID = localStorage.getItem("album_ID");
                if (!user_Id || !album_ID ) {
                    return;
                }
                try {
                    const response = await fetch('/check_card_album', {
                        method: "POST",
                        headers: {
                            "Content-Type": "application/json"
                        },
                        body: JSON.stringify({
                            user_Id: user_Id,
                            album_Id: album_ID,
                            card_Id: item.id // invio dell'id al posto della password.
                        })
                    });
                    if (!response.ok) {
                        throw new Error("Autenticazione non valida");
                    }
                    const userData = await response.json();
                    if (userData.length>0) {
                    const character_details = document.getElementById('character_details');
                     let seriesHtml=``;
                     let eventsHtml=``;
                     let comicsHtml=``;
                    if ( item.series.available>0 ){
                        seriesHtml = '<hr><h3>Serie:</h3><br>';
                        for (let series of item.series.items) {
                            seriesHtml += `<p>${series.name}</p>`;
                        }
                    }
                    if ( item.events.available>0 ){
                        eventsHtml = '<hr><h3>Eventi:</h3>';
                        for (let events of item.events.items) {
                            eventsHtml += `<p>${events.name}</p>`;
                        }
                    }
                    if ( item.comics.available>0 ){
                        comicsHtml = '<hr><h3>Fumetti:</h3>';
                        for (let comic of item.comics.items) {
                            comicsHtml += `<p>${comic.name}</p>`;
                        }
                    }
                    character_details.innerHTML = seriesHtml + eventsHtml + comicsHtml;
                }
                    }
                    /*Controllo del supereroe che non funziona*/
                catch (error) {
                    console.error("Errore!",error);
                    return "ERR";
                }
                //}
            }
    }

    displayError(message) {
        this.searchResults.innerHTML = `
            <li class="search-item text-danger">${message}</li>
        `;
        this.showResults();
    }

    showResults() {
        this.resultsDropdown.classList.add('show');
    }

    hideResults() {
        this.resultsDropdown.classList.remove('show');
    }

    showLoading() {
        this.loadingIndicator.classList.remove('d-none');
    }

    hideLoading() {
        this.loadingIndicator.classList.add('d-none');
    }
    async setSuperheroById(id) {
        try {
            this.showLoading();
            const response = await getSingleHero(id);
            
            if (response.data && response.data.length > 0) {
                const hero = response.data[0];
                this.selectItem(hero);
            } else {
                this.displayError('Supereroe non trovato');
            }
        } catch (error) {
            console.error('Errore durante il recupero del supereroe:', error);
            this.displayError('Errore durante il caricamento del supereroe');
        } finally {
            this.hideLoading();
        }
    }
}

// Inizializzazione del componente di ricerca
const searchSelect = new SearchableSelect({
    minChars: 4 // Numero minimo di caratteri prima di avviare la ricerca
});

// Listener per la selezione di un supereroe
// Puoi gestire la selezione qui se necessario
// document.getElementById('select_superhero').addEventListener('item-selected', (e) => {
//     // Gestisci la selezione qui
// });
document.getElementById('select_superhero').addEventListener('item-selected', (e) => {
    // Gestisci la selezione qui se necessario
});

// Funzione per la registrazione di un nuovo utente
async function register() {
    var email = document.getElementById('email');
    var username = document.getElementById('username');
    var password1 = document.getElementById('password1');
    var password2 = document.getElementById('password2');
    var name = document.getElementById('name');
    var surname = document.getElementById('surname');
    var date_of_birth = document.getElementById('date_of_birth');
    // Questo elemento nascosto contiene il supereroe selezionato
    var selected_Superhero = document.getElementById("selected_Superhero");
    // Questo elemento è quello visibile per la selezione del supereroe
    var superhero_selection = document.getElementById("select_superhero");
    // Controllo della password
    if (password1.value != password2.value || password1.value.length < 7) {
       password1.classList.add('border');
       password1.classList.add('border-danger');
       password2.classList.add('border');
       password2.classList.add('border-danger');
       alert("La password deve essere lunga almeno 7 caratteri e coincidere con la conferma!");
       return;
    } else {
       password1.classList.remove('border');
       password1.classList.remove('border-danger');
       password2.classList.remove('border');
       password2.classList.remove('border-danger');
    }
    // Controllo della data di nascita con regexp
    var dataPattern = /^\d{4}-(0[1-9]|1[012])-(0[1-9]|[12][0-9]|3[01])$/;
    if (!dataPattern.test(date_of_birth.value)) {
       date_of_birth.classList.add('border');
       date_of_birth.classList.add('border-danger');
       alert("La data di nascita deve essere nel formato DD/MM/AAAA!");
       return;
    } else {
       date_of_birth.classList.remove('border');
       date_of_birth.classList.remove('border-danger');
    }
 
    // Controllo email con regexp
    var emailPattern = /^[a-zA-Z0-9._-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,4}$/;
    if (!emailPattern.test(email.value)) {
       email.classList.add('border');
       email.classList.add('border-danger');
       alert("Inserisci un indirizzo email valido!");
       return;
    } else {
       email.classList.remove('border');
       email.classList.remove('border-danger');
    }
 
    // Controllo lunghezza username e regexp
    var usermanePattern = /^[a-zA-Z0-9_]{4,16}$/;
    if (!usermanePattern.test(username.value)) {
        username.classList.add('border');
        username.classList.add('border-danger');
       alert("Il nome utente deve essere tra 4 e 16 caratteri e contenere solo lettere, numeri e underscore!");
       return;
    } else {
        username.classList.remove('border');
       username.classList.remove('border-danger');
    }
 
    // Controllo dati anagrafici
    if (!name.value) {
       name.classList.add('border');
       name.classList.add('border-danger');
       alert("Inserisci il tuo nome!");
       return;
    } else {
       name.classList.remove('border');
       name.classList.remove('border-danger');
    }
 
    if (!surname.value) {
       surname.classList.add('border');
       surname.classList.add('border-danger');
       alert("Inserisci il tuo cognome!");
       return;
    } else {
       surname.classList.remove('border');
       surname.classList.remove('border-danger');
    }
 
    // Controllo se è stato selezionato un supereroe
    if (!selected_Superhero.value) {
        superhero_selection.classList.add('border');
        superhero_selection.classList.add('border-danger');
        alert("Seleziona un supereroe!");
        return;
     } else {
        superhero_selection.classList.remove('border');
        superhero_selection.classList.remove('border-danger');
     }
    var data = {
       name: name.value,
       username: username.value,
       surname: surname.value,
       email: email.value,
       password: password1.value,
       date: date_of_birth.value,
       superhero: selected_Superhero.value, // Imposto l'ID del supereroe selezionato
       credits: 0.0
    };
 
    const button = document.querySelector('button');
    button.disabled = true;
    button.innerHTML = '<span class="spinner-border spinner-border-sm"></span> Registrazione...';

    try {
        const response = await fetch('/register', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                'Accept': 'application/json'
            },
            body: JSON.stringify(data),
            credentials: 'include'
        });
        

        const result = await response;;

        if (!response.ok) {
            if (response.status == 530) {
                throw new Error(result.message || "Nome utente o email già in uso");
            } else {
                throw new Error(result.message);
            }
        }
        
        // Pulizia del localStorage per sicurezza
        localStorage.clear();
        // Nella modale di login, se viene chiusa, reindirizzo alla homepage
        var loginModal = document.getElementById('loginModal');
        loginModal.addEventListener('hidden.bs.modal', function () {
                window.location.href = '/';
        });
        alert("Utente registrato con successo! Ora puoi effettuare il login.");
        // Cambio il target, prima mi serviva l'elemento HTML, adesso uso l'oggetto
        loginModal = new bootstrap.Modal(document.getElementById('loginModal'));
        loginModal.show();


    } catch (error) {
         // Reset dello stato del bottone
         button.disabled = false;
         button.innerHTML = 'Registrati';
         
         // Mostra errore
         alert('Registrazione fallita. Riprova. ' + error.message);
        console.error('Registrazione fallita:', error);
        // Mostra errore all'utente
        document.getElementById('error-message').textContent = 
            'Registrazione fallita. Riprova.';
    }
 }


 // Funzione per popolare il profilo utente con i dati salvati
 async function populateUserProfile() {
    var email = localStorage.getItem("email");
    var username = localStorage.getItem("username");
    var _id = localStorage.getItem("_id");
    if (!email || !username || !_id) {
        console.error("Dati utente mancanti nel localStorage");
        return;
    }
    try {
        const response = await fetch('/get_user_data', {
            method: "POST",
            headers: {
                "Content-Type": "application/json"
            },
            body: JSON.stringify({
                email: email,
                username: username,
                _id: _id // invio dell'id al posto della password.
            })
        });
        if (!response.ok) {
            throw new Error("Autenticazione non valida");
        }
        const userData = await response.json();
        // Mostra i dati dell'utente nel profilo
        document.getElementById("username").value = userData.username;
        document.getElementById("email").value = userData.email;
        document.getElementById("name").value = userData.name;
        document.getElementById("surname").value = userData.surname;
        // Ottieni il corretto elemento select e aggiorna
        const selectElement = document.getElementById('selected_Superhero');
        
        if (selectElement) {
            selectElement.value = userData.superhero;
             // Recupera i dettagli del supereroe tramite l'ID
             try {
                const heroResponse = await getSingleHero(userData.superhero);    
                const searchInput = document.getElementById('select_superhero');
                if (!heroResponse) {
                    throw new Error('Nessuna risposta dal recupero supereroe');
                }
                
                if (heroResponse.data && heroResponse.data.length > 0) {
                    const hero = heroResponse.data[0];
                    // Aggiorna l'input visibile con il nome del supereroe
                    searchInput.value = hero.name;
                } else {
                    console.error("Supereroe non trovato");
                    searchInput.value = "Supereroe non trovato";
                }
            } catch (error) {
                console.error("Errore durante il recupero dei dettagli del supereroe:", error);
                searchInput.value = "Errore durante il caricamento del supereroe";
            }
        }
        /*Controllo del supereroe che non funziona*/
        document.getElementById("date_of_birth").value = userData.date;    }
     catch (error) {
        console.error("Errore!",error);
        return "ERR";
    }
    
}

// Funzione per aggiornare i dati dell'utente
async function updateUser() {
    var email = document.getElementById('email');
    var username = document.getElementById('username');
    var password1 = document.getElementById('password1');
    var password2 = document.getElementById('password2');
    var name = document.getElementById('name');
    var surname = document.getElementById('surname');
    var date_of_birth = document.getElementById('date_of_birth');
    // Questo elemento nascosto contiene il supereroe selezionato
    var selected_Superhero = document.getElementById("selected_Superhero");
    // Questo elemento è quello visibile per la selezione del supereroe
    var superhero_selection = document.getElementById("select_superhero");
    // Controllo della password
    if ((password1.value != password2.value || password1.value.length < 7 ) && password1.value) {
       password1.classList.add('border');
       password1.classList.add('border-danger');
       password2.classList.add('border');
       password2.classList.add('border-danger');
       alert("La password deve essere lunga almeno 7 caratteri e coincidere con la conferma!");
       return;
    } else {
       password1.classList.remove('border');
       password1.classList.remove('border-danger');
       password2.classList.remove('border');
       password2.classList.remove('border-danger');
    }
    // Controllo della data di nascita con regexp
    var dataPattern = /^\d{4}-(0[1-9]|1[012])-(0[1-9]|[12][0-9]|3[01])$/;
    if (!dataPattern.test(date_of_birth.value)) {
       date_of_birth.classList.add('border');
       date_of_birth.classList.add('border-danger');
       alert("La data di nascita deve essere nel formato DD/MM/AAAA!");
       return;
    } else {
       date_of_birth.classList.remove('border');
       date_of_birth.classList.remove('border-danger');
    }
 
    // Controllo email con regexp
    var emailPattern = /^[a-zA-Z0-9._-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,4}$/;
    if (!emailPattern.test(email.value)) {
       email.classList.add('border');
       email.classList.add('border-danger');
       alert("Inserisci un indirizzo email valido!");
       return;
    } else {
       email.classList.remove('border');
       email.classList.remove('border-danger');
    }
 
    // Controllo lunghezza username e regexp
    var usermanePattern = /^[a-zA-Z0-9_]{4,16}$/;
    if (!usermanePattern.test(username.value)) {
        username.classList.add('border');
        username.classList.add('border-danger');
       alert("Il nome utente deve essere tra 4 e 16 caratteri e contenere solo lettere, numeri e underscore!");
       return;
    } else {
        username.classList.remove('border');
       username.classList.remove('border-danger');
    }
 
    // Controllo dati anagrafici
    if (!name.value) {
       name.classList.add('border');
       name.classList.add('border-danger');
       alert("Inserisci il tuo nome!");
       return;
    } else {
       name.classList.remove('border');
       name.classList.remove('border-danger');
    }
 
    if (!surname.value) {
       surname.classList.add('border');
       surname.classList.add('border-danger');
       alert("Inserisci il tuo cognome!");
       return;
    } else {
       surname.classList.remove('border');
       surname.classList.remove('border-danger');
    }
 
    // Controllo se è stato selezionato un supereroe
    if (!selected_Superhero.value) {
        superhero_selection.classList.add('border');
        superhero_selection.classList.add('border-danger');
        alert("Seleziona un supereroe!");
        return;
     } else {
        superhero_selection.classList.remove('border');
        superhero_selection.classList.remove('border-danger');
     }
    var data = {
       name: name.value,
       _id : localStorage.getItem("_id"),
       username: username.value,
       password: password1.value,
       surname: surname.value,
       email: email.value,
       date: date_of_birth.value,
       superhero: selected_Superhero.value // Imposto l'ID del supereroe selezionato
    };
 
    const button = document.querySelector('button');
    button.disabled = true;
    button.innerHTML = '<span class="spinner-border spinner-border-sm"></span> Registrazione...';

    try {
        const response = await fetch('/update-user', {
            method: 'PUT',
            headers: {
                'Content-Type': 'application/json',
                'Accept': 'application/json'
            },
            body: JSON.stringify(data),
            credentials: 'include'
        });
        

        const result = await response.json();

        if (!response.ok) {
            throw new Error(result.message);
        }

        // Salva le credenziali dell'utente in LocalStorage usando i dati risultanti
        localStorage.setItem("email", data.email);
        localStorage.setItem("username", data.username);
        localStorage.setItem("name", data.name);
        alert("Utente aggiornato con successo! ");
        window.location.reload();
        return;
    } catch (error) {
         // Reset dello stato del bottone
         button.disabled = false;
         button.innerHTML = 'Registrati';
         
         // Mostra errore
         alert('Aggiornamento fallito. Riprova. ' + error.message);
        console.error('Aggiornamento fallito:', error);
        // Mostra errore all'utente
        document.getElementById('error-message').textContent = 
            'Aggiornamento fallito. Riprova.';
    }
}

// Funzione per eliminare l'utente
async function deleteUser() {
    var _id = localStorage.getItem("_id");
    try{
        const response = await fetch(`../delete-user/${_id}`, {
            method: 'DELETE',
            headers: {
                'Accept': 'application/json',
                'Content-Type': 'application/json'
            }
        });
        alert("Utente eliminato con successo. Ora verrai reindirizzato alla homepage");
        localStorage.clear();    
        // Torna alla homepage
        window.location.href = '/';

    } catch (error) {
        console.error("Errore!",error);
        return "ERR";
    }
}