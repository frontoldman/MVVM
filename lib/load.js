/**
	加载与执行的顺序
	define --->  load
*/

;(function(global){
	var __load ,    //加载主函数入口
		__define,   //定义函数 
		__loadScript, //加载脚本函数
		__generatRandomNumber,  //随机数生成器用于在非IE中onload中取得刚define的脚本
		__loaderContainer = {} ,    //模块存储单元
		__mappingOfIDAndURL = {},   //自定义id与URL的映射表
		__isIE =  global.attachEvent && !global.opera,  //判断是否ie
		__recentRandom = 0, //全局随机数
		__analyticDefine,   //脚本解析器

		__type = function(object){
			return Object.prototype.toString.call(object);
		},
		__slice = Array.prototype.slice,
		__head = document.head || document.getElementsByTagName('head')[0] || document.documentElement; //他们都这么写
		
		//这是一个正在加载的模块的列表存储器，用来解决加载相同模块的在很短时间内会出现同时加载的情况
		__loaderContainer.__TemporaryLoadList = {};
		//这是一个依赖列表，其作用是处理循环依赖
		__loaderContainer.relayList = {};


	//重置console,解决ie6报错
	if(!global.console){
		global.console = {
			log:function(msg){
				alert(msg);
			}
		}
	}
	
	/*
	*解析url路径
	*/
	var prefixUrl;
	function dirname(path) {
		var s = path.match(/.*(?=\/.*$)/);
		return (s ? s[0] : '.') + '/';
	}
	prefixUrl = dirname(global.location.href);	


	//从seajs抠出来的
	var currentlyAddingScript;
	var interactiveScript;

	var __getCurrentScript = function() {       //解决ie模块加载执行的时候onload不能按照正常顺序执行
		if (currentlyAddingScript) {
			return currentlyAddingScript;
		}

		// For IE6-9 browsers, the script onload event may not fire right
		// after the the script is evaluated. Kris Zyp found that it
		// could query the script nodes and the one that is in "interactive"
		// mode indicates the current script.
		// Ref: http://goo.gl/JHfFW
		if (interactiveScript && interactiveScript.readyState === 'interactive') {
			return interactiveScript;
		}

		var scripts = __head.getElementsByTagName('script');

		for (var i = 0; i < scripts.length; i++) {
			var script = scripts[i];
			if (script.readyState === 'interactive') {
				interactiveScript = script;
				return interactiveScript;
			}
		}
	};

  

    //入口
	__load = function(){   //require 的时候怎么判断模块之间有没有互相依赖呢???

		var args = arguments;
        if(args.length < 1){
            return;
        }
		var url = args[0];
        
		//判断一个脚本是否已经加载，应该从开始加载的时候锁定，需要解决？？：已解决
        url = formatURL(url);//格式化url参数
        var modulesLists = {length:0};
        var lock = false;
		
		var module,currentLoad;
		
        if( url && url.length ){
            for(var i = 0 ,len = url.length;i<len;i++){ //只有modulesList的长度==url这个数组的长度才执行回调                                       
                
				modulesLists[url[i]] = i;                //通过define完成递归
				module = __loaderContainer[url[i]];
				currentLoad = __loaderContainer.__TemporaryLoadList[url[i]]
				
				//console.log(i,url[i]);
				//console.log(module && module.__$delay$);
				//console.log(currentLoad);
                if(module && !module.__$delay$){
                    modulesLists[i] = module; 
                    modulesLists.length ++;
                    callback();
				}else if(currentLoad){
					//console.log(module + ':loading');
					//判断这个脚本是不是正在加载，却还没有加载成功，并没有成功解析
					(function(list_n){
						var list_n_interval = setInterval(function(){
							var exports = __loaderContainer[list_n];
							//console.log(__loaderContainer)
							if(exports){
								//页面中的require不会出现循环依赖，so这里是不必要的
								if(exports.__$delay$){//循环依赖会出现有exports,并且__$delay$ = true
									//clearInterval(list_n_interval);//暴力破坏循环依赖
									//console.log('循环依赖？？？？')
									//return false;
								}else{
									
									modulesLists.length ++;
									clearInterval(list_n_interval);
									callback()
								}													
							}
						},1)						
					})(url[i])	
                }else{     
                    __loadScript(url[i],function(exports,url){
                        modulesLists[modulesLists[url]]= exports;
                        modulesLists.length ++;
                        callback();
                    });
                }
            }
        }

        function callback(){               
            if(modulesLists.length >= len){      //require的回调执行时机
                // console.log(modulesList);
                if(__type(args[1]) === '[object Function]'){
                    args[1].apply(null,__slice.call(modulesLists,0));//ie6 apply 第二个参数必须是数组不能是类数组的对象
                }
                lock = true;
            }
        }

        
	}
	
	//开启debug模式，默认不开启，开启之后执行以下操作
	//1、加载的脚本script不会被删除。
	var debug = false;
	__load.openDebug = function(){
		debug = true;
	}
	
	
	__loadScript = function(){ //插入脚本
		var args = arguments,
            length = args.length || 0,
			_script = document.createElement('script'),
            url = args[0];
			
		_script.type = 'text/javascript';
		_script.src = url;
        _script.async = true;
        _script.defer = 'defer';

        _script.onload = _script.onreadystatechange =  function(){
            
           // _script.onload = _script.onreadystatechange = _script.onerror = null; //处理ie9双绑定以及loaded complete顺序错乱的问题
			if(!this.readyState || /loaded|complete/.test(this.readyState)){

			//非IE 判断最新随机数的模块为当前模块
			if(!__isIE){
				__loaderContainer[url] = __loaderContainer[__recentRandom];
				var id = __mappingOfIDAndURL[__recentRandom];
				if(id){
				   __mappingOfIDAndURL[url] = id; 
				}
				delete __loaderContainer[__recentRandom];
				__recentRandom = 0;
			}

				//不是标准模块的加载处理?????????不打算处理了


				//IE 在模块define的时候已经取得当前url,已经push进去了
				// console.log(__loaderContainer[url])
				if(__loaderContainer[url]) {
					if(!__loaderContainer[url].__$delay$){//模块中包含__$delay$ 就是有依赖的模块需要等待
					   // console.log('入口');
						args[1](__loaderContainer[url],url);
					}else{                                  //为了能够执行回调，把回调返回到这个临时对象中，
						__loaderContainer[url].factory = args[1];
						__loaderContainer[url].url = url;
					}                    
					__recentRandom = 0;
				}else{                                      //标准模块是可以准确的判断加载是否成功
					__loaderContainer[url] = false;
					console.log( url + '加载失败！');
				}
				_script.onload = _script.onreadystatechange = null;//解决ie9双绑定的问题

				if ( _script.parentNode && !debug) {             //他们都这么写
					_script.parentNode.removeChild( _script );
				}

				// Dereference the _script
				_script = null;
			}
		}


		_script.onerror = function(){
			__loaderContainer[url] = false;
			console.log( url + '加载失败！ onerror');
			if(_script){
				_script.onerror = null;
				_script = null;
			}
		}


		currentlyAddingScript = _script;
		__head.insertBefore( _script, __head.firstChild );
		__loaderContainer.__TemporaryLoadList[url] = true;
		currentlyAddingScript = null;
	}

	/**
	 *    AMD设计出一个简洁的写模块API：define 。

		 define(id?, dependencies?, factory);

		 其中：
		 id: 模块标识，可以省略。
		 dependencies: 所依赖的模块，可以省略。
		 factory: 模块的实现，或者一个JavaScript对象。
	 * @private
	 */
	__define = function(){  
	   var args = __slice.call(arguments,0);

	   if(args.length === 1){       //一个参数执行回调
		   argslength1(args[0]);
	   }else if(args.length === 2){     //两个参数加载依赖，执行回调
		   argslength2(args[1],args[0]);          
	   } else if(args.length === 3){    //三个参数，再说吧
		   argslength2(args[2],args[1],args[0]);
	   }
	}

    //一个参数
	var argslength1 = function(funOrObj,id){
		funOrObj =  __type(funOrObj) === "[object Function]" ? funOrObj() : funOrObj;
		__analyticDefine(funOrObj,id);
	}

    //二个参数
		var argslength2 = function (funOrObj, relay ,id) {
		
		
			//依赖到这里肯定是有的，所以注释掉
			//if(!relay.length){    //判断依赖是否合理
			//    argslength1(funOrObj); 
			//    return;
			//}
			//__tempFactory是个临时模块，通过这个理临时模块占位，然后通过这个临时模块带回来url和回调函数，一层一层的
			//递归下去，(其实不是递归，只不过把当前回调传入到下一层去了)
			var deep = { length:0 },
			  __tempFactory = {__$delay$:true},//这是一个神奇的对象
				i = 0 ,
			  len,
			  currentLoad,
			  currentRelay,
			  module,
			  currentRelayList = {};
				
		   __analyticDefine(__tempFactory,id);            //第一个脚本已经load,需要解析,有依赖，传入一个对象延迟执行
			

			//通过一个异步让模块先解析完成并获得url
			setTimeout(function(){

				relay = formatURL(relay,__tempFactory.url);
				for (len = relay.length; i < len; i++) {    
			  
					currentRelay = relay[i];
					deep[currentRelay] = i;          //顺序传递参数
					currentLoad = __loaderContainer.__TemporaryLoadList[currentRelay];
					module = __loaderContainer[currentRelay];
					
					if(checkRelay(__tempFactory.url,currentRelay)){
					  //循环依赖暴力破解
					  console.log('你为何放弃治疗？')
					  return;
					};

					currentRelayList[currentRelay] = true;

					if(module && !module.__$delay$){	
						defineCallback(module,currentRelay);
					}else if(currentLoad){
						//判断这个脚本是不是正在加载，却还没有加载成功，并没有成功解析
						(function(list_n){
							var list_n_interval = setInterval(function(){
								var exports = __loaderContainer[list_n];
								if(exports){
									//循环依赖这里判断不准确
									if(!exports.__$delay$){														
										clearInterval(list_n_interval);
										defineCallback(exports,list_n)
									}													
								}
							},1)						
						})(currentRelay)					
				   }else{
						__loadScript(currentRelay,function(exports,url){  //需要把所有的exports传入到a的回调中去
							defineCallback(exports,url);
						})
				   }
				}

				__loaderContainer.relayList[__tempFactory.url] = currentRelayList;//依赖列表赋值

				//TODO:修复ie延时问题
				//此处为ie加个延迟,ie不能正确解析模块与对应url之间的关系，导致地址判断异常，在模块较多的时候延时会比较严重
			},__isIE?11:0)
			
			   // }

			function defineCallback(exports,url){
				//console.log(exports)
				var index = deep[url];               
					deep[index] = exports ;
					deep.length++ ;
					if(deep.length >= len){
						//能正确解析依赖的精髓
						funOrObj =  __type(funOrObj) === "[object Function]" ? funOrObj.apply(null,__slice.call(deep,0)) : funOrObj;
						__loaderContainer[__tempFactory.url] = funOrObj;
						var id = __mappingOfIDAndURL[__tempFactory.url];
						if(id){
							__loaderContainer[id] = funOrObj;
						}    
						__tempFactory.factory(funOrObj,__tempFactory.url);
					}
			}
		};

		//处理模块之间互相依赖的函数
		function checkRelay(currentModule,relayModule){
				var isCircularDependencies,
				  beforeRelay = __loaderContainer.relayList[relayModule];
				  //console.log(currentModule,relayModule)
				 // console.log(beforeRelay)

				if(beforeRelay){
				  for(var j in beforeRelay){
					if(j == currentModule){
					  isCircularDependencies = true;
					  break;
					}else if(__loaderContainer.relayList[j]){
					  if(checkRelay(currentModule,j)){
						isCircularDependencies = true;
						break;
					  }
					}
				  }
			}


			return isCircularDependencies;
		}

	//。。。。
	var argslength3 = function(){

	}

	//过滤传入，格式化传入的参数
	/**
		relay:String||Array 模块的依赖列表
		originUrl:模块的URL
	**/
	function formatURL(relay,originUrl){
		var currentUrl,
			//根据originUrl判断是从html页面引入的模块还是从define里面引入的模块
			_prefixUrl = originUrl?dirname(originUrl):prefixUrl,
			currentPre = _prefixUrl;

		relay = __type(relay) === "[object String]" ? [relay] : relay;
		if (relay && __type(relay) === "[object Array]") {
			for(var i = 0 ,len = relay.length; i<len;i++){
				currentUrl = relay[i].replace(/^\s+|\s+$/g,"");//去掉首尾空格
				if(currentUrl.length<=0){
					relay.splice(i,1);
					continue;
				}
				
				
				//转换相对路径为绝对路径
				if(/^\.\//.test(currentUrl)){//./开头
					currentUrl = currentUrl.replace(/^\.\//,"");
				}else if(/^\//.test(currentUrl)){// /开头
					currentUrl = currentUrl.replace(/^\//,"");
				}else if(/^\.\./.test(currentUrl)){//....../开头
					var directoryDeep = /(\.+)\.\//.exec(currentUrl)[1].length,//目录深度					
						newPrefixUrlPattern = new RegExp('(\\\w+\/){'+ directoryDeep +'}$','ig'),
						theDirectoryNeedToBeReplaced = newPrefixUrlPattern.exec(_prefixUrl)[0];	
							
					currentPre = _prefixUrl.replace(theDirectoryNeedToBeReplaced,'');
					currentUrl = /\.+\/(.*)$/.exec(currentUrl)[1];
		
				}else{
					currentPre = '';
				}
				 
				currentUrl = currentPre + currentUrl;
				currentPre = _prefixUrl;

				relay[i] = /\.\w+\s*$/.test(currentUrl) ? currentUrl : currentUrl + '.js'; 
			}
		 }
		 //console.log(relay)
		 return relay;
	}
	/**
	 *随机数生成器，通过全局的__recentRandom在非IE浏览器下面取得已经解析的模块
	 * @private
	 */
	__generatRandomNumber = function(){
		return __recentRandom = Math.random();
	}


	//存储模块，根据url存储模块
	__analyticDefine = function(moudle,id){
		var url;
		__generatRandomNumber();
		if(__isIE){
			var currentScript = __getCurrentScript();
			//  url = currentScript.src;   IE8 + 会取得绝对路径，有问题
			url = currentScript.getAttribute("src");
			__loaderContainer[url] = moudle;
			if(id){
				__loaderContainer[id] = __loaderContainer[url];
				__mappingOfIDAndURL[url] = id;
			}
		} else {
			__loaderContainer[__recentRandom] = moudle;
			if(id){
				__loaderContainer[id] = __loaderContainer[__recentRandom];
				__mappingOfIDAndURL[__recentRandom] = id;
			}
		}

	}


    

	//暴露两个全局函数
	//define 模块定义函数
	//require 模块加载函数
	global.define = __define;
	global.require = __load ;

})(this)