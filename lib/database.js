/**
 * DATABASE.JS - Gestione connessione e operazioni database
 * 
 * Questo file gestisce tutte le operazioni di database MongoDB, includendo:
 * - Connessione e gestione del client MongoDB
 * - Operazioni CRUD per utenti, album e carte
 * - Gestione crediti e scambi
 * - Validazione e controllo degli accessi
 */

import { MongoClient, ServerApiVersion, ObjectId } from 'mongodb';
import { getMD5 } from "./utils.js";
import { error } from 'console';
import Decimal from 'decimal.js';

// ============================================================================
// CONFIGURAZIONE CONNESSIONE
// ============================================================================

// Stringa di connessione MongoDB
const uri = `mongodb+srv://${process.env.DB_USERNAME}:${process.env.DB_PASSWORD}@${process.env.DB_CLUSTER}/?${process.env.DB_OPTIONS}`;

// Variabili per la connessione
let client;
let dbConnection;

/**
 * Stabilisce la connessione al database MongoDB
 * 
 * @returns {Promise<Object>} Istanza del database connesso
 */
async function connectToDatabase() {
    if (dbConnection) return dbConnection;
    
    try {
        client = new MongoClient(uri, {
            serverApi: {
                version: ServerApiVersion.v1,
                strict: true,
                deprecationErrors: true,
                useNewUrlParser: true,
                useUnifiedTopology: true,
                serverSelectionTimeoutMS: 5000,
                maxPoolSize: 10
            }
        });

        await client.connect();
        dbConnection = client.db(process.env.DB_DBNAME);
        return dbConnection;
    } catch (error) {
        console.error('Impossibile connettersi a MongoDB:', error);
        throw error;
    }
}

// Inizializzazione connessione quando il file viene importato
connectToDatabase().catch(console.error);

// ============================================================================
// FUNZIONI DI CONTROLLO CONNESSIONE
// ============================================================================

/**
 * Verifica lo stato della connessione al database
 * 
 * @returns {Promise<Object>} Stato della connessione
 */
export async function check_db_connection() {
    try {
        const db = await connectToDatabase();
        // Ping per confermare la connessione al database
        await db.command({ ping: 1 });
        return {
            status: 200,
            message: 'Connessione al database riuscita'
        };
    } catch (error) {
        console.error('Connessione a MongoDB fallita:', error);
        return {
            status: 401,
            message: 'Connessione al database non autorizzata o fallita',
            error: error.message
        };
    }
}

// ============================================================================
// FUNZIONI GESTIONE UTENTI
// ============================================================================

/**
 * Verifica se username o email sono già in uso
 * 
 * @param {Object} user - Oggetto utente con email e username
 * @returns {Promise<Object>} Risultato della verifica
 */
export async function check_username(user) {
    try {
        // Connessione al server
        const db = await connectToDatabase();
        const existingUser = await db.collection("users").findOne({
            $or: [{ email: user.email }, { username: user.username }]
        });
        
        if (existingUser) {
            return {
                status: 530,
                message: 'Username o email già esistente'
            };
        }

        return {
            status: 200,
            message: 'Utente non esistente'
        };
    } catch (error) {
        console.error('Connessione a MongoDB fallita:', error);
        return {
            status: 500,
            message: 'Errore interno del server'
        };
    }
}

/**
 * Registra un nuovo utente nel database
 * 
 * @param {Object} res - Oggetto response di Express
 * @param {Object} user - Dati dell'utente da registrare
 * @returns {Promise<void>}
 */
export async function register_user(res, user) {
    try {
        // Connessione al server
        user.credits = new Decimal(user.credits).toString();
        const db = await connectToDatabase();
        
        await db.collection("users").insertOne(user, function(err, res) {
            if (err) {
                return {
                    status: 401,
                    message: 'Inserimento nel database non autorizzato o fallito',
                    error: error.message
                };
            }
        });
    } catch (error) {
        console.error('Registrazione utente nel database fallita:', error);
        return {
            status: 401,
            message: 'Connessione al database non autorizzata o fallita',
            error: error.message
        };
    }
}

