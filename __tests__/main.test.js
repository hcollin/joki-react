const JokiReact = require("../dist/joki-react.umd");
const { createJoki, createMockService, createMapService } = require("joki");
const { useState } = require("react");

const { renderHook, act } = require("react-hooks-testing-library");

describe("Testing joki-react package", () => {
    it("Check version match", () => {
        expect(JokiReact.identifier).toBe("0.1.0");
    });

    it("joki-react export validation", () => {
        expect(typeof JokiReact.useService).toBe("function");
    });
    
    it("Test that joki version and createMockService available", async () => {
        const joki = createJoki();
        createMockService(joki, "Service", {
            foo: "bar",
        });
        expect(joki.listServices()).toEqual(["Service"]);

        expect(
            await joki.ask({
                to: "Service",
                key: "foo",
                async: false,
            })
        ).toEqual({ Service: "bar" });
    });
});

describe("userService Hook", () => {
    function configureJoki(joki) {
        joki.options("fullUpdateEventKey", "fullUpdate"); // The key is not available in 0.9.1 yet.
        joki.options("singleUpdateEventKey", "partialUpdate"); // The key is not available in 0.9.1 yet.
        joki.options("serviceGetStateEventKey", "getServiceState"); // The key is not available in 0.9.1 yet.
    }

    function initJokiAndService(events, initialState = "Current State") {
        const joki = createJoki();
        configureJoki(joki);
        const getStateKey = joki.options("serviceGetStateEventKey");

        const mockedEvents = events
            ? events
            : {
                  foo: "bar",
              };
        mockedEvents[getStateKey] = initialState;

        createMockService(joki, "MockService", mockedEvents);
        return joki;
    }

    async function ask(joki, key, body, serviceId = "MockService") {
        const event = {
            to: serviceId,
            key: key,
            async: false,
        };
        if (body !== undefined) event.body = body;

        const res = await joki.ask(event);
        if (res.MockService instanceof Promise) {
            return await res.Mockservice;
        }
        return res.MockService;
    }

    it("Test helper function for this test", async () => {
        const joki = initJokiAndService();
        expect(joki.listServices()).toEqual(["MockService"]);
        expect(await ask(joki, "foo")).toBe("bar");
        expect(await ask(joki, joki.options("serviceGetStateEventKey"))).toBe("Current State");
    });

    it("Make sure the react-hooks-testing-library works", () => {
        const { result } = renderHook(() => useState(1));
        expect(result.current[0]).toBe(1);
        act(() => {
            result.current[1](2);
        });
        expect(result.current[0]).toBe(2);
    });

    it("Test useService Hook simple string data", async () => {
        const joki = initJokiAndService();
        expect(joki.listServices()).toEqual(["MockService"]);

        const { result, waitForNextUpdate } = renderHook(() => JokiReact.useService("MockService", joki));

        // Initial data from hook is null, untile the first request from service is recieved
        expect(result.current[0]).toEqual(null);
        expect(typeof result.current[1].ask).toBe("function");
        expect(typeof result.current[1].trigger).toBe("function");
        expect(Object.keys(result.current[1])).toEqual(["ask", "trigger"]);

        // Wait for the initial update
        await act(() => waitForNextUpdate());
        expect(result.current[0]).toEqual("Current State");

        // Imitate service update event
        act(() => {
            joki.trigger({
                from: "MockService",
                key: joki.options("fullUpdateEventKey"),
                body: "Updated content",
            });
        });

        expect(result.current[0]).toEqual("Updated content");
    });

    it("Test useService with Map based service", async () => {
        const joki = createJoki();
        configureJoki(joki);
        createMapService(joki, {
            serviceId: "MapService",
            initial: {
                setWhenCreated: true,
                data:  new Map([["foo", "bar"]]),
            }
        });
        expect(joki.listServices()).toEqual(["MapService"]);
        expect(await joki.ask({ to: "MapService", key: "get", body: "foo", async: false })).toEqual({
            MapService: "bar",
        });

        const { result, waitForNextUpdate } = renderHook(() => JokiReact.useService("MapService", joki));

        expect(result.current[0]).toEqual(null);
        await act(() => waitForNextUpdate());
        expect(result.current[0]).toEqual(new Map([["foo", "bar"]]));

        act(() => {
            joki.trigger({
                to: "MapService",
                key: "set",
                body: {
                    key: "alpha",
                    value: "a",
                },
            });
        });

        expect(result.current[0]).toEqual(new Map([["foo", "bar"], ["alpha", "a"]]));
    });

    it("Testing very Asynchronous code", async () => {
        const joki = createJoki();
        configureJoki(joki);
        const getStateKey = joki.options("serviceGetStateEventKey");
        const events = {
            test: "bar",
        };

        const mustBeCalled = jest.fn();
        events[getStateKey] = event => {
            return new Promise((res, rej) => {
                setTimeout(() => {
                    mustBeCalled();
                    res("foo");
                }, 1000);
            });
        };

        createMockService(joki, "Service", events);
        expect(joki.listServices()).toEqual(["Service"]);
        // expect(await joki.ask({ to: "Service", key: getStateKey, async: false })).toEqual({ Service: "bar" });

        const { result, waitForNextUpdate } = renderHook(() => JokiReact.useService("Service", joki));
        // await act(() => waitForNextUpdate());
        expect(result.current[0]).toEqual(null);
        await act(() => waitForNextUpdate());
        expect(result.current[0]).toEqual("foo");

        expect(mustBeCalled).toBeCalledTimes(1);
    });

    it("Testing Service trigger and ask", async () => {
        const joki = createJoki();
        configureJoki(joki);
        const events = {
            test: "bar",
            resend: () => {
                joki.trigger({
                    key: "Update",
                    body: "foo"
                });
            },
            "Update": () => {
                // This must not trigger
                expect(true).toBe(false);
            }
        };
        createMockService(joki, "Service", events);

        joki.on({
            key: "Update",
            fn: (event) => {
                expect(event.body).toBe("foo");
            }
        });

        const { result, waitForNextUpdate } = renderHook(() => JokiReact.useService("Service", joki));

        expect(result.current[0]).toEqual(null);
        await act(() => waitForNextUpdate());

        const Service = result.current[1];
        const res = await Service.ask("test");
        expect(res).toBe("bar");
        
        Service.trigger("resend");
        expect.assertions(3);
    });
});

