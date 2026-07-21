

/**
 * Executes a callback on each valid element in the collection, optionally after a delay.
 *
 * Behavior:
 * - Exits early if the collection is empty.
 * - Flattens the internal element storage and keeps only valid element nodes.
 * - Validates that the provided callback is a function.
 * - Resolves the stored delay value and adds the optional delay argument.
 * - Runs immediately when the final delay is `0` or less.
 * - Uses `setTimeout` when the final delay is greater than `0`.
 *
 * Notes:
 * - Only nodes with `nodeType === 1` are treated as valid elements.
 * - Invalid delay values are converted through `$.toNumber(...)`.
 * - The callback is executed once for each valid element.
 *
 * @param {Function} callback - Function to execute for each valid element.
 * @param {*} delay - Optional additional delay to add to the stored delay value.
 * @returns {void}
 */
jUtils.fn.set = function (callback, delay) {
// Exit early if the collection is empty.
if(this.length === 0) return;
 
// Extract valid DOM elements from the internal collection structure.
const elements = this.elements.filter(el => el && el.nodeType === 1);    

// Ensure the first argument is a function before continuing.
if(typeof callback !== 'function') $.error(`${callback} is not a function at argument 1`);

// Resolve the stored delay value and normalize invalid values to a number.
let currentMs = $.toNumber(this.ms);

// Add the optional delay argument to the current delay value.
currentMs += $.toNumber(delay);

// Execute immediately when there is no positive delay.
if(currentMs > 0) {
  setTimeout(() => elements.forEach(callback), currentMs);
} else {
  elements.forEach(callback);
}
}



/**
 * Applies a callback to the collection using a selected array method mode.
 *
 * Behavior:
 * - Exits early if the collection is empty.
 * - Flattens the internal element storage and keeps only valid element nodes.
 * - Validates that the first argument is a function.
 * - Uses the first element by default when `mode` is `"default"`.
 * - Delegates execution to the array method named by `mode`.
 *
 * Notes:
 * - Only nodes with `nodeType === 1` are treated as valid elements.
 * - The default mode is converted to `"map"` after narrowing the collection to
 *   the first element.
 * - If the selected mode does not exist on the array, an error is thrown.
 *
 * @param {Function} callback - Function passed to the selected array method.
 * @param {string} [mode="default"] - Array method name to apply.
 * @returns {*} The result of the selected array method, or `undefined` on error.
 */
jUtils.fn.get = function (callback, mode) {
 // Exit early if the collection is empty.
if(this.length === 0) return;

// Extract valid DOM elements from the internal collection structure.
let elements = this.elements.filter(el => el && el.nodeType === 1);    

// Ensure the first argument is a function before continuing.
if(typeof callback !== 'function') $.error(`${callback} is not a function at argument 1`);

// Execute callback once for a single element.
if(arguments.length === 1) return callback(elements[0], 0, elements[0]);

return elements[mode](callback); 
}



/**
 * Adds a delay value to the current stored delay and returns the instance.
 *
 * Behavior:
 * - Converts the existing stored delay to a number.
 * - Converts the provided value to a number.
 * - Adds both values together and stores the result in `this.ms`.
 * - Returns the current instance to allow chaining.
 *
 * Notes:
 * - Invalid numeric values are normalized to `0` by `$.toNumber(...)`.
 * - This method does not execute anything by itself; it only updates the delay state.
 *
 * @param {*} value - The value to add to the current delay.
 * @returns {Object} The current instance for chaining.
 */
jUtils.fn.delay = function (value) {
// Safely convert both values to numbers; invalid values become 0.
this.ms = $.toNumber(this.ms) + $.toNumber(value);
return this;
}



/**
 * Queues asynchronous work for the current collection and chains each step sequentially.
 *
 * Behavior:
 * - Validates that the provided callback is a function.
 * - Initializes a promise chain the first time the queue is used.
 * - Passes the current elements to the callback after the configured delay.
 * - Provides a completion function to the callback so it can resolve the queue step.
 * - Returns the current instance to allow chaining.
 *
 * Notes:
 * - `this.delayChain` is used to preserve execution order across queued calls.
 * - `this.ms` is used as the delay before each queued callback runs.
 * - `this.queueIsSettled` can prevent the current step from resolving when set.
 * - The callback receives two arguments:
 *   - `el`: the current elements
 *   - `next`: a function that resolves the current queue step
 *
 * @param {Function} callback - Function executed for each queued step.
 * @returns {Object} The current instance for chaining.
 */
jUtils.fn.queueIsSettled = false;

jUtils.fn.queue = function (callback) {
// Ensure the first argument is a function before creating the queue step.
if(typeof callback !== 'function') $.error(`${callback} is not a function at argument 1`);

// Initialize the promise chain the first time queue() is called.
this.delayChain = this.delayChain || Promise.resolve(this.elements); 

// Append a new delayed step to the existing queue chain.
this.delayChain = this.delayChain.then(el => {
return new Promise(resolve => {
// Wait for the configured delay before running the callback.
  setTimeout(() => {
    callback(el, () => {
// Resolve the step only when the queue has not been marked as settled.    
      if(!this.queueIsSettled) resolve(el);
    });
  }, this.ms);
});
});
return this;
}



/**
 * Marks the current queue as settled and returns the instance.
 *
 * Behavior:
 * - Sets `queueIsSettled` to `true`.
 * - Prevents the current queue step from resolving in `queue()`.
 * - Returns the current instance to allow chaining.
 *
 * Notes:
 * - This does not remove or reset the existing promise chain.
 * - It only changes the queue state flag used by queued callbacks.
 *
 * @returns {Object} The current instance for chaining.
 */
jUtils.fn.clearQueue = function () {
// Mark the queue as settled so pending steps stop resolving.
this.queueIsSettled = true;
return this;  
}



/**
 * Gets or sets the `innerHTML` of the matched elements.
 *
 * Behavior:
 * - If `input` is provided, sets `innerHTML` for each valid element in the collection.
 * - If `input` is omitted, returns the `innerHTML` of the first matched element.
 * - Supports computed values through `$.compute(...)`, allowing `input` to be a
 *   direct value or a function-like resolver.
 *
 * Notes:
 * - When setting, the current element HTML, index, and element reference are passed
 *   into `$.compute(...)` so the value can be derived dynamically.
 * - When getting, only the first element's `innerHTML` is returned.
 * - This method is chainable when used as a setter.
 *
 * @param {*} [input] - The HTML value to set, or a resolver used by `$.compute(...)`.
 * @returns {Object|string|undefined} The current instance when setting, or the first
 *   element's `innerHTML` when getting.
 */
jUtils.fn.html = function (input) {
if(input !== undefined) {
this.set((el, index) => {
// Compute the final HTML value before assigning it to the element.
el.innerHTML = $.compute(input, el.innerHTML, index, el);
});
return this;
} else {
// Return the first matched element's innerHTML.
return this.get(el => el.innerHTML);  
} 
}



/**
 * Gets or sets the `textContent` of the matched elements.
 *
 * Behavior:
 * - If `input` is provided, sets `textContent` for each valid element in the collection.
 * - If `input` is omitted, returns the `textContent` of the first matched element.
 * - Supports computed values through `$.compute(...)`, allowing `input` to be a
 *   direct value or a function-like resolver.
 *
 * Notes:
 * - When setting, the current element text, index, and element reference are passed
 *   into `$.compute(...)` so the value can be derived dynamically.
 * - When getting, only the first element's `textContent` is returned.
 * - This method is chainable when used as a setter.
 *
 * @param {*} [input] - The text value to set, or a resolver used by `$.compute(...)`.
 * @returns {Object|string|undefined} The current instance when setting, or the first
 *   element's `textContent` when getting.
 */
jUtils.fn.text = function (input) {
if(input !== undefined) {
this.set((el, index) => {
// Compute the final text value before assigning it to the element.
el.textContent = $.compute(input, el.textContent, index, el);
});
return this;
} else {
// Return the first matched element's textContent.
return this.get(el => el.textContent);  
} 
}



/**
 * Gets or sets the `value` of the matched elements.
 *
 * Behavior:
 * - If `input` is provided, sets `value` for each valid element in the collection.
 * - If `input` is omitted, returns the `value` of the first matched element.
 * - Supports computed values through `$.compute(...)`, allowing `input` to be a
 *   direct value or a function-like resolver.
 *
 * Notes:
 * - When setting, the current element value, index, and element reference are passed
 *   into `$.compute(...)` so the value can be derived dynamically.
 * - When getting, only the first element's `value` is returned.
 * - This method is chainable when used as a setter.
 *
 * @param {*} [input] - The value to set, or a resolver used by `$.compute(...)`.
 * @returns {Object|string|undefined} The current instance when setting, or the first
 *   element's `value` when getting.
 */
