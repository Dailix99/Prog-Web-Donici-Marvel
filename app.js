/**
 * APP.JS - Server Express per applicazione Marvel Cards
 * 
 * Gestisce tutte le route e gli endpoint dell'applicazione, includendo:
 * - Servizio file statici e pagine HTML
 * - API per autenticazione e gestione utenti
 * - API per gestione carte e album
 * - API per scambi e transazioni
 * - Integrazione con API Marvel
 */

// ============================================================================
// IMPORTS E CONFIGURAZIONE
// ============================================================================

import express from "express";
import path from 'path';
import 'dotenv/config';
import { marvel } from "./config/prefs.js";
import * as database from './lib/database.js';
import * as marvel_API from './lib/marvel.js';
import * as Utils from './lib/utils.js';
import * as register from './lib/register.js';
import { login } from './lib/login.js';
import {
    serve as swaggerUiServe,
    setup as swaggerUiSetup,
} from "swagger-ui-express";
import swaggerUi from 'swagger-ui-express';
import swaggerDocument from './lib/api/docs/swagger-output.json' with { type: 'json' };

// Variabile globale per il database
global.db;

// Inizializzazione app Express
const app = express();
app.use(express.json());

// ============================================================================
// SERVIZIO FILE STATICI
// ============================================================================

// Configurazione cartella pubblica per file statici
app.use(express.static(path.resolve('./public/')));

// ============================================================================
// ROUTE PAGINE HTML
// ============================================================================

// Pagina principale
app.get('/', async (_, res) => {
    res.sendFile(path.resolve("./public/html/index.html"));
});

// Restituisce la pagina per l'apertura dei pacchetti
app.get('/package', (req, res) => {
    res.sendFile(path.resolve("./public/html/package.html"));
});

// Restituisce la pagina di dettaglio carta
app.get('/card', async (req, res) => {
    res.sendFile(path.resolve("./public/html/card_detail.html"));
});

// Restituisce la pagina di gestione profilo utente
app.get('/user', async (req, res) => {
    res.sendFile(path.resolve("./public/html/user_profile.html"));
});

// Restituisce la pagina di login
app.get('/login', async (req, res) => {
    res.sendFile(path.resolve("./public/html/login.html"));
});

// Restituisce la pagina di registrazione
app.get('/register', async (req, res) => {
    res.sendFile(path.resolve("./public/html/register.html"));
});

// Restituisce la pagina dell'album
app.get('/album', async (req, res) => {
    res.sendFile(path.resolve("./public/html/album.html"));
});

// Restituisce la pagina per vendere carte
app.get('/sell_cards', async (req, res) => {
    res.sendFile(path.resolve("./public/html/sell_cards.html"));
});

// Restituisce la pagina per creare scambi
app.get('/create_exchange', async (req, res) => {
    res.sendFile(path.resolve("./public/html/create_exchange.html"));
});

// Restituisce la pagina degli scambi disponibili
app.get('/exchange', async (req, res) => {
    res.sendFile(path.resolve("./public/html/select_exchange.html"));
});

// Restituisce la pagina per acquistare crediti
app.get('/get-credits', async (req, res) => {
    res.sendFile(path.resolve("./public/html/get_credits.html"));
});

// ============================================================================
// API GESTIONE ALBUM E CARTE
// ============================================================================

// Recupera album di un utente
app.get('/albums/:userid', async (req, res) => {
    try {
        const response = await database.getUserAlbums(req.params.userid);
        res.send(response);
    } catch (error) {
        console.error("Errore nel recupero album:", error.message);
        res.status(500).json({ error: "Impossibile recuperare gli album: " + error.message });
    }
});

// Recupera tutte le carte di un album specifico con dati Marvel
app.get('/albums_cards/:albumid', async (req, res) => {
    try {
        const response = await database.getAlbumsCards(req.params.albumid);
        
        for (let i = 0; i < response.length; i++) {
            const marvelData = await marvel_API.getFromMarvel(req, 'public/characters/' + response[i].card_Id, '');
            response[i].marvel_data = marvelData;
        }
        res.send(response);
    } catch (error) {
        console.error("Errore nel recupero album:", error.message);
        res.status(500).json({ error: "Impossibile recuperare gli album: " + error.message });
    }
});

// Recupera le carte duplicate di un album con dati Marvel
app.get('/albums_duplicated_cards/:albumid', async (req, res) => {
    try {
        const response = await database.getDuplicatedAlbumsCards(req.params.albumid);
        
        for (let i = 0; i < response.length; i++) {
            const marvelData = await marvel_API.getFromMarvel(req, 'public/characters/' + response[i].card_Id, '');
            response[i].marvel_data = marvelData;
        }
        res.send(response);
    } catch (error) {
        console.error("Errore nel recupero album:", error.message);
        res.status(500).json({ error: "Impossibile recuperare gli album: " + error.message });
    }
});