// describe("dummy createMapService tests until joki 0.9.2 is released", () => {
//     it("Creating Service", async () => {
//         const joki = createJoki();
//         joki.options("fullUpdateEventKey", "fullUpdate"); // The key is not available in 0.9.1 yet.
//         const initData = new Map([["foo", "bar"]]);

//         const updateEvent = jest.fn();

//         createMapService(joki, {
//             data: initData,
//         });
//         expect(joki.listServices()).toEqual(["MapService"]);

//         joki.on({
//             from: "MapService",
//             key: joki.options("fullUpdateEventKey"),
//             fn: event => {
//                 updateEvent();
//             },
//         });

//         expect(await joki.ask({ to: "MapService", key: "get", body: "foo", async: false })).toEqual({
//             MapService: "bar",
//         });
//         joki.trigger({
//             to: "MapService",
//             key: "set",
//             body: {
//                 key: "foo",
//                 value: "foo",
//             },
//         });

//         expect(await joki.ask({ to: "MapService", key: "get", body: "foo", async: false })).toEqual({
//             MapService: "foo",
//         });
//         expect(updateEvent).toBeCalledTimes(1);
//     });
// });

// function createMapService(joki, options) {
//     const serviceId = options.serviceData ? options.serviceData : "MapService";

//     const data = new Map(options.data !== undefined ? options.data : []);

//     function eventHandler(event) {
//         if (event.to === serviceId && event.key === joki.options("serviceGetStateEventKey")) {
//             return new Map(data);
//         }

//         switch (event.key) {
//             case "get":
//                 return data.get(event.body);
//             case "set":
//                 data.set(event.body.key, event.body.value);
//                 triggerUpdateEvent();
//                 break;
//             default:
//                 break;
//         }
//     }

//     function triggerUpdateEvent() {
//         const updateKey = joki.options("fullUpdateEventKey");
//         joki.broadcast({
//             from: serviceId,
//             key: updateKey,
//             servicesOnly: false,
//             body: new Map(data),
//         });
//     }

//     joki.addService({
//         id: serviceId,
//         fn: eventHandler,
//     });
// }
