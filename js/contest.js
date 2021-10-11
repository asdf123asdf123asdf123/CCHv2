var contestAllList = [];
var contestInSecondPage = false;
var contestPerPage = 20;
var contestListCurrentPage = 1;
var contestListFilterResult = [], contestListSortResult = [];
var contestListFormatString = `<div class="contestInfoCard {7}"><div class="contestCardRealInfo"><div class="contestCardNameContainer"><div class="contestCardName" title="{0}">{0}</div><div class="contestCardTags">{1}</div></div><div class="contestPassedCount"><span class="contestCardPassedCount green">{2}</span><div class="contestCardOverall"><div class="contestCardUACCount red">{3}</div><div class="contestCardOverallCount">{4}</div></div></div></div><div class="contestCardTime"><span class="contestCardTimeSE">{5}</span><span class="contestCardTimeRunningType">{6}</span></div></div>`;
// [contestName, contestTags, solvedProblem, uacProblem, totalProblem, contestTime, contestRunning, highlightType]

// :type=...
// :time=...
// :id=...
// :ac=...
// :uac=...
// :pcnt=...

var contestListFilterRegex = [/^:type(=)([a-zA-Z]+)/, /^:mode(=)(.+)/, /^:time(>|=|<|>=|<=|!=)([0-9]+)$/, /^:id(>|=|<|>=|<=|!=)([0-9]+)$/, /^:ac(>|=|<|>=|<=|!=)([0-9]+)$/, /^:pcnt(>|=|<|>=|<=|!=)([0-9]+)$/];
var contestListFilterFuncs = [
function(args, info, op){
	return args.toLowerCase() == info[2].toLowerCase();
}, function(args, info, op){
	return args.toLowerCase() == getLimitedContestType(info[0]).toLowerCase();
}, function(args, info, op){
	var p = info[3];
	p = (new Date(p * 1000)).pattern("yyyyMMddhhmm");
	p = p.substring(0, args.length);
	if(p.length < args.length)	p += "0".repeat(args.length - p.length);
	return getOpResult(op, p, args);
}, function(args, info, op){
	return getOpResult(op, info[1], Number(args));
}, function(args, info, op){
	var q = getSolvedProblemsByContest.solvedProblemCountsByContestId[info[1]];
	if(q == undefined)	q = 0;
	return getOpResult(op, q, Number(args));
}, function(args, info, op){
	var q = getSolvedProblemsByContest.problemCountsByContestId[info[1]];
	if(q == undefined)	q = 0;
	return getOpResult(op, q, Number(args));
}];
function contestListFilter(args){
	args = args.split(" ");
	var contentFilter = [], tagFilter = [];
	for(var x in args){
		x = args[x];
		if(x == "")	continue;
		var isContentMatch = true;
		for(var i=0; i<contestListFilterRegex.length; i++)
			if(contestListFilterRegex[i].test(x))	isContentMatch = false;
		if(isContentMatch)
			contentFilter.push(x);
		else
			tagFilter.push(x);
	}
	delete contestListFilterResult;
	contestListFilterResult = [];
	for(var x in contestAllList){
		x = contestAllList[x];
		var passAllFilter = true;
		for(var v in contentFilter)
			if(x[0].toLowerCase().indexOf(contentFilter[v].toLowerCase()) == -1)
				passAllFilter = false;
		if(!passAllFilter)	continue;
		for(var v in tagFilter){
			v = tagFilter[v];
			for(var q in contestListFilterRegex)
				if(contestListFilterRegex[q].test(v))
					passAllFilter &= contestListFilterFuncs[q](contestListFilterRegex[q].exec(v)[2], x, contestListFilterRegex[q].exec(v)[1]);
		}
		if(!passAllFilter)	continue;
		contestListFilterResult.push(x);
	}
}
function contestListSort(useTime, incIf){
	delete contestListSortResult;
	contestListSortResult = JSON.parse(JSON.stringify(contestListFilterResult));
	function compareFunc(a, b){
		var inc = 0;
		if(useTime)
			inc = (a[3] < b[3]) ? -1 : ((a[3] == b[3]) ? 0 : 1);
		else{
			var p = getSolvedProblemsByContest.solvedProblemCountsByContestId[a[1]];
			var q = getSolvedProblemsByContest.solvedProblemCountsByContestId[b[1]];
			if(p == undefined)	p = 0;
			if(q == undefined)	q = 0;
			inc = (p < q) ? -1 : ((p == q) ? 0 : 1);
		}
		return incIf ? inc : -1 * inc;
	}
	contestListSortResult.sort(compareFunc);
}