jUtils.fn.val = function (input) {
if(input !== undefined) {
this.set((el, index) => {
// Compute the final value before assigning it to the element.
el.value = $.compute(input, el.value, index, el);
});
return this;
} else {
// Return the first matched element's value.
return this.get(el => el.value);  
} 
}



/**
 * Returns the wrapped elements as a flat array, or a single element by index.
 *
 * Behavior:
 * - Flattens the internal element collection into a single array.
 * - If `index` is not provided, returns all items.
 * - If `index` is provided, returns the item at that position.
 * - Supports negative indexes by converting them into a valid positive offset.
 *
 * Notes:
 * - The returned array is a flattened snapshot of `this.elements`.
 * - Negative index handling is delegated to `$.pos(...).loose(index)`.
 * - If the computed index is out of range, the result will be `undefined`.
 *
 * @param {number} [index] - Optional index of the item to return.
 * @returns {Array|*} The full flattened array, or the item at the requested index.
 */
jUtils.fn.unwrap = function (index) {
const items = this.elements;

// Return all flattened items when no index is provided.
if(index === undefined) return items;

// Convert negative indexes into a valid positive position.
const len = $.pos(items.length).loose(index);

// Return the item at the resolved index.
return items[len];
}



/**
 * Returns a new `jUtils` instance containing the element at the specified index.
 *
 * Behavior:
 * - Uses `this.get(el => el, 'map')` to collect the current matched elements.
 * - Supports negative indexes by converting them into a valid positive offset.
 * - Wraps the selected element in a new `jUtils` instance.
 *
 * Notes:
 * - The default index is `0`.
 * - Negative index handling is delegated to `$.pos(...).loose(index)`.
 * - If the resolved index is out of range, the new instance may contain `undefined`.
 *
 * @param {number} [index=0] - The position of the element to return.
 * @returns {jUtils} A new `jUtils` instance containing the selected element.
 */
jUtils.fn.at = function (index = 0) {
// Collect the current matched elements as a mapped array.
const elements = this.get(el => el, 'map');

// Convert negative indexes into a valid positive position.
const len = $.pos(elements.length).loose(index);

// Return a new jUtils instance wrapping the selected element.
return new jUtils(elements[len]);
}



/**
 * Gets or sets attributes on the matched elements.
 *
 * Behavior:
 * - If `key` is an object, sets multiple attributes from its key/value pairs.
 * - If `key` and `value` are both provided, sets a single attribute.
 * - If `key` is provided and `value` is omitted, gets one or more attribute values.
 * - If neither `key` nor `value` is provided, returns all attributes from the first matched element.
 *
 * Notes:
 * - When setting, values can be direct values or computed values via `$.compute(...)`.
 * - When getting multiple attributes, an object of attribute names and values is returned.
 * - When getting all attributes, only the first matched element is used.
 * - This method supports chaining when used as a setter.
 *
 * @param {string|Array|string[]|Object} [key] - Attribute name, list of names, or object of attributes.
 * @param {*} [value] - Attribute value to set, or resolver used by `$.compute(...)`.
 * @returns {Object|String|jUtils|undefined} Attribute value(s), all attributes, or the current instance when setting.
 */
jUtils.fn.attr = function (key, value) {

if($.isObject(key)) {
 for(const [k, v] of Object.entries(key)){
   this.attr(k, v); 
 } 
 return this;  
} else if(key !== undefined && value !== undefined) {
this.set((el, index) => {
// Compute the final attribute value before assigning it.
const result = $.compute(value, el.getAttribute(key), index, el);
 el.setAttribute(key, result); 
});
return this;   
 } else if(key !== undefined && value === undefined) {
const obj = {};

this.get(el => {
// Collect the requested attribute values into a plain object.
[].concat(key).forEach(k => {
obj[k] = el.getAttribute(k);
  }); 
});

return Array.isArray(key) ? obj : obj[key];
 } else { 
const obj = {}; 
this.get(el => {
// Collect all attributes from the first matched element.
Array.from(el.attributes).forEach(attr => {
obj[attr.name] = attr.value;  
  });
});
return obj;  
 }
}



/**
 * Removes one or more attributes from the matched elements.
 *
 * Behavior:
 * - Accepts a single attribute name or an array of attribute names.
 * - Normalizes the input into an array using `[].concat(...)`.
 * - Removes each listed attribute from every matched element.
 * - Returns the current instance to allow chaining.
 *
 * Notes:
 * - If an attribute does not exist, `removeAttribute(...)` simply has no effect.
 * - This method only affects the matched elements in the collection.
 *
 * @param {string|string[]} [fields=[]] - Attribute name or list of attribute names to remove.
 * @returns {Object} The current instance for chaining.
 */
jUtils.fn.removeAttr = function (fields = []) {
// Normalize the input so both single values and arrays are handled the same way.
fields = [].concat(fields);

// Remove each requested attribute from every matched element.
this.set(el => {
fields.forEach(key => el.removeAttribute(key)); 
});
return this;
}



/**
 * Gets or sets properties on the matched elements.
 *
 * Behavior:
 * - If `key` is an object, sets multiple properties from its key/value pairs.
 * - If `key` and `value` are both provided, sets a single property.
 * - If `key` is provided and `value` is omitted, gets one or more property values.
 * - If neither `key` nor `value` is provided, returns all enumerable properties from the first matched element.
 *
 * Notes:
 * - When setting, values can be direct values or computed values via `$.compute(...)`.
 * - When getting multiple properties, an object of property names and values is returned.
 * - When getting all properties, only the first matched element is used.
 * - This method supports chaining when used as a setter.
 *
 * @param {string|Array|string[]|Object} [key] - Property name, list of names, or object of properties.
 * @param {*} [value] - Property value to set, or resolver used by `$.compute(...)`.
 * @returns {Object|String|jUtils|undefined} Property value(s), all properties, or the current instance when setting.
 */
jUtils.fn.prop = function (key, value) {
if($.isObject(key)) {
 for(const [k, v] of Object.entries(key)){
   this.prop(k, v); 
 } 
 return this;  
} else if(key !== undefined && value !== undefined) {
this.set((el, index) => {
// Compute the final property value before assigning it.
const result = $.compute(value, el[key], index, el);
 el[key] = result; 
});
return this;   
 } else if(key !== undefined && value === undefined) {
const obj = {};

this.get(el => {
// Collect the requested property values into a plain object.
[].concat(key).forEach(k => {
obj[k] = el[k];
  }); 
});

return Array.isArray(key) ? obj : obj[key];
 } else { 
const obj = {}; 

this.get(el => {
// Collect all enumerable properties from the first matched element.
for(const [k, v] of Object.entries(el)){
obj[k] = v;
}
});
return obj;  
 }
}



/**
 * Removes one or more properties from the matched elements.
 *
 * Behavior:
 * - Accepts a single property name or an array of property names.
 * - Normalizes the input into an array using `[].concat(...)`.
 * - Deletes each listed property from every matched element.
 * - Returns the current instance to allow chaining.
 *
 * Notes:
 * - If a property does not exist, `delete` simply has no effect.
 * - This method only affects the matched elements in the collection.
 *
 * @param {string|string[]} [fields=[]] - Property name or list of property names to remove.
 * @returns {Object} The current instance for chaining.
 */
jUtils.fn.removeProp = function (fields = []) {
// Normalize the input so both single values and arrays are handled the same way.
fields = [].concat(fields);

// Remove each requested property from every matched element.
this.set(el => {
fields.forEach(key => delete el[key]);   
})
return this;
}



/**
 * Sets the `className` of the matched elements.
 *
 * Behavior:
 * - Sets `className` for each valid element in the collection.
 * - Supports computed values through `$.compute(...)`, allowing `input` to be a
 *   direct value or a function-like resolver.
 * - Returns the current instance to allow chaining.
 *
 * Notes:
 * - When setting, the current class name, index, and element reference are passed
 *   into `$.compute(...)` so the value can be derived dynamically.
 * - This method is chainable.
 *
 * @param {*} input - The class value to set, or a resolver used by `$.compute(...)`.
 * @returns {Object} The current instance for chaining.
 */
