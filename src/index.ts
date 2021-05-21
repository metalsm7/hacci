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
    // private _v_refs: any = {};
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
        Hacci.instances[this._id] = this;
        //
        // Object.prototype['findVal'] = function (str: string): any {
        //     const idx = str.indexOf('.');
        //     if (idx > 0) {
        //         const key = str.substring(0, idx);
        //         return this[key].findVal(str.substring(idx + 1));
        //     };
        //     return this[str];
        // }
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
            //
            // this['listener'] = function(key, val) {
            //     console.log(`${key}.set = ${val}`);
            //     if (this._v_refs[key]) {
            //         for (let cnti = 0; cnti < this._v_refs[key].length; cnti++) {
            //             this._v_refs[key][cnti].value = val;
            //         }
            //     }
            // };
            //
            const data_keys = Object.keys(option.data);
            for (let cnti: number = 0; cnti < data_keys.length; cnti++) {
                this[data_keys[cnti]] = option.data[data_keys[cnti]];
                // console.log(`this.${data_keys[cnti]}: ${JSON.stringify(option.data[data_keys[cnti]])}`);
                // this['__' + data_keys[cnti]] = option.data[data_keys[cnti]];
                //
                // this.redefineProperty(this, data_keys[cnti]);
                //
                // let elementPrototype = Object.getPrototypeOf(this);
                // let descriptor = Object.getOwnPropertyDescriptor(elementPrototype, data_keys[cnti]);
                // Object.defineProperty(this, data_keys[cnti], {
                //     get: function() {
                //         // console.log(`${data_keys[cnti]}.get:${this[data_keys[cnti]]}`);
                //         return this['__' + data_keys[cnti]];
                //     },
                //     set: function(val) {
                //         this['__' + data_keys[cnti]] = val;
                //         this.listener(data_keys[cnti], val);
                //         return val;
                //     }
                // });
            }
        }
        //
        if (option.method) {
            const method_keys = Object.keys(option.method);
            for (let cnti: number = 0; cnti < method_keys.length; cnti++) {
                // this[method_keys[cnti]] = eval(option.method[method_keys[cnti]].toString());
                // eval(`this.${method_keys[cnti]} = ${option.method[method_keys[cnti]].toString()}`);
                // if (typeof option.method[method_keys[cnti]].prototype === 'undefined') {
                //     // is arrow function
                //     let fn_str = option.method[method_keys[cnti]].toString();
                //     fn_str = `return function${fn_str.replace(/\)\s*=>.*{(.|\r|\n)*/, ')')}${fn_str.replace(/^.*=>\s*{/, '{')}`;
                //     this[method_keys[cnti]] = new Function(fn_str)();
                // }
                // else {
                //     // is not arrow function
                //     this[method_keys[cnti]] = option.method[method_keys[cnti]].bind(this);
                // }
                this[method_keys[cnti]] = this.fromArrowFunc(option.method[method_keys[cnti]]).bind(this);
            }
        }
        //
        // option.created && (this._on.created = eval(option.created.toString()));
        option.created && (this._on.created = this.fromArrowFunc(option.created).bind(this));
        // option.mounted && (this._on.mounted = eval(option.mounted.toString()));
        option.mounted && (this._on.mounted = this.fromArrowFunc(option.mounted).bind(this));
        // option.destroyed && (this._on.destroyed = eval(option.destroyed.toString()));
        option.destroyed && (this._on.destroyed = this.fromArrowFunc(option.destroyed).bind(this));

        //
        this._template && (this.el.innerHTML = this._template);

        //
        this._on && this._on.created && this._on.created();
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
                                        const event_name = (['select-one', 'select-multiple'].indexOf(obj['type']) > -1) ? 'change' : 'input';
                                        let event = null;
                                        if(typeof(Event) === 'function') {
                                            event = new Event(event_name);
                                        }
                                        else {
                                            event = document.createEvent('Event');
                                            event.initEvent(event_name, true, true);
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
                                // (obj as HTMLInputElement).value = this.findVal(obj, attrs[cnti].value); // this[attrs[cnti].value];
                                this.findVal(obj, attrs[cnti].value); // this[attrs[cnti].value];
                                // eval(`obj.value = this.${attrs[cnti].value}`);
                                // !this._v_refs[attrs[cnti].value] && (this._v_refs[attrs[cnti].value] = []);
                                // this._v_refs[attrs[cnti].value].push(obj);
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
                            case 'hc:text':
                                (obj as HTMLInputElement).innerText = this[attrs[cnti].value];
                                break;
                            case 'hc:html':
                                (obj as HTMLInputElement).innerHTML = this[attrs[cnti].value];
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
        this.clearData();
        //
        this.clearEventListeners();
        //
        this.init();
    }

    public clearData() {
        //
        const regx = new RegExp(/^__hc\.v_.+/);
        //
        const keys = Object.keys(this);
        for (let cnti: number = 0; cnti < keys.length; cnti++) {
            if (regx.test(keys[cnti])) {
                //

                //
                delete this[keys[cnti]];
            }
        }
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

    // fincout is arrow function
    private isArrowFunc(func: Function): boolean {
        return typeof func.prototype === 'undefined';
    }

    // arrow function to ES5 function (resolving "this" problem)
    private fromArrowFunc(func: Function): Function {
        if (this.isArrowFunc(func)) {
            // is arrow function
            let fn_str = func.toString();
            fn_str = "return function" + 
                ((fn_str.substring(0, 1) === '(' ? '' : '(')) + 
                fn_str.replace(/\)?\s*=>.*{(.|\r|\n)*/, ')') + 
                fn_str.replace(/^.*=>\s*{/, '{');
            return new Function(fn_str)();
        }
        return func;
    }

    private findVal(obj: any, keys: string, val: any = null, src: any = null): any {
        //
        !src && (src = this);
        //
        const idx = keys.indexOf('.');
        if (idx > 0) {
            const key = keys.substring(0, idx);
            // console.log(`findVal - keys:${keys} / key:${key}`);

            // redefineProperty
            !src['__hc.lstn'] && (
                src['__hc.lstn'] = function(key: string, val: any) {
                    console.log(`${key}.set = ${val}`);
                    // console.log(`_v_refs:${JSON.stringify(this._v_refs)}`);
                }
            );
            //
            src['__hc.v_' + key] = src[key];
            Object.defineProperty(src, key, {
                get: function() {
                    // console.log(`${data_keys[cnti]}.get:${this[data_keys[cnti]]}`);
                    return src['__hc.v_' + key];
                },
                set: function(val) {
                    src['__hc.v_' + key] = val;
                    src['__hc.lstn'](key, val);
                    return val;
                }
            });
            //
            return src.findVal(obj, keys.substring(idx + 1), val, src[key]);
        }
        //
        val && (src[keys] = val);
        // console.log(`findVal.last - keys:${keys}`);
        // redefineProperty
        !src['__hc.lstn'] && (
            src['__hc.lstn'] = function(key: string, val: any) {
                console.log(`${key}.set = ${val}`);
                // console.log(`_v_refs:${JSON.stringify(this._v_refs)}`);
                if (this['__hc.refs'][key]) {
                    for (let cnti = 0; cnti < this['__hc.refs'][key].length; cnti++) {
                        this['__hc.refs'][key][cnti].value = val;
                    }
                }
            }
        );
        //
        !src['__hc.refs'] && (src['__hc.refs'] = {});
        !src['__hc.refs'][keys] && (src['__hc.refs'][keys] = []);
        src['__hc.refs'][keys].indexOf(obj) < 0 && src['__hc.refs'][keys].push(obj);
        //
        src['__hc.v_' + keys] = src[keys];
        Object.defineProperty(src, keys, {
            get: function() {
                // console.log(`${data_keys[cnti]}.get:${this[data_keys[cnti]]}`);
                return src['__hc.v_' + keys];
            },
            set: function(val) {
                src['__hc.v_' + keys] = val;
                src['__hc.lstn'](keys, val);
                return val;
            }
        });
        // console.log(src);
        //
        (obj as HTMLInputElement).value = src[keys];
        //
        return src[keys];
    }

    // private redefineProperty(key: string) {
    //     //
    //     !this['listener'] && (
    //         this['listener'] = function(key, val) {
    //             console.log(`${key}.set = ${val}`);
    //             if (this._v_refs[key]) {
    //                 for (let cnti = 0; cnti < this._v_refs[key].length; cnti++) {
    //                     this._v_refs[key][cnti].value = val;
    //                 }
    //             }
    //         }
    //     );
    //     //
    //     Object.defineProperty(obj, key, {
    //         get: function() {
    //             // console.log(`${data_keys[cnti]}.get:${this[data_keys[cnti]]}`);
    //             return obj['__' + key];
    //         },
    //         set: function(val) {
    //             obj['__' + key] = val;
    //             this.listener(key, val);
    //             return val;
    //         }
    //     });
    // }

    public destroy() {
        //
        this.clearEventListeners();
        // initialize
        this._refs = {};
        //
        this._template && this.el.parentElement.removeChild(this.el);
        this._template = null;
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