/**
 * Verifica le credenziali dell'utente per l'autenticazione
 * 
 * @param {Object} login - Credenziali di login
 * @returns {Promise<Object|null>} Dati utente se autenticato, null altrimenti
 */
export async function check_user_credentials(login) {
    if (login._id) {
        login._id = new ObjectId(login._id);
    }
    
    const filter = {
        $or: [
            { $and: [{ email: login.email }, { password: login.password }] },
            { $and: [{ username: login.username }, { password: login.password }] },
            { $and: [{ _id: login._id }, { username: login.username }] },
        ],
    };
    
    try {
        // Connessione al server
        const db = await connectToDatabase();
        let response = await db.collection("users").findOne(filter);
        return response;
    } catch (error) {
        console.error("Errore!", error);
    }
}

// ============================================================================
// FUNZIONI GESTIONE CREDITI
// ============================================================================

/**
 * Varia i crediti di un utente
 * 
 * @param {Object} credits - Oggetto con username e variazione crediti
 * @returns {Promise<Object>} Risultato dell'operazione
 */
export async function variate_credits(credits) {
    const db = await connectToDatabase();
    let user = await db.collection("users").findOne({ username: credits.username });
    
    // Converti crediti esistenti e nuovi in Decimal per calcoli precisi
    const currentCredits = new Decimal(user.credits);
    const creditChange = new Decimal(credits.credits);
    const newCredits = currentCredits.plus(creditChange);
    
    if (newCredits.lessThan(0)) {
        return {
            status: 401,
            credits: currentCredits.toString()
        };
    }

    try {
        const result = await db.collection("users")
            .updateOne(
                { username: credits.username },
                { $set: { credits: newCredits.toString() } }
            );
        
        let updatedUser = await db.collection("users").findOne({ username: credits.username });
        return {
            status: 200,
            result,
            credits: updatedUser.credits
        };
    } catch (error) {
        console.error('Errore nell\'aggiornamento crediti:', error);
        throw error;
    }
}

/**
 * Recupera i crediti di un utente
 * 
 * @param {string} user_param - Username dell'utente
 * @returns {Promise<Object>} Crediti dell'utente
 */
export async function get_Credits(user_param) {
    try {
        const db = await connectToDatabase();
        let user = await db.collection("users").findOne({ username: user_param });
        
        if (!user) {
            return {
                status: 401,
                message: 'Utente non trovato'
            };
        } else {
            // Converti crediti in Decimal quando li recuperi
            const credits = new Decimal(user.credits);
            return {
                status: 200,
                credits: credits.toString()
            };
        }
    } catch (error) {
        console.error('Errore nel recupero crediti:', error);
        throw error;
    }
}

/**
 * Aggiorna i dati di un utente esistente
 * 
 * @param {Object} login - Dati aggiornati dell'utente
 * @returns {Promise<Object>} Risultato dell'aggiornamento
 */
export async function update_user(login) {
    try {
        // Connessione al server
        const db = await connectToDatabase();
        const updateFields = {
            email: login.email,
            username: login.username,
            name: login.name,
            surname: login.surname,
            date: login.date,
            superhero: login.superhero
        };
        
        // Aggiungi password criptata se fornita
        if (login.password) {
            updateFields.password = getMD5(login.password);
        }
        
        const result = await db.collection("users").updateOne(
            { _id: new ObjectId(login._id) },
            { $set: updateFields }
        );
        
        if (!result.acknowledged) {
            return {
                status: 401,
                message: 'Aggiornamento database non autorizzato o fallito'
            };
        } else {
            return {
                status: 200,
                message: 'Aggiornamento database completato!',
                data: JSON.stringify(login)
            };
        }
    } catch (error) {
        console.error('Aggiornamento utente nel database fallito:', error);
        return {
            status: 401,
            message: 'Connessione al database non autorizzata o fallita',
            error: error.message
        };
    }
}