jUtils.fn.setClass = function (input) {
this.set((el, index) => {
// Compute the final class value before assigning it.
const value = $.compute(input, el.className, index, el);    
el.className = value;
});
return this;   
}



/**
 * Adds one or more classes to the matched elements.
 *
 * Behavior:
 * - Computes the final class input through `$.compute(...)`, allowing the value
 *   to be a direct string or a function-like resolver.
 * - Splits the resulting value into whitespace-separated class names.
 * - Adds each class name to `classList` for every matched element.
 * - Returns the current instance to allow chaining.
 *
 * Notes:
 * - Non-string values are converted with `String(...)` before splitting.
 * - Empty or whitespace-only input results in no classes being added.
 * - This method is chainable.
 *
 * @param {*} input - Class name(s) to add, or a resolver used by `$.compute(...)`.
 * @returns {Object} The current instance for chaining.
 */
jUtils.fn.addClass = function (input) {
this.set((el, index) => {
// Compute the final class value before processing it.
const value = $.compute(input, el.className, index, el);
const words = String(value).match(/\S+/g) ?? [];
words.forEach(v => el.classList.add(v));
});
return this;
}



/**
 * Toggles one or more classes on the matched elements.
 *
 * Behavior:
 * - Computes the final class input through `$.compute(...)`, allowing the value
 *   to be a direct string or a function-like resolver.
 * - Splits the resulting value into whitespace-separated class names.
 * - Toggles each class name on `classList` for every matched element.
 * - Returns the current instance to allow chaining.
 *
 * Notes:
 * - Non-string values are converted with `String(...)` before splitting.
 * - Empty or whitespace-only input results in no classes being toggled.
 * - This method is chainable.
 *
 * @param {*} input - Class name(s) to toggle, or a resolver used by `$.compute(...)`.
 * @returns {Object} The current instance for chaining.
 */
jUtils.fn.toggleClass = function (input) {
this.set((el, index) => {
// Compute the final class value before processing it.
const value = $.compute(input, el.className, index, el);
const words = String(value).match(/\S+/g) ?? [];
words.forEach(v => el.classList.toggle(v));
});
return this;    
}



/**
 * Removes one or more classes from the matched elements.
 *
 * Behavior:
 * - Computes the final class input through `$.compute(...)`, allowing the value
 *   to be a direct string or a function-like resolver.
 * - Splits the resulting value into whitespace-separated class names.
 * - Removes each class name from `classList` for every matched element.
 * - Returns the current instance to allow chaining.
 *
 * Notes:
 * - Non-string values are converted with `String(...)` before splitting.
 * - Empty or whitespace-only input results in no classes being removed.
 * - This method is chainable.
 *
 * @param {*} input - Class name(s) to remove, or a resolver used by `$.compute(...)`.
 * @returns {Object} The current instance for chaining.
 */
jUtils.fn.removeClass = function (input) {
this.set((el, index) => {
// Compute the final class value before processing it.
const value = $.compute(input, el.className, index, el);
const words = String(value).match(/\S+/g) ?? [];
words.forEach(v => el.classList.remove(v));
});
return this;
}



/**
 * Checks whether the first matched element contains the specified class.
 *
 * Behavior:
 * - Uses `classList.contains(...)` to test for the presence of `arg`.
 * - Returns the result from `this.get(...)`, which is typically based on the first matched element.
 *
 * Notes:
 * - This method is read-only and does not modify the DOM.
 * - If no element is matched, the return value depends on how `this.get(...)` handles empty collections.
 *
 * @param {string} arg - The class name to check.
 * @returns {boolean|undefined} `true` if the class exists, otherwise `false` or `undefined` depending on collection state.
 */
jUtils.fn.hasClass = function (arg) {
return this.get(el => el.classList.contains(arg));  
}



/**
 * Applies a blur effect to the matched elements by setting the CSS `filter` property.
 *
 * Behavior:
 * - Computes the blur amount through `$.compute(...)`, allowing `input` to be a
 *   direct value or a function-like resolver.
 * - Uses the element's current computed `filter` value as the previous state.
 * - Sets `style.filter` to `blur(<value>px)` for each matched element.
 * - Returns the current instance to allow chaining.
 *
 * Notes:
 * - The default blur amount is `1`.
 * - This method overwrites the element's inline `filter` style with a blur value.
 * - If you want to preserve existing filter effects, they should be combined before assignment.
 *
 * @param {*} [input=1] - Blur amount in pixels, or a resolver used by `$.compute(...)`.
 * @returns {Object} The current instance for chaining.
 */
jUtils.fn.frost = function (input = 1) {
this.set((el, index) => {
const value = $.compute(input, getComputedStyle(el).filter, index, el);
el.style.filter = `blur(${value}px)`;   
});
return this;
}



/**
 * Masks the visible content of matched elements with a repeated symbol.
 *
 * Behavior:
 * - Uses `value` for `INPUT` and `TEXTAREA` elements.
 * - Uses `textContent` for all other elements.
 * - Stores the original content in `el.$jUtils_maskValue` the first time masking is applied.
 * - Replaces the displayed content with a repeated mask symbol.
 *
 * Notes:
 * - If `length` is numeric, it controls how many mask characters are shown.
 * - Otherwise, the current content length is used.
 * - Masking is only applied once per element because of the `el.$jUtils_maskValue` guard.
 * - This method is chainable.
 *
 * @param {string} [symbol='*'] - The character or string used to mask the content.
 * @param {number} [length] - Optional number of mask characters to display.
 * @returns {Object} The current instance for chaining.
 */
jUtils.fn.mask = function (symbol = '*', length) {
this.set(el => {
  const prop = ['INPUT', 'TEXTAREA'].includes(el.tagName) ? 'value' : 'textContent';   
   
if(!el.$jUtils_maskValue) {
el.$jUtils_maskValue = el[prop];

const len = $.isNumeric(length) ? length : el[prop].length;
el[prop] = String(symbol).repeat(len);
}
});
return this;
}



/**
 * Restores the original content of masked matched elements.
 *
 * Behavior:
 * - Uses `value` for `INPUT` and `TEXTAREA` elements.
 * - Uses `textContent` for all other elements.
 * - Restores the saved original content from `el.$jUtils_maskValue`.
 * - Removes the mask marker after restoring the content.
 *
 * Notes:
 * - Only elements that were previously masked are affected.
 * - This method is chainable.
 *
 * @returns {Object} The current instance for chaining.
 */
jUtils.fn.unmask = function () {
this.set(el => {
// Restore the original value only if the element was previously masked.  
  if(el.$jUtils_maskValue) {
   const prop = ['INPUT', 'TEXTAREA'].includes(el.tagName) ? 'value' : 'textContent';
   el[prop] = el.$jUtils_maskValue;  
   delete el.$jUtils_maskValue;
  }  
});
return this;    
}



/**
 * Returns the original unmasked text.
 *
 * @returns {string} The text before masking was applied.
 */
jUtils.fn.unmaskText = function () {
return this.get(el => el.$jUtils_maskValue);
}



/**
 * Masks a specific range of characters in the matched elements.
 *
 * Behavior:
 * - Uses `value` for `INPUT` and `TEXTAREA` elements.
 * - Uses `textContent` for all other elements.
 * - Stores the original content in `el.$jUtils_maskValue` the first time masking is applied.
 * - Replaces either a single character or a range of characters with the provided symbol.
 *
 * Notes:
 * - If only `symbol` and `start` are effectively provided, a single character at the safe index is masked.
 * - If `length` is provided, a range starting at `start` is replaced with repeated mask symbols.
 * - The original content is preserved so it can be restored later.
 * - This method is chainable.
 *
 * @param {string} [symbol='*'] - The symbol used for masking.
 * @param {number} [start=0] - The starting index of the masked range.
 * @param {number} [length=1] - The number of characters to mask.
 * @returns {Object} The current instance for chaining.
 */
jUtils.fn.maskRange = function (symbol = '*', start = 0, length = 1) {
this.set(el => {
const prop = ['INPUT', 'TEXTAREA'].includes(el.tagName) ? 'value' : 'textContent'; 

if(!el.$jUtils_maskValue) {
 el.$jUtils_maskValue = el[prop];
 const value = Array.from(String(el[prop]));

// Mask either a single safe character or a full range, depending on the provided arguments.     
 if(arguments.length >= 0 && arguments.length <= 2) {    
 // Ensure it produces safe length so -1 and others work correctly 
  const len = $.pos(value.length).safe(start);
  value[len] = symbol;
  el[prop] = value.join('');
 } else {
  value.splice(start, length, String(symbol).repeat(length));
  el[prop] = value.join('');
 }
}  
});
return this;   
}



