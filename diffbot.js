var token;
var diffbotApi = {
	"article" : "http://api.diffbot.com/v2/article",
	"crawlbot" : "http://api.diffbot.com/v2/crawl",
};

$("#apiselect ul li a").on("click",function(){
	$("#apiused").val($(this).text());
});

$("form").on("submit",function(event){
	event.preventDefault();
	var url = $("#url_scrape").val();
	var apiselected = $("#apiused").val() || "Article";
	$("#url_scrape").val("");
	token = $("#token").val();
	$("#token").val("");
	getUrl(url,apiselected);

});

function getUrl(url,apiselected){
	$(".output").append("<div class='col-md-8'><p>The URL given was <b>"+url+"</b> and api used was <b>"+apiselected+"</b></p></div>");
	switch(apiselected){
		case "Article":
			var data = {
				token:token,
				url:url,
				fields:"*"
			};
			useApi(diffbotApi["article"],data,displayData,"json");
			break;
		case "Crawlbot":
			var data = {
				token:token,
				name:"diffbotspider6",
				seeds:url,
				apiUrl:diffbotApi["article"],
				maxToCrawl:10,
				maxToProcess:10,
				urlCrawlPattern: "Mobilephones",
				urlProcessPattern: "Mobilephones",
				obeyRobots: 0
			};
			useApi(diffbotApi["crawlbot"],data,afterCrawl,"json");
			break;

	}

}

function afterCrawl(data){
	setTimeout(function(){
		if (data.jobs[0].jobStatus.status==9){
			var dataurl = data.jobs[0].downloadJson;
			var csvurl = data.jobs[0].downloadUrls;
			$.getJSON(dataurl,function(data){
				displayData(data);
			});
			$(".downloads").append("<li><a  target='_blank' href="+dataurl+">Download Processed Data</a></li>");
			$(".downloads").append("<li><a  target='_blank' href="+csvurl+">Download Urls Data</a></li>");
		} else{
			useApi(diffbotApi["crawlbot"],{token:token,name:data.jobs[0].name},afterCrawl,"json");
		}
	},20000);
}


function useApi(api,data,postProcess,datatype){
	$.ajax({
		type: "GET",
		url: api,
		data:data,
		dataType: datatype,
	})
	.done(function(data) {
		postProcess(data);
	})
	.fail(function(res) {
		console.log(res);
	})
	.always(function() {
		console.log( "complete" );
	});
}

function displayData(data){
	console.log(data);
}
