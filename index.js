"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
var Hacci = /** @class */ (function () {
    function Hacci(option) {
        if (option === void 0) { option = null; }
        //
        this._id = null;
        this._el = null;
        //
        this._refs = {};
        // private _v_refs: any = {};
        //
        this._on = {
            created: null,
            mounted: null,
            destroyed: null,
        };
        //
        this._event_listeners = [];
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
            var data_keys = Object.keys(option.data);
            for (var cnti = 0; cnti < data_keys.length; cnti++) {
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
            var method_keys = Object.keys(option.method);
            for (var cnti = 0; cnti < method_keys.length; cnti++) {
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
    Object.defineProperty(Hacci, "instances", {
        get: function () {
            return Hacci._instances;
        },
        enumerable: true,
        configurable: true
    });
    Hacci.prototype.init = function () {
        var _this = this;
        if (this.el) {
            //
            var observer = new MutationObserver(function (mutationsList, observer) {
                for (var _i = 0, mutationsList_1 = mutationsList; _i < mutationsList_1.length; _i++) {
                    var mutation = mutationsList_1[_i];
                    if (mutation.type === 'childList') {
                        //
                        var nodes = mutation.removedNodes;
                        var content_removed = nodes && nodes.length > 0 && (nodes[0] === _this.el);
                        if (content_removed) {
                            //
                            observer.disconnect();
                            //
                            _this.clearEventListeners();
                            //
                            // this._on && this._on.destroyed && this._on.destroyed();
                            _this.destroy();
                        }
                    }
                }
            });
            observer.observe(this.el.parentElement, { attributes: false, childList: true, subtree: false });
            //
            var objs = this.el.querySelectorAll('*');
            var _loop_1 = function (cnti) {
                var obj = objs[cnti];
                //
                var attrs = obj['attributes'];
                //
                for (var cnti_1 = 0; cnti_1 < attrs.length; cnti_1++) {
                    if (/^hc:/.test(attrs[cnti_1].name)) {
                        //
                        switch (attrs[cnti_1].name) {
                            case 'hc:ref':
                                this_1._refs[attrs[cnti_1].value] = obj;
                                break;
                            case 'hc:click':
                                //
                                this_1.registEventListener(obj, 'click', attrs[cnti_1]);
                                break;
                            case 'hc:input':
                                (['INPUT', 'SELECT'].indexOf(obj.tagName) > -1) &&
                                    (['radio', 'checkbox', 'select-one', 'select-multiple'].indexOf(obj['type']) > -1) &&
                                    this_1.registEventListener(obj, 'change', attrs[cnti_1]);
                                (['INPUT', 'TEXTAREA'].indexOf(obj.tagName) > -1) &&
                                    (['text', 'textarea'].indexOf(obj['type']) > -1) &&
                                    this_1.registEventListener(obj, 'input', attrs[cnti_1]);
                                (['INPUT', 'TEXTAREA', 'SELECT'].indexOf(obj.tagName) > -1) &&
                                    (['text', 'textarea', 'select-one', 'select-multiple'].indexOf(obj['type']) > -1) &&
                                    this_1.observeElement(obj, 'value', function (_old_val, _new_val) {
                                        var event_name = (['select-one', 'select-multiple'].indexOf(obj['type']) > -1) ? 'change' : 'input';
                                        var event = null;
                                        if (typeof (Event) === 'function') {
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
                                    this_1.observeElement(obj, 'checked', function (_old_val, _new_val) {
                                        var event = null;
                                        if (typeof (Event) === 'function') {
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
                                this_1.findVal(obj, attrs[cnti_1].value); // this[attrs[cnti].value];
                                // eval(`obj.value = this.${attrs[cnti].value}`);
                                // !this._v_refs[attrs[cnti].value] && (this._v_refs[attrs[cnti].value] = []);
                                // this._v_refs[attrs[cnti].value].push(obj);
                                break;
                            case 'hc:checked':
                            case 'hc:selected':
                                // const checked = ['true', 'false'].includes(attrs[cnti].value) ? attrs[cnti].value === 'true' : eval(`this.${attrs[cnti].value}`);
                                // const checked = ['true', 'false'].includes(attrs[cnti].value) ? attrs[cnti].value === 'true' : this[attrs[cnti].value];
                                var checked = ['true', 'false'].indexOf(attrs[cnti_1].value) > -1 ? attrs[cnti_1].value === 'true' : this_1[attrs[cnti_1].value];
                                if (checked) {
                                    obj.setAttribute(attrs[cnti_1].name.substring(3), null);
                                }
                                else {
                                    obj.removeAttribute(attrs[cnti_1].name.substring(3));
                                }
                                break;
                            case 'hc:text':
                                obj.innerText = this_1[attrs[cnti_1].value];
                                break;
                            case 'hc:html':
                                obj.innerHTML = this_1[attrs[cnti_1].value];
                                break;
                        }
                    }
                }
            };
            var this_1 = this;
            for (var cnti = 0; cnti < objs.length; cnti++) {
                _loop_1(cnti);
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
    };
    Hacci.prototype.refresh = function () {
        //
        this.clearData();
        //
        this.clearEventListeners();
        //
        this.init();
    };
    Hacci.prototype.clearData = function () {
        //
        var regx = new RegExp(/^__hc\.v_.+/);
        //
        var keys = Object.keys(this);
        for (var cnti = 0; cnti < keys.length; cnti++) {
            if (regx.test(keys[cnti])) {
                //
                //
                delete this[keys[cnti]];
            }
        }
    };
    Hacci.prototype.clearEventListeners = function () {
        //
        for (var cnti = 0; cnti < this._event_listeners.length; cnti++) {
            var listener = this._event_listeners[cnti];
            listener.el.removeEventListener(listener.name, listener.listener);
        }
        //
        this._event_listeners = [];
    };
    Hacci.prototype.registEventListener = function (el, name, attr) {
        var _this = this;
        //
        var listener = function (evt) {
            _this.callMethod({ attr: attr, evt: evt });
        };
        //
        el.addEventListener(name, listener);
        //
        this._event_listeners.push({
            el: el, name: name, listener: listener,
        });
    };
    Hacci.prototype.callMethod = function (option) {
        //
        // const has_bracket = option.attr.value.includes('(');
        var has_bracket = option.attr.value.indexOf('(') > -1;
        //
        var method_name = has_bracket ?
            option.attr.value.replace(/\(.*/, '') :
            option.attr.value;
        //
        if (has_bracket) {
            // has arguments
            var args_1 = option.attr.value.replace(/^\w*\(/, '').replace(/\)$/, '').split(',');
            args_1.forEach(function (el, idx) {
                var new_el = el.replace(/^\s*/, '').replace(/\s*$/, '');
                // if (new_el === '_event') {
                //     args[idx] = option.evt;
                // }
                // else {
                //     eval(`args[${idx}] = ${new_el}`);
                // }
                args_1[idx] = new_el === '_event' ? option.evt : eval(new_el);
            });
            //
            if (args_1.length < 2 && args_1[0] === '')
                args_1[0] = option.evt;
            //
            this[method_name].apply(this, args_1);
        }
        else {
            // no arguments
            this[method_name](option.evt);
        }
    };
    Hacci.prototype.observeElement = function (element, property, callback) {
        var elementPrototype = Object.getPrototypeOf(element);
        if (elementPrototype.hasOwnProperty(property)) {
            var descriptor_1 = Object.getOwnPropertyDescriptor(elementPrototype, property);
            Object.defineProperty(element, property, {
                get: function () {
                    return descriptor_1.get.apply(this, arguments);
                },
                set: function () {
                    var old_val = this[property];
                    descriptor_1.set.apply(this, arguments);
                    var new_val = this[property];
                    callback && setTimeout(callback.bind(this, old_val, new_val), 0);
                    return new_val;
                }
            });
        }
    };
    Hacci.prototype.createInstanceId = function () {
        var rtn_val = '';
        for (var cnti = 0; cnti < 8; cnti++) {
            var code = Math.floor(Math.random() * 51);
            rtn_val += String.fromCharCode(code + (code < 26 ? 65 : 71));
        }
        rtn_val += '.' + Date.now();
        return rtn_val;
    };
    // fincout is arrow function
    Hacci.prototype.isArrowFunc = function (func) {
        return typeof func.prototype === 'undefined';
    };
    // arrow function to ES5 function (resolving "this" problem)
    Hacci.prototype.fromArrowFunc = function (func) {
        if (this.isArrowFunc(func)) {
            // is arrow function
            var fn_str = func.toString();
            fn_str = "return function" +
                ((fn_str.substring(0, 1) === '(' ? '' : '(')) +
                fn_str.replace(/\)?\s*=>.*{(.|\r|\n)*/, ')') +
                fn_str.replace(/^.*=>\s*{/, '{');
            return new Function(fn_str)();
        }
        return func;
    };
    Hacci.prototype.findVal = function (obj, keys, val, src) {
        if (val === void 0) { val = null; }
        if (src === void 0) { src = null; }
        //
        !src && (src = this);
        //
        var idx = keys.indexOf('.');
        if (idx > 0) {
            var key_1 = keys.substring(0, idx);
            // console.log(`findVal - keys:${keys} / key:${key}`);
            // redefineProperty
            !src['__hc.lstn'] && (src['__hc.lstn'] = function (key, val) {
                console.log(key + ".set = " + val);
                // console.log(`_v_refs:${JSON.stringify(this._v_refs)}`);
            });
            //
            src['__hc.v_' + key_1] = src[key_1];
            Object.defineProperty(src, key_1, {
                get: function () {
                    // console.log(`${data_keys[cnti]}.get:${this[data_keys[cnti]]}`);
                    return src['__hc.v_' + key_1];
                },
                set: function (val) {
                    src['__hc.v_' + key_1] = val;
                    src['__hc.lstn'](key_1, val);
                    return val;
                }
            });
            //
            return src.findVal(obj, keys.substring(idx + 1), val, src[key_1]);
        }
        //
        val && (src[keys] = val);
        // console.log(`findVal.last - keys:${keys}`);
        // redefineProperty
        !src['__hc.lstn'] && (src['__hc.lstn'] = function (key, val) {
            console.log(key + ".set = " + val);
            // console.log(`_v_refs:${JSON.stringify(this._v_refs)}`);
            if (this['__hc.refs'][key]) {
                for (var cnti = 0; cnti < this['__hc.refs'][key].length; cnti++) {
                    this['__hc.refs'][key][cnti].value = val;
                }
            }
        });
        //
        !src['__hc.refs'] && (src['__hc.refs'] = {});
        !src['__hc.refs'][keys] && (src['__hc.refs'][keys] = []);
        src['__hc.refs'][keys].indexOf(obj) < 0 && src['__hc.refs'][keys].push(obj);
        //
        src['__hc.v_' + keys] = src[keys];
        Object.defineProperty(src, keys, {
            get: function () {
                // console.log(`${data_keys[cnti]}.get:${this[data_keys[cnti]]}`);
                return src['__hc.v_' + keys];
            },
            set: function (val) {
                src['__hc.v_' + keys] = val;
                src['__hc.lstn'](keys, val);
                return val;
            }
        });
        // console.log(src);
        //
        obj.value = src[keys];
        //
        return src[keys];
    };
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
    Hacci.prototype.destroy = function () {
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
    };
    //
    Hacci.prototype.mount = function (el) {
        el && (this._el = el);
        //
        this.init();
        //
        return this;
    };
    Object.defineProperty(Hacci.prototype, "el", {
        //
        get: function () {
            return this._el;
        },
        enumerable: true,
        configurable: true
    });
    Object.defineProperty(Hacci.prototype, "refs", {
        get: function () {
            return this._refs;
        },
        enumerable: true,
        configurable: true
    });
    //
    Hacci._instances = {};
    return Hacci;
}());
exports.Hacci = Hacci;
// window['Hacci'] = Hacci;
//# sourceMappingURL=index.js.map