/**
 * Masks characters in the matched elements based on a callback condition.
 *
 * Behavior:
 * - Uses `value` for `INPUT` and `TEXTAREA` elements.
 * - Uses `textContent` for all other elements.
 * - Calls `callback(char, index, originalValue, element)` for each character.
 * - Replaces characters with the provided symbol when the callback returns a truthy value.
 * - Stores the original content in `el.$jUtils_maskValue` before masking.
 *
 * Notes:
 * - `callback` must be a function; otherwise an error is thrown.
 * - Masking is applied only once per element because of the `el.$jUtils_maskValue` guard.
 * - This method is chainable.
 *
 * @param {string} [symbol='*'] - The symbol used to replace matched characters.
 * @param {Function} callback - A function that decides which characters should be masked.
 * @returns {Object} The current instance for chaining.
 */
jUtils.fn.maskEach = function (symbol = '*', callback) {
  if(typeof callback !== 'function') $.error(`${callback} is not a function at argument 2`);
  
this.set((el, index) => {
const prop = ['INPUT', 'TEXTAREA'].includes(el.tagName) ? 'value' : 'textContent'; 

// Build the masked value character by character, then store the original content once. 
const value = Array.from(String(el[prop])).map((char, i, text) => {
const options = {
 char, 
 charIndex: i,
 text: el[prop], 
 element: el, 
 elementIndex: index
}

if(callback(options)) return symbol;
return char;
}).join(''); 

if(!el.$jUtils_maskValue) {
el.$jUtils_maskValue = el[prop];
el[prop] = value;
}
});
return this;  
}



/**
 * Gets or sets data attributes on the matched elements.
 *
 * Behavior:
 * - If `key` is an object, sets multiple data attributes from its key/value pairs.
 * - If `key` and `value` are both provided, sets a single data attribute.
 * - If `key` is provided and `value` is omitted, gets one or more data attribute values.
 * - If neither `key` nor `value` is provided, returns all enumerable data attributes from the first matched element.
 *
 * Notes:
 * - When setting, values can be direct values or computed values via `$.compute(...)`.
 * - When getting multiple keys, an object of data attribute names and values is returned.
 * - When getting all data attributes, only the first matched element is used.
 * - This method supports chaining when used as a setter.
 *
 * @param {string|Array|string[]|Object} [key] - Data attribute name, list of names, or object of data attributes.
 * @param {*} [value] - Data attribute value to set, or resolver used by `$.compute(...)`.
 * @returns {Object|String|jUtils|undefined} Data value(s), all data attributes, or the current instance when setting.
 */
jUtils.fn.data = function (key, value) {
if($.isObject(key)) {
 for(const [k, v] of Object.entries(key)){
   this.data(k, v); 
 } 
 return this;  
} else if(key !== undefined && value !== undefined){
this.set((el, index) => {
// Compute the final data value before assigning it.     
const result = $.compute(value, el.dataset[key], index, el);
 el.dataset[key] = result; 
});
return this;       
 } else if(key !== undefined && value === undefined) {
const obj = {};

this.get(el => {
[].concat(key).forEach(k => {
obj[k] = el.dataset[k];
  }); 
});

return Array.isArray(key) ? obj : obj[key];    
 } else {
const obj = {}; 

this.get(el => {
for(const [k, v] of Object.entries(el.dataset)){
obj[k] = v;
}
});

return obj;      
 }
}



/**
 * Removes one or more data attributes from the matched elements.
 *
 * Behavior:
 * - Accepts a single key or an array of keys.
 * - Normalizes the input into an array using `[].concat(...)`.
 * - Deletes each matching property from `el.dataset` for every matched element.
 * - Returns the current instance to allow chaining.
 *
 * Notes:
 * - If a key does not exist, `delete` has no effect.
 * - This method is chainable.
 *
 * @param {string|string[]} [fields=[]] - Data attribute name or list of names to remove.
 * @returns {Object} The current instance for chaining.
 */
jUtils.fn.removeData = function (fields = []) {
fields = [].concat(fields);

this.set(el => {
// Remove each requested data attribute from the element dataset.
fields.forEach(key => delete el.dataset[key]);   
});

return this;    
}



/**
 * Gets or sets the inline CSS text of the matched elements.
 *
 * Behavior:
 * - If called with no arguments, returns the `cssText` of the first matched element.
 * - If `styles` is provided, computes the final value through `$.compute(...)`.
 * - When `append` is `true`, appends the computed styles to the existing `cssText`.
 * - When `append` is `false`, replaces the existing `cssText` entirely.
 *
 * Notes:
 * - This method supports both direct values and computed values.
 * - Appended styles are converted with `$.toKebabCase(...)` before being added.
 * - This method is chainable when used as a setter.
 *
 * @param {string} [styles=''] - CSS text to set, or a resolver used by `$.compute(...)`.
 * @param {boolean} [append=false] - Whether to append to the existing `cssText`.
 * @returns {string|Object} The current `cssText` when getting, or the current instance when setting.
 */
jUtils.fn.cssText = function (styles = '', append = false) {
if(arguments.length === 0) return this.get(el => el.style.cssText);

this.set((el, index, arr) => {
// Compute the final CSS text before applying it to the element.
const result = $.compute(styles, el.style.cssText, index, el);
if(append) {
el.style.cssText += $.toKebabCase(result);    
} else {
el.style.cssText = result;
}
});

return this;
}



/**
 * Registers a callback to run when the document or window is ready.
 *
 * Behavior:
 * - Validates that `callback` is a function.
 * - Uses the first matched element as the target.
 * - If the target is a `Document`, listens for `DOMContentLoaded`.
 * - If the target is a `Window`, listens for `load`.
 *
 * Notes:
 * - This method is chainable.
 * - If the first matched element is neither `Document` nor `Window`, nothing is registered.
 *
 * @param {Function} callback - The function to execute when the target is ready.
 * @returns {Object} The current instance for chaining.
 */
jUtils.fn.ready = function (callback) {
if(typeof callback !== 'function') $.error(`${callback} is not a function at argument 1`);

const target = this.elements[0];

if(target instanceof Document) {
document.addEventListener('DOMContentLoaded', callback); 
}

if(target instanceof Window) {
window.addEventListener('load', callback);    
}

return this;
}



/**
 * Filters the matched elements using a selector, callback, or element collection.
 *
 * Behavior:
 * - If `input` is a string, keeps elements that match the selector via `el.matches(...)`.
 * - If `input` is a function, keeps elements for which the callback returns a truthy value.
 * - Otherwise, treats `input` as a jQuery-like/jUtils-like collection and keeps elements
 *   that exist in that collection.
 *
 * Notes:
 * - Only element nodes are tested against CSS selectors.
 * - The returned value is a new `jUtils` instance containing the filtered elements.
 *
 * @param {string|Function|*} input - Selector, predicate, or collection used for filtering.
 * @returns {jUtils} A new `jUtils` instance with the filtered elements.
 */
jUtils.fn.filter = function (input) {
const result = this.elements.filter((el, index, arr) => {
// Match by selector, callback, or membership in another collection.
if(typeof input === 'string' && (el && el.nodeType === 1)) return el.matches(input);  

if(typeof input === 'function') return input(el, index, arr);

return $(input).elements.some(item => item === el);
});

return new jUtils(result);   
}



/**
 * Excludes matched elements using a selector, callback, or element collection.
 *
 * Behavior:
 * - If `input` is a string, removes elements that match the selector via `el.matches(...)`.
 * - If `input` is a function, removes elements for which the callback returns a truthy value.
 * - Otherwise, treats `input` as a jQuery-like/jUtils-like collection and removes elements
 *   that exist in that collection.
 *
 * Notes:
 * - Only element nodes are tested against CSS selectors.
 * - The returned value is a new `jUtils` instance containing the remaining elements.
 *
 * @param {string|Function|*} input - Selector, predicate, or collection used for exclusion.
 * @returns {jUtils} A new `jUtils` instance with the excluded elements removed.
 */
jUtils.fn.not = function (input) {
const result = this.elements.filter((el, index, arr) => {
// Exclude by selector, callback, or membership in another collection.
if(typeof input === 'string' && (el && el.nodeType === 1)) return !el.matches(input);

if(typeof input === 'function') return !input(el, index, arr); 

return !$(input).elements.some(item => item === el);
});  

return new jUtils(result);
}



