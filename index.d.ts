interface HacciOption {
    id: string | null;
    el: Element | null;
    template: string | null;
    data: any;
    computed: any;
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
    private _traces;
    private _txts_mstr;
    private _event_listeners;
    private _on;
    private _toi_input;
    private _toi_check;
    private _toi_select;
    private _bus;
    static readonly instances: any;
    constructor(option?: HacciOption | null);
    private init;
    private redefineModel;
    private applyModel;
    private arrayEventListener;
    private registEventListener;
    private clearEventListeners;
    private scrollHeight;
    private scrollTop;
    private innerHeight;
    refresh(): void;
    clearData(): void;
    private getRandomString;
    private createInstanceId;
    private createTagId;
    private isArrowFunc;
    private fromArrowFunc;
    private getCheckedValue;
    private getSelectedValue;
    private setCheckedValue;
    private setSelectedValue;
    on(event: string, callback: Function): void;
    off(event: string, callback?: Function): void;
    emit(event: string, ...args: any[]): number;
    destroy(): void;
    mount(el: Element | null): Hacci;
    readonly el: Element | null;
    readonly refs: any;
}
export { Hacci };
export default Hacci;
