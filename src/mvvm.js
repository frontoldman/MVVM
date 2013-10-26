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
			var  i = bindLast ? _random.length-1:0;//初始化绑定只绑定最后一个
			for(var i = 0;i<_random.length;i++){
				pubsub.publish(_random[i],[newVal || val,_currentDom[i]]);
			}
			
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
				dataBindDomLists.push({
					dom:currentDom,
					attr:domAttrName
				});
			}
		}
		domLocateds = null;
		return dataBindDomLists;
	}

	/*
	分析绑定规则
	 */
	var bindPattern = /^\s*(text|visible|html|css|style|attr)\s*:\s*(.+)\s*$/;
	var bindRoute = {
		text:routeTextFn
	}
	/*
	domsAndAttrs:[]
	 */
	function analysisBindRulers(vm,domsAndAttrs){
		var i = 0,
			len = domsAndAttrs.length,
			execAry,
			currentDom,
			currentAttr,
			cuurentFn;
		if(len === i) return;
		for(;i<len;i++){
			currentDom = domsAndAttrs[i].dom;
			currentAttr = domsAndAttrs[i].attr;
			execAry = bindPattern.exec(currentAttr);
			if(execAry && execAry.length>=3){
				//分发出去
				//console.log(execAry)
				var text = execAry[2];
				text = utils.trim(text);
				var type = utils.getType(vm[text]);
				var value;
				var random = getRandom();
				cuurentFn = bindRoute[execAry[1]];
				
				if(type === 'String'){
					value = vm[text];
					cuurentFn([value,currentDom]);
				}else if(type === 'Function'){
					pubsub.subscribe(random,cuurentFn);
					vm[text](undefined,currentDom,random,true);
				}
				
			}
		}
	}


	//text绑定
	//ary:[dom,text]
	function routeTextFn(ary){
		setText(ary[1],ary[0]);
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

	return mvvm;
})