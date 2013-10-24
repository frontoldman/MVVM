var url_prefix = '../lib/dom/';
define([url_prefix+'data/data',
	url_prefix+'effect/effect',
	url_prefix+'event/events',
	url_prefix+'event/domReady',
	url_prefix+'sizzle/sizzle',
	url_prefix+'style/style',
	'../lib/utils/utils'],function(data,animate,events,domReady,sizzle,style){
	
	var mvvm = {}
	//全局配置
	mvvm.trigger = 'data-bind';

	// For details, see http://stackoverflow.com/questions/14119988/return-this-0-evalthis/14120023#14120023
	var window = this || (0,eval)('this'),
	document = window.document;

	/*
	vm:object 绑定对象
	rootNode:根节点
	 */
	mvvm.bind = function(vm,rootNode){
		if(!(rootNode && /1|9/i.test(rootNode.nodeType))){
			rootNode  = document.body || document.documentElement;
		}

		var doms = getTriggerDoms(rootNode)
		console.log(doms)
	}

	function getTriggerDoms(rootNode){
		return sizzle('*['+ mvvm.trigger +']',rootNode)
	}

	return mvvm;
})