/**
 * MARVEL.JS - Gestione API Marvel
 * 
 * Questo file gestisce tutte le interazioni con l'API Marvel, includendo:
 * - Recupero del numero totale di personaggi disponibili
 * - Generazione di pacchetti di carte casuali
 * - Ricerca e filtraggio dei personaggi
 * - Validazione dei dati dei personaggi
 */

import 'dotenv/config';
import { getMD5, getRandomInt } from './utils.js';
import { response } from 'express';
import * as database from './database.js';

// ============================================================================
// VARIABILI GLOBALI
// ============================================================================

// Timestamp per l'autenticazione API
const timestamp = Date.now();

// Parametri di autenticazione per l'API Marvel
const parameters = `ts=${timestamp}&apikey=${process.env.PUBLIC_KEY}&hash=${getMD5(timestamp + process.env.PRIVATE_KEY + process.env.PUBLIC_KEY)}&`;

// ============================================================================
// FUNZIONI PRINCIPALI
// ============================================================================

/**
 * Recupera il numero totale di personaggi disponibili nell'API Marvel
 * 
 * @returns {Promise<Object>} Risposta dell'API con il numero totale di personaggi
 */
export async function returnCharactersNumber() {
    return fetch(`https://gateway.marvel.com/v1/public/characters?${parameters}limit=1&`)
        .then(response => response.json())
        .catch(error => console.error('Errore nel recupero numero personaggi:', error));
}

/**
 * Genera un pacchetto di carte casuali
 * 
 * Chiama l'API Marvel 5 volte con limite di 1, offset casuale e valida ogni personaggio
 * prima di scriverlo nel JSON. Una volta raggiunto il numero di personaggi richiesto,
 * il pacchetto viene restituito.
 * 
 * @param {Object} param - Parametri per la generazione del pacchetto
 * @param {string} param.username - Username dell'utente
 * @param {string} param.user_id - ID dell'utente
 * @param {string} param.album_id - ID dell'album
 * @param {number} param.cards - Numero di carte da generare
 * @returns {Promise<Array>} Array di personaggi validi
 */
export async function returnPackage(param) {
    let valid_characters_count = 0; // Contatore personaggi validi
    let loop_check = 0; // Contatore di controllo del ciclo
    let query;
    let response_package = [];
    let max_characters;

    // Struttura per la variazione dei crediti
    let creditChange = {
        username: param.username,
        credits: Number(-1)
    };

    // Verifica e deduzione dei crediti
    const creditResponse = await database.variate_credits(creditChange).catch(response => {
        if (response.code === 401) {
            throw { code: 401, message: "Crediti insufficienti" };
        }
        return response;
    });

    // Recupera il numero di personaggi disponibili
    if (!creditResponse || creditResponse.code !== 401) {
        await returnCharactersNumber().then(response => {
            max_characters = response.data.total;
        });

        do {
            query = "limit=1&offset=" + Number(await getRandomInt(0, max_characters)) + "&";
            
            try {
                // Recupera un personaggio casuale
                const response = await fetch(`https://gateway.marvel.com/v1/public/characters?${parameters}${query}`);
                const data = await response.json();
                
                // Verifica validità e duplicazioni
                if (isCharacterValid(data.data.results[0]) &&
                    !response_package.some(item => item.data.results[0].id === data.data.results[0].id)) {
                    
                    // Se la carta è valida, salvala nel database
                    let saveCard = {
                        cardID: data.data.results[0].id,
                        userID: param.user_id,
                        albumID: param.album_id
                    };

                    try {
                        await database.savecard(saveCard);
                        response_package.push(data);
                        response_package.count++;
                        valid_characters_count++;
                    } catch (e) {
                        res.status(500).send(`Errore generico: ${e}`);
                        return;
                    }
                }
            } catch (error) {
                console.error('Errore nel recupero dati Marvel:', error);
                throw error;
            }
            
            loop_check++;
        } while (valid_characters_count < param.cards && loop_check < 200);

        return response_package;
    }
}

/**
 * Funzione generica per recuperare dati dall'API Marvel
 * 
 * @param {Object} res - Oggetto response di Express
 * @param {string} url - Endpoint dell'API Marvel
 * @param {string} query - Query string per la richiesta
 * @returns {Promise<Object>} Dati filtrati dei personaggi
 */
export async function getFromMarvel(res, url, query) {
    const parameters = `ts=${timestamp}&apikey=${process.env.PUBLIC_KEY}&hash=${getMD5(timestamp + process.env.PRIVATE_KEY + process.env.PUBLIC_KEY)}&`;
    
    return fetch(`https://gateway.marvel.com/v1/${url}?${parameters}${query}`)
        .then(response => response.json())
        .then(data => {
            if (data.code !== "RequestThrottled") {
                let response_package = [];
                
                // Filtra solo i personaggi validi
                data.data.results.forEach(element => {
                    if (isCharacterValid(element)) {
                        response_package.push(element);
                    }
                });
                
                return {
                    code: 200,
                    data: response_package
                };
            } else {
                return {
                    code: 401,
                    message: data.message
                };
            }
        })
        .catch(error => {
            console.error('Errore:', error);
            throw error;
        });
}

// ============================================================================
// FUNZIONI DI VALIDAZIONE
// ============================================================================

/**
 * Verifica se un personaggio è valido
 * 
 * Per essere valido, il personaggio deve avere una descrizione, un'immagine e un nome
 * 
 * @param {Object} character - Oggetto personaggio da validare
 * @returns {boolean} true se il personaggio è valido, false altrimenti
 */
function isCharacterValid(character) {
    if (character.description && character.thumbnail.path && character.name) {
        return true;
    } else {
        return false;
    }
}