/**
 * Tests whether the matched elements satisfy a selector, predicate, or membership check.
 *
 * Behavior:
 * - If `input` is a string, supports special pseudo-selectors:
 *   - `:visible`
 *   - `:hidden`
 *   - `:removed`
 *   - `:checked`
 *   - `:enabled`
 *   - `:disabled`
 *   - `:selected`
 * - Otherwise, falls back to `el.matches(input)` for standard selectors.
 * - If `input` is a function, calls it with `(el, index, arr)`.
 * - For any other supported input, checks whether the element exists in the resolved collection.
 *
 * @param {string|Function|*} input - Selector, predicate, or collection-like input.
 * @returns {boolean} True if at least one matched element satisfies the condition.
 */
jUtils.fn.is = function (input) {
return this.get((el, index, arr) => {
// Test by selector, callback, or membership in another collection.
if(typeof input === 'string') {
 switch (input) {          
      case ':visible':
        return el.offsetParent !== null;
      case ':hidden':
        return el.offsetParent === null;     
      case ':removed':      
        return !el;
      case ':checked':
        return el.checked;
      case ':enabled':
        return !el.disabled;
      case ':disabled':
        return el.disabled;
      case ':selected':     
        return el.selected;   
      default:
        return el.matches(input);      
 }     
}

if(typeof input === 'function') return input(el, index, arr); 

return $(input).elements.some(item => item === el);
}, 'some'); 
}



/**
 * Transforms the matched elements using a callback and returns a new `jUtils` instance.
 *
 * Behavior:
 * - Validates that `callback` is a function.
 * - Flattens the current element collection before mapping.
 * - Passes the native `Array.prototype.map(...)` arguments to the callback.
 * - Wraps the mapped result in a new `jUtils` instance.
 *
 * Notes:
 * - This method does not modify the original collection.
 * - The callback receives `(element, index, array)` as in native `map`.
 * - This method is chainable through the returned `jUtils` instance.
 *
 * @param {Function} callback - The mapping function applied to each matched element.
 * @returns {jUtils} A new `jUtils` instance containing the mapped result.
 */
jUtils.fn.map = function (callback) {
if(typeof callback !== 'function') {
 $.error(`${callback} is not a function at argument 1`);
}

// Map the collection and wrap the result in a new instance.
const result = this.elements.map(callback);
return new jUtils(result);
}



/**
 * Gets the child elements of each matched element, or filters them by input.
 *
 * Behavior:
 * - With no arguments, returns all direct child elements.
 * - With a number, returns the child at that index.
 * - Supports negative indexes via `$.pos(...).loose(...)`.
 * - With a string selector, returns children matching the selector.
 * - With a function, filters children through the predicate.
 * - With any other supported input, returns children that are included in the resolved set.
 *
 * @param {string|number|Function|*} [input] - Optional filter, index, or selector.
 * @returns {jUtils} A new jUtils instance containing the result.
 */
jUtils.fn.child = function (input) {
const result = this.get(el => {
const children = Array.from(el.children);   

if(arguments.length === 0) return children;

if(typeof input === 'number') {
// Support negative index. 
const len = $.pos(children.length).loose(input);
return children[len];
}

if(typeof input === 'string') return children.filter(e => e.matches(input));  

if(typeof input === 'function') return children.filter(input);

return $(input).elements.filter(item => children.includes(item));
}, 'map');

return new jUtils(result);
}



/**
 * Gets the parent element of each matched element, or filters it by input.
 *
 * Behavior:
 * - With no arguments, returns the direct parent element.
 * - With a string selector, returns the parent only if it matches the selector.
 * - With a function, filters the parent through the predicate.
 * - With any other supported input, returns the parent if it matches the resolved elements.
 *
 * @param {string|Function|*} [input] - Optional filter or selector.
 * @returns {jUtils} A new jUtils instance containing the result.
 */
jUtils.fn.parent = function (input) {
const result = this.get(el => {
const parent = el.parentElement;    

if(arguments.length === 0) return parent;

if(typeof input === 'string' && parent.matches(input)) return parent;

if(typeof input === 'function') return [].concat(parent).filter(input);

return $(input).elements.filter(item => item === parent);
}, 'map');

return new jUtils(result);
}


 
/**
 * Finds descendant elements matching the given selector or input.
 *
 * Behavior:
 * - If `selector` is a string, returns all descendant elements matching it.
 * - Otherwise, resolves `selector` through `$()` and returns the resolved nodes
 *   that are contained within each matched element.
 *
 * @param {string|*} selector - CSS selector or supported jUtils input.
 * @returns {jUtils} A new jUtils instance containing the matched descendants.
 */
jUtils.fn.find = function (selector) {
const result = this.get(el => {
if(typeof selector === 'string') {
return Array.from(el.querySelectorAll(selector)).filter(e => e.matches(selector));  
} else {
return $(selector).elements.filter(item => {
if(item !== el && item instanceof Node) return el.contains(item);
});
} 
}, 'map');

return new jUtils(result);
}



/**
 * Filters the matched elements to those that contain the given selector or input.
 *
 * Behavior:
 * - If `selector` is a string, keeps elements that contain at least one descendant
 *   matching that selector.
 * - Otherwise, resolves `selector` through `$()` and keeps elements that contain
 *   at least one of the resolved nodes.
 *
 * @param {string|*} selector - CSS selector or supported jUtils input.
 * @returns {jUtils} A new jUtils instance containing only matching elements.
 */
jUtils.fn.has = function (selector) {
const result = this.get(el => {
if(typeof selector === 'string') {
return Array.from(el.querySelectorAll(selector)).some(e => e.matches(selector));  
} else {
return $(selector).elements.some(item => {
if(item !== el && item instanceof Node) return el.contains(item);
});
}
}, 'filter');

return new jUtils(result);
}



/**
 * Gets the closest ancestor element that matches the given selector or input.
 *
 * Behavior:
 * - Traverses upward through the DOM tree from each matched element.
 * - If `selector` is a string, returns the first ancestor that matches it.
 * - Otherwise, resolves `selector` through `$()` and checks for identity match.
 * - Stops at the first match for each element.
 *
 * @param {string|*} selector - CSS selector or supported jUtils input.
 * @returns {jUtils} A new jUtils instance containing the matched ancestors.
 */
jUtils.fn.closest = function (selector) {
const result = [];

this.set(el => {
// Traverse upward through DOM tree.
while(el) { 

if (typeof selector === 'string') {
 if(el.matches(selector)) {
  result.push(el);
  break; // stop at first match
 }
} else {
const items = $(selector).elements.filter(item => item === el);

if(items.length > 0) {
result.push(items);
break;    
} 
}

// Move to parent element. 
el = el.parentElement;    
}    
}); 
     
return new jUtils(result);
}



/**
 * Iterates over each matched element and executes a callback.
 *
 * Behavior:
 * - Validates that `callback` is a function.
 * - Calls `forEach` on the internal element collection.
 * - Returns a new jUtils instance wrapping the result.
 *
 * @param {Function} callback - Function invoked for each element.
 * @returns {jUtils} A new jUtils instance.
 */
jUtils.fn.each = function (callback) {
if(typeof callback !== 'function') $.error(`${callback} is not a function at argument 1`);

this.elements.forEach(callback);
return this;    
}



/**
 * Adds the matched elements from the provided selectors/inputs to the current collection.
 *
 * Behavior:
 * - Accepts multiple arguments.
 * - If an argument is a string, it is treated as a CSS selector.
 * - Otherwise, it is resolved through `$()` and its elements are added.
 * - Includes the current collection in the final result.
 * - Removes duplicate elements before returning.
 *
 * @param {...*} args - Selectors or supported jUtils inputs to add.
 * @returns {jUtils} A new jUtils instance containing the merged unique elements.
 */
jUtils.fn.add = function (...args) {
let result = [];

args.forEach(selector => {
if(typeof selector === 'string') {
const value = Array.from(document.querySelectorAll(selector));  
result.push(...value);
} else {
result.push(...$(selector).elements);
}  
});

// Add the current elements in jUtils to the collection.
result.push(...this.elements);

// Prevent duplicates, like an element appearing multiple times.
result = $.unique(...result);

return new jUtils(result);
}



