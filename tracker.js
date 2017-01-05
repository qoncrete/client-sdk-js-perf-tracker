;(function(window, sourceID, tokenID)
{
	var url= window.location.href
	var logs= []
	var urlParseRE= /^(((([^:\/#\?]+:)?(?:(\/\/)((?:(([^:@\/#\?]+)(?:\:([^:@\/#\?]+))?)@)?(([^:\/#\?\]\[]+|\[[^\/\]@#?]+\])(?:\:([0-9]+))?))?)?)?((\/?(?:[^\/\?#]+\/+)*)([^\?#]*)))?(\?[^#]+)?)(#.*)?/;

	function init()
	{
		if( 'performance' in window && 'timing' in window.performance && 'JSON' in window )
		{
			logDoc()

			if( typeof window.performance.getEntriesByType==='function' ){
				logEntries()
			}
			
			post()
		}
	}

	function logDoc(){
		createEntry(window.performance.timing, url)
	}

	function logEntries()
	{
		var entries= window.performance.getEntriesByType('resource')
		for(var i= 0, len= entries.length; len > i; i++){
			createEntry(entries[i], undefined)
		}
	}

	function parseExtension(name)
	{
		var extension= ''
		try{
			var pathname= urlParseRE.exec(name)
			var filename= pathname[15]
			var parts= filename.split('.')
			if( parts.length>1)
				extension= parts.pop()
		}catch(e){}

		return extension
	}

	function getSize(entry, log)
	{
		var net= entry.transferSize
		var enc= entry.encodedBodySize
		var dec= entry.decodedBodySize

		if( !net && !enc && !dec )
			return

		if( net && !enc && !dec )
			{}//204
		else if( net && net!==enc && enc<=dec )
			log['cache']= 1, log['gzip']= 0//304
		else if( net>=enc && enc && enc===dec )
			log['cache']= 0, log['gzip']= 0//200
		else if( net>=enc && enc && enc<=dec )
			log['cache']= 0, log['gzip']= 1//200
		else if( !net && enc && enc===dec )
			log['cache']= 2, log['gzip']= 0
		else if( !net && enc && enc<=dec )
			log['cache']= 2, log['gzip']= 1

		log['net']= net
		log['enc']= enc
		log['dec']= dec
		if( net && enc && log['cache']===0 )
			log['head']= net - enc
	}

	function createEntry(entry, name)
	{
		var log= {wait: 0}

		if( name ){
			log['name']= name
			log['call']= 'html'
			if( document.referrer )
				log['_qreferrer']= document.referrer
		}
		else{
			log['name']= entry.name
			log['call']= entry.initiatorType
			// log['ref= url
		}

		var ext
		if( ext= parseExtension(entry.name) )
			log['ext']= ext

		if( entry.connectEnd && entry.connectEnd===entry.fetchStart )
			log['wait']= parseInt(entry.requestStart - entry.connectEnd, 10)
		else
			log['wait']= parseInt(entry.domainLookupStart - entry.fetchStart, 10)

		if( 0>log['wait'] )
			log['wait']= 0

		getSize(entry, log)


		log['rdir']= parseInt(entry.redirectEnd - entry.redirectStart, 10)
		log['dns']= parseInt( 0 < entry.domainLookupEnd - entry.domainLookupStart ? entry.domainLookupEnd - entry.domainLookupStart : 0 , 10)
		log['con']= parseInt(entry.connectEnd - entry.connectStart, 10)
		log['ssl']= parseInt(entry.secureConnectionEnd? (entry.connectEnd - entry.secureConnectionStart) : 0, 10)
		log['req']= parseInt(entry.responseStart - entry.requestStart, 10)
		log['res']= parseInt(entry.responseEnd - entry.responseStart, 10)
		
		log['get']= parseInt(log['req']+log['res'], 10)
		log['tot']= parseInt(log['con']+log['wait']+log['req']+log['res'], 10)

		if( 'domInteractive' in entry && 'fetchStart' in entry ){
			log['load']= parseInt(entry.loadEventEnd - entry.navigationStart, 10)
			log['dom']= parseInt(entry.domInteractive - entry.fetchStart, 10)
		}

		// log['_ = entry

		// console.log(log)
		logs.push(log)
	}

	// keep track of all names, and don't resend them, when this script is re-run on single page app with timeout
	// function addEvent(elem, event, fn)
	// {
	// 	if (elem.addEventListener) {
	// 		elem.addEventListener(event, fn, false)
	// 	} else {
	// 		elem.attachEvent('on' + event, function() {
	// 			// set the this pointer same as addEventListener when fn is called
	// 			return(fn.call(elem, window.event))
	// 		});
	// 	}
	// }

	setTimeout(init, 5000)

	// addEvent(window, 'beforeunload', function(){

	// })


	function post()
	{
		x= new(this.XMLHttpRequest || ActiveXObject)('MSXML2.XMLHTTP.3.0')
		x.open('POST', 'https://log.qoncrete.com/'+sourceID+'/batch?token='+tokenID, 1)
		x.setRequestHeader('Content-type', 'application/json')
		x.send(JSON.stringify(logs))
	}


})(window, 'f65dd4fe-2eee-4812-aa5e-aa948a2b290f', '4e976c1d-de95-4943-a9a2-19f64720d34c');
