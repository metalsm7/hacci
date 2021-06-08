Hacci
===
Hacci[hɑʃiː] is a simple and tiny JavaScript helper for web frontend work.

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
    hc:model        해당 Element의 model 지정
                        - INPUT[type=radio]
                        - INPUT[type=checkbox]
                        - INPUT[type=text]
                        - TEXTAREA[type=textarea]
                        - SELECT[type=select-one]
                        - SELECT[type=select-multiple]
    hc:change       해당 Element의 model값이 변경되는 경우 호출
                    적용 대상:
                        - INPUT[type=radio]
                        - INPUT[type=checkbox]
                        - SELECT[type=select-one]
                        - SELECT[type=select-multiple]
    hc:input        해당 Element의 model값이 변경되는 경우 호출
                    적용 대상:
                        - INPUT[type=text]
                        - TEXTAREA[type=textarea]
    hc:click        click Event 발생되는 경우 호출
    hc:if           해당 Element의 model값이 true인 경우만 해당 Element를 사용함
    hc:neither      해당 Element의 model값이 false인 경우만 해당 Element를 사용함
```
### Usage
- hc:ref
    ```html
    <div id="app">
        <label hc:ref="label"></label>
    </div>

    <script>
    import { Hacci } from 'hacci';

    var hc = new Hacci({
        el: document.querySelector('#app'),
        mounted: function() {
            // this.refs[name] 형식으로 hc:ref로 선언한 객체 접근
            // hc.refs.label 와 같은 방식으로 인스턴스 외부에서도 접근 가능
            this.refs.label.innerText = 'Hello, World!';
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
        template: '<label hc:ref="label"></label>',
        mounted: function() {
            this.refs.label.innerText = 'Hello, World!';
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
        <button hc:click="onClickArgsWithEvent(val, _event)">click.args /w event</button>
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
        onClickArgsWithEvent: function(val, _event = null) {
            // 전달된 인수 중 _event 로 지정된 경우 click에 대한 Event를 전달
        },
    }).mount();
    </script>
    ```
- hc:input
    ```html
    <div id="app">
        <input hc:model="val" hc:change="onInput" type="radio" name="radio" value="light">
        <input hc:model="val" hc:change="onInput" type="radio" name="radio" value="dark">
        <input hc:model="val" hc:change="onInput" type="checkbox" name="check" value="gray">
        <select hc:model="val" hc:change="onInput">
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
        data: {
            val: 'light',
            text: 'Hello world!'
        },
        method: {
            onInput: function(_event) {
                // input[type=radio], input[type=checkbox]의 경우 checked 가 변경되는 경우 호출
                // input[type=text], textarea[type=textarea], select[type=select-one], select[type=select-multiple]의 경우 value가 변경되는 경우 호출
            },
        }
        mounted: function() {
            // model값을 변경하는 경우에도 method.onInput 호출
            this.text = 'Hello world!!!';
        }
    }).mount();
    </script>
    ```
License
===
[MIT](/LICENSE)