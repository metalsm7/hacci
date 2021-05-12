Hacci
===
Hacci[hɑːʃiː] is a simple and tiny JavaScript helper for web frontend work.

"If you're in a situation where you have to work with vanilla js or jquery..."

DEMO
---
[DEMO](https://metalsm7.github.io/hacci/demo) [https://metalsm7.github.io/hacci/demo]

Install
---
NPM 사용하는 경우
```bash
$ npm install hacci
```
html에서 등록하는 경우
```js
<script type="text/javascript" src="hacci.min.js"></script>
```

How to use
---
### Constructor option
```
    el              Target HTMLElement
    template        el로 지정된 Element에 등록할 template
                    사용시 현재 상태의 하위 Element는 template로 대체됩니다.
    data            인스턴스 내부에서 사용할 data 정의
    method          인스턴스 내부에서 사용할 function 정의
                    정의된 function 내부의 this는 현재 인스턴스를 바라봅니다.
                    (Array Function 포함)
    created         인스턴스 생성시 호출되는 function 정의
    mounted         인스턴스 생성 후 attribute 들에 대한 설정 완료 후 호출되는 function 정의
                    mounted 이후에 정상적으로 모든 기능의 사용이 가능합니다.
    destroyed       .destroy() 호출 또는 el로 지정된 Element 가 제거될때 호출되는 function 정의
```
### Methods
```
    mount           인스턴스 생성 후 .mount() 호출이 되어야 정상적으로 동작합니다.
    destroy         인스턴스 제거
                    template가 사용된 경우 해당 template는 제거됩니다.
```
### Attributes
```
    hc:ref          해당 Element의 reference 등록
    hc:click        click Event 발생되는 경우 호출
    hc:input        폼값이 변경되는 경우 호출
                    적용 대상:
                        - INPUT[type=radio]
                        - INPUT[type=checkbox]
                        - INPUT[type=text]
                        - TEXTAREA[type=textarea]
                        - SELECT[type=select-one]
                        - SELECT[type=select-multiple]
    hc:value        mount시 해당 Element의 value 초기값 설정
    hc:text         mount시 해당 Element의 innerText 초기값 설정
    hc:html         mount시 해당 Element의 innerHTML 초기값 설정
    hc:checked      mount시 해당 Element의 checked 상태 초기값 설정
```
### Usage
- hc:ref
    ```html
    <div id="app">
        <input hc:ref="check_light" type="checkbox" name="check" value="light">
    </div>

    <script>
    import { Hacci } from 'hacci';

    var hc = new Hacci({
        el: document.querySelector('#app'),
        mounted: function() {
            // this.refs[name] 형식으로 hc:ref로 선언한 객체 접근
            // hc.refs.check_light 와 같은 방식으로 인스턴스 외부에서도 접근 가능
            this.refs.check_light.checked = true;
        }
    }).mount();
    </script>
    ```
    아래와 같이 template를 정의하여 사용할 수 있습니다.
    
    ```html
    <div id="app"></div>

    <script>
    import { Hacci } from 'hacci';

    var hc = new Hacci({
        el: document.querySelector('#app'),
        template: '<input hc:ref="check_light" type="checkbox" name="check" value="light">',
        mounted: function() {
            this.refs.check_light.checked = true;
        }
    }).mount();
    </script>
    ```
- hc:click
    ```html
    <div id="app">
        <button hc:click="onClickEmpty">click.empty</button>
        <button hc:click="onClickEmpty()">click.args</button>
        <button hc:click="onClickArgs(val)">click.args</button>
        <button hc:click="onClickArgs('temp value')">click.args</button>
        <button hc:click="onClickArgsWithEvent(val, event)">click.args /w event</button>
    </div>

    <script>
    import { Hacci } from 'hacci';

    var hc = new Hacci({
        data: {
            val: 'data value',
        },
        el: document.querySelector('#app'),
        onClickEmpty: function(_event) {
            // 괄호 미사용: 기본적으로 click에 대한 Event를 첫번째 인수로 받음
            // 괄호 사용: Event 포함 아무 인수값 전달 받지 않음
        },
        onClickArgs: function(val = null) {
            // (val): this.data.val 값('data value') 사용
            // ('temp value'): 전달된 'temp value' 사용
        },
        onClickArgsWithEvent: function(val, event = null) {
            // 전달된 인수 중 event 로 지정된 경우 click에 대한 Event를 전달
        },
    }).mount();
    </script>
    ```
- hc:input
    ```html
    <div id="app">
        <input hc:input="onInput" type="radio" name="radio" value="light">
        <input hc:input="onInput" type="radio" name="radio" value="dark">
        <input hc:input="onInput" type="checkbox" name="check" value="gray">
        <select hc:input="onInput">
            <option value="first">first</option>
            <option value="second">second</option>
        </select>
        <input hc:ref="text" hc:input="onInput" type="text" value="" />
        <textarea hc:input="onInput"></textarea>
    </div>

    <script>
    import { Hacci } from 'hacci';

    var hc = new Hacci({
        el: document.querySelector('#app'),
        method: {
            onInput: function(_event) {
                // input[type=radio], input[type=checkbox]의 경우 checked 가 변경되는 경우 호출
                // input[type=text], textarea[type=textarea], select[type=select-one], select[type=select-multiple]의 경우 value가 변경되는 경우 호출
            },
        }
        mounted: function() {
            // js로 value 또는 checked 값을 변경하는 경우에도 method.onInput 호출
            this.refs.text.value = 'Hello world!';
        }
    }).mount();
    </script>
    ```
- hc:value
    ```html
    <div id="app">
        <input hc:value="val" type="text" value="" /><!-- value를 data.val 값으로 초기 설정 -->
    </div>

    <script>
    import { Hacci } from 'hacci';

    var hc = new Hacci({
        el: document.querySelector('#app'),
        data: {
            val: 'Hello world!'
        }
    }).mount();
    </script>
    ```
- hc:text
    ```html
    <div id="app">
        <p hc:text="val"></p><!-- innerText = data.val 과 같이 동작 -->
    </div>

    <script>
    import { Hacci } from 'hacci';

    var hc = new Hacci({
        el: document.querySelector('#app'),
        data: {
            val: 'Hello world!'
        }
    }).mount();
    </script>
    ```
- hc:html
    ```html
    <div id="app">
        <p hc:html="val"></p><!-- innerHTML = data.val 과 같이 동작 -->
    </div>

    <script>
    import { Hacci } from 'hacci';

    var hc = new Hacci({
        el: document.querySelector('#app'),
        data: {
            val: '<p style="color: red; font-weight: bold;">Hello world!</p>'
        }
    }).mount();
    </script>
    ```
- hc:checked
    ```html
    <div id="app">
        <input hc:checked="val" type="checkbox" name="check" value="light"><!-- data.val 가 true인 경우 checked 처리 -->
    </div>

    <script>
    import { Hacci } from 'hacci';

    var hc = new Hacci({
        el: document.querySelector('#app'),
        data: {
            val: true
        }
    }).mount();
    </script>
    ```
### Demo Code
```html
<div id="app">
    <input hc:ref="radio_light" hc:input="onRadio" type="radio" name="radio" value="light">
    <input hc:ref="radio_dark" hc:input="onRadio" type="radio" name="radio" value="dark">
    <button hc:click="onRadioCheck('light', event)">light check</button>
    <button hc:click="onRadioCheck('dark')">dark check</button>
    <div hc:ref="resRadio"></div>
    <hr />
    <input hc:ref="check_light" hc:input="onCheckbox" type="checkbox" name="check" value="light">
    <input hc:ref="check_dark" hc:checked="true" hc:input="onCheckbox" type="checkbox" name="check" value="dark">
    <button hc:click="onCheckboxToggle('light')">light toggle</button>
    <button hc:click="onCheckboxToggle('dark')">dark toggle</button>
    <div hc:ref="resCheckbox"></div>
    <hr />
    <select hc:ref="select" hc:value="sel" hc:input="onSelect">
        <option value="first">first</option>
        <option value="second">second</option>
        <option value="third">third</option>
    </select>
    <button hc:click="onSelectChange('first')">first select</button>
    <button hc:click="onSelectChange('second')">second select</button>
    <button hc:click="onSelectChange('third')">third select</button>
    <div hc:ref="resSelect"></div>
    <hr />
    <input hc:ref="text" hc:value="input" hc:input="onText" type="text" value="" />
    <button hc:click="onTextClear()">clear</button>
    <div hc:ref="resText"></div>
    <hr />
    <textarea hc:ref="textarea" hc:value="textarea" hc:input="onTextarea"></textarea>
    <button hc:click="onTextareaClear()">clear</button>
    <div hc:ref="resTextarea"></div>
    <hr />
    <button hc:click="onDestroy()">Destroy</button>
    <div hc:ref="resButton"></div>
    <hr />
    <p hc:ref="resButton" hc:text="initial_text"></p>
    <p hc:ref="label" hc:html="initial_html"></p>
</div>

<script tyle="text/javascript">
    function init() {
        var call = function(val) {
            console.log('call - val:' + val);
        };
        window.hc = new Hacci({
            el: document.querySelector('#app'),
            // template: '',
            data: {
                input: 'initial input string',
                textarea: 'initial textarea string',
                sel: 'second',
                initial_text: 'initial text',
                initial_html: '<p style="color: red; font-weight: bold;">initial html</p>',
                callback: call,
            },
            method: {
                onRadio: function(event) {
                    this.refs.resRadio.innerText = 'onRadio - value:' + event.target.value + ' / checked:' + event.target.checked;
                },
                onRadioCheck: function(theme, event = null) {
                    this.refs['radio_' + theme].checked = true;
                },
                onCheckbox: function(event) {
                    this.refs.resCheckbox.innerText = 'onCheckbox - value:' + event.target.value + ' / checked:' + event.target.checked;
                },
                onCheckboxToggle: function(theme) {
                    this.refs['check_' + theme].checked = !this.refs['check_' + theme].checked;
                },
                onSelect: function(event) {
                    this.refs.resSelect.innerText = 'onSelect - value:' + event.target.value;
                },
                onSelectChange: function(value) {
                    this.refs.select.value = value;
                },
                onText: function(event) {
                    this.refs.resText.innerText = 'onText - value:' + event.target.value;
                },
                onTextClear: function(event) {
                    this.refs.text.value = '';
                    this.callback('text cleared!');
                },
                onTextarea: function(event) {
                    this.refs.resTextarea.innerText = 'onTextarea - value:' + event.target.value;
                },
                onTextareaClear: function() {
                    this.refs.textarea.value = '';
                    this.callback('textarea cleared!');
                },
                onDestroy: (event) => {
                    window.hc.destroy();
                },
            },
            created: function() { console.log('created'); },
            mounted: function() { console.log('mounted'); },
            destroyed: function() { console.log('destroyed'); },
        }).mount();
    }
    //
    setTimeout(init, 1000);
</script>
```
License
===
[MIT](/LICENSE)