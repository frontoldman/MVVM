define(['.../utils/utils','../data/data'],function(utils,data){

	"use strict";

	var action = {
		addEvent : function(elem,type,handler){
			if(elem.addEventListener){
				elem.addEventListener(type,handler,false);
			}else{
				elem.attachEvent('on'+type,handler);
			}
		},
		delEvent : function(elem,type,handler){
			if(elem.removeEventListener){
				elem.removeEventListener( type, handler);
			}else{
				elem.detachEvent( 'on' + type, handler);
			}
		},
		// 修复IE浏览器支持常见的标准事件的API
		fixEvent : function( e ){
			// 支持DOM 2级标准事件的浏览器无需做修复
			if ( e.target ){
				return e;
			}
			var event = {}, name;
			event.target = e.srcElement || document;
			event.preventDefault = function(){
				e.returnValue = false;
			};

			event.stopPropagation = function(){
				e.cancelBubble = true;
			};
			// IE6/7/8在原生的win.event中直接写入自定义属性
			// 会导致内存泄漏，所以采用复制的方式
			for( name in e ){
				event[name] = e[name];
			}
			return event;
		}
	}







	var events = {

		/**
			elem:原生dom
			eventType:事件类型
			fn:回调
		**/
		on:function(elem,eventType,handler){
			var dataVal = eventType+'Events';
			
			var handlers = data(elem,dataVal);
			handlers = handlers ? handlers :[];
			handlers.push(handler);
			data(elem,dataVal,handlers)

			if(handlers.length === 1){

				var eventHandler = function(e){
					
					var event = action.fixEvent(e || window.event);
					
					handlers = data(elem,dataVal);

					if(!handlers){
						return;
					}
					
					for(var i=0;i<handlers.length;i++){
						if(utils.getType(handlers[i]) === 'Function'){
							handlers[i](event);
						}
					}
				}

				action.addEvent(elem,eventType,eventHandler);
				data(elem,eventType,eventHandler);
			}

		},
		off:function(elem,eventType,handler){
			data.del(elem,eventType+'Events',handler);
			if(!handler){
				var evnetHandler = data(elem,eventType);
				//console.log(evnetHandler);
				action.delEvent(elem,eventType,evnetHandler);
			}
			
		}
	}

	

	return events
})