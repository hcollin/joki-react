import { createJoki } from 'joki';

/**
 * 
 * @typedef {Object} masterOptions - Main options given for React-Joki integration
 * @property {Object} jokiOptions - 
 * 
 * 
 * @typedef
 * 
 * @param {Object} options 
 */
export default function createJokiReact(options) {

    const joki = createJoki(options.joki ? options.joki : {});




    return {
        joki
    }
}
