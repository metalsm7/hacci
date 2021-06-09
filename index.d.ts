interface HacciOption {
    id: string | null;
    el: Element | null;
    template: string | null;
    data: any;
    method: any;
    created: Function | null;
    mounted: Function | null;
    destroyed: Function | null;
}
declare class Hacci {
    static _instances: any;
    private _id;
    private _el;
    private _template;
    private _refs;
    private _traces;
    private _objs;
    private _on;
    private _event_listeners;
    private _toi_input;
    private _toi_check;
    private _toi_select;
    private _bus;
    static readonly instances: any;
    /**
     * 생성자
     * @param option
     */
    constructor(option?: HacciOption | null);
    /**
     * 초기화
     */
    private init;
    /**
     * HTML 변경된 경우 이를 반영시키기 위해 기존 자료 삭제 및 초기화 처리
     */
    refresh(): void;
    /**
     * model 정보 초기화
     */
    clearData(): void;
    private registEventListener;
    private clearEventListeners;
    /**
     * 대상 element의 change/input 등의 이벤트로 인한 변경시 연결된 model에 적용 처리
     * @param el
     */
    private modelTrigger;
    /**
     * hc:(change|event)에 지정된 method 호출 처리
     * @param option
     */
    private callMethod;
    /**
     * 숫자/영문대소문자 조합의 랜덤문자열 생성
     * @param length
     */
    private getRandomString;
    /**
     * 현재 객체의 id값 생성
     */
    private createInstanceId;
    /**
     * comment 등 tag_id 만들기 위한 id값 생성
     */
    private createTagId;
    /**
     * tag_id로 특정된 comment element 반환
     * @param parent
     * @param tag_id
     */
    private getCommentElement;
    /**
     * arrow function 여부 반환
     * @param func
     */
    private isArrowFunc;
    /**
     * arrow function 을 일반 function 으로 변경 처리.
     * (this 혼란 제거)
     * @param func
     */
    private fromArrowFunc;
    /**
     * radio/checkbox element에 대해 현재 checked된 값 반환
     * @param groups
     * @param return_as_array true인 경우 배열로, 아니면 단일값 반환. name 속성으로 묶인 경우 true 사용
     */
    private getCheckedValue;
    /**
     * select 하위 option element에 대해 현재 selected된 값 반환
     * @param groups
     * @param return_as_array true인 경우 배열로, 아니면 단일값 반환. multiple인 경우 true 사용
     */
    private getSelectedValue;
    /**
     * radio/checkbox element에 대해 지정된 값으로 checked 처리
     * @param groups
     * @param value
     */
    private setCheckedValue;
    /**
     * select 하위 option element에 대해 지정된 값으로 selected 처리
     * @param groups
     * @param value
     */
    private setSelectedValue;
    /**
     * model값 반환
     * @param val
     * @param init_parent
     * @param prefix
     */
    private getVal;
    /**
     * model 값 설정
     * @param target
     * @param val
     * @param init_parent
     */
    private setVal;
    /**
     * Array 값 수정이 발생한 경우 감지를 위한 이벤트 처리
     * @param prop
     * @param target
     */
    private arrayEventListener;
    private traceModel;
    /**
     * event로 특정된 이벤트에 대한 리스닝 처리 등록
     * @param event
     * @param callback
     */
    on(event: string, callback: Function): void;
    /**
     * event로 특정된 이벤트에 대한 리스닝 처리 삭제
     * @param event
     * @param callback null이면 event 전체 삭제 처리
     */
    off(event: string, callback?: Function): void;
    /**
     * event로 특정된 이벤트 호출 처리
     * @param event
     * @param args
     */
    emit(event: string, ...args: any[]): number;
    /**
     * Hacci 객체 삭제
     */
    destroy(): void;
    /**
     * 대상 Element에 대해 Hacci 기능 사용을 위한 처리를 진행합니다. mount 후에 mounted 이벤트가 발생합니다.
     * @param el 생성자에서 선언하지 않은 경우 한정하여 사용
     */
    mount(el: Element | null): Hacci;
    readonly el: Element | null;
    readonly refs: any;
}
export { Hacci };
