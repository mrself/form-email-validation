/**
 * Terms:
 * - field: email field
 * 
 * Validate a field with regExp and remote service.
 * 
 * Validation is run in the following options:
 * 	- blur event on a field
 * 	- submit the form containing a field
 *
 * On validation success a field and a submit button are marked as valid.
 * On validation fail they are marked as invalid.
 */
function EmailValiditon() {
	/**
	 * Form containing $field
	 * @type {jQuery|undefined}
	 */
	this.$form = undefined;

	/**
	 * Email field
	 * @type {jQuery|undefined}
	 */
	this.$field = undefined;

	/**
	 * Current email
	 * @type {string}
	 */
	this.value = undefined;

	/**
	 * Last validated email
	 * @type {string}
	 */
	this.previousValue = undefined;

	/**
	 * Timeout id for delayed blur handler
	 * @type {number}
	 */
	this.blurTimeoutId = undefined;

	this.keyupTimer = undefined;
}

EmailValiditon.prototype = {
	init: function() {
		this.dName = this.options.dName;
		if (this.isInited() || !this.defineForm() || !this.defineSubmitBtn()) return;
		this.setIsInited();
		this.$field.addClass(this.dName);
		this.setEvents();
	},

	isInited: function() {
		return this.$field.hasClass(this.dName + '--inited');
	},

	/**
	 * Define and set $sbmit in $form
	 * @return {boolean} If $submit exists
	 */
	defineSubmitBtn: function() {
		this.$submit = this.$form.find('[type="submit"]');
		this.$submit.addClass(this.dName + 'Submit');
		return !!this.$submit.length;
	},

	/**
	 * Define and set $form
	 * @return {boolean} If $form exists
	 */
	defineForm: function() {
		this.$form = this.$field.closest('form');
		return !!this.$form.length;
	},

	/**
	 * Set that a plugin is fully inited.
	 */
	setIsInited: function() {
		this.$field.addClass(this.dName + '--inited');
	},

	setEvents: function() {
		var self = this;
		this.$form.on('submit', function(e) {
			clearTimeout(self.keyupTimer);
			self.onSubmit.apply(self, arguments);
		});
		this.$field.on('blur', function() {
			clearTimeout(self.keyupTimer);
			self.blurTimeoutId = setTimeout(function() {
				self.run();
			}, self.options.blurDelay);
		}).on('focus', function() {
			self.clearBlurTimeout();
		}).on('keyup', function() {
			clearTimeout(self.keyupTimer);
			self.keyupTimer = setTimeout(function() {
				self.resetState();
			}, self.options.keyupResetDelay);
		});
	},

	clearBlurTimeout: function() {
		clearTimeout(this.blurTimeoutId);
	},

	run: function() {
		this.clearBlurTimeout();
		if (!this.isValueChanged()) return;
		if (this.isState('pending')) return;
		var def = $.Deferred();
		if (EmailValiditon.hasCache(this.value)) {
			return this.processCache(def);
		}
		var self = this;
		return this.validate().done(function(state) {
			EmailValiditon.setCache(self.value, state);
			self.setState(state);
		});
	},

	isState: function(state) {
		return this.state === EmailValiditon.STATES[state.toUpperCase()];
	},

	validate: function() {
		var result = this.validateRegExp();
		if (result) {
			return this.remoteValidate();
		}
		var def = $.Deferred();
		def.resolve(result);
		return def;
	},

	/**
	 * Validate an email with regular expression
	 * @param  {string} email Email to validate
	 * @return {boolean}      Result of validation
	 */
	validateRegExp: function(email) {
		return this.options.validationReg.test(this.value);
	},

	remoteValidate: function() {
		var self = this;
		this.setPendingState();
		return this.options.remoteValidate(this.value).done(function(state) {
			self.setState(state);
		}).fail(function() {
			self.setState(EmailValiditon.STATES.UNDEFINED);
		});
	},

	processCache: function(def) {
		var cached = EmailValiditon.getCache(this.email);
		this.setState(cached);
		def.resolve(cached);
		return def;
	},

	isValueChanged: function() {
		this.value = this.$field.val();
		if (this.previousValue == this.value) return false;
		this.previousValue = this.value;
		return true;
	},

	onSubmit: function(e, data) {
		if (data && data.evPlugin === true) return;
		e.preventDefault();
		var result = this.run();
		if (!result) return this.resolveStateOnSubmit();
		var self = this;
		result.done(function() {
			self.resolveStateOnSubmit();
		});
	},

	resolveStateOnSubmit: function() {
		if (this.isState('valid') || this.isState('undefined')) {
			this.$form.trigger('submit', {evPlugin: true});
			this.$form.trigger('femm/submit');
		} else if (this.isState('invalid'))
			this.$field.focus();
	},

	/**
	 * Set state
	 * @param {boolean|null|undefined} state 
	 */
	setState: function(state) {
		this.state = state;
		if (state === EmailValiditon.STATES.INVALID) {
			this.setInValid();
		} else if (state === EmailValiditon.STATES.VALID)
			this.setValid();
		else if (state === EmailValiditon.STATES.UNDEFINED)
			this.resetState();
		else if (state !== EmailValiditon.STATES.PENDING) {
			this.resetState();
			this.state = EmailValiditon.STATES.UNDEFINED;
			throw new Error('Not allowed value of state');
		}
	},

	/**
	 * Reset form and field to default value as they were before plugin init
	 */
	resetState: function() {
		this.$submit.removeClass(this.dName + 'Submit--disabled');
		this.$field
			.removeClass(this.dName + '--valid')
			.removeClass(this.dName + '--invalid')
			.removeClass(this.dName + '--loading')
			.prop('disabled', false);
	},

	/**
	 * Called when email is invalid.
	 * Disable form. Mark field as invalid
	 */
	setInValid: function() {
		this.$submit.addClass(this.dName + 'Submit--disabled');
		this.$field
			.removeClass(this.dName + '--valid')
			.addClass(this.dName + '--invalid')
			.removeClass(this.dName + '--loading');
	},

	setPendingState: function() {
		this.state = EmailValiditon.STATES.PENDING;
		this.$field.addClass(this.dName + '--loading')
			.prop('disabled', true);
	},

	/**
	 * Called when email is valid.
	 * Enable form. Mark field as valid
	 */
	setValid: function() {
		this.$submit.removeClass(this.dName + 'Submit--disabled');
		this.$field
			.removeClass(this.dName + '--invalid')
			.addClass(this.dName + '--valid')
			.removeClass(this.dName + '--loading')
			.prop('disabled', false);
	},

	/**
	 * Set options, extending existing
	 * @param {Object} options New options
	 */
	setOptions: function(options) {
		this.options = $.extend(true, this.options, EmailValiditon.options, options);
		this.options.triggerType = [].concat(this.options.triggerType);
	},
};