/**
 * Gets the next sibling element of the first matched element, or filters it by input.
 *
 * Behavior:
 * - With no arguments, returns the next element sibling.
 * - With a string selector, returns the next sibling only if it matches the selector.
 * - With a function, filters the next sibling through the predicate.
 * - With any other supported input, returns the next sibling if it matches the resolved elements.
 *
 * @param {string|Function|*} [input] - Optional filter or selector.
 * @returns {jUtils} A new jUtils instance containing the result.
 */
jUtils.fn.next = function (input) {
const result = this.get((el, index, arr) => {
const sibling = el.nextElementSibling;

if(arguments.length === 0) return sibling;

if(typeof input === 'string' && sibling.matches(input)) return sibling;

if(typeof input === 'function') return [].concat(sibling).filter(input);

return $(input).elements.filter(item => item === sibling);  
}); 

return new jUtils(result);
}



/**
 * Gets the previous sibling element of the first matched element, or filters it by input.
 *
 * Behavior:
 * - With no arguments, returns the previous element sibling.
 * - With a string selector, returns the previous sibling only if it matches the selector.
 * - With a function, filters the previous sibling through the predicate.
 * - With any other supported input, returns the previous sibling if it matches the resolved elements.
 *
 * @param {string|Function|*} [input] - Optional filter or selector.
 * @returns {jUtils} A new jUtils instance containing the result.
 */
jUtils.fn.prev = function (input) {
const result = this.get((el, index, arr) => {
const sibling = el.previousElementSibling;

if(arguments.length === 0) return sibling;

if(typeof input === 'string' && sibling.matches(input)) return sibling;

if(typeof input === 'function') return [].concat(sibling).filter(input);

return $(input).elements.filter(item => item === sibling);  
}); 

return new jUtils(result);    
}



/**
 * Gets the first child element of the first matched element, or filters it by input.
 *
 * Behavior:
 * - With no arguments, returns the first element child.
 * - With a string selector, returns the first child only if it matches the selector.
 * - With a function, filters the first child through the predicate.
 * - With any other supported input, returns the first child if it matches the resolved elements.
 *
 * @param {string|Function|*} [input] - Optional filter or selector.
 * @returns {jUtils} A new jUtils instance containing the result.
 */
jUtils.fn.first = function (input) {
const result = this.get((el, index, arr) => {
const child = el.firstElementChild;

if(arguments.length === 0) return child;

if(typeof input === 'string' && child.matches(input)) return child;

if(typeof input === 'function') return [].concat(child).filter(input);

return $(input).elements.filter(item => item === child);  
}); 

return new jUtils(result);       
}



/**
 * Gets the last child element of the first matched element, or filters it by input.
 *
 * Behavior:
 * - With no arguments, returns the last element child.
 * - With a string selector, returns the last child only if it matches the selector.
 * - With a function, filters the last child through the predicate.
 * - With any other supported input, returns the last child if it matches the resolved elements.
 *
 * @param {string|Function|*} [input] - Optional filter or selector.
 * @returns {jUtils} A new jUtils instance containing the result.
 */
jUtils.fn.last = function (input) {
const result = this.get((el, index, arr) => {
const child = el.lastElementChild;

if(arguments.length === 0) return child;

if(typeof input === 'string' && child.matches(input)) return child;

if(typeof input === 'function') return [].concat(child).filter(input);

return $(input).elements.filter(item => item === child);  
}); 

return new jUtils(result);          
}



/**
 * Inserts HTML content immediately before each matched element.
 *
 * Behavior:
 * - Uses `insertAdjacentHTML('beforebegin', ...)` to place content before the element.
 * - Expects `input` to be an HTML string.
 *
 * @param {string} input - HTML to insert before the matched elements.
 * @returns {jUtils} The current instance for chaining.
 */
jUtils.fn.before = function (input) {
this.set(el => el.insertAdjacentHTML('beforebegin', input));
return this;   
}



/**
 * Inserts HTML content immediately after each matched element.
 *
 * Behavior:
 * - Uses `insertAdjacentHTML('afterend', ...)` to place content after the element.
 * - Expects `input` to be an HTML string.
 *
 * @param {string} input - HTML to insert after the matched elements.
 * @returns {jUtils} The current instance for chaining.
 */
jUtils.fn.after = function (input) {
this.set(el => el.insertAdjacentHTML('afterend', input));
return this;       
}



/**
 * Removes the matched elements from the DOM.
 *
 * Behavior:
 * - Calls `remove()` on each matched element.
 *
 * @returns {jUtils} The current instance for chaining.
 */
jUtils.fn.remove = function () {
this.set(el => el.remove());
return this;  
}



/**
 * Gets or sets the outer HTML of the matched elements.
 *
 * Behavior:
 * - When called with no arguments, returns the stored outerHTML if available,
 *   otherwise returns the element's current `outerHTML`.
 * - When called with a Node, replaces the element with that Node and stores
 *   the Node's `outerHTML`.
 * - When called with a string, sets `outerHTML` directly and stores the string.
 *
 * @param {Node|string} [input] - Replacement content or omitted to read outerHTML.
 * @returns {jUtils|string} The current instance when setting, or the outerHTML value when getting.
 */
jUtils.fn.outerHTML = function (input) {
if(arguments.length === 0) {
 return this.get(el => {
return el.$jUtils_outerHTML ?? el.outerHTML;
 });
}

this.set(el => {
if(input instanceof Node) {
el.replaceWith(input);  
el.$jUtils_outerHTML = input.outerHTML;
} else {
el.outerHTML = input;  
el.$jUtils_outerHTML = input;
}
});

return this;
}



/**
 * Detaches the matched elements from the DOM and stores their original position.
 *
 * Behavior:
 * - Prevents detaching `<html>` and `<body>`.
 * - Stores each element's parent and next sibling for later restoration.
 * - Removes the element from the DOM.
 * - Saves the detached elements metadata in `storedElements`.
 *
 * @returns {jUtils} The current instance for chaining.
 */
jUtils.fn.detach = function () {
const result = [];
this.set(el => {
if(el === document.body || el === document.documentElement) $.error("Detaching the <html> or <body> element is not supported.");

  result.push({
    target: el,
    parent: el.parentNode,    
    sibling: el.nextSibling 
  });
 el.remove();
}, 'map');

this.storedElements = result;
return this;
}



/**
 * Restores previously removed elements to their original positions.
 *
 * Behavior:
 * - Uses `storedElements` to track original parent/sibling relationships.
 * - If the original sibling still exists in the same parent, inserts the element
 *   before that sibling.
 * - Leaves the element in place if restoration is no longer possible.
 *
 * @returns {jUtils} The current instance for chaining.
 */
jUtils.fn.restore = function () {
if(this.storedElements) {
 this.storedElements.forEach(item => {  
if(item.sibling && item.sibling.parentNode === item.parent) {
 item.parent.insertBefore(item.target, item.sibling);    
} 
 });
 } 
return this;
}



/**
 * Moves the matched elements into a new parent element.
 *
 * Behavior:
 * - Resolves `selector` through `$()` so it can accept any supported selector/input type.
 * - Uses only the first matched target element as the new parent.
 * - Appends each stored matched element into that parent.
 *
 * @param {*} selector - Target selector, element, or supported jUtils input.
 * @returns {jUtils} The current instance for chaining.
 */
jUtils.fn.moveTo = function (selector) {
// Resolve the target and use the first matched element only.
const newParent = $(selector).get(item => item);

if(this.storedElements) {
this.storedElements.forEach(item => {
if(newParent) newParent.append(item.target);  
});    
}
return this;
}



/**
 * Appends one or more nodes or strings to each matched element.
 *
 * @param {...Node|string} args - Content to append.
 * @returns {jUtils} The current instance for chaining.
 */
jUtils.fn.append = function (...args) {
this.set(el => el.append(...args));
return this; 
}



/**
 * Prepends one or more nodes or strings to each matched element.
 *
 * @param {...Node|string} args - Content to prepend.
 * @returns {jUtils} The current instance for chaining.
 */
jUtils.fn.prepend = function (...args) {
this.set(el => el.prepend(...args));
return this;     
}



/**
 * Appends the matched elements into the target element.
 *
 * Behavior:
 * - Resolves `input` through `$()` so it can accept any supported selector/input type.
 * - Uses only the first matched target element.
 * - Appends each matched element into that target.
 *
 * @param {*} input - Target selector, element, or supported jUtils input.
 * @returns {jUtils} The current instance for chaining.
 */
jUtils.fn.appendTo = function (input) {
this.set(el => {
// Resolve the target and use the first matched element only.
const target = $(input).get(item => item);
if(target) target.append(el);
});
return this; 
}



