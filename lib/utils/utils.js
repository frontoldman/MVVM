define(function(){
	var utils = {}
	

	//取得数据类型
	function getType(obj){
		return Object.prototype.toString.call(obj).slice(8,-1);	
	}
	
	//each
	function each(obj,callback){
		var continueLoop ,type = getType(obj),i = 0;
		//判断数组、nodeList的遍历
		//console.log(typeof obj )
		if(type === 'Array' ||   obj.item ){
			for(var len = obj.length;i<len;i++){
				continueLoop = callback.call(obj[i],i,obj[i],type);
				if(continueLoop === false){
					break;
				}
			}
		}else if(type === 'Object'){
			for(i in obj){
				continueLoop = callback.call(obj[i],i,obj[i],type);
				if(continueLoop === false){
					break;
				}
			}
		}
	}
	
	
	
	//TODO:没有进行深复制，过滤复杂对象时会有引用的问题
	//过滤函数,并生成一个新对象返回
	function filter(obj,callback){
		var newObj,type = getType(obj);
		

		each(obj,function(key,value,type){
			var filterValue = callback.call(this,key,value);
			if(filterValue === true){

				if(type === 'Array' ||  obj.item  ){
					if(!newObj){
						newObj = [];
					}
					newObj.push(value);
				}else{
					if(!newObj){
						newObj = {};
					}
					newObj[key] = value;
				}
			}
		})
		
		return newObj ? newObj : type === 'Array' ? [] : {};
	}

	//去除字符串两端空格
	function trim(str){
		return String.prototype.trim ?
				str.trim():
				str.replace(/^\s+|\s+$/g,'');
	}
	
	//对象的扩展
	function extend() {
		
		function copy(target,src,isDeepCopy){

			//目标元素必须是Object对象
			if(typePattern.test(getType(target)) && typePattern.test(getType(src))){
				
				each(src,function(key,value){

					if(target[key]){	//相同key直接覆盖
						//return ;
					}

					var type = getType(value),temp;
					if(isDeepCopy === true && typePattern.test(type)){
						if(type === 'Array'){
							temp = [];
						}else if(type === 'Object'){
							temp = {};
						}
						
						target[key] = extend(isDeepCopy,temp,value);	//递归下去复制元素
					}else{
						target[key] = value;
					}
					
				})
			
			}
		}
		
		
		var target,
			src,
			isDeepCopy,
			len = arguments.length,
			typePattern = /Array|Object/;//判断是不是可以扩展的元素，只有Array和Object可以扩展
		
		switch(len){
			
			case 0:
			case 1:break;
		
			case 2:
				target = arguments[0];
				src = arguments[1];
				
				copy(target,src);
				
				break;
			
			default:
				var maxLen;
				isDeepCopy = arguments[0];
				//判断第一个参数是否为true,来确定如何为哪个参数扩展那些个对象
				maxLen = isDeepCopy === true ? 2 : 1 ;
				target = arguments[maxLen-1];
				for(i = maxLen; i < len ; i++){
					copy(target,arguments[i],isDeepCopy);
				}

				break;
		}
		
		return target;
	};
	
	
	
	
	utils.getType = getType;
	utils.each = each;
	utils.trim = trim;
	utils.extend = extend;
	utils.filter = filter;
	
	return utils;
})