import { useState, useEffect, useRef, useCallback } from "react";

/**
 * @typedef {Object} hookOptions - Options provided for using this Hook
 * @property {String} serviceId - The serviceId of the GlobalStore. Defaults to GlobalStore
 * @property {jokiInstance} joki - The instance of Joki where the GlobalStore Service is located.
 *
 * @param {*} key
 * @param {*} initialvalue
 * @param {*} param2
 */
export default function useGlobalStore(key, initialValue = null, hookOptions) {
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
    useEffect(() => {
        return _options.joki.on({
            from: _options.serviceId,
            key: _options.joki.options("fullUpdateEventKey"),
            fn: event => {
                if (event.body.has(key)) {
                    setValue(event.body.get(key));
                } else {
                    setValue(undefined);
                }
            },
        });
    }, [key]);

    // Single value update
    useEffect(() => {
        return _options.joki.on({
            from: _options.serviceId,
            key: _options.joki.options("singleUpdateEventKey"),
            fn: event => {
                if (event.body.key === key) {
                    if (event.body.isDeleted === true) {
                        setValue(undefined);
                    } else {
                        if (event.body.value !== value) {
                            setValue(event.body.value);
                        }
                    }
                }
            },
        });
    }, [key, value]);

    const setNewValue = useCallback(newValue => {}, [key]);

    return [value, setNewValue];
}
