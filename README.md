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
    el                      Target HTMLElement
    template                el로 지정된 Element에 등록할 template
                            사용시 현재 상태의 하위 Element는 template로 대체됩니다.
    data                    인스턴스 내부에서 사용할 data 정의
    method                  인스턴스 내부에서 사용할 function 정의
                            정의된 function 내부의 this는 현재 인스턴스를 바라봅니다.
                            (Array Function 포함)
    created                 인스턴스 생성시 호출되는 function 정의
    mounted                 인스턴스 생성 후 attribute 들에 대한 설정 완료 후 호출되는 function 정의
                            mounted 이후에 정상적으로 모든 기능의 사용이 가능합니다.
    destroyed               .destroy() 호출 또는 el로 지정된 Element 가 제거될때 호출되는 function 정의
```
### Methods
```
    mount                   인스턴스 생성 후 .mount() 호출이 되어야 정상적으로 동작합니다.
    destroy                 인스턴스 제거
                            template가 사용된 경우 해당 template는 제거됩니다.
```
### Attributes
```
    hc:ref                  해당 Element의 reference 등록
    hc:model                해당 Element의 model 지정
                                - INPUT[type=radio]
                                - INPUT[type=checkbox]
                                - INPUT[type=text]
                                - TEXTAREA[type=textarea]
                                - SELECT[type=select-one]
                                - SELECT[type=select-multiple]
    hc:if                   해당 Element의 model값이 true인 경우만 해당 Element를 사용함
    hc:neither              해당 Element의 model값이 false인 경우만 해당 Element를 사용함
    hc:disabled             해당 Element의 disabled 상태 지정
    hc:html                 innerHTML 처리
    hc:text                 innerText 처리
    hc:change               해당 Element의 model값이 변경되는 경우 호출
                            적용 대상:
                                - INPUT[type=radio]
                                - INPUT[type=checkbox]
                                - SELECT[type=select-one]
                                - SELECT[type=select-multiple]
    hc:input                해당 Element의 model값이 변경되는 경우 호출
                            적용 대상:
                                - INPUT[type=text]
                                - TEXTAREA[type=textarea]
    hc:click                click Event 발생되는 경우 호출
    hc:scroll               scroll Event 발생되는 경우 호출
    hc:scroll.hit.top       scroll Event 발생 중 스크롤이 맨위에 도달하는 경우 호출
    hc:scroll.hit.bottom    scroll Event 발생 중 스크롤이 맨아래에 도달하는 경우 호출
```
### Interpolation
```
    {{}}                    괄호안의 식에 대한 결과를 문자열로 대체
```
License
===
[MIT](/LICENSE)