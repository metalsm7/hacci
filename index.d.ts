interface HacciOption {
    el: Element | null;
    template: string | null;
    data: any;
    method: any;
    created: Function | null;
    mounted: Function | null;
    destroyed: Function | null;
}
declare class Hacci {
    private _el;
    private _template;
    private _refs;
    private _on;
    private _event_listeners;
    constructor(option?: HacciOption | null);
    private init;
    refresh(): void;
    private clearEventListeners;
    private registEventListener;
    private callMethod;
    private observeElement;
    destroy(): void;
    mount(el: Element | null): Hacci;
    readonly el: Element | null;
    readonly refs: any;
}
export { Hacci };
