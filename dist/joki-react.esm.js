import { useState, useEffect, useCallback } from 'react';

const _DEFAULTOPTIONS = {
    initialValue: null
};

function getInitialServiceState(joki, serviceId) {
    return new Promise((resolve, reject) => {
        const getStateKey = joki.options("serviceGetStateEventKey")
            ? joki.options("serviceGetStateEventKey")
            : "getServiceState";
        joki.ask({
            to: serviceId,
            key: getStateKey,
        }).then(res => {
            resolve(res[serviceId]);
        });
    });
}

function useService(serviceId, jokiInstance, options = _DEFAULTOPTIONS) {
    const [serviceState, setServiceState] = useState(options.initialValue);

    // Get initial state from Joki service
    useEffect(() => {
        async function initializeHookData() {
            const results = await getInitialServiceState(jokiInstance, serviceId);
            if (results instanceof Promise) {
                results.then(res => {
                    setServiceState(res);
                });
            } else {
                setServiceState(results);
            }
        }
        initializeHookData();
    }, [serviceId, jokiInstance]);

    // Listen for full data updates
    useEffect(() => {
        const fullUpdateKey = jokiInstance.options("fullUpdateEventKey")
            ? jokiInstance.options("fullUpdateEventKey")
            : "fullUpdate";
        return jokiInstance.on({
            from: serviceId,
            key: fullUpdateKey,
            fn: event => {
                setServiceState(event.body);
            },
        });
    }, [serviceId, jokiInstance]);


    const ask = useCallback(async (key, body=undefined, options={}) => {
        const eventObject = {
            to: serviceId,
            key: key,
            async: options.async !== undefined ? options.async : true
        };
        if(body !== undefined) {
            eventObject.body = body;
        }
        const results = await jokiInstance.ask(eventObject);
        return results[serviceId];
        
    }, [serviceId]);

    const trigger = useCallback( (key, body, options={}) => {
        const eventObject = {
            to: serviceId,
            key: key,
            async: options.async !== undefined ? options.async : true
        };
        if(body !== undefined) {
            eventObject.body = body;
        }

        jokiInstance.trigger(eventObject);
    }, [serviceId]);

    return [serviceState, {ask, trigger}];
}

/**
 * Validate options provided for the Service
 *
 * If the provided options are valid this function will return undefined. If any errors are found, this function will throw.
 *
 * @param {object} serviceOptions - Options provided to the service
 * @param {function|null} initialDataValidationFn - Validation function for initial data set, null if not validated here
 * @returns {undefined|TypeError} Returns undefined if all is valid, otherwise throws a TypeError
 */
function serviceOptionsValidator(serviceOptions, initialDataValidationFn = null) {
    if (typeof serviceOptions === "string" || typeof serviceOptions === "symbol") {
        return undefined;
    }

    if (typeof serviceOptions !== "object") {
        throw new TypeError(ERRORS.noOptionsSet);
    }

    if (serviceOptions.serviceId === undefined || (typeof serviceOptions.serviceId !== "string" && typeof serviceOptions.serviceId !== "symbol")) {
        throw new TypeError(ERRORS.noServiceId);
    }

    if (serviceOptions.fullUpdateEventKey !== undefined && typeof serviceOptions.fullUpdateEventKey !== "string") {
        throw new TypeError(ERRORS.invalidUpdateEventKey);
    }

    if (
        serviceOptions.singleUpdateEventKey !== undefined &&
        (typeof serviceOptions.singleUpdateEventKey !== "string" && serviceOptions.singleUpdateEventKey !== null)
    ) {
        throw new TypeError(ERRORS.invalidUpdateEventKey);
    }

    if (
        serviceOptions.serviceGetStateEventKey !== undefined &&
        typeof serviceOptions.serviceGetStateEventKey !== "string"
    ) {
        throw new TypeError(ERRORS.invalidServiceGetStateEventKey);
    }

    if (serviceOptions.initial !== undefined) {
        if (typeof serviceOptions.initial !== "object") {
            throw new TypeError(ERRORS.invalidInitial);
        }

        const inits = serviceOptions.initial;

        if (inits.clearDuringInit !== undefined && typeof inits.clearDuringInit !== "boolean") {
            throw new TypeError(ERRORS.invalidInitial);
        }

        if (inits.setWhenCreated !== undefined && typeof inits.setWhenCreated !== "boolean") {
            throw new TypeError(ERRORS.invalidInitial);
        }

        if (inits.data !== undefined) {
            if (initialDataValidationFn !== null && typeof initialDataValidationFn === "function") {
                if (!initialDataValidationFn(inits.data, serviceOptions)) {
                    throw new TypeError(ERRORS.invalidInitialData);
                }
            }
        }
    }
}

