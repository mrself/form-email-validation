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
	$('body').append($('<div />', {id: 'fixture'}));
});

beforeEach(function() {
	Module.clearCache();
	form = Faker.create('femm');
	$('#fixture').html(form.$form);
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

	it('form can be submitted if validation can not be proceeded', function(cb) {
		var spied = spy.on(module.$form[0], 'submit');
		module.options.remoteValidate = Faker.deferred('resolve', undefined, 1);
		module.$field.val('name@gmail.com');
		module.run().done(function() {
			module.$form.submit();
			expect(spied).to.have.been.called();
			cb();
		});
	});

	it('field is focused on form submit when email is invalid', function() {
		var spied = spy();
		module.$field.on('focus', spied);
		module.$form.submit();
		expect(spied).to.have.been.called();
	});
});

describe('Options', function() {
	describe('remoteValidate', function() {
		it('pass email to remoteValidate option', function(cb) {
			var passedEmail;
			module.options.remoteValidate = function(email) {
				var def = $.Deferred();
				passedEmail = email;
				def.resolve();
				return def;
			};
			module.value = 'name@gmail.com';
			module.remoteValidate().done(function() {
				expect(passedEmail).to.eql('name@gmail.com');
				cb();
			});
		});

		it('#validate is receive with the value remoteValidate deferred is resolved', function(cb) {
			module.value = 'name@gmail.com';
			module.options.remoteValidate = function() {
				var def = $.Deferred();
				def.resolve(true);
				return def;
			};
			module.validate().always(function(state) {
				expect(state).to.be.true;
				cb();
			});
		});

		it('#validate is receive undefined if remoteValidate is rejected', function(cb) {
			module.value = 'name@gmail.com';
			module.options.remoteValidate = function() {
				var def = $.Deferred();
				def.reject();
				return def;
			};
			module.validate().always(function(state) {
				expect(state).to.eql(Module.STATES.UNDEFINED);
				cb();
			});
		});
	});
	
});

describe('State', function() {
	it('#setInvalid', function() {
		module.setPendingState();
		module.setInValid();
		expect(form.$field.attr('class')).to.eql('femm femm--inited femm--invalid');
		expect(form.$submit.attr('class')).to.eql('femmSubmit femmSubmit--disabled');
		expect(module.$field.prop('disabled')).to.be.false;
	});

	it('#setValid', function() {
		module.setValid();
		expect(form.$field.attr('class')).to.eql('femm femm--inited femm--valid');
		expect(form.$submit.attr('class')).to.eql('femmSubmit');
	});

	describe('#resetState', function() {
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

		it('reset state on keyup', function(cb) {
			module.setInValid();
			var spied = spy.on(module, 'resetState');
			var event = $.Event('keyup', {keyCode: 65}); // 'a' letter
			module.$field.trigger(event);
			setTimeout(function() {
				expect(spied).to.have.been.called();
				cb();
			}, module.options.keyupResetDelay + 3);
		});

		it('do not reset state on keyup if key was not letter', function(cb) {
			module.setInValid();
			var spied = spy.on(module, 'resetState');
			var event = $.Event('keyup', {keyCode: 13}); // Enter
			module.$field.trigger(event);
			setTimeout(function() {
				expect(spied).not.to.have.been.called();
				cb();
			}, module.options.keyupResetDelay + 3);
		});
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

it('#isLetterKey', function() {
	expect(module.isLetterKey({keyCode: 60})).to.be.false;
	expect(module.isLetterKey({keyCode: 91})).to.be.false;
	expect(module.isLetterKey({keyCode: 65})).to.be.true;
	expect(module.isLetterKey({keyCode: 90})).to.be.true;
});


describe('User operations', function() {
	it('submit > keyup > remove > blur: the field must be marked as invalid', function(cb) {
		module.$form.submit();
		module.$field.trigger($.Event('keyup', {keyCode: 66}));
		
		setTimeout(function() {
			module.$field.trigger($.Event('keyup', {keyCode: 8})); // backspace
			module.$field.blur();
			setTimeout(function() {
				expect(module.$field.hasClass('femm--invalid')).to.be.true;
				cb();
			}, module.options.blurDelay + 1);
		}, module.options.keyupResetDelay + 1);
	});
});


describe('cache', function() {
	it('#setCachedState sets cached state for the email', function() {
		module.$field.val('name');
		var spiedSetState = spy.on(module, 'setState');
		Module.setCache('name', false);
		module.run();
		expect(spiedSetState).to.have.been.called.with(false);
	});
});