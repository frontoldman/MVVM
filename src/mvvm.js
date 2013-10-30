(function(undefined){
	var url_prefix = '../lib/dom/';
	define([url_prefix+'data/data',
		url_prefix+'effect/effect',
		url_prefix+'event/events',
		url_prefix+'event/domReady',
		url_prefix+'sizzle/sizzle',
		url_prefix+'style/style',
		'../lib/utils/utils'],function(data,animate,events,domReady,sizzle,style,utils){
		
		//扩展方法
		//from https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Global_Objects/Function/bind
		if (!Function.prototype.bind) {
		  Function.prototype.bind = function (oThis) {
			if (typeof this !== "function") {
			  // closest thing possible to the ECMAScript 5 internal IsCallable function
			  throw new TypeError("Function.prototype.bind - what is trying to be bound is not callable");
			}

			var aArgs = Array.prototype.slice.call(arguments, 1), 
				fToBind = this, 
				fNOP = function () {},
				fBound = function () {
				  return fToBind.apply(this instanceof fNOP && oThis
										 ? this
										 : oThis,
									   aArgs.concat(Array.prototype.slice.call(arguments)));
				};

			fNOP.prototype = this.prototype;
			fBound.prototype = new fNOP();

			return fBound;
		  };
		}

		//from https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Global_Objects/Array/forEach
		if (!Array.prototype.forEach) {
		    Array.prototype.forEach = function (fn, scope) {
		        'use strict';
		        var i, len;
		        for (i = 0, len = this.length; i < len; ++i) {
		            if (i in this) {
		                fn.call(scope, this[i], i, this);
		            }
		        }
		    };
		}

		//################################################
		var mvvm = {}
		//全局配置
		mvvm.trigger = 'data-bind';

		var dataCache = {};

		'css visible attr text html style'.split(' ').forEach(function(val,key){
			dataCache[val] = 'mvvm-' + val;
		})

		var observableFunctionName = 'mvvmQQ529130510';
		// For details, see http://stackoverflow.com/questions/14119988/return-this-0-evalthis/14120023#14120023
		var window = this || (0,eval)('this'),
		document = window.document;

		//一个简单的观察者
		//For details, see http://www.cnblogs.com/tomxu/archive/2012/03/02/2355128.html
		var pubsub = {};
		(function (q) {

		    var topics = {}, // 回调函数存放的数组
		        subUid = -1;
		    // 发布方法
		    q.publish = function (topic, args) {

		        if (!topics[topic]) {
		            return false;
		        }

		        setTimeout(function () {
		            var subscribers = topics[topic],
		                len = subscribers ? subscribers.length : 0;

		            while (len--) {
		            	//console.log(subscribers[len])
		                subscribers[len].func(args,topic);
		            }
		        }, 0);

		        return true;

		    };
		    //订阅方法
		    q.subscribe = function (topic, func) {

		        if (!topics[topic]) {
		            topics[topic] = [];
		        }

		        var token = (++subUid).toString();
		        topics[topic].push({
		            token: token,
		            func: func
		        });
		        return token;
		    };
		    //退订方法
		    q.unsubscribe = function (token) {
		        for (var m in topics) {
		            if (topics[m]) {
		                for (var i = 0, j = topics[m].length; i < j; i++) {
		                    if (topics[m][i].token === token) {
		                        topics[m].splice(i, 1);
		                        return token;
		                    }
		                }
		            }
		        }
		        return false;
		    };
		} (pubsub));
		/*
		vm:object 绑定对象
		rootNode:根节点
		 */
		mvvm.applyBindings = function(vm,rootNode){
			domReady(function(){
				if(!(rootNode && /1|9/i.test(rootNode.nodeType))){
					rootNode  = document.body || document.documentElement;
				}
				
				var domsAndAttrs = getTriggerDoms(rootNode);
				analysisBindRulers(vm,domsAndAttrs);
			})
		}

		//通过闭包保存dom和事件trigger,实现绑定
		
		mvvm.observable = function(val){
			var _currentDom = [],
				_random = [],
				_objectKey;
			function mvvmQQ529130510(newVal,currentDom,random,bindLast){
				if(currentDom){
					_currentDom.push(currentDom)
				}
				if(random){
					_random.push(random);
				}
				
				var i = bindLast ?  _random.length-1 : 0,//初始化绑定只绑定最后一个
					usedObj,
					observableVal ,
					valSet = newVal === undefined ? val : newVal;

				
				for(;i<_random.length;i++){
					usedObj = data(_currentDom[i],_random[i]);
					if(utils.getType(usedObj) === 'Object'){
						observableVal  = {};
						observableVal[usedObj['attr']] = valSet;
					}else{
						observableVal = valSet;
					}

					pubsub.publish(_random[i],[observableVal,_currentDom[i]]);
				}

				return observableVal;
			}
			mvvmQQ529130510.name = observableFunctionName;
			return mvvmQQ529130510
		}   
		

		//添加进观察者的入口
		//dom:操作的元素
		//attr:操作dom的某种属性
		//dataKey:操作dom的多个相同性质的属性时需区分的key值
		//observableFunc:观察者的回调
		//viewModelFunc:被观察对象属性的回调
		function pushPubSub(dom,attr,observableFunc,viewModelFunc,dataKey){
			var random = getRandom();
			pubsub.subscribe(random,observableFunc);
			//var attrCache = data(dom,dataCache[attr]);

			//console.log(dataKey)
			//设置当前观察者 是否监控一个对象
			if(dataKey){
				var _dataAttr = {};
				_dataAttr['attr'] = dataKey;
				data(dom, random , _dataAttr);
			}else{
				data(dom, random , attr);
			}
			
			return viewModelFunc(undefined,dom,random,true);
		}

		/*
		取得所有符合条件节点
		 */
		function getTriggerDoms(rootNode){
			//return sizzle('*['+ mvvm.trigger +']',rootNode)
			var domLocateds = rootNode.getElementsByTagName('*'),
				i = 0,
				len = domLocateds.length,
				domAttrName,
				dataBindDomLists = [],
				currentDom;
			for(;i<len;i++){
				currentDom = domLocateds[i];
				domAttrName = currentDom.getAttribute(mvvm.trigger);
				if(domAttrName == undefined){
					domAttrName = currentDom[mvvm.trigger];
				}
				
				if( domAttrName != undefined) {
					domAttrName = utils.trim(domAttrName);
					dataBindDomLists.push({
						dom:currentDom,
						attr:domAttrName
					});
				}
			}
			domLocateds = null;
			return dataBindDomLists;
		}
		
		
		var bindRoute = {
			text:routeTextFn,
			css:routeCssFn,
			html:routeHtmlFn,
			visible:routeVisibleFn,
			style:routeStyleFn,
			attr:routeAttrFn
		}
		
		
		
		
		//有史以来最伟大的正则表达式诞生了
		var mainBindPatternStr = '\\s*(?:([^,?:]+)\\s*:\\s*){1}?([^,]*\\{(?:.+:.+,?)*\\}|\\[[^\\]]*\\]|[^,]*\\?[^:]*:[^,]*|[^\\{:\\}\\[\\],]*)';
		var bindPattern;
		
		
		function analysisBindRulers(vm,domsAndAttrs){
			var i = 0,
				len = domsAndAttrs.length,
				currentDom,
				currentAttr,
				varStr,
				_fn,
				bindKey,
				vmValue,
				type,
				currentFn,
				random,
				attrsValueObject;

			for(;i<len;i++){
				currentDom = domsAndAttrs[i].dom;
				currentAttr = domsAndAttrs[i].attr;
			
				//varStr = convertVariableScope(vm);
				
				try{
					_fn = new Function('scope','var attrObj ;with( scope ){attrObj = {'+ currentAttr +'}};return attrObj;')
				}catch(e){
					throw 'Error expressions!';
				}
				
				attrsValueObject = _fn.bind(vm)(vm);
				//console.log(attrsValueObject)
				//console.log(vm)
				for(bindKey in attrsValueObject){
					vmValue = attrsValueObject[bindKey];
					type = utils.getType(vmValue);
					currentFn = bindRoute[bindKey] ? bindRoute[bindKey]
									: function(){};
					//console.log(type)
					switch(type){
						case 'Function':
							//console.log(vmValue.name)
							if(vmValue.name === observableFunctionName){
								pushPubSub(currentDom,bindKey,currentFn,vmValue)
							}
							break;
						default:
							currentFn([vmValue,currentDom]);
							break;
					}
				}	
			}
		}
		
		 


		//text绑定
		//ary:[text,dom]
		function routeTextFn(ary){
			setText(ary[1],ary[0]);
		}

		//css绑定
		//ary:[className,dom]
		function routeCssFn(ary){
			setClassName(ary[1],ary[0]);
		}

		//html绑定
		//ary:[html,dom]
		function routeHtmlFn(ary){
			var dom = ary[1],
				html = ary[0];
			dom.innerHTML = html;
		}

		//显示与隐藏
		function routeVisibleFn(ary){
			var dom = ary[1],
			visible = ary[0];
			var display = visible ? '':'none';
			dom.style.display = display;
		}

		//style
		function routeStyleFn(ary){
			//console.log(11)
			var dom = ary[1],
				styleObj = ary[0],
				attrKey,
				attrVal,
				attrObjType = utils.getType(styleObj),
				copyStyleObj = {};
			
			if(attrObjType === 'Object'){
				for(attrKey in styleObj){
					attrVal = styleObj[attrKey];
					if(utils.getType(attrVal) === 'Function'){
						if(attrVal.name === observableFunctionName){
							attrVal = pushPubSub(dom,'attr',routeStyleFn,attrVal,attrKey);
							utils.extend(copyStyleObj,attrVal);
						} 
					}else{
						copyStyleObj[attrKey] = styleObj[attrKey]
					}
				}
				//console.log(copyStyleObj)
				style.set(dom,copyStyleObj);
			}


			//var dom = ary[1],
			//styleObj = ary[0];

			//style.set(dom,styleObj);
		}

		//attr
		function routeAttrFn(ary){
			var dom = ary[1],
				attrObj = ary[0],
				attrKey,
				attrVal,
				attrObjType = utils.getType(attrObj) ;
			
			if(attrObjType === 'Object'){
				for(attrKey in attrObj){
					attrVal = attrObj[attrKey];
					if(utils.getType(attrVal) === 'Function'){
						if(attrVal.name === observableFunctionName){
							attrVal = pushPubSub(dom,'attr',routeAttrFn,attrVal,attrKey)
						}
					}
					//console.log(attrVal)
					dom.setAttribute(attrKey,attrVal);
				}
			}
		}
		//################################
		//常用方法
		function getRandom(){
			return Math.random();
		}

		


		//############################################################
		//dom操作的常用方法
		function setText(dom,text){

			if(dom.textContent){
				dom.textContent = text;
			}else if(dom.innerText){
				dom.innerText = text;
			}

		}
		
		function setClassName(dom,className){

			var mvvmCss = data(dom,dataCache.css),
				oldClassName = dom.className,
				newClassName;
			if(mvvmCss){
				newClassName = oldClassName.replace(mvvmCss,className)
			}else{
				newClassName = oldClassName ? oldClassName + ' ' + className : className;
			}
			dom.className = newClassName;
			data(dom,dataCache.css,className);
		}
		
		function removeClassName(dom,className){

		}

		function setAttr(){

		}

		//############################################################

		return mvvm;
	})
})()

