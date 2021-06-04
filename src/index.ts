interface HacciOption {
    id: string|null,
    el: Element|null,
    template: string|null,
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
interface HacciTraceModelOption {
    parent: any|null;
    property: string;
    value: any|null;
}
class Hacci {
    //
    static _instances: any = {};
    //
    private _id: string = null;
    private _el: Element|null = null;
    private _template: string|null;
    //
    private _refs: any = {};
    private _traces: any = {
        model: {},
    };
    //
    private _objs: any = {};
    //
    private _on: any = {
        created: null,
        mounted: null,
        destroyed: null,
    };
    //
    private _event_listeners: Array<HacciEventListener> = [];
    //
    private _toi_input = [
        'email', 'hidden', 'number', 'password', 'search', 'tel', 'url', 'datetime', 'text', 'textarea'
    ];
    private _toi_check = ['radio', 'checkbox'];
    private _toi_select = ['select-one', 'select-multiple'];

    static get instances() {
        return Hacci._instances;
    }

    constructor(option: HacciOption|null = null) {
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
            const data_keys = Object.keys(option.data);
            for (let cnti: number = 0; cnti < data_keys.length; cnti++) {
                this[data_keys[cnti]] = option.data[data_keys[cnti]];
            }
        }
        //
        if (option.method) {
            const method_keys = Object.keys(option.method);
            for (let cnti: number = 0; cnti < method_keys.length; cnti++) {
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

    private init() {
        //
        const self = this;
        //
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
                            this.destroy();
                        }
                    }
                }
            });
            observer.observe(this.el.parentElement, { attributes: false, childList: true, subtree: false });

            //
            const objs: NodeList = this.el.querySelectorAll('*');
            //
            for (let cnti = 0; cnti < objs.length; cnti++) {
                const obj = objs[cnti] as HTMLInputElement;
                //
                const attrs = obj['attributes'];
                //
                for (let cnti: number = 0; cnti < attrs.length; cnti++) {
                    if (/^hc:(model|if|neither)$/.test(attrs[cnti].name)) {
                        //
                        this.traceModel({
                            parent: this,
                            property: attrs[cnti].value,
                            value: null, // attrs[cnti].value,
                        })
                        //
                        if (/^hc:(if|neither)$/.test(attrs[cnti].name)) {
                            const model = this.getVal(attrs[cnti].value, this);
                            if (
                                /^hc:if$/.test(attrs[cnti].name) && model.val === false ||
                                /^hc:neither$/.test(attrs[cnti].name) && model.val === true
                            ) {
                                //
                                const tag_id = self.createTagId();
                                const blankEl = window.document.createComment(`//hc:${self._id}:${tag_id}`);
                                obj.parentNode.insertBefore(blankEl, obj);
                                //
                                !self._objs[attrs[cnti].value] && (self._objs[attrs[cnti].value] = []);
                                self._objs[attrs[cnti].value].push({
                                    type: 'if',
                                    tag_id,
                                    parent: obj.parentElement,
                                    element: obj,
                                });
                                obj.parentNode.removeChild(obj);
                            }
                        }
                        else if (!/^hc:model$/.test(attrs[cnti].name)) {
                            continue;
                        }
                        //
                        if (obj.tagName === 'INPUT' && self._toi_check.indexOf(obj.type) > -1) {
                            // 초기값 설정
                            const model = this.getVal(attrs[cnti].value, this);
                            //
                            const group_name = obj.hasAttribute('name') ? obj.getAttribute('name') : null;
                            if (group_name) {
                                const groups = self.el.querySelectorAll(`*[name=${group_name}]`);
                                self.setCheckedValue(groups, model.val);
                            }
                            else {
                                obj.checked = obj.value == model.val;
                            }
                            // 이벤트 처리 등록
                            obj.addEventListener('change', (_evt) => {
                                let checked_value = null;
                                (obj.type === 'radio') && (checked_value = obj.checked ? obj.value : null);
                                (obj.type === 'checkbox') && (checked_value = obj.checked ? obj.value : (obj.hasAttribute('name') ? [] : null));
                                //
                                const group_name = obj.hasAttribute('name') ? obj.getAttribute('name') : null;
                                if (group_name) {
                                    const groups = self.el.querySelectorAll(`*[name=${group_name}]`);
                                    checked_value = self.getCheckedValue(groups, obj.type === 'checkbox');
                                }
                                else {
                                    obj.checked = obj.value == model.val;
                                }
                                //
                                const target_obj = self.getVal(attrs[cnti].value, self._traces.model, '__');
                                target_obj.parent[target_obj.prop] = checked_value;
                                //
                                this.modelTrigger(obj);
                            });
                        }
                        else if (obj.tagName === 'SELECT' && self._toi_select.indexOf(obj.type) > -1) {
                            // 초기값 설정
                            const model = this.getVal(attrs[cnti].value, this);
                            //
                            const groups = obj.querySelectorAll(`option`);
                            self.setSelectedValue(groups, model.val);
                            // 이벤트 처리 등록
                            obj.addEventListener('change', (_evt) => {
                                let checked_value = (obj.type === 'select-one') ? null : [];
                                //
                                const groups = obj.querySelectorAll(`option`);
                                checked_value = self.getSelectedValue(groups, obj.type === 'select-multiple');
                                //
                                const target_obj = self.getVal(attrs[cnti].value, self._traces.model, '__');
                                target_obj.parent[target_obj.prop] = checked_value;
                                //
                                this.modelTrigger(obj);
                            });
                        }
                        else if (['INPUT', 'TEXTAREA'].indexOf(obj.tagName) > -1 && self._toi_input.indexOf(obj.type) > -1) {
                            // 초기값 설정
                            const model = this.getVal(attrs[cnti].value, this);
                            //
                            obj.value = model.val;
                            // 이벤트 처리 등록
                            obj.addEventListener('input', (_evt) => {
                                // console.log(`on.input`);
                                let checked_value = obj.value;
                                //
                                const target_obj = self.getVal(attrs[cnti].value, self._traces.model, '__');
                                target_obj.parent[target_obj.prop] = checked_value;
                                //
                                this.modelTrigger(obj);
                            });
                        }
                    }
                }
            }
            //
            for (let cnti = 0; cnti < objs.length; cnti++) {
                const obj = objs[cnti] as HTMLInputElement;
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
                                this.registEventListener(obj, 'click', attrs[cnti]);
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
        const regx = new RegExp(/^__hc\.(v_.+|lstn$|refs$)/);
        //
        const keys = Object.keys(this);
        for (let cnti: number = 0; cnti < keys.length; cnti++) {
            if (regx.test(keys[cnti])) {
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

    private modelTrigger(el: Element) {
        let target_attr = null;
        let attrs = (el as HTMLInputElement)['attributes'];
        for (let cnti: number = 0; cnti < attrs.length; cnti++) {
            if (/^hc:model$/.test(attrs[cnti].name)) {
                target_attr = attrs[cnti];
                break;
            }
        }
        if (target_attr) {
            const model = this.getVal(target_attr.value, this);
            //
            const target_names = [];
            //
            const objs: NodeList = this.el.querySelectorAll('*');
            //
            for (let cnti = 0; cnti < objs.length; cnti++) {
                const obj = objs[cnti] as HTMLInputElement;
                //
                attrs = obj['attributes'];
                //
                const evt = {
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
                for (let cnti: number = 0; cnti < attrs.length; cnti++) {
                    if (/^hc:change$/.test(attrs[cnti].name)) {
                        evt.change.proc = true;
                        evt.change.attr = attrs[cnti].value;
                        break;
                    }
                }
                //
                for (let cnti: number = 0; cnti < attrs.length; cnti++) {
                    if (/^hc:input$/.test(attrs[cnti].name)) {
                        evt.input.proc = true;
                        evt.input.attr = attrs[cnti].value;
                        break;
                    }
                }
                //
                for (let cnti: number = 0; cnti < attrs.length; cnti++) {
                    if (/^hc:model$/.test(attrs[cnti].name) && attrs[cnti].value === target_attr.value) {
                        //
                        if (obj.tagName === 'INPUT' && this._toi_check.indexOf(obj.type) > -1) {
                            if (Array.isArray(model.val)) {
                                obj.checked = model.val.indexOf(obj.value) > -1;
                            }
                            else {
                                obj.checked = model.val == obj.value;
                            }
                            //
                            const group_name = obj.hasAttribute('name') ? obj.getAttribute('name') : null;
                            const target_added = target_names.indexOf(group_name) > -1;
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
                            })
                        }
                        else if (obj.tagName === 'SELECT' && this._toi_select.indexOf(obj.type) > -1) {
                            const groups = obj.querySelectorAll(`option`);
                            for (let cntk: number = 0; cntk < groups.length; cntk++) {
                                if (Array.isArray(model.val)) {
                                    (groups[cntk] as HTMLOptionElement).selected = model.val.indexOf((groups[cntk] as HTMLOptionElement).value) > -1;
                                }
                                else {
                                    (groups[cntk] as HTMLOptionElement).selected = model.val == (groups[cntk] as HTMLOptionElement).value;
                                }
                            }
                            //
                            evt.change.proc && this.callMethod({
                                attr: {
                                    value: evt.change.attr,
                                },
                                evt: null,
                            })
                        }
                        else if (['INPUT', 'TEXTAREA'].indexOf(obj.tagName) > -1 && this._toi_input.indexOf(obj.type) > -1) {
                            obj.value = model.val;
                            //
                            evt.input.proc && this.callMethod({
                                attr: {
                                    value: evt.input.attr,
                                },
                                evt: null,
                            })
                        }
                    }
                }
            }
        }
    }

    private registEventListener(el: Element, name: string, attr: any) {
        //
        const listener = (evt: Event) => {
            //
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
        // console.log(`callMethod - option:${JSON.stringify(option)}`);
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
    
    private getRandomString(length: number) {
        let rtn_val: string = '';
        for (let cnti: number = 0; cnti < length; cnti++) {
            const code = Math.floor(Math.random() * 51);
            rtn_val += String.fromCharCode(code + (code < 26 ? 65 : 71));
        }
        return rtn_val;
    }

    private createInstanceId() {
        return this.getRandomString(8) + '_' + Date.now();
    }

    private createTagId() {
        // return `//hc:${this._id}:_tag_${this.getRandomString(4)}_${Date.now()}`;
        return `${this.getRandomString(6)}_${Date.now()}`;
    }

    private getCommentElement(parent: Element, tag_id: string): Comment {
        let rtn_val = null;
        for (let cnti: number = 0; cnti < parent.childNodes.length; cnti++) {
            const node = parent.childNodes[cnti];
            if (node.nodeType === Node.COMMENT_NODE && node.textContent == `//hc:${this._id}:${tag_id}`) {
                rtn_val = node;
                break;
            }
        }
        return rtn_val;
    }

    //
    private isArrowFunc(func: Function): boolean {
        return typeof func.prototype === 'undefined';
    }

    //
    private fromArrowFunc(func: Function): Function {
        if (this.isArrowFunc(func)) {
            // is arrow function
            let fn_str = func.toString();
            fn_str = "return function" + 
                ((fn_str.substring(0, 1) === '(' ? '' : '(')) + 
                fn_str. replace(/\)?\s*=>.*{(.|\r|\n)*/, ')') + 
                fn_str.replace(/^.*=>\s*{/, '{');
            return new Function(fn_str)();
        }
        return func;
    }

    private getCheckedValue(groups: NodeListOf<Element>, return_as_array: boolean = false) {
        let rtn_val: any = return_as_array ? [] : null;
        //
        for (let cntk: number = 0; cntk < groups.length; cntk++) {
            const item: HTMLInputElement = groups[cntk] as HTMLInputElement;
            if (item.checked && !return_as_array) {
                rtn_val = item.value;
                break;
            }
            else if (item.checked && return_as_array) {
                (rtn_val as any[]).push(item.value);
            }
        }
        //
        return rtn_val;
    }
    //
    private getSelectedValue(groups: NodeListOf<Element>, return_as_array: boolean = false) {
        let rtn_val: any = return_as_array ? [] : null;
        //
        for (let cntk: number = 0; cntk < groups.length; cntk++) {
            const item: HTMLOptionElement = groups[cntk] as HTMLOptionElement;
            if (item.selected && !return_as_array) {
                rtn_val = item.value;
                break;
            }
            else if (item.selected && return_as_array) {
                (rtn_val as any[]).push(item.value);
            }
        }
        //
        return rtn_val;
    }
    
    //
    private setCheckedValue(groups: NodeListOf<Element>, value: any[]|any): boolean {
        console.log(`setCheckedValue.#1 - value:->`);
        console.log(value);
        //
        let rtn_val = false; // 변경 여부 반환
        //
        let has_checked = false;
        for (let cntk: number = 0; cntk < groups.length; cntk++) {
            const item: HTMLInputElement = groups[cntk] as HTMLInputElement;
            //
            !has_checked && item.checked && (has_checked = true);
            //
            if (Array.isArray(value)) {
                console.log(`setCheckedValue.#2 - checked:${item.checked} / ${item.value} in ${JSON.stringify(value)}`);
            }
            else {
                console.log(`setCheckedValue.#2 - checked:${item.checked} / ${item.value} is ${value}`);
            }
            //
            !rtn_val && 
                (
                    item.checked && 
                    (Array.isArray(value) ?
                        (value.indexOf(item.value) < 0) :
                        (value != item.value)
                    )
                    ||
                    !item.checked && 
                    (Array.isArray(value) ?
                        (value.indexOf(item.value) > -1) :
                        (value == item.value)
                    )
                ) && 
                (rtn_val = true);

            //
            if (rtn_val) break;
            
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
        !has_checked && !rtn_val && (rtn_val = true);
        console.log(`setCheckedValue.proc - has_checked:${has_checked} / rtn_val:${rtn_val}`);
        //
        for (let cntk: number = 0; cntk < groups.length; cntk++) {
            const item: HTMLInputElement = groups[cntk] as HTMLInputElement;
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
    }
    //
    private setSelectedValue(groups: NodeListOf<Element>, value: any[]|any): boolean {
        // console.log(`setSelectedValue - value:${JSON.stringify(value)}`);
        //
        let rtn_val = false; // 변경 여부 반환
        //
        let has_selected = false;
        for (let cntk: number = 0; cntk < groups.length; cntk++) {
            const item: HTMLOptionElement = groups[cntk] as HTMLOptionElement;
            //
            !has_selected && item.selected && (has_selected = true);
            //
            !rtn_val && 
                (
                    item.selected && 
                    (Array.isArray(value) ?
                        (value.indexOf(item.value) < 0) :
                        (value != item.value)
                    )
                    ||
                    !item.selected && 
                    (Array.isArray(value) ?
                        (value.indexOf(item.value) > -1) :
                        (value == item.value)
                    )
                ) && 
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

            //
            if (rtn_val) break;
        }
        !has_selected && !rtn_val && (rtn_val = true);
        //
        for (let cntk: number = 0; cntk < groups.length; cntk++) {
            const item: HTMLOptionElement = groups[cntk] as HTMLOptionElement;
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
    }

    private getVal(val: any, init_parent: any, prefix: string = ''): any {
        //
        if ((new RegExp(/^(true|false|'.+'|\d+)$/)).test(val)) {
            return {
                parent: null,
                prop: null,
                val: eval(val),
            };
        }
        //
        let rtn_val = {
            parent: null,
            prop: null,
            val: init_parent,
        };
        //
        const strs: string[] = val.split('.');
        for (let cnti: number = 0; cnti < strs.length; cnti++) {
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
    }
    //
    private setVal(target: any, val: any, init_parent: any) {
        let parent = init_parent;
        //
        const strs: string[] = target.split('.');
        for (let cnti: number = 0; cnti < strs.length; cnti++) {
            if (typeof parent[`__${strs[cnti]}`] === 'undefined') {
                parent[`__${strs[cnti]}`] = {};
            }
            if (cnti >= strs.length - 1) {
                parent[`__${strs[cnti]}`] = val;
            }
            else {
                parent = parent[`__${strs[cnti]}`];
            }
        }
    }

    private traceModel(option: HacciTraceModelOption) {
        //
        if ((new RegExp(/^(true|false|'.+'|\d+)$/)).test(option.property)) return;
        //
        const self: Hacci = this;
        // parent 확인 및 지정
        (['undefined', 'null'].indexOf(typeof option.parent) > -1) && 
            (option.parent = this);

        //
        !this._traces.model['__listen'] && 
            (
                this._traces.model['__listen'] = function(property: string, value: any) {
                    console.log(`listen - property:${property} / value:${value}`);
                    //
                    if (self._objs[property] && Array.isArray(self._objs[property])) {
                        for (let cnti: number = 0; cnti < self._objs[property].length; cnti++) {
                            const el = self._objs[property][cnti];
                            if (el.type === 'if') {
                                const commentEl = self.getCommentElement(el.parent, el.tag_id);
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
                    const target_names = [];
                    //
                    const objs: NodeList = self.el.querySelectorAll('*');
                    for (let cnti = 0; cnti < objs.length; cnti++) {
                        const obj = objs[cnti] as HTMLInputElement;
                        //
                        const attrs = obj['attributes'];
                        //
                        const evt = {
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
                        for (let cntk: number = 0; cntk < attrs.length; cntk++) {
                            if (/^hc:change$/.test(attrs[cntk].name)) {
                                evt.change.proc = true;
                                evt.change.attr = attrs[cntk].value;
                                break;
                            }
                        }
                        //
                        for (let cntk: number = 0; cntk < attrs.length; cntk++) {
                            if (/^hc:input$/.test(attrs[cntk].name)) {
                                evt.input.proc = true;
                                evt.input.attr = attrs[cntk].value;
                                break;
                            }
                        }
                        // console.log(`traceModel - listen - evt:${JSON.stringify(evt)}`);
                        //
                        for (let cntk: number = 0; cntk < attrs.length; cntk++) {
                            if (/^hc:(if|neither)$/.test(attrs[cntk].name) && attrs[cntk].value === property) {
                                if (
                                    /^hc:if$/.test(attrs[cntk].name) && value === false ||
                                    /^hc:neither$/.test(attrs[cntk].name) && value === true
                                ) {
                                    //
                                    const tag_id = self.createTagId();
                                    const blankEl = window.document.createComment(`//hc:${self._id}:${tag_id}`);
                                    obj.parentNode.insertBefore(blankEl, obj);
                                    //
                                    !self._objs[property] && (self._objs[property] = []);
                                    self._objs[property].push({
                                        type: 'if',
                                        tag_id,
                                        parent: obj.parentElement,
                                        element: obj,
                                    });
                                    obj.parentNode.removeChild(obj);
                                }
                            }
                            else if (/^hc:model$/.test(attrs[cntk].name) && attrs[cntk].value === property) {
                                //
                                if (obj.tagName === 'INPUT' && self._toi_check.indexOf(obj.type) > -1) {
                                    const group_name = obj.hasAttribute('name') ? obj.getAttribute('name') : null;
                                    // const target_added = target_names.indexOf(group_name) > -1;
                                    if (group_name) {
                                        const groups = self.el.querySelectorAll(`*[name=${group_name}]`);
                                        const changed = self.setCheckedValue(groups, value);
                                        //
                                        evt.change.proc = evt.change.proc && changed;
                                        //
                                        const target_added = target_names.indexOf(group_name) > -1;
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
                                    })
                                }
                                else if (obj.tagName === 'SELECT' && self._toi_select.indexOf(obj.type) > -1) {
                                    const groups = obj.querySelectorAll(`option`);
                                    const changed = self.setSelectedValue(groups, value);
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
                                    })
                                }
                                else if (['INPUT', 'TEXTAREA'].indexOf(obj.tagName) > -1 && self._toi_input.indexOf(obj.type) > -1) {
                                    //
                                    const changed = obj.value != value;
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
                                    })
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
                }
            );
        const traces = this._traces.model;
        const model = this.getVal(option.property, this);
        this.setVal(option.property, model.val, traces);
        const traceModel = this.getVal(option.property, traces, '__');

        //
        const redefineArray = function(obj) {
            Object.defineProperty(obj, 'push', {
                enumerable: false,
                configurable: true,
                writable: true,
                value: function (...args) {
                    //
                    console.log(`redefine - Array.push - proc`);
                    console.log(`redefine - Array.push - traceModel:->`);
                    console.log(traceModel);
                    const rtn_val = Array.prototype.push.apply(traceModel.parent[traceModel.prop], args);
                    //
                    // Array.prototype.push.apply(this, args);
                    // const rtn_val = Array.prototype.push.apply(traceModel.parent[`__${model.prop}`], args);
                    // console.log(`redefine - Array.push - obj:->`);
                    // console.log(obj);
                    // traces.__listen(option.property, traceModel.parent[`__${model.prop}`]);
                    traces.__listen(option.property, traceModel.parent[traceModel.prop]);
                    return rtn_val;
                }
            });
            Object.defineProperty(obj, 'splice', {
                enumerable: false,
                configurable: true,
                writable: true,
                value: function (...args) {
                    console.log(`redefine - Array.splice - proc`);
                    // Array.prototype.splice.apply(this, args);
                    const rtn_val = Array.prototype.splice.apply(traceModel.parent[traceModel.prop], args);
                    // console.log(`option.property:${option.property}`);
                    // traces.__listen(option.property, traceModel.parent[`__${model.prop}`]);
                    traces.__listen(option.property, traceModel.parent[traceModel.prop]);
                    return rtn_val;
                }
            });
        };

        //
        // Array.isArray(model.parent[model.prop]) && redefineArray(model.parent[model.prop]);
        //
        // if (Array.isArray(model.parent[model.prop])) {
        //     Object.defineProperty(model.parent[model.prop], 'push', {
        //         enumerable: false,
        //         configurable: true,
        //         writable: true,
        //         value: function (...args) {
        //             // const rtn_val = Array.prototype.push.apply(this, args);
        //             const rtn_val = Array.prototype.push.apply(traceModel.parent[`__${model.prop}`], args);
        //             // console.log(`option.property:${option.property}`);
        //             traces.__listen(option.property, traceModel.parent[`__${model.prop}`]);
        //             // traces.__listen(option.property, this);
        //             return rtn_val;
        //         }
        //     });
        //     Object.defineProperty(model.parent[model.prop], 'splice', {
        //         enumerable: false,
        //         configurable: true,
        //         writable: true,
        //         value: function (...args) {
        //             // const rtn_val = Array.prototype.splice.apply(this, args);
        //             const rtn_val = Array.prototype.splice.apply(traceModel.parent[`__${model.prop}`], args);
        //             // console.log(`option.property:${option.property}`);
        //             traces.__listen(option.property, traceModel.parent[`__${model.prop}`]);
        //             // traces.__listen(option.property, this);
        //             return rtn_val;
        //         }
        //     });
        // }
        //
        model.parent && model.prop &&
            Object.defineProperty(
                model.parent,
                model.prop,
                {
                    get: function() {
                        console.log(`redefine - get - proc`);
                        const rtn_val = self.getVal(option.property, traces, '__').val;
                        console.log(`redefine - get:->`);
                        console.log(rtn_val);
                        return rtn_val
                    },
                    set: function(value: any) {
                        console.log(`redefine - set - proc`);
                        traceModel.parent[`__${model.prop}`] = value;
                        console.log(`redefine - set:->`);
                        console.log(traceModel.parent[`__${model.prop}`]);
                        //
                        // Array.isArray(value) && redefineArray(value);
                        //
                        traces.__listen(option.property, value);
                    }
                }
            );

        //
        Object.defineProperty(Array.prototype, 'push', {
            enumerable: false,
            configurable: false,
            writable: false,
            value: function (...args) {
                return -1;
                // const rtn_val = Array.prototype.push.apply(this, args);
                // console.log(`Array.prototype.push`);
                // return rtn_val;
            }
        });
    }

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
