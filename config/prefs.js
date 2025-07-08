import * as dotenv from 'dotenv';
dotenv.config();

// Oggetto che contiene le informazioni necessarie per autenticarsi e comunicare con le API di Marvel.
const marvel = {
    base_url: process.env.BASE_URL,
    public_key: process.env.PUBLIC_KEY,
    private_key: process.env.PRIVATE_KEY,
 };

// Configurazione principale del server: qui vengono letti host e porta dalle variabili d'ambiente.
const config = {
    host: process.env.HOST,
    port: process.env.PORT,
 };

export { marvel,config };