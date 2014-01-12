#!node

var String_random = require("string_random.js").String_random;

var SignalReports = function () {
	this.inputDialog = $('#input-form');
	this.inputForm   = $('#input-form form');
	this.inputDelete = $('#delete');
	this.inputs = {
		callsign  : element(by.model('editingReport.callsign')),
		frequency : element(by.model('editingReport.frequency')),
		mode      : element(by.model('editingReport.mode')),
		date      : element(by.model('editingReport.date')),
		time      : element(by.model('editingReport.time')),
		ur_rst    : element(by.model('editingReport.ur_rst')),
		my_rst    : element(by.model('editingReport.my_rst')),
		name      : element(by.model('editingReport.name')),
		address   : element(by.model('editingReport.address')),
		memo      : element(by.model('editingReport.memo'))
	};

	this.openForm = function () {
		$('a[href="#new"]').click();
	};

	this.submitForm = function () {
		$('#input-form form input[type=submit]').click();
	};

	this.getReportRow = function (n) {
		var row = by.repeater('report in reports').row(0);
	};

	this.createNewReport  = function (data) {
		if (!data) data = {};

		if (data.datetime) {
			var now = data.datetime instanceof Date ? data.datetime : new Date(data.datetime);
			data.date = 
				now.getFullYear() + '-' +
				String(now.getMonth() + 101).slice(1) + '-' +
				String(now.getDate() + 100).slice(1);

			data.time = 
				String(now.getHours() + 100).slice(1) + ':' +
				String(now.getMinutes() + 100).slice(1);
		}

		if (!data.callsign) data.callsign = String_random(/J[A-Z][0-9][A-Z]{3}/);
		if (!data.frequency) data.frequency =  String_random(/7\.\d{3}/);
		if (!data.mode) data.mode = String_random(/(CW|SSB|FM|AM|RTTY)/);
		if (!data.date) data.date = String_random(/200\d-(0[1-9]|1[0-2])-([1-2][1-9]|3[01])/);
		if (!data.time) data.time = String_random(/(0[0-9]|1[0-2]):[1-5][0-9]/);
		if (!data.ur_rst) data.ur_rst = String_random(/\d{3}/);
		if (!data.my_rst) data.my_rst = String_random(/\d{3}/);
		data.tz = 0;

		this.exec(function (data, callback) {
			angular.injector(['signalReportsApp']).invoke(function (Reports) {
				var report = new Reports();
				for (var key in data) if (data.hasOwnProperty(key)) report[key] = data[key];
				report.$save(callback);
			});
		}, data);

		return data;
	};

	this.exec = function (func) {
		var args = Array.prototype.slice.call(arguments, 0);
		args[0] = '('+ (func.toString()) + ').apply(null, arguments);';
		browser.executeAsyncScript.apply(browser, args);
	};
};