/**
 * Elimina un utente e tutti i suoi dati associati
 * 
 * @param {string} id - ID dell'utente da eliminare
 * @returns {Promise<Object>} Risultato dell'eliminazione
 */
export async function delete_user(id) {
    try {
        // Connessione al server
        const db = await connectToDatabase();
        
        // Elimina innanzitutto l'utente
        const result_users = await db.collection("users").deleteOne(
            { _id: new ObjectId(id) }
        );

        if (!result_users.acknowledged) {
            return {
                status: 401,
                message: 'Eliminazione database non autorizzata o fallita'
            };
        } else {
            // Elimina tutti gli scambi inseriti dall'utente
            const result_exchanges = await db.collection("exchanges").deleteMany(
                { user_id: new ObjectId(id) }
            );
            
            if (!result_exchanges.acknowledged) {
                return {
                    status: 401,
                    message: 'Eliminazione database non autorizzata o fallita'
                };
            } else {
                // Elimina tutte le carte collegate ai suoi album
                const result_cards = await db.collection("cards").deleteMany(
                    { user_id: new ObjectId(id) }
                );
                
                if (!result_cards.acknowledged) {
                    return {
                        status: 401,
                        message: 'Eliminazione database non autorizzata o fallita'
                    };
                } else {
                    // Elimina tutti gli album dell'utente
                    const result_albums = await db.collection("albums").deleteMany(
                        { user_id: new ObjectId(id) }
                    );
                    
                    if (!result_albums.acknowledged) {
                        return {
                            status: 401,
                            message: 'Eliminazione database non autorizzata o fallita'
                        };
                    } else {
                        // Elimina tutte le carte degli scambi dell'utente
                        const result_exchange_card = await db.collection("exchanges_cards").deleteMany(
                            { user_id: new ObjectId(id) }
                        );
                        
                        if (!result_exchange_card.acknowledged) {
                            return {
                                status: 401,
                                message: 'Eliminazione database non autorizzata o fallita'
                            };
                        } else {
                            return {
                                status: 200,
                                message: 'Eliminazione database completata! Utente rimosso'
                            };
                        }
                    }
                }
            }
        }
    } catch (error) {
        console.error('Eliminazione utente dal database fallita:', error);
        return {
            status: 401,
            message: 'Connessione al database non autorizzata o fallita',
            error: error.message
        };
    }
}

// ============================================================================
// FUNZIONI GESTIONE ALBUM
// ============================================================================

/**
 * Recupera tutti gli album di un utente
 * 
 * @param {string} id - ID dell'utente
 * @returns {Promise<Array|Object>} Lista degli album o errore
 */
export async function getUserAlbums(id) {
    try {
        // Connessione al server
        const db = await connectToDatabase();
        let albums = await db.collection("albums").find({ user_Id: new ObjectId(id) }).toArray();
        
        if (!albums) {
            return {
                status: 404,
                message: 'Album non trovati'
            };
        } else {
            return albums;
        }
    } catch (error) {
        console.error('Errore nel recupero album:', error);
        throw error;
    }
}

/**
 * Crea un nuovo album per un utente
 * 
 * @param {Object} userid - Oggetto con userId e name
 * @returns {Promise<Object>} Risultato della creazione
 */
export async function createAlbum(userid) {
    try {
        // Connessione al server
        const db = await connectToDatabase();
        let albums = await db.collection("albums").insertOne({
            user_Id: new ObjectId(userid.userId),
            name: userid.name
        });
        
        if (!albums) {
            return {
                status: 404,
                message: 'Impossibile creare album'
            };
        } else {
            return albums;
        }
    } catch (error) {
        console.error('Errore nella creazione album:', error);
        throw error;
    }
}

// ============================================================================
// FUNZIONI GESTIONE CARTE
// ============================================================================

