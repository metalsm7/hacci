"use strict";
// Object.defineProperty(exports, "__esModule", { value: true });
var Hacci = /** @class */ (function () {
    function Hacci(option) {
        if (option === void 0) { option = null; }
        //
        this._id = null;
        this._el = null;
        //
        this._refs = {};
        this._traces = {
            model: {},
        };
        //
        this._objs = {};
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
        this._type_of_check_input = ['radio', 'checkbox'];
        this._type_of_select_input = ['select-one', 'select-multiple'];
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
            var data_keys = Object.keys(option.data);
            for (var cnti = 0; cnti < data_keys.length; cnti++) {
                this[data_keys[cnti]] = option.data[data_keys[cnti]];
            }
        }
        //
        if (option.method) {
            var method_keys = Object.keys(option.method);
            for (var cnti = 0; cnti < method_keys.length; cnti++) {
                this[method_keys[cnti]] = this.fromArrowFunc(option.method[method_keys[cnti]]).bind(this);
            }
        }
        //
        option.created && (this._on.created = this.fromArrowFunc(option.created).bind(this));
        option.mounted && (this._on.mounted = this.fromArrowFunc(option.mounted).bind(this));
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
                    if (/^hc:(model|if|neither)$/.test(attrs[cnti_1].name)) {
                        //
                        this_1.traceModel({
                            parent: this_1,
                            property: attrs[cnti_1].value,
                            value: null,
                        });
                        //
                        if (/^hc:(if|neither)$/.test(attrs[cnti_1].name)) {
                            var model = this_1.getVal(attrs[cnti_1].value, this_1);
                            if (/^hc:if$/.test(attrs[cnti_1].name) && model.val === false ||
                                /^hc:neither$/.test(attrs[cnti_1].name) && model.val === true) {
                                //
                                var tag_id = self.createTagId();
                                var blankEl = window.document.createComment("//hc:" + self._id + ":" + tag_id);
                                obj.parentNode.insertBefore(blankEl, obj);
                                //
                                !self._objs[attrs[cnti_1].value] && (self._objs[attrs[cnti_1].value] = []);
                                self._objs[attrs[cnti_1].value].push({
                                    type: 'if',
                                    tag_id: tag_id,
                                    parent: obj.parentElement,
                                    element: obj,
                                });
                                obj.parentNode.removeChild(obj);
                            }
                        }
                        else if (!/^hc:model$/.test(attrs[cnti_1].name)) {
                            return "continue";
                        }
                        //
                        if (obj.tagName === 'INPUT' && self._type_of_check_input.indexOf(obj.type) > -1) {
                            // 초기값 설정
                            var model_1 = this_1.getVal(attrs[cnti_1].value, this_1);
                            //
                            var group_name = obj.hasAttribute('name') ? obj.getAttribute('name') : null;
                            if (group_name) {
                                var groups = self.el.querySelectorAll("*[name=" + group_name + "]");
                                self.setCheckedValue(groups, model_1.val);
                            }
                            else {
                                obj.checked = obj.value == model_1.val;
                            }
                            // 이벤트 처리 등록
                            obj.addEventListener('change', function (_evt) {
                                var checked_value = null;
                                (obj.type === 'radio') && (checked_value = obj.checked ? obj.value : null);
                                (obj.type === 'checkbox') && (checked_value = obj.checked ? obj.value : []);
                                //
                                var group_name = obj.hasAttribute('name') ? obj.getAttribute('name') : null;
                                if (group_name) {
                                    var groups = self.el.querySelectorAll("*[name=" + group_name + "]");
                                    checked_value = self.getCheckedValue(groups, obj.type === 'checkbox');
                                }
                                else {
                                    obj.checked = obj.value == model_1.val;
                                }
                                //
                                var target_obj = self.getVal(attrs[cnti_1].value, self._traces.model, '__');
                                target_obj.parent[target_obj.prop] = checked_value;
                                //
                                _this.modelTrigger(obj);
                            });
                        }
                        else if (obj.tagName === 'SELECT' && self._type_of_select_input.indexOf(obj.type) > -1) {
                            // 초기값 설정
                            var model = this_1.getVal(attrs[cnti_1].value, this_1);
                            //
                            var groups = obj.querySelectorAll("option");
                            self.setSelectedValue(groups, model.val);
                            // 이벤트 처리 등록
                            obj.addEventListener('change', function (_evt) {
                                var checked_value = (obj.type === 'select-one') ? null : [];
                                //
                                var groups = obj.querySelectorAll("option");
                                checked_value = self.getSelectedValue(groups, obj.type === 'select-multiple');
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
                            //
                            obj.value = model.val;
                            // 이벤트 처리 등록
                            obj.addEventListener('input', function (_evt) {
                                // console.log(`on.input`);
                                var checked_value = obj.value;
                                //
                                var target_obj = self.getVal(attrs[cnti_1].value, self._traces.model, '__');
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
            }
        }
        if (target_attr) {
            var model = this.getVal(target_attr.value, this);
            //
            var target_names = [];
            //
            var objs = this.el.querySelectorAll('*');
            //
            for (var cnti = 0; cnti < objs.length; cnti++) {
                var obj = objs[cnti];
                //
                attrs = obj['attributes'];
                //
                var evt = {
                    change: {
                        proc: false,
                        attr: null,
                    },
                    input: {
                        proc: false,
                        attr: null,
                    },
                };
                //
                for (var cnti_3 = 0; cnti_3 < attrs.length; cnti_3++) {
                    if (/^hc:change$/.test(attrs[cnti_3].name)) {
                        evt.change.proc = true;
                        evt.change.attr = attrs[cnti_3].value;
                        break;
                    }
                }
                //
                for (var cnti_4 = 0; cnti_4 < attrs.length; cnti_4++) {
                    if (/^hc:input$/.test(attrs[cnti_4].name)) {
                        evt.input.proc = true;
                        evt.input.attr = attrs[cnti_4].value;
                        break;
                    }
                }
                //
                for (var cnti_5 = 0; cnti_5 < attrs.length; cnti_5++) {
                    if (/^hc:model$/.test(attrs[cnti_5].name) && attrs[cnti_5].value === target_attr.value) {
                        //
                        if (obj.tagName === 'INPUT' && this._type_of_check_input.indexOf(obj.type) > -1) {
                            if (Array.isArray(model.val)) {
                                obj.checked = model.val.indexOf(obj.value) > -1;
                            }
                            else {
                                obj.checked = model.val == obj.value;
                            }
                            //
                            var group_name = obj.hasAttribute('name') ? obj.getAttribute('name') : null;
                            var target_added = target_names.indexOf(group_name) > -1;
                            target_added && (evt.change.proc = false);
                            if (!target_added) {
                                target_names.push(group_name);
                            }
                            //
                            evt.change.proc && this.callMethod({
                                attr: {
                                    value: evt.change.attr,
                                },
                                evt: null,
                            });
                        }
                        else if (obj.tagName === 'SELECT' && this._type_of_select_input.indexOf(obj.type) > -1) {
                            var groups = obj.querySelectorAll("option");
                            for (var cntk = 0; cntk < groups.length; cntk++) {
                                if (Array.isArray(model.val)) {
                                    groups[cntk].selected = model.val.indexOf(groups[cntk].value) > -1;
                                }
                                else {
                                    groups[cntk].selected = model.val == groups[cntk].value;
                                }
                            }
                            //
                            evt.change.proc && this.callMethod({
                                attr: {
                                    value: evt.change.attr,
                                },
                                evt: null,
                            });
                        }
                        else if (['INPUT', 'TEXTAREA'].indexOf(obj.tagName) > -1 && this._type_of_event_input.indexOf(obj.type) > -1) {
                            obj.value = model.val;
                            //
                            evt.input.proc && this.callMethod({
                                attr: {
                                    value: evt.input.attr,
                                },
                                evt: null,
                            });
                        }
                    }
                }
            }
        }
    };
    Hacci.prototype.registEventListener = function (el, name, attr) {
        var _this = this;
        //
        var listener = function (evt) {
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
        // console.log(`callMethod - option:${JSON.stringify(option)}`);
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
    // private commitEvent(element: HTMLElement, event_name: string) {
    //     let event = null;
    //     if(typeof(Event) === 'function') {
    //         event = new Event(event_name);
    //     }
    //     else {
    //         event = document.createEvent('Event');
    //         event.initEvent(event_name, true, true);
    //     }
    //     console.log(`commitEvent - dispatchEvent - event:->`);
    //     console.log(event);
    //     //
    //     element.dispatchEvent(event);
    // }
    Hacci.prototype.getRandomString = function (length) {
        var rtn_val = '';
        for (var cnti = 0; cnti < length; cnti++) {
            var code = Math.floor(Math.random() * 51);
            rtn_val += String.fromCharCode(code + (code < 26 ? 65 : 71));
        }
        return rtn_val;
    };
    Hacci.prototype.createInstanceId = function () {
        return this.getRandomString(8) + '_' + Date.now();
    };
    Hacci.prototype.createTagId = function () {
        // return `//hc:${this._id}:_tag_${this.getRandomString(4)}_${Date.now()}`;
        return this.getRandomString(6) + "_" + Date.now();
    };
    Hacci.prototype.getCommentElement = function (parent, tag_id) {
        var rtn_val = null;
        for (var cnti = 0; cnti < parent.childNodes.length; cnti++) {
            var node = parent.childNodes[cnti];
            if (node.nodeType === Node.COMMENT_NODE && node.textContent == "//hc:" + this._id + ":" + tag_id) {
                rtn_val = node;
                break;
            }
        }
        return rtn_val;
    };
    //
    Hacci.prototype.isArrowFunc = function (func) {
        return typeof func.prototype === 'undefined';
    };
    //
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
    Hacci.prototype.getCheckedValue = function (groups, return_as_array) {
        if (return_as_array === void 0) { return_as_array = false; }
        var rtn_val = return_as_array ? [] : null;
        //
        for (var cntk = 0; cntk < groups.length; cntk++) {
            var item = groups[cntk];
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
        //
        for (var cntk = 0; cntk < groups.length; cntk++) {
            var item = groups[cntk];
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
        // console.log(`setCheckedValue - value:${JSON.stringify(value)}`);
        //
        var rtn_val = false; // 변경 여부 반환
        //
        for (var cntk = 0; cntk < groups.length; cntk++) {
            var item = groups[cntk];
            //
            !rtn_val &&
                item.checked &&
                (Array.isArray(value) ?
                    (value.indexOf(item.value) < 0) :
                    (value != item.value)) &&
                (rtn_val = true);
            // if (Array.isArray(value)) {
            //     // 변경 확인 처리
            //     !rtn_val && item.checked && (value.indexOf(item.value) < 0) && (rtn_val = true);
            //     // console.log(`setCheckedValue.1 - checked:${item.checked} / value:${value} / item.value:${item.value} / rtn_val:${rtn_val}`);
            // }
            // else {
            //     // 변경 확인 처리
            //     !rtn_val && item.checked && (value != item.value) && (rtn_val = true);
            //     // console.log(`setCheckedValue.2 - checked:${item.checked} / value:${value} / item.value:${item.value} / rtn_val:${rtn_val}`);
            // }
        }
        //
        for (var cntk = 0; cntk < groups.length; cntk++) {
            var item = groups[cntk];
            //
            item.checked = Array.isArray(value) ?
                (value.indexOf(item.value) > -1) :
                (value == item.value);
            // if (Array.isArray(value)) {
            //     //
            //     item.checked = value.indexOf(item.value) > -1;
            // }
            // else {
            //     //
            //     item.checked = value == item.value;
            // }
        }
        //
        return rtn_val;
    };
    //
    Hacci.prototype.setSelectedValue = function (groups, value) {
        // console.log(`setSelectedValue - value:${JSON.stringify(value)}`);
        //
        var rtn_val = false; // 변경 여부 반환
        //
        for (var cntk = 0; cntk < groups.length; cntk++) {
            var item = groups[cntk];
            //
            !rtn_val &&
                item.selected &&
                (Array.isArray(value) ?
                    (value.indexOf(item.value) < 0) :
                    (value != item.value)) &&
                (rtn_val = true);
            // if (Array.isArray(value)) {
            //     // 변경 확인 처리
            //     !rtn_val && item.selected && (value.indexOf(item.value) < 0) && (rtn_val = true);
            //     // console.log(`setSelectedValue.1 - selected:${item.selected} / value:${value} / item.value:${item.value} / rtn_val:${rtn_val}`);
            // }
            // else {
            //     // 변경 확인 처리
            //     !rtn_val && item.selected && (value != item.value) && (rtn_val = true);
            //     // console.log(`setSelectedValue.2 - selected:${item.selected} / value:${value} / item.value:${item.value} / rtn_val:${rtn_val}`);
            // }
        }
        //
        for (var cntk = 0; cntk < groups.length; cntk++) {
            var item = groups[cntk];
            //
            item.selected = Array.isArray(value) ?
                (value.indexOf(item.value) > -1) :
                (value == item.value);
            // if (Array.isArray(value)) {
            //     //
            //     item.selected = value.indexOf(item.value) > -1;
            // }
            // else {
            //     //
            //     item.selected = value == item.value;
            // }
        }
        //
        return rtn_val;
    };
    Hacci.prototype.getVal = function (val, init_parent, prefix) {
        if (prefix === void 0) { prefix = ''; }
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
                // console.log(`listen - property:${property} / value:${value}`);
                //
                if (self._objs[property] && Array.isArray(self._objs[property])) {
                    for (var cnti = 0; cnti < self._objs[property].length; cnti++) {
                        var el = self._objs[property][cnti];
                        if (el.type === 'if') {
                            var commentEl = self.getCommentElement(el.parent, el.tag_id);
                            if (commentEl) {
                                commentEl.parentNode.insertBefore(el.element, commentEl);
                                commentEl.parentNode.removeChild(commentEl);
                                //
                                self._objs[property].splice(cnti, 1);
                                cnti--;
                                //
                                if (self._objs[property].length < 1) {
                                    delete self._objs[property];
                                    break;
                                }
                            }
                        }
                    }
                }
                //
                var target_names = [];
                //
                var objs = self.el.querySelectorAll('*');
                for (var cnti = 0; cnti < objs.length; cnti++) {
                    var obj = objs[cnti];
                    //
                    var attrs = obj['attributes'];
                    //
                    var evt = {
                        change: {
                            proc: false,
                            attr: null,
                        },
                        input: {
                            proc: false,
                            attr: null,
                        },
                    };
                    //
                    for (var cntk = 0; cntk < attrs.length; cntk++) {
                        if (/^hc:change$/.test(attrs[cntk].name)) {
                            evt.change.proc = true;
                            evt.change.attr = attrs[cntk].value;
                            break;
                        }
                    }
                    //
                    for (var cntk = 0; cntk < attrs.length; cntk++) {
                        if (/^hc:input$/.test(attrs[cntk].name)) {
                            evt.input.proc = true;
                            evt.input.attr = attrs[cntk].value;
                            break;
                        }
                    }
                    // console.log(`traceModel - listen - evt:${JSON.stringify(evt)}`);
                    //
                    for (var cntk = 0; cntk < attrs.length; cntk++) {
                        if (/^hc:(if|neither)$/.test(attrs[cntk].name) && attrs[cntk].value === property) {
                            if (/^hc:if$/.test(attrs[cntk].name) && value === false ||
                                /^hc:neither$/.test(attrs[cntk].name) && value === true) {
                                //
                                var tag_id = self.createTagId();
                                var blankEl = window.document.createComment("//hc:" + self._id + ":" + tag_id);
                                obj.parentNode.insertBefore(blankEl, obj);
                                //
                                !self._objs[property] && (self._objs[property] = []);
                                self._objs[property].push({
                                    type: 'if',
                                    tag_id: tag_id,
                                    parent: obj.parentElement,
                                    element: obj,
                                });
                                obj.parentNode.removeChild(obj);
                            }
                        }
                        else if (/^hc:model$/.test(attrs[cntk].name) && attrs[cntk].value === property) {
                            //
                            if (obj.tagName === 'INPUT' && self._type_of_check_input.indexOf(obj.type) > -1) {
                                var group_name = obj.hasAttribute('name') ? obj.getAttribute('name') : null;
                                // const target_added = target_names.indexOf(group_name) > -1;
                                if (group_name) {
                                    var groups = self.el.querySelectorAll("*[name=" + group_name + "]");
                                    var changed = self.setCheckedValue(groups, value);
                                    //
                                    evt.change.proc = evt.change.proc && changed;
                                    //
                                    var target_added = target_names.indexOf(group_name) > -1;
                                    target_added && (evt.change.proc = false);
                                    if (!target_added) {
                                        target_names.push(group_name);
                                    }
                                }
                                else {
                                    obj.checked = obj.value == value;
                                }
                                //
                                // if (!target_added) {
                                //     target_names.push(group_name);
                                //     commit_events.change.indexOf(obj) < 0 && commit_events.change.push(obj);
                                // }
                                //
                                evt.change.proc && self.callMethod({
                                    attr: {
                                        value: evt.change.attr,
                                    },
                                    evt: null,
                                });
                            }
                            else if (obj.tagName === 'SELECT' && self._type_of_select_input.indexOf(obj.type) > -1) {
                                var groups = obj.querySelectorAll("option");
                                var changed = self.setSelectedValue(groups, value);
                                //
                                evt.change.proc = evt.change.proc && changed;
                                //
                                // commit_events.change.indexOf(obj) < 0 && commit_events.change.push(obj);
                                //
                                evt.change.proc && self.callMethod({
                                    attr: {
                                        value: evt.change.attr,
                                    },
                                    evt: null,
                                });
                            }
                            else if (['INPUT', 'TEXTAREA'].indexOf(obj.tagName) > -1 && self._type_of_event_input.indexOf(obj.type) > -1) {
                                //
                                var changed = obj.value != value;
                                //
                                evt.input.proc = evt.input.proc && changed;
                                //
                                obj.value = value;
                                //
                                // commit_events.input.indexOf(obj) < 0 && commit_events.input.push(obj);
                                //
                                evt.input.proc && self.callMethod({
                                    attr: {
                                        value: evt.input.attr,
                                    },
                                    evt: null,
                                });
                            }
                        }
                    }
                }
                //
                // console.log(`traceModel - commit_events:->`);
                // console.log(commit_events);
                // for (let cnti: number = 0; cnti < commit_events.change.length; cnti++) {
                //     self.commitEvent(commit_events.change[cnti], 'change');
                // }
                // for (let cnti: number = 0; cnti < commit_events.input.length; cnti++) {
                //     self.commitEvent(commit_events.input[cnti], 'input');
                // }
            });
        var traces = this._traces.model;
        var model = this.getVal(option.property, this);
        this.setVal(option.property, model.val, traces);
        var traceModel = this.getVal(option.property, traces, '__');
        //
        model.parent && model.prop &&
            Object.defineProperty(model.parent, model.prop, {
                get: function () {
                    return self.getVal(option.property, traces, '__').val;
                },
                set: function (value) {
                    traceModel.parent["__" + model.prop] = value;
                    traces.__listen(option.property, value);
                },
            });
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
// exports.Hacci = Hacci;
window['Hacci'] = Hacci;
// sourceMappingURL=index.js.map