var url_prefix = '../lib/dom/';
define([url_prefix+'data/data',
	url_prefix+'effect/effect',
	url_prefix+'event/events',
	url_prefix+'event/domReady',
	url_prefix+'sizzle/sizzle',
	url_prefix+'style/style',
	'../lib/utils/utils'],function(data,animate,events,domReady,sizzle,style,utils){
	
	var mvvm = {}
	//全局配置
	mvvm.trigger = 'data-bind';

	var dataCache = {
		css:'mvvm-css',
		visible:'mvvm-visible'
	};
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
			_random = [];
		return function(newVal,currentDom,random,bindLast){
			if(currentDom){
				_currentDom.push(currentDom)
			}
			if(random){
				_random.push(random);
			}
			var i = bindLast ? _random.length-1:0,//初始化绑定只绑定最后一个
				observableVal = newVal === undefined ? val : newVal;
			for(var i = 0;i<_random.length;i++){
				pubsub.publish(_random[i],[observableVal,_currentDom[i]]);
			}
			return observableVal;
		}
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
						random = getRandom();
						pubsub.subscribe(random,currentFn);
						vmValue(undefined,currentDom,random,true);
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
		//console.log(visible)
		var display = visible ? '':'none';
		//console.log('display:'+ display)
		dom.style.display = display;
	}

	//style
	function routeStyleFn(ary){
		var dom = ary[1],
			styleObj = ary[0];

		style.set(dom,styleObj);
	}

	//attr
	function routeAttrFn(ary){
		var dom = ary[1],
			attrObj = ary[0],
			attrKey;

		if(utils.getType(attrObj) 	=== 'Object'){
			for(attrKey in attrObj){
				console.log(attrObj)
				dom.setAttribute(attrKey,attrObj[attrKey]);
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

	//############################################################
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
	
	
	
	return mvvm;
})