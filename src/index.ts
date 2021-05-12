interface HacciOption {
    el: Element|null,
    template: string|null, // for future development
    data: any;
    method: any;
    created: Function|null;
    mounted: Function|null;
    destroyed: Function|null;
}
interface HacciEventListener {
    el: Element|null;
    name: string|null;
    listener: EventListenerOrEventListenerObject|null;
}

class Hacci {
    //
    static _instances: any = {};
    //
    private _id: string = null;
    private _el: Element|null = null;
    private _template: string|null; // for future development
    //
    private _refs: any = {};
    //
    private _on: any = {
        created: null,
        mounted: null,
        destroyed: null,
    };
    //
    private _event_listeners: Array<HacciEventListener> = [];

    static get instances() {
        return Hacci._instances;
    }

    constructor(option: HacciOption|null = null) {
        //
        this._id = this.createInstanceId();
        //
        !option && (option = {
            el: null,
            template: null,
            data: null,
            method: null,
            created: null,
            mounted: null,
            destroyed: null,
        });
        //
        option.el && (this._el = option.el);
        //
        option.template && (this._template = option.template); // for future development
        //
        if (option.data) {
            const data_keys = Object.keys(option.data);
            for (let cnti: number = 0; cnti < data_keys.length; cnti++) {
                this[data_keys[cnti]] = option.data[data_keys[cnti]];
            }
        }
        //
        if (option.method) {
            const method_keys = Object.keys(option.method);
            for (let cnti: number = 0; cnti < method_keys.length; cnti++) {
                // this[method_keys[cnti]] = eval(option.method[method_keys[cnti]].toString());
                // eval(`this.${method_keys[cnti]} = ${option.method[method_keys[cnti]].toString()}`);
                this[method_keys[cnti]] = option.method[method_keys[cnti]].bind(this);
            }
        }
        //
        // option.created && (this._on.created = eval(option.created.toString()));
        option.created && (this._on.created = option.created.bind(this));
        // option.mounted && (this._on.mounted = eval(option.mounted.toString()));
        option.mounted && (this._on.mounted = option.mounted.bind(this));
        // option.destroyed && (this._on.destroyed = eval(option.destroyed.toString()));
        option.destroyed && (this._on.destroyed = option.destroyed.bind(this));

        //
        this._template && (this.el.innerHTML = this._template);

        //
        this._on && this._on.created && this._on.created();

        //
        Hacci.instances[this._id] = this;
    }

