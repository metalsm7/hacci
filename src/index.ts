interface HacciOption {
    id: string|null,
    el: Element|null,
    template: string|null,
    data: any;
    computed: any;
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
        model: {
            value: {},
            listen: null,
            listen_array: null,
        },
        elements: [],
        txts: [],
        fors: [], // hc:for 자료 저장용
    };
    private _txts_mstr = null;
    private _event_listeners = [];
    //
    private _on: any = {
        created: null,
        mounted: null,
        destroyed: null,
    };
    //
    private _toi_input = [
        'email', 'hidden', 'number', 'password', 'search', 'tel', 'url', 'datetime', 'text', 'textarea'
    ];
    private _toi_check = ['radio', 'checkbox'];
    private _toi_select = ['select-one', 'select-multiple'];
    //
    private _bus: any = {};

    static get instances() {
        return Hacci._instances;
    }

    /**
     * 생성자
     * @param option 
     */
    constructor(option: HacciOption|null = null) {
        //
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
                // test
                this.redefineModel(data_keys[cnti]);
                //
                // this.traceModel({
                //     parent: this,
                //     property: data_keys[cnti],
                //     value: null, // attrs[cnti].value,
                // })
            }
        }
        //
        if (option.computed) {
            const compute_keys = Object.keys(option.computed);
            for (let cnti: number = 0; cnti < compute_keys.length; cnti++) {
                this[compute_keys[cnti]] = this.fromArrowFunc(option.computed[compute_keys[cnti]]).bind(this);
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
        this._on && this._on.created && this._on.created();
    }

    private init(): void {
        //
        const self: Hacci = this;
        //
        if (!self._txts_mstr) {
            self._txts_mstr = '';
            const keys: string[] = Object.keys(self);
            for (let cnti: number = 0; cnti < keys.length; cnti++) {
                if (keys[cnti].length > 1 && keys[cnti].charAt(0) === '_') continue;
                self._txts_mstr += `var ${keys[cnti]}=this.${keys[cnti]};\n`;
            }
        }

        //
        // this.searchForNodes(self.el);

        //
        this.searchNodes(self.el);
        // this.procNode(self.el);
        // this.procModel(self._traces.elements, null);

        //
        this.searchTextNodes(self.el);

        // this.procTextNode(self.el);
        // this.procTextModel(self._traces.txts);

        //
        // console.log(`searchNodes.procModel.PRE`);
        // this.applyModel();
        // this.procModel();
        this.initModel();
        // console.log(`searchNodes.procModel.POST`);
        // this.procForModel();
        //
        this._on && this._on.mounted && this._on.mounted();
    }

    private procForNodes(el: any = null): void {
        //
        const self: Hacci = this;
        //
        !el && (el = self.el);
        //
        let els: NodeList = el.querySelectorAll('*');
        //
        const calcRes = function(val: string, model_str: string = null): any {
            // console.log(`init - callSet - val:${val} / model_str:${model_str}`);
            const fn = new Function(`${self._txts_mstr}${model_str ? model_str : ''}return ${val};`);
            let fnRes = fn.apply(self);
            typeof(fnRes) === 'function' && (fnRes = fnRes());
            return fnRes;
        }
        //
        for (let cnti: number = 0; cnti < els.length; cnti++) {
            const obj: Node = els.item(cnti);
            //
            const attrs: NamedNodeMap = (obj as HTMLElement).attributes;

            // for 우선 처리, (row.a, row.b, index) in rows, row in rows
            for (let cntk: number = 0; cntk < attrs.length; cntk++) {
                const attr: Attr = attrs.item(cntk);
                if ((/^hc:for$/).test(attr.name)) {
                    //
                    self._traces.fors.indexOf(obj) < 0 &&
                        self._traces.fors.push(obj);
                    //
                    const forComment = window.document.createComment(`//hc-for:${self._id}:${self.createTagId()}`);
                    obj.parentNode.insertBefore(forComment, obj);
                    obj.parentNode.removeChild(obj);
                    //
                    !obj['_hc']&& (
                        obj['_hc'] = {
                            attr: {},
                            comment: null,
                            for_comment: null, // for 확인용 Comment
                            for_elements: [], // for 로 생성된 Element[]
                            for_txts: [], // for 로 생성된 txt[]
                            for_model: null, // for 용 model
                            model_str: null, // Element 전용 model string
                        }
                    );
                    //
                    obj['_hc'].attr['for'] = attr.value;
                    obj['_hc'].for_comment = forComment;
                    // console.log(`for - outerHTML:${(obj as HTMLElement).outerHTML}`);

                    //
                    const model_str = String(obj['_hc'].attr.for).replace(/(\(.*\)|.+)\s+(in)\s+/g, '').replace(/\s/g, '');
                    // const data_str = String(obj['_hc'].attr.for).replace(/\s+in\s+.*$/, '').replace(/\s/g, '');
                    // console.log(`procForModel - fors.#${idx} - model_str:${model_str}`);
                    // console.log(`procForModel - fors.#${idx} - data_str.#1:${data_str}`);
                    //
                    const model: any = calcRes(model_str);

                    //
                    obj['_hc'].for_model = model;

                    //
                    Array.isArray(model) && self.arrayEventListener(model);
                }
            }
        }

        //
        self.procForModel();
    }

    private searchNodes(el: any): void {
        //
        const self: Hacci = this;
        //
        // const calcRes = function(val: string, model_str: string = null): any {
        //     const fn = new Function(`${self._txts_mstr}${model_str ? model_str : ''}return ${val};`);
        //     let fnRes = fn.apply(self);
        //     typeof(fnRes) === 'function' && (fnRes = fnRes());
        //     return fnRes;
        // }
        // //
        // const callSet = function(model: string, val: any): any {
        //     // console.log(`init - callSet - this.${model}=${val};`)
        //     const fn = new Function(`this.${model}=arguments[0];(Array.isArray(this.${model}) && this.arrayEventListener(this.${model}));`);
        //     return fn.apply(self, [val]);
        // }
        // //
        // const call = function(val: string): any {
        //     let exec = val;
        //     if (val.indexOf('(') < 0) {
        //         exec += '()';
        //     }
        //     exec = exec.replace(/;$/, '');
        //     // console.log(`init - call - exec:${exec}`);
        //     const fn = new Function(`${self._txts_mstr}return ${exec};`);
        //     return fn.apply(self);
        // }

        //
        self.procForNodes(el);

        //
        self.procNode(el.querySelectorAll('*'), el);
        //
        // let els: NodeList = el.querySelectorAll('*');

        // //
        // for (let cnti: number = 0; cnti < els.length; cnti++) {
        //     const obj: Node = els.item(cnti);

        //     //
        //     self.procNode(obj, el);

            //
            // const attrs: NamedNodeMap = (obj as HTMLElement).attributes;

            // // 나머지 처리
            // for (let cntk: number = 0; cntk < attrs.length; cntk++) {
            //     const attr: Attr = attrs.item(cntk);
            //     if ((/^hc:.+$/).test(attr.name)) {
            //         const hc_attr: string = attr.name.substring(3);
            //         // console.log(`hc:${hc_attr}`);
            //         //
            //         // typeof(self._traces.element[hc_attr]) === 'undefined' &&
            //         //     (self._traces.element[hc_attr] = []);
            //         // //
            //         // self._traces.element[hc_attr].push(obj);

            //         if (hc_attr === 'for') continue;

            //         //
            //         if (hc_attr == 'ref') {
            //             self._refs[attr.value] = obj;
            //             //
            //             if ((obj as HTMLElement).hasAttribute(attr.name)) {
            //                 (obj as HTMLElement).removeAttribute(attr.name);
            //                 --cntk;
            //             }
            //             //
            //             continue;
            //         }

            //         //
            //         self._traces.elements.indexOf(obj) < 0 &&
            //             self._traces.elements.push(obj);
            //         //
            //         !obj['_hc'] && (
            //             obj['_hc'] = {
            //                 attr: {},
            //                 comment: null,
            //                 for: null,
            //             }
            //         );
            //         //
            //         if (hc_attr === 'neither') { // neither 지원
            //             obj['_hc'].attr['if'] = `!(${attr.value})`;
            //         }
            //         else {
            //             obj['_hc'].attr[hc_attr] = attr.value;
            //         }
            //         //
            //         if (hc_attr === 'model') { // model의 경우 change/input attr 존재 여부 확인
            //             //
            //             let val = calcRes(attr.value);
            //             Array.isArray(val) && self.arrayEventListener(val);
            //             //
            //             // input radio/checkbox
            //             (obj as HTMLInputElement).tagName === 'INPUT' &&
            //                 ['radio', 'checkbox'].indexOf((obj as HTMLInputElement).type) > -1 &&
            //                 obj.addEventListener('change', (_evt) => {
            //                     // console.log(`model.change`);
            //                     //
            //                     let checked_value = null;
            //                     ((obj as HTMLInputElement).type === 'radio') && (checked_value = (obj as HTMLInputElement).checked ? (obj as HTMLInputElement).value : null);
            //                     ((obj as HTMLInputElement).type === 'checkbox') && (checked_value = (obj as HTMLInputElement).checked ? (obj as HTMLInputElement).value : ((obj as HTMLInputElement).hasAttribute('name') ? [] : null));
            //                     //
            //                     // console.log(`model.change - checked_value.#1:${checked_value}`);
            //                     const group_name = (obj as HTMLInputElement).hasAttribute('name') ? (obj as HTMLInputElement).getAttribute('name') : null;
            //                     if (group_name) {
            //                         // const groups = self.el.querySelectorAll(`*[name=${group_name}]`);
            //                         const groups = el.querySelectorAll(`*[name=${group_name}]`);
            //                         checked_value = self.getCheckedValue(groups, (obj as HTMLInputElement).type === 'checkbox');
            //                         // console.log(`model.change - group_name:${group_name} - checked_value.#2:${checked_value}`);
            //                     }
            //                     else {
            //                         // console.log(`model.change - value - ${(obj as HTMLInputElement).value} / ${val}`);
            //                         // (obj as HTMLInputElement).checked = (obj as HTMLInputElement).value == val;
            //                         // (obj as HTMLInputElement).checked && (checked_value = (obj as HTMLInputElement).value);
            //                         checked_value = (obj as HTMLInputElement).checked ? (obj as HTMLInputElement).value : null;
            //                         // console.log(`model.change - checked_value.#3:${checked_value}`);
            //                     }
            //                     //
            //                     // Array.isArray(checked_value) && self.arrayEventListener(attrs[cnti].value, checked_value);
            //                     //
            //                     // self.applyModel();
            //                     //
            //                     obj['_hc:force_apply'] = true;
            //                     //
            //                     // console.log(`model.change - callSet - ${attr.value} / ${checked_value}`);
            //                     callSet(attr.value, checked_value);
            //                 });

            //             // select
            //             (obj as HTMLInputElement).tagName === 'SELECT' &&
            //                 ['select-one', 'select-multiple'].indexOf((obj as HTMLInputElement).type) > -1 &&
            //                 obj.addEventListener('change', (_evt) => {
            //                     //
            //                     // let val = calcRes(attr.value);
            //                     //
            //                     let checked_value = ((obj as HTMLInputElement).type === 'select-one') ? null : [];
            //                     //
            //                     const groups = (obj as HTMLInputElement).querySelectorAll(`option`);
            //                     checked_value = self.getSelectedValue(groups, (obj as HTMLInputElement).type === 'select-multiple');
            //                     //
            //                     // Array.isArray(checked_value) && self.arrayEventListener(attrs[cnti].value, checked_value);
            //                     //
            //                     //
            //                     obj['_hc:force_apply'] = true;
            //                     // self.applyModel();
            //                     callSet(attr.value, checked_value);
            //                 });

            //             // text/textarea
            //             ['INPUT', 'TEXTAREA'].indexOf((obj as HTMLInputElement).tagName) > -1 &&
            //                 ['email', 'hidden', 'number', 'password', 'search', 'tel', 'url', 'datetime', 'text', 'textarea'].indexOf((obj as HTMLInputElement).type) > -1 &&
            //                 obj.addEventListener('input', (_evt) => {
            //                     //
            //                     //
            //                     obj['_hc:force_apply'] = true;
            //                     // self.applyModel();
            //                     callSet(attr.value, (obj as HTMLInputElement).value);
            //                 });
            //         }
            //         //
            //         switch (hc_attr) {
            //             case 'scroll.hit.top':
            //             case 'scroll.hit.bottom':
            //                 self.registEventListener(
            //                     obj as Element,
            //                     'scroll',
            //                     attr,
            //                     function(evt: Event) {
            //                         if (
            //                             attr.name.indexOf('bottom') > -1 ?
            //                                 (self.scrollTop(obj as Element) + self.innerHeight(obj) >= self.scrollHeight(obj as Element)) :
            //                                 (self.scrollTop(obj as Element) <= 0)
            //                         ) {
            //                             call(attr.value);
            //                         }
            //                     }
            //                 );
            //                 break;
            //             default:
            //                 typeof(window[`on${hc_attr}`]) !== 'undefined' &&
            //                     self.registEventListener((obj as HTMLInputElement), hc_attr, attr);
            //                 break;
            //         }

            //         //
            //         if ((obj as HTMLElement).hasAttribute(attr.name)) {
            //             (obj as HTMLElement).removeAttribute(attr.name);
            //             --cntk;
            //         }
            //     }
            // }
        // };
    }

    /**
     * 지정된 node에 대해 hc: property 처리
     * @param node 
     */
    private procNode(node: Node|NodeList, root: Node = null): void {
        //
        const self: Hacci = this;
        //
        const calcRes = function(val: string, model_str: string = null): any {
            // console.log(`init - callSet - val:${val} / model_str:${model_str}`);
            const fn = new Function(`${self._txts_mstr}${model_str ? model_str : ''}return ${val};`);
            let fnRes = fn.apply(self);
            typeof(fnRes) === 'function' && (fnRes = fnRes());
            return fnRes;
        }
        //
        const callSet = function(model: string, val: any): any {
            // console.log(`init - callSet - model:${model} / val:${val}`);
            const fn = new Function(`this.${model}=arguments[0];(Array.isArray(this.${model}) && this.arrayEventListener(this.${model}));`);
            return fn.apply(self, [val]);
        }
        //
        const call = function(val: string, model_str: string = null): any {
            // console.log(`init - call - val:${val} / model_str:${model_str}`);
            let exec = val;
            if (val.indexOf('(') < 0) {
                exec += '()';
            }
            exec = exec.replace(/;$/, '');
            // console.log(`procNode - call - exec:${exec}`);
            const fn = new Function(`${self._txts_mstr}${model_str ? model_str : ''}return ${exec};`);
            return fn.apply(self);
        }
        //
        // console.log(`procNode - node is NodeList ? ${node instanceof NodeList}`);
        // console.log(`procNode - root ${root ? '' : 'not '} exists`);
        // root && console.log(`procNode - root._hc:${JSON.stringify(root['_hc'])}`);
        if (node instanceof NodeList) {
            for (let cnti: number = 0; cnti < node.length; cnti++) {
                self.procNode(node.item(cnti), root);
            }
            return;
        }
        //
        const attrs: NamedNodeMap = (node as HTMLElement).attributes;
        //
        for (let cnti: number = 0; cnti < attrs.length; cnti++) {
            //
            const attr: Attr = attrs.item(cnti);
            //
            if (!/^hc:.+$/.test(attr.name)) continue;
            //
            const hc_attr: string = attr.name.substring(3);

            //
            if (hc_attr === 'for') {
                //
                if ((node as HTMLElement).hasAttribute(attr.name)) {
                    (node as HTMLElement).removeAttribute(attr.name);
                    --cnti;
                }
                //
                continue;
            }

            //
            if (hc_attr === 'ref') {
                self._refs[attr.value] = node;
                //
                if ((node as HTMLElement).hasAttribute(attr.name)) {
                    (node as HTMLElement).removeAttribute(attr.name);
                    --cnti;
                }
                //
                continue;
            }

            //
            if (
                !root ||
                root && !root['_hc']
            ) {
                self._traces.elements.indexOf(node) < 0 &&
                    self._traces.elements.push(node);
            }
            //
            !node['_hc'] && (
                node['_hc'] = {
                    attr: {},
                    comment: null,
                    for: null,
                }
            );
            //
            if (hc_attr === 'neither') { // neither 지원
                node['_hc'].attr['if'] = `!(${attr.value})`;
            }
            else {
                node['_hc'].attr[hc_attr] = attr.value;
            }
            //
            if (hc_attr === 'model') { // model의 경우 change/input attr 존재 여부 확인
                //
                // console.log(`procNode - attr:${hc_attr}`);
                // console.log(`procNode - calcRes - ${attr.value}`);
                let val = calcRes(attr.value, root && root['_hc'] && root['_hc']['model_str'] ? root['_hc']['model_str'] : null);
                Array.isArray(val) && self.arrayEventListener(val);
                //
                // console.log(`procNode - hc_attr:${hc_attr} / tagName:${(node as HTMLInputElement).tagName} / type:${(node as HTMLInputElement).type}`);
                //
                // input radio/checkbox
                (node as HTMLInputElement).tagName === 'INPUT' &&
                    ['radio', 'checkbox'].indexOf((node as HTMLInputElement).type) > -1 &&
                    node.addEventListener('change', (_evt) => {
                        // console.log(`model.change`);
                        //
                        let checked_value = null;
                        ((node as HTMLInputElement).type === 'radio') && (checked_value = (node as HTMLInputElement).checked ? (node as HTMLInputElement).value : null);
                        ((node as HTMLInputElement).type === 'checkbox') && (checked_value = (node as HTMLInputElement).checked ? (node as HTMLInputElement).value : ((node as HTMLInputElement).hasAttribute('name') ? [] : null));
                        //
                        // console.log(`model.change - checked_value.#1:${checked_value}`);
                        const group_name = (node as HTMLInputElement).hasAttribute('name') ? (node as HTMLInputElement).getAttribute('name') : null;
                        if (group_name) {
                            // const groups = self.el.querySelectorAll(`*[name=${group_name}]`);
                            const groups = (root as Element).querySelectorAll(`*[name=${group_name}]`);
                            checked_value = self.getCheckedValue(groups, (node as HTMLInputElement).type === 'checkbox');
                            // console.log(`model.change - group_name:${group_name} - checked_value.#2:${checked_value}`);
                        }
                        else {
                            // console.log(`model.change - value - ${(node as HTMLInputElement).value} / ${val}`);
                            // (obj as HTMLInputElement).checked = (obj as HTMLInputElement).value == val;
                            // (obj as HTMLInputElement).checked && (checked_value = (obj as HTMLInputElement).value);
                            checked_value = (node as HTMLInputElement).checked ? (node as HTMLInputElement).value : null;
                            // console.log(`model.change - checked_value.#3:${checked_value}`);
                        }
                        //
                        // Array.isArray(checked_value) && self.arrayEventListener(attrs[cnti].value, checked_value);
                        //
                        // self.applyModel();
                        //
                        node['_hc:force_apply'] = true;
                        //
                        // console.log(`model.change - callSet - ${attr.value} / ${checked_value}`);
                        callSet(attr.value, checked_value);
                    });

                // select
                (node as HTMLInputElement).tagName === 'SELECT' &&
                    ['select-one', 'select-multiple'].indexOf((node as HTMLInputElement).type) > -1 &&
                    node.addEventListener('change', (_evt) => {
                        //
                        // let val = calcRes(attr.value);
                        //
                        let checked_value = ((node as HTMLInputElement).type === 'select-one') ? null : [];
                        //
                        const groups = (node as HTMLInputElement).querySelectorAll(`option`);
                        checked_value = self.getSelectedValue(groups, (node as HTMLInputElement).type === 'select-multiple');
                        //
                        // Array.isArray(checked_value) && self.arrayEventListener(attrs[cnti].value, checked_value);
                        //
                        //
                        node['_hc:force_apply'] = true;
                        // self.applyModel();
                        callSet(attr.value, checked_value);
                    });

                // text/textarea
                ['INPUT', 'TEXTAREA'].indexOf((node as HTMLInputElement).tagName) > -1 &&
                    ['email', 'hidden', 'number', 'password', 'search', 'tel', 'url', 'datetime', 'text', 'textarea'].indexOf((node as HTMLInputElement).type) > -1 &&
                    node.addEventListener('input', (_evt) => {
                        //
                        //
                        node['_hc:force_apply'] = true;
                        // self.applyModel();
                        callSet(attr.value, (node as HTMLInputElement).value);
                    });
            }
            //
            switch (hc_attr) {
                case 'scroll.hit.top':
                case 'scroll.hit.bottom':
                    self.registEventListener(
                        node as Element,
                        'scroll',
                        attr,
                        function(evt: Event) {
                            if (
                                attr.name.indexOf('bottom') > -1 ?
                                    (self.scrollTop(node as Element) + self.innerHeight(node) >= self.scrollHeight(node as Element)) :
                                    (self.scrollTop(node as Element) <= 0)
                            ) {
                                call(attr.value, root && root['_hc'] && root['_hc']['model_str'] ? root['_hc']['model_str'] : null);
                            }
                        }
                    );
                    break;
                case 'input':
                case 'change':
                    break;
                default:
                    typeof(window[`on${hc_attr}`]) !== 'undefined' &&
                        self.registEventListener((node as HTMLInputElement), hc_attr, attr, null, root && root['_hc'] && root['_hc']['model_str'] ? root['_hc']['model_str'] : null);
                    break;
            }

            //
            if ((node as HTMLElement).hasAttribute(attr.name)) {
                (node as HTMLElement).removeAttribute(attr.name);
                --cnti;
            }
        }
    }

    private redefineModel(prop: string, parent: any = null, prev_model_prop: string = null): void {
        const self: Hacci = this;
        //
        if (!self._traces.model.listen) {
            self._traces.model.listen = function(prop: string, model: any) {
                // console.log(`redefineModel - listen`);
                // self.applyModel();
                self.procModel();
                //
                // self.procForNodes();
                Array.isArray(model) && self.procForModel(model);
            };
        }
        //
        if (!self._traces.model.listen_array) {
            self._traces.model.listen_array = function(model: any = null, action: string = null, ...args) {
                // console.log(`redefineModel - listen`);
                // self.applyModel();
                self.procModel();
                //
                // self.procForNodes();
                self.procForModel(model, action, ...args);
            };
        }
        //
        !parent && (parent = self);
        const model = self._traces.model.value;
        //
        // console.log(`redefineModel[${self._id}] - ${JSON.stringify({prop, prev_model_prop})}`);
        //
        const model_prop: string = prev_model_prop ? `${prev_model_prop}.__${prop}` : `__${prop}`;
        // console.log(`redefineModel - model_prop.${model_prop}`);
        if (typeof(model[model_prop]) === 'undefined') {
            model[model_prop] = parent[prop];
        }
        //
        const val = parent[prop];

        // 단일 자료 defineProperty 처리
        Object.defineProperty(
            parent,
            prop,
            {
                get: () => {
                    // console.log(`get:${prop} [${model_prop}]`);
                    return model[model_prop];
                },
                set: (value: any) => {
                    // console.log(`set:${prop} [${model_prop}]`);
                    //
                    model[model_prop] = value;
                    //
                    const is_array: boolean = Array.isArray(model[model_prop]);
                    is_array && self.arrayEventListener(model[model_prop]);
                    //
                    self._traces.model.listen(model_prop, model[model_prop]);
                    //
                    if (!is_array) {
                        // 해당 모델의 상위로 올라가는 중 배열 모델이 있으면 -> 해당 모델에 대한 listen 처리
                        const props: string[] = model_prop.split('.');
                        let props_str: string = '';
                        for (let cnti: number = 0; cnti < props.length; cnti++) {
                            props_str += `${cnti > 0 ? '.' : ''}${props[cnti]}`;
                            const props_model: any = model[props_str];
                            //
                            if (!Array.isArray(props_model)) continue;
                            // console.log(`defineProperty - props_str:${props_str} / is array:${Array.isArray(props_model)}`);
                            //
                            self.procForModel(props_model, '_replace', model[`${props_str}.${props[cnti + 1]}`]);
                        }
                    }

                    // 모델 변경시 text 변경 처리용
                    self.applyTextChange();
                }
            }
        );

        //
        // !(data[keys[cnti]] instanceof Object) -> number, string typeof
        // (data[keys[cnti]] instanceof Object) -> object typeof
        // (data[keys[cnti]] instanceof Array) -> object typeof
        if ((val instanceof Object) && ['object'].indexOf(typeof(val)) > -1) {
            //
            const keys: string[] = Object.keys(val);
            //
            for (let cnti: number = 0; cnti < keys.length; cnti++) {
                const key: string = keys[cnti];
                //
                this.redefineModel(key, val, model_prop);
            }
        }
    }

    //
    private procForModel(src_model: any = null, action: string = null, ...args: any[]): void {
        // console.log(`procForModel - src_model:${src_model} / action:${action} / args:${JSON.stringify(args)}`);
        // console.log(src_model);
        //
        const self: Hacci = this;
        //
        // const calcRes = function(val: string): any {
        //     // console.log(`applyModel - calcRes - val:${val}`);
        //     const fn = new Function(`${self._txts_mstr}return ${val};`);
        //     let fnRes = fn.apply(self);
        //     typeof(fnRes) === 'function' && (fnRes = fnRes());
        //     return fnRes;
        // }
        //
        // console.log(`procForModel - fors.length:${self._traces.fors.length}`);
        // let idx: number = 0;
        for (let cnti: number = 0; cnti < self._traces.fors.length; cnti++) {
            // idx++;
            // console.log(`procForModel - fors.#${idx}/${self._traces.fors.length}`);

            //
            const getModelStr = function(attr: string, row_idx: number) {
                //
                let rtn_val: string = '';
                //
                const model_str = String(attr).replace(/(\(.*\)|.+)\s+(in)\s+/g, '').replace(/\s/g, '');
                const data_str = String(attr).replace(/\s+in\s+.*$/, '').replace(/\s/g, '');
                //
                if (data_str.charAt(0) === '(') {
                    const data_keys: string[] = data_str.substring(1, data_str.length - 1).split(',');
                    for (let cnti: number = 0; cnti < data_keys.length; cnti++) {
                        rtn_val += `var ${data_keys[cnti]}=${model_str}[${row_idx}]['${data_keys[cnti]}'];\n`;
                    }
                }
                else {
                    rtn_val = `var ${data_str}=${model_str}[${row_idx}];\n`;
                }
                //
                return rtn_val;
            };

            //
            const procs = function(node: Node, el: Node) {
                //
                self.procNode(node, el);
                self.procNode((node as Element).querySelectorAll('*'), el);
                
                //
                self.procTextNode(node, el);
                self.procTextModel(el);

                //
                self.procModel(node, el);
                self.procModel((node as Element).querySelectorAll('*'), el);
            };

            //
            const el: Node = self._traces.fors[cnti];
            // console.log(`procForModel - fors.#${idx} - el:->`);
            // console.log(el);

            //
            const hc = el['_hc'];
            
            //
            // if (src_model) {
            //     console.log(`procForModel - match:${src_model === hc.for_model}`);
            //     console.log(src_model);
            //     console.log(hc.for_model);
            // }
            if (src_model && src_model !== hc.for_model) {
                // console.log(`procForModel - source not matched`);
                continue;
            }
            //
            // const html = (el as HTMLElement).outerHTML;
            // console.log(`procForModel - fors.#${idx} - html:${html}`);
            //
            // const model_str = String(hc.attr.for).replace(/(\(.*\)|.+)\s+(in)\s+/g, '').replace(/\s/g, '');
            // const data_str = String(hc.attr.for).replace(/\s+in\s+.*$/, '').replace(/\s/g, '');
            // console.log(`procForModel - fors.#${idx} - model_str:${model_str}`);
            // console.log(`procForModel - fors.#${idx} - data_str.#1:${data_str}`);
            //
            const model: any = hc.for_model
            // const model: any = calcRes(model_str);
            // console.log(`procForModel - fors.#${idx} - model:->`);
            // console.log(model);

            //
            const parentNode: Node = (hc.for_comment as Node).parentNode;
            // console.log(`procForModel - fors - parentNode:->`);
            // console.log(parentNode);

            //
            delete hc.for_txts;
            hc.for_txts = [];

            //
            let clear: boolean = true;
            let rms: any = null
            switch (action) {
                case 'push':
                case 'unshift':
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
                default:
                    // action 없이 들어오는 경우 중 model 갯수가 0이면 clear 처리
                    clear = model.length < 1;
                    break;
            }
            if (rms) {
                //
                while (rms.length > 0) {
                    parentNode.removeChild(rms[0]);
                    rms.splice(0, 1);
                }
                //
                clear = false;
            }

            //
            while (clear && hc.for_elements.length > 0) {
                parentNode.removeChild(hc.for_elements[0]);
                hc.for_elements.splice(0, 1);
            }

            // clear 아님 & action 없음 -> 개별건에 대해 update 및 삭제, 추가 처리 진행
            // if (!clear && !action) {
            //     //

            //     //
            //     return;
            // }

            if (action && action === '_replace') {
                // console.log(`procForModel - _replace`);
                for (let cntk: number = 0; cntk < model.length; cntk++) {

                    // console.log(`procForModel - _replace - model check:${JSON.stringify(model[cntk])}`);
                    // console.log(`procForModel - _replace - model check:${JSON.stringify(args[0])}`);
                    if (model[cntk] !== args[0]) continue;
                    // console.log(`procForModel - _replace - model exists:${(model[cntk] === args[0])}`);
                    //
                    hc['model_str'] = getModelStr(hc.attr.for, cntk);
                    // console.log(`procForModel - fors.#${idx} - data_str.#2:${data_str}`);

                    //
                    const newNode: Node = (el as HTMLElement).cloneNode(true);
                    //
                    procs(newNode, el);

                    //
                    parentNode.insertBefore(newNode, hc.for_elements[cntk]);
                    parentNode.removeChild(hc.for_elements[cntk]);

                    //
                    hc.for_elements[cntk] = newNode;
                }
            }
            else if (action && action === 'push') {
                for (let cntk: number = model.length - args.length; cntk < model.length; cntk++) {
                    //
                    hc['model_str'] = getModelStr(hc.attr.for, cntk);
                    // console.log(`procForModel - fors.#${idx} - data_str.#2:${data_str}`);

                    //
                    const node: Node = (el as HTMLElement).cloneNode(true);
                    parentNode.appendChild(node);
                    //
                    hc.for_elements.push(node);

                    //
                    procs(node, el);
                }
            }
            else if (action && action === 'unshift') {
                for (let cntk: number = args.length - 1; cntk > -1; cntk--) {
                    //
                    hc['model_str'] = getModelStr(hc.attr.for, cntk);
                    // console.log(`procForModel - fors.#${idx} - data_str.#2:${data_str}`);

                    //
                    const node: Node = (el as HTMLElement).cloneNode(true);
                    parentNode.insertBefore(node, hc.for_elements[0]);
                    //
                    hc.for_elements.unshift(node);

                    //
                    procs(node, el);
                }
            }
            else if (action && action === 'splice') {
                // insert index check
                const insert_idx: number = args[0];
                // console.log(`procForModel - action:${action}`);
                for (let cntk: number = insert_idx; cntk < insert_idx + args.length - 2; cntk++) {
                    //
                    hc['model_str'] = getModelStr(hc.attr.for, cntk);
                    // console.log(`procForModel - fors.#${idx} - data_str.#2:${data_str}`);

                    //
                    const node: Node = (el as HTMLElement).cloneNode(true);
                    if (hc.for_elements.length <= cntk) {
                        parentNode.appendChild(node);
                    }
                    else {
                        parentNode.insertBefore(node, hc.for_elements[cntk]);
                    }
                    //
                    hc.for_elements.splice(cntk, 0, node);

                    //
                    procs(node, el);
                }
            }
            else {
                //
                for (let cntk: number = 0; cntk < model.length; cntk++) {
                    //
                    let node: Node = null;
                    try { node = hc.for_elements[cntk]; } catch (e) {}
                    //
                    // console.log(`procForModel - node:${node}`);
                    //
                    hc['model_str'] = getModelStr(hc.attr.for, cntk);
                    // console.log(`procForModel - model_str:${hc['model_str']}`);
                    // console.log(`procForModel - model[${cntk}]:${JSON.stringify(model[cntk])}`);
                    //
                    if (typeof(node) === 'undefined') {
                        //
                        node = (el as HTMLElement).cloneNode(true);
                        // !node['_hc:for'] && (node['_hc:for'] = { model: model[cntk], });
                        //
                        const len: number = hc.for_elements.length;
                        if (len > 0 && hc.for_elements[len - 1].nextElementSibling) {
                            parentNode.insertBefore(node, hc.for_elements[len - 1].nextElementSibling);
                        }
                        else {
                            parentNode.appendChild(node);
                        }
                        //
                        hc.for_elements.push(node);
                        //
                        procs(node, el);
                    }
                    else {
                        //
                        const newNode = (el as HTMLElement).cloneNode(true);
                        // !node['_hc:for'] && (node['_hc:for'] = { model: model[cntk], });
                        //
                        procs(newNode, el);
    
                        //
                        hc.for_elements[cntk] = newNode;
    
                        //
                        parentNode.insertBefore(newNode, node);
                        parentNode.removeChild(node);
                    }
                }
            }
            continue;


            //
            if (clear) {
                //
                for (let cntk: number = 0; cntk < model.length; cntk++) {
                    //
                    hc['model_str'] = getModelStr(hc.attr.for, cntk);
                    // console.log(`procForModel - fors.#${idx} - data_str.#2:${data_str}`);

                    //
                    const node: Node = (el as HTMLElement).cloneNode(true);
                    !node['_hc:for'] && (node['_hc:for'] = {});
                    node['_hc:for'] && (node['_hc:for']['model'] = model[cntk]);
                    parentNode.appendChild(node);
                    //
                    hc.for_elements.push(node);
                    //
                    procs(node, el);
                }
            }
            else {
                if (action === 'push') {
                    for (let cntk: number = model.length - args.length; cntk < model.length; cntk++) {
                        //
                        hc['model_str'] = getModelStr(hc.attr.for, cntk);
                        // console.log(`procForModel - fors.#${idx} - data_str.#2:${data_str}`);
    
                        //
                        const node: Node = (el as HTMLElement).cloneNode(true);
                        !node['_hc:for'] && (node['_hc:for'] = {});
                        node['_hc:for'] && (node['_hc:for']['model'] = model[cntk]);
                        parentNode.appendChild(node);
                        //
                        hc.for_elements.push(node);
    
                        //
                        procs(node, el);
                    }
                }
                else if (action === 'unshift') {
                    // console.log(`procForModel - action:${action}`);
                    for (let cntk: number = args.length - 1; cntk > -1; cntk--) {
                        //
                        hc['model_str'] = getModelStr(hc.attr.for, cntk);
                        // console.log(`procForModel - fors.#${idx} - data_str.#2:${data_str}`);
    
                        //
                        const node: Node = (el as HTMLElement).cloneNode(true);
                        !node['_hc:for'] && (node['_hc:for'] = {});
                        node['_hc:for'] && (node['_hc:for']['model'] = model[cntk]);
                        parentNode.insertBefore(node, hc.for_elements[0]);
                        //
                        hc.for_elements.unshift(node);
    
                        //
                        procs(node, el);
                    }
                }
                else if (action === 'splice' && args.length > 2) {
                    // insert index check
                    const insert_idx: number = args[0];
                    // console.log(`procForModel - action:${action}`);
                    for (let cntk: number = insert_idx; cntk < insert_idx + args.length - 2; cntk++) {
                        //
                        hc['model_str'] = getModelStr(hc.attr.for, cntk);
                        // console.log(`procForModel - fors.#${idx} - data_str.#2:${data_str}`);
    
                        //
                        const node: Node = (el as HTMLElement).cloneNode(true);
                        !node['_hc:for'] && (node['_hc:for'] = {});
                        node['_hc:for'] && (node['_hc:for']['model'] = model[cntk]);
                        if (hc.for_elements.length <= cntk) {
                            parentNode.appendChild(node);
                        }
                        else {
                            parentNode.insertBefore(node, hc.for_elements[cntk]);
                        }
                        //
                        hc.for_elements.splice(cntk, 0, node);
    
                        //
                        procs(node, el);
                    }
                }
            }

            //
            // console.log(`procForModel - for_elements:->`);
            // console.log(hc.for_elements);
            // while (hc.for_elements.length > 0) {
            //     //
            //     // const idx: number = self._traces.for_elements.indexOf(hc.for_elements[cntk]);
            //     // idx > -1 && self._traces.for_elements.splice(idx, 1);
            //     //
            //     parentNode.removeChild(hc.for_elements[0]);
            //     //
            //     hc.for_elements.splice(0, 1);
            // }
            // console.log(`procForModel - fors.#${idx} - data_str.#2:${data_str}`);

            //
            // if (data_str.charAt(0) === '(') {
            //     // (id, pwd, index) in rows 같이 정의된 경우 (괄호로 시작하는 경우)

            //     //
            //     const data_keys: string[] = data_str.substring(1, data_str.length - 1).split(',');
            //     // console.log(`procForModel - fors.#${idx} - data_keys:${JSON.stringify(data_keys)}`);

            //     //
            //     if (clear) {
            //         //
            //         for (let cntk: number = 0; cntk < model.length; cntk++) {
            //             //
            //             let opt_str: string = '';
            //             for (let cntki: number = 0; cntki < data_keys.length; cntki++) {
            //                 opt_str += `var ${data_keys[cntki]}=${model_str}[${cntk}]['${data_keys[cntki]}'];\n`;
            //             }
            //             hc['model_str'] = opt_str;
            //             // console.log(`procForModel - fors.#${idx} - data_str.#2:${data_str}`);
    
            //             //
            //             const node: Node = (el as HTMLElement).cloneNode(true);
            //             parentNode.appendChild(node);
            //             //
            //             hc.for_elements.push(node);
    
            //             //
            //             procs(node, el);
            //         }
            //     }
            //     else {
            //         if (action === 'push') {
            //             for (let cntk: number = model.length - args.length; cntk < model.length; cntk++) {
            //                 //
            //                 let opt_str: string = '';
            //                 for (let cntki: number = 0; cntki < data_keys.length; cntki++) {
            //                     opt_str += `var ${data_keys[cntki]}=${model_str}[${cntk}]['${data_keys[cntki]}'];\n`;
            //                 }
            //                 hc['model_str'] = opt_str;
            //                 // console.log(`procForModel - fors.#${idx} - data_str.#2:${data_str}`);
        
            //                 //
            //                 const node: Node = (el as HTMLElement).cloneNode(true);
            //                 parentNode.appendChild(node);
            //                 //
            //                 hc.for_elements.push(node);
        
            //                 //
            //                 procs(node, el);
            //             }
            //         }
            //         else if (action === 'unshift') {
            //             // console.log(`procForModel - action:${action}`);
            //             for (let cntk: number = args.length - 1; cntk > -1; cntk--) {
            //                 //
            //                 let opt_str: string = '';
            //                 for (let cntki: number = 0; cntki < data_keys.length; cntki++) {
            //                     opt_str += `var ${data_keys[cntki]}=${model_str}[${cntk}]['${data_keys[cntki]}'];\n`;
            //                 }
            //                 hc['model_str'] = opt_str;
            //                 // console.log(`procForModel - fors.#${idx} - data_str.#2:${data_str}`);
        
            //                 //
            //                 const node: Node = (el as HTMLElement).cloneNode(true);
            //                 parentNode.insertBefore(node, hc.for_elements[0]);
            //                 //
            //                 hc.for_elements.unshift(node);
        
            //                 //
            //                 procs(node, el);
            //             }
            //         }
            //         else if (action === 'splice' && args.length > 2) {
            //             // insert index check
            //             const insert_idx: number = args[0];
            //             // console.log(`procForModel - action:${action}`);
            //             for (let cntk: number = insert_idx; cntk < insert_idx + args.length - 2; cntk++) {
            //                 //
            //                 let opt_str: string = '';
            //                 for (let cntki: number = 0; cntki < data_keys.length; cntki++) {
            //                     opt_str += `var ${data_keys[cntki]}=${model_str}[${cntk}]['${data_keys[cntki]}'];\n`;
            //                 }
            //                 hc['model_str'] = opt_str;
            //                 // console.log(`procForModel - fors.#${idx} - data_str.#2:${data_str}`);
        
            //                 //
            //                 const node: Node = (el as HTMLElement).cloneNode(true);
            //                 if (hc.for_elements.length <= cntk) {
            //                     parentNode.appendChild(node);
            //                 }
            //                 else {
            //                     parentNode.insertBefore(node, hc.for_elements[cntk]);
            //                 }
            //                 //
            //                 hc.for_elements.splice(cntk, 0, node);
        
            //                 //
            //                 procs(node, el);
            //             }
            //         }
            //     }
            // }
            // else {
            //     // row in rows 같이 정의된 경우
            //     //
            //     if (clear) {
            //         //
            //         for (let cntk: number = 0; cntk < model.length; cntk++) {
            //             //
            //             let opt_str: string = `var ${data_str}=${model_str}[${cntk}];\n`;
            //             hc['model_str'] = opt_str;
    
            //             //
            //             const node: Node = (el as HTMLElement).cloneNode(true);
            //             parentNode.appendChild(node);
            //             //
            //             hc.for_elements.push(node);
    
            //             //
            //             procs(node, el);
            //         }
            //     }
            //     else {
            //         if (action === 'push') {
            //             for (let cntk: number = model.length - args.length; cntk < model.length; cntk++) {
            //                 //
            //                 let opt_str: string = `var ${data_str}=${model_str}[${cntk}];\n`;
            //                 hc['model_str'] = opt_str;
            //                 // console.log(`procForModel - fors.#${idx} - data_str.#2:${data_str}`);
        
            //                 //
            //                 const node: Node = (el as HTMLElement).cloneNode(true);
            //                 parentNode.appendChild(node);
            //                 //
            //                 hc.for_elements.push(node);
        
            //                 //
            //                 procs(node, el);
            //             }
            //         }
            //         else if (action === 'unshift') {
            //             for (let cntk: number = args.length - 1; cntk > -1; cntk--) {
            //                 //
            //                 let opt_str: string = `var ${data_str}=${model_str}[${cntk}];\n`;
            //                 hc['model_str'] = opt_str;
            //                 // console.log(`procForModel - fors.#${idx} - data_str.#2:${data_str}`);
        
            //                 //
            //                 const node: Node = (el as HTMLElement).cloneNode(true);
            //                 parentNode.insertBefore(node, hc.for_elements[0]);
            //                 //
            //                 hc.for_elements.unshift(node);
        
            //                 //
            //                 procs(node, el);
            //             }
            //         }
            //         else if (action === 'splice' && args.length > 2) {
            //             // insert index check
            //             const insert_idx: number = args[0];
            //             // console.log(`procForModel - action:${action}`);
            //             for (let cntk: number = insert_idx; cntk < insert_idx + args.length - 2; cntk++) {
            //                 //
            //                 let opt_str: string = `var ${data_str}=${model_str}[${cntk}];\n`;
            //                 hc['model_str'] = opt_str;
            //                 // console.log(`procForModel - fors.#${idx} - data_str.#2:${data_str}`);
        
            //                 //
            //                 const node: Node = (el as HTMLElement).cloneNode(true);
            //                 if (hc.for_elements.length <= cntk) {
            //                     parentNode.appendChild(node);
            //                 }
            //                 else {
            //                     parentNode.insertBefore(node, hc.for_elements[cntk]);
            //                 }
            //                 //
            //                 hc.for_elements.splice(cntk, 0, node);
        
            //                 //
            //                 procs(node, el);
            //             }
            //         }
            //     }
            // }
        }
    }
    
    // //
    // private applyModel(): void {
    //     //
    //     const self: Hacci = this;

    //     // //
    //     // const calcRes = function(val: string): any {
    //     //     // console.log(`applyModel - calcRes - val:${val}`);
    //     //     const fn = new Function(`${self._txts_mstr}return ${val};`);
    //     //     let fnRes = fn.apply(self);
    //     //     typeof(fnRes) === 'function' && (fnRes = fnRes());
    //     //     return fnRes;
    //     // }
    //     // //
    //     // const call = function(val: string): any {
    //     //     let exec = val;
    //     //     if (val.indexOf('(') < 0) {
    //     //         exec += '()';
    //     //     }
    //     //     exec = exec.replace(/;$/, '');
    //     //     // console.log(`applyModel - call - exec:${exec}`);
    //     //     const fn = new Function(`${self._txts_mstr}return ${exec};`);
    //     //     return fn.apply(self);
    //     // }
    //     //
        
    //     //
    //     // self.procModel(self._traces.elements, null);
    //     self.procModel();
        
    //     // const model_groups = [];
    //     //
    //     // for (let cnti: number = 0; cnti < self._traces.elements.length; cnti++) {
    //     //     //
    //     //     const el: Node = self._traces.elements[cnti];



    //         // const hc = el['_hc'];

    //         // // // attribute 목록 확인
    //         // // const attrs: string[] = Object.keys(el['_hc'].attr);
    //         // // console.log(`_hc:${JSON.stringify(el['_hc'])}`);

    //         // // for (let cntk: number = 0; cntk < attrs.length; cntk++) {
    //         // //     const attr: string = attrs[cntk];
    //         // // }

    //         // //
    //         // // console.log(`applyModel - hc.attr:${Object.keys(hc['attr'])}`);
    //         // // if
    //         // if (hc['attr']['if']) {
    //         //     const fnRes = calcRes(hc['attr']['if']);
    //         //     //
    //         //     // console.log(`if - ${hc['attr']['if']} = ${fnRes}`);
    //         //     //
    //         //     if (fnRes === true && hc['comment']) {
    //         //         // comment -> real
    //         //         // console.log(`if - comment -> real`);

    //         //         //
    //         //         hc['comment'].parentNode.insertBefore(el, hc['comment']);
    //         //         hc['comment'].parentNode.removeChild(hc['comment']);
    //         //         delete hc['comment'];
    //         //         hc['comment'] = null;
    //         //     }
    //         //     else if (fnRes === false && !hc['comment']) {
    //         //         // real -> comment
    //         //         // console.log(`if - real -> comment`);

    //         //         //
    //         //         hc['comment'] = window.document.createComment(`//hc:${self._id}:${self.createTagId()}`);
    //         //         el.parentNode.insertBefore(hc['comment'], el);
    //         //         el.parentNode.removeChild(el);
    //         //     }
    //         // }
    //         // if (hc['attr']['disabled']) {
    //         //     const fnRes = calcRes(hc['attr']['disabled']);
    //         //     //
    //         //     (el as HTMLInputElement).disabled = fnRes;
    //         // }
    //         // if (hc['attr']['html']) {
    //         //     const fnRes = calcRes(hc['attr']['html']);
    //         //     //
    //         //     (el as Element).innerHTML = fnRes;
    //         //     // console.log(`applyModel - html:${(el as Element).innerHTML}`);
    //         // }
    //         // if (hc['attr']['text']) {
    //         //     const fnRes = calcRes(hc['attr']['text']);
    //         //     //
    //         //     (el as HTMLElement).innerText = fnRes;
    //         // }
    //         // if (hc['attr']['value']) {
    //         //     const fnRes = calcRes(hc['attr']['value']);
    //         //     //
    //         //     (el as HTMLInputElement).value = fnRes;
    //         // }
    //         // if (hc['attr']['model']) {
    //         //     const fnRes = calcRes(hc['attr']['model']);

    //         //     //
    //         //     if ((el as HTMLElement).tagName === 'INPUT' && self._toi_check.indexOf((el as HTMLInputElement).type) > -1) {
    //         //         let call_on_change = false;
    //         //         const group_name = (el as HTMLElement).hasAttribute('name') ? (el as HTMLElement).getAttribute('name') : null;
    //         //         // console.log(`applyModel - input - group_name:${group_name}${group_name ? ` / model_groups.indexOf:${model_groups.indexOf(group_name)}` : ''}`);
    //         //         if (group_name) {
    //         //             //
    //         //             if (model_groups.indexOf(group_name) < 0) {
    //         //                 model_groups.push(group_name);
    //         //                 //
    //         //                 const groups = self.el.querySelectorAll(`*[name=${group_name}]`);
    //         //                 const changed = self.setCheckedValue(groups, fnRes);
    //         //                 // console.log(`applyModel - input - group_name:${group_name} - groups:${groups} / ${groups.length}`);
    //         //                 // console.log(`applyModel - input - group_name:${group_name} - changed:${changed}`);
    //         //                 //
    //         //                 call_on_change = hc['attr']['change'] && changed;
    //         //                 // console.log(`applyModel - input - group_name:${group_name} - call_on_change:${call_on_change}`);
    //         //             }
    //         //         }
    //         //         else {
    //         //             const prev: boolean = (el as HTMLInputElement).checked;
    //         //             // console.log(`applyModel - input - prev:${prev}`);
    //         //             // console.log(`applyModel - input - checked:${(el as HTMLInputElement).checked} / value - ${(el as HTMLInputElement).value} / ${fnRes}`);
    //         //             (el as HTMLInputElement).checked = (el as HTMLInputElement).value == fnRes;
    //         //             //
    //         //             call_on_change = (el as HTMLInputElement).checked != prev;
    //         //             // console.log(`applyModel - input - call_on_change:${call_on_change}`);
    //         //         }
    //         //         //
    //         //         // console.log(`applyModel - input - _hc:force_apply:${el['_hc:force_apply']}`);
    //         //         if (!call_on_change && el['_hc:force_apply']) {
    //         //             call_on_change = true;
    //         //             delete el['_hc:force_apply'];
    //         //         }
    //         //         //
    //         //         call_on_change && hc['attr']['change'] && call(hc['attr']['change']);
    //         //         // if (call_on_change) {
    //         //         //     call(hc['attr']['change']);
    //         //         // }
    //         //     }
    //         //     else if ((el as HTMLElement).tagName === 'SELECT' && self._toi_select.indexOf((el as HTMLInputElement).type) > -1) {
    //         //         let call_on_change = false;
    //         //         // console.log(`applyModel - select`);
    //         //         const groups = (el as HTMLInputElement).querySelectorAll(`option`);
    //         //         const changed = self.setSelectedValue(groups, fnRes);
    //         //         // console.log(`applyModel - select - groups:${groups} / ${groups.length}`);
    //         //         // console.log(`applyModel - select - changed:${changed}`);
    //         //         //
    //         //         call_on_change = hc['attr']['change'] && changed;
    //         //         // console.log(`applyModel - select - call_on_change:${call_on_change}`);
    //         //         //
    //         //         // console.log(`applyModel - select - _hc:force_apply:${el['_hc:force_apply']}`);
    //         //         if (!call_on_change && el['_hc:force_apply']) {
    //         //             call_on_change = true;
    //         //             delete el['_hc:force_apply'];
    //         //         }
    //         //         //
    //         //         call_on_change && hc['attr']['change'] && call(hc['attr']['change']);
    //         //         // if (call_on_change) {
    //         //         //     call(hc['attr']['change']);
    //         //         // }
    //         //     }
    //         //     else if (['INPUT', 'TEXTAREA'].indexOf((el as HTMLElement).tagName) > -1 && self._toi_input.indexOf((el as HTMLInputElement).type) > -1) {
    //         //         let call_on_input = false;
    //         //         // console.log(`applyModel - input2 - tagName:${(el as HTMLElement).tagName} - value = ${(el as HTMLInputElement).value} / ${fnRes}`);
    //         //         const changed = (el as HTMLInputElement).value != fnRes;
    //         //         // console.log(`applyModel - input2 - tagName:${(el as HTMLElement).tagName} - changed:${changed}`);
    //         //         (el as HTMLInputElement).value = fnRes;
    //         //         //
    //         //         call_on_input = hc['attr']['input'] && changed;
    //         //         // console.log(`applyModel - input2 - tagName:${(el as HTMLElement).tagName} - call_on_input:${call_on_input}`);
    //         //         //
    //         //         // console.log(`applyModel - input2 - _hc:force_apply:${el['_hc:force_apply']}`);
    //         //         if (!call_on_input && el['_hc:force_apply']) {
    //         //             call_on_input = true;
    //         //             delete el['_hc:force_apply'];
    //         //         }
    //         //         //
    //         //         call_on_input && hc['attr']['input'] && call(hc['attr']['input']);
    //         //         // if (call_on_input) {
    //         //         //     call(hc['attr']['input']);
    //         //         // }
    //         //     }
    //         // }
    //     // }
    // }

    private initModel() {
        this.procModel(null, null, null, true);
    }

    private procModel(node: Node|NodeList|Node[]|null = null, root: Node = null, model_groups: string[]|null = null, is_init: boolean = false): void {
        // console.log(`procModel.St`);

        //
        const self: Hacci = this;

        //
        !node && (node = self._traces.elements);

        //
        const calcRes = function(val: string, opt_str: string = null): any {
            // console.log(`procModel - calcRes - val:${val} / opt_str:${opt_str}`);
            const fn = new Function(`${self._txts_mstr}${opt_str ? opt_str : ''}return ${val};`);
            let fnRes = fn.apply(self);
            typeof(fnRes) === 'function' && (fnRes = fnRes());
            return fnRes;
        }
        //
        const call = function(val: string, opt_str: string = null): any {
            // console.log(`procModel - call - val:${val}`);
            let exec = val;
            if (val.indexOf('(') < 0) {
                exec += '()';
            }
            exec = exec.replace(/;$/, '');
            // console.log(`procModel - call - exec:${exec}`);
            const fn = new Function(`${self._txts_mstr}${opt_str ? opt_str : ''}return ${exec};`);
            return fn.apply(self);
        }

        //
        if (node instanceof NodeList || Array.isArray(node)) {
            //
            !model_groups && (model_groups = []);
            //
            for (let cnti: number = 0; cnti < node.length; cnti++) {
                self.procModel(node[cnti], root, model_groups, is_init);
            }
            //
            return;
        }
        //
        if (!node['_hc']) return;

        //
        const hc = node['_hc'];

        // // attribute 목록 확인
        // const attrs: string[] = Object.keys(el['_hc'].attr);
        // console.log(`_hc:${JSON.stringify(el['_hc'])}`);

        // for (let cntk: number = 0; cntk < attrs.length; cntk++) {
        //     const attr: string = attrs[cntk];
        // }

        //
        // console.log(`applyModel - hc.attr:${Object.keys(hc['attr'])}`);
        // if
        if (hc['attr']['if']) {
            const fnRes = calcRes(hc['attr']['if'], root && root['_hc'] && root['_hc']['model_str'] ? root['_hc']['model_str'] : null);
            //
            // console.log(`if - ${hc['attr']['if']} = ${fnRes}`);
            //
            if (fnRes === true && hc['comment']) {
                // comment -> real
                // console.log(`if - comment -> real`);

                //
                hc['comment'].parentNode.insertBefore(node, hc['comment']);
                hc['comment'].parentNode.removeChild(hc['comment']);
                delete hc['comment'];
                hc['comment'] = null;
            }
            else if (fnRes === false && !hc['comment']) {
                // real -> comment
                // console.log(`if - real -> comment`);

                //
                hc['comment'] = window.document.createComment(`//hc:${self._id}:${self.createTagId()}`);
                node.parentNode.insertBefore(hc['comment'], node);
                node.parentNode.removeChild(node);
            }
        }
        if (hc['attr']['disabled']) {
            const fnRes = calcRes(hc['attr']['disabled'], root && root['_hc'] && root['_hc']['model_str'] ? root['_hc']['model_str'] : null);
            //
            (node as HTMLInputElement).disabled = fnRes;
        }
        if (hc['attr']['html']) {
            const fnRes = calcRes(hc['attr']['html'], root && root['_hc'] && root['_hc']['model_str'] ? root['_hc']['model_str'] : null);
            //
            (node as Element).innerHTML = fnRes;
            // console.log(`applyModel - html:${(el as Element).innerHTML}`);
        }
        if (hc['attr']['text']) {
            const fnRes = calcRes(hc['attr']['text'], root && root['_hc'] && root['_hc']['model_str'] ? root['_hc']['model_str'] : null);
            //
            (node as HTMLElement).innerText = fnRes;
        }
        if (hc['attr']['value']) {
            const fnRes = calcRes(hc['attr']['value'], root && root['_hc'] && root['_hc']['model_str'] ? root['_hc']['model_str'] : null);
            //
            (node as HTMLInputElement).value = fnRes;
        }
        if (hc['attr']['model']) {
            const fnRes = calcRes(hc['attr']['model'], root && root['_hc'] && root['_hc']['model_str'] ? root['_hc']['model_str'] : null);

            //
            if ((node as HTMLElement).tagName === 'INPUT' && self._toi_check.indexOf((node as HTMLInputElement).type) > -1) {
                let call_on_change = false;
                const group_name = (node as HTMLElement).hasAttribute('name') ? (node as HTMLElement).getAttribute('name') : null;
                // console.log(`applyModel - input - group_name:${group_name}${group_name ? ` / model_groups.indexOf:${model_groups.indexOf(group_name)}` : ''}`);
                if (group_name) {
                    //
                    if (model_groups.indexOf(group_name) < 0) {
                        model_groups.push(group_name);
                        //
                        const groups = self.el.querySelectorAll(`*[name=${group_name}]`);
                        const changed = self.setCheckedValue(groups, fnRes);
                        // console.log(`applyModel - input - group_name:${group_name} - groups:${groups} / ${groups.length}`);
                        // console.log(`applyModel - input - group_name:${group_name} - changed:${changed}`);
                        //
                        call_on_change = hc['attr']['change'] && changed;
                        // console.log(`procModel - input - group_name:${group_name} - call_on_change.#1:${call_on_change}`);
                    }
                }
                else {
                    const prev: boolean = (node as HTMLInputElement).checked;
                    // console.log(`applyModel - input - prev:${prev}`);
                    // console.log(`applyModel - input - checked:${(node as HTMLInputElement).checked} / value - ${(node as HTMLInputElement).value} / ${fnRes}`);
                    (node as HTMLInputElement).checked = (node as HTMLInputElement).value == fnRes;
                    //
                    call_on_change = (node as HTMLInputElement).checked != prev;
                    // console.log(`applyModel - input - call_on_change.#2:${call_on_change}`);
                }
                //
                // console.log(`procModel - input - call_on_change.#3:${call_on_change} / _hc:force_apply:${node['_hc:force_apply']}`);
                if (!call_on_change && node['_hc:force_apply']) {
                    call_on_change = true;
                    delete node['_hc:force_apply'];
                }
                //
                // console.log(`procModel - input - call_on_change.#4:${call_on_change} / is_init:${is_init}`);
                // console.log(`procModel - input - call.#1:${hc['attr']['change']}`);
                !is_init && call_on_change && hc['attr']['change'] && call(hc['attr']['change'], root && root['_hc'] && root['_hc']['model_str'] ? root['_hc']['model_str'] : null);
                // if (call_on_change) {
                //     call(hc['attr']['change']);
                // }
            }
            else if ((node as HTMLElement).tagName === 'SELECT' && self._toi_select.indexOf((node as HTMLInputElement).type) > -1) {
                let call_on_change = false;
                // console.log(`applyModel - select`);
                const groups = (node as HTMLInputElement).querySelectorAll(`option`);
                const changed = self.setSelectedValue(groups, fnRes);
                // console.log(`applyModel - select - groups:${groups} / ${groups.length}`);
                // console.log(`applyModel - select - changed:${changed}`);
                //
                call_on_change = hc['attr']['change'] && changed;
                // console.log(`applyModel - select - call_on_change:${call_on_change}`);
                //
                // console.log(`applyModel - select - _hc:force_apply:${el['_hc:force_apply']}`);
                if (!call_on_change && node['_hc:force_apply']) {
                    call_on_change = true;
                    delete node['_hc:force_apply'];
                }
                //
                !is_init && call_on_change && hc['attr']['change'] && call(hc['attr']['change'], root && root['_hc'] && root['_hc']['model_str'] ? root['_hc']['model_str'] : null);
                // if (call_on_change) {
                //     call(hc['attr']['change']);
                // }
            }
            else if (['INPUT', 'TEXTAREA'].indexOf((node as HTMLElement).tagName) > -1 && self._toi_input.indexOf((node as HTMLInputElement).type) > -1) {
                let call_on_input = false;
                // console.log(`applyModel - input2 - tagName:${(node as HTMLElement).tagName} - value = ${(node as HTMLInputElement).value} / ${fnRes}`);
                const changed = (node as HTMLInputElement).value != fnRes;
                // console.log(`applyModel - input2 - tagName:${(node as HTMLElement).tagName} - changed:${changed}`);
                (node as HTMLInputElement).value = fnRes;
                //
                call_on_input = hc['attr']['input'] && changed;
                // console.log(`applyModel - input2 - tagName:${(node as HTMLElement).tagName} - call_on_input:${call_on_input}`);
                //
                // console.log(`applyModel - input2 - _hc:force_apply:${node['_hc:force_apply']}`);
                if (!call_on_input && node['_hc:force_apply']) {
                    call_on_input = true;
                    delete node['_hc:force_apply'];
                }
                //
                !is_init && call_on_input && hc['attr']['input'] && call(hc['attr']['input'], root && root['_hc'] && root['_hc']['model_str'] ? root['_hc']['model_str'] : null);
                // if (call_on_input) {
                //     call(hc['attr']['input']);
                // }
            }
        }
        // console.log(`procModel.Ed`);
    }

    /**
     * Array 값 수정이 발생한 경우 감지를 위한 이벤트 처리
     * @param target 
     */
    private arrayEventListener(target: Array<any>): void {
        // console.log(`arrayEventListener`);
        //
        const self: Hacci = this;
        // const listen = this._traces.model.listen();

        //
        target.push = function(...args): number {
            const rtn_val: number = Array.prototype.push.call(target, ...args);
            // self._traces.model.listen();
            self._traces.model.listen_array(target, 'push', ...args);
            return rtn_val;
        },
        target.pop = function(...args): any {
            const rtn_val: any = Array.prototype.pop.call(target, ...args);
            // self._traces.model.listen();
            self._traces.model.listen_array(target, 'pop', ...args);
            return rtn_val;
        },
        target.splice = function(...args): any[] {
            const rtn_val: any[] = Array.prototype.splice.call(target, ...args);
            // self._traces.model.listen();
            self._traces.model.listen_array(target, 'splice', ...args);
            return rtn_val;
        },
        target.shift = function(...args): any {
            const rtn_val: any = Array.prototype.shift.call(target, ...args);
            // self._traces.model.listen();
            self._traces.model.listen_array(target, 'shift', ...args);
            return rtn_val;
        },
        target.unshift = function(...args): number {
            const rtn_val: number = Array.prototype.unshift.call(target, ...args);
            // self._traces.model.listen();
            self._traces.model.listen_array(target, 'unshift', ...args);
            return rtn_val;
        }
    }

    private registEventListener(el: Element, name: string, attr: Attr, listener: EventListenerOrEventListenerObject = null, model_str: string = null): void {
        const self: Hacci = this;
        //
        const call = function(evt: Event, val: string, model_str: string = null): any {
            // console.log(`registEventListener - call - val:${val}`);
            //
            let exec = val;
            if (val.indexOf('(') < 0) {
                exec += '(_event)';
            }
            exec = exec.replace(/;$/, '');
            //
            const args = `try{ var _event=arguments[0]; } catch(e) { _event=arguments[0]; }\n`;
            //
            // console.log(`registEventListener - call - exec:${exec}`);
            const fn = new Function(`${self._txts_mstr}${model_str ? model_str : ''}${args}return ${exec};`);
            return fn.apply(self, [evt]);
        }
        //
        !listener &&
            (listener = function(evt: Event) { call(evt, attr.value, model_str) });
        //
        el.addEventListener(name, listener);
        //
        this._event_listeners.push({
            el, name, listener,
        });
    }

    private clearEventListeners(): void {
        //
        for (let cnti: number = 0; cnti < this._event_listeners.length; cnti++) {
            const listener: HacciEventListener = this._event_listeners[cnti];
            listener.el.removeEventListener(listener.name, listener.listener);
        }
        //
        this._event_listeners = [];
    }

    private searchTextNodes(node: Node, root: Node = null): void {
        // console.log(`searchTextNodes`);
        !node && (node = this.el);
        //
        if (node.hasChildNodes()) {
            for (let cnti: number = 0; cnti < node.childNodes.length; cnti++) {
                switch (node.childNodes[cnti].nodeType) {
                    case 1: // element
                        this.searchTextNodes(node.childNodes[cnti], root);
                        break;
                    case 3: // text
                        // console.log(`searchTextNodes - textContent:${parent.childNodes[cnti].textContent}`);
                        /{{([^}}\r\n]+)?}}/g.test(node.childNodes[cnti].textContent) &&
                            !root && this._traces.txts.push({
                                node: node.childNodes[cnti],
                                text: node.childNodes[cnti].textContent,
                                fn: null    // 컴파일된 함수
                            });
                        /{{([^}}\r\n]+)?}}/g.test(node.childNodes[cnti].textContent) &&
                            root && root['_hc'] && root['_hc']['for_txts'] && root['_hc']['for_txts'].push({
                                node: node.childNodes[cnti],
                                text: node.childNodes[cnti].textContent,
                                fn: null    // 컴파일된 함수
                            });
                        break;
                }
            }

            // 모델 변경시 text 변경 처리용
            this.applyTextChange();
        }
    }

    private procTextNode(node: Node, root: Node = null): void {
        // console.log(`procTextNode`);
        !node && (node = this.el);
        //
        if (node.hasChildNodes()) {
            for (let cnti: number = 0; cnti < node.childNodes.length; cnti++) {
                switch (node.childNodes[cnti].nodeType) {
                    case 1: // element
                        this.procTextNode(node.childNodes[cnti], root);
                        break;
                    case 3: // text
                        // console.log(`procTextNode - root:${root} / textContent:${node.childNodes[cnti].textContent}`);
                        !root && /{{([^}}\r\n]+)?}}/g.test(node.childNodes[cnti].textContent) &&
                            this._traces.txts.push({
                                node: node.childNodes[cnti],
                                text: node.childNodes[cnti].textContent,
                                fn: null    // 컴파일된 함수
                            });
                        root && /{{([^}}\r\n]+)?}}/g.test(node.childNodes[cnti].textContent) &&
                            root['_hc'] && root['_hc']['for_txts'] && root['_hc']['for_txts'].push({
                                node: node.childNodes[cnti],
                                text: node.childNodes[cnti].textContent,
                                fn: null    // 컴파일된 함수
                            });
                        break;
                }
            }

            // 모델 변경시 text 변경 처리용
            // this.applyTextChange(root ? root['_hc']['for_txts'] : null);
        }
    }

    /**
     * 대상 문자열에 대한 보간 처리
     */
    private applyTextChange(nodes: any = null): void {
        //
        // console.log(`applyTextChange`);
        // const txts = this._traces.txts;
        const txts = !nodes ? this._traces.txts : nodes;
        for (let cnti: number = 0; cnti < txts.length; cnti++) {
            if (!txts[cnti].fn) {
                txts[cnti].fn = this.compileText(txts[cnti].text);
            }
            txts[cnti].node.textContent = txts[cnti].fn.apply(this);
        }
    }

    /**
     * 대상 문자열에 대한 보간 처리
     */
    private procTextModel(nodes: any = null): void {
        //
        // console.log(`applyTextChange`);
        // const txts = this._traces.txts;
        const txts = !nodes ? this._traces.txts : nodes['_hc'] && nodes['_hc']['for_txts'] ? nodes['_hc']['for_txts'] : nodes;
        for (let cnti: number = 0; cnti < txts.length; cnti++) {
            if (!txts[cnti].fn) {
                txts[cnti].fn = this.compileText(txts[cnti].text, nodes && nodes['_hc'] && nodes['_hc']['model_str'] ? nodes['_hc']['model_str'] : null);
            }
            txts[cnti].node.textContent = txts[cnti].fn.apply(this);
        }
    }

    /**
     * 문자열 보간
     * @param html 
     */
    // private compileText(html: string, options: any): Function {
    private compileText(html: string, opt_str: string = null): Function {
        //
        if (!this._txts_mstr) {
            this._txts_mstr = '';
            const keys: string[] = Object.keys(this);
            for (let cnti: number = 0; cnti < keys.length; cnti++) {
                if (keys[cnti].length > 1 && keys[cnti].charAt(0) === '_') continue;
                this._txts_mstr += `var ${keys[cnti]}=this.${keys[cnti]};\n`;
            }
        }
        // /(?<!{)(?:{{2})(?!{)([^}{2}\r\n]+)?(?<!})(?:}{2})(?!})/g
        let re: RegExp = /{{([^}}]+)?}}/g, reExp: RegExp = /(^( )?(if|for|else|switch|case|break|{|}))(.*)?/g, code: string = this._txts_mstr + (opt_str ? opt_str : '') + 'var r=[];\n', cursor: number = 0, match: any;
        const add = function(line: any, js: any = null) {
            js? (code += line.match(reExp) ? line + '\n' : 'r.push(' + line + ');\n') :
                (code += line != '' ? 'r.push("' + line.replace(/"/g, '\\"') + '");\n' : '');
            return add;
        }
        while (match = re.exec(html)) {
            add(html.slice(cursor, match.index))(match[1], true);
            cursor = match.index + match[0].length;
        }
        add(html.substr(cursor, html.length - cursor));
        code += 'return r.join("");';
        // return (new Function(code.replace(/[\r\t\n]/g, ''))).apply(options);
        return new Function(code.replace(/[\r\t\n]/g, ''));
    }

    private scrollHeight(el: Element): number {
        return el.nodeType === 9 ?
            Number(window.document.documentElement.scrollHeight) :
            Number(el.scrollHeight);
    }

    private scrollTop(el: Element): number {
        const rtn_val = el.nodeType === 9 ?
            window.pageYOffset :
            el.scrollTop;
        return Math.ceil(rtn_val);
    }

    private innerHeight(el: any): number {
        const rtn_val = el.nodeType === 9 ? 
            Number(Math.max(
                (el as Document).body.scrollHeight,
                (el as Document).documentElement.scrollHeight,
                (el as Document).body.offsetHeight,
                (el as Document).documentElement.offsetHeight,
                (el as Document).documentElement.clientHeight
            )) :
            Number((el as HTMLElement).clientHeight);
        return Math.ceil(rtn_val);
    }

    /**
     * HTML 변경된 경우 이를 반영시키기 위해 기존 자료 삭제 및 초기화 처리
     */
    public refresh(): void {
        //
        this.clearData();
        //
        // this.clearEventListeners();
        //
        this.init();
    }

    /**
     * model 정보 초기화
     */
    public clearData(): void {
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
    
    /**
     * 숫자/영문대소문자 조합의 랜덤문자열 생성
     * @param length 
     */
    private getRandomString(length: number): string {
        let rtn_val: string = '';
        for (let cnti: number = 0; cnti < length; cnti++) {
            const code = Math.floor(Math.random() * 51);
            rtn_val += String.fromCharCode(code + (code < 26 ? 65 : 71));
        }
        return rtn_val;
    }

    /**
     * 현재 객체의 id값 생성
     */
    private createInstanceId(): string {
        return this.getRandomString(8) + '_' + Date.now();
    }

    /**
     * comment 등 tag_id 만들기 위한 id값 생성
     */
    private createTagId(): string {
        // return `//hc:${this._id}:_tag_${this.getRandomString(4)}_${Date.now()}`;
        return `${this.getRandomString(6)}_${Date.now()}`;
    }

    /**
     * arrow function 여부 반환
     * @param func 
     */
    private isArrowFunc(func: Function): boolean {
        return typeof func.prototype === 'undefined';
    }

    /**
     * arrow function 을 일반 function 으로 변경 처리.
     * (this 혼란 제거)
     * @param func 
     */
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
    

    /**
     * radio/checkbox element에 대해 현재 checked된 값 반환
     * @param groups 
     * @param return_as_array true인 경우 배열로, 아니면 단일값 반환. name 속성으로 묶인 경우 true 사용
     */
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
    
    /**
     * select 하위 option element에 대해 현재 selected된 값 반환
     * @param groups 
     * @param return_as_array true인 경우 배열로, 아니면 단일값 반환. multiple인 경우 true 사용
     */
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
    
    /**
     * radio/checkbox element에 대해 지정된 값으로 checked 처리
     * @param groups 
     * @param value 
     */
    private setCheckedValue(groups: NodeListOf<Element>, value: any[]|any): boolean {
        // console.log(`setCheckedValue - groups:${(groups[0] as HTMLInputElement).name} / value:${value}`);
        //
        let rtn_val = false; // 변경 여부 반환
        //
        // let has_checked = false;
        for (let cntk: number = 0; cntk < groups.length; cntk++) {
            const item: HTMLInputElement = groups[cntk] as HTMLInputElement;
            //
            // !has_checked && item.checked && (has_checked = true);
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
            // console.log(`setCheckedValue.proc - item.value:${item.value} / item.checked:${item.checked} / value:${JSON.stringify(value)} / rtn_val:${rtn_val}`);
            if (rtn_val) break;
        }
        // console.log(`setCheckedValue - rtn_val.#1:${rtn_val}`);
        // !has_checked && !rtn_val && (rtn_val = true);
        // console.log(`setCheckedValue.proc - has_checked:${has_checked} / rtn_val:${rtn_val}`);
        //
        for (let cntk: number = 0; cntk < groups.length; cntk++) {
            const item: HTMLInputElement = groups[cntk] as HTMLInputElement;
            //
            item.checked = Array.isArray(value) ?
                (value.indexOf(item.value) > -1) :
                (value == item.value);
        }
        // console.log(`setCheckedValue - rtn_val.#2:${rtn_val}`);
        //
        return rtn_val;
    }
    
    /**
     * select 하위 option element에 대해 지정된 값으로 selected 처리
     * @param groups 
     * @param value 
     */
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

            //
            // console.log(`setSelectedValue.proc - item.value:${item.value} / item.selected:${item.selected} / value:${JSON.stringify(value)} / rtn_val:${rtn_val}`);
            if (rtn_val) break;
        }
        // !has_selected && !rtn_val && (rtn_val = true);
        // console.log(`setSelectedValue.proc - has_selected:${has_selected} / rtn_val:${rtn_val}`);
        //
        for (let cntk: number = 0; cntk < groups.length; cntk++) {
            const item: HTMLOptionElement = groups[cntk] as HTMLOptionElement;
            //
            item.selected = Array.isArray(value) ?
                (value.indexOf(item.value) > -1) :
                (value == item.value);
        }
        //
        return rtn_val;
    }

    /**
     * event로 특정된 이벤트에 대한 리스닝 처리 등록
     * @param event 
     * @param callback 
     */
    public on(event: string, callback: Function): void {
        !this._bus[event] && (this._bus[event] = []);
        //
        if (this._bus[event].indexOf(callback) > -1) return;
        //
        this._bus[event].push(callback);
    }

    /**
     * event로 특정된 이벤트에 대한 리스닝 처리 삭제
     * @param event 
     * @param callback null이면 event 전체 삭제 처리
     */
    public off(event: string, callback: Function = null): void {
        if (this._bus[event] && !callback) {
            delete this._bus[event];
        }
        else if (this._bus[event] && callback) {
            const idx = this._bus[event].indexOf(callback);
            if (idx > -1) {
                this._bus[event].splice(idx, 1);
            }
        }
    }

    /**
     * event로 특정된 이벤트 호출 처리
     * @param event
     * @param args 
     */
    public emit(event: string, ...args: any[]): number {
        if (!this._bus[event]) return 0;
        let rtn_val: number = 0;
        for (let cnti: number = 0; cnti < this._bus[event].length; cnti++) {
            try {
                this._bus[event][cnti](...args);
                rtn_val++;
            }
            catch (e) {}
        }
        return rtn_val;
    }

    /**
     * Hacci 객체 삭제
     */
    public destroy() {
        //
        this.clearEventListeners();
        // initialize
        delete this._refs;
        this._refs = {};
        //
        delete this._txts_mstr;
        this._txts_mstr = '';
        //
        delete this._traces.fors;
        this._traces.fors = [];
        //
        delete this._traces.txts;
        this._traces.txts = [];
        //
        delete this._traces.elements;
        this._traces.elements = [];
        //
        this._template && this.el.parentElement.removeChild(this.el);
        this._template = null;
        //
        delete this._el;
        this._el = null;
        //
        this._on && this._on.destroyed && this._on.destroyed();
        //
        delete this._on;
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

    /**
     * 대상 Element에 대해 Hacci 기능 사용을 위한 처리를 진행합니다. mount 후에 mounted 이벤트가 발생합니다.
     * @param el 생성자에서 선언하지 않은 경우 한정하여 사용
     */
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
export default Hacci;
