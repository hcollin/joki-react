'use strict';

Object.defineProperty(exports, '__esModule', { value: true });

var react = require('react');

const _DEFAULTOPTIONS = {
    initialValue: null,
    testEnvironment: false,
    act: () => {},
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

    return [serviceState];
}

const identifier = "0.1.0";

exports.useService = useService;
exports.identifier = identifier;