// Recupera i dati di un personaggio specifico dall'API Marvel
app.get("/character/:id", async (req, res) => {
    try {
        const response = await marvel_API.getFromMarvel(req, 'public/characters/' + req.params.id, '');
        res.json(response);
    } catch (error) {
        console.error("Errore nel recupero personaggio:", error);
        res.status(500).json({ error: "Impossibile recuperare il personaggio" });
    }
});

// ============================================================================
// API GESTIONE SCAMBI
// ============================================================================

// Crea un nuovo scambio
app.post('/create_exchange', async (req, res) => {
    await database.create_exchange(req.body).then(response => { res.send(response); });
});

// Accetta uno scambio esistente
app.post('/accept_exchange', async (req, res) => {
    await database.accept_exchange(req.body).then(response => { res.send(response); });
});

// Verifica se una carta è presente in un album
app.post('/check_card_album', async (req, res) => {
    await database.check_card_album(req.body).then(response => { res.send(response); });
});

// Recupera la lista degli scambi validi disponibili
app.post('/check_exchanges', async (req, res) => {
    await database.get_valid_exchanges(req.body).then(response => { res.send(response); });
});

// Recupera gli scambi creati dall'utente corrente
app.post('/check_my_exchanges', async (req, res) => {
    await database.get_my_exchanges(req.body).then(response => { res.send(response); });
});

// Elimina uno scambio specifico
app.delete("/delete-exchange/:exchangeid", async (req, res) => {
    await database.delete_exchange(req.params.exchangeid).then(response => { res.send(response); });
});

// ============================================================================
// API GESTIONE UTENTI E AUTENTICAZIONE
// ============================================================================

// Registrazione nuovo utente
app.post("/register", async (req, res) => {
    try {
        await register.register(res, req.body);
    } catch (error) {
        console.error("Errore registrazione");
    }
});

// Autentica un utente esistente
app.post("/login", async (req, res) => {
    login(req, res);
});

// Verifica l'autenticità dei dati utente
app.post("/get_user_data", async (req, res) => {
    await register.authuser(req, res);
});

// Aggiorna i dati di un utente esistente
app.put("/update-user", async (req, res) => {
    await database.update_user(req.body).then(response => { res.send(response); });
});

// Elimina un utente dal sistema
app.delete("/delete-user/:userid", async (req, res) => {
    await database.delete_user(req.params.userid).then(response => { res.send(response); });
});

// ============================================================================
// API GESTIONE CREDITI E PACCHETTI
// ============================================================================

// Recupera crediti utente
app.get('/print-credits/:username', async (req, res) => {
    await database.get_Credits(req.params.username).then(response => { res.send(response); });
});

// Modifica il saldo crediti di un utente (acquisto/vendita)
app.post('/edit-credits', (req, res) => {
    database.variate_credits(req.headers).then(response => { res.send(response); });
});

// ============================================================================
// API GESTIONE CARTE E PACCHETTI
// ============================================================================

// Ottieni pacchetto di carte
app.post('/package', (req, res) => {
    marvel_API.returnPackage(req.body).then(response => { res.send(response); });
});

// Crea un nuovo album per un utente
app.post('/create_album', (req, res) => {
    database.createAlbum(req.body).then(response => { res.send(response); });
});

// Vende una carta dal proprio album
app.delete("/sell_card/", async (req, res) => {
    await database.remove_card(req.body, 'sell_card').then(response => { res.send(response); });
});

// Cerca personaggi nell'API Marvel con query personalizzata
app.post("/characters", (req, res) => {
    marvel_API.getFromMarvel(req, 'public/characters', req.query.query)
        .then(response => { res.send(response); });
});

// ============================================================================
// API SISTEMA E DIAGNOSTICA
// ============================================================================

// Verifica connessione database
app.post('/check-db', async (req, res) => {
    const result = await database.check_db_connection();
    res.status(result.status).json(result);
});

// ============================================================================
// CONFIGURAZIONE SWAGGER
// ============================================================================

// Documentazione API con Swagger
app.use('/api-docs', swaggerUiServe, swaggerUiSetup(swaggerDocument));

// ============================================================================
// AVVIO SERVER
// ============================================================================

// Avvia il server sulla porta definita nel file .env
app.listen(process.env.PORT);

// Verifica connessione database all'avvio
database.check_db_connection()
    .then(console.log("Connessione al database riuscita"))
    .catch(error => console.error("Connessione al database fallita:", error));