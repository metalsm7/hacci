"use strict";
var __spreadArray = (this && this.__spreadArray) || function (to, from, pack) {
    if (pack || arguments.length === 2) for (var i = 0, l = from.length, ar; i < l; i++) {
        if (ar || !(i in from)) {
            if (!ar) ar = Array.prototype.slice.call(from, 0, i);
            ar[i] = from[i];
        }
    }
    return to.concat(ar || Array.prototype.slice.call(from));
};
// Object.defineProperty(exports, "__esModule", { value: true });
// exports.Hacci = void 0;
var Hacci = (function () {
    function Hacci(option) {
        var _this = this;
        if (option === void 0) { option = null; }
        this._id = null;
        this._el = null;
        this._refs = {};
        this._traces = {
            model: {
                value: {},
                listen: null,
                listen_array: null,
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
        this._tick = {
            limit: 50,
            timeout: null,
            targets: [],
        };
        !option && (option = {
            id: null,
            el: null,
            template: null,
            style: null,
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
        var template_mode = 'replace';
        option.template && typeof (option.template) === 'string' && (this._template = option.template);
        if (option.template && typeof (option.template) === 'object') {
            option.template['html'] && (this._template = option.template['html']);
            option.template['mode'] && (template_mode = option.template['mode']);
        }
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
                this[compute_keys[cnti]] = option.computed[compute_keys[cnti]].bind(this);
            }
        }
        if (option.method) {
            var method_keys = Object.keys(option.method);
            for (var cnti = 0; cnti < method_keys.length; cnti++) {
                this[method_keys[cnti]] = option.method[method_keys[cnti]].bind(this);
            }
        }
        option.created && (this._on.created = option.created.bind(this));
        option.mounted && (this._on.mounted = option.mounted.bind(this));
        option.destroyed && (this._on.destroyed = option.destroyed.bind(this));
        var hacci_class_name = "__hacci_".concat(this._id);
        if (typeof option.style === 'string') {
            var style_str = option.style.replace(/\r?\n\s*/g, '');
            style_str = style_str.replace(/(\s*)([{;}])(\s*)/g, '$2');
            style_str = style_str.replace(/([^{\s]*)(\s*)([^{]*)({[^}]*})/g, ".".concat(hacci_class_name, " $1$2$3$4")) +
                style_str.replace(/([^{\s]*)(\s*)([^{]*)({[^}]*})/g, "$1.".concat(hacci_class_name, "$2$3$4"));
            var style = window.document.createElement('style');
            style.textContent = style_str;
            window.document.head.appendChild(style);
        }
        if (this._template) {
            if (template_mode === 'attach') {
                this.el.innerHTML = this._template;
                !this.el.classList.contains(hacci_class_name) && this.el.classList.add(hacci_class_name);
            }
            else if (template_mode === 'replace') {
                var dom = window.document.createElement('div');
                dom.innerHTML = this._template;
                dom = dom.children.length > 0 ? dom.children.item(0) : null;
                if (dom) {
                    var src_attr = this.el.attributes;
                    for (var cnti = 0; cnti < src_attr.length; cnti++) {
                        var attr = src_attr[cnti];
                        !dom.hasAttribute(attr.name) && dom.setAttribute(attr.name, attr.value);
                    }
                    var src_classes = this.el.classList;
                    var tgt_classes = dom.classList;
                    for (var cnti = 0; cnti < src_classes.length; cnti++) {
                        var name_1 = src_classes.item(cnti);
                        !tgt_classes.contains(name_1) && tgt_classes.add(name_1);
                    }
                    this.el.parentNode.insertBefore(dom, this.el);
                    dom.parentNode.removeChild(this.el);
                    this._el = dom;
                    if (this._el.children.length > 0) {
                        var childs = this._el.children;
                        for (var cnti = 0; cnti < childs.length; cnti++) {
                            var child = childs.item(cnti);
                            !child.classList.contains(hacci_class_name) && child.classList.add(hacci_class_name);
                        }
                    }
                }
                else {
                    this.el.innerHTML = this._template;
                    !this.el.classList.contains(hacci_class_name) && this.el.classList.add(hacci_class_name);
                }
            }
        }
        else {
            !this.el.classList.contains(hacci_class_name) && this.el.classList.add(hacci_class_name);
        }
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
        this._on && this._on.created && this._on.created();
    }
    Object.defineProperty(Hacci, "instances", {
        get: function () {
            return Hacci._instances;
        },
        enumerable: false,
        configurable: true
    });
    Hacci.prototype.init = function () {
        var self = this;
        if (!self._txts_mstr) {
            self._txts_mstr = '';
            var keys = Object.keys(self);
            for (var cnti = 0; cnti < keys.length; cnti++) {
                if (keys[cnti].length > 1 && keys[cnti].charAt(0) === '_')
                    continue;
                self._txts_mstr += "var ".concat(keys[cnti], "=this.").concat(keys[cnti], ";\n");
            }
        }
        this.searchNodes(self.el);
        this.searchTextNodes(self.el);
        this.initModel();
        this._on && this._on.mounted && this._on.mounted();
    };
    Hacci.prototype.procForNodes = function (el) {
        if (el === void 0) { el = null; }
        var self = this;
        !el && (el = self.el);
        var els = el.querySelectorAll('*');
        var calcRes = function (val, model_str) {
            if (model_str === void 0) { model_str = null; }
            var fn = new Function("".concat(self._txts_mstr).concat(model_str ? model_str : '', "return ").concat(val, ";"));
            var fnRes = fn.apply(self);
            typeof (fnRes) === 'function' && (fnRes = fnRes());
            return fnRes;
        };
        var procNode = function (obj) {
            var attrs = obj.attributes;
            for (var cntk = 0; cntk < attrs.length; cntk++) {
                var attr = attrs.item(cntk);
                if ((/^hc:for$/).test(attr.name)) {
                    self._traces.fors.indexOf(obj) < 0 &&
                        self._traces.fors.push(obj);
                    var forComment = window.document.createComment("//hc-for:".concat(self._id, ":").concat(self.createTagId()));
                    obj.parentNode.insertBefore(forComment, obj);
                    obj.parentNode.removeChild(obj);
                    !obj['_hc'] && (obj['_hc'] = {
                        attr: {},
                        comment: null,
                        for_comment: null,
                        for_elements: [],
                        for_txts: [],
                        for_model: null,
                        model_str: null,
                    });
                    obj['_hc'].attr['for'] = attr.value;
                    obj['_hc'].for_comment = forComment;
                    var model_str = String(obj['_hc'].attr.for).replace(/(\(.*\)|.+)\s+(in)\s+/g, '').replace(/\s/g, '');
                    var model = calcRes(model_str);
                    obj['_hc'].for_model = model;
                    Array.isArray(model) && self.arrayEventListener(model);
                }
            }
        };
        procNode(el);
        for (var cnti = 0; cnti < els.length; cnti++) {
            var obj = els.item(cnti);
            procNode(obj);
        }
        self.procForModel();
    };
    Hacci.prototype.searchNodes = function (el) {
        var self = this;
        self.procForNodes(el);
        self.procNode(el);
        self.procNode(el.querySelectorAll('*'));
    };
    Hacci.prototype.procNode = function (node, root) {
        if (root === void 0) { root = null; }
        var self = this;
        var calcRes = function (val, model_str) {
            if (model_str === void 0) { model_str = null; }
            var fn = new Function("".concat(self._txts_mstr).concat(model_str ? model_str : '', "return ").concat(val, ";"));
            var fnRes = fn.apply(self);
            typeof (fnRes) === 'function' && (fnRes = fnRes());
            return fnRes;
        };
        var callSet = function (model, val) {
            var fn = new Function("this.".concat(model, "=arguments[0];(Array.isArray(this.").concat(model, ") && this.arrayEventListener(this.").concat(model, "));"));
            return fn.apply(self, [val]);
        };
        var call = function (val, model_str) {
            if (model_str === void 0) { model_str = null; }
            var exec = val;
            if (val.indexOf('(') < 0) {
                exec += '()';
            }
            exec = exec.replace(/;$/, '');
            var fn = new Function("".concat(self._txts_mstr).concat(model_str ? model_str : '', "return ").concat(exec, ";"));
            return fn.apply(self);
        };
        if (node instanceof NodeList) {
            for (var cnti = 0; cnti < node.length; cnti++) {
                self.procNode(node.item(cnti), root);
            }
            return;
        }
        var attrs = node.attributes;
        var _loop_1 = function (cnti) {
            var attr = attrs.item(cnti);
            if (!/^hc:.+$/.test(attr.name))
                return out_cnti_1 = cnti, "continue";
            var hc_attr = attr.name.substring(3);
            if (hc_attr === 'for') {
                if (node.hasAttribute(attr.name)) {
                    node.removeAttribute(attr.name);
                    --cnti;
                }
                return out_cnti_1 = cnti, "continue";
            }
            if (hc_attr === 'ref') {
                self._refs[attr.value] = node;
                if (node.hasAttribute(attr.name)) {
                    node.removeAttribute(attr.name);
                    --cnti;
                }
                return out_cnti_1 = cnti, "continue";
            }
            if (!root ||
                root && !root['_hc']) {
                self._traces.elements.indexOf(node) < 0 &&
                    self._traces.elements.push(node);
            }
            !node['_hc'] && (node['_hc'] = {
                attr: {},
                comment: null,
                for: null,
            });
            if (hc_attr === 'neither') {
                node['_hc'].attr['if'] = "!(".concat(attr.value, ")");
            }
            else {
                node['_hc'].attr[hc_attr] = attr.value;
            }
            if (hc_attr === 'model') {
                var val = calcRes(attr.value, root && root['_hc'] && root['_hc']['model_str'] ? root['_hc']['model_str'] : null);
                Array.isArray(val) && self.arrayEventListener(val);
                node.tagName === 'INPUT' &&
                    ['radio', 'checkbox'].indexOf(node.type) > -1 &&
                    node.addEventListener('change', function (_evt) {
                        var checked_value = null;
                        (node.type === 'radio') && (checked_value = node.checked ? node.value : null);
                        (node.type === 'checkbox') && (checked_value = node.checked ? node.value : (node.hasAttribute('name') ? [] : null));
                        var group_name = node.hasAttribute('name') ? node.getAttribute('name') : null;
                        if (group_name) {
                            var groups = root.querySelectorAll("*[name=".concat(group_name, "]"));
                            checked_value = self.getCheckedValue(groups, node.type === 'checkbox');
                        }
                        else {
                            checked_value = node.checked ? node.value : null;
                        }
                        node['_hc:force_apply'] = true;
                        callSet(attr.value, checked_value);
                    });
                node.tagName === 'SELECT' &&
                    ['select-one', 'select-multiple'].indexOf(node.type) > -1 &&
                    node.addEventListener('change', function (_evt) {
                        var checked_value = (node.type === 'select-one') ? null : [];
                        var groups = node.querySelectorAll("option");
                        checked_value = self.getSelectedValue(groups, node.type === 'select-multiple');
                        node['_hc:force_apply'] = true;
                        callSet(attr.value, checked_value);
                    });
                ['INPUT', 'TEXTAREA'].indexOf(node.tagName) > -1 &&
                    ['email', 'hidden', 'number', 'password', 'search', 'tel', 'url', 'datetime', 'text', 'textarea'].indexOf(node.type) > -1 &&
                    node.addEventListener('input', function (_evt) {
                        node['_hc:force_apply'] = true;
                        callSet(attr.value, node.value);
                    });
            }
            switch (hc_attr) {
                case 'scroll.hit.top':
                case 'scroll.hit.bottom':
                    self.registEventListener(node, 'scroll', attr, function (evt) {
                        if (attr.name.indexOf('bottom') > -1 ?
                            (self.scrollTop(node) + self.innerHeight(node) >= self.scrollHeight(node)) :
                            (self.scrollTop(node) <= 0)) {
                            call(attr.value, root && root['_hc'] && root['_hc']['model_str'] ? root['_hc']['model_str'] : null);
                        }
                    });
                    break;
                case 'input':
                case 'change':
                    break;
                default:
                    typeof (window["on".concat(hc_attr)]) !== 'undefined' &&
                        self.registEventListener(node, hc_attr, attr, null, root && root['_hc'] && root['_hc']['model_str'] ? root['_hc']['model_str'] : null);
                    break;
            }
            if (node.hasAttribute(attr.name)) {
                node.removeAttribute(attr.name);
                --cnti;
            }
            out_cnti_1 = cnti;
        };
        var out_cnti_1;
        for (var cnti = 0; cnti < attrs.length; cnti++) {
            _loop_1(cnti);
            cnti = out_cnti_1;
        }
    };
    Hacci.prototype.redefineModel = function (prop, parent, prev_model_prop) {
        if (parent === void 0) { parent = null; }
        if (prev_model_prop === void 0) { prev_model_prop = null; }
        prop = prop.replace(/([\.]__|^__)([^\.]+)/, '$2');
        var self = this;
        if (!self._traces.model.listen) {
            self._traces.model.listen = function (prop, model) {
                self.procModel();
                Array.isArray(model) && self.procForModel(model);
            };
        }
        if (!self._traces.model.listen_array) {
            self._traces.model.listen_array = function (model, action) {
                if (model === void 0) { model = null; }
                if (action === void 0) { action = null; }
                var args = [];
                for (var _i = 2; _i < arguments.length; _i++) {
                    args[_i - 2] = arguments[_i];
                }
                self.procModel();
                self.procForModel.apply(self, __spreadArray([model, action], args, false));
            };
        }
        !parent && (parent = self);
        var model = self._traces.model.value;
        var model_prop = prev_model_prop ? "".concat(prev_model_prop, ".__").concat(prop) : "__".concat(prop);
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
                var is_array = Array.isArray(model[model_prop]);
                is_array && self.arrayEventListener(model[model_prop]);
                self._traces.model.listen(model_prop, model[model_prop]);
                if (!is_array) {
                    var props = model_prop.split('.');
                    var props_str = '';
                    for (var cnti = 0; cnti < props.length; cnti++) {
                        props_str += "".concat(cnti > 0 ? '.' : '').concat(props[cnti]);
                        var props_model = model[props_str];
                        if (!Array.isArray(props_model))
                            continue;
                        self.procForModel(props_model, '_replace', model["".concat(props_str, ".").concat(props[cnti + 1])]);
                        self.redefineModel(props_str);
                    }
                }
                else {
                    self.redefineModel(model_prop);
                }
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
    Hacci.prototype.procForModel = function (src_model, action) {
        if (src_model === void 0) { src_model = null; }
        if (action === void 0) { action = null; }
        var args = [];
        for (var _i = 2; _i < arguments.length; _i++) {
            args[_i - 2] = arguments[_i];
        }
        var self = this;
        var getModelStr = function (attr, row_idx) {
            var rtn_val = '';
            var model_str = String(attr).replace(/(\(.*\)|.+)\s+(in)\s+/g, '').replace(/\s/g, '');
            var data_str = String(attr).replace(/\s+in\s+.*$/, '').replace(/\s/g, '');
            if (data_str.charAt(0) === '(') {
                var data_keys = data_str.substring(1, data_str.length - 1).split(',');
                for (var cnti = 0; cnti < data_keys.length; cnti++) {
                    rtn_val += "var ".concat(data_keys[cnti], "=").concat(model_str, "[").concat(row_idx, "]['").concat(data_keys[cnti], "'];\n");
                }
            }
            else {
                rtn_val = "var ".concat(data_str, "=").concat(model_str, "[").concat(row_idx, "];\n");
            }
            return rtn_val;
        };
        var procs = function (node, el) {
            self.procNode(node, el);
            self.procNode(node.querySelectorAll('*'), el);
            self.procTextNode(node, el);
            self.procTextModel(el);
            self.procModel(node, el);
            self.procModel(node.querySelectorAll('*'), el);
        };
        for (var cnti = 0; cnti < self._traces.fors.length; cnti++) {
            var el = self._traces.fors[cnti];
            var hc = el['_hc'];
            if (src_model && src_model !== hc.for_model) {
                hc.for_model = src_model;
                action = null;
            }
            var model = hc.for_model;
            var parentNode = hc.for_comment.parentNode;
            delete hc.for_txts;
            hc.for_txts = [];
            var clear = true;
            var rms = null;
            switch (action) {
                case 'push':
                    rms = [];
                    break;
                case 'pop':
                    rms = hc.for_elements.splice(hc.for_elements.length - 1, 1);
                    break;
                case 'shift':
                    rms = hc.for_elements.splice(0, 1);
                    break;
                case 'splice':
                    rms = hc.for_elements.splice(args[0] ? args[0] : null, args[1] ? args[1] : null);
                    break;
                case '_replace':
                    clear = false;
                    break;
                default:
                    break;
            }
            if (rms) {
                while (rms.length > 0) {
                    parentNode.removeChild(rms[0]);
                    rms.splice(0, 1);
                }
                clear = false;
            }
            while (clear && hc.for_elements.length > 0) {
                parentNode.removeChild(hc.for_elements[0]);
                hc.for_elements.splice(0, 1);
            }
            if (action && ['pop', 'shift'].indexOf(action) > -1)
                continue;
            if (action && action === '_replace') {
                for (var cntk = 0; cntk < model.length; cntk++) {
                    if (model[cntk] !== args[0])
                        continue;
                    hc['model_str'] = getModelStr(hc.attr.for, cntk);
                    var newNode = el.cloneNode(true);
                    procs(newNode, el);
                    var is_node_diff = self.replaceAttributes(hc.for_elements[cntk], newNode);
                    !is_node_diff && (is_node_diff = self.replaceTextNodes(hc.for_elements[cntk], newNode));
                    if (is_node_diff) {
                        parentNode.insertBefore(newNode, hc.for_elements[cntk]);
                        parentNode.removeChild(hc.for_elements[cntk]);
                        hc.for_elements[cntk] = newNode;
                    }
                }
            }
            else if (action && action === 'push') {
                for (var cntk = model.length - args.length; cntk < model.length; cntk++) {
                    hc['model_str'] = getModelStr(hc.attr.for, cntk);
                    var node = el.cloneNode(true);
                    procs(node, el);
                    parentNode.appendChild(node);
                    hc.for_elements.push(node);
                }
            }
            else if (action && action === 'splice') {
                var insert_idx = args[0];
                for (var cntk = insert_idx; cntk < insert_idx + args.length - 2; cntk++) {
                    hc['model_str'] = getModelStr(hc.attr.for, cntk);
                    var node = el.cloneNode(true);
                    procs(node, el);
                    if (hc.for_elements.length <= cntk) {
                        parentNode.appendChild(node);
                    }
                    else {
                        parentNode.insertBefore(node, hc.for_elements[cntk]);
                    }
                    hc.for_elements.splice(cntk, 0, node);
                }
            }
            else {
                for (var cntk = 0; cntk < model.length; cntk++) {
                    var node = null;
                    try {
                        node = hc.for_elements[cntk];
                    }
                    catch (e) { }
                    hc['model_str'] = getModelStr(hc.attr.for, cntk);
                    if (typeof (node) === 'undefined') {
                        node = el.cloneNode(true);
                        var len = hc.for_elements.length;
                        if (len > 0 && hc.for_elements[len - 1].nextElementSibling) {
                            parentNode.insertBefore(node, hc.for_elements[len - 1].nextElementSibling);
                        }
                        else {
                            parentNode.appendChild(node);
                        }
                        hc.for_elements.push(node);
                        procs(node, el);
                    }
                    else {
                        var newNode = el.cloneNode(true);
                        procs(newNode, el);
                        hc.for_elements[cntk] = newNode;
                        parentNode.insertBefore(newNode, node);
                        parentNode.removeChild(node);
                    }
                }
            }
        }
    };
    Hacci.prototype.initModel = function () {
        this.procModel(null, null, null, true);
    };
    Hacci.prototype.procModel = function (node, root, model_groups, is_init) {
        if (node === void 0) { node = null; }
        if (root === void 0) { root = null; }
        if (model_groups === void 0) { model_groups = null; }
        if (is_init === void 0) { is_init = false; }
        var self = this;
        !node && (node = self._traces.elements);
        var calcRes = function (val, opt_str) {
            if (opt_str === void 0) { opt_str = null; }
            var fn = new Function("".concat(self._txts_mstr).concat(opt_str ? opt_str : '', "return ").concat(val, ";"));
            var fnRes = fn.apply(self);
            typeof (fnRes) === 'function' && (fnRes = fnRes());
            return fnRes;
        };
        var call = function (val, opt_str) {
            if (opt_str === void 0) { opt_str = null; }
            var exec = val;
            if (val.indexOf('(') < 0) {
                exec += '()';
            }
            exec = exec.replace(/;$/, '');
            var fn = new Function("".concat(self._txts_mstr).concat(opt_str ? opt_str : '', "return ").concat(exec, ";"));
            return fn.apply(self);
        };
        if (node instanceof NodeList || Array.isArray(node)) {
            !model_groups && (model_groups = []);
            for (var cnti = 0; cnti < node.length; cnti++) {
                self.procModel(node[cnti], root, model_groups, is_init);
            }
            return;
        }
        if (!node['_hc'])
            return;
        var hc = node['_hc'];
        var attr_keys = Object.keys(hc['attr']);
        if (hc['attr']['if']) {
            var fnRes = calcRes(hc['attr']['if'], root && root['_hc'] && root['_hc']['model_str'] ? root['_hc']['model_str'] : null);
            if (fnRes === true && hc['comment']) {
                hc['comment'].parentNode.insertBefore(node, hc['comment']);
                hc['comment'].parentNode.removeChild(hc['comment']);
                delete hc['comment'];
                hc['comment'] = null;
            }
            else if (fnRes === false && !hc['comment']) {
                hc['comment'] = window.document.createComment("//hc:".concat(self._id, ":").concat(self.createTagId()));
                node.parentNode.insertBefore(hc['comment'], node);
                node.parentNode.removeChild(node);
            }
            attr_keys.splice(attr_keys.indexOf('if'), 1);
        }
        if (hc['attr']['class']) {
            var fnRes = calcRes(hc['attr']['class'], root && root['_hc'] && root['_hc']['model_str'] ? root['_hc']['model_str'] : null);
            node.className = fnRes;
            attr_keys.splice(attr_keys.indexOf('class'), 1);
        }
        if (hc['attr']['html']) {
            var fnRes = calcRes(hc['attr']['html'], root && root['_hc'] && root['_hc']['model_str'] ? root['_hc']['model_str'] : null);
            node.innerHTML = fnRes;
            attr_keys.splice(attr_keys.indexOf('html'), 1);
        }
        if (hc['attr']['text']) {
            var fnRes = calcRes(hc['attr']['text'], root && root['_hc'] && root['_hc']['model_str'] ? root['_hc']['model_str'] : null);
            node.innerText = fnRes;
            attr_keys.splice(attr_keys.indexOf('text'), 1);
        }
        if (hc['attr']['model']) {
            var fnRes = calcRes(hc['attr']['model'], root && root['_hc'] && root['_hc']['model_str'] ? root['_hc']['model_str'] : null);
            if (node.tagName === 'INPUT' && self._toi_check.indexOf(node.type) > -1) {
                var call_on_change = false;
                var group_name = node.hasAttribute('name') ? node.getAttribute('name') : null;
                if (group_name) {
                    if (model_groups.indexOf(group_name) < 0) {
                        model_groups.push(group_name);
                        var groups = self.el.querySelectorAll("*[name=".concat(group_name, "]"));
                        var changed = self.setCheckedValue(groups, fnRes);
                        call_on_change = hc['attr']['change'] && changed;
                    }
                }
                else {
                    var prev = node.checked;
                    node.checked = node.value == fnRes;
                    call_on_change = node.checked != prev;
                }
                if (!call_on_change && node['_hc:force_apply']) {
                    call_on_change = true;
                    delete node['_hc:force_apply'];
                }
                !is_init && call_on_change && hc['attr']['change'] && call(hc['attr']['change'], root && root['_hc'] && root['_hc']['model_str'] ? root['_hc']['model_str'] : null);
            }
            else if (node.tagName === 'SELECT' && self._toi_select.indexOf(node.type) > -1) {
                var call_on_change = false;
                var groups = node.querySelectorAll("option");
                var changed = self.setSelectedValue(groups, fnRes);
                call_on_change = hc['attr']['change'] && changed;
                if (!call_on_change && node['_hc:force_apply']) {
                    call_on_change = true;
                    delete node['_hc:force_apply'];
                }
                !is_init && call_on_change && hc['attr']['change'] && call(hc['attr']['change'], root && root['_hc'] && root['_hc']['model_str'] ? root['_hc']['model_str'] : null);
            }
            else if (['INPUT', 'TEXTAREA'].indexOf(node.tagName) > -1 && self._toi_input.indexOf(node.type) > -1) {
                var call_on_input = false;
                var changed = node.value != fnRes;
                node.value = fnRes;
                call_on_input = hc['attr']['input'] && changed;
                if (!call_on_input && node['_hc:force_apply']) {
                    call_on_input = true;
                    delete node['_hc:force_apply'];
                }
                !is_init && call_on_input && hc['attr']['input'] && call(hc['attr']['input'], root && root['_hc'] && root['_hc']['model_str'] ? root['_hc']['model_str'] : null);
            }
            attr_keys.splice(attr_keys.indexOf('model'), 1);
        }
        var regex = new RegExp(/^on/);
        for (var cnti = 0; cnti < attr_keys.length; cnti++) {
            var attr_key = attr_keys[cnti];
            if (regex.test(attr_key))
                continue;
            if (typeof (window["on".concat(attr_key)]) !== 'undefined')
                continue;
            if (attr_key.indexOf('.') > -1 && typeof (window["on".concat(attr_key.split('.')[0])]) !== 'undefined')
                continue;
            var fnRes = calcRes(hc['attr'][attr_key], root && root['_hc'] && root['_hc']['model_str'] ? root['_hc']['model_str'] : null);
            node[attr_key] = fnRes;
        }
    };
    Hacci.prototype.arrayEventListener = function (target) {
        var self = this;
        target.push = function () {
            var _a, _b;
            var args = [];
            for (var _i = 0; _i < arguments.length; _i++) {
                args[_i] = arguments[_i];
            }
            var rtn_val = (_a = Array.prototype.push).call.apply(_a, __spreadArray([target], args, false));
            (_b = self._traces.model).listen_array.apply(_b, __spreadArray([target, 'push'], args, false));
            return rtn_val;
        },
            target.pop = function () {
                var _a, _b;
                var args = [];
                for (var _i = 0; _i < arguments.length; _i++) {
                    args[_i] = arguments[_i];
                }
                var rtn_val = (_a = Array.prototype.pop).call.apply(_a, __spreadArray([target], args, false));
                (_b = self._traces.model).listen_array.apply(_b, __spreadArray([target, 'pop'], args, false));
                return rtn_val;
            },
            target.splice = function () {
                var _a, _b;
                var args = [];
                for (var _i = 0; _i < arguments.length; _i++) {
                    args[_i] = arguments[_i];
                }
                var rtn_val = (_a = Array.prototype.splice).call.apply(_a, __spreadArray([target], args, false));
                (_b = self._traces.model).listen_array.apply(_b, __spreadArray([target, 'splice'], args, false));
                return rtn_val;
            },
            target.shift = function () {
                var _a, _b;
                var args = [];
                for (var _i = 0; _i < arguments.length; _i++) {
                    args[_i] = arguments[_i];
                }
                var rtn_val = (_a = Array.prototype.shift).call.apply(_a, __spreadArray([target], args, false));
                (_b = self._traces.model).listen_array.apply(_b, __spreadArray([target, 'shift'], args, false));
                return rtn_val;
            },
            target.unshift = function () {
                var _a, _b;
                var args = [];
                for (var _i = 0; _i < arguments.length; _i++) {
                    args[_i] = arguments[_i];
                }
                var rtn_val = (_a = Array.prototype.unshift).call.apply(_a, __spreadArray([target], args, false));
                (_b = self._traces.model).listen_array.apply(_b, __spreadArray([target, 'splice', 0, 0], args, false));
                return rtn_val;
            };
    };
    Hacci.prototype.registEventListener = function (el, name, attr, listener, model_str) {
        if (listener === void 0) { listener = null; }
        if (model_str === void 0) { model_str = null; }
        var self = this;
        var call = function (evt, val, model_str) {
            if (model_str === void 0) { model_str = null; }
            var exec = val;
            if (val.indexOf('(') < 0) {
                exec += '(_event)';
            }
            exec = exec.replace(/;$/, '');
            var args = "try{ var _event=arguments[0]; } catch(e) { _event=arguments[0]; }\n";
            var fn = new Function("".concat(self._txts_mstr).concat(model_str ? model_str : '').concat(args, "return ").concat(exec, ";"));
            return fn.apply(self, [evt]);
        };
        !listener &&
            (listener = function (evt) { call(evt, attr.value, model_str); });
        el.addEventListener(name, listener);
        this._event_listeners.push({
            el: el,
            name: name,
            listener: listener,
        });
    };
    Hacci.prototype.clearEventListeners = function () {
        for (var cnti = 0; cnti < this._event_listeners.length; cnti++) {
            var listener = this._event_listeners[cnti];
            listener.el.removeEventListener(listener.name, listener.listener);
        }
        this._event_listeners = [];
    };
    Hacci.prototype.searchTextNodes = function (node, root) {
        if (root === void 0) { root = null; }
        !node && (node = this.el);
        if (node.hasChildNodes()) {
            for (var cnti = 0; cnti < node.childNodes.length; cnti++) {
                switch (node.childNodes[cnti].nodeType) {
                    case 1:
                        this.searchTextNodes(node.childNodes[cnti], root);
                        break;
                    case 3:
                        /{{([^}}\r\n]+)?}}/g.test(node.childNodes[cnti].textContent) &&
                            !root && this._traces.txts.push({
                            node: node.childNodes[cnti],
                            text: node.childNodes[cnti].textContent,
                            fn: null
                        });
                        /{{([^}}\r\n]+)?}}/g.test(node.childNodes[cnti].textContent) &&
                            root && root['_hc'] && root['_hc']['for_txts'] && root['_hc']['for_txts'].push({
                            node: node.childNodes[cnti],
                            text: node.childNodes[cnti].textContent,
                            fn: null
                        });
                        break;
                }
            }
            this.applyTextChange();
        }
    };
    Hacci.prototype.procTextNode = function (node, root) {
        if (root === void 0) { root = null; }
        !node && (node = this.el);
        if (node.hasChildNodes()) {
            for (var cnti = 0; cnti < node.childNodes.length; cnti++) {
                switch (node.childNodes[cnti].nodeType) {
                    case 1:
                        this.procTextNode(node.childNodes[cnti], root);
                        break;
                    case 3:
                        !root && /{{([^}}\r\n]+)?}}/g.test(node.childNodes[cnti].textContent) &&
                            this._traces.txts.push({
                                node: node.childNodes[cnti],
                                text: node.childNodes[cnti].textContent,
                                fn: null
                            });
                        root && /{{([^}}\r\n]+)?}}/g.test(node.childNodes[cnti].textContent) &&
                            root['_hc'] && root['_hc']['for_txts'] && root['_hc']['for_txts'].push({
                            node: node.childNodes[cnti],
                            text: node.childNodes[cnti].textContent,
                            fn: null
                        });
                        break;
                }
            }
        }
    };
    Hacci.prototype.applyTextChange = function (nodes) {
        if (nodes === void 0) { nodes = null; }
        var txts = !nodes ? this._traces.txts : nodes;
        for (var cnti = 0; cnti < txts.length; cnti++) {
            if (!txts[cnti].fn) {
                txts[cnti].fn = this.compileText(txts[cnti].text);
            }
            txts[cnti].node.textContent = txts[cnti].fn.apply(this);
        }
    };
    Hacci.prototype.procTextModel = function (nodes) {
        if (nodes === void 0) { nodes = null; }
        var txts = !nodes ? this._traces.txts : nodes['_hc'] && nodes['_hc']['for_txts'] ? nodes['_hc']['for_txts'] : nodes;
        for (var cnti = 0; cnti < txts.length; cnti++) {
            if (!txts[cnti].fn) {
                txts[cnti].fn = this.compileText(txts[cnti].text, nodes && nodes['_hc'] && nodes['_hc']['model_str'] ? nodes['_hc']['model_str'] : null);
            }
            txts[cnti].node.textContent = txts[cnti].fn.apply(this);
        }
    };
    Hacci.prototype.compileText = function (html, opt_str) {
        if (opt_str === void 0) { opt_str = null; }
        if (!this._txts_mstr) {
            this._txts_mstr = '';
            var keys = Object.keys(this);
            for (var cnti = 0; cnti < keys.length; cnti++) {
                if (keys[cnti].length > 1 && keys[cnti].charAt(0) === '_')
                    continue;
                this._txts_mstr += "var ".concat(keys[cnti], "=this.").concat(keys[cnti], ";\n");
            }
        }
        var re = /{{([^}}]+)?}}/g, reExp = /(^( )?(if|for|else|switch|case|break|{|}))(.*)?/g, code = this._txts_mstr + (opt_str ? opt_str : '') + 'var r=[];\n', cursor = 0, match;
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
    Hacci.prototype.replaceAttributes = function (srcNode, tgtNode) {
        var rtn_val = false;
        var node_attrs = srcNode.attributes;
        if (node_attrs) {
            for (var cnti = 0; cnti < node_attrs.length; cnti++) {
                var src_node_attr = node_attrs.item(cnti);
                var tgt_node_attr = tgtNode.attributes.getNamedItem(src_node_attr.name);
                tgt_node_attr.value !== src_node_attr.value &&
                    (src_node_attr.value = tgt_node_attr.value);
            }
        }
        !rtn_val && (rtn_val = srcNode.hasChildNodes() != tgtNode.hasChildNodes());
        if (srcNode.hasChildNodes()) {
            for (var cnti = 0; cnti < srcNode.childNodes.length; cnti++) {
                tgtNode.hasChildNodes() &&
                    tgtNode.childNodes[cnti] &&
                    (rtn_val = this.replaceAttributes(srcNode.childNodes[cnti], tgtNode.childNodes[cnti]));
            }
            !rtn_val && (rtn_val = tgtNode.hasChildNodes() && srcNode.childNodes.length != tgtNode.childNodes.length);
        }
        return rtn_val;
    };
    Hacci.prototype.replaceTextNodes = function (srcNode, tgtNode) {
        var rtn_val = false;
        !rtn_val && (rtn_val = srcNode.hasChildNodes() != tgtNode.hasChildNodes());
        if (srcNode.hasChildNodes()) {
            for (var cnti = 0; cnti < srcNode.childNodes.length; cnti++) {
                switch (srcNode.childNodes[cnti].nodeType) {
                    case 1:
                        tgtNode.hasChildNodes() &&
                            tgtNode.childNodes[cnti] &&
                            (rtn_val = this.replaceTextNodes(srcNode.childNodes[cnti], tgtNode.childNodes[cnti]));
                        break;
                    case 3:
                        tgtNode.hasChildNodes() &&
                            tgtNode.childNodes[cnti] &&
                            srcNode.childNodes[cnti].textContent !== tgtNode.childNodes[cnti].textContent &&
                            (srcNode.childNodes[cnti].textContent = tgtNode.childNodes[cnti].textContent);
                        break;
                }
            }
            !rtn_val && (rtn_val = tgtNode.hasChildNodes() && srcNode.childNodes.length != tgtNode.childNodes.length);
        }
        return rtn_val;
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
        return "".concat(this.getRandomString(6), "_").concat(Date.now());
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
        for (var cntk = 0; cntk < groups.length; cntk++) {
            var item = groups[cntk];
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
        var _a;
        var args = [];
        for (var _i = 1; _i < arguments.length; _i++) {
            args[_i - 1] = arguments[_i];
        }
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
        delete this._refs;
        this._refs = {};
        delete this._txts_mstr;
        this._txts_mstr = '';
        delete this._traces.fors;
        this._traces.fors = [];
        delete this._traces.txts;
        this._traces.txts = [];
        delete this._traces.elements;
        this._traces.elements = [];
        this._template && this.el.parentElement.removeChild(this.el);
        this._template = null;
        delete this._el;
        this._el = null;
        this._on && this._on.destroyed && this._on.destroyed();
        delete this._on;
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
        enumerable: false,
        configurable: true
    });
    Object.defineProperty(Hacci.prototype, "refs", {
        get: function () {
            return this._refs;
        },
        enumerable: false,
        configurable: true
    });
    Hacci._instances = {};
    return Hacci;
}());
// exports.Hacci = Hacci;
window['Hacci'] = Hacci;
// exports.default = Hacci;
// sourceMappingURL=index.js.map