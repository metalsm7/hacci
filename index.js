"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
var Hacci = (function () {
    function Hacci(option) {
        if (option === void 0) { option = null; }
        this._id = null;
        this._el = null;
        this._refs = {};
        this._traces = {
            model: {
                value: {},
                listen: null,
            },
            elements: [],
        };
        this._txts_mstr = null;
        this._event_listeners = [];
        this._on = {
            created: null,
            mounted: null,
            destroyed: null,
        };
        this._toi_input = [
            'email', 'hidden', 'number', 'password', 'search', 'tel', 'url', 'datetime', 'text', 'textarea'
        ];
        this._toi_check = ['radio', 'checkbox'];
        this._toi_select = ['select-one', 'select-multiple'];
        this._bus = {};
        !option && (option = {
            id: null,
            el: null,
            template: null,
            data: null,
            computed: null,
            method: null,
            created: null,
            mounted: null,
            destroyed: null,
        });
        !option.id && (option.id = this.createInstanceId());
        if (!(new RegExp(/^[a-zA-Z_][0-9a-zA-Z_-]+$/)).test(option.id)) {
            throw new Error('id format is invalid');
        }
        this._id = option.id;
        Hacci.instances[this._id] = this;
        option.el && (this._el = option.el);
        option.template && (this._template = option.template);
        if (option.data) {
            var data_keys = Object.keys(option.data);
            for (var cnti = 0; cnti < data_keys.length; cnti++) {
                this[data_keys[cnti]] = option.data[data_keys[cnti]];
                this.redefineModel(data_keys[cnti]);
            }
        }
        if (option.computed) {
            var compute_keys = Object.keys(option.computed);
            for (var cnti = 0; cnti < compute_keys.length; cnti++) {
                this[compute_keys[cnti]] = this.fromArrowFunc(option.computed[compute_keys[cnti]]).bind(this);
            }
        }
        if (option.method) {
            var method_keys = Object.keys(option.method);
            for (var cnti = 0; cnti < method_keys.length; cnti++) {
                this[method_keys[cnti]] = this.fromArrowFunc(option.method[method_keys[cnti]]).bind(this);
            }
        }
        option.created && (this._on.created = this.fromArrowFunc(option.created).bind(this));
        option.mounted && (this._on.mounted = this.fromArrowFunc(option.mounted).bind(this));
        option.destroyed && (this._on.destroyed = this.fromArrowFunc(option.destroyed).bind(this));
        this._template && (this.el.innerHTML = this._template);
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
        var self = this;
        var calcRes = function (val) {
            var fn = new Function(self._txts_mstr + "return " + val + ";");
            var fnRes = fn.apply(self);
            typeof (fnRes) === 'function' && (fnRes = fnRes());
            return fnRes;
        };
        var callSet = function (model, val) {
            console.log("init - callSet - this." + model + "=" + val + ";");
            var fn = new Function("console.log('this." + model + "='+arguments[0]);this." + model + "=arguments[0];");
            return fn.apply(self, [val]);
        };
        var call = function (val) {
            var exec = val;
            if (val.indexOf('(') < 0) {
                exec += '()';
            }
            exec = exec.replace(/;$/, '');
            console.log("init - call - exec:" + exec);
            var fn = new Function(self._txts_mstr + "return " + exec + ";");
            return fn.apply(self);
        };
        var els = this.el.querySelectorAll('*');
        var _loop_1 = function (cnti) {
            var obj = els.item(cnti);
            var attrs = obj.attributes;
            var _loop_2 = function (cnti_1) {
                var attr = attrs.item(cnti_1);
                if ((/^hc:.+$/).test(attr.name)) {
                    var hc_attr = attr.name.substring(3);
                    console.log("hc:" + hc_attr);
                    if (hc_attr == 'ref') {
                        self._refs[attr.value] = obj;
                        if (obj.hasAttribute(attr.name)) {
                            obj.removeAttribute(attr.name);
                            --cnti_1;
                        }
                        return out_cnti_1 = cnti_1, "continue";
                    }
                    self._traces.elements.indexOf(obj) < 0 &&
                        self._traces.elements.push(obj);
                    !obj['_hc'] && (obj['_hc'] = {
                        attr: {},
                        comment: null,
                    });
                    if (hc_attr === 'neither') {
                        obj['_hc'].attr['if'] = "!(" + attr.value + ")";
                    }
                    else {
                        obj['_hc'].attr[hc_attr] = attr.value;
                    }
                    if (hc_attr === 'model') {
                        var val_1 = calcRes(attr.value);
                        Array.isArray(val_1) && self.arrayEventListener(val_1);
                        obj.tagName === 'INPUT' &&
                            ['radio', 'checkbox'].indexOf(obj.type) > -1 &&
                            obj.addEventListener('change', function (_evt) {
                                console.log("model.change");
                                var checked_value = null;
                                (obj.type === 'radio') && (checked_value = obj.checked ? obj.value : null);
                                (obj.type === 'checkbox') && (checked_value = obj.checked ? obj.value : (obj.hasAttribute('name') ? [] : null));
                                console.log("model.change - checked_value.#1:" + checked_value);
                                var group_name = obj.hasAttribute('name') ? obj.getAttribute('name') : null;
                                if (group_name) {
                                    var groups = self.el.querySelectorAll("*[name=" + group_name + "]");
                                    checked_value = self.getCheckedValue(groups, obj.type === 'checkbox');
                                    console.log("model.change - group_name:" + group_name + " - checked_value.#2:" + checked_value);
                                }
                                else {
                                    console.log("model.change - value - " + obj.value + " / " + val_1);
                                    checked_value = obj.checked ? obj.value : null;
                                    console.log("model.change - checked_value.#3:" + checked_value);
                                }
                                obj['_hc:force_apply'] = true;
                                console.log("model.change - callSet - " + attr.value + " / " + checked_value);
                                callSet(attr.value, checked_value);
                            });
                        obj.tagName === 'SELECT' &&
                            ['select-one', 'select-multiple'].indexOf(obj.type) > -1 &&
                            obj.addEventListener('change', function (_evt) {
                                var checked_value = (obj.type === 'select-one') ? null : [];
                                var groups = obj.querySelectorAll("option");
                                checked_value = self.getSelectedValue(groups, obj.type === 'select-multiple');
                                obj['_hc:force_apply'] = true;
                                callSet(attr.value, checked_value);
                            });
                        ['INPUT', 'TEXTAREA'].indexOf(obj.tagName) > -1 &&
                            ['email', 'hidden', 'number', 'password', 'search', 'tel', 'url', 'datetime', 'text', 'textarea'].indexOf(obj.type) > -1 &&
                            obj.addEventListener('input', function (_evt) {
                                obj['_hc:force_apply'] = true;
                                callSet(attr.value, obj.value);
                            });
                    }
                    switch (hc_attr) {
                        case 'click':
                        case 'scroll':
                            self.registEventListener(obj, hc_attr, attr);
                            break;
                        case 'scroll.hit.top':
                        case 'scroll.hit.bottom':
                            self.registEventListener(obj, 'scroll', attr, function (evt) {
                                if (attr.name.indexOf('bottom') > -1 ?
                                    (self.scrollTop(obj) + self.innerHeight(obj) >= self.scrollHeight(obj)) :
                                    (self.scrollTop(obj) <= 0)) {
                                    call(attr.value);
                                }
                            });
                            break;
                    }
                    if (obj.hasAttribute(attr.name)) {
                        obj.removeAttribute(attr.name);
                        --cnti_1;
                    }
                }
                out_cnti_1 = cnti_1;
            };
            var out_cnti_1;
            for (var cnti_1 = 0; cnti_1 < attrs.length; cnti_1++) {
                _loop_2(cnti_1);
                cnti_1 = out_cnti_1;
            }
        };
        for (var cnti = 0; cnti < els.length; cnti++) {
            _loop_1(cnti);
        }
        ;
        this.applyModel();
    };
    Hacci.prototype.redefineModel = function (prop, parent, prev_model_prop) {
        if (parent === void 0) { parent = null; }
        if (prev_model_prop === void 0) { prev_model_prop = null; }
        var self = this;
        if (!self._traces.model.listen) {
            self._traces.model.listen = function () {
                console.log("redefineModel.listen.#1");
                self.applyModel();
                console.log("redefineModel.listen.#2");
            };
        }
        !parent && (parent = self);
        var model = self._traces.model.value;
        console.log("redefineModel[" + self._id + "] - " + JSON.stringify({ prop: prop, prev_model_prop: prev_model_prop }));
        var model_prop = prev_model_prop ? prev_model_prop + ".__" + prop : "__" + prop;
        console.log("redefineModel - model_prop." + model_prop);
        if (typeof (model[model_prop]) === 'undefined') {
            model[model_prop] = parent[prop];
        }
        var val = parent[prop];
        Object.defineProperty(parent, prop, {
            get: function () {
                return model[model_prop];
            },
            set: function (value) {
                console.log("set:" + prop + " [" + model_prop + "]");
                model[model_prop] = value;
                self._traces.model.listen(model_prop, model[model_prop]);
            }
        });
        if ((val instanceof Object) && ['object'].indexOf(typeof (val)) > -1) {
            var keys = Object.keys(val);
            for (var cnti = 0; cnti < keys.length; cnti++) {
                var key = keys[cnti];
                this.redefineModel(key, val, model_prop);
            }
        }
    };
    Hacci.prototype.applyModel = function () {
        var self = this;
        if (!self._txts_mstr) {
            self._txts_mstr = '';
            var keys = Object.keys(self);
            for (var cnti = 0; cnti < keys.length; cnti++) {
                if (keys[cnti].length > 1 && keys[cnti].charAt(0) === '_')
                    continue;
                self._txts_mstr += "var " + keys[cnti] + "=this." + keys[cnti] + ";\n";
            }
        }
        var calcRes = function (val) {
            var fn = new Function(self._txts_mstr + "return " + val + ";");
            var fnRes = fn.apply(self);
            typeof (fnRes) === 'function' && (fnRes = fnRes());
            return fnRes;
        };
        var call = function (val) {
            var exec = val;
            if (val.indexOf('(') < 0) {
                exec += '()';
            }
            exec = exec.replace(/;$/, '');
            console.log("applyModel - call - exec:" + exec);
            var fn = new Function(self._txts_mstr + "return " + exec + ";");
            return fn.apply(self);
        };
        var model_groups = [];
        for (var cnti = 0; cnti < self._traces.elements.length; cnti++) {
            var el = self._traces.elements[cnti];
            var hc = el['_hc'];
            if (hc['attr']['if']) {
                var fnRes = calcRes(hc['attr']['if']);
                console.log("if - " + hc['attr']['if'] + " = " + fnRes);
                if (fnRes === true && hc['comment']) {
                    console.log("if - comment -> real");
                    hc['comment'].parentNode.insertBefore(el, hc['comment']);
                    hc['comment'].parentNode.removeChild(hc['comment']);
                    delete hc['comment'];
                    hc['comment'] = null;
                }
                else if (fnRes === false && !hc['comment']) {
                    console.log("if - real -> comment");
                    hc['comment'] = window.document.createComment("//hc:" + self._id + ":" + self.createTagId());
                    el.parentNode.insertBefore(hc['comment'], el);
                    el.parentNode.removeChild(el);
                }
            }
            else if (hc['attr']['disabled']) {
                var fnRes = calcRes(hc['attr']['disabled']);
                el.disabled = fnRes;
            }
            else if (hc['attr']['html']) {
                var fnRes = calcRes(hc['attr']['html']);
                el.innerHTML = fnRes;
            }
            else if (hc['attr']['text']) {
                var fnRes = calcRes(hc['attr']['text']);
                el.innerText = fnRes;
            }
            else if (hc['attr']['value']) {
                var fnRes = calcRes(hc['attr']['value']);
                el.value = fnRes;
            }
            else if (hc['attr']['model']) {
                var fnRes = calcRes(hc['attr']['model']);
                if (el.tagName === 'INPUT' && self._toi_check.indexOf(el.type) > -1) {
                    var call_on_change = false;
                    var group_name = el.hasAttribute('name') ? el.getAttribute('name') : null;
                    console.log("applyModel - input - group_name:" + group_name + (group_name ? " / model_groups.indexOf:" + model_groups.indexOf(group_name) : ''));
                    if (group_name) {
                        if (model_groups.indexOf(group_name) < 0) {
                            model_groups.push(group_name);
                            var groups = self.el.querySelectorAll("*[name=" + group_name + "]");
                            var changed = self.setCheckedValue(groups, fnRes);
                            console.log("applyModel - input - group_name:" + group_name + " - groups:" + groups + " / " + groups.length);
                            console.log("applyModel - input - group_name:" + group_name + " - changed:" + changed);
                            call_on_change = hc['attr']['change'] && changed;
                            console.log("applyModel - input - group_name:" + group_name + " - call_on_change:" + call_on_change);
                        }
                    }
                    else {
                        var prev = el.checked;
                        console.log("applyModel - input - prev:" + prev);
                        console.log("applyModel - input - checked:" + el.checked + " / value - " + el.value + " / " + fnRes);
                        el.checked = el.value == fnRes;
                        call_on_change = el.checked != prev;
                        console.log("applyModel - input - call_on_change:" + call_on_change);
                    }
                    console.log("applyModel - input - _hc:force_apply:" + el['_hc:force_apply']);
                    if (!call_on_change && el['_hc:force_apply']) {
                        call_on_change = true;
                        delete el['_hc:force_apply'];
                    }
                    call_on_change && hc['attr']['change'] && call(hc['attr']['change']);
                }
                else if (el.tagName === 'SELECT' && self._toi_select.indexOf(el.type) > -1) {
                    var call_on_change = false;
                    console.log("applyModel - select");
                    var groups = el.querySelectorAll("option");
                    var changed = self.setSelectedValue(groups, fnRes);
                    console.log("applyModel - select - groups:" + groups + " / " + groups.length);
                    console.log("applyModel - select - changed:" + changed);
                    call_on_change = hc['attr']['change'] && changed;
                    console.log("applyModel - select - call_on_change:" + call_on_change);
                    console.log("applyModel - select - _hc:force_apply:" + el['_hc:force_apply']);
                    if (!call_on_change && el['_hc:force_apply']) {
                        call_on_change = true;
                        delete el['_hc:force_apply'];
                    }
                    call_on_change && hc['attr']['change'] && call(hc['attr']['change']);
                }
                else if (['INPUT', 'TEXTAREA'].indexOf(el.tagName) > -1 && self._toi_input.indexOf(el.type) > -1) {
                    var call_on_input = false;
                    console.log("applyModel - input2 - tagName:" + el.tagName + " - value = " + el.value + " / " + fnRes);
                    var changed = el.value != fnRes;
                    console.log("applyModel - input2 - tagName:" + el.tagName + " - changed:" + changed);
                    el.value = fnRes;
                    call_on_input = hc['attr']['input'] && changed;
                    console.log("applyModel - input2 - tagName:" + el.tagName + " - call_on_input:" + call_on_input);
                    console.log("applyModel - input2 - _hc:force_apply:" + el['_hc:force_apply']);
                    if (!call_on_input && el['_hc:force_apply']) {
                        call_on_input = true;
                        delete el['_hc:force_apply'];
                    }
                    call_on_input && hc['attr']['input'] && call(hc['attr']['input']);
                }
            }
        }
    };
    Hacci.prototype.arrayEventListener = function (target) {
        var listen = this._traces.model.listen();
        target.push = function () {
            var args = [];
            for (var _i = 0; _i < arguments.length; _i++) {
                args[_i] = arguments[_i];
            }
            var _a;
            var rtn_val = (_a = Array.prototype.push).call.apply(_a, [target].concat(args));
            listen();
            return rtn_val;
        },
            target.pop = function () {
                var args = [];
                for (var _i = 0; _i < arguments.length; _i++) {
                    args[_i] = arguments[_i];
                }
                var _a;
                var rtn_val = (_a = Array.prototype.pop).call.apply(_a, [target].concat(args));
                listen();
                return rtn_val;
            },
            target.splice = function () {
                var args = [];
                for (var _i = 0; _i < arguments.length; _i++) {
                    args[_i] = arguments[_i];
                }
                var _a;
                var rtn_val = (_a = Array.prototype.splice).call.apply(_a, [target].concat(args));
                listen();
                return rtn_val;
            },
            target.shift = function () {
                var args = [];
                for (var _i = 0; _i < arguments.length; _i++) {
                    args[_i] = arguments[_i];
                }
                var _a;
                var rtn_val = (_a = Array.prototype.shift).call.apply(_a, [target].concat(args));
                listen();
                return rtn_val;
            },
            target.unshift = function () {
                var args = [];
                for (var _i = 0; _i < arguments.length; _i++) {
                    args[_i] = arguments[_i];
                }
                var _a;
                var rtn_val = (_a = Array.prototype.unshift).call.apply(_a, [target].concat(args));
                listen();
                return rtn_val;
            };
    };
    Hacci.prototype.registEventListener = function (el, name, attr, listener) {
        if (listener === void 0) { listener = null; }
        var self = this;
        var call = function (evt, val) {
            var exec = val;
            if (val.indexOf('(') < 0) {
                exec += '(_event)';
            }
            exec = exec.replace(/;$/, '');
            var args = "try{ var _event=arguments[0]; } catch(e) { _event=arguments[0]; }\n";
            console.log("registEventListener - call - exec:" + exec);
            var fn = new Function("" + self._txts_mstr + args + "return " + exec + ";");
            return fn.apply(self, [evt]);
        };
        !listener &&
            (listener = function (evt) { call(evt, attr.value); });
        el.addEventListener(name, listener);
        this._event_listeners.push({
            el: el, name: name, listener: listener,
        });
    };
    Hacci.prototype.clearEventListeners = function () {
        for (var cnti = 0; cnti < this._event_listeners.length; cnti++) {
            var listener = this._event_listeners[cnti];
            listener.el.removeEventListener(listener.name, listener.listener);
        }
        this._event_listeners = [];
    };
    Hacci.prototype.scrollHeight = function (el) {
        return el.nodeType === 9 ?
            Number(window.document.documentElement.scrollHeight) :
            Number(el.scrollHeight);
    };
    Hacci.prototype.scrollTop = function (el) {
        var rtn_val = el.nodeType === 9 ?
            window.pageYOffset :
            el.scrollTop;
        return Math.ceil(rtn_val);
    };
    Hacci.prototype.innerHeight = function (el) {
        var rtn_val = el.nodeType === 9 ?
            Number(Math.max(el.body.scrollHeight, el.documentElement.scrollHeight, el.body.offsetHeight, el.documentElement.offsetHeight, el.documentElement.clientHeight)) :
            Number(el.clientHeight);
        return Math.ceil(rtn_val);
    };
    Hacci.prototype.refresh = function () {
        this.clearData();
        this.init();
    };
    Hacci.prototype.clearData = function () {
        var regx = new RegExp(/^__hc\.(v_.+|lstn$|refs$)/);
        var keys = Object.keys(this);
        for (var cnti = 0; cnti < keys.length; cnti++) {
            if (regx.test(keys[cnti])) {
                delete this[keys[cnti]];
            }
        }
    };
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
        return this.getRandomString(6) + "_" + Date.now();
    };
    Hacci.prototype.isArrowFunc = function (func) {
        return typeof func.prototype === 'undefined';
    };
    Hacci.prototype.fromArrowFunc = function (func) {
        if (this.isArrowFunc(func)) {
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
        return rtn_val;
    };
    Hacci.prototype.getSelectedValue = function (groups, return_as_array) {
        if (return_as_array === void 0) { return_as_array = false; }
        var rtn_val = return_as_array ? [] : null;
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
        return rtn_val;
    };
    Hacci.prototype.setCheckedValue = function (groups, value) {
        var rtn_val = false;
        var has_checked = false;
        for (var cntk = 0; cntk < groups.length; cntk++) {
            var item = groups[cntk];
            !has_checked && item.checked && (has_checked = true);
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
            console.log("setCheckedValue.proc - item.value:" + item.value + " / item.checked:" + item.checked + " / value:" + JSON.stringify(value) + " / rtn_val:" + rtn_val);
            if (rtn_val)
                break;
        }
        console.log("setCheckedValue.proc - has_checked:" + has_checked + " / rtn_val:" + rtn_val);
        for (var cntk = 0; cntk < groups.length; cntk++) {
            var item = groups[cntk];
            item.checked = Array.isArray(value) ?
                (value.indexOf(item.value) > -1) :
                (value == item.value);
        }
        return rtn_val;
    };
    Hacci.prototype.setSelectedValue = function (groups, value) {
        var rtn_val = false;
        var has_selected = false;
        for (var cntk = 0; cntk < groups.length; cntk++) {
            var item = groups[cntk];
            !has_selected && item.selected && (has_selected = true);
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
            console.log("setSelectedValue.proc - item.value:" + item.value + " / item.selected:" + item.selected + " / value:" + JSON.stringify(value) + " / rtn_val:" + rtn_val);
            if (rtn_val)
                break;
        }
        console.log("setSelectedValue.proc - has_selected:" + has_selected + " / rtn_val:" + rtn_val);
        for (var cntk = 0; cntk < groups.length; cntk++) {
            var item = groups[cntk];
            item.selected = Array.isArray(value) ?
                (value.indexOf(item.value) > -1) :
                (value == item.value);
        }
        return rtn_val;
    };
    Hacci.prototype.on = function (event, callback) {
        !this._bus[event] && (this._bus[event] = []);
        if (this._bus[event].indexOf(callback) > -1)
            return;
        this._bus[event].push(callback);
    };
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
    Hacci.prototype.destroy = function () {
    };
    Hacci.prototype.mount = function (el) {
        el && (this._el = el);
        this.init();
        return this;
    };
    Object.defineProperty(Hacci.prototype, "el", {
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
    Hacci._instances = {};
    return Hacci;
}());
exports.Hacci = Hacci;
// window['Hacci'] = Hacci;
exports.default = Hacci;
//# sourceMappingURL=index.js.map