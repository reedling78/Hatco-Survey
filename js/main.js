
var o = {};
o.Views = {};
o.Models = {};

o.Router = Backbone.Router.extend({
	routes: {
		'': 'default',
		'default': 'default',
		'results': 'results',
		'admin': 'admin'
	},
	default: function(){
		o.stage.slideTo(0);
	},
	results: function(){
		o.resultsview.renderResults();
		o.stage.slideTo(1, function(){
			o.defaultview.reset();
		});
	},
	admin: function(){
		o.adminview.renderTable();
		o.stage.slideTo(2);
	},
});

o.Views.Stage = Backbone.View.extend({
	el: $('ul#stage'),
	currentPage : 0,
	initialize: function(){
		var view = this;

		$('#adminLink').on('dblclick', function(){
			o.router.navigate('/admin', true);
		})

		//resize stage to window size
		$(window).resize(function () { 
			view.resize();
		});
		view.resize();
	},
	resize: function(){
		var view = this;

		view.$el
			.css('height', $(window).height() + 'px')
			.css('width', ($(window).width()*3) + 'px');
		view.$el.find('li.page')
			.css('width', $(window).width() + 'px')
			.css('height', $(window).height() + 'px');
		view.$el.find('li.page footer')
			.css('width', $(window).width() + 'px');

		view.slideTo(view.currentPage);
	},
	slideTo: function(inc, callback){
		var view = this;
		view.currentPage = inc;
		view.$el.stop().animate({
			marginLeft: ($(window).width() * -1) * inc
		}, 500, function(){
			if(callback) callback();
		});
	}
});

o.Views.AdminView = Backbone.View.extend({
	el: $('li.admin'),
	events : {
		'click #clear': 'clearStorage'
	},
	renderTable: function(){
		this.determineStorageRemaining();
		var results = o.voteresults.getAllData();
		var questions = o.voteresults.questions;
		var t = '';


		//header Row
		t=t+ '<thead>'
		t=t+ '	<tr>'
		t=t+ '		<th></th>'
		for (var i = 0; i < questions.length; i++) {
			t=t+ '	<th>' + questions[i].text + '</th>';
		};
		t=t+ '	</tr>'
		t=t+ '</thead>'

		t=t+ '<tbody>'
		for (var i = 0; i < results.length; i++) {
			t=t+ '<tr>'
			t=t+ '	<td>' + results[i].date + '</td>'

			var data = JSON.parse(results[i].data);
			for (var x = 0; x < data.length; x++) {
				t=t+ '<td>' + data[x].count + '</td>'
			};

			t=t+ '</tr>'
		};
		t=t+ '</tbody>'

		$('li.admin table').html(t);

		var dif = 400;
		$(window).resize(function () { 
			$('tbody').css('height', ($(window).height() - dif) + 'px');
		});
		$('tbody').css('height', ($(window).height() - dif) + 'px');

		//prep export csv
		o.FileSystem.downloadCSV($('li.admin table').table2CSV());
	},
	determineStorageRemaining: function(){
		var percent = Math.round((JSON.stringify(localStorage).length / 2636625) * 100);
		$('span#percentUsed').html(percent);
	},
	clearStorage: function(){
		var r=confirm("Are you sure you want to clear your data?");
		if (r==true) {
			localStorage.clear();
			this.renderTable();
		} 
		return false;
	}
});

o.Views.ResultsView = Backbone.View.extend({
	initialize: function(){
		var view = this;

		//resize tables to window size
		$(window).resize(function () { 
			view.fixTableHeight();
			view.renderResults();
		});

		view.fixTableHeight();
	},
	el: $('li.results'),
	events : {
		'click #returntovote': 'back'
	},
	back: function(){
		o.router.navigate('/default', true);
		return false;
	},
	fixTableHeight: function(){
		var height = $(window).height() - 400;
		$('li.results table td.chipStack').css('height', height + 'px');
	},
	insertChips: function(colId, percent, chipPerPercent){
		var chipAlt = 1;

		$('li[data-val=' + colId + '] .chipStack').html('');

		for (var i = 0; i < (percent * chipPerPercent); i++) {
			$('li[data-val=' + colId + '] .chipStack')
				.prepend('<div class="chip' + chipAlt + '" style="z-index:' + i + '"></div>');

			chipAlt++;

			if(chipAlt == 4){ chipAlt = 1; }
		};
	},
	renderResults: function(){
		var results = o.voteresults.getPercent();
		var view = this;

		var firstChipHeight = 29;
		var chipHeight = 8;
		var totalStackHeight = ($(window).height() - 400) - firstChipHeight;
		var totalChips = Math.floor(totalStackHeight / chipHeight);
		var highPercent = 0;
		
		for (var i = 0; i < results.length; i++) { 
			if(highPercent < results[i].percent){
				highPercent = results[i].percent;
			}
		};

		for (var i = 0; i < results.length; i++) {
			var percent = (isNaN(results[i].percent)) ? 0 : results[i].percent;
			$('li.results ul')
				.find('li[data-val=' + results[i].id + '] div.percent')
				.html(percent + '<sup>%</sup>');
				view.insertChips(results[i].id, percent, (totalChips / highPercent));
		};
	}
});

o.Views.DefaultView = Backbone.View.extend({
	initialize: function(){
		
	},
	el: $('li.default'),
	events : {
		'click #submitvote': 'submit',
		'click #viewresults': 'viewresults',
		'click li>a': 'select'
	},
	submit: function(){
		var s = $('form a.selected').attr('data-val');

		if(s != undefined){
			o.voteresults.addVote(s);	
		}

		o.router.navigate('/results', true);
		
		setTimeout(function(){
			o.router.navigate('/default', true);
		}, 10000);

		return false;
	},
	select: function(e){
		this.reset();
		$(e.currentTarget).addClass('selected');
		return false;
	},
	reset: function(){
		$('form a').removeClass('selected');
	},
	viewresults: function(){
		o.router.navigate('/results', true);
		return false;
	}
});

