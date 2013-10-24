/**
	实现思路
		1、”,“拆分选择器字符串
		2、空格拆分字符串进行大范围筛选
		3、特殊字符过滤已经筛选到的dom,返回数组。
**/

define(['.../utils/utils'],function(utils){
	
	var doc = document,
		concat = Array.prototype.concat,
		slice = Array.prototype.slice,
		//http://www.nowamagic.net/javascript/js_RemoveRepeatElement.php
		//学到一个快速去重的方法，利用js特性，把数组值赋给对象的key,判断key是否重复，简单类型当用此方法
		unique = function(arr){
					for(var i=0;i<arr.length;i++)
						for(var j=i+1;j<arr.length;j++)
							if(arr[i]===arr[j]){arr.splice(j,1);j--;}           
					return arr;
				},
		makeArray = (function(){
			var makeArrayFn;
			try{
				slice.call(document.documentElement.childNodes, 0)[0].nodeType;
				makeArrayFn = function(obj){
					return utils.getType(obj) === 'Array' ? obj : slice.call(obj,0);
				}
			}catch(e){
				makeArrayFn = function(obj){
					
					if(utils.getType(obj) === 'Array'){
						return obj;
					}
					
					var res = [];
					for(var i=0,len=obj.length; i<len; i++){
						res.push(obj[i]);
					}
					return res;
				}
			}
			
			return makeArrayFn;
		})();
	
	
	
	//#############################################################
	
	var separatorPattern = /(\w+)[+|>|:]?([.|#]?(\w+))/;
	
	//通过class查找
	/**
		className:String class名字
		context:Node 上下文环境，仅仅是dom,
	**/
	function getByClass(className,context){

		var eles,clsNameAry,i;
		if(context.getElementsByClassName){
			eles = makeArray(context.getElementsByClassName(className));			
		}else{
			eles = context.getElementsByTagName('*');
			
			var temp = utils.filter(eles,function(key,value){
				clsNameAry = value.className.split(/\s+/);
				
				//class名字 是区分大小写的
				for(i = 0;i<clsNameAry.length;i++){
					if(clsNameAry[i] == className){						
						return true;
					}
				}
			})

			eles = temp ;
					
		}
		//console.log(eles)
		return eles;
	}




	function findByClass(selector,context){
		var tempNodeCollection,
			i,
			len,
			singleNodeListsGetByClassName;
		if(context.nodeName){
			tempNodeCollection = getByClass(selector,context);
			//console.log(tempNodeCollection)
		}else if(context.length){
		
			tempNodeCollection = [];
			//遍历父级NodeList,取得所选标签并且去重
			for(i = 0,len = context.length;i < len;i++){
				if(singleNodeListsGetByClassName = getByClass(selector,context[i])){
					tempNodeCollection.push(singleNodeListsGetByClassName);
					
				}								
			}
			tempNodeCollection = concat.apply([],tempNodeCollection);
			//TODO 去重
		}
		//console.log(tempNodeCollection)
		return tempNodeCollection ;
	}
	
	
	function findByTagName(selector,context){
		var tempNodeCollection,
			i,
			len,
			singleNodeListsGetByTagName;
			//console.log(context)
		if(context.nodeName){
			tempNodeCollection = context.getElementsByTagName(selector);
		}else if(context.length){
			tempNodeCollection = [];
			//遍历父级NodeList,取得所选标签
			//console.log(context)
			for(i = 0,len = context.length;i < len;i++){
				if(singleNodeListsGetByTagName = context[i].getElementsByTagName(selector)){

					tempNodeCollection.push(makeArray(singleNodeListsGetByTagName))
					
				}								
			}
			tempNodeCollection = concat.apply([],tempNodeCollection);
		}
		//console.log(tempNodeCollection)
		
		return tempNodeCollection ;
	}
	
	//################################################
	
	//主要选择器的映射
	var patternSelector = {
		'^#(\\\w+)(.*)':function(selector,context){
							var tempDomById = context.getElementById(selector);
							tempDomById = tempDomById ? [tempDomById] : [];
							return tempDomById;
						},
					//context：node,nodeList,elementsCollection
		'^\\\.(\\\w+)(.*)':findByClass,
						//tagName 不区分大小写
		'^([A-Za-z]+|\\\*)(.*)':findByTagName
	}
	
	
	
	/**
		selector:String css选择器字符串
		context:obj 上下文环境，默认是document
	**/
	
	var sizzle = function(selector,context){
		
		if(!context){
			context = doc;
		}
			
		var result ;	
		
		//不用querySelectorAll，因为有一些选择器css3本身都不支持，期待选择器的进步
		try{
			result = splitByComma(selector,context);
		}catch(e){
			throw 'Using the wrong selector:' + selector
		}
		return result;
		
		if(doc.querySelectorAll){
			return context.querySelectorAll(selector);
		}else{					
			return splitByComma(selector,context);
		}
	}
	
	
	//逗号分割符
	function splitByComma(selector,context){
		selector = utils.trim(selector);
		var selectorAry = selector.split(/\,/),temp = [];
		utils.each(selectorAry,function(key,value){
			
			var spaceDoms = splitBySpace(value,context)
			temp.push(makeArray(spaceDoms));
			
		});
		
		//console.log(concat.apply([],temp)[0])
		temp = concat.apply([],temp);
		
		//全部返回数组元素
		temp = unique(temp);
		
		
		return temp;
	}

	//空格分隔符
	function splitBySpace(selector,context){
		selector = utils.trim(selector);	
		var selectorAry = selector.split(/\s+/)
			,parents = context;
		
		utils.each(selectorAry,function(key,value){
			
			var selectorPattern,result ;
			for(var i in patternSelector){
				selectorPattern = new RegExp(i);
				
				result = selectorPattern.exec(value);
				if(result && result.length >= 2){
					parents = patternSelector[i](result[1],parents);
					//还有特殊分隔符,不能为空字符串
					if( parents && result.length>=3 && result[2].length){
						parents = splitByFilterSymbol(result[2],parents);
						//console.log(parents)
					}

					break;
				}
			}

		})
		
		

		parents = parents === context ? [] : parents;		
		return parents ;
	}

	
	
	
	//#########################################
	var symbolSelector = {
		'+':splitByPlus,
		'>':splitByAngleBrackets,
		'~':splitByWave,
		'.':splitByPoint,
		':':splitByColon,
		'[':splitByBracket
	}

	//分隔符 + > ~
	/**
		selector:string 选择器
		domsLocated：Array  已经被选中的标签数组
	**/
	function splitByFilterSymbol(selector,domsLocated){
		
		var newSymbolPattern = /[+|>|~|.|:|\[|\]]/,
			filterSymbolPattern = /[+|>|~|.|:]/,
			i,
			len = selector.length,
			preChar ,
			currentChar,
			patternResult,
			_tempSelectorStr,
			subEndIndex,
			subEnd,
			subStartChar,
			bracket;
		
		//selector = new String(selector)
		//console.log(domsLocated)
		//console.log(selector)
		for(i = 0;i < len;i++){
			currentChar = selector.charAt(i); //selector[i] #解决ie 6~8 问题
			patternResult = newSymbolPattern.exec(currentChar);
			//console.log(currentChar)
			//匹配到了一个特殊字符或者到了字符串的最后都要去尝试过滤一下
			if((patternResult && patternResult.length) || i === len-1){
				subEndIndex = i;
				
				
				//[]也就是属性选择器要单独考虑
				//从'['开始直到匹配到']'结束，不管中间有什么都忽略
				if(currentChar === '['){
					bracket = true;
					preChar = {
								index:subEndIndex-1,
								charCode:patternResult[0]
							}
				}
				
				if(currentChar === ']'){
					bracket = false;
					
				}
				
				if(bracket){
					continue;
				}
				
				//#######这地方比较乱
				
				//连接起来的.操作符比较特殊，需要分类操作
				if(currentChar === '.'){
					//只要.不在第一个或者.之前没有特殊字符选择器,就跳出当前循环
					subStartChar = selector.charAt(i-1)
					//console.log(subStartChar)
					if(i === 0 || !filterSymbolPattern.test(subStartChar)){

						subEndIndex = i-1;	
						
						if(i == 0){//解决以.开头没法分析错误的bug
							preChar = {
								index:subEndIndex,
								charCode:patternResult[0]
							}
						}
					}else{
						continue;
					}
				}
				
				if(preChar && i){		
					
					if(i == len-1 ){
						subEnd = len;
					}else if(currentChar == ']'){
						subEnd = i+1;
					}else{
						subEnd = i
					}
					
					_tempSelectorStr = selector.slice(preChar.index+1,subEnd);
					//console.log(_tempSelectorStr)
					//console.log(domsLocated)
					//console.log(preChar.charCode)
					
					domsLocated = symbolSelector[preChar.charCode](_tempSelectorStr,domsLocated);
					if(!domsLocated || !domsLocated.length){
						break;
					}
				}
				
				if(currentChar === ']'){
					preChar = null;	
					continue;
				}
				
				
				if(i === len-1) break;

				preChar = {
					index:subEndIndex,
					charCode:patternResult[0]
				}
				
			}
			
			
		}
		//alert(domsLocated)
		//console.log(domsLocated)		
		return domsLocated;
	}
	
	//.分隔符
	function splitByPoint(selector,domsLocated){
		
		//console.log(domsLocated)
		
		var temp = utils.filter(domsLocated,function(key,value){
			var dom = characteristicsFilter(selector,value);
			if(dom){
				return true;
			}
			
		})
		
		//console.log(temp)
		
		return temp ? temp : [];
		
	}

	
	//+分隔符 相邻后元素选择器
	function splitByPlus(selector,domsLocated){
		var temp = [];
		//console.log(domsLocated)
		utils.each(domsLocated,function(key,value){
			var nextSibling = next(value,selector);
			
			if(nextSibling){
				temp.push(nextSibling);
			}
			
		})
		return temp;
	}
	
	//>分隔符 直属后代选择器
	function splitByAngleBrackets(selector,domsLocated){
		var temp = [];
		//console.log(domsLocated)
		utils.each(domsLocated,function(key,value){
			var child = children(value,selector);
			
			if(child){
				temp.push(child);
			}
			
		})
		temp = concat.apply([],temp)
		return temp;
	}
	
	//~分隔符 相邻后元素选择器s
	function splitByWave(selector,domsLocated){
		var temp = [];
		
		//console.log(domsLocated)
		
		utils.each(domsLocated,function(key,value){
			var singleDomnexts = nexts(value,selector);
			
			//console.log(singleDomnexts)
			
			if(singleDomnexts){
				temp.push(singleDomnexts);
			}			
		})
		
		temp = concat.apply([],temp)
		
		//console.log(temp);
		
		return temp;
	}
	
	var attrPattern = /\[([a-z0-9A-Z_-]+)([\^|\$\*]?)=?(?:['|"]?)(\w*)(?:['|"]?)\]/;
	//[]
	function splitByBracket(selector,domsLocated){
		
		var temp = [],
			attrResult = attrPattern.exec(selector),
			attrName,
			attrValue,
			attrRealPattern,
			testPattern;
		
		//console.log(selector)
		
		if(attrResult && attrResult.length>=4){
			attrName = attrResult[1];
			attrValue = attrResult[3];
			attrRealPattern = attrResult[2]  ;

			try{
				switch(attrRealPattern){
					case '^':testPattern = new RegExp('^'+attrValue);break;
					case '$':testPattern = new RegExp(attrValue+'$');break;
					case '*':testPattern = new RegExp(attrValue);break;
					default:
						testPattern = new RegExp('\\b'+attrValue+'\\b');break;
				}
			}catch(e){
				throw 'selector error';
			}
			console.log(domsLocated)

			temp = utils.filter(domsLocated,function(key,value){
				var domAttrName = value.getAttribute(attrName);
				//取不到显示设置的属性，尝试一下默认属性
				//console.log(domAttrName)
				if(domAttrName == undefined){
					domAttrName = value[attrName]
				}
				//console.log(domAttrName)
				if( !attrRealPattern && domAttrName != undefined) {
					return true;
				}else if( attrRealPattern && testPattern.test(domAttrName)){

					return true;
				}
							
			})
		}
		
		return temp
		
	}
	
	//：过滤选择器，有选择性的支持了常用的选择器，一些可能永远不会被用到的选择器就不要也罢
	function splitByColon(selector,domsLocated){

		//console.log(selector)
		
		var i , j ,
			currentColonFilters ,
			currentFilter ,
			execAry,
			temp = [];

		for(i in colonFilters){

			currentColonFilters = colonFilters[i];

			for(j in currentColonFilters){
				
				execAry = (new RegExp(j)).exec(selector);
				//console.log(j)
				//console.log(new RegExp(j));
				//console.log(execAry);
				if(execAry && execAry.length){
					currentFilter = currentColonFilters[j];
					temp = currentFilter(domsLocated,execAry);
					return temp;					
				}
			}

			
		}


		return temp;

	}

	
	//基本筛选器
	var colonBasicFilters = {
		'^even$':function(domsLocated,execAry){	//偶数
				var evenChild ;
				evenChild = utils.filter(domsLocated,function(key,value){
					if(key%2 === 0){
						return true;
					}
				})
				return evenChild ;
			},
		'^odd$':function(domsLocated,execAry){	//奇数
				var oddChild ;
				oddChild = utils.filter(domsLocated,function(key,value){
					if(key%2 != 0){
						return true;
					}
				})
				return oddChild ;
			},
		'^first$':function(domsLocated,execAry){
				//console.log(execAry)
				var first_child ;
				first_child = slice.call(domsLocated,0,1);
				//console.log(domsLocated)
				return first_child ;
			},
		'^last$':function(domsLocated,execAry){
				var last_child ;
				last_child = slice.call(domsLocated,domsLocated.length-1,domsLocated.length);
			
				return last_child ;
			},


		'^eq\\\((\\\d+)\\\)$':function(domsLocated,execAry){
				//console.log(domsLocated+'eq')
				var eqChild , index;
				if(execAry.length>1){
					index = execAry[1]*1;
				}	
				eqChild = slice.call(domsLocated , index , index+1);
				return eqChild;
			},		
		'^gt\\\((\\\d+)\\\)$':function(domsLocated,execAry){
				var gtChild , index;
				if(execAry.length>1){
					index = execAry[1]*1;
				}	
				gtChild = slice.call(domsLocated , index , domsLocated.length-1);
				return gtChild;
			},
		'^lt\\\((\\\d+)\\\)$':function(domsLocated,execAry){
				var ltChild , index;
				if(execAry.length>1){
					index = execAry[1]*1;
				}	
				ltChild = slice.call(domsLocated , 0 , index);
				return ltChild;
			},
		//not很复杂，待以后
		'\\bnot\\\((\\\.+)\\\)\\b':function(domsLocated,execAry){
				var notChild , selector;
				
				//console.log(execAry)
				
				notChild = utils.filter(domsLocated,function(key,value){
					return true;
				})
				
				return notChild
			}
	}
		
		
		
	//子元素筛选器，不是筛选他们的子元素，而是自己作为子元素被筛选。。。。
	var colonChildrenFilters = {
		'^first-child$':function(domsLocated,execAry){
			var childSet = [];		
			utils.each(domsLocated,function(key,value){
				var childs = children(value.parentNode);
				
				if(childs[0] == value){
					childSet.push(value)
				}
			})
									
			return childSet;
		},
		'^last-child$':function(domsLocated,execAry){
			var childSet = [],len,childs ;		
			utils.each(domsLocated,function(key,value){
				childs = children(value.parentNode);
				len = childs.length;
				if(childs[len-1] == value){
					childSet.push(value)
				}
			})
									
			return childSet;
		},
					//匹配当前元素是其父元素的第几个标签，从下标1开始的，很奇怪
		'^nth-child\\\((\\\w+)\\\)$':function(domsLocated,execAry){
											
			var childSet = [],
				childs,
				location,
				locationPattern = /(even)|(odd)|(\b\d+\b)|(?:(\d+)\w+)/i,
				locationPatternExecResult;
			
			location = execAry[1];
			locationPatternExecResult = locationPattern.exec(location);	
			
//												console.log(locationPatternExecResult)
			utils.each(domsLocated,function(domkey,domValue){
				
				childs = children(domValue.parentNode);
				
				if(locationPatternExecResult){
					utils.each(locationPatternExecResult,function(key,value){
						if(key !=0 && value){
							switch(value){
								case 'even':
									utils.each(childs,function(index,sibling){
										if(sibling == domValue && (index+1)%2 === 0){
											//console.log(index)
											childSet.push(domValue);
											return false;
										}
									})
									break;
								case 'odd':
									utils.each(childs,function(index,sibling){
										if(sibling == domValue && (index+1)%2 != 0){
											childSet.push(domValue);
											return false;
										}
									})
									break;
								default:
									utils.each(childs,function(index,sibling){
										if(sibling == domValue){
											if(key == 3 && (index+1) == value){
												childSet.push(domValue);
											}
											//console.log(key)
											
											//console.log(index)
											if(key == 4 && (index+1)%value === 0){
												//console.log(value)
												//console.log(key)
												//console.log((index+1)%value)
												childSet.push(domValue);
											}
											
											return false;
										}
									})
									break;
							}
							return false;
						}
					})
				}
			})
			
			
				
			
			
			return childSet;
		}
	}
		
	
		
	//表单筛选器
	var colonFormFilters = {
		'\\bbutton\\b':function(domsLocated,execAry){
							var temp = [],
								tagName,
								type;
							//console.log(domsLocated)
							temp = utils.filter(domsLocated,function(key,value){
								tagName = value.tagName;

								if(/(input)|(button)/i.test(tagName)){									
									//ie不显式设置type的值，会有不一样的行为，但是不应该修复，不一样的type恰恰是正确的行为
									type = value.type.toLowerCase;

									if(type == 'button'){
										return true;
									}
								}
							})
				
							return temp;
						},
		'\\bcheckbox\\b':function(domsLocated,execAry){
							var temp = [],
								tagName,
								type;
							temp = utils.filter(domsLocated,function(key,value){
								tagName = value.tagName;

								if(/input/i.test(tagName)){									
									
									type = value.type.toLowerCase;

									if(type == 'checkbox'){
										return true;
									}
								}
							})
							return temp;
						}
		/**   暂时注释掉，可能不太会用的到
		'\\bchecked\\b':function(domsLocated,execAry){},
		'\\bdisabled\\b':function(domsLocated,execAry){},
		'\\benabled\\b':function(domsLocated,execAry){},
		'\\bfile\\b':function(domsLocated,execAry){},
		'\\bimage\\b':function(domsLocated,execAry){},
		'\\binput\\b':function(domsLocated,execAry){},
		'\\bpassword\\b':function(domsLocated,execAry){},
		'\\bradio\\b':function(domsLocated,execAry){},
		'\\breset\\b':function(domsLocated,execAry){},
		'\\bselected\\b':function(domsLocated,execAry){},
		'\\bsubmit\\b':function(domsLocated,execAry){},
		'\\btext\\b':function(domsLocated,execAry){}
		**/
	}

	var colonFilters = {
		colonBasicFilters : colonBasicFilters,
		colonChildrenFilters : colonChildrenFilters,
		colonFormFilters : colonFormFilters
	}

	//dom查找方法
	function next(dom,sign){
	
		var nextSibling = dom.nextSibling;
		while( nextSibling && nextSibling.nodeType != 1){
			nextSibling = nextSibling.nextSibling;
		}
		
		//console.log(nextSibling)		
		if(sign && nextSibling){
			nextSibling = characteristicsFilter(sign,nextSibling);
		}
		
		
		return nextSibling;
	}
	
	function nexts(dom,sign){
		
		var nextSibilngs = [],
			nextSibling = next(dom);
		
		
		while(nextSibling){
			var isSuccessDom = characteristicsFilter(sign,nextSibling);
			//console.log(isSuccessDom)
			if(isSuccessDom != null){	//判断在循环里面进行，首先是找到了，才会可能发生push
				nextSibilngs.push(nextSibling);
			}
			nextSibling = next(nextSibling)
		}
		//console.log(nextSibilngs)		
		return nextSibilngs;
	}
	
	function children(dom,sign){
		var _children = dom.children ;
		//console.log(_children)
		_children = _children.length ? _children : [];
		_children = makeArray(_children);
		
		if(sign){
			_children = utils.filter(_children,function(key,value){
				var isSuccessDom = characteristicsFilter(sign,value);
				if(isSuccessDom != null){
					return true;
				}
			})
		}
				
		return _children;
	}
	
	var judgementIdCassTagPattern = /^([.|#])?(\w+)/; //用来检测id和class和tagName,判断array[2] === '.|#';

	//特征过滤
	function characteristicsFilter(sign,dom){
		var selectorVariety = judgementIdCassTagPattern.exec(sign);
		if(selectorVariety){
			switch(selectorVariety[1]){
				case '#':if(dom.id != selectorVariety[2]){
								dom = null;
							}
						break;
				case '.':if(!hasClass(selectorVariety[2],dom)){
							dom = null;
						}
						break;
				
				default:if(!checkTagName(selectorVariety[2],dom)){
							dom = null;	
						}
						break;
			}
		}
		return dom;
	}
	
	
	//判断一个dom元素是否包含这个class
	function hasClass(className,dom){
	
		clsNameAry = dom.className.split(/\s+/);
		
		//class名字 是区分大小写的
		for(i = 0;i<clsNameAry.length;i++){
			if(clsNameAry[i] == className){						
				return true;
			}
		}
		
		return false;
	}
	
	
	function checkTagName(tagName,dom){
		//console.log(dom.tagName)
		return tagName.toUpperCase() === dom.tagName.toUpperCase();
	}
	
	//########################################################
	
	
	function getAttribute(dom,attrStr){
		return dom.getAttribute(attrStr)
	}
	
	//sizzle.utils = utils;
	return  sizzle;
})