const ERRORS = {
    // Joki Event Object Errors
    eventUndefined: "Event must be a plain JavaScript object",
    eventKeyInvalid: "Event argument key must be a String or an Array of Strings.",
    eventToInvalid: "Event argument to must be a String or an Array of Strings referencing to valid Service ids.",

    eventFromInvalid: "Event argument from  must be a String.",
    eventAsyncInvalid: "Event argument async  must be a boolean value.",
    eventCallingItself:
        "Event source and target (aka arguments from and to) cannot be the same. This could cause an infinite event loop.",

    eventBroadcastMissingFrom:
        "Broadcasted event must have a valid from argument defined as string. Preferably a service id, component name or 'JOKI' if internal.",
    eventBroadcastMissingData:
        "When sending broadcast, event must have some either body or key property defined in addition to the from. Empty broadcast events are considered harmful.",
    eventBroadcastNotAsynchronous:
        "Broadcast event cannot be sent asynchronously. Set the argument 'async' to true or leave it undefined.",
    eventBroadcastHasTarget: "Broadcast events must not have a target argument 'to' defined.",

    eventAskMissingData:
        "When triggering an 'ask()' event to a service with 'to' argument, atleast one of the following keys must also be present: from, body or key.",

    eventOnMissingHandler: "A listener must have an event handler defined as a function with 'fn' argument.",
    eventOnCannotHaveTo: "When creating a listener with 'on()' the argument 'to' cannot be included.",

    eventFunctionNotCalled: "Handler functions are only executed with listeners registered with 'on()' command.",

    // Joki Options Object Errors
    invalidJokiOptionsValue:
        "Options object provided for joki has invalid keys or values. valid keys are: debug(boolean), noInit(boolean), fullUpdateEventKey(string), singleUpdateEventKey(string), serviceGetStateEventKey(string), forcedEnvironment(string|null). Invalid type is:",
    invalidJokiOptions: "Options for joki must be either an undefined or an object.",
    invalidJokiEnvironment:
        "Valid forced environments for Joki are 'production', 'test' and 'development'. Disable environment forcing by setting this value to 'null'. Environment was set to be ",

    // Service Options Object Errors
    notJoki: "The first argument for a service must be an instance of Joki",
    noServiceId: "The options must have a serviceId defined",
    noOptionsSet:
        "The options must either be an object with serviceId key or a string that will be used as a serviceId",
    invalidServiceGetStateEventKey:
        "If alternative Event key for requesting current state of the service is provided it must be a string.",
    invalidUpdateEventKey:
        "If alternative keys for service updates and/or state requests are provided they must be Strings.",
    invalidInitial: `options.initial must be an object with following keys allowed: data in format required by the service; setWhenCreated as boolean; clearDuringInit as boolean OR a string that is understood to be a Service Id.`,
    invalidInitialData: "Initial options data is in invalid format.",
};

/**
 * Function for creating a service that stores data into a JavaScript Map
 *
 * Supported event keys: get, set, del, getServiceState
 *
 * @typedef {Object} jokiInstance Instance of Joki
 *
 * @typedef {Object} jokiEvent Event object for Joki
 * @property {String|Array} [key] The event key or an array of event keys
 * @property {String|Array} [to] The id of the service this event is targeted to or and array of ids.
 * @property {String} [from] Who sent the event. Usually an id of a service if populated.
 * @property {Boolean} [async=true] Only valid with joki.ask function. If set to false, the ask is not wrapped in promise. Defaults to true
 * @property {any} [body] The data sent with the event
 *
 * @typedef {Object} initialOptions Setting up the initial data for this service
 * @property {boolen} [setWhenCreated] Defaults to false and then initialization is done during initialization event
 * @property {Map|function} [data] The Data map set as the initial value or a function that returns the values. Function works only during initialization event.
 * @property {bool} [clearDuringInit] Clear data when initialization event is ran. Defaults to true
 *
 * @typedef {Object|String} serviceOptions - Options for this service as an object or as a plain string that is considered to be a serviceId
 * @property {String} serviceId - The id used for this service
 * @property {initialOptions} [initial] - Options for initialization the data in the service
 * @property {String} [fullUpdateEventKey] - Overrides the setting of the same name given to joki instance during createJoki()
 * @property {String} [singleUpdateEventKey] - Overrides the setting of the same name given to joki instance during createJoki()
 * @property {String} [serviceGetStateEventKey] - Overrides the setting of the same name given to joki instance during createJoki()
 *
 * @param {jokiInstance} jokiInstance Instance of Joki
 * @param {serviceOptions} serviceOptions Object of options
 */
