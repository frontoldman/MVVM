define(function(){

	"use strict";

	var cacheData = {},
		uuid = 1,
		expando = 'cache' + ( +new Date() + "" ).slice( -8 );  // 生成随机数
	
	
	

		//nodeType : 1||9 dom 或者 document
		var data = function(elem,val,data){
			var index,
				myCache;
			//elem.x = {x:{x:1}}
			/**
			dom可以缓存数据，用cacheData是不是有为了 data有统一入口 对外部是关闭的
			**/
			if(elem.window || /\b[1|9]\b/.test(elem.nodeType)){
				index = elem[expando];
				if(!index){
					elem[expando] = ++uuid ;
					index = uuid;
					cacheData[index] = {};
				}

				myCache = cacheData[index];
				if(!data) {
					return myCache[val];
				}
				
				myCache[val] = data;

				return data;
			}

			return null;
		}
		
		
		
		data.remove = function(elem,val,data){
			var index,
				myCache,
				myCacheVal,
				i = 0,
				len;

			if(elem.window || /\b[1|9]\b/.test(elem.nodeType)){
				index = elem[expando];
				if(!index){
					return null;
				}
				myCache = cacheData[index];
				myCacheVal = myCache[val];
				if(myCacheVal){
					if(!data){
						myCache[val] = null;
						return myCacheVal;
					}
					for(len = myCacheVal.length ; i<len ; i++){
						if(data == myCacheVal[i]){
						   return myCacheVal.splice(i,1);
						}
					}
				}
				
			}

			return null;

		}
	

	return data;
})