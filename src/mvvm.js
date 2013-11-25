(function(undefined){
	var url_prefix = '../lib/dom/';
	define([url_prefix+'data/data',
		url_prefix+'effect/effect',
		url_prefix+'event/events',
		url_prefix+'event/domReady',
		url_prefix+'sizzle/sizzle',
		url_prefix+'style/style',
		'../lib/utils/utils'],function(data,animate,events,domReady,sizzle,style,utils){

        // For details, see http://stackoverflow.com/questions/14119988/return-this-0-evalthis/14120023#14120023
        var window = this || (0,eval)('this'),
            document = window.document;


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

		        //from http://www.cnblogs.com/rubylouvre/archive/2011/05/30/1583523.html
		        if(!!window.find){
		            HTMLElement.prototype.contains = function(B){
		                return this.compareDocumentPosition(B) - 19 > 0
		            }
		        }

		        //https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Global_Objects/Array/indexOf
		        if (!Array.prototype.indexOf) {
			  Array.prototype.indexOf = function (searchElement , fromIndex) {
			    var i,
			        pivot = (fromIndex) ? fromIndex : 0,
			        length;

			    if (!this) {
			      throw new TypeError();
			    }

			    length = this.length;

			    if (length === 0 || pivot >= length) {
			      return -1;
			    }

			    if (pivot < 0) {
			      pivot = length - Math.abs(pivot);
			    }

			    for (i = pivot; i < length; i++) {
			      if (this[i] === searchElement) {
			        return i;
			      }
			    }
			    return -1;
			  };
			}
		        
		//################################################
		var mvvm = {}
		//全局配置
		mvvm.trigger = 'data-bind';

		var dataCache = {};

		'css visible attr text html style ifAndIfnot foreach value checked options'.split(' ').forEach(function(val,key){
			dataCache[val] = 'mvvm-' + val;
		})

		var observableFunctionName = 'mvvmQQ529130510';
		var observableArrayName = 'QQ529130510ObservableArray';
		var computedFunctionName = 'mvvmQQ529130510Computed';

		var computed_relay = {};	//computed依赖列表
		var startComputed = false;
		var tempIds = {};	//临时computed列表，每次清空
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
				_objectKey,
				initFlag = false,
				timeOut = 'hasStart';	//绑定数据可以延迟执行
			function mvvmQQ529130510(newVal,currentDom,random,bindLast,vm,attrsValueObject){
				
					if(!arguments.length && !startComputed){
						//onsole.log("没有参数：" + val)
						return val;
					}

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

					val = valSet;
		
					if(startComputed){

						tempIds[_random[i]] = true;

						return val;
					}
					for(;i<_random.length;i++){
						usedObj = data(_currentDom[i],_random[i]);
						if(utils.getType(usedObj) === 'Object'){
							observableVal  = {};
							observableVal[usedObj['attr']] = valSet;
						}else{
							observableVal = valSet;
						}
						
						pubsub.publish(_random[i],[observableVal,_currentDom[i],vm,attrsValueObject]);


					}

				

				var theObjRelayOn = computed_relay[_random[0]];
				if(theObjRelayOn){

					theObjRelayOn.forEach(function(theObjRelayOnObj){
						pubsub.publish(theObjRelayOnObj.random,
							[theObjRelayOnObj.val(),
							theObjRelayOnObj.dom,
							theObjRelayOnObj.vm,
							theObjRelayOnObj.attrsValueObject]);
					})
					
				}		

				return val;
			}

			mvvmQQ529130510.name = observableFunctionName;
			return mvvmQQ529130510
		}   
		
		//数组监控
		mvvm.observableArray = function(initArray){
			var changedArray = initArray  ?  initArray : [],
				_random = [],
				_currentDom = [],
				i,
				publish = function(callback){
					for( i = 0;i<_currentDom.length;i++){
						callback(_currentDom[i]);
					}
				};

			function QQ529130510ObservableArray(domObj){
				if(!domObj){
					return changedArray;
				}

				var random = getRandom(),
						self = this;

					_currentDom.push(domObj);
					_random.push(random);
					return changedArray;
			}

			QQ529130510ObservableArray.push = function(){
				var i = 0,
					len = arguments.length,
					val;
				for(;i<len;i++){
					val = arguments[i];
					publish(function(currentDom){
						var fragment = fillContext(currentDom.inner,val,changedArray.length,currentDom.context,null,currentDom.wapper);
						currentDom.wapper.appendChild(fragment);
						//console.log(data(currentDom.wapper,dataCache['foreach']));
					})
					changedArray.push(val);
				}
				return changedArray.length;
			}

			QQ529130510ObservableArray.unshift = function(){
				var i = 0,
					len = arguments.length,
					val;
				for(;i<len;i++){
					val = arguments[i];
					publish(function(currentDom){
						var fragment = fillContext(currentDom.inner,val,len-i-1,currentDom.context,null,currentDom.wapper);
						currentDom.wapper.insertBefore(fragment,currentDom.wapper.firstChild);
					})
					changedArray.push(val);
				}
				return changedArray.length;
			}

			QQ529130510ObservableArray.pop = function(){
				publish(function(currentDom){
					var childNodesCache = data(currentDom.wapper,dataCache['foreach']);
					var lastChildNodes = childNodesCache.pop();
					if(utils.getType(lastChildNodes) == 'Array'){
						lastChildNodes.forEach(function(val){
							currentDom.wapper.removeChild(val);
						})
					}
				})
				return changedArray.pop()
			}

			QQ529130510ObservableArray.shift = function(){
				publish(function(currentDom){
					var childNodesCache = data(currentDom.wapper,dataCache['foreach']);
					var lastChildNodes = childNodesCache.shift();
					if(utils.getType(lastChildNodes) == 'Array'){
						lastChildNodes.forEach(function(val){
							currentDom.wapper.removeChild(val);
						})
					}
				})
				return changedArray.shift()
			}

			QQ529130510ObservableArray.splice = function(){
				var index = arguments[0]*1,
					howmany = arguments[1]*1,
					len = arguments.length,
					i,
					args = arguments ,
					spliceResult ;

				howmany = howmany<changedArray.length ?  howmany : changedArray.length;
				index = index<0 ? changedArray.length - 1 - howmany : index ;

				
				publish(function(currentDom){
					var childNodesCache = data(currentDom.wapper,dataCache['foreach']);
		
					var spliceChildNodes = childNodesCache.splice(index,howmany);
	
					if(utils.getType(spliceChildNodes) == 'Array'){
						spliceChildNodes.forEach(function(foreachVal){
							foreachVal.forEach(function(val){
								currentDom.wapper.removeChild(val);
							})
						})
					};

					var flagNum = index;
					var flag;
					var fragment;

					for(var x = 2;x<args.length;x++){

						flag = childNodesCache[flagNum][0];
						fragment = fillContext(currentDom.inner,args[x],flagNum,currentDom.context,null,currentDom.wapper,'splice');
			
						currentDom.wapper.insertBefore(fragment.fragment,flag);
						childNodesCache.splice(flagNum,0,fragment.childNodes);
						flagNum++;

					};
				})
				spliceResult = Array.prototype.splice.apply(changedArray,args);

				return spliceResult;
			}

			QQ529130510ObservableArray.reverse = function(){
				changedArray.reverse();
				publish(function(currentDom){
					data(currentDom.wapper,dataCache['foreach'],[]);

					var fragment = document.createDocumentFragment();
					changedArray.forEach(function(objVal,objKey){
						fillContext(currentDom.inner,objVal,objKey,currentDom.context,fragment,currentDom.wapper);
					})
					currentDom.wapper.innerHTML = '';
					currentDom.wapper.appendChild(fragment);

				})
				return changedArray;
			}

			QQ529130510ObservableArray.sort = function(fn){
				changedArray.sort(fn);
				publish(function(currentDom){
					data(currentDom.wapper,dataCache['foreach'],[]);

					var fragment = document.createDocumentFragment();
					changedArray.forEach(function(objVal,objKey){
						fillContext(currentDom.inner,objVal,objKey,currentDom.context,fragment,currentDom.wapper);
					})
					currentDom.wapper.innerHTML = '';
					currentDom.wapper.appendChild(fragment);
					//var fragment = document.createDocumentFragment();


				})
				return changedArray;
			}

			QQ529130510ObservableArray.indexOf = function(searchElement , fromIndex){
				return changedArray.indexOf(searchElement,fromIndex);
			}

			QQ529130510ObservableArray.slice = function(start,end){
				return changedArray.slice(start,end);
			}

			QQ529130510ObservableArray.remove = function(searchElement){
				var index = changedArray.indexOf(searchElement);
					if(index != -1){
						return this.splice(index,1);
					}
					return null;
			}

			QQ529130510ObservableArray.removeAll = function(){
				return this.splice(0,changedArray.length);
			}

			QQ529130510ObservableArray.name = observableArrayName;

			return QQ529130510ObservableArray;

		}

		//依赖跟踪
		//knockout引入第二个参数的原因是this实在是没有办法指向vm
		mvvm.computed = function(){
			var FnOrObj = arguments[0],
				owner = arguments[1],
				type = utils.getType(FnOrObj);

			var returnedVal,result;
			//console.log(owner)
			if(type === 'Function'){
				returnedVal = FnOrObj.bind(owner);
			}

			function mvvmQQ529130510Computed(newVal,dom,random,bindLast,vm,attrsValueObject){

				
				//console.log('computed--before')
				//需要一个异步去取得依赖列表
				setTimeout(function(){
					//console.log('computed--start')

					startComputed = true;
					result = returnedVal();
					pubsub.publish(random,[result,dom,vm,attrsValueObject]);
					//console.log('computed--end')
					startComputed = false;

					for(var id in tempIds){
						var relayOns = computed_relay[id];
						
						relayOns = relayOns ? relayOns : [];
						computed_relay[id] = relayOns;
						//console.log(relayOns)
						relayOns.push({
							random:random,
							val:returnedVal,
							dom:dom,
							vm:vm,
							attrsValueObject:attrsValueObject
						})
						
					}
					//console.log(computed_relay)
					//console.log(tempIds)
					tempIds = {};
				})
				
				return result;

			}

			mvvmQQ529130510Computed.name = computedFunctionName;
			return mvvmQQ529130510Computed;
		}


		//添加进观察者的入口
		//dom:操作的元素
		//attr:操作dom的某种属性
		//dataKey:操作dom的多个相同性质的属性时需区分的key值
		//observableFunc:观察者的回调
		//viewModelFunc:被观察对象属性的回调
		//vm:绑定的viewModel
		//attrsValueObject:当前dom的绑定attr字符串属性
		function pushPubSub(dom,attr,observableFunc,viewModelFunc,dataKey,vm,attrsValueObject){
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
			//console.log(observableFunc)
			return viewModelFunc(undefined,dom,random,true,vm,attrsValueObject);
		}

		/*
		取得所有符合条件节点
		 */
		var controlFlowElementsPattern = /with|foreach/;
		function getTriggerDoms(rootNode,elementsList){
		    var children =  rootNode.children,
		        index = 0,
		        len = children.length,
		        attrVal,
		        currentDom,
		        dataBindElements = utils.getType(elementsList) === 'Array' ? elementsList : [];
		    for(;index<len;index++){
		        currentDom = children[index];
		        
		        attrVal = getAttribute(currentDom)
		        if(attrVal){
		            attrVal = utils.trim(attrVal);
		            dataBindElements.push({
				dom:currentDom,
				attr:attrVal
		            });
		        }
		        if(!controlFlowElementsPattern.test(attrVal)){
		            getTriggerDoms(currentDom,dataBindElements);
		        }
		    }
		    return dataBindElements;
		}

		
		
		var bindRoute = {
			'text':routeTextFn,
			'css':routeCssFn,
			'html':routeHtmlFn,
			'visible':routeVisibleFn,
			'style':routeStyleFn,
			'attr':routeAttrFn,
			'foreach':routeForeachFn,
			'if':routeIfFn,
			'ifnot':routeIfnotFn,
			'with':routeWithFn,
			'click':routeClickFn,
			'event':routeEventFn,
			'value':routeValueFn,
			'valueUpdate':valueUpdate,
			'enable':routeEnableFn,
			'disbaled':routeDisableFn,
			'checked':routeCheckedFn,
			'options':routeOptionsFn
		}
		
		
		
		
		//有史以来最伟大的正则表达式诞生了
		var mainBindPatternStr = '\\s*(?:([^,?:]+)\\s*:\\s*){1}?([^,]*\\{(?:.+:.+,?)*\\}|\\[[^\\]]*\\]|[^,]*\\?[^:]*:[^,]*|[^\\{:\\}\\[\\],]*)';
		
		
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
				
				attrsValueObject = getAttrsValueObject(currentAttr,vm);
				//console.log(attrsValueObject)
				//console.log(vm)
				for(bindKey in attrsValueObject){
					vmValue = attrsValueObject[bindKey];
					type = utils.getType(vmValue);
					currentFn = bindRoute[bindKey] ? bindRoute[bindKey]
									: function(){};
	
					if(type === 'Function' && vmValue.name === observableFunctionName){
						pushPubSub(currentDom,bindKey,currentFn,vmValue,null,vm,attrsValueObject);
					}else if(type === 'Function' && vmValue.name === computedFunctionName){
						pushPubSub(currentDom,bindKey,currentFn,vmValue,null,vm,attrsValueObject);
					}else {
						currentFn([vmValue,currentDom,vm,attrsValueObject]);
					}
		
				}	
			}

			vm.toJSON = function(){
				var resultJSON = {};
				for(var key in this){

				}
			}
			
			return domsAndAttrs;
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

				style.set(dom,copyStyleObj);
			}

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

		/**
			dom
			data
			data.$parent
		*/
		function routeForeachFn(ary){
			var dom = ary[1],
				foreachObj = ary[0],
				type = utils.getType(foreachObj),
				realForeachObj,
				context = ary[2],
				listDomTemplete ,
				innerHtml = dom.innerHTML;

			
			var childNodes = getChildNodes(dom),
				fragment = document.createDocumentFragment();

			//解决ie当节点从页面通过innerHTML清空，则无法操作节点
			childNodes.forEach(function(node){
				dom.removeChild(node);
			});

			//当前childNode存储到缓存里面去
			data(dom,dataCache['foreach'],[]);
			switch(type){
				case 'Function':
					realForeachObj = foreachObj({
						wapper:dom,
						inner:childNodes,
						context:context
					});
					break;
				default:
					realForeachObj = foreachObj;
					break;
			}

			//dom.innerHTML = '';
			realForeachObj.forEach(function(objVal,objKey){
				fillContext(childNodes,objVal,objKey,context,fragment,dom);
			})
			//dom.innerHTML = '';
			dom.appendChild(fragment);
			
		}
		
		//todo:if内部的元素可能会被监控，通过html操作这些元素会丢失dom的引用
		//if路由
		function routeIfFn(ary){
			var dom = ary[1],
				isTrue = ary[0],
				cache ;

			setIfAndIfNotCache(dom)
			cache = data(dom,dataCache.ifAndIfnot);

			if(isTrue){
				dom.innerHTML = cache ? cache : '';
			}else{
				dom.innerHTML = '';
			}
		}

		//ifnot
		function routeIfnotFn(ary){
			var dom = ary[1],
				isTrue = ary[0],
				cache ;

			setIfAndIfNotCache(dom)
			cache = data(dom,dataCache.ifAndIfnot);

			if(isTrue){
				dom.innerHTML = '';
			}else{
				dom.innerHTML = cache ? cache : '';
			}
		}

		//with
		function routeWithFn(ary){
			var dom = ary[1],
				withObj = ary[0],
				$parent = ary[2],
				childNodeAttrs,
				newElementsList;

			withObj.$parent = $parent;

			childNodeAttrs = getAttribute(dom);
			newElementsList =  getTriggerDoms(dom);
			if(childNodeAttrs || newElementsList.length){
				if(childNodeAttrs){
					newElementsList.push({
						dom:dom,
						attr:childNodeAttrs
					})	
				}
				analysisBindRulers(withObj,newElementsList)
			}
		}

		//click
		function routeClickFn(ary){
			var dom = ary[1],
				handler = ary[0],
				$parent = ary[2];
				//console.log($parent);
			
			//冒泡到顶级作用域
			// while($parent.$parent){
			// 	$parent = $parent.$parent;
			// }

			//是forEach里面的事件this指向当前索引对象，其他指向viewMoadel
			$parent = ary[2]._origin ? ary[2]._origin : $parent;
			//直接写不知道为何this指向是错误的，指到一个包含handler本身的数组，不明白	
			events.on(dom,'click',function(){
				//console.log($parent)
				//bind会把字符串转换成对象，这是个bug
				handler.bind($parent)();
				//handler.call($parent);
			});
		}

		//event
		function routeEventFn(ary){
			var dom = ary[1],
				handlerObj = ary[0],
				$parent = ary[2];
				//console.log($parent);

			//冒泡到顶级作用域
			// while($parent.$parent){
			// 	$parent = $parent.$parent;
			// }
			$parent = ary[2]._origin ? ary[2]._origin : $parent;
			if(utils.getType(handlerObj) != 'Object'){
				return;
			}
			for(var handler in handlerObj){
				(function(eventType){
					events.on(dom,eventType,function(){
						handlerObj[eventType].bind($parent)();
					});
				})(handler)
			}
		}

		//value
		var valueValPattern = /value\s*:\s*(.+),?/;
		function routeValueFn(ary){
			var dom = ary[1],
			value = ary[0],
			$parent = ary[2],
			attrsValueObject = ary[3];

			//value只绑定输入框
			if(!/input/i.test(dom.tagName)){
				return;
			}

			dom.value = value;
			
			
			if(data(dom,dataCache.value)){
				return;
			}

			//给form元素绑定双向事件
			var valueType = utils.getType(attrsValueObject.value),
				valueUpdateMethod = attrsValueObject.valueUpdate,
				attrValAry = valueValPattern.exec(dom.getAttribute(mvvm.trigger));

			if(valueType === 'Function' && attrsValueObject.value.name === observableFunctionName){
				data(dom,dataCache.value,true);
				valueUpdateMethod = valueUpdateMethod ? valueUpdateMethod : 'keyup';
				events.on(dom,valueUpdateMethod,function(){
					if(attrValAry && attrValAry.length>=2){
						$parent[utils.trim(attrValAry[1])](dom.value);
					}
				})
			}

		}

		function valueUpdate(){
			var dom = ary[1],
				eventType = ary[0];
		}

		//enable
		function routeEnableFn(ary){
			var dom = ary[1],
				isTrue = ary[0];

			if(isTrue){
				dom.removeAttribute('disabled');
			}else{
				dom.setAttribute('disabled','disabled');
			}
		}

		//disable
		function routeDisableFn(ary){
			var dom = ary[1],
				isTrue = ary[0];

			if(isTrue){
				dom.setAttribute('disabled','disabled');
			}else{
				dom.removeAttribute('disabled');
			}
		}

		//checked
		var checkedValPattern = /checked\s*:\s*(.+),?/;
		function routeCheckedFn(ary){
			var dom = ary[1],
				isChecked = ary[0],
				$parent = ary[2],
				attrsValueObject = ary[3],
				actureVal;

			if(!/input/i.test(dom.tagName)){
				return;
			}

			var type = dom.type;
			type = type.toLowerCase();

			switch(type){
				case 'radio':
					dom.checked = isChecked === dom.value ;
					break;
				case 'checkbox':
					var checkType = utils.getType(isChecked);
					//console.log(isChecked)
					if(checkType === 'Boolean'){
						dom.checked = isChecked;
					}else if(checkType === 'Function'){
						actureVal = isChecked();
						dom.checked = actureVal.indexOf(dom.value)>-1 ? true : false;
					}
					break;
				default:
					break;
			}


			

			if(data(dom,dataCache.checked)){
				return;
			}

			//给form元素绑定双向事件
			var valueType = utils.getType(attrsValueObject.checked),
				valueUpdateMethod = attrsValueObject.valueUpdate,
				attrValAry = checkedValPattern.exec(dom.getAttribute(mvvm.trigger));

			if(valueType === 'Function'){
				data(dom,dataCache.checked,true);
				//click 比 change兼容性好
				valueUpdateMethod = valueUpdateMethod ? valueUpdateMethod : 'click';
				events.on(dom,valueUpdateMethod,function(){
	
					if(attrValAry && attrValAry.length>=2){
			
						switch(type){
							case 'radio':
								$parent[utils.trim(attrValAry[1])](dom.value);
								break;
							case 'checkbox':
								if(checkType === 'Boolean'){
									$parent[utils.trim(attrValAry[1])](dom.checked);
								}else if(checkType === 'Function'){

									if(dom.checked){
										$parent[utils.trim(attrValAry[1])].push(dom.value);
									}else{
										$parent[utils.trim(attrValAry[1])].remove(dom.value);
									}
								}
								break;
							default:
								break;
						}
						
					}
				})
			}

		}

		//options
		var optionsTextPattern =  /optionsText\s*:\s*['|"]([^']+)['|"],?/,
			optionsValuePattern = /optionsValue\s*:\s*['|"]([^']+)['|"],?/,
			optionsCaptionPattern = /optionsCaption\s*:\s*['|"]([^']+)['|"],?/,
			optionsPattern = /options\s*:\s*(.+),?/;
		function routeOptionsFn(ary){
			var dom = ary[1],
				optionsObj = ary[0],
				type = utils.getType(optionsObj),
				realForeachObj,
				context = ary[2],
				$parent = ary[2],
				attrsValueObject = ary[3],
				defaultStart = 0;

			
			var childNodes = new Option(),
				fragment = document.createDocumentFragment();

			var trigger = dom.getAttribute(mvvm.trigger),
				attroptionsTextAry = optionsTextPattern.exec(trigger),
				attroptionsValueAry = optionsValuePattern.exec(trigger),
				attroptionsCaptionAry = optionsCaptionPattern.exec(trigger),
				optionsText ,
				optionsValue ,
				optionsCaption ;

			if(attroptionsTextAry && attroptionsTextAry.length >= 2){
				optionsText = attroptionsTextAry[1];
			}

			if(attroptionsValueAry && attroptionsValueAry.length>=2){
				optionsValue = attroptionsValueAry[1];
			}
			
			if(attroptionsCaptionAry && attroptionsCaptionAry.length >= 2){
				optionsCaption = attroptionsCaptionAry[1];
				//console.log(optionsCaption)
				//var option = new Option(optionsCaption,'11'); 
				var option = document.createElement('option');
				option.innerHTML = optionsCaption;
				fragment.appendChild(option);
				defaultStart = 1;
			}	

			var triggerAttrs,html,value;

			html = optionsText === undefined ? '$data' : optionsText;
			value = optionsValue === undefined ? '$data' : optionsValue;
			
			triggerAttrs = "html:"+ html;
			
			childNodes.setAttribute( mvvm.trigger , triggerAttrs);
			childNodes = [childNodes];


			//当前childNode存储到缓存里面去
			data(dom,dataCache['foreach'],[]);

			switch(type){
				case 'Function':
					realForeachObj = optionsObj({
						wapper:dom,
						inner:childNodes,
						context:context
					});
					break;
				default:
					realForeachObj = optionsObj;
					break;
			}


			realForeachObj.forEach(function(objVal,objKey){
				fillContext(childNodes,objVal,objKey,context,fragment,dom);
			})

			dom.appendChild(fragment);

			if(data(dom,dataCache.options)){
				return;
			}

			//给form元素绑定双向事件
			var valueType = utils.getType(attrsValueObject.options),
				attrValAry = valueValPattern.exec(dom.getAttribute(mvvm.trigger)),
				valueUpdateMethod;

			if(valueType === 'Function'){
				data(dom,dataCache.options,true);
		
				valueUpdateMethod = 'change';
				events.on(dom,valueUpdateMethod,function(){
					if(attrValAry && attrValAry.length>=2){
						var index = dom.selectedIndex;
						index = index - defaultStart ;
						var currentVal = realForeachObj[index];

						if(currentVal){
							context[utils.trim(attrValAry[1])](currentVal);
						}
					}
					
				})
			}

		} 

		//################################
		//常用方法
		function getRandom(){
			return Math.random();
		}

		//解析data-bind,修正this指向
		var faultPattern = /(if|with)\s*:/g
		function getAttrsValueObject(currentAttr,viewModel){
			var _fn,attrValueObject;
			//处理if|with关键字作为键值在ie6下面报错的问题
			currentAttr = currentAttr.replace(faultPattern,function($1,$2){
				return "'" + $2 + "'" + ":"
			});

			//TODO 
			//处理options问题



			try{
				_fn = new Function('scope','var attrObj ;with( scope ){attrObj = {'+ currentAttr +'}};return attrObj;')
			}catch(e){
				throw 'Wrong expressions!';
			}

			try{
				attrValueObject = _fn.bind(viewModel)(viewModel);
			}catch(e){
				attrValueObject = {};
			}
			return attrValueObject;
		}

		//区分child nodeType的路由
		function fillContext(childNodes,objVal,objKey,context,fragment,parentNode,method){
			var childNodeAttr,
				childAttrObj,
				objValType = utils.getType(objVal),
				newObjVal,
				newElementsList,
				childNodesCache = data(parentNode,dataCache['foreach']),
				_currentChildNodes = [];

			childNodesCache = childNodesCache ? childNodesCache : [] ;
			//默认push也就是把元素默认插入到标签的最后
			method = method ? method : 'push';

			newObjVal = { 
				$data:objVal,
				$index:objKey,
				$parent:context,
				_origin:objVal
			}
			
			if(utils.getType(objVal) === 'Object'){
				utils.extend(newObjVal,objVal);
			}
			
			fragment = fragment ? fragment : document.createDocumentFragment();

			childNodes.forEach(function(childNode,childKey){
				var newChildNode;
				newChildNode = childNode.cloneNode(true);
				
				//更新原始节点，因为ie操作无法操作原始节点
				//childNodes[childKey] = newChildNode;
				var newDomAry;
				switch(childNode.nodeType){
					//元素节点
					case 1:
						childNodeAttrs = getAttribute(newChildNode);
						newElementsList =  getTriggerDoms(newChildNode);
						if(childNodeAttrs || newElementsList.length){
							if(childNodeAttrs){
								newElementsList.push({
									dom:newChildNode,
									attr:childNodeAttrs
								})	
							}
							analysisBindRulers(newObjVal,newElementsList)
						}
						break;
					default:
						break;
				}
				_currentChildNodes.push(newChildNode);
				fragment.appendChild(newChildNode);
			})
			switch(method){
				case 'push':
					childNodesCache.push(_currentChildNodes);	
					break;
				case 'splice':
					//splice需要返回已修改childNodes的数组集合
					fragment = {
						fragment : fragment,
						childNodes : _currentChildNodes
					}
					break;
			}
			
			return fragment;
		}

		//############################################################
		//dom操作的常用方法
		function getAttribute(currentDom){
			var attrVal =  currentDom.getAttribute(mvvm.trigger);
			if(attrVal === undefined){
			    attrVal = currentDom[mvvm.trigger];
			}
			return attrVal ? attrVal : null;
		}


		function setText(dom,text){
			dom.innerHTML = '&nbsp;';
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

		function getChildNodes(parent){
			return utils.makeArray(parent.childNodes)
		}

		function setIfAndIfNotCache(dom){
			var originHtml = dom.innerHTML;
			if(originHtml.length){
				data(dom,dataCache.ifAndIfnot,originHtml);
			}
		}
		//############################################################

		return mvvm;
	})
})()

