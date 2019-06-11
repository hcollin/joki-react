import { useState, useEffect, useCallback } from "react";

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

export default function useService(serviceId, jokiInstance, options = _DEFAULTOPTIONS) {
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
            eventObject.body = body
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
            eventObject.body = body
        }

        jokiInstance.trigger(eventObject);
    }, [serviceId]);

    return [serviceState, {ask, trigger}];
}