function displayContestListPage(){
	$(".contestListMatchedCount").html(String(contestListSortResult.length) + ' / ' + String(contestAllList.length));
	if(contestListSortResult.length == 0){
		$(".contestSearch .searchPageBottom").html(`<div style="width: 100%; height: 100%; display: grid; place-items: center; text-align: center"><div><span style="display: inline-block" class="fas fa-exclamation-triangle fa-4x"></span><br/><div class="popTip">${localize('noMatchedContest')}</div></div></div>`)
		$(".contestSearch .searchPageCurrentPage").html("1");
		$(".contestSearch .searchPageOverallPage").html("/1");
		return;
	}
	var l = (contestListCurrentPage - 1) * contestPerPage;
	var r = l + contestPerPage - 1;
	r = Math.min(r, contestListSortResult.length - 1);
	$(".contestSearch .searchPageCurrentPage").html(contestListCurrentPage);
	$(".contestSearch .searchPageOverallPage").html("/" + Math.ceil(contestListSortResult.length / contestPerPage));
	$(".contestSearch .searchPageBottom").html('');
	for(var i=l; i<=r; i++){
		var x = contestListSortResult[i];
		var rep = [0, 0, 0, 0, 0, 0, 0, (i - l) % 2 == 0 ? "" : "highlightedContestList"];
		rep[0] = x[0];
		rep[1] = "";
		var tgList = [];
		tgList.push("#" + x[1]);
		tgList.push(x[2]);
		if(getContestType(x[0]) != undefined)
			tgList.push(getContestType(x[0]));
		for(var j in tgList){
			j = tgList[j];
			rep[1] += `<span class='contestCardTag'>${j}</span>`;
		}
		if(getSolvedProblemsByContest.problemCountsByContestId[x[1]] == undefined){
			rep[2] = "";
			rep[3] = "";
			rep[4] = "n/a";
		}
		else{
			rep[4] = getSolvedProblemsByContest.problemCountsByContestId[x[1]];
			rep[2] = getSolvedProblemsByContest.solvedProblemCountsByContestId[x[1]];
			rep[3] = "";
			rep[4] = '/' + rep[4];
		}
		rep[5] = `<span class="fas fa-clock"></span> ${(new Date(x[3] * 1000)).pattern("yyyy-MM-dd hh:mm")} >>> ${(new Date((x[3] + x[4]) * 1000)).pattern("yyyy-MM-dd hh:mm")}`;
		var rtList = [`<span><span class="fas fa-clock"></span> ${localize('contestListStart')}</span>`
					, `<span class="red"><span class="fas fa-running"></span> ${localize('contestListRun')}</span>`
					, `<span class="green"><span class="fas fa-check"></span> ${localize('contestListEnd')}</span>`];
		if((new Date()).getTime() <= x[3] * 1000)
			rep[6] = 0;
		else if((new Date()).getTime() <= (x[3] + x[4]) * 1000)
			rep[6] = 1;
		else
			rep[6] = 2;
		rep[6] = rtList[rep[6]];
		$(".contestSearch .searchPageBottom").append(contestListFormatString.format(rep));
	}
}

function loadContestList(){
	$(".contestListLoadIf").css("cursor", "default");
	$(".contestListLoadIf").unbind("click");
	$(".contestListLoadIf").html(`<span class='fas fa-hourglass-half'></span> ` + localize("loading"));
	$.ajax({
		url: settings.codeforcesApiUrl + '/contest.list',
		type: "GET",
		timeout : settings.largeTimeLimit,
		success: function(data){
			var _contestAllList = [];
			data = data.result;
			$(".contestListLoadIf").html(`<span class='fas fa-hourglass-half'></span> ` + localize("loadingAcCount"));
			loadContestPassedStatus(function(){
				for(var i=0; i<data.length; i++)
				_contestAllList.push([data[i].name, data[i].id, data[i].type, data[i].startTimeSeconds, data[i].durationSeconds]);
				contestAllList = _contestAllList;
				contestListCurrentPage = 1;
				var q = $(".contestListSearchArea > input").val();
				contestListFilter(q);
				var x = $(".contestSortOption").children().eq(0).hasClass("chosen");
				var y = $(".contestDirectionOption").children().eq(1).hasClass("chosen");
				contestListSort(x, y);
				displayContestListPage();
				$(".contestListLoadIf").html(`<span class='fas fa-check green'></span> ` + localize("success"));
				$(".contestListLoadIf").css("cursor", "pointer");
				$(".contestListLoadIf").unbind("click").click(function(){
					loadContestList();
				})
			}, function(){
				$(".contestListLoadIf").html(`<span class='fas fa-times red'></span> ` + localize("failed"));
				$(".contestListLoadIf").css("cursor", "pointer");
				$(".contestListLoadIf").unbind("click").click(function(){
					loadContestList();
				})
			})
		},
		error: function(){
			$(".contestListLoadIf").html(`<span class='fas fa-times red'></span> ` + localize("failed"));
		}
	})
}
var ifInitContestPage = false;
$(".NavBarContent").eq(2).click(function(){
	if(!contestInSecondPage){
		displayContestListPage();
		if(!ifInitContestPage)
			loadContestList();
		ifInitContestPage = true;
		return;
	}
})
$(".contestListSearchArea > input").bind('input propertychange', function(){
	contestListCurrentPage = 1;
	var q = $(this).val();
	contestListFilter(q);
	var x = $(".contestSortOption").children().eq(0).hasClass("chosen");
	var y = $(".contestDirectionOption").children().eq(1).hasClass("chosen");
	contestListSort(x, y);
	displayContestListPage();
})
$(".contestSearch .searchArgumentsItem").click(function(){
	var x = $(".contestSortOption").children().eq(0).hasClass("chosen");
	var y = $(".contestDirectionOption").children().eq(1).hasClass("chosen");
	contestListSort(x, y);
	displayContestListPage();
})
$(".contestSearch .searchPagesButton").eq(0).click(function(){
	var l = 1, r = Math.max(1, Math.ceil(contestListSortResult.length / contestPerPage));
	contestListCurrentPage = 1;
	displayContestListPage();
})
$(".contestSearch .searchPagesButton").eq(1).click(function(){
	var l = 1, r = Math.max(1, Math.ceil(contestListSortResult.length / contestPerPage));
	contestListCurrentPage = Math.max(l, contestListCurrentPage - 1);
	displayContestListPage();
})
$(".contestSearch .searchPagesButton").eq(2).click(function(){
	var l = 1, r = Math.max(1, Math.ceil(contestListSortResult.length / contestPerPage));
	contestListCurrentPage = Math.min(r, contestListCurrentPage + 1);
	displayContestListPage();
})
$(".contestSearch .searchPagesButton").eq(3).click(function(){
	var l = 1, r = Math.max(1, Math.ceil(contestListSortResult.length / contestPerPage));
	contestListCurrentPage = r;
	displayContestListPage();
})