/**
 * MARVEL.JS - Gestione delle funzionalità Marvel
 * 
 * Questo file gestisce tutte le interazioni con l'API Marvel e le operazioni
 * relative alle carte dei supereroi. Include funzioni per:
 * - Ricerca e recupero personaggi Marvel
 * - Gestione pacchetti e album
 * - Operazioni di scambio tra utenti
 * - Visualizzazione dettagli personaggi
 */

// ============================================================================
// VARIABILI GLOBALI
// ============================================================================

// Collezione temporanea per le carte selezionate per lo scambio
let collection = [];

// ============================================================================
// FUNZIONI API MARVEL
// ============================================================================

/**
 * Recupera i personaggi Marvel tramite query di ricerca
 * 
 * @param {string} query - Termine di ricerca per i personaggi
 * @returns {Promise<Object>} Dati dei personaggi trovati
 */
async function getMarvelCarachters(query) {
    return await fetch(`../characters?query=${query}`, {
        method: 'POST',
        headers: {
            'Accept': 'application/json',
            'Content-Type': 'application/json'
        },
        body: JSON.stringify({})
    })
    .then(response => response.json())
    .catch(error => console.error('Errore nel recupero personaggi:', error));
}

/**
 * Recupera un pacchetto di carte per l'utente
 * 
 * @returns {Promise<Object>} Dati del pacchetto generato
 */
async function getPackage() {
    return await fetch('../package', {
        method: 'POST',
        headers: {
            'Accept': 'application/json',
            'Content-Type': 'application/json'
        },
        body: JSON.stringify({
            username: localStorage.getItem("username"),
            album_id: localStorage.getItem("album_ID"),
            user_id: localStorage.getItem("_id"),
            cards: 5
        })
    })
    .then(response => response.json())
    .catch(error => console.error('Errore nel recupero pacchetto:', error));
}

/**
 * Recupera tutte le carte dell'album dell'utente
 * 
 * @param {string} albumID - ID dell'album
 * @returns {Promise<Array>} Lista delle carte nell'album
 */
async function getAlbumcardsDB(albumID) {
    return await fetch(`/albums_cards/${albumID}`, {
        method: 'GET',
        headers: {
            'Accept': 'application/json',
            'Content-Type': 'application/json'
        }
    })
    .then(response => response.json())
    .catch(error => console.error('Errore nel recupero carte album:', error));
}

/**
 * Recupera le carte duplicate dell'album dell'utente
 * 
 * @param {string} albumID - ID dell'album
 * @returns {Promise<Array>} Lista delle carte duplicate
 */
async function getDuplicatedAlbumcardsDB(albumID) {
    return await fetch(`/albums_duplicated_cards/${albumID}`, {
        method: 'GET',
        headers: {
            'Accept': 'application/json',
            'Content-Type': 'application/json'
        }
    })
    .then(response => response.json())
    .catch(error => console.error('Errore nel recupero carte duplicate:', error));
}

/**
 * Recupera i dettagli di un singolo supereroe
 * 
 * @param {string} id - ID del supereroe
 * @returns {Promise<Object>} Dettagli del supereroe
 */
async function getSingleHero(id) {
    try {
        const response = await fetch(`../character/${id}`, {
            method: 'GET',
            headers: {
                'Accept': 'application/json',
                'Content-Type': 'application/json'
            }
        });
        
        if (!response.ok) {
            throw new Error(`Errore HTTP! status: ${response.status}`);
        }
        
        return await response.json();
    } catch (error) {
        console.error('Errore nel recupero supereroe:', error);
        throw error;
    }
}

// ============================================================================
// GESTIONE PACCHETTI
// ============================================================================

/**
 * Stampa il contenuto di un pacchetto aperto
 * Mostra le carte ottenute e aggiorna i crediti dell'utente
 */