/**
 * Prepends the matched elements into the target element.
 *
 * Behavior:
 * - Resolves `input` through `$()` so it can accept any supported selector/input type.
 * - Uses only the first matched target element.
 * - Prepends each matched element into that target.
 *
 * @param {*} input - Target selector, element, or supported jUtils input.
 * @returns {jUtils} The current instance for chaining.
 */
jUtils.fn.prependTo = function (input) {
this.set(el => {
// Resolve the target and use the first matched element only.
const target = $(input).get(item => item);
if(target) target.prepend(el);
});
return this; 
}



/**
 * Hides the matched elements and stores their previous display value.
 *
 * Behavior:
 * - If the element is currently visible, saves its computed display value.
 * - If the element is already hidden, creates a temporary element of the same tag
 *   to infer the browser's default display value.
 * - Sets `display: none` on the element.
 *
 * @returns {jUtils} The current instance for chaining.
 */
jUtils.fn.hide = function () {
this.set(el => {
// Save the current display value if the element is visible.
if(el.offsetParent !== null) {
el.$jUtils_display = getComputedStyle(el).display;  
} else {
// Infer the default display value for hidden elements using a temporary element.
const tag = el.tagName.toLowerCase();
const element = document.createElement(tag);
document.body.append(element);
el.$jUtils_display = getComputedStyle(element).display;
element.remove();
}

// Hide the element.
el.style.display = 'none';   
});
return this; 
}



/**
 * Shows the matched elements by restoring their display style.
 *
 * Behavior:
 * - If the element has a stored display value, it is restored.
 * - If no stored display value exists, the current logic calls `hide()`
 *   before applying the display value, which appears to be unintended.
 *
 * @returns {jUtils} The current instance for chaining.
 */
jUtils.fn.show = function () {
this.set(el => {
// If no previous display value is stored, hide the element first.
if(!el.$jUtils_display) $(el).hide();

// Restore the saved display value.
el.style.display = el.$jUtils_display;
});
return this; 
}



/**
 * Toggles the visibility of the matched elements.
 *
 * Behavior:
 * - If an element is currently hidden, it is shown again.
 * - If an element is currently visible, it is hidden.
 * - Restores the previous display value when available.
 *
 * @returns {jUtils} The current instance for chaining.
 */
jUtils.fn.toggle = function () {
this.set(el => {
// If the element is hidden, show it; otherwise hide it.
if(el.offsetParent === null) {
if(!el.$jUtils_display) $(el).show();
else el.style.display = el.$jUtils_display;
} else {
$(el).hide();
}
});
return this;   
}



/**
 * Disables text selection on the matched elements.
 *
 * Behavior:
 * - Injects a shared stylesheet once per document.
 * - Adds an internal class that disables user selection.
 * - Prevents `selectstart` and `contextmenu` interactions.
 * - Optionally calls a callback on the first blocked interaction.
 * - Stores internal references for later cleanup via `selectable()`.
 *
 * @param {Function} [callback] - Optional callback invoked on the first blocked selection attempt.
 * @returns {jUtils} The current instance for chaining.
 */
jUtils.fn.noSelect = function (callback) {
// Reuse a single shared style element for all no-select instances.
let style = document.getElementById("jUtils_noSelectStyle");

if(!style) {
style = document.createElement('style');
style.id = 'jUtils_noSelectStyle';
    style.textContent = `
      ._jUtils-noSelect {
        -webkit-touch-callout: none;
        -webkit-user-select: none;
        -khtml-user-select: none;
        -moz-user-select: none;
        -ms-user-select: none;
        user-select: none;
      }
    `;
    document.head.append(style);  
}

// Toggle flag used to limit callback execution behavior.
let flag = false;

this.set(el => {
el.classList.add("_jUtils-noSelect");   

const fn = (e) => {
e.preventDefault();

// Call the callback only on the first blocked interaction. 
if(typeof callback === 'function' && !flag){
callback(e.target);
}

flag = !flag;
}

// Block selection and context menu interactions.
el.addEventListener("selectstart", fn);
el.addEventListener("contextmenu", fn);

// Store internal references for cleanup.
el.$jUtils_onSelectAttempt = fn;
el.$jUtils_noSelectStyle = style;
});
return this;
}



/**
 * Re-enables text selection on the matched elements.
 *
 * Behavior:
 * - Removes the internal no-select class.
 * - Detaches the stored `selectstart` and `contextmenu` handlers.
 * - Removes any injected no-select style element.
 * - Cleans up internal properties used by `noSelect()`.
 *
 * @returns {jUtils} The current instance for chaining.
 */
jUtils.fn.selectable = function () {
this.set(el => {
// Remove the no-select marker class.
el.classList.remove("_jUtils-noSelect");

// Remove the stored selection-blocking event handler.
const fn = el.$jUtils_onSelectAttempt;
el.removeEventListener("selectstart", fn);  
el.removeEventListener("contextmenu", fn);  
delete el.$jUtils_onSelectAttempt;

// Remove the injected style element if it exists.
if(el.$jUtils_noSelectStyle) {
el.$jUtils_noSelectStyle.remove();  
delete el.$jUtils_noSelectStyle;
} 
});
return this;   
}



/**
 * Detects a long press on the matched elements.
 *
 * Behavior:
 * - Starts a timer on `touchstart`.
 * - Calls the callback if the press lasts for the configured duration.
 * - Cancels the timer on `touchend`.
 * - Optionally disables the context menu behavior during the press.
 * - Optionally registers the listeners with `{ once: true }`.
 *
 * @param {Function} callback - Function called when the long press is detected.
 * @param {Object} [options={}] - Long-press configuration.
 * @param {number} [options.duration] - Press duration in milliseconds before triggering.
 * @param {boolean} [options.contextMenu=false] - Whether to allow the context menu behavior.
 * @param {boolean} [options.once=false] - Whether the listeners should run only once.
 * @returns {jUtils} The current instance for chaining.
 */
jUtils.fn.longPress = function (callback, options = {}) {
const { duration, contextMenu = false, once = false } = options;

let timer;

this.set(el => {
const fn = (e) => {
if(e.type === 'touchstart') {
if(!contextMenu) $(e.target).noSelect();
timer = setTimeout(() => {
if(typeof callback === 'function') callback(e.target);
}, duration);    
} else {
clearTimeout(timer);
$(e.target).selectable(); 
}
}

el.addEventListener('touchstart', fn, { once });
el.addEventListener('touchend', fn, { once });   
});
return this;   
}



/**
 * Limits the text length of matched elements.
 *
 * Behavior:
 * - Validates that `max` is numeric.
 * - Uses `value` for `<input>` and `<textarea>` elements.
 * - Uses `textContent` for all other elements.
 * - Truncates content when it exceeds the maximum length.
 * - Calls the optional callback after truncation.
 *
 * @param {number} max - Maximum allowed character length.
 * @param {Function} [callback] - Optional callback invoked after truncation.
 * @returns {jUtils} The current instance for chaining.
 */
jUtils.fn.textLimit = function (max, callback) {
if(!$.isNumeric(max)) $.error(`"${max}" is not a numeric value`);   

this.set(el => {
const prop = el.tagName === 'INPUT' ||  el.tagName === 'TEXTAREA' ? 'value' : 'textContent';

el.addEventListener('input', (e) => {
const value = e.target[prop];

if(value.length > max) {
 e.target[prop] = value.slice(0, max);
if(typeof callback === 'function') callback(e.target);
}
});  
});
return this;
}



/**
 * Creates a horizontal divider with optional centered text.
 *
 * Behavior:
 * - Clears the element content.
 * - Converts the element into a flex container.
 * - Adds left and right line segments with a centered text label.
 * - Allows styling the container, both lines, each side independently, and the text.
 *
 * @param {string} [value=''] - Text to display in the center of the divider.
 * @param {Object} [options={}] - Styling options for the divider.
 * @param {Object} [options.lineStyle={}] - Shared styles applied to both line segments.
 * @param {Object} [options.leftLineStyle={}] - Styles applied only to the left line.
 * @param {Object} [options.rightLineStyle={}] - Styles applied only to the right line.
 * @param {Object} [options.textStyle={}] - Styles applied to the center text.
 * @param {string} [options.gap='10px'] - Gap between the line segments and the text.
 * @returns {jUtils} The current instance for chaining.
 */
