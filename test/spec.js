var chai = require('chai'),
	expect = chai.expect,
	spies = require('chai-spies'),

	jsdom = require('mocha-jsdom'),
	Faker = require('./faker'),
	Module = require('../index');

chai.use(spies);
var spy = chai.spy;

var Faker = require('./faker');

var module, form;

jsdom();

before(function () {
	global.$ = require('jquery');
});

beforeEach(function() {
	Module.clearCache();
	global.window = window;
	global.document = window.document;
	self.window = window;
	form = Faker.create('femm');
	$('body').append(form.$form);
	module = Module.initField(form.$field, {
		remoteValidate: function() {
			var def = $.Deferred();
			def.reject();
			return def;
		}
	});
});

describe('Validation triggers', function() {
	describe('submit', function() {
		it('single submit', function() {
			var spied = spy.on(module, 'run');
			form.$form.trigger('submit');
			expect(spied).to.have.been.called.once();
		});

		it('two submits', function(cb) {
			/**
			 * Spy on #validate, not on #run.
			 * Because when the value is invalid, the field is focused.
			 * And the second submit automatically triggers blur event which 
			 * calls #run one more time. So we have 3 calls of #run instead of 2
			 */
			var spy = chai.spy.on(module, 'validate');
			form.$form.submit();
			setTimeout(function() {
				form.$field.val('email');
				form.$form.submit();
				setTimeout(function() {
					expect(spy).to.have.been.called.twice();
					cb();
				}, 20);
			}, 300);
		});
	});

	describe('blur', function() {
		it('single blur', function(cb) {
			var spied = spy.on(module, 'run');
			form.$field.trigger('blur');
			setTimeout(function() {
				expect(spied).to.have.been.called.once();
				cb();
			}, module.options.blurDelay + 20);
		});

		it('do not run when a user focuses the field immidiately after blur', function(cb) {
			var spied = spy.on(module, 'run');
			form.$field.focus().trigger('blur');
			setTimeout(function() {
				form.$field.focus();
				expect(spied).not.to.have.been.called();
				cb();
			}, module.options.blurDelay - 20);
		});
	});

	it('run only once when a user clicks a submit button having the field focused', function(cb) {
		var spied = spy.on(module, 'run');
		form.$field.focus().blur();
		form.$form.submit();
		setTimeout(function() {
			expect(spied).to.have.been.called.once();
			cb();
		});
	});
});

describe('Init', function() {
	it('add "init" class mod to the field', function() {
		expect(form.$field.attr('class')).to.eql('femm femm--inited');
	});

	it('do not init on the same field the second time', function() {
		var module2 = Module.initField(form.$field);
		expect(module2.$form).to.be.undefined;
	});
});

describe('Validation process', function() {
	it('do not validate the second time if the email is not changed', function() {
		form.$field.val('email');
		var spied = spy.on(module, 'validate');
		module.run();
		module.run();
		expect(spied).to.have.been.called.once();
	});

	it('validate the second time if the email is changed', function() {
		form.$field.val('email');
		var spied = spy.on(module, 'validate');
		module.run();
		form.$field.val('email1');
		module.run();
		expect(spied).to.have.been.called.twice();
	});

	it('form can not be submtted if state is not set', function() {
		var spied = spy.on(module.$form[0], 'submit');
		module.$form.submit();
		module.$field.val('name@gmail.com');
		expect(spied).not.to.have.been.called();
	});

	it('form can not be submtted if remoteValidate is rejected', function(cb) {
		var spied = spy.on(module.$form[0], 'submit');
		module.$form.submit();
		module.options.remoteValidate = Faker.deferred('reject', false, 100);
		module.$field.val('name@gmail.com');
		module.$form.submit();
		setTimeout(function() {
			expect(spied).not.to.have.been.called();
			cb();
		}, 110);
	});

	it('form cannot be submitted if state is pending', function() {
		module.$field.val('name@gmail.com');
		var spied = spy.on(module, 'validate');
		module.options.remoteValidate = Faker.deferred('resolve', true, 100);
		module.run();
		module.run();
		module.run();
		expect(spied).to.have.been.called.once();
	});

	it('form can be submitted if validation succeeded', function(cb) {
		var spied = spy.on(module.$form[0], 'submit');
		module.validate = Faker.deferred('resolve', true, 100);
		module.$field.val('name@gmail.com');
		module.$form.submit();
		setTimeout(function() {
			expect(spied).to.have.been.called.once();
			cb();
		}, 110);
	});

	it('custom event is called when validation succeeded', function(cb) {
		var spied = spy();
		module.$form.on('femm/submit', spied);
		module.validate = Faker.deferred('resolve', true, 1);
		module.$field.val('name@gmail.com');
		module.$form.submit();
		setTimeout(function() {
			expect(spied).to.have.been.called.once();
			cb();
		}, 10);
	});
});

describe('State', function() {
	it('#setInvalid', function() {
		var spied = spy();
		module.$field.on('focus', spied);
		module.setInValid();
		expect(form.$field.attr('class')).to.eql('femm femm--inited femm--invalid');
		expect(form.$submit.attr('class')).to.eql('femmSubmit femmSubmit--disabled');
		expect(spied).to.have.been.called();
	});

	it('#setValid', function() {
		module.setValid();
		expect(form.$field.attr('class')).to.eql('femm femm--inited femm--valid');
		expect(form.$submit.attr('class')).to.eql('femmSubmit');
	});

	it('#resetState after #setInValid', function() {
		module.setInValid();
		module.resetState();
		expect(form.$field.attr('class')).to.eql('femm femm--inited');
		expect(form.$submit.attr('class')).to.eql('femmSubmit');
		expect(module.$field.prop('disabled')).to.be.false;
	});

	it('#resetState after #setPendingState', function() {
		module.setPendingState();
		module.resetState();
		expect(form.$field.attr('class')).to.eql('femm femm--inited');
		expect(form.$submit.attr('class')).to.eql('femmSubmit');
		expect(module.$field.prop('disabled')).to.be.false;
	});

	it('#resetState after #setValid', function() {
		module.setValid();
		module.resetState();
		expect(form.$field.attr('class')).to.eql('femm femm--inited');
		expect(form.$submit.attr('class')).to.eql('femmSubmit');
		expect(module.$field.prop('disabled')).to.be.false;
	});

	it('is "pending" when remote validation starts', function() {
		module.options.remoteValidate = Faker.deferred('resolve', true, 10);
		module.remoteValidate();
		expect(module.state).to.eql(Module.STATES.PENDING);
	});

	it('set undefined if #remoteValidate was rejected', function(cb) {
		module.options.remoteValidate = function() {
			var def = $.Deferred();
			def.reject();
			return def;
		};
		module.$field.val('name@gmail.com');
		module.run().always(function() {
			expect(module.state).to.eql(Module.STATES.UNDEFINED);
			cb();
		});
	});
});