/**
 * Salva una nuova carta nel database
 * 
 * @param {Object} params - Parametri della carta (userID, albumID, cardID)
 * @returns {Promise<Object>} Risultato del salvataggio
 */
export async function savecard(params) {
    try {
        // Connessione al server
        const db = await connectToDatabase();
        let card = await db.collection("cards").insertOne({
            user_Id: new ObjectId(params.userID),
            album_Id: params.albumID,
            card_Id: params.cardID
        });
        
        // Rimuovi tutti gli scambi per questa carta
        await remove_exchange_by_card({
            cardId: params.cardID,
            userId: params.userID,
            albumId: params.albumID,
            type: 'Card_found'
        });
        
        if (!card) {
            return {
                status: 404,
                message: 'Impossibile creare carta'
            };
        } else {
            return card;
        }
    } catch (error) {
        console.error('Errore nella creazione carta:', error);
        throw error;
    }
}

export async function check_card_album(params) {
    try {
        // Connessione al server
        const db = await connectToDatabase();
        var filter = {
            $and: [{ user_Id: new ObjectId(params.user_Id) }, { album_Id: params.album_Id }, { card_Id: params.card_Id }]
        };
        let cards = await db.collection("cards").find(filter).toArray();
        if (!cards) {
            return {
                status: 404,
                message: 'Carte non trovate'
            };
        } else {
            return cards;
        }
    } catch (error) {
        console.error('Errore nel recupero carte:', error);
        throw error;
    }
}


export async function getAlbumsCards(albumid) {
    try {
        // Connessione al server
        const db = await connectToDatabase();
        var filter;
        let cards;
        
        filter = { album_Id: albumid };
        cards = await db.collection("cards").find(filter).sort({ card_Id: 1 }).toArray();
        if (!cards) {
            return {
                status: 404,
                message: 'Carte non trovate'
            };
        } else {
            return cards;
        }
    } catch (error) {
        console.error('Errore nel recupero carte:', error);
        throw error;
    }
}

export async function getDuplicatedAlbumsCards(albumid) {
    try {
        // Connessione al server
        const db = await connectToDatabase();
        var filter;
        let cards;
        
        filter = [
            {
                $match: {
                    album_Id: albumid  // Aggiungi questo stadio per primo
                }
            },
            {
                $group: {
                    _id: {
                        user_Id: "$user_Id",
                        album_Id: "$album_Id",
                        card_Id: "$card_Id"
                    },
                    count: { $sum: 1 }
                }
            },
            {
                $match: {
                    count: { $gte: 2 }
                }
            }
        ];
        
        cards = await db.collection("cards").aggregate(filter).toArray();
        if (!cards) {
            return {
                status: 404,
                message: 'Carte non trovate'
            };
        } else {
            // Riformatta la struttura dei dati delle carte duplicate
            cards = cards.map(card => ({
                user_Id: card._id.user_Id,
                album_Id: card._id.album_Id,
                card_Id: card._id.card_Id
            }));
            return cards;
        }
    } catch (error) {
        console.error('Errore nel recupero carte:', error);
        throw error;
    }
}

