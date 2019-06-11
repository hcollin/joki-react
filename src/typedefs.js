/**
 * An instance of Joki
 * @typedef {Object} jokiInstance - an Instance of joki
 *
 *
 */

/**
 * Default options for Joki Services
 * @typedef {Object|String} serviceOptions - Options for this service as an object or as a plain string that is considered to be a serviceId
 * @property {String} serviceId - The id used for this service
 * @property {initialOptions} [initial] - Options for initialization the data in the service
 * @property {String} [fullUpdateEventKey] - Overrides the setting of the same name given to joki instance during createJoki()
 * @property {String} [singleUpdateEventKey] - Overrides the setting of the same name given to joki instance during createJoki()
 * @property {String} [serviceGetStateEventKey] - Overrides the setting of the same name given to joki instance during createJoki()}
 *
 * Initial options for Joki Service
 * @typedef {Object} initialOptions Setting up the initial data for this service
 * @property {boolen} [setWhenCreated] Defaults to false and then initialization is done during initialization event
 * @property {Map|function} [data] The Data map set as the initial value or a function that returns the values. Function works only during initialization event.
 * @property {bool} [clearDuringInit] Clear data when initialization event is ran. Defaults to true
 */

/**
 * Joki Event Object
 * 
 * @typedef {Object} jokiEvent Event object for Joki
 * @property {String|Array} [key] The event key or an array of event keys
 * @property {String|Array} [to] The id of the service this event is targeted to or and array of ids.
 * @property {String} [from] Who sent the event. Usually an id of a service if populated.
 * @property {Boolean} [async=true] Only valid with joki.ask function. If set to false, the ask is not wrapped in promise. Defaults to true
 * @property {any} [body] The data sent with the event
 */
