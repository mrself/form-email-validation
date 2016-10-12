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
	 * If plugin was inited on $field
	 * @type {Boolean}
	 */
	this.isInited = false;

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
		if (this.isInited || !this.defineForm() || !this.defineSubmitBtn()) return;
		this.setEvents();
		this.dName = this.options.dName;
		this.$field.addClass(this.dName);
		this.setIsInited();
	},

	/**
	 * Set that a plugin is fully inited.
	 */
	setIsInited: function() {
		this.isInited = true;
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
		if (!this.isValueChanged()) return;
		if (this.isHashed())
			return this.setHashedState();
		var self = this;
		this.state = EmailValiditon.STATES.PENDING;
		this.validate(this.value).done(function(result) {
			EmailValiditon.setHash(self.value, result);
			self.setState(result);
		});
	},

	/**
	 * Set hashed value of state
	 */
	setHashedState: function() {
		var hashed = EmailValiditon.getHash(this.value);
		this.setState(hashed);
	},

	/**
	 * If validation of valued was hashed
	 * @return {Boolean}
	 */
	isHashed: function() {
		return this.options.hash && EmailValiditon.hasHash(this.value);
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
		if (state === EmailValiditon.STATES.INVALID) {
			this.setInValid();
		} else if (state === EmailValiditon.STATES.VALID || 
			state === EmailValiditon.STATES.UNDEFINED)
			this.setValid();
		else if (state == EmailValiditon.STATES.UNDEFINED)
			this.reset();
		else {
			state = EmailValiditon.STATES.UNDEFINED;
			this.state = state;
			throw new Error('Not allowed value of state');
		}
	},

	/**
	 * Reset form and field to default value as they were before plugin init
	 */
	reset: function() {
		this.formEnabled = true;
		this.$submit.removeClass(this.dName + 'Submit--disabled').prop('disabled', false);
		this.$field
			.removeClass(this.dName + '--valid')
			.removeClass(this.dName + '--invalid');
	},

	/**
	 * Called when email is invalid.
	 * Disable form. Mark field as invalid
	 */
	setInValid: function() {
		this.formEnabled = false;
		this.$submit.addClass(this.dName + 'Submit--disabled').prop('disabled', true);
		this.$field
			.removeClass(this.dName + '--valid')
			.addClass(this.dName + '--invalid');
	},

	/**
	 * Called when email is valid.
	 * Enable form. Mark field as valid
	 */
	setValid: function() {
		this.formEnabled = true;
		this.$submit.removeClass(this.dName + 'Submit--disabled').prop('disabled', false);
		this.$field.removeClass(this.dName + '--invalid').addClass(this.dName + '--valid');
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
	hash: true
};
EmailValiditon.setOptions = function(options) {
	this.options = $.extend(true, this.options, options);
};

EmailValiditon.hash = {};
EmailValiditon.getHash = function(key) {
	return this.hash[key];
};
EmailValiditon.setHash = function(key, value) {
	this.hash[key] = value;
};
EmailValiditon.hasHash = function(key) {
	return key in this.hash;
};
EmailValiditon.clearHash = function() {
	this.hash = {};
};

module.exports = EmailValiditon;

global.l = function (x) {
	console.log(x);
};