export async function remove_card(param,type) {
  let parameters = param;
  if (type=="sell_card") {
    try{
    //const credits = await get_Credits(parameters.username);
    parameters.credits = 0.2;
    const variated_credits = await variate_credits(parameters);

    const db = await connectToDatabase();

    const result_cards = await db.collection("cards").deleteOne(
      { user_Id: new ObjectId(parameters.user_id),
        album_Id : parameters.album_id,
        card_Id : parameters.card_id
       }
    );
    if (!result_cards.acknowledged) 
    {

            return {
                status: 401,
                message: 'Eliminazione database non autorizzata o fallita'
            };
    } else 
    {

            // Controlla se dobbiamo rimuovere gli scambi
            const userCards = await db.collection("cards").find({
                user_Id: new ObjectId(parameters.user_id),
                album_Id: parameters.album_id,
                card_Id: parameters.card_id
            }).toArray();

            const existingExchanges = await db.collection("exchanges_cards").find({
                user_id: new ObjectId(parameters.user_id),
                album_id: parameters.album_id,
                card_Id: parameters.card_id
            }).count();

            // Rimuovi scambi se questa era l'ultima carta disponibile
            if (userCards.length <= existingExchanges) {
                await remove_exchange_by_card({
                    cardId: parameters.card_id,
                    userId: parameters.user_id,
                    albumId: parameters.album_id,
                    type: 'Card_sold'
                });
            }
            return {
                status: 200,
                message: 'Vendita completata.'
            };
    }
    
  } 
  catch (error) {
    console.error('Error fetching cards:', error);
      throw error;
    }
  }
  else if (type=="exchange_cards"){
    try{
      const db = await connectToDatabase();
      const result_cards = await db.collection("cards").deleteOne(
        { user_Id: new ObjectId(parameters.user_id),
          album_Id : parameters.album_id,
          card_Id : parameters.card_id
         }
      );
      if (!result_cards.acknowledged) 
      {
        return {
          status: 401,
          message: 'Database deletd unauthorized or failed'
        };
      } else 
      {
        return {
          status: 200,
          message: 'Sell completed.'
        };
      }
      
    } 
    catch (error) {
      console.error('Error fetching cards:', error);
        throw error;
      }
    }
  }
//}

// ============================================================================
// FUNZIONI GESTIONE SCAMBI
// ============================================================================

/**
 * Recupera tutti gli scambi validi per un utente
 * 
 * Questa funzione stampa tutti gli scambi validi utilizzando l'album per ottenere
 * le carte che voglio e che non ho e le carte che ho in doppio.
 * Prima cosa recupero le carte doppie così so quali carte posso cedere.
 * 
 * @param {Object} params - Parametri per la ricerca scambi
 * @returns {Promise<Object>} Lista degli scambi validi
 */
export async function get_valid_exchanges(params) {
    const db = await connectToDatabase();
    
    const response = await getDuplicatedAlbumsCards(params.albumid);
    
    let available_exchanges = [];
    let exchange_cards = [];
    let filter = {};
    let card_filter = {};
    let returned_exchanges = [];
    
    // Poi controllo tutti gli scambi che hanno le carte che ho come carta richiesta
    for (let i = 0; i < response.length; i++) {
        filter = { requestedCard: response[i].card_Id.toString() };
        const exchanges = await db.collection("exchanges").find(filter).toArray();
        
        if (!exchanges || exchanges.length === 0) {
            continue; // Salta alla prossima iterazione invece di restituire
        }

        for (let j = 0; j < exchanges.length; j++) {
            // Salta scambi dallo stesso utente
            if (exchanges[j].user_id.toString() === params.userid) {
                continue;
            }

            // Recupera tutte le carte proposte per questo scambio
            const exchange_cards = await db.collection("exchanges_cards").find({
                exchange_id: exchanges[j]._id
            }).toArray();

            // Controlla se l'utente ha una delle carte proposte
            let hasAnyProposedCards = false;
            for (let card of exchange_cards) {
                const cardCheck = await check_card_album({
                    album_Id: params.albumid,
                    user_Id: params.userid,
                    card_Id: card.card_Id
                });
                
                if (cardCheck && cardCheck.length > 0) {
                    hasAnyProposedCards = true;
                    break;
                }
            }

            // Salta se l'utente ha una delle carte proposte
            if (hasAnyProposedCards) {
                continue;
            }
            
            // Aggiungi scambio valido a returned_exchanges
            returned_exchanges.push({
                exchange_ID: exchanges[j]._id,
                requestedCard: exchanges[j].requestedCard,
                proposedCards: exchange_cards.map(card => card.card_Id)
            });
        }
    }
    
    return {
        status: 200,
        exchanges: returned_exchanges
    };
}

/**
 * Crea un nuovo scambio
 * 
 * @param {Object} params - Parametri dello scambio
 * @returns {Promise<Object>} Risultato della creazione
 */
