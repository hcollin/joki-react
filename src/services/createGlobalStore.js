import {createMapService} from 'joki';

import "../typedefs.js";

/**
 * 
 * @param {jokiInstance} jokiInstance 
 * @param {serviceOptions} options 
 */
export default function createGlobalStore(jokiInstance, options={}) {

    if(options.serviceId === undefined) {
        options.serviceId = "GlobalStore"
    }

    createMapService(jokiInstance, options);
}