    private init() {
        if (this.el) {
            //
            const observer = new MutationObserver((mutationsList, observer) => {
                for(const mutation of mutationsList) {
                    if (mutation.type === 'childList') {
                        //
                        const nodes = mutation.removedNodes;
                        const content_removed = nodes && nodes.length > 0 && (nodes[0] === this.el);
                        if (content_removed) {
                            //
                            observer.disconnect();
                            //
                            this.clearEventListeners();
                            //
                            // this._on && this._on.destroyed && this._on.destroyed();
                            this.destroy();
                        }
                    }
                }
            });
            observer.observe(this.el.parentElement, { attributes: false, childList: true, subtree: false });

            //
            const objs: NodeList = this.el.querySelectorAll('*');
            for (let cnti = 0; cnti < objs.length; cnti++) {
                const obj = objs[cnti] as Element;
                //
                const attrs = obj['attributes'];
                //
                for (let cnti: number = 0; cnti < attrs.length; cnti++) {
                    if (/^hc:/.test(attrs[cnti].name)) {
                        //
                        switch (attrs[cnti].name) {
                            case 'hc:ref':
                                this._refs[attrs[cnti].value] = obj;
                                break;
                            case 'hc:click':
                                //
                                this.registEventListener(obj, 'click', attrs[cnti]);
                                break;
                            case 'hc:input':
                                
                                (['INPUT', 'SELECT'].indexOf(obj.tagName) > -1) &&
                                    (['radio', 'checkbox', 'select-one', 'select-multiple'].indexOf(obj['type']) > -1) &&
                                    this.registEventListener(obj, 'change', attrs[cnti]);
                                
                                (['INPUT', 'TEXTAREA'].indexOf(obj.tagName) > -1) &&
                                    (['text', 'textarea'].indexOf(obj['type']) > -1) &&
                                    this.registEventListener(obj, 'input', attrs[cnti]);

                                (['INPUT', 'TEXTAREA', 'SELECT'].indexOf(obj.tagName) > -1) &&
                                    (['text', 'textarea', 'select-one', 'select-multiple'].indexOf(obj['type']) > -1) && 
                                    this.observeElement(obj, 'value', (_old_val: any, _new_val: any) => {
                                        let event = null;
                                        if(typeof(Event) === 'function') {
                                            event = new Event('input');
                                        }
                                        else {
                                            event = document.createEvent('Event');
                                            event.initEvent('input', true, true);
                                        }
                                        obj.dispatchEvent(event);
                                    });
                                  
                                (['INPUT'].indexOf(obj.tagName) > -1) &&
                                    (['radio', 'checkbox'].indexOf(obj['type']) > -1) && 
                                    this.observeElement(obj, 'checked', (_old_val: any, _new_val: any) => {
                                        let event = null;
                                        if(typeof(Event) === 'function') {
                                            event = new Event('change');
                                        }
                                        else {
                                            event = document.createEvent('Event');
                                            event.initEvent('change', true, true);
                                        }
                                        obj.dispatchEvent(event);
                                    });
                                break;
                            case 'hc:value':
                                // obj.setAttribute('value', eval(`this.${attrs[cnti].value}`));
                                // (obj as HTMLInputElement).value = eval(`this.${attrs[cnti].value}`);
                                (obj as HTMLInputElement).value = this[attrs[cnti].value];
                                // eval(`obj.value = this.${attrs[cnti].value}`);
                                break;
                            case 'hc:checked':
                            case 'hc:selected':
                                // const checked = ['true', 'false'].includes(attrs[cnti].value) ? attrs[cnti].value === 'true' : eval(`this.${attrs[cnti].value}`);
                                // const checked = ['true', 'false'].includes(attrs[cnti].value) ? attrs[cnti].value === 'true' : this[attrs[cnti].value];
                                const checked = ['true', 'false'].indexOf(attrs[cnti].value) > -1 ? attrs[cnti].value === 'true' : this[attrs[cnti].value];
                                if (checked) {
                                    obj.setAttribute(attrs[cnti].name.substring(3), null);
                                }
                                else {
                                    obj.removeAttribute(attrs[cnti].name.substring(3));
                                }
                                break;
                        }
                    }
                }
            }
            /*
            objs.forEach((obj: Element, _key, _parent) => {
                const attrs = obj['attributes'];
                //
                //
                for (let cnti: number = 0; cnti < attrs.length; cnti++) {
                    if (/^hc:/.test(attrs[cnti].name)) {
                        //
                        switch (attrs[cnti].name) {
                            case 'hc:ref':
                                this._refs[attrs[cnti].value] = obj;
                                break;
                            case 'hc:click':
                                //
                                this.registEventListener(obj, 'click', attrs[cnti]);
                                break;
                            case 'hc:input':
                                this.registEventListener(obj, 'input', attrs[cnti]);
                                this.observeElement(obj, 'value', (_old_val: any, _new_val: any) => {
                                    let event = null;
                                    if(typeof(Event) === 'function') {
                                        event = new Event('input');
                                    }
                                    else {
                                        event = document.createEvent('Event');
                                        event.initEvent('input', true, true);
                                    }
                                    obj.dispatchEvent(event);
                                });
                                break;
                            case 'hc:value':
                                // obj.setAttribute('value', eval(`this.${attrs[cnti].value}`));
                                // (obj as HTMLInputElement).value = eval(`this.${attrs[cnti].value}`);
                                (obj as HTMLInputElement).value = this[attrs[cnti].value];
                                // eval(`obj.value = this.${attrs[cnti].value}`);
                                break;
                            case 'hc:checked':
                            case 'hc:selected':
                                // const checked = ['true', 'false'].includes(attrs[cnti].value) ? attrs[cnti].value === 'true' : eval(`this.${attrs[cnti].value}`);
                                const checked = ['true', 'false'].includes(attrs[cnti].value) ? attrs[cnti].value === 'true' : this[attrs[cnti].value];
                                if (checked) {
                                    obj.setAttribute(attrs[cnti].name.substring(3), null);
                                }
                                else {
                                    obj.removeAttribute(attrs[cnti].name.substring(3));
                                }
                                break;
                        }
                    }
                }
            });
            */
        }
        //
        this._on && this._on.mounted && this._on.mounted();
    }

