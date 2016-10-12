var chai = require('chai'),
	expect = chai.expect,
	spies = require('chai-spies'),

	jsdom = require('jsdom'),
	Faker = require('./faker'),
	Module = require('../index');

chai.use(spies);
var spy = chai.spy;

beforeEach(function() {
	Module.clearHash();
	var self = this;
	this.j = function(html, cb) {
		if (typeof html == 'function') cb = html;
		jsdom.env('', function(err, window) {
			$ = require('jquery')(window);
			self.window = window;
			Faker.setJQuery($);
			self.form = Faker.create('femm');
			$('body').append(self.form.$form);
			cb($);
		});
	};
});

it('Init', function() {
	
});

describe('Check if email field is validated for each trigger type', function() {
	it('submit', function(cb) {
		var t = this;
		this.j(function($) {
			var inst = Module.initField(t.form.$field);
			var spy = chai.spy.on(inst, 'validate');
			t.form.$form.submit();
			expect(spy).to.have.been.called();
			cb();
		});
	});
	describe('focusout', function() {
		it('#run should not be called if the focus event was triggered immidiately after blur', function(cb) {
			Module.setOptions({triggerType: ['focusout', 'submit'], focusoutDelay: 200});
			var t = this;
			this.j(function($) {
				var inst = Module.initField(t.form.$field);
				var spy = chai.spy.on(inst, 'run');
				t.form.$field.focus().blur().focus();
				setTimeout(function() {
					expect(spy).to.not.have.been.called();
					cb();
				}, 210);
			});
		});

		it('#run should be called if focus event was triggered immidiately after blur', function(cb) {
			Module.setOptions({triggerType: ['focusout', 'submit'], focusoutDelay: 200});
			var t = this;
			this.j(function($) {
				var inst = Module.initField(t.form.$field);
				var spy = chai.spy.on(inst, 'run');
				t.form.$field.focus().blur();
				setTimeout(function() {
					expect(spy).to.have.been.called();
					cb();
				}, 210);
			});
		});
	});
	
});

it('on init field has a the modifier class "inited"', function(cb) {
	var t = this;
	this.j(function($) {
		var inst = Module.initField(t.form.$field);
		var modifierClass = inst.dName + '--inited';
		expect(inst.$field.hasClass(modifierClass), 'sdf').to.be.true;
		cb();
	});
});

describe('remoteValidate option', function() {
	it('#validate should be resolved with the value remoteValidate was resolved with', function(cb) {
		var t = this;
		this.j(function($) {
			var def = $.Deferred();
			def.resolve(null);
			Module.setOptions({
				remoteValidate: function(email) {
					return def;
				}
			});
			var inst = Module.initField(t.form.$field);
			inst.validate('test@gmail.com').done(function(result) {
				expect(result).to.be.eql(null);
				cb();
			});
		});
	});
});

it('#setState throws an error when new state is not in allowed values', function(cb) {
	var t = this;
	this.j(function($) {
		var inst = Module.initField(t.form.$field);
		expect(inst.setState.bind(inst, 'sfs')).to.throw(Error);
		cb();
	});
});

it('.initSelector should init plugin on all element with a class == dName', function(cb) {
	var t = this;
	this.j(function($) {
		Module.initSelector('femm');
		expect(t.form.$field.hasClass('femm--inited')).to.be.true;
		cb();
	});
});

it('do not run validation on triggerType if field value is not changed', function(cb) {
	var t = this;
	this.j(function($) {
		var inst = Module.initField(t.form.$field, {focusoutDelay: 100});
		var spiedValidate = spy.on(inst, 'validate');
		t.form.$field.val('email').focus().blur();
		setTimeout(function() {
			t.form.$field.focus().blur();
		}, 200);
		setTimeout(function() {
			expect(spiedValidate).to.have.been.called.once;
			cb();
		}, 400);
	});
});

it('run validation on triggerType if field value is changed twice', function(cb) {
	var t = this;
	this.j(function($) {
		var inst = Module.initField(t.form.$field, {focusoutDelay: 100});
		var spiedValidate = spy.on(inst, 'validate');
		t.form.$field.val('email').focus().blur();
		setTimeout(function() {
			t.form.$field.val('email1').focus().blur();
		}, 150);
		setTimeout(function() {
			expect(spiedValidate).to.have.been.called.twice;
			cb();
		}, 400);
	});
});

it('hash validation result', function(cb) {
	var t = this;
	this.j(function($) {
		var inst = Module.initField(t.form.$field, {focusoutDelay: 100, hash: true});
		var spiedValidate = spy.on(inst, 'validate');
		t.form.$field.val('email').focus().blur();
		setTimeout(function() {
			t.form.$field.val('email1').focus().blur();
		}, 150);
		setTimeout(function() {
			t.form.$field.val('email').focus().blur();
		}, 300);
		setTimeout(function() {
			expect(spiedValidate).to.have.been.called.twice;
			cb();
		}, 600);
	});
});

it('do not hash validation result if hash options is false', function(cb) {
	var t = this;
	this.j(function($) {
		var inst = Module.initField(t.form.$field, {focusoutDelay: 100, hash: false});
		var spiedValidate = spy.on(inst, 'validate');
		t.form.$field.val('email').focus().blur();
		setTimeout(function() {
			t.form.$field.val('email1').focus().blur();
		}, 150);
		setTimeout(function() {
			t.form.$field.val('email').focus().blur();
		}, 300);
		setTimeout(function() {
			expect(spiedValidate).to.have.been.called.exactly(3);
			cb();
		}, 600);
	});
});


function l(x) {
	console.log(x);
}