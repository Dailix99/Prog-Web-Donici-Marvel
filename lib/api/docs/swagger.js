import swaggerAutogen from 'swagger-autogen';
import { config } from "../../../config/prefs.js";
const outputFile = './swagger-output.json';
const endpointsFiles = ['../../*.js', '../../../app.js']; 

const doc = {
  "info": {
    "title": "Marvel Universe: Donici",
    "description": "Test degli endpoint Marvel Universe",
    "version": "1.0.0"
  },
  host: `${config.host}:${config.port}`,
  basePath: "/",
  schemes: ['http'],
  consumes: ['application/json'],
  produces: ['application/json'],
  tags: [
    {
     "name": "fetch",
     "description": "Endpoint di base."
    },
    {
      "name": "users",
      "description": "Endpoint per la gestione dei dati utente e delle operazioni correlate."
    },
    {
     "name": "auth",
     "description": "Endpoint relativi all'autenticazione e autorizzazione dell'utente."
    },
    {
     "name": "cards",
     "description": "Endpoint per la gestione delle carte dell'album."
    },
    {
      "name": "exchanges",
      "description": "Endpoint per gestire gli scambi."
    },
    {
    "name": "database",
    "description": "Endpoint per verificare la connessione al database."
  }
  ],
  definitions: {
    user: {
      _id: "ObjectId('686ba122e387eb703b5b5e3e')",
      name: "Iustin",
      username: "Fragola99",
      surname: "Donici",
      email: "donici@gmail.com",
      password: "807fe1d5176e0c7a958500eb58ef7f08",
      date: "2004-09-09",
      superhero: "1009652",
      credits: "75.2"
    },

    album: {
      _id: "ObjectId('686b9cff133bfdd6814f1e02')",
      user_Id: "686b98fc133bfdd6814f1dfc" ,
      name: "TopiGalattici"
    },

    cards: {
      _id: "ObjectId('686be7e5eefe0f7e839548bb')",
      user_Id: "ObjectId('686ba122e387eb703b5b5e3e')",
      album_Id: "686ba16fe387eb703b5b5e3f",
      card_Id: 1009610
    },

    exchanges: {
      _id: "ObjectId('686bef0116c4b01ee8851a84')",
      user_Id: "ObjectId('686ba122e387eb703b5b5e3e')",
      album_id: "686ba16fe387eb703b5b5e3f",
      requestedCard: "1009718"
    },

    exchanges_cards: {
      _id: "ObjectId('686bef0216c4b01ee8851a85')",
      exchange_id: "ObjectId('686bef0116c4b01ee8851a84')",
      card_Id: 1010366,
      user_Id: "ObjectId('686ba122e387eb703b5b5e3e')",
      album_id: "686ba16fe387eb703b5b5e3f"
    }
  }
};
  const swagger = swaggerAutogen(outputFile, endpointsFiles, doc)


