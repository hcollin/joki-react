(function (global, factory) {
    typeof exports === 'object' && typeof module !== 'undefined' ? factory(exports, require('react'), require('joki')) :
    typeof define === 'function' && define.amd ? define(['exports', 'react', 'joki'], factory) :
    (factory((global['joki-react'] = {}),global.React,null));
}(this, (function (exports,react,joki) { 'use strict';

    const _DEFAULTOPTIONS = {
        initialValue: null
    };

    function getInitialServiceState(joki$$1, serviceId) {
        return new Promise((resolve, reject) => {
            const getStateKey = joki$$1.options("serviceGetStateEventKey")
                ? joki$$1.options("serviceGetStateEventKey")
                : "getServiceState";
            joki$$1.ask({
                to: serviceId,
                key: getStateKey,
            }).then(res => {
                resolve(res[serviceId]);
            });
        });
    }

    function useService(serviceId, jokiInstance, options = _DEFAULTOPTIONS) {
        const [serviceState, setServiceState] = react.useState(options.initialValue);

        // Get initial state from Joki service
        react.useEffect(() => {
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
        react.useEffect(() => {
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


        const ask = react.useCallback(async (key, body=undefined, options={}) => {
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

        const trigger = react.useCallback( (key, body, options={}) => {
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

        joki.createMapService(jokiInstance, options);
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

        const [value, setValue] = react.useState(initialValue);

        // Get initial value
        react.useEffect(() => {
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
        react.useEffect( () => {
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
        react.useEffect( () => {
            
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





        const setNewValue = react.useCallback(newValue => {}, [key]);

        return [value, setNewValue];
    }

    const identifier = "0.1.0";

    exports.useService = useService;
    exports.createGlobalStore = createGlobalStore;
    exports.useGlobalStore = useGlobalStore;
    exports.identifier = identifier;

    Object.defineProperty(exports, '__esModule', { value: true });

})));
