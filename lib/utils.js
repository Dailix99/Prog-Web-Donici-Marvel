/**
 * UTILS.JS - Funzioni di utilità
 * 
 * Questo file contiene funzioni di utilità utilizzate in tutto il progetto:
 * - Validazione di stringhe, date, password, email e username
 * - Generazione di hash MD5
 * - Generazione di numeri casuali
 */

import { createHash } from 'crypto';

// ============================================================================
// FUNZIONI DI VALIDAZIONE
// ============================================================================

/**
 * Verifica se una stringa è valida e non vuota
 * 
 * @param {string} string - Stringa da validare
 * @returns {boolean} true se la stringa è valida, false altrimenti
 */
export function isValidString(string) {
    // Controlla se la stringa è definita, non null, di tipo string e non vuota
    if (string === undefined || string === null || typeof string !== 'string' || string.trim() === '') {
        return false;
    }
    return true;
}

/**
 * Verifica se una data è valida nel formato AAAA-MM-GG
 * 
 * @param {string} string - Data da validare
 * @returns {boolean} true se la data è valida, false altrimenti
 */
export function isValidDate(string) {
    const dateRegex = /^\d{4}-\d{2}-\d{2}$/;
    
    if (!string || !dateRegex.test(string)) {
        return false;
    }
    
    const dateParts = string.split('-');
    const year = parseInt(dateParts[0], 10);
    const month = parseInt(dateParts[1], 10);
    const day = parseInt(dateParts[2], 10);

    // Validazione anno, mese e giorno
    const isValidYear = year >= 1000 && year <= 9999;
    const isValidMonth = month >= 1 && month <= 12;
    const isValidDay = day >= 1 && day <= new Date(year, month, 0).getDate();

    return isValidYear && isValidMonth && isValidDay;
}

/**
 * Verifica se una password è valida
 * 
 * @param {string} password - Password da validare
 * @returns {boolean} true se la password è valida, false altrimenti
 */
export function isValidPassword(password) {
    return isValidString(password) && password.length >= 7;
}

/**
 * Verifica se un indirizzo email è valido
 * 
 * @param {string} email - Email da validare
 * @returns {boolean} true se l'email è valida, false altrimenti
 */
export function isValidEmail(email) {
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    return emailRegex.test(email);
}

/**
 * Verifica se un username è valido
 * 
 * @param {string} username - Username da validare
 * @returns {boolean} true se l'username è valido, false altrimenti
 */
export function isValidUsername(username) {
    // Verifica che sia una stringa
    if (typeof username !== 'string') {
        return false;
    }
    
    // Verifica lunghezza (tra 4 e 16 caratteri)
    if (username.length > 16 || username.length < 4) {
        return false;
    }
    
    // Verifica che non contenga spazi
    if (username.includes(' ')) {
        return false;
    }
    
    return true;
}

// ============================================================================
// FUNZIONI DI CRITTOGRAFIA
// ============================================================================

/**
 * Genera un hash MD5 da una stringa
 * 
 * @param {string} str - Stringa da convertire in hash
 * @returns {string} Hash MD5 della stringa
 */
export function getMD5(str) {
    return createHash('md5')
        .update(str)
        .digest('hex');
}

// ============================================================================
// FUNZIONI MATEMATICHE
// ============================================================================

/**
 * Genera un numero intero casuale tra min e max
 * 
 * @param {number} min - Valore minimo (incluso)
 * @param {number} max - Valore massimo (incluso)
 * @returns {number} Numero casuale generato
 */
export async function getRandomInt(min, max) {
    // Controlla che min sia minore di max. Se non lo è, li scambia
    if (min > max) {
        [min, max] = [max, min];
    }
    
    // Arrotonda i numeri per sicurezza
    min = Math.ceil(min);
    max = Math.floor(max);
    
    // Formula per generare un numero casuale tra min e max
    return Math.floor(Math.random() * (max - min + 1)) + min;
}