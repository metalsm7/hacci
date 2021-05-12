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
    static _instances: any;
    private _id;
    private _el;
    private _template;
    private _refs;
    private _on;
    private _event_listeners;
    static readonly instances: any;
    constructor(option?: HacciOption | null);
    private init;
    refresh(): void;
    private clearEventListeners;
    private registEventListener;
    private callMethod;
    private observeElement;
    private createInstanceId;
    private isArrowFunc;
    private fromArrowFunc;
    destroy(): void;
    mount(el: Element | null): Hacci;
    readonly el: Element | null;
    readonly refs: any;
}
export { Hacci };
