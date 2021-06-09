"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
var Hacci = /** @class */ (function () {
    /**
     * 생성자
     * @param option
     */
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
        this._toi_input = [
            'email', 'hidden', 'number', 'password', 'search', 'tel', 'url', 'datetime', 'text', 'textarea'
        ];
        this._toi_check = ['radio', 'checkbox'];
        this._toi_select = ['select-one', 'select-multiple'];
        //
        this._bus = {};
        /**
         * Array 값 수정이 발생한 경우 감지를 위한 이벤트 처리
         * @param prop
         * @param target
         */
        this.arrayEventListener = function (prop, target) {
            //
            var traces = this._traces.model;
            //
            target.push = function () {
                var args = [];
                for (var _i = 0; _i < arguments.length; _i++) {
                    args[_i] = arguments[_i];
                }
                var _a;
                var rtn_val = (_a = Array.prototype.push).call.apply(_a, [target].concat(args));
                traces.__listen(prop, target);
                return rtn_val;
            },
                target.pop = function () {
                    var args = [];
                    for (var _i = 0; _i < arguments.length; _i++) {
                        args[_i] = arguments[_i];
                    }
                    var _a;
                    var rtn_val = (_a = Array.prototype.pop).call.apply(_a, [target].concat(args));
                    traces.__listen(prop, target);
                    return rtn_val;
                },
                target.splice = function () {
                    var args = [];
                    for (var _i = 0; _i < arguments.length; _i++) {
                        args[_i] = arguments[_i];
                    }
                    var _a;
                    var rtn_val = (_a = Array.prototype.splice).call.apply(_a, [target].concat(args));
                    traces.__listen(prop, target);
                    return rtn_val;
                },
                target.shift = function () {
                    var args = [];
                    for (var _i = 0; _i < arguments.length; _i++) {
                        args[_i] = arguments[_i];
                    }
                    var _a;
                    var rtn_val = (_a = Array.prototype.shift).call.apply(_a, [target].concat(args));
                    traces.__listen(prop, target);
                    return rtn_val;
                },
                target.unshift = function () {
                    var args = [];
                    for (var _i = 0; _i < arguments.length; _i++) {
                        args[_i] = arguments[_i];
                    }
                    var _a;
                    var rtn_val = (_a = Array.prototype.unshift).call.apply(_a, [target].concat(args));
                    traces.__listen(prop, target);
                    return rtn_val;
                };
        };
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
    /**
     * 초기화
     */
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
                // 1. attribute 처리
                //
                var attrs = obj['attributes'];
                var _loop_2 = function (cnti_1) {
                    if (/^hc:(model|if|neither|html|text)$/.test(attrs[cnti_1].name)) {
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
                                //hc:
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
                        else if (/^hc:html$/.test(attrs[cnti_1].name)) {
                            var model = this_1.getVal(attrs[cnti_1].value, this_1);
                            obj.innerHTML = model.val;
                        }
                        else if (/^hc:text$/.test(attrs[cnti_1].name)) {
                            var model = this_1.getVal(attrs[cnti_1].value, this_1);
                            obj.innerText = model.val;
                        }
                        else if (!/^hc:model$/.test(attrs[cnti_1].name)) {
                            return "continue";
                        }
                        //
                        if (obj.tagName === 'INPUT' && self._toi_check.indexOf(obj.type) > -1) {
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
                                (obj.type === 'checkbox') && (checked_value = obj.checked ? obj.value : (obj.hasAttribute('name') ? [] : null));
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
                                Array.isArray(checked_value) && self.arrayEventListener(model_1.prop, checked_value);
                                //
                                var target_obj = self.getVal(attrs[cnti_1].value, self._traces.model, '__');
                                target_obj.parent[target_obj.prop] = checked_value;
                                //
                                // console.log(`init - ${obj.tagName} - ${obj.type} - changed`);
                                _this.modelTrigger(obj);
                            });
                        }
                        else if (obj.tagName === 'SELECT' && self._toi_select.indexOf(obj.type) > -1) {
                            // 초기값 설정
                            var model_2 = this_1.getVal(attrs[cnti_1].value, this_1);
                            //
                            var groups = obj.querySelectorAll("option");
                            self.setSelectedValue(groups, model_2.val);
                            // 이벤트 처리 등록
                            obj.addEventListener('change', function (_evt) {
                                var checked_value = (obj.type === 'select-one') ? null : [];
                                //
                                var groups = obj.querySelectorAll("option");
                                checked_value = self.getSelectedValue(groups, obj.type === 'select-multiple');
                                //
                                Array.isArray(checked_value) && self.arrayEventListener(model_2.prop, checked_value);
                                //
                                var target_obj = self.getVal(attrs[cnti_1].value, self._traces.model, '__');
                                target_obj.parent[target_obj.prop] = checked_value;
                                //
                                _this.modelTrigger(obj);
                            });
                        }
                        else if (['INPUT', 'TEXTAREA'].indexOf(obj.tagName) > -1 && self._toi_input.indexOf(obj.type) > -1) {
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
                // 2. text 처리
                var text = obj.innerText;
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
                            // case 'hc:text':
                            //     (obj as HTMLInputElement).innerText = this[attrs[cnti].value];
                            //     break;
                            // case 'hc:html':
                            //     (obj as HTMLInputElement).innerHTML = this[attrs[cnti].value];
                            //     break;
                        }
                    }
                }
            }
        }
        //
        this._on && this._on.mounted && this._on.mounted();
    };
    /**
     * HTML 변경된 경우 이를 반영시키기 위해 기존 자료 삭제 및 초기화 처리
     */
    Hacci.prototype.refresh = function () {
        //
        this.clearData();
        //
        this.clearEventListeners();
        //
        this.init();
    };
    /**
     * model 정보 초기화
     */
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
    Hacci.prototype.clearEventListeners = function () {
        //
        for (var cnti = 0; cnti < this._event_listeners.length; cnti++) {
            var listener = this._event_listeners[cnti];
            listener.el.removeEventListener(listener.name, listener.listener);
        }
        //
        this._event_listeners = [];
    };
    /**
     * 대상 element의 change/input 등의 이벤트로 인한 변경시 연결된 model에 적용 처리
     * @param el
     */
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
                        if (obj.tagName === 'INPUT' && this._toi_check.indexOf(obj.type) > -1) {
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
                        else if (obj.tagName === 'SELECT' && this._toi_select.indexOf(obj.type) > -1) {
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
                        else if (['INPUT', 'TEXTAREA'].indexOf(obj.tagName) > -1 && this._toi_input.indexOf(obj.type) > -1) {
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
                    else if (/^hc:html$/.test(attrs[cnti_5].name) && attrs[cnti_5].value === target_attr.value) {
                        obj.innerHTML = model.val;
                    }
                    else if (/^hc:text$/.test(attrs[cnti_5].name) && attrs[cnti_5].value === target_attr.value) {
                        obj.innerText = model.val;
                    }
                }
            }
        }
    };
    /**
     * hc:(change|event)에 지정된 method 호출 처리
     * @param option
     */
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
            // const args = option.attr.value.replace(/^\w*\(/, '').replace(/\)$/, '').split(',');
            var args_1 = option.attr.value.replace(/^\w*\(/, '').replace(/\)$/, '').split(/,(?=(?:(?:[^']*'){2})*[^']*$)/);
            args_1.forEach(function (el, idx) {
                var new_el = el.replace(/^\s*/, '').replace(/\s*$/, '');
                args_1[idx] = new_el === '_event' ? option.evt : eval(new_el);
            });
            //
            // if (args.length < 2 && args[0] === '') args[0] = option.evt;
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
    /**
     * 숫자/영문대소문자 조합의 랜덤문자열 생성
     * @param length
     */
    Hacci.prototype.getRandomString = function (length) {
        var rtn_val = '';
        for (var cnti = 0; cnti < length; cnti++) {
            var code = Math.floor(Math.random() * 51);
            rtn_val += String.fromCharCode(code + (code < 26 ? 65 : 71));
        }
        return rtn_val;
    };
    /**
     * 현재 객체의 id값 생성
     */
    Hacci.prototype.createInstanceId = function () {
        return this.getRandomString(8) + '_' + Date.now();
    };
    /**
     * comment 등 tag_id 만들기 위한 id값 생성
     */
    Hacci.prototype.createTagId = function () {
        // return `//hc:${this._id}:_tag_${this.getRandomString(4)}_${Date.now()}`;
        return this.getRandomString(6) + "_" + Date.now();
    };
    /**
     * tag_id로 특정된 comment element 반환
     * @param parent
     * @param tag_id
     */
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
    /**
     * arrow function 여부 반환
     * @param func
     */
    Hacci.prototype.isArrowFunc = function (func) {
        return typeof func.prototype === 'undefined';
    };
    /**
     * arrow function 을 일반 function 으로 변경 처리.
     * (this 혼란 제거)
     * @param func
     */
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
    /**
     * radio/checkbox element에 대해 현재 checked된 값 반환
     * @param groups
     * @param return_as_array true인 경우 배열로, 아니면 단일값 반환. name 속성으로 묶인 경우 true 사용
     */
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
    /**
     * select 하위 option element에 대해 현재 selected된 값 반환
     * @param groups
     * @param return_as_array true인 경우 배열로, 아니면 단일값 반환. multiple인 경우 true 사용
     */
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
    /**
     * radio/checkbox element에 대해 지정된 값으로 checked 처리
     * @param groups
     * @param value
     */
    Hacci.prototype.setCheckedValue = function (groups, value) {
        //
        var rtn_val = false; // 변경 여부 반환
        //
        var has_checked = false;
        for (var cntk = 0; cntk < groups.length; cntk++) {
            var item = groups[cntk];
            //
            !has_checked && item.checked && (has_checked = true);
            //
            !rtn_val &&
                (item.checked &&
                    (Array.isArray(value) ?
                        (value.indexOf(item.value) < 0) :
                        (value != item.value))
                    ||
                        !item.checked &&
                            (Array.isArray(value) ?
                                (value.indexOf(item.value) > -1) :
                                (value == item.value))) &&
                (rtn_val = true);
            //
            if (rtn_val)
                break;
        }
        !has_checked && !rtn_val && (rtn_val = true);
        // console.log(`setCheckedValue.proc - has_checked:${has_checked} / rtn_val:${rtn_val}`);
        //
        for (var cntk = 0; cntk < groups.length; cntk++) {
            var item = groups[cntk];
            //
            item.checked = Array.isArray(value) ?
                (value.indexOf(item.value) > -1) :
                (value == item.value);
        }
        //
        return rtn_val;
    };
    /**
     * select 하위 option element에 대해 지정된 값으로 selected 처리
     * @param groups
     * @param value
     */
    Hacci.prototype.setSelectedValue = function (groups, value) {
        // console.log(`setSelectedValue - value:${JSON.stringify(value)}`);
        //
        var rtn_val = false; // 변경 여부 반환
        //
        var has_selected = false;
        for (var cntk = 0; cntk < groups.length; cntk++) {
            var item = groups[cntk];
            //
            !has_selected && item.selected && (has_selected = true);
            //
            !rtn_val &&
                (item.selected &&
                    (Array.isArray(value) ?
                        (value.indexOf(item.value) < 0) :
                        (value != item.value))
                    ||
                        !item.selected &&
                            (Array.isArray(value) ?
                                (value.indexOf(item.value) > -1) :
                                (value == item.value))) &&
                (rtn_val = true);
            //
            if (rtn_val)
                break;
        }
        !has_selected && !rtn_val && (rtn_val = true);
        //
        for (var cntk = 0; cntk < groups.length; cntk++) {
            var item = groups[cntk];
            //
            item.selected = Array.isArray(value) ?
                (value.indexOf(item.value) > -1) :
                (value == item.value);
        }
        //
        return rtn_val;
    };
    /**
     * model값 반환
     * @param val
     * @param init_parent
     * @param prefix
     */
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
    /**
     * model 값 설정
     * @param target
     * @param val
     * @param init_parent
     */
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
        // console.log(`traceModel - option:${JSON.stringify(option)}`);
        //
        !this._traces.model['__listen'] &&
            (this._traces.model['__listen'] = function (property, value) {
                // console.log(`traceModel - listen - property:${property} / value:${value}`);
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
                        else if (/^hc:html$/.test(attrs[cntk].name) && attrs[cntk].value === property) {
                            obj.innerHTML = option.parent[option.property];
                        }
                        else if (/^hc:text$/.test(attrs[cntk].name) && attrs[cntk].value === property) {
                            obj.innerText = option.parent[option.property];
                        }
                        else if (/^hc:model$/.test(attrs[cntk].name) && attrs[cntk].value === property) {
                            //
                            if (obj.tagName === 'INPUT' && self._toi_check.indexOf(obj.type) > -1) {
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
                            else if (obj.tagName === 'SELECT' && self._toi_select.indexOf(obj.type) > -1) {
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
                            else if (['INPUT', 'TEXTAREA'].indexOf(obj.tagName) > -1 && self._toi_input.indexOf(obj.type) > -1) {
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
            });
        var traces = this._traces.model;
        var model = this.getVal(option.property, this);
        this.setVal(option.property, model.val, traces);
        var traceModel = this.getVal(option.property, traces, '__');
        //
        Array.isArray(model.parent[model.prop]) && this.arrayEventListener(option.property, model.parent[model.prop]);
        //
        model.parent && model.prop &&
            Object.defineProperty(model.parent, model.prop, {
                get: function () {
                    var rtn_val = self.getVal(option.property, traces, '__').val;
                    return rtn_val;
                },
                set: function (value) {
                    traceModel.parent["__" + model.prop] = value;
                    Array.isArray(value) && self.arrayEventListener(option.property, value);
                    traces.__listen(option.property, value);
                }
            });
    };
    /**
     * event로 특정된 이벤트에 대한 리스닝 처리 등록
     * @param event
     * @param callback
     */
    Hacci.prototype.on = function (event, callback) {
        !this._bus[event] && (this._bus[event] = []);
        //
        if (this._bus[event].indexOf(callback) > -1)
            return;
        //
        this._bus[event].push(callback);
    };
    /**
     * event로 특정된 이벤트에 대한 리스닝 처리 삭제
     * @param event
     * @param callback null이면 event 전체 삭제 처리
     */
    Hacci.prototype.off = function (event, callback) {
        if (callback === void 0) { callback = null; }
        if (this._bus[event] && !callback) {
            delete this._bus[event];
        }
        else if (this._bus[event] && callback) {
            var idx = this._bus[event].indexOf(callback);
            if (idx > -1) {
                this._bus[event].splice(idx, 1);
            }
        }
    };
    /**
     * event로 특정된 이벤트 호출 처리
     * @param event
     * @param args
     */
    Hacci.prototype.emit = function (event) {
        var args = [];
        for (var _i = 1; _i < arguments.length; _i++) {
            args[_i - 1] = arguments[_i];
        }
        var _a;
        if (!this._bus[event])
            return 0;
        var rtn_val = 0;
        for (var cnti = 0; cnti < this._bus[event].length; cnti++) {
            try {
                (_a = this._bus[event])[cnti].apply(_a, args);
                rtn_val++;
            }
            catch (e) { }
        }
        return rtn_val;
    };
    /**
     * Hacci 객체 삭제
     */
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
    /**
     * 대상 Element에 대해 Hacci 기능 사용을 위한 처리를 진행합니다. mount 후에 mounted 이벤트가 발생합니다.
     * @param el 생성자에서 선언하지 않은 경우 한정하여 사용
     */
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