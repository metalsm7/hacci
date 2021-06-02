interface HacciOption {
    id: string | null;
    el: Element | null;
    template: string | null;
    data: any;
    method: any;
    created: Function | null;
    mounted: Function | null;
    destroyed: Function | null;
}
/**
 *
 */
declare class Hacci {
    static _instances: any;
    private _id;
    private _el;
    private _template;
    private _refs;
    private _traces;
    private _on;
    private _event_listeners;
    private _type_of_event_input;
    static readonly instances: any;
    constructor(option?: HacciOption | null);
    private init;
    refresh(): void;
    clearData(): void;
    private clearEventListeners;
    private modelTrigger;
    private registEventListener;
    private callMethod;
    private commitEvent;
    private createInstanceId;
    private isArrowFunc;
    private fromArrowFunc;
    private getCheckedValue;
    private getSelectedValue;
    private setCheckedValue;
    private setSelectedValue;
    private getVal;
    private setVal;
    private traceModel;
    destroy(): void;
    mount(el: Element | null): Hacci;
    readonly el: Element | null;
    readonly refs: any;
}
export { Hacci };