export async function create_exchange(params) {
    try {
        const db = await connectToDatabase();
        
        // Inserisci il record principale dello scambio con album_id
        const exchange = await db.collection("exchanges").insertOne({
            user_id: new ObjectId(params.userId),
            album_id: params.albumId,
            requestedCard: params.cardtoGet
        });
        
        // Controlla se le carte proposte sono ancora disponibili
        for (const cardId of params.cardtosend) {
            // Recupera tutte le carte possedute dall'utente
            const userCards = await db.collection("cards").find({
                user_Id: new ObjectId(params.userId),
                album_Id: params.albumId,
                card_Id: cardId.id
            }).toArray();

            // Recupera scambi esistenti che usano questa carta
            const existingExchanges = await db.collection("exchanges_cards").find({
                user_id: new ObjectId(params.userId),
                album_id: params.albumId,
                card_Id: cardId.id
            }).count();

            // Se il numero di scambi esistenti è uguale o supera le carte possedute, la carta non è disponibile
            if (existingExchanges >= userCards.length) {
                throw new Error(`Carta ${cardId.id} non è più disponibile per lo scambio`);
            }
        }
        
        // Inserisci tutte le carte proposte con album_id
        const cardPromises = params.cardtosend.map(cardId => {
            return db.collection("exchanges_cards").insertOne({
                exchange_id: exchange.insertedId,
                card_Id: cardId.id,
                user_id: new ObjectId(params.userId),
                album_id: params.albumId
            });
        });

        await Promise.all(cardPromises);

        return {
            status: 200,
            exchange_id: exchange.insertedId,
            message: 'Scambio creato con successo'
        };
    } catch (error) {
        console.error('Errore nella creazione scambio:', error);
        return {
            status: 500,
            message: 'Impossibile creare scambio',
            error: error.message
        };
    }
}

  export async function remove_exchange_by_card(card) {
  try {
    const db = await connectToDatabase();
    var result;
    if (card.type=='Card_found'){
    // Find all exchanges with the specified requestedCard and album_id
    const exchanges = await db.collection("exchanges").find({
    requestedCard: card.cardId,
    user_id: new ObjectId(card.userId),
    album_id: card.albumId
    }).toArray();
        // Elimina tutte le voci exchange_cards associate
        const exchangeIds = exchanges.map(exchange => exchange._id);
        if (exchangeIds.length > 0) {
            await db.collection("exchanges_cards").deleteMany({
                exchange_id: { $in: exchangeIds }
            });
        }
        // Elimina gli scambi
     result = await db.collection("exchanges").deleteMany({
      requestedCard: card.cardId,
      user_id: new ObjectId(card.userId),
      album_id: card.albumId
      });
  } else if (card.type='Card_sold'){
        // Trova tutti gli scambi con la carta richiesta e album_id specificati
        const exchanges = await db.collection("exchanges_cards").find({
            card_Id: card.cardId,
            user_id: new ObjectId(card.userId),
            album_id: card.albumId
        }).toArray();

        // Elimina tutte le voci exchange_cards associate
        const exchangeIds = exchanges.map(exchange => exchange.exchange_id);
        if (exchangeIds.length > 0) {
            await db.collection("exchanges_cards").deleteMany({
                exchange_id: { $in: exchangeIds }
            });
        }
        // Elimina gli scambi
    result = await db.collection("exchanges").deleteMany({
      _id : { $in: exchangeIds },
      user_id: new ObjectId(card.userId),
      album_id: card.albumId
      });
  }




    return {
        status: 200,
        message: 'Scambi rimossi con successo',
        deletedCount: result.deletedCount
    };
} catch (error) {
    console.error('Errore nella rimozione scambi:', error);
    return {
        status: 500,
        message: 'Impossibile rimuovere scambi',
        error: error.message
    };
}
  }

  export async function accept_exchange(params) {
    try {
      const db = await connectToDatabase();

        // Recupera i dettagli dello scambio
        const exchange = await db.collection("exchanges").findOne({
            _id: new ObjectId(params.exchange_id)
        });

        if (!exchange) {
            throw new Error('Scambio non trovato');
        }

        // Recupera tutte le carte proposte
        const proposedCards = await db.collection("exchanges_cards").find({
            exchange_id: new ObjectId(params.exchange_id)
        }).toArray();
/*PARAMS: ACCEPT
      EXCHANGE CREATOR*/
        // Prima rimuovi la carta richiesta dall'utente che accetta
        await remove_card({
            user_id: params.acceptingUserId,
            album_id: params.album_id,
            card_id: Number(exchange.requestedCard)
        }, "exchange_cards");

        // Poi trasferiscila al creatore dello scambio
        await savecard({
            userID: exchange.user_id.toString(),
            albumID: exchange.album_id,
            cardID: Number(exchange.requestedCard)
        });

        // Gestisci ogni carta proposta
        for (const card of proposedCards) {
            // Prima rimuovi dal creatore dello scambio
            await remove_card({
                user_id: exchange.user_id.toString(),
                album_id: exchange.album_id,
                card_id: Number(card.card_Id)
            }, "exchange_cards");

            // Poi trasferisci all'utente che accetta
            await savecard({
                userID: params.acceptingUserId,
                albumID: params.album_id,
                cardID: Number(card.card_Id)
            });
        }

        // Elimina lo scambio e le sue carte
        await delete_exchange(params.exchange_id);
        return {
            status: 200,
            message: 'Scambio completato con successo'
        };
    } catch (error) {
        console.error('Errore nel completamento scambio:', error);
        return {
            status: 500,
            message: 'Impossibile completare scambio',
            error: error.message
        };
    }
  }

  
  export async function delete_exchange(exchangeId) {
    try {
      const db = await connectToDatabase();

        // Elimina prima tutte le exchange_cards associate
        await db.collection("exchanges_cards").deleteMany({
            exchange_id: new ObjectId(exchangeId)
        });

        // Elimina lo scambio stesso
        const result = await db.collection("exchanges").deleteOne({
            _id: new ObjectId(exchangeId)
        });
        console.log("Eliminazione->", result.deletedCount);
        
        if (result.deletedCount === 0) {
            return {
                status: 404,
                message: 'Scambio non trovato'
            };
        }

        return {
            status: 200,
            message: 'Scambio eliminato con successo'
        };
    } catch (error) {
        console.error('Errore nell\'eliminazione scambio:', error);
        return {
            status: 500,
            message: 'Impossibile eliminare scambio',
            error: error.message
        };
    }
  }