/**
 * Init plugin on $field with options
 * @param  {jQuery} $field  Email field
 * @param  {Object} [options] Options
 * @return {EmailValiditon]   Instance
 */
EmailValiditon.initField = function($field, options) {
	var inst = new this;
	inst.$field = $field;
	inst.setOptions(options);
	inst.init();
	return inst;
};

/**
 * Init plugin on document name (class name) with options
 * @param  {string} dName   
 * @param  {object} [options] 
 */
EmailValiditon.initSelector = function(dName, options) {
	options = options || {};
	options.dName = dName;
	$('.' + dName).each(function() {
		var inst = new EmailValiditon;
		inst.$field = $(this);
		inst.setOptions(options);
		inst.init();
	});
};

EmailValiditon.STATES = {
	// State can not be detected. It happens when #remoteValidation produces an error
	UNDEFINED: undefined,
	// State is valid
	VALID: true,
	// State is invalid
	INVALID: false,
	PENDING: null
};

EmailValiditon.options = {
	dName: 'femm',
	validationReg: /^(([^<>()[\]\\.,;:\s@\"]+(\.[^<>()[\]\\.,;:\s@\"]+)*)|(\".+\"))@((\[[0-9]{1,3}\.[0-9]{1,3}\.[0-9]{1,3}\.[0-9]{1,3}\])|(([a-zA-Z\-0-9]+\.)+[a-zA-Z]{2,}))$/i,
	triggerType: ['focusout'/*,'keyup'*/],
	remoteValidate: function() {
		throw new Error('remoteValidate option must be provided');
	},
	// Used only when `triggerType` contains 'focusout: 400,
	// If cache results
	cache: true,
	// Offset from top and bottom screen when defining if $field is in viewport
	screenOffset: 30,
	// Delay to make sure that validation is ran only once in the following events:
	// field focus > form submit button click
	blurDelay: 100,
	// Delay on keyup after which reset any state
	keyupResetDelay: 200
};
EmailValiditon.setOptions = function(options) {
	this.options = $.extend(true, this.options, options);
};

EmailValiditon.cache = {};
EmailValiditon.getCache = function(key) {
	return this.cache[key];
};
EmailValiditon.setCache = function(key, value) {
	this.cache[key] = value;
};
EmailValiditon.hasCache = function(key) {
	return key in this.cache;
};
EmailValiditon.clearCache = function() {
	this.cache = {};
};

module.exports = EmailValiditon;

global.l = function (x) {
	console.log(x);
};