function createMapService(jokiInstance, serviceOptions = {}) {
    // Validate Service Options
    serviceOptionsValidator(serviceOptions, (data, fullOptions) => {
        if (typeof data === "object") {
            if (Array.isArray(data) || data instanceof Map) {
                return true;
            }
        }
        if (typeof data === "function" && fullOptions.initial.setWhenCreated === false) {
            return true;
        }
        return false;
    });

    const _options =
        typeof serviceOptions === "object"
            ? serviceOptions
            : typeof serviceOptions === "string"
            ? { serviceId: serviceOptions }
            : null;

    const serviceId = _options.serviceId;
    const joki = jokiInstance;

    //TODO: Copy clearDuringInit from createReducerService and fix tests accordingly
    const initialOptions =
        _options.initial !== undefined
            ? Object.assign({}, { setWhenCreated: false, clearDuringInit: true }, _options.initial)
            : { setWhenCreated: false, clearDuringInit: true };

    // Data initialization
    const data =
        initialOptions.setWhenCreated === true && initialOptions.data !== undefined
            ? new Map(initialOptions.data)
            : new Map();

    const updateEventKeyFull =
        _options.fullUpdateEventKey !== undefined && typeof _options.fullUpdateEventKey === "string"
            ? _options.fullUpdateEventKey
            : joki.options("fullUpdateEventKey");

    const updateEventKeySingle =
        _options.singleUpdateEventKey !== undefined && typeof _options.singleUpdateEventKey === "string"
            ? _options.singleUpdateEventKey
            : _options.singleUpdateEventKey === null
            ? null
            : joki.options("singleUpdateEventKey");

    const serviceGetStateEventKey =
        _options.serviceGetStateEventKey !== undefined
            ? _options.serviceGetStateEventKey
            : joki.options("serviceGetStateEventKey");

    /**
     * The event handler function for Map Service
     *
     * @param {jokiEvent} event The event object that has triggered this service
     * @returns {Map|boolean|undefined|any} Return value depends on the event key that is triggered and values contained in the service
     */
    function eventHandler(event) {
        if (event.key === "initialize" && event.from === "JOKI") {
            init();
            return;
        }
        switch (event.key) {
            case "get":
                if (event.body === undefined) {
                    return new Map(data);
                }
                return data.has(event.body) ? data.get(event.body) : undefined;
            case "set":
                data.set(event.body.key, event.body.value);
                triggerSingleServiceUpdate(event.body.key, event.body.value);
                triggerFullServiceUpdate();

                break;
            case "del":
                if (data.has(event.body)) {
                    data.delete(event.body);
                    triggerSingleServiceUpdate(event.body, undefined, true);
                    triggerFullServiceUpdate();
                }
                break;
            // Update the existing data with the sent data
            case "update":
                if (event.to === serviceId && event.body !== undefined && event.body instanceof Map) {
                    update(event.body);
                }
                break;
            case "replace":
                if (event.to === serviceId && event.body !== undefined && event.body instanceof Map) {
                    replace(event.body);
                }
                break;
            case "clear":
                if (event.to === serviceId) {
                    data.clear();
                    triggerFullServiceUpdate();
                }
                break;
            case "has":
                return data.has(event.body);
            case "filter":
                return filteredData(event.body);
            case "getServiceState":
                return new Map(data);
            default:
                return;
        }
    }

    /**
     * Initialization function ran when Joki sends an initialization event.
     *
     * This initialization event is triggered with joki.initServices() function.
     */
    function init() {
        if (initialOptions.clearDuringInit !== false) {
            data.clear();
        }
        if (initialOptions.setWhenCreated === false && initialOptions.data !== undefined) {
            if (typeof initialOptions.data === "function") {
                const values = initialOptions.data();
                if (!(values instanceof Map)) {
                    throw new TypeError("Data returned from the initial data function must be a Map.");
                }
                values.forEach((v, k) => {
                    data.set(k, v);
                });
                return;
            }
            initialOptions.data.forEach((v, k) => {
                data.set(k, v);
            });
        }
    }

    /**
     * Replace current data set with a new one
     * 
     * @param {Map} newDataMap 
     */
    function replace(newDataMap) {
        data.clear();
        update(newDataMap);
    }

    /**
     * Update all keys that exist with their new values and add those keys that are not present yet
     * 
     * @param {Map} newDataMap 
     */
    function update(newDataMap) {
        newDataMap.forEach((value, key) => {
            data.set(key, value);
        });
        triggerFullServiceUpdate();
    }

    /**
     * Filter the current data set with filter rules provided within the event.body
     *
     * The type of the filter changes the rules how the Map is filtered.
     *
     * String - checks if the itemKey contains this String
     * Array - checks
     *
     * @param {Array|String|function} filter If the
     */
    function filteredData(filter) {
        const filteredMap = new Map();

        function isItemValid(itemValue, itemKey, filter) {
            if (typeof filter === "function") {
                filter(itemValue, itemKey);
            }
            if (Array.isArray(filter)) {
                return filter.find(itemKey) !== undefined;
            }

            if (typeof filter === "string") {
                return itemKey.includes(filter);
            }

            return false;
        }

        data.forEach(itemValue, itemKey => {
            if (isItemValid(itemValue, itemKey, filter)) {
                filteredMap.set(itemKey, itemValue);
            }
        });

        return filteredMap;
    }

    function triggerFullServiceUpdate() {
        joki.trigger({
            from: serviceId,
            key: updateEventKeyFull,
            serviceUpdate: true,
            body: new Map(data),
        });
    }

    function triggerSingleServiceUpdate(key, value, isDeleted = false) {
        if (updateEventKeySingle !== null) {
            if (isDeleted) {
                joki.trigger({
                    from: serviceId,
                    key: updateEventKeySingle,
                    serviceUpdate: true,
                    body: {
                        key: key,
                        isDeleted: true,
                    },
                });
            } else {
                joki.trigger({
                    from: serviceId,
                    key: updateEventKeySingle,
                    serviceUpdate: true,
                    body: {
                        key: key,
                        value: value,
                    },
                });
            }
        }
    }

    joki.addService({
        id: serviceId,
        fn: eventHandler,
    });
}

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