    public refresh() {
        //
        this.clearEventListeners();
        //
        this.init();
    }

    private clearEventListeners() {
        //
        for (let cnti: number = 0; cnti < this._event_listeners.length; cnti++) {
            const listener: HacciEventListener = this._event_listeners[cnti];
            listener.el.removeEventListener(listener.name, listener.listener);
        }
        //
        this._event_listeners = [];
    }

    private registEventListener(el: Element, name: string, attr: any) {
        //
        const listener = (evt: Event) => {
            this.callMethod({ attr, evt })
        };
        //
        el.addEventListener(name, listener);
        //
        this._event_listeners.push({
            el, name, listener,
        });
    }

    private callMethod(option: any) {
        //
        // const has_bracket = option.attr.value.includes('(');
        const has_bracket = option.attr.value.indexOf('(') > -1;
        //
        const method_name = has_bracket ?
            option.attr.value.replace(/\(.*/, '') :
            option.attr.value;
        //
        if (has_bracket) {
            // has arguments
            const args = option.attr.value.replace(/^\w*\(/, '').replace(/\)$/, '').split(',');
            args.forEach((el, idx) => {
                let new_el = el.replace(/^\s*/, '').replace(/\s*$/, '');
                // if (new_el === '_event') {
                //     args[idx] = option.evt;
                // }
                // else {
                //     eval(`args[${idx}] = ${new_el}`);
                // }
                args[idx] = new_el === '_event' ? option.evt : eval(new_el);
            });
            //
            if (args.length < 2 && args[0] === '') args[0] = option.evt;
            //
            this[method_name](...args);
        }
        else {
            // no arguments
            this[method_name](option.evt);
        }
    }

    private observeElement(element, property, callback) {
        let elementPrototype = Object.getPrototypeOf(element);
        if (elementPrototype.hasOwnProperty(property)) {
            let descriptor = Object.getOwnPropertyDescriptor(elementPrototype, property);
            Object.defineProperty(element, property, {
                get: function() {
                    return descriptor.get.apply(this, arguments);
                },
                set: function () {
                    let old_val = this[property];
                    descriptor.set.apply(this, arguments);
                    let new_val = this[property];
                    callback && setTimeout(callback.bind(this, old_val, new_val), 0);
                    return new_val;
                }
            });
        }
    }

    private createInstanceId() {
        let rtn_val: string = '';
        for (let cnti: number = 0; cnti < 8; cnti++) {
            const code = Math.floor(Math.random() * 51);
            rtn_val += String.fromCharCode(code + (code < 26 ? 65 : 71));
        }
        rtn_val += '.' + Date.now();
        return rtn_val;
    }

    public destroy() {
        //
        this.clearEventListeners();
        // initialize
        this._refs = {};
        this._template = null;
        //
        this.el.parentElement.removeChild(this.el);
        //
        this._el = null;
        //
        this._on && this._on.destroyed && this._on.destroyed();
        //
        this._on = {
            created: null,
            mounted: null,
            destroyed: null,
        };
        //
        if (Hacci.instances[this._id]) {
            Hacci.instances[this._id] = null;
            delete Hacci.instances[this._id];
        }
    }

    //
    public mount(el: Element|null): Hacci {
        el && (this._el = el);
        //
        this.init();
        //
        return this;
    }

    //
    public get el(): Element|null {
        return this._el;
    }

    public get refs(): any {
        return this._refs;
    }
}

window['Hacci'] = Hacci;

export { Hacci };