jUtils.fn.divider = function (value = '', options = {}) {
const {
lineStyle = {},
leftLineStyle = {},
rightLineStyle = {},  
textStyle = {}      
} = options;

this.set(el => {
// Create the left line, right line, and center text nodes.
const left = document.createElement('div');
const right = document.createElement('div');
const text = document.createElement('span');
text.textContent = value;

// Turn the host element into a centered flex container.
Object.assign(el.style, {
     display: 'flex',
     alignItems: 'center',
     textAlign: 'center',
     justifyContent: 'center',
     gap: options.gap ?? '10px',
     width: '100%',
    });

// Base line styles shared by both sides.
const hrStyles = {      
  'border-radius': '2px', 
  border: '2px solid blue',
  'flex-grow': 1 /* Works only inside a flex container */
}  

// Apply shared and side-specific styles.
Object.assign(left.style, hrStyles, leftLineStyle);
Object.assign(right.style, hrStyles, rightLineStyle); 
Object.assign(text.style, textStyle);

// Apply any container-level line styles to both sides.
[left, right].forEach(e => Object.assign(e.style, lineStyle));

// Replace existing content with the divider structure.
el.innerHTML = '';
el.append(left, text, right);    
});
return this;    
}



/**
 * Internal event registry used to track listeners attached through `on()`.
 *
 * This array stores metadata for later removal via `off()`.
 */
jUtils.fn.$jUtils_event = [];

/**
 * Attaches event listeners to the matched elements.
 *
 * Behavior:
 * - Supports object form: `{ eventName: handler }`
 * - Supports delegated events when `selector` is a string
 * - Supports direct events when `selector` is a function
 * - Stores listener metadata in `$jUtils_event` for later removal
 *
 * @param {string|Object} type - Event type, space-separated event names, or an event map.
 * @param {string|Function} selector - Delegated selector or event callback.
 * @param {Function|Object} [callback] - Callback function or event options in direct mode.
 * @param {Object} [options={}] - Listener options passed to `addEventListener`.
 * @returns {jUtils} The current instance for chaining.
 */
jUtils.fn.on = function (type, selector, callback, options = {}) {
// Support object form: { eventName: handler, ... }
if($.isObject(type)) {
Object.entries(type).forEach(([key, value]) => { 
 if(typeof selector === 'string') {
  this.on(key, selector, value, options);    
 } else {
  this.on(key, value, options);
 }
});
return this;
}

// Normalize event names from a space-separated string.
type = String(type).match(/\S+/g) ?? [];

this.set(el => {
const handler = (e) => {
if(typeof selector === 'string') {
// Delegated event: find matching descendant and run the callback.
const parent = e.target.closest(selector);
if (parent && el.contains(parent)) callback(e);
} else {
// Direct event: selector is the callback.
selector(e);
options = callback;
}    
}

// Attach the handler for each event name.
type.forEach(evt => el.addEventListener(evt, handler, options));  

// Store listener metadata for later removal.
this.$jUtils_event.push({ 
 handler, 
 type, 
 selector: typeof selector === 'string' ? selector : '', 
 listener: typeof callback === 'function' ? callback : selector
});
 
});
return this;
}



/**
 * Removes event listeners from the matched elements.
 *
 * Behavior:
 * - Supports removing listeners by event type, selector, callback, or an object map.
 * - If `type` is an object, treats it as a map of event names to handlers/selectors.
 * - If `selector` is a string, removes the matching delegated listener.
 * - If `selector` is not a string, treats it as the callback/handler reference.
 * - Uses the stored internal event registry (`this.$jUtils_event`) to find handlers.
 *
 * @param {string|Object} type - Event type, space-separated event names, or an event map.
 * @param {string|Function} [selector] - Delegated selector or callback reference.
 * @param {Function|Object} [callback] - Callback reference or event options.
 * @param {Object} [options={}] - Options passed to `removeEventListener`.
 * @returns {jUtils} The current instance for chaining.
 */
jUtils.fn.off = function (type, selector, callback, options = {}) {
// Support object form: { eventName: handler, ... }
if($.isObject(type)) {
Object.entries(type).forEach(([key, value]) => { 
 if(typeof selector === 'string') {
  this.off(key, selector, value, options);    
 } else {
  this.off(key, value, options);
 }
});
return this;
}

// Normalize event type input into an array of event names.
const eventType = (input) => {
return type !== undefined ? String(type).match(/\S+/g) ?? [] : input;
}

this.set(el => {
if(typeof selector === 'string') {
// Find the delegated listener for the given selector.
const item = this.$jUtils_event.filter(item => item.selector === selector).shift();

if(callback && item?.listener !== callback) return this;

eventType(item.type).forEach(evt => el.removeEventListener(evt, item.handler, options)); 
} else {
// Remove listeners by callback reference or by stored event records.
this.$jUtils_event.forEach(item => {
if(selector && item?.listener !== selector) return this;

eventType(item.type).forEach(evt => el.removeEventListener(evt, item.handler, options));   
});   
}
});
return this;
}



/**
 * Dispatches one or more events on each matched element.
 *
 * Behavior:
 * - Accepts a single event name or a whitespace-separated list of event names.
 * - If `options` is not an object, it is treated as `detail` for a custom event.
 * - Uses `Event` by default, or `CustomEvent` when a second argument is provided.
 *
 * @param {string} type - Event name or space-separated event names.
 * @param {Object|*} [options={}] - Event options or custom event detail value.
 * @returns {jUtils} The current instance for chaining.
 */
jUtils.fn.trigger = function (type, options = {}) {
// Convert non-object input into a CustomEvent detail payload.
if(!$.isObject(options)) options = { detail: options };

// Split the event string into individual event names.
type = String(type).match(/\S+/g) ?? [];

this.set(el => {
let mode = 'Event';

// If a second argument was provided, dispatch a CustomEvent.
if(arguments.length >= 2) mode = 'CustomEvent';

type.forEach(evt => {
el.dispatchEvent(new window[mode](evt, options));
});
});
return this;   
}



/**
 * Gets or sets CSS properties on the matched elements.
 *
 * Behavior:
 * - If `key` is an object, treats it as a map of CSS properties and values.
 * - If both `key` and `value` are provided, sets the style property on each element.
 * - If only `key` is provided, returns the computed style value for that property.
 * - If neither is provided, returns the current instance unchanged.
 *
 * @param {string|Object} key - CSS property name or an object of property/value pairs.
 * @param {*} [value] - Value to set for the given CSS property.
 * @returns {jUtils|*} The current instance when setting values, or the computed value when getting.
 */
jUtils.fn.css = function (key, value) {
// Support object form: { prop: value, ... }
if($.isObject(key)) {
 for(const [k, v] of Object.entries(key)){
  this.css(k, v);
 }
 return this;
}

// Setter: apply a computed value to each matched element.
if(key !== undefined && value !== undefined) {
this.set((el, index) => {
   el.style[key] = $.compute(value, getComputedStyle(el)[key], index, el);
});
return this; 
}

// Getter: return the computed style value from the first matched element.
if(key !== undefined && value === undefined) {
return this.get(el => getComputedStyle(el)[key]);  
} 

// No-op fallback.
return this;
}



/**
 * Injects scoped CSS and tags matched elements with a unique data attribute.
 *
 * Behavior:
 * - Generates a unique token and scope key.
 * - Replaces `&` in the CSS with a generated attribute selector.
 * - Allows optional alias elements via `options`, each receiving the same token.
 * - Appends a new <style> element to <head>.
 * - Marks the current matched elements with the generated data attribute.
 *
 * @param {string} input - CSS text to scope and inject.
 * @param {Object} [options={}] - Optional alias map of elements to scope targets.
 * @returns {jUtils} The current instance for chaining.
 */
jUtils.fn.styles = function (input, options = {}) {
 // Generate a unique token and scope key for this style block.
const token = $.randToken(9);
const key = $.randToken(7).toLowerCase();

// Replace `&` with the generated scope selector.
let scopedCSS = String(input).replace(/&/g, `[data-${key}="${token}"]`);

// Apply aliases: each provided element gets the same data attribute.
for(let [key, value] of Object.entries(options)){
 if(value && value.nodeType !== 1) {
  $.error(`styles(): alias "${key}" must reference a DOM element.`);
 }

value.dataset[key.toLowerCase()] = token;
scopedCSS = scopedCSS.replace(key, `[data-${key}="${token}"]`); 
}

// Inject the scoped stylesheet into the document head.
const style = document.createElement('style');
style.textContent = scopedCSS;
document.head.append(style);

// Tag all matched elements with the generated scope token.
this.set(el => el.dataset[key] = token);
return this;
}
