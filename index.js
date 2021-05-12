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
            var data_keys = Object.keys(option.data);
            for (var cnti = 0; cnti < data_keys.length; cnti++) {
                this[data_keys[cnti]] = option.data[data_keys[cnti]];
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
                                obj.value = this_1[attrs[cnti_1].value];
                                // eval(`obj.value = this.${attrs[cnti].value}`);
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
        this.clearEventListeners();
        //
        this.init();
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