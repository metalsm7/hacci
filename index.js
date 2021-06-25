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
            txts: [],
            fors: [],
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
        var _this = this;
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
        var callSet = function (model, val) {
            var fn = new Function("this." + model + "=arguments[0];(Array.isArray(this." + model + ") && this.arrayEventListener(this." + model + "));");
            return fn.apply(self, [val]);
        };
        var call = function (val) {
            var exec = val;
            if (val.indexOf('(') < 0) {
                exec += '()';
            }
            exec = exec.replace(/;$/, '');
            var fn = new Function(self._txts_mstr + "return " + exec + ";");
            return fn.apply(self);
        };
        var observer = new MutationObserver(function (mutationsList, observer) {
            for (var _i = 0, mutationsList_1 = mutationsList; _i < mutationsList_1.length; _i++) {
                var mutation = mutationsList_1[_i];
                if (mutation.type === 'childList') {
                    var nodes = mutation.removedNodes;
                    var content_removed = nodes && nodes.length > 0 && (nodes[0] === _this.el);
                    if (content_removed) {
                        observer.disconnect();
                        _this.clearEventListeners();
                        _this.destroy();
                    }
                }
            }
        });
        observer.observe(this.el.parentElement, { attributes: false, childList: true, subtree: false });
        var els = this.el.querySelectorAll('*');
        for (var cnti = 0; cnti < els.length; cnti++) {
            var obj = els.item(cnti);
            var attrs = obj.attributes;
            for (var cntk = 0; cntk < attrs.length; cntk++) {
                var attr = attrs.item(cntk);
                if ((/^hc:for$/).test(attr.name)) {
                    self._traces.fors.indexOf(obj) < 0 &&
                        self._traces.fors.push(obj);
                    var forComment = window.document.createComment("//hc-for:" + self._id + ":" + self.createTagId());
                    obj.parentNode.insertBefore(forComment, obj);
                    obj.parentNode.removeChild(obj);
                    !obj['_hc'] && (obj['_hc'] = {
                        attr: {},
                        comment: null,
                        for: null,
                    });
                    obj['_hc'].attr['for'] = attr.value;
                    obj['_hc'].for = forComment;
                    console.log("for - outerHTML:" + obj.outerHTML);
                }
            }
        }
        this.searchTextNodes();
        els = this.el.querySelectorAll('*');
        var _loop_1 = function (cnti) {
            var obj = els.item(cnti);
            var attrs = obj.attributes;
            var _loop_2 = function (cntk) {
                var attr = attrs.item(cntk);
                if ((/^hc:.+$/).test(attr.name)) {
                    var hc_attr = attr.name.substring(3);
                    if (hc_attr === 'for')
                        return out_cntk_1 = cntk, "continue";
                    if (hc_attr == 'ref') {
                        self._refs[attr.value] = obj;
                        if (obj.hasAttribute(attr.name)) {
                            obj.removeAttribute(attr.name);
                            --cntk;
                        }
                        return out_cntk_1 = cntk, "continue";
                    }
                    self._traces.elements.indexOf(obj) < 0 &&
                        self._traces.elements.push(obj);
                    !obj['_hc'] && (obj['_hc'] = {
                        attr: {},
                        comment: null,
                        for: null,
                    });
                    if (hc_attr === 'neither') {
                        obj['_hc'].attr['if'] = "!(" + attr.value + ")";
                    }
                    else {
                        obj['_hc'].attr[hc_attr] = attr.value;
                    }
                    if (hc_attr === 'model') {
                        var val = calcRes(attr.value);
                        Array.isArray(val) && self.arrayEventListener(val);
                        obj.tagName === 'INPUT' &&
                            ['radio', 'checkbox'].indexOf(obj.type) > -1 &&
                            obj.addEventListener('change', function (_evt) {
                                var checked_value = null;
                                (obj.type === 'radio') && (checked_value = obj.checked ? obj.value : null);
                                (obj.type === 'checkbox') && (checked_value = obj.checked ? obj.value : (obj.hasAttribute('name') ? [] : null));
                                var group_name = obj.hasAttribute('name') ? obj.getAttribute('name') : null;
                                if (group_name) {
                                    var groups = self.el.querySelectorAll("*[name=" + group_name + "]");
                                    checked_value = self.getCheckedValue(groups, obj.type === 'checkbox');
                                }
                                else {
                                    checked_value = obj.checked ? obj.value : null;
                                }
                                obj['_hc:force_apply'] = true;
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
                        default:
                            typeof (window["on" + hc_attr]) !== 'undefined' &&
                                self.registEventListener(obj, hc_attr, attr);
                            break;
                    }
                    if (obj.hasAttribute(attr.name)) {
                        obj.removeAttribute(attr.name);
                        --cntk;
                    }
                }
                out_cntk_1 = cntk;
            };
            var out_cntk_1;
            for (var cntk = 0; cntk < attrs.length; cntk++) {
                _loop_2(cntk);
                cntk = out_cntk_1;
            }
        };
        for (var cnti = 0; cnti < els.length; cnti++) {
            _loop_1(cnti);
        }
        ;
        this.applyModel();
        this.applyFor();
        this._on && this._on.mounted && this._on.mounted();
    };
    Hacci.prototype.redefineModel = function (prop, parent, prev_model_prop) {
        if (parent === void 0) { parent = null; }
        if (prev_model_prop === void 0) { prev_model_prop = null; }
        var self = this;
        if (!self._traces.model.listen) {
            self._traces.model.listen = function () {
                self.applyModel();
            };
        }
        !parent && (parent = self);
        var model = self._traces.model.value;
        var model_prop = prev_model_prop ? prev_model_prop + ".__" + prop : "__" + prop;
        if (typeof (model[model_prop]) === 'undefined') {
            model[model_prop] = parent[prop];
        }
        var val = parent[prop];
        Object.defineProperty(parent, prop, {
            get: function () {
                return model[model_prop];
            },
            set: function (value) {
                model[model_prop] = value;
                Array.isArray(model[model_prop]) && self.arrayEventListener(model[model_prop]);
                self._traces.model.listen(model_prop, model[model_prop]);
                self.applyTextChange();
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
    Hacci.prototype.applyFor = function () {
        var self = this;
        for (var cnti = 0; cnti < self._traces.fors.length; cnti++) {
            var el = self._traces.fors[cnti];
            var hc = el['_hc'];
            var html = el.outerHTML;
            console.log("applyFor - html:" + html);
        }
    };
    Hacci.prototype.applyModel = function () {
        var self = this;
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
            var fn = new Function(self._txts_mstr + "return " + exec + ";");
            return fn.apply(self);
        };
        var model_groups = [];
        for (var cnti = 0; cnti < self._traces.elements.length; cnti++) {
            var el = self._traces.elements[cnti];
            var hc = el['_hc'];
            if (hc['attr']['if']) {
                var fnRes = calcRes(hc['attr']['if']);
                if (fnRes === true && hc['comment']) {
                    hc['comment'].parentNode.insertBefore(el, hc['comment']);
                    hc['comment'].parentNode.removeChild(hc['comment']);
                    delete hc['comment'];
                    hc['comment'] = null;
                }
                else if (fnRes === false && !hc['comment']) {
                    hc['comment'] = window.document.createComment("//hc:" + self._id + ":" + self.createTagId());
                    el.parentNode.insertBefore(hc['comment'], el);
                    el.parentNode.removeChild(el);
                }
            }
            if (hc['attr']['disabled']) {
                var fnRes = calcRes(hc['attr']['disabled']);
                el.disabled = fnRes;
            }
            if (hc['attr']['html']) {
                var fnRes = calcRes(hc['attr']['html']);
                el.innerHTML = fnRes;
            }
            if (hc['attr']['text']) {
                var fnRes = calcRes(hc['attr']['text']);
                el.innerText = fnRes;
            }
            if (hc['attr']['value']) {
                var fnRes = calcRes(hc['attr']['value']);
                el.value = fnRes;
            }
            if (hc['attr']['model']) {
                var fnRes = calcRes(hc['attr']['model']);
                if (el.tagName === 'INPUT' && self._toi_check.indexOf(el.type) > -1) {
                    var call_on_change = false;
                    var group_name = el.hasAttribute('name') ? el.getAttribute('name') : null;
                    if (group_name) {
                        if (model_groups.indexOf(group_name) < 0) {
                            model_groups.push(group_name);
                            var groups = self.el.querySelectorAll("*[name=" + group_name + "]");
                            var changed = self.setCheckedValue(groups, fnRes);
                            call_on_change = hc['attr']['change'] && changed;
                        }
                    }
                    else {
                        var prev = el.checked;
                        el.checked = el.value == fnRes;
                        call_on_change = el.checked != prev;
                    }
                    if (!call_on_change && el['_hc:force_apply']) {
                        call_on_change = true;
                        delete el['_hc:force_apply'];
                    }
                    call_on_change && hc['attr']['change'] && call(hc['attr']['change']);
                }
                else if (el.tagName === 'SELECT' && self._toi_select.indexOf(el.type) > -1) {
                    var call_on_change = false;
                    var groups = el.querySelectorAll("option");
                    var changed = self.setSelectedValue(groups, fnRes);
                    call_on_change = hc['attr']['change'] && changed;
                    if (!call_on_change && el['_hc:force_apply']) {
                        call_on_change = true;
                        delete el['_hc:force_apply'];
                    }
                    call_on_change && hc['attr']['change'] && call(hc['attr']['change']);
                }
                else if (['INPUT', 'TEXTAREA'].indexOf(el.tagName) > -1 && self._toi_input.indexOf(el.type) > -1) {
                    var call_on_input = false;
                    var changed = el.value != fnRes;
                    el.value = fnRes;
                    call_on_input = hc['attr']['input'] && changed;
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
        var self = this;
        target.push = function () {
            var args = [];
            for (var _i = 0; _i < arguments.length; _i++) {
                args[_i] = arguments[_i];
            }
            var _a;
            var rtn_val = (_a = Array.prototype.push).call.apply(_a, [target].concat(args));
            self._traces.model.listen();
            return rtn_val;
        },
            target.pop = function () {
                var args = [];
                for (var _i = 0; _i < arguments.length; _i++) {
                    args[_i] = arguments[_i];
                }
                var _a;
                var rtn_val = (_a = Array.prototype.pop).call.apply(_a, [target].concat(args));
                self._traces.model.listen();
                return rtn_val;
            },
            target.splice = function () {
                var args = [];
                for (var _i = 0; _i < arguments.length; _i++) {
                    args[_i] = arguments[_i];
                }
                var _a;
                var rtn_val = (_a = Array.prototype.splice).call.apply(_a, [target].concat(args));
                self._traces.model.listen();
                return rtn_val;
            },
            target.shift = function () {
                var args = [];
                for (var _i = 0; _i < arguments.length; _i++) {
                    args[_i] = arguments[_i];
                }
                var _a;
                var rtn_val = (_a = Array.prototype.shift).call.apply(_a, [target].concat(args));
                self._traces.model.listen();
                return rtn_val;
            },
            target.unshift = function () {
                var args = [];
                for (var _i = 0; _i < arguments.length; _i++) {
                    args[_i] = arguments[_i];
                }
                var _a;
                var rtn_val = (_a = Array.prototype.unshift).call.apply(_a, [target].concat(args));
                self._traces.model.listen();
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
    Hacci.prototype.searchTextNodes = function (parent) {
        if (parent === void 0) { parent = null; }
        !parent && (parent = this.el);
        if (parent.hasChildNodes()) {
            for (var cnti = 0; cnti < parent.childNodes.length; cnti++) {
                switch (parent.childNodes[cnti].nodeType) {
                    case 1:
                        this.searchTextNodes(parent.childNodes[cnti]);
                        break;
                    case 3:
                        /{{([^}}\r\n]+)?}}/g.test(parent.childNodes[cnti].textContent) &&
                            this._traces.txts.push({
                                node: parent.childNodes[cnti],
                                text: parent.childNodes[cnti].textContent,
                                fn: null
                            });
                        break;
                }
            }
            this.applyTextChange();
        }
    };
    Hacci.prototype.applyTextChange = function () {
        var txts = this._traces.txts;
        for (var cnti = 0; cnti < txts.length; cnti++) {
            if (!txts[cnti].fn) {
                txts[cnti].fn = this.compileText(txts[cnti].text);
            }
            txts[cnti].node.textContent = txts[cnti].fn.apply(this);
        }
    };
    Hacci.prototype.compileText = function (html) {
        if (!this._txts_mstr) {
            this._txts_mstr = '';
            var keys = Object.keys(this);
            for (var cnti = 0; cnti < keys.length; cnti++) {
                if (keys[cnti].length > 1 && keys[cnti].charAt(0) === '_')
                    continue;
                this._txts_mstr += "var " + keys[cnti] + "=this." + keys[cnti] + ";\n";
            }
        }
        var re = /{{([^}}]+)?}}/g, reExp = /(^( )?(if|for|else|switch|case|break|{|}))(.*)?/g, code = this._txts_mstr + 'var r=[];\n', cursor = 0, match;
        var add = function (line, js) {
            if (js === void 0) { js = null; }
            js ? (code += line.match(reExp) ? line + '\n' : 'r.push(' + line + ');\n') :
                (code += line != '' ? 'r.push("' + line.replace(/"/g, '\\"') + '");\n' : '');
            return add;
        };
        while (match = re.exec(html)) {
            add(html.slice(cursor, match.index))(match[1], true);
            cursor = match.index + match[0].length;
        }
        add(html.substr(cursor, html.length - cursor));
        code += 'return r.join("");';
        return new Function(code.replace(/[\r\t\n]/g, ''));
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
            if (rtn_val)
                break;
        }
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
            if (rtn_val)
                break;
        }
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
        this.clearEventListeners();
        this._refs = {};
        this._template && this.el.parentElement.removeChild(this.el);
        this._template = null;
        this._el = null;
        this._on && this._on.destroyed && this._on.destroyed();
        this._on = {
            created: null,
            mounted: null,
            destroyed: null,
        };
        if (Hacci.instances[this._id]) {
            Hacci.instances[this._id] = null;
            delete Hacci.instances[this._id];
        }
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