export async function get_my_exchanges(params) {
    // Questa funzione stampa tutti i miei scambi validi
    // Utilizzando l'album per ottenere le carte che voglio e che non ho e le carte che ho in doppio
    // Prima cosa recupero le carte doppie così so quali carte posso cedere
    const db = await connectToDatabase();
    
    const response = await getDuplicatedAlbumsCards(params.albumid);
    
    let available_exchanges = [];
    let exchange_cards = [];
    let filter = {};
    let card_filter = {};
    let returned_exchanges = [];
    
    // Poi controllo tutti gli scambi che hanno le carte che ho come carta richiesta
    filter = { user_id: new ObjectId(params.userid) };
    const exchanges = await db.collection("exchanges").find(filter).toArray();
    
    for (let j = 0; j < exchanges.length; j++) {
        // Recupera tutte le carte proposte per questo scambio
        const exchange_cards = await db.collection("exchanges_cards").find({
            exchange_id: exchanges[j]._id
        }).toArray();
        
        // Aggiungi scambio a returned_exchanges
        returned_exchanges.push({
            exchange_ID: exchanges[j]._id,
            requestedCard: exchanges[j].requestedCard,
            proposedCards: exchange_cards.map(card => card.card_Id)
        });
    }
    
    return {
        status: 200,
        exchanges: returned_exchanges
    };
}