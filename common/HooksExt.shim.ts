/* eslint-disable no-prototype-builtins */
// @ts-nocheck

/**
 * A simple event framework used throughout Foundry Virtual Tabletop.
 * When key actions or events occur, a "hook" is defined where user-defined callback functions can execute.
 * This class manages the registration and execution of hooked callback functions.
 */
class HooksExt {
	/** Registry of RegExp based hooks */
	static readonly _regex = new Map<string, { regex: RegExp, fns: number[] }>();
	/** Repository of all hooks ever invoked. This is only ever used when `CONFIG.debug.hooks` is `true` */
	static readonly _hookRepo = new Set<string>();

	/**
	 * Register a callback handler which should be triggered when a hook is triggered.
	 *
	 * @param {string | RegExp} hook	The unique name of the hooked event
	 * @param {Function} fn				The callback function which should be triggered when the hook event occurs
	 * @return {number}					An ID number of the hooked function which can be used to turn off the hook later
	 */
	static on(hook: string | RegExp, fn: (...args: any) => any): number {
		console.debug(`${vtt} | Registered callback for ${hook} hook`);		// ┬ FoundryVTT Original
		const id = Hooks._id++;												// ┘

		if (hook instanceof RegExp) {										// ┐
			const pattern = hook.toString();								// │
			let regex = this._regex.get(pattern);							// │
			if (!regex) {													// │
				regex = { regex: hook, fns: [] };							// │
				this._regex.set(pattern, regex);							// ├ HooksExt Customized
			}																// │
			regex.fns.push(id);												// │
			Hooks._hooks[pattern] = Hooks._hooks[pattern] || [];			// │
			Hooks._hooks[pattern].push(fn);									// │
		} else {															// ┘

			Hooks._hooks[hook] = Hooks._hooks[hook] || [];					// ┬ FoundryVTT Original
			Hooks._hooks[hook].push(fn);									// ┘

		}																	// ─ HooksExt Customized

		Hooks._ids[id] = fn;												// ┬ FoundryVTT Original
		return id;															// ┘
	}

	/**
	 * Unregister a callback handler for a particular hook event
	 *
	 * @param {string | RegExp} hook	The unique name of the hooked event
	 * @param {Function|number} fn		The function, or ID number for the function, that should be turned off
	 */
	static off(hook: string | RegExp, fn: ((...args: any) => any) | number) {
		if (typeof fn === "number") {										// ┐
			const id = fn;													// │
			fn = Hooks._ids[fn];											// ├ FoundryVTT Original
			delete Hooks._ids[id];											// │
		}																	// ┘

		/* Foundry does not currently delete the function from ids if		// ┐
		only the function is provided. This is a potential memory leak		// │
		that HooksExt attempts to plug. */									// │
		else {																// │
			const entry = Object.entries(Hooks._ids).find(x => x[1] === fn);// │
			if (entry) delete Hooks._ids[parseInt(entry[0])];				// ├ HooksExt Customized
		}																	// │
		// Convert the hook to its string pattern							// │
		if (hook instanceof RegExp)											// │
			hook = hook.toString();											// │
		this._regex.delete(hook);											// ┘

		if (!Hooks._hooks.hasOwnProperty(hook)) return;						// ┐
		const fns = Hooks._hooks[hook];										// │
		const idx = fns.indexOf(fn);										// ├ FoundryVTT Original
		if (idx !== -1) fns.splice(idx, 1);									// │
		console.debug(`${vtt} | Unregistered callback for ${hook} hook`);	// ┘
	}

	/**
	 * Call all hook listeners in the order in which they were registered
	 * Hooks called this way can not be handled by returning false and will always trigger every hook callback.
	 *
	 * @param {string} hook   The hook being triggered
	 * @param {...*} args     Arguments passed to the hook callback functions
	 * @returns {boolean}     Were all hooks called without execution being prevented?
	 */
	static callAll(hook: string, ...args: any) {
		if (CONFIG.debug.hooks) {											// ┐
			console.log(`DEBUG | Calling ${hook} hook with args:`);			// ├ FoundryVTT Original
			console.log(args);												// ┘
			this._hookRepo.add(hook);										// ─ HooksExt Customized
		}																	// ─ FoundryVTT Original

		for (const regex of this._regex) {									// ┐
			if (!regex[1].regex.test(hook)) continue;						// │
			for (const fnId of regex[1].fns)								// ├ HooksExt Customized
				Hooks._call(hook, Hooks._ids[fnId], args);					// │
		}																	// ┘

		if (!Hooks._hooks.hasOwnProperty(hook)) return true;				// ┐
		const fns = new Array(...Hooks._hooks[hook]);						// │
		for (const fn of fns) {												// ├ FoundryVTT Original
			Hooks._call(hook, fn, args);									// │
		}																	// │
		return true;														// ┘
	}

	/**
	 * Call hook listeners in the order in which they were registered.
	 * Continue calling hooks until either all have been called or one returns false.
	 *
	 * Hook listeners which return false denote that the original event has been adequately handled and no further
	 * hooks should be called.
	 *
	 * @param {string} hook   The hook being triggered
	 * @param {...*} args     Arguments passed to the hook callback functions
	 * @returns {boolean}     Were all hooks called without execution being prevented?
	 */
	static call(hook: string, ...args: any) {
		if (CONFIG.debug.hooks) {											// ┐
			console.log(`DEBUG | Calling ${hook} hook with args:`);			// ├ FoundryVTT Original
			console.log(args);												// │
			this._hookRepo.add(hook);
		}																	// ┘

		let fns: ((...args: any) => any)[] = [];							// ┐
		for (const regex of this._regex) {									// │
			if (regex[1].regex.test(hook))									// │
				fns = fns.concat(regex[1].fns.map(x => Hooks._ids[x]));		// ├ HooksExt Customized
		}																	// │
		const hooksExist = Hooks._hooks.hasOwnProperty(hook);				// │
		if (!hooksExist && fns.length == 0) return true;					// │
		if (hooksExist) fns = fns.concat(...Hooks._hooks[hook]);			// ┘

		for (const fn of fns) {												// ┐
			const callAdditional = Hooks._call(hook, fn, args);				// │
			if (callAdditional === false) return false;						// ├ FoundryVTT Original
		}																	// │
		return true;														// ┘
	}

	static allUniqueHooks(): string[] {
		return [...this._hookRepo.values()];
	}
}

// If a HookExt has already been bound, do not execute the following
if (!(<any>globalThis).HooksExt) {
	(<any>globalThis).HooksExt = HooksExt;
	Hooks.on = <any>HooksExt.on.bind(HooksExt);
	Hooks.off = <any>HooksExt.off.bind(HooksExt);
	Hooks.callAll = <any>HooksExt.callAll.bind(HooksExt);
	Hooks.call = <any>HooksExt.call.bind(HooksExt);
}