"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
/**
 *
 */
var Hacci = /** @class */ (function () {
    function Hacci(option) {
        if (option === void 0) { option = null; }
        //
        this._id = null;
        this._el = null;
        //
        this._refs = {};
        // private _v_refs: any = {};
        this._traces = {
            model: {},
        };
        //
        this._on = {
            created: null,
            mounted: null,
            destroyed: null,
        };
        //
        this._event_listeners = [];
        //
        this._type_of_event_input = [
            'email', 'hidden', 'number', 'password', 'search', 'tel', 'url', 'datetime', 'text', 'textarea'
        ];
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
            id: null,
            el: null,
            template: null,
            data: null,
            method: null,
            created: null,
            mounted: null,
            destroyed: null,
        });
        // id값 설정
        !option.id && (option.id = this.createInstanceId());
        // console.log(`option.id:${option.id}`);
        if (!(new RegExp(/^[a-zA-Z_][0-9a-zA-Z_-]+$/)).test(option.id)) {
            throw new Error('id format is invalid');
        }
        //
        this._id = option.id;
        Hacci.instances[this._id] = this;
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
        //
        var self = this;
        //
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
                var _loop_2 = function (cnti_1) {
                    if (/^hc:model$/.test(attrs[cnti_1].name)) {
                        // this.findVal(obj, attrs[cnti].value);
                        //
                        this_1.traceModel({
                            parent: this_1,
                            property: attrs[cnti_1].value,
                            value: null,
                        });
                        // console.log`tagName:${obj.tagName} / type:${obj.type}`);
                        //
                        if (obj.tagName === 'INPUT' && ['radio', 'checkbox'].indexOf(obj.type) > -1) {
                            // 초기값 설정
                            var model = this_1.getVal(attrs[cnti_1].value, this_1);
                            // console.log`hc:model - ${attrs[cnti].value}.getVal:->`);
                            // console.log(model);
                            //
                            var group_name = obj.hasAttribute('name') ? obj.getAttribute('name') : null;
                            // console.log(`group_name:${group_name}`);
                            if (group_name) {
                                var groups = self.el.querySelectorAll("*[name=" + group_name + "]");
                                // console.log(groups);
                                self.setCheckedValue(groups, model.val);
                            }
                            // 이벤트 처리 등록
                            obj.addEventListener('change', function (_evt) {
                                // console.log(`on.change`);
                                var checked_value = null;
                                (obj.type === 'radio') && (checked_value = obj.checked ? obj.value : null);
                                (obj.type === 'checkbox') && (checked_value = obj.checked ? obj.value : []);
                                //
                                var group_name = obj.hasAttribute('name') ? obj.getAttribute('name') : null;
                                // console.log(`group_name:${group_name}`);
                                if (group_name) {
                                    var groups = self.el.querySelectorAll("*[name=" + group_name + "]");
                                    checked_value = self.getCheckedValue(groups, obj.type === 'checkbox');
                                }
                                //
                                // console.log(checked_value);
                                //
                                var target_obj = self.getVal(attrs[cnti_1].value, self._traces.model, '__');
                                target_obj.parent[target_obj.prop] = checked_value;
                                //
                                _this.modelTrigger(obj);
                            });
                        }
                        else if (obj.tagName === 'SELECT' && ['select-one', 'select-multiple'].indexOf(obj.type) > -1) {
                            // 초기값 설정
                            var model = this_1.getVal(attrs[cnti_1].value, this_1);
                            // console.log(`hc:model - ${attrs[cnti].value}.getVal:->`);
                            // console.log(model);
                            //
                            var groups = obj.querySelectorAll("option");
                            self.setSelectedValue(groups, model.val);
                            // 이벤트 처리 등록
                            obj.addEventListener('change', function (_evt) {
                                // console.log(`on.change`);
                                var checked_value = (obj.type === 'select-one') ? null : [];
                                //
                                var groups = obj.querySelectorAll("option");
                                checked_value = self.getSelectedValue(groups, obj.type === 'select-multiple');
                                //
                                // console.log(checked_value);
                                //
                                var target_obj = self.getVal(attrs[cnti_1].value, self._traces.model, '__');
                                target_obj.parent[target_obj.prop] = checked_value;
                                //
                                _this.modelTrigger(obj);
                            });
                        }
                        else if (['INPUT', 'TEXTAREA'].indexOf(obj.tagName) > -1 && self._type_of_event_input.indexOf(obj.type) > -1) {
                            // 초기값 설정
                            var model = this_1.getVal(attrs[cnti_1].value, this_1);
                            // console.log(`hc:model - ${attrs[cnti].value}.getVal:->`);
                            // console.log(model);
                            //
                            obj.value = model.val;
                            // 이벤트 처리 등록
                            obj.addEventListener('input', function (_evt) {
                                // console.log(`on.input`);
                                var checked_value = obj.value;
                                //
                                // console.log(checked_value);
                                //
                                var target_obj = self.getVal(attrs[cnti_1].value, self._traces.model, '__');
                                // console.log(`on.input - target_obj:${JSON.stringify(target_obj)}`);
                                target_obj.parent[target_obj.prop] = checked_value;
                                //
                                _this.modelTrigger(obj);
                            });
                        }
                    }
                };
                //
                for (var cnti_1 = 0; cnti_1 < attrs.length; cnti_1++) {
                    _loop_2(cnti_1);
                }
            };
            var this_1 = this;
            //
            for (var cnti = 0; cnti < objs.length; cnti++) {
                _loop_1(cnti);
            }
            //
            for (var cnti = 0; cnti < objs.length; cnti++) {
                var obj = objs[cnti];
                //
                var attrs = obj['attributes'];
                //
                for (var cnti_2 = 0; cnti_2 < attrs.length; cnti_2++) {
                    if (/^hc:/.test(attrs[cnti_2].name)) {
                        //
                        switch (attrs[cnti_2].name) {
                            case 'hc:ref':
                                this._refs[attrs[cnti_2].value] = obj;
                                break;
                            case 'hc:click':
                                this.registEventListener(obj, 'click', attrs[cnti_2]);
                                break;
                            case 'hc:change':
                                (['INPUT', 'SELECT'].indexOf(obj.tagName) > -1) &&
                                    (['radio', 'checkbox', 'select-one', 'select-multiple'].indexOf(obj.type) > -1) &&
                                    this.registEventListener(obj, 'change', attrs[cnti_2]);
                                // (['INPUT', 'SELECT'].indexOf(obj.tagName) > -1) &&
                                //     (['radio', 'checkbox', 'select-one', 'select-multiple'].indexOf(obj['type']) > -1) && 
                                //     this.observeElementEvent(obj, 'checked', 'change');
                                // this.observeElement(obj, 'checked', (_old_val: any, _new_val: any) => {
                                //     let event = null;
                                //     if(typeof(Event) === 'function') {
                                //         event = new Event('change');
                                //     }
                                //     else {
                                //         event = document.createEvent('Event');
                                //         event.initEvent('change', true, true);
                                //     }
                                //     obj.dispatchEvent(event);
                                // });
                                break;
                            case 'hc:input':
                                (['INPUT', 'TEXTAREA'].indexOf(obj.tagName) > -1) &&
                                    (self._type_of_event_input.indexOf(obj['type']) > -1) &&
                                    this.registEventListener(obj, 'input', attrs[cnti_2]);
                                // (['INPUT', 'TEXTAREA', 'SELECT'].indexOf(obj.tagName) > -1) &&
                                //     (['text', 'textarea'].indexOf(obj['type']) > -1) && 
                                //     this.observeElementEvent(obj, 'value', 'input');
                                // this.observeElement(obj, 'value', (_old_val: any, _new_val: any) => {
                                //     let event = null;
                                //     if(typeof(Event) === 'function') {
                                //         event = new Event('input');
                                //     }
                                //     else {
                                //         event = document.createEvent('Event');
                                //         event.initEvent('input', true, true);
                                //     }
                                //     obj.dispatchEvent(event);
                                // });
                                break;
                            // case 'hc:value':
                            //     // obj.setAttribute('value', eval(`this.${attrs[cnti].value}`));
                            //     // (obj as HTMLInputElement).value = eval(`this.${attrs[cnti].value}`);
                            //     // (obj as HTMLInputElement).value = this.findValOnly(obj, attrs[cnti].value).value; // this[attrs[cnti].value];
                            //     // this.findVal(obj, attrs[cnti].value); // this[attrs[cnti].value];
                            //     // eval(`obj.value = this.${attrs[cnti].value}`);
                            //     // !this._v_refs[attrs[cnti].value] && (this._v_refs[attrs[cnti].value] = []);
                            //     // this._v_refs[attrs[cnti].value].push(obj);
                            //     this.findValOnly(obj, attrs[cnti].value);
                            //     break;
                            // case 'hc:checked':
                            // // case 'hc:selected':
                            //     // const checked = ['true', 'false'].includes(attrs[cnti].value) ? attrs[cnti].value === 'true' : eval(`this.${attrs[cnti].value}`);
                            //     // const checked = ['true', 'false'].includes(attrs[cnti].value) ? attrs[cnti].value === 'true' : this[attrs[cnti].value];
                            //     const checked = ['true', 'false'].indexOf(attrs[cnti].value) > -1 ? attrs[cnti].value === 'true' : this[attrs[cnti].value];
                            //     if (checked) {
                            //         obj.setAttribute(attrs[cnti].name.substring(3), null);
                            //     }
                            //     else {
                            //         obj.removeAttribute(attrs[cnti].name.substring(3));
                            //     }
                            //     break;
                            case 'hc:text':
                                obj.innerText = this[attrs[cnti_2].value];
                                break;
                            case 'hc:html':
                                obj.innerHTML = this[attrs[cnti_2].value];
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
        var regx = new RegExp(/^__hc\.(v_.+|lstn$|refs$)/);
        //
        var keys = Object.keys(this);
        for (var cnti = 0; cnti < keys.length; cnti++) {
            if (regx.test(keys[cnti])) {
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
    Hacci.prototype.modelTrigger = function (el) {
        var target_attr = null;
        var attrs = el['attributes'];
        for (var cnti = 0; cnti < attrs.length; cnti++) {
            if (/^hc:model$/.test(attrs[cnti].name)) {
                target_attr = attrs[cnti];
                break;
                // console.log(`attr.model - name:${attrs[cnti].name} / value:${attrs[cnti].value}`);
                // const model = this.getVal(attrs[cnti].value, this);
                // model.parent[model.prop] = (el as HTMLInputElement).value;
            }
        }
        if (target_attr) {
            var model = this.getVal(target_attr.value, this);
            // console.log(`model.value:${JSON.stringify(model.val)}`);
            //
            var objs = this.el.querySelectorAll('*');
            //
            for (var cnti = 0; cnti < objs.length; cnti++) {
                var obj = objs[cnti];
                //
                attrs = obj['attributes'];
                //
                for (var cnti_3 = 0; cnti_3 < attrs.length; cnti_3++) {
                    if (/^hc:model$/.test(attrs[cnti_3].name) && attrs[cnti_3].value === target_attr.value) {
                        //
                        // console.log(`obj - tagName:${obj.tagName} / model:${attrs[cnti].value}`);
                        //
                        if (obj.tagName === 'INPUT' && ['radio', 'checkbox'].indexOf(obj.type) > -1) {
                            if (Array.isArray(model.val)) {
                                obj.checked = model.val.indexOf(obj.value) > -1;
                            }
                            else {
                                obj.checked = model.val == obj.value;
                            }
                        }
                        else if (obj.tagName === 'SELECT' && ['select-one', 'select-multiple'].indexOf(obj.type) > -1) {
                            var groups = obj.querySelectorAll("option");
                            for (var cntk = 0; cntk < groups.length; cntk++) {
                                if (Array.isArray(model.val)) {
                                    groups[cntk].selected = model.val.indexOf(groups[cntk].value) > -1;
                                }
                                else {
                                    groups[cntk].selected = model.val == groups[cntk].value;
                                }
                            }
                        }
                        else if (['INPUT', 'TEXTAREA'].indexOf(obj.tagName) > -1 && this._type_of_event_input.indexOf(obj.type) > -1) {
                            obj.value = model.val;
                        }
                    }
                }
            }
        }
    };
    Hacci.prototype.registEventListener = function (el, name, attr) {
        var _this = this;
        // console.log(`registEventListener - name:${name}`);
        // const self: Hacci = this;
        //
        var listener = function (evt) {
            // console.log(`registEventListener.listener - name:${name}`);
            //
            // let property_name = 'value';
            // (['INPUT'].indexOf(el.tagName) > -1) &&
            //     (['radio', 'checkbox'].indexOf(el['type']) > -1) &&
            //     (property_name = 'checked');
            // for (let cnti: number = 0; cnti < el['attributes'].length; cnti++) {
            //     /^hc:model$/.test(el['attributes'][cnti].name) &&
            //         this.findValOnly(el, el['attributes'][cnti].value, el[property_name]);
            // }
            // console.log(`regEvt:${el[property_name]}`);
            // setTimeout(() => {
            //     console.log(`regEvt:${el[property_name]}`);
            // }, 0);
            // //
            // let value = null;
            // //
            // if ((el as HTMLInputElement).tagName === 'INPUT' && ['radio', 'checkbox'].indexOf((el as HTMLInputElement).type) > -1) {
            //     const group_name = el.hasAttribute('name') ? el.getAttribute('name') : null;
            //     // console.log(`group_name:${group_name}`);
            //     if (group_name) {
            //         const groups = self.el.querySelectorAll(`*[name=${group_name}]`);
            //         for (let cnti: number = 0; cnti < groups.length; cnti++) {
            //             !value && (el as HTMLInputElement).type === 'checkbox' && (value = []);
            //             (groups[cnti] as HTMLInputElement).checked && (
            //                 Array.isArray(value) ? 
            //                     value.push((groups[cnti] as HTMLInputElement).value) :
            //                     (value = (groups[cnti] as HTMLInputElement).value)
            //             );
            //         }
            //     }
            // }
            // else if ((el as HTMLInputElement).tagName === 'SELECT') {
            //     const groups = self.el.querySelectorAll(`option`);
            //     for (let cnti: number = 0; cnti < groups.length; cnti++) {
            //         !value && (value = []);
            //         (groups[cnti] as HTMLOptionElement).selected && value.push((groups[cnti] as HTMLOptionElement).value);
            //     }
            // }
            // console.log(`value:${JSON.stringify(value)}`);
            //
            // let target_attr = null;
            // let attrs = (el as HTMLInputElement)['attributes'];
            // for (let cnti: number = 0; cnti < attrs.length; cnti++) {
            //     if (/^hc:model$/.test(attrs[cnti].name)) {
            //         target_attr = attrs[cnti];
            //         break;
            //         // console.log(`attr.model - name:${attrs[cnti].name} / value:${attrs[cnti].value}`);
            //         // const model = this.getVal(attrs[cnti].value, this);
            //         // model.parent[model.prop] = (el as HTMLInputElement).value;
            //     }
            // }
            // if (target_attr) {
            //     const model = this.getVal(target_attr.value, this);
            //     console.log(`model.value:${JSON.stringify(model.val)}`);
            //     //
            //     const objs: NodeList = this.el.querySelectorAll('*');
            //     //
            //     for (let cnti = 0; cnti < objs.length; cnti++) {
            //         const obj = objs[cnti] as HTMLInputElement;
            //         //
            //         attrs = obj['attributes'];
            //         //
            //         for (let cnti: number = 0; cnti < attrs.length; cnti++) {
            //             if (/^hc:model$/.test(attrs[cnti].name) && attrs[cnti].value === target_attr.value) {
            //                 //
            //                 console.log(`obj - tagName:${obj.tagName} / model:${attrs[cnti].value}`);
            //                 //
            //                 if (obj.tagName === 'INPUT' && ['radio', 'checkbox'].indexOf(obj.type) > -1) {
            //                     if (Array.isArray(model.val)) {
            //                         obj.checked = model.val.indexOf(obj.value) > -1;
            //                     }
            //                     else {
            //                         obj.checked = model.val == obj.value;
            //                     }
            //                 }
            //                 else if (obj.tagName === 'SELECT' && ['select-one', 'select-multiple'].indexOf(obj.type) > -1) {
            //                     const groups = obj.querySelectorAll(`option`);
            //                     for (let cntk: number = 0; cntk < groups.length; cntk++) {
            //                         if (Array.isArray(model.val)) {
            //                             (groups[cntk] as HTMLOptionElement).selected = model.val.indexOf((groups[cntk] as HTMLOptionElement).value) > -1;
            //                         }
            //                         else {
            //                             (groups[cntk] as HTMLOptionElement).selected = model.val == (groups[cntk] as HTMLOptionElement).value;
            //                         }
            //                     }
            //                 }
            //                 else if (['INPUT', 'TEXTAREA'].indexOf(obj.tagName) > -1 && ['text', 'textarea', 'number', 'hidden'].indexOf(obj.type) > -1) {
            //                     obj.value = model.val;
            //                 }
            //             }
            //         }
            //     }
            // }
            //
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
    Hacci.prototype.commitEvent = function (element, event_name) {
        // console.log(`commitEvent - event_name:${event_name} / element:->`);
        // console.log(element);
        var event = null;
        if (typeof (Event) === 'function') {
            event = new Event(event_name);
        }
        else {
            event = document.createEvent('Event');
            event.initEvent(event_name, true, true);
        }
        //
        element.dispatchEvent(event);
    };
    // private observeElementEvent(element: any, property: string, event_name: string) {
    //     const self = this;
    //     //
    //     return this.observeElement(element, property, function() {
    //         self.commitEvent(element, event_name);
    //         // console.log(`observeElementEvent - attrs.1:${JSON.stringify(element['attributes'])}`);
    //         // let event = null;
    //         // if(typeof(Event) === 'function') {
    //         //     event = new Event(event_name);
    //         // }
    //         // else {
    //         //     event = document.createEvent('Event');
    //         //     event.initEvent(event_name, true, true);
    //         // }
    //         // //
    //         // element.dispatchEvent(event);
    //     });
    // }
    // private observeElement(element: any, property: string, callback: Function) {
    //     // const self = this;
    //     let elementPrototype = Object.getPrototypeOf(element);
    //     if (elementPrototype.hasOwnProperty(property)) {
    //         let descriptor = Object.getOwnPropertyDescriptor(elementPrototype, property);
    //         Object.defineProperty(element, property, {
    //             get: function() {
    //                 return descriptor.get.apply(this, arguments);
    //             },
    //             set: function () {
    //                 let old_val = this[property];
    //                 descriptor.set.apply(this, arguments);
    //                 let new_val = this[property];
    //                 callback && setTimeout(callback.bind(this, old_val, new_val), 0);
    //                 //
    //                 // for (let cnti: number = 0; cnti < element['attributes'].length; cnti++) {
    //                 //     /^hc:model$/.test(element['attributes'][cnti].name) &&
    //                 //         self.findValOnly(element, element['attributes'][cnti].value, element[property]);
    //                 // }
    //                 return new_val;
    //             }
    //         });
    //     }
    // }
    Hacci.prototype.createInstanceId = function () {
        var rtn_val = '';
        for (var cnti = 0; cnti < 8; cnti++) {
            var code = Math.floor(Math.random() * 51);
            rtn_val += String.fromCharCode(code + (code < 26 ? 65 : 71));
        }
        rtn_val += '_' + Date.now();
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
    // private findValOnly(obj: any, keys: string, val: any = null, src: any = null): any {
    //     //
    //     !src && (src = this);
    //     //
    //     const idx = keys.indexOf('.');
    //     if (idx > 0) {
    //         const key = keys.substring(0, idx);
    //         //
    //         return src.findValOnly(obj, keys.substring(idx + 1), val, src[key]);
    //     }
    //     //
    //     // val && (src[keys] = val);
    //     console.log(`findValOnly - val:${val} / ${src['__hc.v_' + keys]}`);
    //     val && (typeof src['__hc.v_' + keys] !== 'undefined') && (src['__hc.v_' + keys] = val);
    //     //
    //     const is_model = !(new RegExp(/^(true|false|'.+'|\d+)$/)).test(keys);
    //     console.log(`findValOnly - keys:${keys} / is_model:${is_model}`);
    //     //
    //     (obj as HTMLInputElement).value = is_model ? src[keys] : eval(keys);
    //     console.log(`findValOnly - obj:`);
    //     console.log(obj);
    //     //
    //     return src[keys];
    // }
    // private findVal(obj: any, keys: string, val: any = null, src: any = null): any {
    //     //
    //     !src && (src = this);
    //     //
    //     const idx = keys.indexOf('.');
    //     if (idx > 0) {
    //         const key = keys.substring(0, idx);
    //         // console.log(`findVal - keys:${keys} / key:${key}`);
    //         // redefineProperty
    //         !src['__hc.lstn'] && (
    //             src['__hc.lstn'] = function(key: string, val: any) {
    //                 console.log(`${key}.set = ${val}`);
    //                 // console.log(`_v_refs:${JSON.stringify(this._v_refs)}`);
    //             }
    //         );
    //         //
    //         src['__hc.v_' + key] = src[key];
    //         Object.defineProperty(src, key, {
    //             get: function() {
    //                 // console.log(`${data_keys[cnti]}.get:${this[data_keys[cnti]]}`);
    //                 return src['__hc.v_' + key];
    //             },
    //             set: function(val) {
    //                 src['__hc.v_' + key] = val;
    //                 src['__hc.lstn'](key, val);
    //                 return val;
    //             }
    //         });
    //         //
    //         return src.findVal(obj, keys.substring(idx + 1), val, src[key]);
    //     }
    //     //
    //     val && (src[keys] = val);
    //     // console.log(`findVal.last - keys:${keys}`);
    //     //
    //     const is_model = !(new RegExp(/^(true|false|'.+'|\d+)$/)).test(keys);
    //     console.log(`findVal - keys:${keys} / is_model:${is_model} / tagName: ${obj.tagName} / type:${(obj as HTMLInputElement)['type']}`);
    //     if (is_model) {
    //         // redefineProperty
    //         !src['__hc.lstn'] && (
    //             src['__hc.lstn'] = function(key: string, val: any) {
    //                 console.log(`${key}.set = ${val}`);
    //                 // console.log(`_v_refs:${JSON.stringify(this._v_refs)}`);
    //                 if (this['__hc.refs'][key]) {
    //                     for (let cnti = 0; cnti < this['__hc.refs'][key].length; cnti++) {
    //                         console.log(`type:${this['__hc.refs'][key][cnti]['type']}`);
    //                         //
    //                         if ((['INPUT', 'SELECT'].indexOf(this['__hc.refs'][key][cnti].tagName) > -1) &&
    //                         (['radio', 'checkbox', 'select-one', 'select-multiple'].indexOf(this['__hc.refs'][key][cnti]['type']) > -1)) {
    //                             this['__hc.refs'][key][cnti].checked = val;
    //                         }
    //                         else {
    //                             this['__hc.refs'][key][cnti].value = val;
    //                         }
    //                     }
    //                 }
    //             }
    //         );
    //         //
    //         !src['__hc.refs'] && (src['__hc.refs'] = {});
    //         !src['__hc.refs'][keys] && (src['__hc.refs'][keys] = []);
    //         src['__hc.refs'][keys].indexOf(obj) < 0 && src['__hc.refs'][keys].push(obj);
    //         //
    //         src['__hc.v_' + keys] = src[keys];
    //         Object.defineProperty(src, keys, {
    //             get: function() {
    //                 // console.log(`${data_keys[cnti]}.get:${this[data_keys[cnti]]}`);
    //                 return src['__hc.v_' + keys];
    //             },
    //             set: function(val) {
    //                 src['__hc.v_' + keys] = val;
    //                 src['__hc.lstn'](keys, val);
    //                 return val;
    //             }
    //         });
    //         // console.log(src);
    //         //
    //         switch ((obj as HTMLInputElement)['type']) {
    //             case 'radio':
    //             case 'checkbox':
    //                 if (src[keys] === true) {
    //                     obj.setAttribute('checked', null);
    //                 }
    //                 else {
    //                     obj.removeAttribute('checked');
    //                 }
    //                 break;
    //             default:
    //                 (obj as HTMLInputElement).value = src[keys];
    //                 break;
    //         }
    //     }
    //     else {
    //         switch ((obj as HTMLInputElement)['type']) {
    //             case 'radio':
    //             case 'checkbox':
    //                 if ((new RegExp(/^true$/)).test(keys)) {
    //                     obj.setAttribute('checked', null);
    //                 }
    //                 else {
    //                     obj.removeAttribute('checked');
    //                 }
    //                 break;
    //             default:
    //                 (obj as HTMLInputElement).value = eval(keys);
    //                 break;
    //         }
    //     }
    //     //
    //     return src[keys];
    // }
    //
    Hacci.prototype.getCheckedValue = function (groups, return_as_array) {
        if (return_as_array === void 0) { return_as_array = false; }
        var rtn_val = return_as_array ? [] : null;
        // console.log(`getCheckedValue - groups:${groups} / return_as_array:${return_as_array}`);
        //
        for (var cntk = 0; cntk < groups.length; cntk++) {
            var item = groups[cntk];
            // console.log(`checked:${item.checked} / value:${item.value}`);
            if (item.checked && !return_as_array) {
                rtn_val = item.value;
                break;
            }
            else if (item.checked && return_as_array) {
                rtn_val.push(item.value);
            }
        }
        //
        return rtn_val;
    };
    //
    Hacci.prototype.getSelectedValue = function (groups, return_as_array) {
        if (return_as_array === void 0) { return_as_array = false; }
        var rtn_val = return_as_array ? [] : null;
        // console.log(`getSelectedValue - groups:${groups} / return_as_array:${return_as_array}`);
        //
        for (var cntk = 0; cntk < groups.length; cntk++) {
            var item = groups[cntk];
            // console.log(`checked:${item.selected} / value:${item.value}`);
            if (item.selected && !return_as_array) {
                rtn_val = item.value;
                break;
            }
            else if (item.selected && return_as_array) {
                rtn_val.push(item.value);
            }
        }
        //
        return rtn_val;
    };
    //
    Hacci.prototype.setCheckedValue = function (groups, value) {
        // console.log(`setCheckedValue - groups:${groups} / value:${value}`);
        //
        for (var cntk = 0; cntk < groups.length; cntk++) {
            var item = groups[cntk];
            // console.log(`checked:${item.checked} / value:${item.value}`);
            if (Array.isArray(value)) {
                item.checked = value.indexOf(item.value) > -1;
            }
            else {
                item.checked = value === item.value;
            }
        }
    };
    //
    Hacci.prototype.setSelectedValue = function (groups, value) {
        // console.log(`setSelectedValue - groups:${groups} / value:${value}`);
        //
        for (var cntk = 0; cntk < groups.length; cntk++) {
            var item = groups[cntk];
            // console.log(`selected:${item.selected} / value:${item.value}`);
            if (Array.isArray(value)) {
                item.selected = value.indexOf(item.value) > -1;
            }
            else {
                item.selected = value === item.value;
            }
        }
    };
    Hacci.prototype.getVal = function (val, init_parent, prefix) {
        if (prefix === void 0) { prefix = ''; }
        // console.log(`getVal - val:${val} / init_parent:->`);
        // console.log(init_parent);
        //
        if ((new RegExp(/^(true|false|'.+'|\d+)$/)).test(val)) {
            return {
                parent: null,
                prop: null,
                val: eval(val),
            };
        }
        //
        var rtn_val = {
            parent: null,
            prop: null,
            val: init_parent,
        };
        //
        var strs = val.split('.');
        for (var cnti = 0; cnti < strs.length; cnti++) {
            if (cnti === 0) {
                rtn_val.parent = rtn_val.val;
                rtn_val.prop = prefix + strs[0];
                rtn_val.val = rtn_val.val[prefix + strs[0]];
                continue;
            }
            //
            rtn_val.parent = rtn_val.val;
            rtn_val.prop = prefix + strs[cnti];
            rtn_val.val = rtn_val.val[prefix + strs[cnti]];
        }
        //
        return rtn_val;
    };
    //
    Hacci.prototype.setVal = function (target, val, init_parent) {
        var parent = init_parent;
        //
        var strs = target.split('.');
        for (var cnti = 0; cnti < strs.length; cnti++) {
            if (typeof parent["__" + strs[cnti]] === 'undefined') {
                parent["__" + strs[cnti]] = {};
            }
            if (cnti >= strs.length - 1) {
                parent["__" + strs[cnti]] = val;
            }
            else {
                parent = parent["__" + strs[cnti]];
            }
        }
    };
    // private emitModel(option: HacciEmitModelOption) {
    //     //
    //     if ((new RegExp(/^(true|false|'.+'|\d+)$/)).test(option.property)) return;
    //     //
    //     const self: Hacci = this;
    //     //
    // }
    Hacci.prototype.traceModel = function (option) {
        //
        if ((new RegExp(/^(true|false|'.+'|\d+)$/)).test(option.property))
            return;
        //
        var self = this;
        // parent 확인 및 지정
        (['undefined', 'null'].indexOf(typeof option.parent) > -1) &&
            (option.parent = this);
        //
        !this._traces.model['__listen'] &&
            (this._traces.model['__listen'] = function (property, value) {
                // console.log(`_traces.model.__listen.set  - property:${property} / value:${value}->`);
                // console.log(value);
                // console.log(`--------------------`);
                // console.log(`_traces.model.__listen.set  - model:->`);
                // console.log(model);
                // console.log(`_traces.model.__listen.set  - traceModel:->`);
                // console.log(traceModel);
                //
                var target_names = [];
                //
                var commit_events = {
                    change: [],
                    input: [],
                };
                //
                var objs = self.el.querySelectorAll('*');
                for (var cnti = 0; cnti < objs.length; cnti++) {
                    var obj = objs[cnti];
                    //
                    var attrs = obj['attributes'];
                    //
                    for (var cnti_4 = 0; cnti_4 < attrs.length; cnti_4++) {
                        if (/^hc:model$/.test(attrs[cnti_4].name) && attrs[cnti_4].value === property) {
                            // console.log(`element - tagName:${obj.tagName} / type:${obj.type} / name:${obj.name} / nodeName:${obj.nodeName} / localName:${obj.localName} / className:${obj.className}`);
                            //
                            if (obj.tagName === 'INPUT' && ['radio', 'checkbox'].indexOf(obj.type) > -1) {
                                var group_name = obj.hasAttribute('name') ? obj.getAttribute('name') : null;
                                var target_added = target_names.indexOf(group_name) > -1;
                                // console.log(`group_name:${group_name}`);
                                if (group_name) {
                                    var groups = self.el.querySelectorAll("*[name=" + group_name + "]");
                                    // console.log(groups);
                                    self.setCheckedValue(groups, value);
                                }
                                //
                                // console.log(`commitEvent - change`);
                                // self.commitEvent(obj, 'change');
                                //
                                if (!target_added) {
                                    target_names.push(group_name);
                                    commit_events.change.indexOf(obj) < 0 && commit_events.change.push(obj);
                                }
                            }
                            else if (obj.tagName === 'SELECT' && ['select-one', 'select-multiple'].indexOf(obj.type) > -1) {
                                var groups = obj.querySelectorAll("option");
                                self.setSelectedValue(groups, value);
                                //
                                // console.log(`commitEvent - change`);
                                // self.commitEvent(obj, 'change');
                                commit_events.change.indexOf(obj) < 0 && commit_events.change.push(obj);
                            }
                            else if (['INPUT', 'TEXTAREA'].indexOf(obj.tagName) > -1 && self._type_of_event_input.indexOf(obj.type) > -1) {
                                obj.value = value;
                                //
                                // console.log(`commitEvent - input`);
                                // self.commitEvent(obj, 'input');
                                commit_events.input.indexOf(obj) < 0 && commit_events.input.push(obj);
                            }
                        }
                    }
                }
                //
                for (var cnti = 0; cnti < commit_events.change.length; cnti++) {
                    // console.log(`commitEvent - change`);
                    self.commitEvent(commit_events.change[cnti], 'change');
                }
                for (var cnti = 0; cnti < commit_events.input.length; cnti++) {
                    // console.log(`commitEvent - input`);
                    self.commitEvent(commit_events.input[cnti], 'input');
                }
            });
        var traces = this._traces.model;
        //
        // const prop_idx = option.property.indexOf('.');
        // if (prop_idx > 0) {
        //     //
        //     const property = option.property.substring(0, prop_idx);
        //     //
        //     option.parent[property]
        //     //
        //     return this.traceModel({
        //         parent: option.parent[property],
        //         property: option.property.substring(prop_idx + 1),
        //         value: option.value,
        //     });
        //     // //
        //     // traces[property] = option.parent[property];
        //     // //
        //     // Object.defineProperty(
        //     //     option.parent,
        //     //     option.property,
        //     //     {
        //     //         get: function() {
        //     //             return traces[option.property];
        //     //         },
        //     //         set: function(val: any) {
        //     //             traces[option.property] = val;
        //     //             traces.__listen(option.property, val);
        //     //         },
        //     //     });
        // }
        //
        // const getVal = function(val: any, init_parent: any, prefix: string = ''): any {
        //     // console.log(`getVal - val:${val} / init_parent:->`);
        //     // console.log(init_parent);
        //     //
        //     if ((new RegExp(/^(true|false|'.+'|\d+)$/)).test(val)) {
        //         return {
        //             parent: null,
        //             prop: null,
        //             val: eval(val),
        //         };
        //     }
        //     //
        //     let rtn_val = {
        //         parent: null,
        //         prop: null,
        //         val: init_parent,
        //     };
        //     //
        //     const strs: string[] = val.split('.');
        //     for (let cnti: number = 0; cnti < strs.length; cnti++) {
        //         if (cnti === 0) {
        //             rtn_val.val = rtn_val.val[prefix + strs[0]];
        //             continue;
        //         }
        //         //
        //         rtn_val.parent = rtn_val.val;
        //         rtn_val.prop = prefix + strs[cnti];
        //         rtn_val.val = rtn_val.val[prefix + strs[cnti]];
        //     }
        //     //
        //     return rtn_val;
        // };
        // //
        // const setVal = function(target: any, val: any, init_parent: any) {
        //     let parent = init_parent;
        //     //
        //     const strs: string[] = target.split('.');
        //     for (let cnti: number = 0; cnti < strs.length; cnti++) {
        //         if (typeof parent[`__${strs[cnti]}`] === 'undefined') {
        //             parent[`__${strs[cnti]}`] = {};
        //         }
        //         if (cnti >= strs.length - 1) {
        //             parent[`__${strs[cnti]}`] = val;
        //         }
        //         else {
        //             parent = parent[`__${strs[cnti]}`];
        //         }
        //     }
        // }
        //
        // console.log(`traceModel - option:${JSON.stringify(option)}`);
        var model = this.getVal(option.property, this);
        // console.log(`traceModel - val:->`);
        // console.log(val);
        this.setVal(option.property, model.val, traces);
        var traceModel = this.getVal(option.property, traces, '__');
        // console.log(`traceModel - valModel:->`);
        // console.log(valModel);
        //
        model.parent && model.prop &&
            Object.defineProperty(model.parent, model.prop, {
                get: function () {
                    return self.getVal(option.property, traces, '__').val;
                },
                set: function (value) {
                    // console.log(`traceModel - defineProperty.set - value:${value}`);
                    traceModel.parent["__" + model.prop] = value;
                    traces.__listen(option.property, value);
                },
            });
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