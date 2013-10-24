define(['.../utils/utils'],function(utils){
	
	var isIE = document.documentElement.currentStyle,
		de=document.documentElement;

	//兼容性的样式映射表
	var propMapping = {
		'float':'styleFloat',
		'opacity':'filter'
	}

	var camelPattern = /\-(\w{1})/ig;
	var rNumnopx = /(em|pt|mm|cm|pc|in|ex|rem|vw|vh|vm|ch|gr)$/i;
	//格式化差异化的css属性值
	var formatProp = function(prop){
		
		prop = prop.replace(camelPattern,function($1,$2){
			return $2.toUpperCase();
		})

		return prop;
	}

	/**
		为了方便，所有的domObj，均为原生dom元素
	**/
	//z-index :如果不设置，有些浏览器返回auto,就是0。
	//visibility ie不设置就是inherit 继承的
	//overflow 不显示设置 就是visible
	var getStyleFn = function(elem,prop){
						
						var styleResult;

						prop = formatProp(prop);

						if(window.getComputedStyle){

							styleResult = window.getComputedStyle( elem, null )[prop];
							
							//auto全部置为0
							styleResult = /auto/i.test(styleResult) ? 0 : styleResult;

						}else{
							
							prop = propMapping[prop] ? propMapping[prop] : prop;							
							styleResult = elem.currentStyle[prop];

							if(IEStyleGet[prop]){
								styleResult = IEStyleGet[prop](styleResult,elem);
							}

							//console.log(prop,styleResult)
							//From http://erik.eae.net/archives/2007/07/27/18.54.15/#comment-102291
			                if (rNumnopx.test(styleResult)){

			                	var style = elem.style.left;  

				                var runtimeStyle = elem.runtimeStyle.left; 

				                elem.runtimeStyle.left = elem.currentStyle.left;

				                elem.style.left = styleResult || 0; 

				                styleResult = elem.style.pixelLeft + 'px';  

				                elem.style.left = style;  

				                elem.runtimeStyle.left = runtimeStyle;  

			                };  
				                
				            

							/**
							//pt em 转换成 px
							var unitCheck = rNumnopx.exec(styleResult);

							styleResult = unitCheck ? getPxNum[unitCheck[2].toLowerCase()](unitCheck) : 
														styleResult;
							**/													
						}
						
						return 	styleResult;						
					}

	var getPxNum = {
		'pt':function(unitCheck){
			return unitCheck[1]*4/3 + 'px';
		},
		'em':function(unitCheck){
			return unitCheck[1]*16 + 'px';
		}
	}
	
	var IEStyleGet = {
		//IE 7 8 透明度获取hack
		'filter':function(styleResult){

			if(!styleResult){
				return 1;
			}

			var opacityAry = /alpha\(opacity\=(\d+)\)/.exec(styleResult);
			if(opacityAry && opacityAry.length>=2){
				styleResult = opacityAry[1];
				styleResult = styleResult/100;
			}

			return styleResult;
		},
		'width':function(styleResult,elem){
			 
			 return getWidthOrHeight('width',styleResult,elem);
		},
		'height':function(styleResult,elem){

			return getWidthOrHeight('height',styleResult,elem);
		},
		'left':function(styleResult,elem){
			return getLeftOrTop('left',styleResult,elem);
		},
		'top':function(styleResult,elem){
			return getLeftOrTop('top',styleResult,elem);
		}
	}
	

	//IE下面获取宽度和高度
	var getWidthOrHeight = function(name,styleResult,elem){

		var ret = styleResult;

		if(!/\d+(px)$/.test( styleResult )){

			var paddingRet = name === 'width' ? ['left','right'] 
										:['top','bottom'];

			ret = parseFloat(elem[ formatProp('client-' + name) ] , 10)  	
				- parseFloat(getStyleFn( elem , 'padding-' + paddingRet[0])) 
				- parseFloat(getStyleFn( elem , 'padding-' + paddingRet[1]));

			ret = ret + 'px';

		}

		return ret;
	}

	//IE 下面取得top和left值
	var getLeftOrTop = function(name,styleResult,elem){

		var ret = styleResult;

		if(!/\d+(px)$/.test( styleResult )){

			var position = getStyleFn(elem,'position');

			if(/(absolute|relative|fixed)/.test(position)){
				var margin = getStyleFn(elem , 'margin-' + name);
				margin = /auto/i.test(margin) ? 0 : margin ;
				ret = parseFloat(elem[ formatProp('offset-' + name) ],10) 
					- parseFloat( margin,10);
			}

		}

		return ret;

	}
	
	var setStyleFn = function(elem,prop,value){

		if(!elem || !prop){
			return;
		}

		var propType = utils.getType(prop);
		if(propType === 'String'){
			if(!value) return;
			prop = formatProp(prop);
			if(prop == 'opacity' && isIE){
				prop = 'filter';
				value = parseInt(value) > 1 ? value :value*100;
				value = 'alpha(opacity='+ value +')';
				elem.style['zoom'] = 1;
			}
			elem.style[prop] = value;
		}else if(propType === 'Object'){
			utils.each(prop,function(key,value){
				setStyleFn(elem,key,value);
			})
		}
	}

	//from CJ
	function getOffsetNormal(elem) {

		var x=0,y=0;
		if (elem == de) {
			return {
				x:de.scrollLeft,
				y:de.scrollTop
			};
		}
		while (elem) {
			x+=elem.offsetLeft;
			y+=elem.offsetTop;
			elem=elem.offsetParent;
			if (elem && elem!=de) {
				x+=elem.clientLeft;
				y+=elem.clientTop;
			}
		}
		return {
			left:x,
			top:y
		};
	}

	var getOffset = function(elem){

		if(de.getBoundingClientRect){
			return elem.getBoundingClientRect();
		}

		return getOffsetNormal(elem); 
	}



	var getSize = function(elem){
		return {
			width:elem.clientWidth,
			height:elem.clientHeight
		}
	}
	
	var style = function(elem){
		
	}
	
	style.get = getStyleFn;
	style.set = setStyleFn;
	style.getOffset = getOffset;
	style.getSize = getSize;

	return  style;
})