o.Models.VoteResults = Backbone.Model.extend({
	questions: [
		{
			id: 1,
			text: 'Knock Your Socks Off Customer Service'
		},
		{
			id: 2,
			text: 'Product Quality'
		},
		{
			id: 3,
			text: 'Quick-Ship Program & Short Lead Times'
		},
		{
			id: 4,
			text: 'New Product Innovations'
		},
		{
			id: 5,
			text: '24/7 After-Sales Technical Service Support'
		}
	],
	addVote: function(selection){
		var dateString = this.todaysDateString();
		var currentCount = localStorage.getItem(dateString);

		if (currentCount) {
			currentCount = JSON.parse(currentCount);
		} else {
			currentCount = this.dailyResultArray();
		}

		for (var i = 0; i < currentCount.length; i++) {
			if(currentCount[i].id == selection){
				currentCount[i].count++
			}
		};

		localStorage.setItem(dateString, JSON.stringify(currentCount));
	},
	todaysDateString: function(){
		var d = new Date();
		return (d.getMonth()+1) + '-' + d.getDate() + '-' + d.getFullYear();
	},
	dailyResultArray: function(){
		var that = this;
		var blankArray = [];
		for (var i = 0; i < that.questions.length; i++) {
			blankArray.push({ 
				id: that.questions[i].id,
				count: 0,
				percent:0
			})
		};
		return blankArray;
	},
	getAllData: function(){
		var localStorageKeys = Object.keys(localStorage);
		var results = [];

		for (var i = 0; i < localStorageKeys.length; i++) {
			results.push({
				date: localStorageKeys[i],
				data: localStorage.getItem(localStorageKeys[i])
			});
		};

		return results;
	},
	getPercent: function(){
		var dateString = this.todaysDateString();
		var currentCount = localStorage.getItem(dateString);
		var total = 0;

		if (currentCount) {
			currentCount = JSON.parse(currentCount);
		} else {
			currentCount = this.dailyResultArray();
		}

		for (var i = 0; i < currentCount.length; i++) {
			total = total + currentCount[i].count;
		};

		for (var i = 0; i < currentCount.length; i++) {
			var percent = Math.round((currentCount[i].count / total) * 100);
			currentCount[i].percent = percent;
		};

		return currentCount;
		
	}
});

o.FileSystem = {
	dir: 'docs',
	filename: 'export.csv',
	downloadCSV: function(data){
		var that = this;
		window.requestFileSystem  = window.requestFileSystem || window.webkitRequestFileSystem;

		that.createDirectory(function(){
			that.createFile(data, function(){
				that.setLink();
			});
		});

	},
	createDirectory:function(callback){
		var that = this;
		window.requestFileSystem(window.TEMPORARY, 5*1024*1024, initFS, o.FileSystem.errorHandler);
		function initFS(fs){
			fs.root.getDirectory(that.dir, {create: true}, function(dirEntry) {
				console.log('You have just created the ' + dirEntry.name + ' directory.');
				callback();
			}, o.FileSystem.errorHandler);
		}
	},
	createFile: function(data, callback){
		var that = this;
		window.requestFileSystem(window.TEMPORARY, 5*1024*1024, initFS, o.FileSystem.errorHandler);
		function initFS(fs){
			fs.root.getFile(that.dir + '/' + that.filename, {create: true}, function(fileEntry) {

			fileEntry.createWriter(function(fileWriter) {

				fileWriter.onwriteend = function(e) {
					console.log('Write export.csv completed');
					callback();
				};

				fileWriter.onerror = function(e) {
					console.log('Write failed: ' + e.toString());
				};

				// Create a new Blob and write it to log.txt.
				var blob = new Blob([data], {type: 'text/csv'});

				fileWriter.write(blob);

				}, o.FileSystem.errorHandler);

			}, o.FileSystem.errorHandler);
		}
		
	},
	setLink: function(){
		var that = this;
		window.requestFileSystem(window.TEMPORARY, 5*1024*1024, initFS, o.FileSystem.errorHandler);
		function initFS(fs){
			fs.root.getFile(that.dir + '/' + that.filename, {}, function(fileEntry) {

				fileEntry.file(function(file) {
					var reader = new FileReader();

					reader.onloadend = function(e) {
						console.log('file path' + fileEntry.toURL());
						$('#export').attr('download', fileEntry.toURL()).attr('href', fileEntry.toURL());
					};

					reader.readAsText(file);
				}, o.FileSystem.errorHandler);

			}, o.FileSystem.errorHandler);
		}


	},
	errorHandler: function(err){
		var msg = 'An error occured: ';
		switch (err.code) {
			case FileError.NOT_FOUND_ERR:
				msg += 'File or directory not found';
				break;
			case FileError.NOT_READABLE_ERR:
				msg += 'File or directory not readable';
				break;
			case FileError.PATH_EXISTS_ERR:
				msg += 'File or directory already exists';
				break;
			case FileError.TYPE_MISMATCH_ERR:
				msg += 'Invalid filetype';
				break;
			default:
				msg += 'Unknown Error: ' + JSON.stringify(err);
				break;
		};
		console.log(msg);
	}
}

$(document).ready(function(){
	o.stage = new o.Views.Stage();
	o.voteresults = new o.Models.VoteResults();
	o.defaultview = new o.Views.DefaultView();
	o.resultsview = new o.Views.ResultsView();
	o.adminview = new o.Views.AdminView();
	o.router = new o.Router;

	window.navigate = function(path){
		router.navigate(path, true);
	};

	Backbone.history.start();
});




