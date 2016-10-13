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
	 * If form could be proceeded
	 * @type {Boolean}
	 */
	this.formEnabled = true;

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
}

EmailValiditon.prototype = {
	constructor: EmailValiditon,

	init: function() {
		this.dName = this.options.dName;
		if (this.isInited() || !this.defineForm() || !this.defineSubmitBtn()) return;
		this.setEvents();
		this.$field.addClass(this.dName);
		this.setIsInited();
	},

	isInited: function() {
		return this.$field.hasClass(this.dName + '--inited');
	},

	/**
	 * Set that a plugin is fully inited.
	 */
	setIsInited: function() {
		this.$field.addClass(this.dName + '--inited');
	},

	/**
	 * Define and set $sbmit in $form
	 * @return {boolean} If $submit exists
	 */
	defineSubmitBtn: function() {
		this.$submit = this.$form.find('[type="submit"]');
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

	setEvents: function() {
		if (~this.options.triggerType.indexOf('focusout'))
			this.initBlurTrigger();
		this.$form.on('submit', this.onSubmit.bind(this));
	},

	initBlurTrigger: function() {
		var timeoutFlag, self = this;
		this.$field.on('blur', function() {
			timeoutFlag = setTimeout(self.run.bind(self), self.options.focusoutDelay);
		}).on('focus', function() {
			clearTimeout(timeoutFlag);
		});
	},

	/**
	 * Called on form submit.
	 * Prevent default form proceeding if an email is invalid
	 * @return {boolean|void}
	 */
	onSubmit: function() {
		if (!this.isStateSetted()) this.run();
		else this.scrollToFieldIfInvalid();
		if (!this.formEnabled)
			return false;
	},

	/**
	 * If state was given any value. 
	 * Return 'false' only if user submit form without focus the $field
	 * @return {Boolean}
	 */
	isStateSetted: function() {
		return 'state' in this;
	},

	/**
	 * Execute pre-validation, validation and post-validtion things
	 */
	run: function() {
		if (!this.isValueChanged()) {
			return;
		}
		if (this.isCached())
			return this.setCachedState();
		var self = this;
		this.state = EmailValiditon.STATES.PENDING;
		this.validate(this.value).done(function(result) {
			EmailValiditon.setCache(self.value, result);
			self.setState(result);
		}).fail(this.setState.bind(this, EmailValiditon.STATES.UNDEFINED));
	},

	/**
	 * Set cached value of state
	 */
	setCachedState: function() {
		var cached = EmailValiditon.getCache(this.value);
		this.setState(cached);
	},

	/**
	 * If validation of valued was cached
	 * @return {Boolean}
	 */
	isCached: function() {
		return this.options.cache && EmailValiditon.hasCache(this.value);
	},

	isValueChanged: function() {
		this.value = this.$field.val();
		if (this.previousValue == this.value) return false;
		this.previousValue = this.value;
		return true;
	},

	/**
	 * Set state
	 * @param {boolean|null|undefined} state 
	 */
	setState: function(state) {
		this.state = state;
		if (state === EmailValiditon.STATES.PENDING) {
			this.$field.addClass(this.dName + '--loading');
		} else if (state === EmailValiditon.STATES.INVALID) {
			this.setInValid();
		} else if (state === EmailValiditon.STATES.VALID)
			this.setValid();
		else if (state === EmailValiditon.STATES.UNDEFINED)
			this.reset();
		else {
			this.reset();
			this.state = EmailValiditon.STATES.UNDEFINED;
			throw new Error('Not allowed value of state');
		}
	},

	/**
	 * Reset form and field to default value as they were before plugin init
	 */
	reset: function() {
		this.formEnabled = true;
		this.$submit.removeClass(this.dName + 'Submit--disabled');
		this.$field
			.removeClass(this.dName + '--valid')
			.removeClass(this.dName + '--invalid')
			.removeClass(this.dName + '--loading');
	},

	/**
	 * Called when email is invalid.
	 * Disable form. Mark field as invalid
	 */
	setInValid: function() {
		this.formEnabled = false;
		this.$submit.addClass(this.dName + 'Submit--disabled');
		this.$field
			.removeClass(this.dName + '--valid')
			.addClass(this.dName + '--invalid')
			.removeClass(this.dName + '--loading');
	},

	scrollToFieldIfInvalid: function() {
		if (this.state == EmailValiditon.STATES.INVALID && !this.isFieldInViewport())
			this.scrollToField();
	},

	scrollToField: function() {
		$('html, body').animate({
			scrollTop: this.$field.offset().top - this.options.screenOffset + 1
		}, 200);
	},

	isFieldInViewport: function() {
		var rect = this.$field[0].getBoundingClientRect();
		var windowHeight = $(window).height();
		var docRect = document.documentElement.getBoundingClientRect();
		return !rect.top || (rect.top > this.options.screenOffset && 
			(windowHeight == docRect.bottom || rect.bottom +  rect.height + this.options.screenOffset < windowHeight));
	},

	/**
	 * Called when email is valid.
	 * Enable form. Mark field as valid
	 */
	setValid: function() {
		this.formEnabled = true;
		this.$submit.removeClass(this.dName + 'Submit--disabled');
		this.$field
			.removeClass(this.dName + '--invalid')
			.addClass(this.dName + '--valid')
			.removeClass(this.dName + '--loading');
	},

	/**
	 * Validate email
	 * @param  {string} email Email to validate
	 * @return {jQuery.Deferred} Deferred instance, which is resolved with a state
	 */
	validate: function(email) {
		var result = this.validateRegExp(email);
		if (result && this.options.remoteValidate)
			return this.options.remoteValidate(email);
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
		return this.options.validationReg.test(email);
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

EmailValiditon.STATES = {
	// State can not be detected. It happens when #remoteValidation produces an error
	UNDEFINED: undefined,
	// State is valid
	VALID: true,
	// State is invalid
	INVALID: false,
	PENDING: null
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

EmailValiditon.options = {
	dName: 'femm',
	validationReg: /^(([^<>()[\]\\.,;:\s@\"]+(\.[^<>()[\]\\.,;:\s@\"]+)*)|(\".+\"))@((\[[0-9]{1,3}\.[0-9]{1,3}\.[0-9]{1,3}\.[0-9]{1,3}\])|(([a-zA-Z\-0-9]+\.)+[a-zA-Z]{2,}))$/i,
	triggerType: ['focusout'/*,'keyup'*/],
	remoteValidate: false,
	// Used only when `triggerType` contains 'focusout'
	focusoutDelay: 400,
	// If cache results
	cache: true,
	// Offset from top and bottom screen when defining if $field is in viewport
	screenOffset: 30
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