/**
 * 
 * @param {jokiInstance} jokiInstance 
 * @param {serviceOptions} options 
 */
function createGlobalStore(jokiInstance, options={}) {

    if(options.serviceId === undefined) {
        options.serviceId = "GlobalStore";
    }

    createMapService(jokiInstance, options);
}

/**
 * @typedef {Object} hookOptions - Options provided for using this Hook
 * @property {String} serviceId - The serviceId of the GlobalStore. Defaults to GlobalStore
 * @property {jokiInstance} joki - The instance of Joki where the GlobalStore Service is located.
 *
 * @param {*} key
 * @param {*} initialvalue
 * @param {*} param2
 */
function useGlobalStore(key, initialValue = null, hookOptions) {
    const _options = Object.assign({}, { serviceId: "GlobalStore", joki: undefined }, hookOptions);

    if (_options.joki === undefined) {
        throw new Error("useGlobalStore must has the 'joki' property defined in hookOptions");
    }

    const [value, setValue] = useState(initialValue);

    // Get initial value
    useEffect(() => {
        async function askInitialValue() {
            const response = await _options.joki.ask({
                to: _options.serviceId,
                key: "get",
                body: key,
            });

            setValue(response[_options.serviceId]);
        }
        askInitialValue();
    }, [key]);

    // Check full updates of state for value
    useEffect( () => {
        return _options.joki.on({
            from: _options.serviceId,
            key: _options.joki.options("fullUpdateEventKey"),
            fn: (event) => {
                if(event.body.has(key)) {
                    setValue(event.body.get(key));
                } else {
                    setValue(undefined);
                }
            }
        });
    }, [key]);

    // Single value update
    useEffect( () => {
        
        return _options.joki.on({
            from: _options.serviceId,
            key: _options.joki.options("singleUpdateEventKey"),
            fn: (event) => {
                if(event.body.key === key) {
                    if(event.body.isDeleted === true) {
                        setValue(undefined);
                    } else {
                      if(event.body.value !== value) {
                        setValue(event.body.value)  ;
                      }
                    }
                }
            }
        });
    }, [key, value]);





    const setNewValue = useCallback(newValue => {}, [key]);

    return [value, setNewValue];
}

const identifier$1 = "0.1.0";

export { useService, createGlobalStore, useGlobalStore, identifier$1 as identifier };
