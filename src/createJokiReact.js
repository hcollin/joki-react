import { createJoki } from 'joki';

export default function createJokiReact() {

    const joki = createJoki();
    

    function trigger(jokiEvent) {
        return joki.trigger(jokiEvent);
    }

    function broadcast(jokiEvent) {
        return joki.broadcast(jokiEvent);
    }

    function ask(jokiEvent) {
        return joki.ask(jokiEvent);
    }

    function on(jokiSubscriber) {
        return joki.on(jokiSubscriber);
    }

    return {
        joki,
        trigger,
        ask,
        on,
        broadcast

    }
}
