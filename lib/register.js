import { getMD5,isValidDate,isValidString,isValidPassword, isValidUsername } from "./utils.js";
import * as database from "./database.js";

/**
 * Registra un nuovo utente nel sistema.
 *
 * Questa funzione registra un nuovo utente nel sistema processando i dati di registrazione. Si aspetta un oggetto Express response (`res`) e un oggetto utente (`user`) contenente le informazioni di registrazione. La funzione valida i dati e li salva nel database se rispettano i criteri.
 *
 * @param {Object} res - L'oggetto response di Express.
 * @param {Object} user - L'oggetto utente con le informazioni di registrazione.
 * @param {string} user.name - Il nome completo dell'utente.
 * @param {string} user.username - Lo username scelto dall'utente.
 * @param {string} user.email - L'indirizzo email dell'utente.
 * @param {string} user.password - La password dell'utente.
 * @param {string} user.date - La data di nascita dell'utente nel formato 'yyyy-mm-dd'.
 *
 * @returns {void} Questa funzione invia una risposta HTTP al client. Restituisce una risposta di successo (HTTP 200) in caso di registrazione avvenuta con successo.
 * Se si verifica un errore durante la registrazione, viene inviata una risposta di errore appropriata.
 * 
 * @throws {400} Bad Request - Se uno dei parametri richiesti (`name`, `username`, `email`, `password`) manca o non è valido (es. vuoto, non è una stringa valida).
 * @throws {400} Bad Request - Se il parametro `date` manca o non è in un formato valido ('yyyy-mm-dd').
 * @throws {400} Bad Request - Se la password non è valida (meno di 7 caratteri).
 * @throws {400} Bad Request - Se lo username non è valido (es. contiene spazi).
 * @throws {400} Bad Request - Se l'email o lo username sono già associati a un utente esistente.
 * @throws {500} Internal Error - Se si verifica un errore interno del server durante la registrazione.
 */
export async function register(res,user) {
   // Controllo parametri obbligatori
   if (user.name == undefined || user.username == undefined || user.email == undefined || user.password == undefined ) {
      res.status(400).send('Parametro mancante');
      return;
   }
   // Controllo validità della data
   if(!isValidDate(user.date)){
      res.status(400).send('Data non valida!');
      return;
   }
   // Controllo validità delle stringhe
   if(!isValidString(user.name) || !isValidString(user.email) || !isValidString(user.password)){
      res.status(400).send('Alcuni dati non sono validi. Controlla e riprova!');
      return;
   }
   // Controllo validità password
   if(!isValidPassword(user.password)){
      res.status(400).send('La password non è valida. Deve essere lunga almeno 7 caratteri!');
      return;
   }
   // Controllo validità username
   if(!isValidUsername(user.username)){
      res.status(400).send('Lo username non è valido!');
      return;
   }
   
   user.password = getMD5(user.password);
   try{
      // Controllo se username o email sono già presenti
      const result = await database.check_username(user);
      if(result.status != 200){
         res.status(result.status).send();
         return;
      }
   
      try{
         // Registrazione utente nel database
         await database.register_user(res,user);
         res.status(200).send();
      } catch (e) {
         res.status(500).send(`Errore generico: ${e}`);
         return;
      }
   } catch (e) {  
      res.status(500).send(`Errore generico: ${e}`);
      return;
   }
}



/**
 * Autentica un utente in base alle credenziali fornite.
 *
 * Questa funzione verifica l'autenticazione dell'utente confrontando le credenziali fornite con quelle presenti nel database.
 *
 * @param {Object} req - L'oggetto request di Express.
 * @param {Object} res - L'oggetto response di Express.
 * @returns {void}
 */
export async function authuser(req, res) {
   let login = req.body;
   // Controllo validità ID
   if(!isValidString(login._id)){
      res.status(400).send("ID non valido");
      return;
   }
   // Controllo validità username
   if(!isValidString(login.username) ){
      return;
   }
   try{
      // Verifica credenziali utente
      let loggedUser = await database.check_user_credentials(login);
      if (loggedUser == null) {
         res.status(401).send("Non autorizzato");
         return;
      } else {
         res.json(loggedUser);
         return;
      }
   }catch(e){
      res.status(500).send("Errore interno");
      return;
   }
}