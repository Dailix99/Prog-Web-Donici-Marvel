/**
 * LOGIN.JS - Gestione autenticazione utenti
 * 
 * Questo file gestisce il processo di login degli utenti, includendo:
 * - Validazione delle credenziali di accesso
 * - Verifica delle credenziali nel database
 * - Restituzione dei dati utente in caso di successo
 */

//import { dbUserCollection } from "./user.js";
import { getMD5, isValidString, isValidPassword, isValidEmail } from "./utils.js";
import { check_user_credentials } from "./database.js";

// ============================================================================
// FUNZIONI DI AUTENTICAZIONE
// ============================================================================

/**
 * Gestisce il login dell'utente
 * 
 * Questa funzione elabora le richieste di login e verifica le credenziali fornite.
 * Se il login ha successo, restituisce le informazioni dell'utente.
 * 
 * @param {Object} req - Oggetto request di Express
 * @param {Object} res - Oggetto response di Express
 * @returns {void}
 */
export async function login(req, res) {
    let login = req.body;

    // Verifica presenza di email o username
    if (login.email == undefined && login.username == undefined) {
        res.status(400).send("Parametro mancante");
        return;
    }

    // Verifica presenza della password
    if (login.password == undefined) {
        res.status(400).send("Parametro mancante");
        return;
    }

    // Validazione email o username
    if (!isValidEmail(login.email) && !isValidString(login.username)) {
        res.status(400).send("Username o email non validi");
        return;
    }

    // Validazione password
    if (!isValidString(login.password) || !isValidPassword(login.password)) {
        res.status(400).send("Password non valida");
        return;
    }

    // Criptazione della password per il confronto
    login.password = getMD5(login.password);
  // let collection = await dbUserCollection();
    try {
        // Verifica credenziali nel database
        let loggedUser = await check_user_credentials(login);
        
        if (loggedUser == null) {
            res.status(401).send("Non autorizzato");
            return;
        } else {
            // Restituzione dati utente in caso di successo
            res.json({
                _id: loggedUser._id,
                username: loggedUser.username,
                email: loggedUser.email,
                name: loggedUser.name,
                credits: loggedUser.credits
            });
            return;
        }
    } catch (e) {
        res.status(500).send("Si è verificato un errore. Riprova più tardi");
        return;
    }
}