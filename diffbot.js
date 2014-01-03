var token;
var diffbotApi = {
	"article" : "http://api.diffbot.com/v2/article",
	"crawlbot" : "http://api.diffbot.com/v2/crawl",
};

var apiused;

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
	$(".output").children().remove();
	getUrl(url,apiselected);

});

function getUrl(url,apiselected){
	$(".output").append("<div class='row'><p>The URL given was <b>"+url+"</b> and api used was <b>"+apiselected+"</b></p></div>");
	apiused = apiselected;
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
			$(".downloads").children().remove();
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
	if(apiused == "Crawlbot"){
		drawChart(data[0].categories);
		if(data[0].media){
			d3.select(".output").selectAll("img")
				.data(data[0].media)
				.enter().append("img")
				.attr("src",function(d){ return d.link;});
		}
	} else{
		drawChart(data.categories);
		if(data.images){
			var cap = d3.select(".output").append("div").attr("class","row").selectAll("div")
					.data(data.images)
					.enter().append("div");

			cap.append("img")
				.attr("src",function(d){ return d.url;});
			cap.append("h3").text(function(d){ return d.caption});
		}
	}
}

function drawChart(data){

	var margin = {top: 20, right: 20, bottom: 120, left: 40},
    width = 900 - margin.left - margin.right,
    height = 400 - margin.top - margin.bottom;

	var x = d3.scale.ordinal()
	    .rangeRoundBands([0, width], .1);

	var y = d3.scale.linear()
	    .range([height, 0]);

	var xAxis = d3.svg.axis()
	    .scale(x)
	    .orient("bottom");

	var yAxis = d3.svg.axis()
	    .scale(y)
	    .orient("left")
	    .ticks(10, "%");

	var svg = d3.select(".output").append("div").attr("class","row").append("svg")
	    .attr("width", width + margin.left + margin.right)
	    .attr("height", height + margin.top + margin.bottom)
	  .append("g")
	    .attr("transform", "translate(" + margin.left + "," + margin.top + ")");

    var keys = d3.keys(data);
    var values = d3.values(data);
    values = values.map(function(d){
    	d = +d;
    	return d;
    });

	x.domain(keys);
	y.domain([0, d3.max(values)]);

	svg.append("g")
	  .attr("class", "x axis")
	  .attr("transform", "translate(0," + height + ")")
	  .call(xAxis)
		.selectAll("text")  
		.style("text-anchor", "end")
		.attr("dx", "-.8em")
		.attr("dy", ".15em")
		.attr("transform", function(d) {
			return "rotate(-65)" 
		});

	svg.append("g")
	  .attr("class", "y axis")
	  .call(yAxis)
	.append("text")
	  .attr("transform", "rotate(-90)")
	  .attr("y", 6)
	  .attr("dy", ".71em")
	  .style("text-anchor", "end")
	  .text("Frequency");

	svg.selectAll(".bar")
	  .data(keys)
	.enter().append("rect")
	  .attr("class", "bar")
	  .attr("x", function(d,i) { return x(d); })
	  .attr("width", x.rangeBand())
	  .attr("y", function(d,i) { return y(values[i]); })
	  .attr("height", function(d,i) { return height - y(values[i]); });

}