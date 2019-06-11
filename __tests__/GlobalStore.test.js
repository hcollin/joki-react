const JokiReact = require("../dist/joki-react.umd");
const { createJoki } = require("joki");
const { useState } = require("react");

const { renderHook, act } = require("react-hooks-testing-library");

describe("GlobalStore Service tests", () => {
    it("Create new GlobalStore Service", () => {
        const joki = createJoki();
        JokiReact.createGlobalStore(joki);
        expect(joki.listServices()).toEqual(["GlobalStore"]);
    });

    it("GlobalStore must follow Joki MapService patterns", async () => {
        const joki = createJoki();
        JokiReact.createGlobalStore(joki);

        // Set new value
        joki.trigger({
            to: "GlobalStore",
            key: "set",
            body: {
                key: "foo",
                value: "bar",
            },
        });

        // Get new value
        expect(
            await joki.ask({
                to: "GlobalStore",
                key: "get",
                body: "foo",
                async: false,
            })
        ).toEqual({ GlobalStore: "bar" });

        // Delete value
        joki.trigger({
            to: "GlobalStore",
            key: "del",
            body: "foo",
        });

        // No value anymore
        expect(
            await joki.ask({
                to: "GlobalStore",
                key: "get",
                body: "foo",
                async: false,
            })
        ).toEqual({ GlobalStore: undefined });
    });
});

describe("useGlobalStore hook", () => {
    it("useGlobalStore Hook", async () => {
        const joki = createJoki();
        JokiReact.createGlobalStore(joki);

        act(() => {
            joki.trigger({
                to: "GlobalStore",
                key: "set",
                body: {
                    key: "foo",
                    value: "bar",
                },
            });
        });

        expect(
            await joki.ask({
                to: "GlobalStore",
                key: "get",
                body: "foo",
                async: false,
            })
        ).toEqual({ GlobalStore: "bar" });

        const { result, waitForNextUpdate } = renderHook(() =>
            JokiReact.useGlobalStore("foo", null, {
                serviceId: "GlobalStore",
                joki: joki,
            })
        );
        expect(result.current[0]).toEqual(null);
        await act(() => waitForNextUpdate());
        expect(result.current[0]).toEqual("bar");

        act(() => {
            joki.trigger({
                to: "GlobalStore",
                key: "set",
                body: {
                    key: "foo",
                    value: "alpha",
                },
            });
        });

        expect(result.current[0]).toEqual("alpha");
    });
});