async function printPackage() {
    await getPackage()
        .then(response => {
            printCredits();
            
            let Div_Car = `<div class="row">
                            <div class="col-md-12 text-center">`;
            
            response.forEach(item => {
                Div_Car += '<div class="card card-shine-effect-metal" id="char-' + item.data.results[0].id + '">' +
                    '<div class="card-header">' +
                    item.data.results[0].name +
                    '</div>' +
                    '<div class="card-content">' +
                    '<img src="' + item.data.results[0].thumbnail.path.replace(/"/g, "") + '.' + item.data.results[0].thumbnail.extension + '">' +
                    '</div>' +
                    '<div class="card-body">' +
                    item.data.results[0].description +
                    '</div>' +
                    '<div class="card-footer">' +
                    item.attributionText +
                    '</div>' +
                    '</div>';
            });
            
            Div_Car += `</div>
                        </div>
                        <button onclick="window.location.reload();" class="btn btn-block btn-success w-100">OK</button>`;
            
            document.getElementById("pack_cards").innerHTML = Div_Car;
        })
        .catch(response => console.error("Errore di calcolo!", response));
}

// ============================================================================
// GESTIONE ALBUM
// ============================================================================

/**
 * Stampa tutte le carte dell'album dell'utente
 * 
 * @param {string} albumId - ID dell'album da visualizzare
 */
async function printAlbumCards(albumId) {
    document.getElementById("pack_cards").innerHTML = '<i class="fas fa-spinner fa-spin fa-3x"></i>';
    
    await getAlbumcardsDB(albumId)
        .then(response => {
            let Div_Car = `<div class="row">
                            <div class="col-md-12 text-center">`;
            
            response.forEach(item => {
                Div_Car += '<a href="/card" onclick="localStorage.setItem(\'heroId\',\'' + item.marvel_data.data[0].id + '\')">' +
                    '<div class="card card-shine-effect-metal" id="char-' + item.marvel_data.data[0].id + '">' +
                    '<div class="card-header">' +
                    item.marvel_data.data[0].name +
                    '</div>' +
                    '<div class="card-content">' +
                    '<img src="' + item.marvel_data.data[0].thumbnail.path.replace(/"/g, "") + '.' + item.marvel_data.data[0].thumbnail.extension + '">' +
                    '</div>' +
                    '<div class="card-body">' +
                    item.marvel_data.data[0].description +
                    '</div>' +
                    '<div class="card-footer">' +
                    'Dati forniti da ©Marvel' +
                    '</div>' +
                    '</div></a>';
            });
            
            Div_Car += `</div>
                        </div>`;
            
            document.getElementById("pack_cards").innerHTML = Div_Car;
            document.getElementById("pack_cards").classList.remove("hidden");
        })
        .catch(response => console.error("Errore di calcolo!", response));
}

/**
 * Stampa le carte duplicate dell'album per lo scambio o la vendita
 * 
 * @param {string} albumId - ID dell'album
 */
async function printDuplicatedAlbumCards(albumId) {
    document.getElementById("pack_cards").innerHTML = '<i class="fas fa-spinner fa-spin fa-3x"></i>';
    
    let action = '';
    
    // Determina l'azione in base alla pagina corrente
    if (['/sell_cards'].includes(window.location.pathname)) {
        action = `<a onclick="removeCard(`;
    } else if (['/create_exchange'].includes(window.location.pathname)) {
        action = `<a onclick="toggletoExchange(`;
    } else {
        action = `<a onclick="alert(`;
    }
    
    await getDuplicatedAlbumcardsDB(albumId)
        .then(response => {
            if (response.length > 0) {
                let Div_Car = `<div class="row">
                                <div class="col-md-12 text-center">`;
                
                response.forEach(item => {
                    Div_Car += action + item.marvel_data.data[0].id + ')"> ' +
                        `<div class="card card-shine-effect-metal" id="char-` + item.marvel_data.data[0].id + `">` +
                        `<div class="card-header">` +
                        item.marvel_data.data[0].name +
                        `</div>` +
                        `<div class="card-content">` +
                        `<img src="` + item.marvel_data.data[0].thumbnail.path.replace(/"/g, "") + `.` + item.marvel_data.data[0].thumbnail.extension + `">` +
                        `</div>` +
                        `<div class="card-body">` +
                        item.marvel_data.data[0].description +
                        `</div>` +
                        `<div class="card-footer">` +
                        'Dati forniti da ©Marvel' +
                        `</div>` +
                        `</div> </a>`;
                });
                
                Div_Car += `</div>
                            </div>`;
                
                document.getElementById("pack_cards").innerHTML = Div_Car;
                document.getElementById("pack_cards").classList.remove("hidden");
                
                if (['/create_exchange'].includes(window.location.pathname)) {
                    document.getElementById("recieveCard").classList.remove("hidden");
                    document.getElementById("card_sell").classList.remove("hidden");
                }
            } else {
                document.getElementById("pack_cards").classList.remove("hidden");
                document.getElementById("pack_cards").innerHTML = "<p>Nessuna carta duplicata disponibile per lo scambio</p>";
                
                if (['/create_exchange'].includes(window.location.pathname)) {
                    document.getElementById("card_sell").disabled = true;
                }
            }
        })
        .catch(response => console.error("Errore di calcolo!", response));
}

/**
 * Crea un nuovo album per l'utente
 * 
 * @param {string} userid - ID dell'utente
 * @param {string} name - Nome dell'album
 */
async function createAlbum(userid, name) {
    try {
        const response = await fetch(`../create_album`, {
            method: 'POST',
            headers: {
                'Accept': 'application/json',
                'Content-Type': 'application/json'
            },
            body: JSON.stringify({ userId: userid, name: name })
        });
        
        if (!response.ok) {
            throw new Error(`Errore HTTP! status: ${response.status}`);
        } else {
            let JsonResponse = await response.json();
            localStorage.setItem("album_ID", JsonResponse.insertedId);
            alert("Album creato con successo");
            window.location.reload();
        }
    } catch (error) {
        console.error('Errore nella creazione album:', error);
        throw error;
    }
}

// ============================================================================
// GESTIONE VENDITA CARTE
// ============================================================================

/**
 * Rimuove una carta dall'album (vendita)
 * 
 * @param {string} cardId - ID della carta da vendere
 */
async function removeCard(cardId) {
    const albumId = localStorage.getItem("album_ID");
    const username = localStorage.getItem("username");
    const user_id = localStorage.getItem("_id");
    
    if (confirm('Sei sicuro di voler vendere questa carta?')) {
        fetch('/sell_card', {
            method: 'DELETE',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
                card_id: cardId,
                album_id: albumId,
                username: username,
                user_id: user_id
            })
        })
        .then(() => window.location.reload());
    }
}

// ============================================================================
// GESTIONE SCAMBI
// ============================================================================

/**
 * Aggiunge o rimuove una carta dalla collezione per lo scambio
 * 
 * @param {string} cardId - ID della carta da gestire
 */
function toggletoExchange(cardId) {
    const found = collection.filter(item => item.id === cardId);
    
    if (found.length > 0) {
        // Rimuove la carta dalla selezione
        document.getElementById("char-" + cardId).style = "";
        collection = collection.filter(item => item.id !== cardId);
    } else {
        // Aggiunge la carta alla selezione
        document.getElementById("char-" + cardId).style = "background-color: var(--bs-green);";
        collection.push({
            id: cardId,
        });
    }
}

/**
 * Crea un nuovo scambio tra utenti
 */
async function createExchange() {
    const userId = localStorage.getItem('_id');
    const cardToGet = document.getElementById('selected_Superhero').value;
    
    if (!userId || !cardToGet || !collection || collection.length === 0) {
        alert("Seleziona una o più carte da inviare e una carta che desideri ricevere.");
        throw new Error('Parametri di scambio mancanti');
    }

    // Verifica che la carta richiesta non sia tra quelle offerte
    if (collection.some(card => card.id === cardToGet)) {
        alert("Non puoi richiedere una carta che stai offrendo di inviare.");
        throw new Error('Carta richiesta presente nella collezione di invio');
    }

    try {
        const response = await fetch('/create_exchange', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json'
            },
            body: JSON.stringify({
                userId: userId,
                cardtoGet: cardToGet,
                cardtosend: collection,
                albumId: localStorage.getItem('album_ID')
            })
        });

        if (response.ok) {
            alert("Scambio creato con successo");
            window.location.href = '/exchange';
        } else {
            throw new Error('Creazione scambio fallita');
        }
    } catch (error) {
        console.error('Errore nella creazione scambio:', error);
        throw error;
    }
}

/**
 * Accetta uno scambio proposto
 * 
 * @param {string} exchangeId - ID dello scambio da accettare
 */
async function acceptExchange(exchangeId) {
    const userId = localStorage.getItem('_id');
    const albumId = localStorage.getItem('album_ID');

    try {
        const response = await fetch('/accept_exchange', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json'
            },
            body: JSON.stringify({
                exchange_id: exchangeId,
                acceptingUserId: userId,
                album_id: albumId
            })
        });

        if (!response.ok) {
            throw new Error(`Errore HTTP! status: ${response.status}`);
        }

        alert('Scambio accettato con successo');
        window.location.reload();
    } catch (error) {
        console.error('Errore nell\'accettazione scambio:', error);
        alert('Impossibile accettare lo scambio');
    }
}

/**
 * Elimina uno scambio
 * 
 * @param {string} exchangeID - ID dello scambio da eliminare
 */
async function deleteExchange(exchangeID) {
    const userId = localStorage.getItem('_id');
    const albumId = localStorage.getItem('album_ID');

    try {
        const response = await fetch(`../delete-exchange/${exchangeID}`, {
            method: 'DELETE',
            headers: {
                'Accept': 'application/json',
                'Content-Type': 'application/json'
            }
        });
        
        alert("Scambio eliminato con successo");
        window.location.reload();
    } catch (error) {
        console.error("Errore!", error);
        return "ERR";
    }
}

// ============================================================================
// GESTIONE DETTAGLI PERSONAGGI
// ============================================================================

/**
 * Carica e visualizza i dettagli di un personaggio passato tramite localStorage
 * Gestisce anche la visualizzazione di informazioni aggiuntive per utenti loggati
 */
async function loadCharacterpassed() {
    const heroID = localStorage.getItem("heroId");
    
    if (heroID) {
        try {
            const heroResponse = await getSingleHero(heroID);
            const searchInput = document.getElementById('select_superhero');
            
            if (!heroResponse) {
                throw new Error('Nessuna risposta dal recupero supereroe');
            }
            
            if (heroResponse.data && heroResponse.data.length > 0) {
                const hero = heroResponse.data[0];
                
                // Aggiorna il campo di ricerca con il nome del supereroe
                searchInput.value = hero.name;
                
                // Crea la card del supereroe
                let Div_Car = '<div class="card card-shine-effect-metal" id="char-' + hero.id + '">' +
                    '<div class="card-header">' +
                    hero.name +
                    '</div>' +
                    '<div class="card-content">' +
                    '<img src="' + hero.thumbnail.path.replace(/"/g, "") + '.' + hero.thumbnail.extension + '">' +
                    '</div>' +
                    '<div class="card-body">' +
                    hero.description +
                    '</div>' +
                    '<div class="card-footer">' +
                    'Dati forniti da ©Marvel' +
                    '</div>' +
                    '</div>';
                
                document.getElementById("CardContainer").innerHTML = Div_Car;
                
                // Verifica se l'utente è loggato e ha un album selezionato
                const user_Id = localStorage.getItem("_id");
                const album_ID = localStorage.getItem("album_ID");

                if (!user_Id || !album_ID) {
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
                            card_Id: hero.id
                        })
                    });

                    if (!response.ok) {
                        throw new Error("Autenticazione non valida");
                    }
                    
                    const userData = await response.json();
                    
                    if (userData.length > 0) {
                        const character_details = document.getElementById('character_details');
                        let seriesHtml = '';
                        let eventsHtml = '';
                        let comicsHtml = '';
                        
                        // Genera HTML per le serie
                        if (hero.series.available > 0) {
                            seriesHtml = '<hr><h3>Serie:</h3>';
                            for (let series of hero.series.items) {
                                seriesHtml += `<p>${series.name}</p>`;
                            }
                        }
                        
                        // Genera HTML per gli eventi
                        if (hero.events.available > 0) {
                            eventsHtml = '<hr><h3>Eventi:</h3>';
                            for (let events of hero.events.items) {
                                eventsHtml += `<p>${events.name}</p>`;
                            }
                        }
                        
                        // Genera HTML per i fumetti
                        if (hero.comics.available > 0) {
                            comicsHtml = '<hr><h3>Fumetti:</h3>';
                            for (let comic of hero.comics.items) {
                                comicsHtml += `<p>${comic.name}</p>`;
                            }
                        }
                        
                        character_details.innerHTML = seriesHtml + eventsHtml + comicsHtml;
                    }
                } catch (error) {
                    console.error("Errore!", error);
                    return "ERR";
                }
            } else {
                console.error("Supereroe non trovato");
                searchInput.value = "Supereroe non trovato";
            }
            
            localStorage.removeItem("heroId");
        } catch (error) {
            console.error("Errore nel caricamento dettagli supereroe:", error);
            searchInput.value = "Errore nel caricamento supereroe";
        }
    }
}