describe("SignalReports", function () {

	beforeEach(function() {
		browser.get('/');
	});

	it("should post new report", function () {
		var signalReports = new SignalReports();

		signalReports.openForm();
		expect(signalReports.inputDialog.isDisplayed()).toBe(true);

		signalReports.inputs.callsign.sendKeys('JH1UMV');
		signalReports.inputs.mode.sendKeys('CW');
		signalReports.inputs.frequency.sendKeys('7.1');

		signalReports.inputs.ur_rst.click();

		expect(signalReports.inputs.date.getAttribute('value')).toMatch(/^\d\d\d\d-\d\d-\d\d$/);
		expect(signalReports.inputs.time.getAttribute('value')).toMatch(/^\d\d:\d\d$/);

		signalReports.inputs.ur_rst.sendKeys('599');
		signalReports.inputs.my_rst.sendKeys('589');
		signalReports.inputs.memo.sendKeys('TEST MEMO');
		signalReports.inputs.name.sendKeys('HIRO');

		signalReports.submitForm();

		var row = by.repeater('report in reports').row(0);
		expect(element(row.column('callsign')).getText()).toEqual('JH1UMV');
		expect(element(row.column('mode')).getText()).toEqual('CW');
		expect(element(row.column('frequency')).getText()).toEqual('7.1');
		expect(element(row.column('ur_rst')).getText()).toEqual('599');
		expect(element(row.column('my_rst')).getText()).toEqual('589');
		expect(element(row.column('datetime')).getText()).toMatch(/^\d\d\d\d-\d\d-\d\d \d\d:\d\d$/);
		expect(element(row.column('address')).getText()).toEqual('Japan');
		expect(element(row.column('memo')).getText()).toEqual('TEST MEMO');
		expect(element(row.column('name')).getText()).toEqual('HIRO');
	});

	it("should post edit report", function () {
		var signalReports = new SignalReports();
		element(by.repeater('report in reports').row(0)).click();

		expect(signalReports.inputDialog.isDisplayed()).toBe(true);
		expect(signalReports.inputDelete.isDisplayed()).toBe(true);
		expect(element(by.binding('editType')).getText()).toMatch(/Edit/);

		signalReports.inputs.callsign.clear();
		signalReports.inputs.callsign.sendKeys('JH1UMVV');

		signalReports.inputs.ur_rst.click();

		signalReports.inputs.memo.clear();
		signalReports.inputs.memo.sendKeys('TEST MEMO2');

		signalReports.submitForm();

		var row = by.repeater('report in reports').row(0);
		expect(element(row.column('mode')).getText()).toEqual('CW');
		expect(element(row.column('frequency')).getText()).toEqual('7.1');
		expect(element(row.column('ur_rst')).getText()).toEqual('599');
		expect(element(row.column('my_rst')).getText()).toEqual('589');
		expect(element(row.column('datetime')).getText()).toMatch(/^\d\d\d\d-\d\d-\d\d \d\d:\d\d$/);
		expect(element(row.column('address')).getText()).toEqual('Japan');
		expect(element(row.column('name')).getText()).toEqual('HIRO');

		expect(element(row.column('callsign')).getText()).toEqual('JH1UMVV');
		expect(element(row.column('memo')).getText()).toEqual('TEST MEMO2');
	});


	it("should delete a report", function () {
		var signalReports = new SignalReports();
		var alert;
		element(by.repeater('report in reports').row(0)).click();

		expect(signalReports.inputDialog.isDisplayed()).toBe(true);
		expect(signalReports.inputDelete.isDisplayed()).toBe(true);
		expect(element(by.binding('editType')).getText()).toMatch(/Edit/);

		signalReports.inputDelete.click();
		alert = browser.switchTo().alert();
		expect(alert.getText()).toMatch(/Sure/);
		alert.dismiss();

		expect(signalReports.inputDialog.isDisplayed()).toBe(true);
		expect(signalReports.inputDelete.isDisplayed()).toBe(true);

		signalReports.inputDelete.click();
		alert = browser.switchTo().alert();
		expect(alert.getText()).toMatch(/Sure/);
		alert.accept();

		expect(signalReports.inputDialog.isDisplayed()).toBe(false);
		expect(signalReports.inputDelete.isDisplayed()).toBe(false);
	});
	
	it("should have pager", function () {
		var signalReports = new SignalReports();
		var dt = 1, reports = [];
		for (var i = 0; i < 11; i++) {
			reports.unshift(signalReports.createNewReport({ datetime: dt++ }));
		}

		browser.navigate().refresh();

		expect(element.all(by.repeater('report in reports')).count()).toBe(5);

		var row = by.repeater('report in reports').row(0);
		expect(element(row.column('callsign')).getText()).toEqual( reports[0].callsign );

		expect($('#more').isDisplayed()).toBe(true);

		$('#more').click();
		expect(element.all(by.repeater('report in reports')).count()).toBe(10);
		expect($('#more').isDisplayed()).toBe(true);

		$('#more').click();
		expect(element.all(by.repeater('report in reports')).count()).toBe(14);
		expect($('#more').isDisplayed()).toBe(false);
	});

});


