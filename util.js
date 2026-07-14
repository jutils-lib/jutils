
/**
 * Computes a value from the given input.
 *
 * If `input` is a function, this method calls it with the provided arguments
 * and returns the result.
 *
 * If `input` is not a function, the value is returned as-is without any change.
 *
 * This is useful when you want to support both:
 * - direct values
 * - lazily evaluated values via callback functions
 *
 * Examples:
 * - $.compute(42) -> 42
 * - $.compute((a, b) => a + b, 2, 3) -> 5
 */
$.compute = function (input, ...args) {
  // If the input is a function, execute it with the remaining arguments.
  // Otherwise, return the input unchanged.
  return typeof input === 'function' ? input(...args) : input;   
}



/**
 * Creates a position helper for working with indexes relative to a target length.
 *
 * The `target` value represents the upper boundary of the range, typically the
 * length of an array, string, or any indexed collection.
 *
 * This helper returns an object with two modes:
 *
 * - `safe(index)`:
 *   Normalizes an index so it always stays within valid bounds.
 *   - Returns the index unchanged if it is already within range.
 *   - Clamps values greater than or equal to `target` to `target - 1`.
 *   - Converts negative indexes into positions counted from the end.
 *   - Never returns a value below `0`.
 *
 * - `loose(index)`:
 *   Converts a relative index into an absolute position without clamping.
 *   - Positive indexes are treated as offsets from the start.
 *   - Negative indexes are treated as offsets from the end.
 *   - This mode is less strict and may return values outside the usual safe range
 *     depending on the input.
 *
 * Both methods validate that their arguments are numbers and throw an error
 * otherwise.
 *
 * Example:
 * - $.pos(5).safe(2)   -> 2
 * - $.pos(5).safe(10)  -> 4
 * - $.pos(5).safe(-1)  -> 4
 * - $.pos(5).loose(2)  -> 2
 * - $.pos(5).loose(-1) -> 4
 */
$.pos = function (target) {
if(!$.isNumber(target)) $.error(`"${target}" is not a number`);

const obj = {};

  // Returns a valid index within the range [0, target - 1].
  // Useful when you want to prevent out-of-bounds positions.
obj.safe = function (index) {
if(!$.isNumber(index)) $.error(`"${index}" is not a type of number`);

if(index >= 0 && index < target) return index;

if(index >= target) return target - 1;

if(index < 0) return Math.max(0, target + index);    
}


  // Converts an index relative to the target length into an absolute position.
  // Positive values are treated as forward offsets, negative values as offsets
  // from the end.
obj.loose = function (index) {
if(!$.isNumber(index)) $.error(`"${index}" is not a type of number`);

if(index >= 0) {
return (target + index) - target;
} else { return target + index; };    
}

return obj; 
};



/**
 * Creates a formatted error object with a cleaner, more readable message.
 *
 * This helper is designed to standardize error handling across the library.
 * It accepts a message, an error constructor, and a logging/throwing flag.
 *
 * Behavior:
 * - Converts the provided `info` value into a string.
 * - Slightly normalizes occurrences of `http` in the message so they are less
 *   likely to be confused with stack-trace parsing.
 * - Creates a new error using the provided `type` constructor.
 * - Extracts stack-trace information to find the approximate source location.
 * - Rewrites the error message to include:
 *   - the original error message
 *   - the line number
 *   - the column number
 *   - the file name
 * - Either throws the error immediately or returns it, depending on `log`.
 *
 * Parameters:
 * - `info`: The message or value to turn into an error message.
 * - `type`: The error constructor to use, such as `TypeError`.
 * - `log`: If `true`, throw the error. If `false`, return the error object.
 *
 * Notes:
 * - This function depends on stack-trace formatting, so its behavior may vary
 *   slightly across environments.
 * - It is intended for internal debugging and developer-facing errors. 
 */ 
$.error = function (info = '', type = TypeError, log = true) {
  try { 
if(info instanceof Error) {
// Ensure type is only use when consider set not using the default type value 'TypeError'
 type = arguments.length > 1 ? type : window[info.name];
 info = info.message;   
} 

 const normalized = String(info).replace(/(http)/g, (m) => {
 return `(${m.slice(0, 1)})${m.slice(1)}`
 });
 throw new type(normalized); 
   } catch(err) {     

// Split the stack trace into parts and ignore internal utility frames.
const stack = String(err.stack).split('at')
.filter(item => {
  if(item.includes('utils.js')) return false;
  if(item.includes('dom.js')) return false;
  if(item.includes('http')) return true;
}).shift();

// Break the selected stack frame into colon-separated parts.
const part = String(stack).split(':');

// Helper for reading values from the end of the stack frame parts.
const fn = (n) => part[part.length - n] ?? '';

// Extract line and column information from the stack frame.
const line = fn(2) || 'unknown';
const column = fn(1).replace(')', '');
const url = fn(3).split('/').pop() || 'unknown.file';

// Build a more informative error message with source location details.
const errDetails =
      `${err.message}\n→ line ${line}, column ${column} in ${url}`; 

err.message = errDetails;

// Either throw the error or return it for later handling.   
if(log) throw err;
else return err;
 }
}



/**
 * Checks whether a value is a valid number.
 *
 * This function is intended to verify that the provided value is actually of
 * type `number`, while also ensuring its string representation contains only
 * numeric characters and basic number symbols.
 *
 * Important:
 * - This currently accepts only values whose type is exactly `number`.
 * - It rejects numeric strings such as `"5"`.
 * - It may still behave unexpectedly for special numeric values like `NaN`
 *   or `Infinity`, depending on how strict you want the check to be.
 *
 * Example:
 * - $.isNumber(5)    -> true
 * - $.isNumber("5")  -> false
 * - $.isNumber(NaN)  -> false or unexpected depending on intent
 */
$.isNumber = function (value) {
  // Convert the value to a string and ensure every character looks numeric
  // or like a basic number symbol.  
return [...String(value)].every(n => /[0-9.\+-]/.test(n)) && typeof value === 'number';
}



/**
 * Checks whether a value looks numeric when converted to a string.
 *
 * This function does not verify that the value is actually a JavaScript number.
 * Instead, it checks whether every character in the string representation is
 * one of the allowed numeric characters:
 * - digits 0–9
 * - decimal point `.`
 * - plus sign `+`
 * - minus sign `-`
 *
 * Important:
 * - This is a loose "numeric-like" check, not a strict number validation.
 * - It may return `true` for values that are not valid numbers in JavaScript.
 * - It does not guarantee that the value can safely be used as a number.
 *
 * Example:
 * - $.isNumeric("123")   -> true
 * - $.isNumeric("12.5")  -> true
 * - $.isNumeric("-8")    -> true
 * - $.isNumeric("1e3")   -> false
 * - $.isNumeric("abc")   -> false
 */
$.isNumeric = function (value) {
  // Convert the value to a string and ensure every character is one of the
  // allowed numeric symbols.
return [...String(value)].every(n => /[0-9.\+-]/.test(n));    
}



/**
 * Converts a value into a number and falls back to `0` when the result is not
 * considered numeric by this library's validation rules.
 *
 * This helper is meant to provide a safe numeric conversion path:
 * - First, it coerces the input using `Number(...)`.
 * - Then it checks whether the converted result passes `$.isNumeric(...)`.
 * - If the value is not numeric, it returns `0` instead of propagating an
 *   invalid result.
 *
 * This is useful when you want a predictable numeric output and do not want
 * to deal with `NaN` or other invalid values downstream.
 *
 * Example:
 * - $.toNumber("5")   -> 5
 * - $.toNumber(12)    -> 12
 * - $.toNumber("abc") -> 0
 */
$.toNumber = function (value) {

  // If the converted value is not numeric according to the library's rules,
  // return a safe fallback.
if(!$.isNumeric(value)) return 0;

// Convert to number 
value = Number(value);

return value;
}



/**
 * Checks whether a value is set.
 *
 * This helper returns `true` for any value that is not `null` or `undefined`.
 * It is a loose presence check, not a truthiness check, so values like:
 * - `false`
 * - `0`
 * - `""`
 * - `NaN`
 *
 * are still considered "set" because they are not nullish.
 *
 * This is useful when you want to distinguish between:
 * - "no value provided" (`null` / `undefined`)
 * - "a value was provided, even if it is falsy"
 *
 * Example:
 * - $.isSet(0)         -> true
 * - $.isSet(false)     -> true
 * - $.isSet("")        -> true
 * - $.isSet(null)      -> false
 * - $.isSet(undefined) -> false
 */
$.isSet = function (value) {
// Return true for any value except null and undefined.
return value != null;   
}



/**
 * Checks whether a value should be considered empty.
 *
 * This helper treats several different cases as "empty" so it can be used as a
 * broad validation utility across different value types.
 *
 * A value is considered empty when it is:
 * - `null`
 * - `undefined`
 * - an object with no own enumerable keys
 * - a string containing only whitespace
 * - `NaN`
 * - an array with no items
 *
 * Important:
 * - This is a semantic "empty" check, not a strict type check.
 * - It intentionally groups together values that are often treated as missing,
 *   blank, or unusable in application logic.
 * - The order of checks matters, because arrays are also objects in JavaScript.
 *
 * Example:
 * - $.empty(null)      -> true
 * - $.empty(undefined) -> true
 * - $.empty({})        -> true
 * - $.empty("   ")     -> true
 * - $.empty([])        -> true
 * - $.empty(0)         -> false
 * - $.empty(false)     -> false
 */
$.empty = function (value) {
  return (
    value === null ||
    value === undefined ||
    (typeof value === 'object' && Object.keys(value).length === 0) ||
    (typeof value === 'string' && value.trim() === '') ||
    (typeof value === 'number' && isNaN(value)) ||
    (Array.isArray(value) && value.length === 0) 
  );
}



/**
 * Returns a random integer within a range.
 *
 * This helper supports two calling styles:
 *
 * - `$.randInt(min, max)`
 *   Returns a random integer between `min` and `max`, inclusive.
 *
 * - `$.randInt(max)`
 *   Returns a random integer between `0` and `max - 1`.
 *
 * If neither argument is numeric, the function returns `0`.
 *
 * Notes:
 * - The result is generated using `Math.random()`, so it is not suitable for
 *   cryptographic use.
 * - When both `min` and `max` are provided, the range is inclusive on both ends.
 * - The function assumes `min` and `max` are valid numeric values.
 *
 * Examples:
 * - $.randInt(1, 5) -> 1, 2, 3, 4, or 5
 * - $.randInt(5)    -> 0, 1, 2, 3, or 4
 * - $.randInt("x")  -> 0
 */
$.randInt = function (min, max) {
 if($.isNumeric(min) && $.isNumeric(max)) {
// Inclusive random integer between min and max.   
 return Math.floor(Math.random() * (max - min + 1)) + min;
 } else if($.isNumeric(min)) {
// Single-argument form: random integer from 0 up to min - 1. 
 return Math.floor(Math.random() * min);  
 } else {
// Fallback when no numeric input is provided.   
 return 0;   
 } 
}



/**
 * Returns a random floating-point number within a range.
 *
 * This helper supports two calling styles:
 *
 * - `$.randFloat(min, max)`
 *   Returns a random float between `min` and `max`.
 *
 * - `$.randFloat(max)`
 *   Returns a random float between `0` and `max`.
 *
 * If neither argument is numeric, the function returns `0`.
 *
 * Notes:
 * - The result is generated using `Math.random()`, so it is not suitable for
 *   cryptographic use.
 * - Unlike `randInt`, this function does not round the result.
 * - The current formula uses `max - min + 1`, which is more typical for
 *   integer ranges than floating-point ranges.
 *
 * Examples:
 * - $.randFloat(1, 5) -> a float between 1 and 6
 * - $.randFloat(5)    -> a float between 0 and 5
 * - $.randFloat("x")  -> 0
 */
$.randFloat = function (min, max) {
 if($.isNumeric(min) && $.isNumeric(max)) {
// Generate a floating-point number in the requested range.   
 return Math.random() * (max - min) + min;
 } else if($.isNumeric(min)) {
// Single-argument form: random float from 0 up to min.   
 return Math.random() * min;  
 } else {
// Fallback when no numeric input is provided. 
 return 0;   
 } 
}



/**
 * Returns a random item from the provided input.
 *
 * This helper is designed to work with array-like or string-like values by
 * converting non-array inputs into an array of characters first.
 *
 * Behavior:
 * - If `input` is an object, an error is thrown because objects are not valid
 *   sources for random item selection in this helper.
 * - If `input` is not already an array, it is converted into an array using
 *   `Array.from(String(input))`.
 * - A random element is then selected from the resulting array.
 *
 * Important:
 * - For strings, this returns a random character.
 * - For arrays, this returns a random array element.
 * - If the array is empty, the result will be `undefined`.
 *
 * Example:
 * - $.randItem([1, 2, 3]) -> 1, 2, or 3
 * - $.randItem("abc")     -> "a", "b", or "c"
 */
$.randItem = function (input = []) {
// Objects are not supported because this helper expects a list-like value.
if($.isObject(input)) $.error(`${input} contains invalid type at argument 1, expects non object`);

  // Convert non-array values into an array of characters so they can still be
  // sampled randomly.
if(!Array.isArray(input)) input = Array.from(String(input));

// Pick a random index from the array and return the item at that position. 
return input[Math.floor(Math.random() * input.length)];
}



/**
 * Generates a random token string of the requested length.
 *
 * This helper builds a character pool from one or more predefined charset
 * groups, optionally adds custom characters, and then randomly picks
 * characters until the requested token length is reached.
 *
 * Supported charset groups:
 * - `letters`: uppercase + lowercase letters
 * - `lower`: lowercase letters only
 * - `upper`: uppercase letters only
 * - `numbers`: digits 0–9
 * - `symbols`: common punctuation and symbol characters
 * - `mixed`: letters, numbers, and symbols combined
 *
 * Options:
 * - `custom`: extra characters to append to the pool
 * - `merge`: when `true`, combine all selected charset groups into one pool
 * - `include`: array of charset group names to use
 *
 * Notes:
 * - Invalid charset names throw an error.
 * - The output is random but not cryptographically secure.
 * - If the final character pool is empty, the function will not be able to
 *   generate a meaningful token.
 *
 * Example:
 * - $.randToken(8)
 * - $.randToken(12, { include: ['numbers'] })
 * - $.randToken(16, { include: ['lower', 'numbers'], custom: '-' })
 * - $.randToken(5, { merge: false, custom: '✅😊🦜' })
 */
$.randToken = function (length = 8, options = {}) {
// Read token settings with defaults.
  const { custom = "", merge = true, include = ['letters'] } = options;

// Predefined character sets that can be combined to build the token pool.  
const charset = {
 letters: 'abcdefghijklmnopqrstuvwxyzABCDEFGHIJKLMNOPQRSTUVWXYZ',
 lower: 'abcdefghijklmnopqrstuvwxyz',
 upper: 'ABCDEFGHIJKLMNOPQRSTUVWXYZ',
 numbers: '0123456789',
 symbols: '!@#$%^&*()-_=+[]{}|\\:;"\'<>,.?/',
 mixed: 'abcdefghijklmnopqrstuvwxyzABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789!@#$%^&*()-_=+[]{}|\\:;"\'<>,.?/'  
} 

// Build the final character pool from the requested charset groups.  
const result = [].concat(include).reduce((acc, c) => {

// Validate charset type before using it.
if(!charset[c]) {
$.error(`"${c}" is not a valid charset type, expects [upper, lower, letters, numbers, mixed, symbols]`);
}  
 
return merge ? (acc + charset[c]) : '';
}, '') + custom;

// Convert the pool into an array of characters for random selection. 
let str = '';
let char = Array.from(result);

// Randomly pick characters until the requested length is reached. 
for(let i = 0; i < length; i++) {
str += char[Math.floor(Math.random() * char.length)];   
}

return str;
}



/**
 * Creates a padding helper for a string value.
 *
 * The input `value` is converted to a string immediately, so this helper can
 * be used with numbers, booleans, and other values as well.
 *
 * The returned object provides two padding modes:
 *
 * - `start(length)`:
 *   Pads the beginning of the string until it reaches the requested length.
 *
 * - `end(length)`:
 *   Pads the end of the string until it reaches the requested length.
 *
 * The `char` argument controls which character is used for padding. If no
 * padding character is provided, the native `padStart` / `padEnd` default
 * behavior applies.
 *
 * Example:
 * - $.pad("7", "0").start(3) -> "007"
 * - $.pad("7", "0").end(3)   -> "700"
 */
$.pad = function (value, char) {
const obj = {};

// Normalize the input so padding always works on a string value. 
value = String(value);

// Pad on the left until the string reaches the requested length.
obj.start = function (length) {
return value.padStart(length, char);  
}


// Pad on the right until the string reaches the requested length.
obj.end = function (length) {
return value.padEnd(length, char);   
}

return obj;   
}



/**
 * Formats a numeric value to a fixed number of decimal places.
 *
 * This helper validates both inputs before formatting:
 * - `value` must be numeric
 * - `length` must be numeric and represents the number of digits after the
 *   decimal point
 *
 * The function then converts `value` to a number and uses the native
 * `toFixed(length)` method to return a string with the requested precision.
 *
 * Important:
 * - The return value is a string, not a number.
 * - This is useful for display formatting, not for preserving numeric type.
 * - If you need a rounded number instead of a formatted string, you will need
 *   a different helper.
 *
 * Example:
 * - $.toFixed(12.345)    -> "12.35"
 * - $.toFixed(12.3, 0)   -> "12"
 * - $.toFixed("5.1", 3)  -> "5.100"
 */
$.toFixed = function (value, length = 2) {
// Reject non-numeric values early so formatting does not silently fail. 
if(!$.isNumeric(value)) $.error(`${value} is not a numeric value at argument 1`);

// Validate the decimal precision argument as well.
if(!$.isNumeric(length)) $.error(`${length} is not a numeric value at argument 2`);

// Convert to a number and format with the requested decimal precision.   
return Number(value).toFixed(length);  
}



/**
 * Sorting helper for arrays.
 *
 * This utility provides two sorting modes:
 *
 * - `asc(input, fn)`:
 *   Sorts the array in ascending order.
 *
 * - `desc(input, fn)`:
 *   Sorts the array in descending order.
 *
 * The `fn` argument is a selector function used to extract the value that
 * should be compared for each item. This makes the sorter flexible enough to
 * work with arrays of numbers, strings, or objects.
 *
 * How it works:
 * - The input must be an array.
 * - The selector function must be a function.
 * - For string values, sorting uses `localeCompare()` so alphabetical ordering
 *   is handled properly.
 * - For non-string values, sorting uses numeric comparison.
 *
 * Important:
 * - This function sorts the original array in place because it uses
 *   `Array.prototype.sort()`.
 * - If you need to preserve the original array, make a copy before sorting.
 * - The comparison logic assumes the selector returns either strings or values
 *   that can be compared numerically.
 *
 * Example:
 * - $.sort.asc([3, 1, 2], x => x) -> [1, 2, 3]
 * - $.sort.desc(["b", "a"], x => x) -> ["b", "a"]
 * - $.sort.asc(users, user => user.name)
 */
$.sort = (() => {
// Shared sorting implementation used by both ascending and descending modes.  
const config = function (input, fn, mode) {
// Validate that the first argument is an array.   
if(!Array.isArray(input)) $.error(`${input} is not an array at argument 1`);

// Validate that the second argument is a function.   
if(typeof fn !== 'function') $.error(`${fn} is not a function at argument 2`);

// Sort the array by comparing the values returned from the selector.    
return input.sort((a, b) => {
const x = fn(a);
const y = fn(b);

// Use locale-aware comparison for strings.     
if(typeof x === 'string' && typeof y === 'string') {
 return mode === 'asc' ? x.localeCompare(y) : y.localeCompare(x);
}

// Use numeric comparison for non-string values.    
return mode === 'asc' ? x - y : y - x;
});
}

const obj = {};

// Sort in ascending order.
obj.asc = (input, fn) => config(input, fn, 'asc');

// Sort in descending order.
obj.desc = (input, fn) => config(input, fn, 'desc');

return obj;
})();



/**
 * Copies text to the clipboard.
 *
 * This helper tries to use the modern Clipboard API first, because it is the
 * cleanest and most reliable approach in supported browsers.
 *
 * If `navigator.clipboard` is not available, it falls back to the older
 * `document.execCommand('copy')` technique by creating a temporary hidden
 * textarea, selecting its contents, and copying from there.
 *
 * Return value:
 * - Resolves to `true` when the copy operation succeeds.
 * - Resolves to `false` when the copy operation fails.
 *
 * Notes:
 * - The Clipboard API may require a secure context and user interaction.
 * - The fallback method is older and less ideal, but improves compatibility.
 * - The temporary textarea is removed after the copy attempt finishes.
 *
 * Example:
 * - $.copy("hello") -> Promise<boolean>
 */
$.copy = function (text = '') {
// Prefer the modern clipboard API when it is available. 
 if(navigator.clipboard) {
return navigator.clipboard.writeText(text)
.then(() => true, () => false);
 } else {
    // Fallback for older browsers: create a temporary textarea, select the
    // text, and use the legacy copy command.    
    const textarea = document.createElement('textarea');
    textarea.id = 'fit';
    textarea.value = text;
    textarea.style.position = 'fixed';
    textarea.style.top = '-9999px';
    document.body.appendChild(textarea);
    textarea.focus();
    textarea.select();
      
    const successful = document.execCommand('copy'); 

// Clean up the temporary element and return the result as a Promise.           
return Promise.resolve(successful)
.then(x => {
   textarea.blur();
   document.body.removeChild(textarea);    
   return x;
});   
 }
}



/**
 * Splits an array or string into smaller chunks of a given size.
 *
 * This helper accepts either:
 * - an array, which is chunked into arrays
 * - a string, which is chunked into substrings
 *
 * Behavior:
 * - Validates that `input` is an array or a string.
 * - Validates that `size` is a numeric value greater than or equal to 1.
 * - Clones arrays before processing so the original array is not modified.
 * - Converts strings into arrays of characters, then joins each chunk back
 *   into a string.
 * - Optionally applies a callback to each chunk before returning the result.
 *
 * Return value:
 * - For arrays: an array of array chunks
 * - For strings: an array of string chunks
 * - If `callback` is provided, the chunked result is mapped through it
 *
 * Example:
 * - $.chunk([1, 2, 3, 4], 2) -> [[1, 2], [3, 4]]
 * - $.chunk("abcd", 2)       -> ["ab", "cd"]
 * - $.chunk([1, 2, 3], 2, x => x.length) -> [2, 1]
 */
$.chunk = function (input, size, callback) {

// Only arrays and strings are supported as chunkable inputs. 
if(!Array.isArray(input) && typeof input !== 'string') $.error(`${input} is not an array or a string at argument 1`);

// Chunk size must be a numeric value of at least 1.
if(!$.isNumeric(size) || size < 1) $.error(`${size} is not a number or it's less than 1 at argument 2`);

let isString = false;

  // Normalize strings into character arrays so they can be chunked the same
  // way as arrays.
if(typeof input === 'string') {
input = Array.from(input);
isString = true;
} else {
// Clone arrays so the original input is preserved.  
input = $.clone(input);
}

const result = [];

// Consume the input until nothing is left.
while(input.length) { 

// Take the next chunk from the front of the array.  
let extracted = input.splice(0, size);

// Convert string chunks back into strings.   
if(isString) extracted = extracted.join('');

result.push(extracted);   
} 
  
// Optionally transform each chunk before returning.
return typeof callback === 'function' ? result.map(callback) : result;
}



/**
 * Redirects the browser to a new URL, optionally after a delay.
 *
 * This helper validates that `url` is a string, then navigates the current
 * page either immediately or after a timeout.
 *
 * Options:
 * - `delay`: If numeric, the redirect is scheduled after this many milliseconds.
 * - `replace`: If `true`, uses `window.location.replace(...)` instead of setting
 *   `window.location.href`, which avoids adding a new history entry.
 *
 * Return value:
 * - Returns an object with a `cancel()` method that clears the scheduled
 *   redirect timeout, if one was created.
 *
 * Example:
 * - $.redirect("https://example.com")
 * - $.redirect("https://example.com", { delay: 2000 })
 * - $.redirect("https://example.com", { replace: true })
 */
$.redirect = function (url, options = {}) {

// Ensure the target URL is a string before attempting navigation. 
if(typeof url !== 'string') $.error(`${url} is not a string at argument 1`);

// Read redirect options with a default for replace behavior.  
const { delay, replace = false } = options;

  // Perform the actual navigation, either by replacing the current history
  // entry or by assigning a new location.  
const loc = () => {
replace ? window.location.replace(url) : window.location.href = url;
}

let id;

// If a numeric delay is provided, schedule the redirect.
if($.isNumeric(delay)) {
id = setTimeout(loc, delay);
} else {
// Otherwise redirect immediately.   
loc();
}

// Expose a cancel method for delayed redirects. 
return { cancel: () => clearTimeout(id) };
}



/**
 * Reloads the current page, optionally after a delay.
 *
 * This helper checks whether `delay` is numeric:
 * - If yes, it schedules `window.location.reload()` after the given number of
 *   milliseconds.
 * - If not, it reloads the page immediately.
 *
 * Return value:
 * - Returns an object with a `cancel()` method that clears the scheduled
 *   reload timeout, if one was created.
 *
 * Example:
 * - $.reload()
 * - $.reload(2000)
 */
$.reload = function (delay) {
let id;

// Schedule a delayed reload when a numeric delay is provided. 
if($.isNumeric(delay)) {
id = setTimeout(() => window.location.reload(), delay);  
} else {
// Otherwise reload immediately.   
window.location.reload();    
} 

// Expose a cancel method for delayed reloads.
return { cancel: () => clearTimeout(id) }; 
}



/**
 * Schedules a function to run after a delay and optionally stores the timeout
 * under a custom identifier.
 *
 * This helper validates its inputs before creating the timeout:
 * - `callback` must be a function
 * - `delay` must be numeric
 *
 * It then creates a timeout with `setTimeout(...)`. If an `id` is provided,
 * the timeout handle is stored in `$.timeoutIds[id]` so it can be referenced
 * later.
 *
 * Return value:
 * - Returns an object with a `cancel()` method that clears the timeout and
 *   removes the stored id entry when applicable.
 *
 * Example:
 * - $.timeout(() => console.log("done"), 1000)
 * - $.timeout(() => console.log("done"), 1000, "task1")
 */
$.timeoutIds = {};

$.timeout = function (callback, delay, id) {
// Ensure the first argument is a callable function. 
if(typeof callback !== 'function') $.error(`${callback} is not a function at argument 1`); 

// Ensure the delay is a valid numeric value. 
if(!$.isNumeric(delay)) $.error(`${delay} is not a number at argument 2`);

// Create the timeout and keep the native timeout handle.
const timeoutId = setTimeout(callback, delay);

// Optionally store the timeout handle under a custom identifier. 
if(id != null) $.timeoutIds[id] = timeoutId;

// Provide a cancel method for clearing the timeout and cleaning up storage. 
return { 
  cancel: () => {
   clearTimeout(timeoutId);
   delete $.timeoutIds[id];    
  } 
 }
}



/**
 * Schedules a function to run repeatedly at a fixed interval and optionally
 * stores the interval handle under a custom identifier.
 *
 * This helper validates its inputs before creating the interval:
 * - `callback` must be a function
 * - `delay` must be numeric
 *
 * It then creates an interval with `setInterval(...)`. If an `id` is provided,
 * the interval handle is stored in `$.intervalIds[id]` so it can be referenced
 * later.
 *
 * Return value:
 * - Returns an object with a `cancel()` method that clears the interval and
 *   removes the stored id entry when applicable.
 *
 * Example:
 * - $.interval(() => console.log("tick"), 1000)
 * - $.interval(() => console.log("tick"), 1000, "poller")
 */
$.intervalIds = {};

$.interval = function (callback, delay, id) {
// Ensure the first argument is a callable function. 
if(typeof callback !== 'function') $.error(`${callback} is not a function at argument 1`); 

// Ensure the delay is a valid numeric value.
if(!$.isNumeric(delay)) $.error(`${delay} is not a number at argument 2`);

// Create the interval and keep the native interval handle. 
const intervalId = setInterval(callback, delay);

// Optionally store the interval handle under a custom identifier.
if(id != null) $.intervalIds[id] = intervalId;

// Provide a cancel method for clearing the interval and cleaning up storage. 
return { 
  cancel: () => {
   clearInterval(intervalId);
   delete $.intervalIds[id];    
  } 
 }
}



/**
 * Schedules a callback to run on the next animation frame and optionally
 * stores the request handle under a custom identifier.
 *
 * This helper validates that `callback` is a function, then calls
 * `requestAnimationFrame(...)`. If an `id` is provided, the returned frame
 * handle is stored in `$.rafIds[id]` so it can be referenced later.
 *
 * Return value:
 * - Returns an object with a `cancel()` method that cancels the animation
 *   frame and removes the stored id entry when applicable.
 *
 * Example:
 * - $.raf(() => console.log("frame"))
 * - $.raf(() => console.log("frame"), "render1")
 */
$.rafIds = {};

$.raf = function (callback, id) {
// Ensure the first argument is a callable function.
if(typeof callback !== 'function') $.error(`${callback} is not a function at argument 1`);  

// Request the next animation frame and keep the native frame handle.
const rafId = requestAnimationFrame(callback);   

// Optionally store the frame handle under a custom identifier.
if(id != null) $.rafIds[id] = rafId;

// Provide a cancel method for clearing the frame and cleaning up storage.
return { 
  cancel: () => {
   cancelAnimationFrame(rafId);
   delete $.rafIds[id];    
  } 
 }
}



/**
 * Registers a shared `cancel(id)` method on the timer utilities.
 *
 * This code adds a `cancel` function to each timer helper so a stored timer
 * handle can be cleared later by its custom id.
 *
 * Supported utilities:
 * - `$.timeout`
 * - `$.interval`
 * - `$.raf`
 *
 * Behavior:
 * - If the utility is `$.interval`, it clears the interval stored in
 *   `$.intervalIds[id]`.
 * - If the utility is `$.timeout`, it clears the timeout stored in
 *   `$.timeoutIds[id]`.
 * - If the utility is `$.raf`, it cancels the animation frame stored in
 *   `$.rafIds[id]`.
 * - After clearing, the stored id entry is removed from the corresponding map.
 *
 * Example:
 * - $.timeout.cancel("task1")
 * - $.interval.cancel("poller")
 * - $.raf.cancel("render1")
 */
$.timerHandles = [$.timeout, $.interval, $.raf];

$.timerHandles.forEach(util => {
 Object.assign(util, {
   cancel(id) {
    if(util === $.interval) {
     clearInterval($.intervalIds[id]);
     delete $.intervalIds[id];
    } else if(util === $.timeout) {
     clearTimeout($.timeoutIds[id]);
     delete $.timeoutIds[id];
    } else if(util === $.raf) {
     cancelAnimationFrame($.rafIds[id]);
     delete $.rafIds[id]; 
    }
  }
});   
});



/**
 * Performs an HTTP GET request with optional delay, timeout, and caching behavior.
 *
 * This helper accepts a callback and an options object, then sends a request
 * using `fetch()` when available, falling back to `XMLHttpRequest` otherwise.
 *
 * Options:
 * - `url`: Request URL. Defaults to a CoinGecko Bitcoin price endpoint.
 * - `dataType`: Response type / parser name, such as `json`.
 * - `timeout`: Maximum time in milliseconds before the request is aborted.
 * - `delay`: Delay in milliseconds before the request starts.
 * - `cache`: When `true`, allows cached responses; otherwise disables cache.
 *
 * Callback result:
 * - `{ ok: true, status: 'success' }` on success
 * - `{ ok: false, status: 'timeout' }` on timeout
 * - `{ ok: false, status: 'error' }` on failure
 *
 * Notes:
 * - The `fetch()` branch calls `response[dataType]()` dynamically, so `dataType`
 *   must match a valid response method such as `json`, `text`, or `blob`.
 * - In the XHR fallback, `xhr.responseType = dataType` must also be a valid
 *   XHR response type.
 * - The current code does not pass the parsed response body to the callback;
 *   it only reports status.
 *
 * Example:
 * - $.request(result => console.log(result))
 * - $.request(result => console.log(result), { url: "/api/data", timeout: 3000 })
 */
$.request = function (callback, options = {}) {
// Validate the callback before making any network request. 
if(typeof callback !== 'function') $.error(`${callback} is not a function at argument 1`);

// Read request options with defaults. 
const {
 url = 'https://api.coingecko.com/api/v3/simple/price?ids=bitcoin&vs_currencies=usd', 
 dataType = 'json', 
 timeout, 
 delay, 
 cache = false
} = options;

// Support delayed execution when a numeric delay is provided.  
if($.isNumeric(delay)) {
 setTimeout(config, delay);
 } else {
 config();  
 } 


// Internal request configuration and execution. 
async function config() {
const controller = new AbortController();

// Abort the request if a numeric timeout is configured.   
 if($.isNumeric(timeout)) {
  setTimeout(() => controller.abort(), timeout);  
 }

// Prefer fetch when available.  
 if(window.fetch) {
  try {
   const response = await fetch(url, {
   cache: cache ? 'force-cache' : 'no-store',
   method: 'GET',
   signal: controller.signal
   });
   
// Parse the response using the requested method.          
   await response[dataType]();
   
   callback({ ok: true, status: 'success' });
  } catch(err) {
  let status = err.name === 'AbortError' ? 'timeout' : 'error';
   callback({ ok: false, status });
  }
 } else {
   // Fallback for older browsers using XMLHttpRequest.      
const xhr = new XMLHttpRequest();
xhr.open('GET', cache ? url : `${url}ts=${Date.now()}`, true);
xhr.responseType = dataType;

xhr.onload = () => {
 if(xhr.status >= 200 && xhr.status < 300) {
 callback({ ok: true, status: 'success' });  
 } else {
 callback({ ok: false, status: 'error' });  
 }
}

xhr.onerror = () => callback({ ok: false, status: 'error' }); 

if($.isNumeric(timeout)) xhr.timeout = timeout;

xhr.ontimeout = () => callback({ ok: false, status: 'timeout' });

xhr.send();
 }     
}
}



/**
 * Encrypts a value using a simple character-shifting algorithm.
 *
 * This helper converts both `value` and `pin` to strings, then shifts each
 * character code by an amount derived from:
 * - the character position
 * - the length of the PIN
 * - the sum of the PIN character codes
 *
 * Behavior:
 * - If `pin` is provided, it contributes an additional offset based on its
 *   characters.
 * - If `pin` is empty, the shift is based only on the character index.
 * - The function returns a transformed string of the same length as the input.
 *
 * Important:
 * - This is not strong cryptography. It is a lightweight obfuscation method,
 *   not secure encryption.
 * - The output may contain non-printable or unusual characters depending on
 *   the input and shift values.
 *
 * Example:
 * - $.encrypt("hello", "123")
 */
$.encrypt = (value, pin = '') => {
  let result = '';

// Base offset derived from the PIN characters.  
  let offset = 0;

// Normalize the PIN to a string so it can be processed consistently. 
 pin = String(pin);

// If a PIN exists, sum the character codes to create an additional offset.
  if (pin) {
    offset = [...pin].reduce((sum, char) => sum + char.charCodeAt(0), 0);
  }

// Normalize the value to a string before encrypting it.
value = String(value);

// Shift each character code and build the encrypted result.
for (let i = 0; i < value.length; i++) {
 
    const charCode = value.charCodeAt(i);
    
    const encrypted = String.fromCharCode(
      charCode + (i % 10) * (pin ? pin.length : 1) + offset
    );
 
    result += encrypted;
  }

  return result;
};



/**
 * Decrypts a value that was encrypted with the matching character-shifting
 * algorithm.
 *
 * This helper converts both `value` and `pin` to strings, then reverses the
 * shift applied during encryption by subtracting:
 * - the character position factor
 * - the PIN length factor
 * - the sum of the PIN character codes
 *
 * Behavior:
 * - If `pin` is provided, the same PIN must be used that was used for encryption.
 * - If `pin` is empty, the function reverses the no-PIN variant of the shift.
 * - The function returns a transformed string of the same length as the input.
 *
 * Important:
 * - This only works correctly if the input was produced by the matching
 *   `$.encrypt` function.
 * - This is not strong cryptography; it is a reversible obfuscation method.
 *
 * Example:
 * - $.decrypt(encryptedText, "123")
 */
$.decrypt = (value, pin = '') => {
  let result = '';

// Base offset derived from the PIN characters.  
  let offset = 0;

// Normalize the PIN to a string so it can be processed consistently.   
 pin = String(pin);

  // If a PIN exists, sum the character codes to recreate the same offset used
  // during encryption. 
  if (pin) {
    offset = [...pin].reduce((sum, char) => sum + char.charCodeAt(0), 0);
  }

// Normalize the value to a string before decrypting it.
value = String(value);

// Reverse the character shifting applied during encryption.   
for (let i = 0; i < value.length; i++) {
  
    const charCode = value.charCodeAt(i);
 
    const decrypted = String.fromCharCode(
      charCode - (i % 10) * (pin ? pin.length : 1) - offset
    );
  
    result += decrypted;
  }
 
  return result;
};



/**
 * Converts a numeric value to its ordinal string representation.
 *
 * This helper validates that `n` is numeric before formatting it as:
 * - 1  -> "1st"
 * - 2  -> "2nd"
 * - 3  -> "3rd"
 * - 4  -> "4th"
 * - 11 -> "11th"
 * - 12 -> "12th"
 * - 13 -> "13th"
 *
 * How it works:
 * - The input is checked with `$.isNumeric(n)`.
 * - The last two digits are checked first to handle the special 11/12/13 case.
 * - Otherwise, the last digit determines the suffix.
 *
 * Example:
 * - $.toOrdinal(21) -> "21st"
 * - $.toOrdinal(42) -> "42nd"
 * - $.toOrdinal(103) -> "103rd"
 */
$.toOrdinal = function (n) {
if(!$.isNumeric(n)) $.error(`${n} is not a numeric value at argument 1`);

  const lastTwo = n % 100;
  const last = n % 10;

  if (lastTwo >= 11 && lastTwo <= 13) {
    return n + "th";
  }

  switch (last) {
    case 1: return n + "st";
    case 2: return n + "nd";
    case 3: return n + "rd";
    default: return n + "th";
  }
}



/**
 * Merges properties from one or more source objects into a target object.
 *
 * This helper validates that `target` is an object before delegating to
 * `Object.assign(...)`.
 *
 * Behavior:
 * - Throws an error if `target` is not an object
 * - Copies enumerable own properties from each source into `target`
 * - Mutates and returns the original `target` object
 * - Later sources overwrite earlier properties when keys conflict
 *
 * Example:
 * - $.extend({}, { a: 1 }, { b: 2 }) -> { a: 1, b: 2 }
 * - $.extend(obj, { name: "Alice" })
 */
$.extend = function (target, ...args) {
if(!$.isObject(target)) $.error(`${target} is not an object at argument 1`);
  return Object.assign(target, ...args);   
}



/**
 * Concatenates a target value with one or more additional values into a new array.
 *
 * This helper is a thin wrapper around `[].concat(...)`.
 *
 * Behavior:
 * - Returns a new array containing `target` followed by all `args`
 * - Does not mutate the original inputs
 * - If any argument is itself an array, its elements are flattened one level
 *   by `concat`
 *
 * Example:
 * - $.merge([1, 2], [3, 4]) -> [1, 2, 3, 4]
 * - $.merge(1, 2, 3) -> [1, 2, 3]
 */
$.merge = function (target, ...args) {
  return [].concat(target, ...args);
}



/**
 * Inserts a value into a string at the specified index.
 *
 * The insertion happens before the character at `index`.
 * For example:
 * $.insertAt("Samuel", 2, "✅") // "Sa✅muel"
 *
 * @param {string} str - The source string.
 * @param {number} index - The insertion position.
 * @param {string} value - The value to insert.
 * @returns {string} The resulting string after insertion.
 */
$.insertAt = function (str, index, value) {

// Ensure the index is numeric before using it as a string position.  
if(!$.isNumeric(index)) $.error(`${index} is not a numeric value at argument 2`);

// Convert the input to a string so slice() can be safely used.
str = String(str);

// Split the string at the index and insert the new value in between.
return str.slice(0, index) + value + str.slice(index);
}



/**
 * Inserts a value before the first occurrence of a match in a string.
 *
 * If the match is not found, the value is appended to the end of the string.
 *
 * @param {string} str - The source string.
 * @param {string} match - The substring to insert before.
 * @param {string} value - The value to insert.
 * @returns {string} The resulting string after insertion.
 */
$.insertBefore = function (str, match, value) {
// Convert the input to a string so string methods can be used safely.
str = String(str);

// Find the first occurrence of the match.
const index = str.indexOf(match);

// If the match does not exist, append the value to the end.
if(index === -1) return str + value;

// Insert the value before the matched substring.
return str.slice(0, index) + value + str.slice(index); 
}



/**
 * Inserts a value after the first occurrence of a match in a string.
 *
 * If the match is not found, the value is appended to the end of the string.
 *
 * @param {string} str - The source string.
 * @param {string} match - The substring to insert after.
 * @param {string} value - The value to insert.
 * @returns {string} The resulting string after insertion.
 */
$.insertAfter = function (str, match, value) {
// Convert the input to a string so string methods can be used safely.
str = String(str);

// Find the first occurrence of the match.
const index = str.indexOf(match);
console.log(index);
// If the match does not exist, append the value to the end.
if(index === -1) return str + value;

// Calculate the position immediately after the matched substring.
const len = index + String(match).length;

// Insert the value after the matched substring.
return str.slice(0, len) + value + str.slice(len); 
}



/**
 * Checks whether a string looks like a valid URL.
 *
 * This helper returns `false` for empty values or non-string inputs, then tests
 * the trimmed string against a regular expression that allows:
 * - optional `http://` or `https://`
 * - a domain name with dots
 * - an optional port
 * - an optional path
 *
 * Notes:
 * - This is a lightweight URL validator, not a full RFC-compliant parser.
 * - It will accept many common URLs, but may reject some valid edge cases.
 *
 * Example:
 * - $.isUrl("https://example.com") -> true
 * - $.isUrl("example.com/path") -> true
 * - $.isUrl("not a url") -> false
 */
$.isUrl = function (url) {
  if (!url || typeof url !== "string") return false;
  
      const regex = /^(https?:\/\/)?[a-zA-Z0-9.-]+\.[a-zA-Z0-9]{2,}(:[0-9]+)?(\/.*)?$/;
            
  return regex.test(url.trim());             
}



/**
 * Checks whether a string looks like a valid email address.
 *
 * This helper returns `false` for empty values or non-string inputs, then tests
 * the trimmed string against a regular expression that allows:
 * - a local part made of common email-safe characters
 * - an `@` symbol
 * - a domain name with at least one dot
 * - a top-level domain of at least 2 letters
 *
 * Notes:
 * - This is a lightweight validator, not a full RFC-compliant email parser.
 * - It also enforces a maximum length of 254 characters, which matches the
 *   common practical limit for email addresses.
 *
 * Example:
 * - $.isEmail("test@example.com") -> true
 * - $.isEmail("bad@email") -> false
 */
$.isEmail = function (email) {  
      if (!email || typeof email !== "string") return false;
    
      const regex = /^[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}$/;
  
   return regex.test(email.trim()) && email.length <= 254;       
}



/**
 * Updates the document title and changes the browser history entry without
 * reloading the page.
 *
 * This helper uses the History API to either:
 * - push a new history entry, or
 * - replace the current one
 *
 * Options:
 * - `replace`: when `true`, uses `history.replaceState(...)`; otherwise uses
 *   `history.pushState(...)`
 * - `state`: an arbitrary state object stored in the history entry
 *
 * Behavior:
 * - Sets `document.title` to the provided `title`
 * - Calls the appropriate History API method with `state`, `title`, and `url`
 *
 * Example:
 * - $.navigate("/about", "About Us")
 * - $.navigate("/profile", "Profile", { replace: true, state: { from: "home" } })
 */
$.navigate = function (url, title = '', options = {}) {
  const { replace = false, state = {} } = options;
  
document.title = title;

const method = replace ? 'replaceState' : 'pushState';

window.history[method](state, title, url);
}



/**
 * Checks whether a value is a plain object.
 *
 * This helper first verifies that `input` is an object, then checks whether its
 * constructor is exactly `Object`.
 *
 * Behavior:
 * - Returns `false` for non-objects
 * - Returns `true` for plain object literals like `{}` and `new Object()`
 * - Returns `false` for arrays, dates, functions, class instances, and other
 *   non-plain objects
 *
 * Example:
 * - $.isPlainObject({}) -> true
 * - $.isPlainObject([]) -> false
 * - $.isPlainObject(new Date()) -> false
 */
$.isPlainObject = function (input) {
if(!$.isObject(input)) return false;
  return input.constructor === Object;
}



/**
 * Checks whether a value is an object-like value.
 *
 * This helper returns `true` for non-null objects that are not arrays.
 *
 * Behavior:
 * - Returns `false` for `null`
 * - Returns `false` for arrays
 * - Returns `true` for plain objects, dates, regexes, and other non-array objects
 *
 * Example:
 * - $.isObject({}) -> true
 * - $.isObject([]) -> false
 * - $.isObject(null) -> false
 */
$.isObject = function (value) {
return (value !== null && typeof value === 'object' && !Array.isArray(value));
}



/**
 * Filters an input array based on the provided options.
 *
 * Behavior:
 * - Validates that the input is an array.
 * - Optionally removes empty arrays when `options.array` is enabled.
 * - Optionally removes empty objects when `options.object` is enabled.
 * - Keeps all other values unchanged.
 *
 * Notes:
 * - This function only filters the top-level items in the array.
 * - Array items are considered removable when they are empty (`length === 0`).
 * - Object items are considered removable when they have no own keys.
 * - If both `options.array` and `options.object` are enabled, both checks apply.
 *
 * @param {Array} input - The array to filter.
 * @param {Object} [options={}] - Filtering options.
 * @param {boolean} [options.array=false] - Whether to remove empty arrays.
 * @param {boolean} [options.object=false] - Whether to remove empty objects.
 * @returns {Array} A new filtered array.
 */
$.filterify = function (input, options = {}) {
// Validate that the input is an array before processing.  
if(!Array.isArray(input)) $.error(`${input} is not an array at argument 1`);

// Filter items according to the enabled removal rules.
return input.filter(item => {
// Remove empty arrays when array filtering is enabled.  
if(options.array && Array.isArray(item)) {
return item.length > 0;   
} 

// Remove empty objects when object filtering is enabled.   
if(options.object && $.isObject(item)) {
return Object.keys(item).length > 0; 
}   

// Keep all values that do not match a removal rule.  
return true;
});
}



/**
 * Waits for multiple promises to settle as a group and returns a Promise-like
 * object with jQuery-style convenience methods.
 *
 * This helper wraps `Promise.all(...)` and adds:
 * - `done(callback)`   → runs on success
 * - `fail(callback)`   → runs on rejection
 * - `always(callback)` → runs in either case
 *
 * Behavior:
 * - Resolves when all input promises resolve
 * - Rejects as soon as one promise rejects
 * - Returns the underlying `Promise` instance with extra methods attached
 *
 * Notes:
 * - `done`, `fail`, and `always` do not change the promise result; they only
 *   attach handlers and return the same promise for chaining.
 * - `always` uses `finally`, which runs regardless of success or failure.
 *
 * Example:
 * - $.when(p1, p2).done(() => console.log("all done"))
 * - $.when(p1, p2).fail(err => console.error(err))
 */
$.when = function (...promises) {
 const allPromises = Promise.all([...promises]);

allPromises.done = function (callback) {
  allPromises.then(callback);
  return this;
}

allPromises.fail = function (callback) {
  allPromises.catch(callback);
  return this;
}

allPromises.always = function (callback) {
  allPromises.finally(callback);
  return this;
}

return allPromises;
}



/**
 * Creates a deep clone of a value.
 *
 * This helper uses `structuredClone(...)` when available, which is the preferred
 * modern approach for deep-copying many built-in data types.
 *
 * Fallback behavior:
 * - If `structuredClone` is not available, it falls back to
 *   `JSON.parse(JSON.stringify(input))`.
 *
 * Notes:
 * - The JSON fallback only works well for JSON-safe data.
 * - It will lose or alter values such as:
 *   - functions
 *   - `undefined`
 *   - `Symbol`
 *   - `Date` objects
 *   - `Map` / `Set`
 *   - circular references
 * - `structuredClone` is more capable, but still cannot clone everything
 *   (for example, functions are not cloneable).
 *
 * Example:
 * - $.clone({ a: 1, b: { c: 2 } })
 */
$.clone = function (input) {
 if(window.structuredClone) {  
  return structuredClone(input);
 } else {
  return JSON.parse(JSON.stringify(input));
 }
}



/**
 * URL encoding and decoding helpers.
 *
 * This object provides four convenience methods:
 * - `en(value)`  → encodes a full URI using `encodeURI`
 * - `de(value)`  → decodes a full URI using `decodeURI`
 * - `enc(value)` → encodes a URI component using `encodeURIComponent`
 * - `dec(value)` → decodes a URI component using `decodeURIComponent`
 *
 * Notes:
 * - Use `encodeURI` / `decodeURI` for complete URLs.
 * - Use `encodeURIComponent` / `decodeURIComponent` for individual query
 *   values, path segments, or other URL parts.
 *
 * Example:
 * - $.url.en("https://example.com/?q=hello world")
 * - $.url.enc("hello world")
 */
$.url = {
 en: (value) => encodeURI(value),
 
 de: (value) => decodeURI(value),

 enc: (value) => encodeURIComponent(value),
 
 dec: (value) => decodeURIComponent(value)
}



/**
 * Performs a deep equality check between two values.
 *
 * Behavior:
 * - If both inputs are objects, compares their keys and values recursively.
 * - If both inputs are non-objects, compares them using `Object.is(...)`.
 *
 * Important notes:
 * - This function assumes plain object-like structures.
 * - Arrays are also treated as objects by JavaScript, so they will follow the
 *   object comparison path.
 * - The comparison is recursive, but it does not handle every edge case
 *   perfectly (for example, circular references).
 * - Nested objects are compared by key count first, then by value.
 *
 * @param {*} a - First value to compare.
 * @param {*} b - Second value to compare.
 * @returns {boolean} `true` if both values are considered equal, otherwise `false`.
 */
$.equals = function (a, b) {
// Compare object-like values by structure and nested content.  
if(typeof a === 'object' && typeof b === 'object') {
// Different number of keys means the objects cannot be equal.    
if(Object.keys(a).length !== Object.keys(b).length) return false;

// Ensure every key in `a` exists in `b` with an equal value.    
return Object.keys(a).every(key => {
const aValue = a[key];
const bValue = b[key];

// Recursively compare nested object-like values when both sides match in size.     
if(typeof aValue === 'object' && typeof bValue === 'object' && Object.keys(aValue).length === Object.keys(bValue).length) {
return $.equals(aValue, bValue);    
} else {
// Fall back to strict equality for primitive or non-matching nested values.     
return aValue === bValue;   
}   
});
} else {
// Use Object.is for non-object values to preserve correct edge-case behavior.   
return Object.is(a, b);
}   
}



/**
 * Returns a new array containing only unique items from the provided arguments.
 *
 * This helper separates values into two broad groups:
 * - Primitive-like values, which are checked using `includes(...)`
 * - Reference values, which are checked using a JSON-string comparison approach
 *
 * Important behavior notes:
 * - All arguments are collected into a new result array.
 * - Primitive values are deduplicated with `Array.prototype.includes`.
 * - Reference values are deduplicated by comparing serialized forms.
 *
 * Limitations:
 * - The reference-value check is not a true deep-equality comparison.
 * - `JSON.stringify(referenceValues).includes(JSON.stringify(item))` can produce
 *   false positives because it searches inside a stringified array rather than
 *   comparing objects structurally.
 * - Property order affects `JSON.stringify(...)`.
 * - Circular references are not supported.
 * - `Node` instances are treated like primitive-like values by this logic path.
 *
 * Example:
 * - `$.unique(1, 2, 2, "a", "a")` -> `[1, 2, "a"]`
 * - `$.unique({ a: 1 }, { a: 1 })` -> may treat them as duplicates depending on
 *   serialization details
 *
 * @param {...any} args - Values to deduplicate.
 * @returns {Array} A new array containing unique values.
 */
$.unique = function (...args) {
const result = [];
const referenceValues = [];

args.forEach(item => {
// Treat non-object values and Node instances as direct values.   
if(typeof item !== 'object' || item instanceof Node) {
if(!result.includes(item)) result.push(item); 
} else {
// Compare reference values using serialized content.    
if(!JSON.stringify(referenceValues).includes(JSON.stringify(item))) {
referenceValues.push(item);
result.push(item);
}
}
}); 
return result;
}



/**
 * Checks whether a value is even.
 *
 * Behavior:
 * - Returns `true` when `value` is divisible by 2 with no remainder
 * - Returns `false` otherwise
 *
 * Example:
 * - $.isEven(4) -> true
 * - $.isEven(3) -> false
 */
$.isEven = function (value) {
return value % 2 === 0;  
}



/**
 * Checks whether a value is odd.
 *
 * Behavior:
 * - Returns `true` when `value` is not divisible by 2
 * - Returns `false` when `value` is divisible by 2
 *
 * Example:
 * - $.isOdd(3) -> true
 * - $.isOdd(4) -> false
 */
$.isOdd = function (value) {
return value % 2 !== 0;  
}



/**
 * Checks whether a value is divisible by another number.
 *
 * Behavior:
 * - Returns `true` when `value` divided by `by` leaves no remainder
 * - Returns `false` otherwise
 *
 * Notes:
 * - If `by` is `0`, the result will be `false` for normal finite numbers
 *   because modulo by zero yields `NaN`.
 * - This helper assumes numeric inputs.
 *
 * Example:
 * - $.isDivisibleBy(10, 2) -> true
 * - $.isDivisibleBy(10, 3) -> false
 */
$.isDivisibleBy = function (value, by) {
return value % by === 0;   
}



/**
 * Checks whether a value represents an integer.
 *
 * Behavior:
 * - Returns `false` for non-numeric values
 * - Returns `true` if the numeric value is an integer
 * - Returns `false` for decimal numbers
 *
 * Notes:
 * - This version is stricter than converting with `Number(...)` alone because
 *   it first verifies the input is numeric via `$.isNumeric(...)`.
 * - It is useful when you want to accept numeric strings only if they are
 *   considered numeric by your own helper.
 *
 * Example:
 * - $.isInt("5") -> true
 * - $.isInt(5) -> true
 * - $.isInt("5.2") -> false
 */
$.isInt = function (value) {
if(!$.isNumeric(value)) return false;
return Number.isInteger(Number(value));    
}



/**
 * Checks whether a value represents a float.
 *
 * Behavior:
 * - Returns `false` for non-numeric values
 * - Returns `true` for numeric values that are not integers
 * - Returns `false` for integers
 *
 * Notes:
 * - This version first validates the input with `$.isNumeric(...)`.
 * - It then converts the value with `Number(...)` and checks whether the
 *   result is not an integer.
 * - This is a practical “numeric float” check, especially if you want to
 *   accept numeric strings.
 *
 * Example:
 * - $.isFloat("3.14") -> true
 * - $.isFloat(5) -> false
 * - $.isFloat("5") -> false
 */
$.isFloat = function (value) {
if(!$.isNumeric(value)) return false;
return !Number.isInteger(Number(value));
}



/**
 * Creates a lightweight data store wrapper around localStorage or sessionStorage.
 *
 * The store keeps an array of objects under the provided key and exposes
 * chainable methods for adding, updating, removing, selecting, and reordering items.
 *
 * @param {string} key - The storage key used to persist the collection.
 * @returns {Object} A chainable data store API.
 */
$.dataStore = function (key) {
let store = localStorage;
let history = JSON.parse(store.getItem(key)) || []; 


const obj = {
 // Returns the number of items currently stored.
 // returns {number}
 get length() {
return history.length;
 }
};


/**
   * Configures which storage backend to use.
   *
   * @param {Object} [options={}] - Configuration options.
   * @param {"storage"|"session"} [options.memory] - Selects localStorage or sessionStorage.
   * @returns {Object} The current API instance for chaining.
   * @throws Will throw if `memory` is not one of the supported values.
   */
obj.config = function (options = {}) {
const { memory } = options;
if(!['storage', 'session'].includes(memory)) {
  $.error(`"${memory}" is not a valid memory value, expects ["storage", "session"]`);
}
store = memory === 'storage' ? localStorage : sessionStorage;
history = JSON.parse(store.getItem(key)) || []; 
return this;  
}


/**
   * Adds one or more objects to the store.
   *
   * If the last argument is numeric, it is treated as a target index and the
   * added items are moved there after insertion.
   *
   * @param {...Object|number} data - One or more objects, optionally followed by a numeric index.
   * @returns {Object} The current API instance for chaining.
   * @throws Will throw if any item except the optional last index is not an object.
   */
obj.add = function (...data) {
data = [].concat(...data);

const lastItem = data[data.length - 1];
let index;
if($.isNumeric(lastItem)) {
index = lastItem;
data.pop();
}

if(data.some(item => !$.isObject(item))) {
 $.error(`"${data}" contains invalid type, expects all items to be an object apart from the last which could be a numeric value for toIndex`);
}

history.push(...data); 
store.setItem(key, JSON.stringify(history));

if(index !== undefined) moveTo(data, index);

return this;   
}


// Returns a deep clone of all stored items.
// returns {Array<Object>}
obj.all = function () {
  return $.clone(history);
}


 /**
   * Updates matching items, but only for fields that already exist on each item.
   *
   * Values may be computed using `$.compute(value, currentValue, item)`.
   *
   * @param {Function} fn - Predicate used to select items to update.
   * @param {Object} [data={}] - Fields and values to apply to matching items.
   * @param {number} [toIndex] - Optional index to move the updated items to.
   * @returns {Object} The current API instance for chaining.
   * @throws Will throw if `fn` is not a function or `data` is not an object.
   */
obj.update = function (fn, data = {}, toIndex) {
if(typeof fn !== 'function') $.error(`"${fn}" is not a function`);

if(!$.isObject(data)) $.error(`"${data}" is not an object`);

const filtered = history.filter(fn);
filtered.forEach(item => {
Object.entries(data).forEach(([k, v]) => {

// If the v is a function pass the `item[k]` and `item` to the v parameter and execute the v function.
// else return the value as it is.
  v = $.compute(v, item[k], item);
  
   if(k in item) item[k] = v;
 });
});

store.setItem(key, JSON.stringify(history));
if($.isNumeric(toIndex)) moveTo(filtered, toIndex);

return this;
}


/**
   * Updates matching items and creates fields if they do not already exist.
   *
   * Values may be computed using `$.compute(value, currentValue, item)`.
   *
   * @param {Function} fn - Predicate used to select items to update.
   * @param {Object} [data={}] - Fields and values to apply to matching items.
   * @param {number} [toIndex] - Optional index to move the updated items to.
   * @returns {Object} The current API instance for chaining.
   * @throws Will throw if `fn` is not a function or `data` is not an object.
   */
obj.upsert = function (fn, data = {}, toIndex) {
if(typeof fn !== 'function') $.error(`"${fn}" is not a function`);

if(!$.isObject(data)) $.error(`"${data}" is not an object`);

const filtered = history.filter(fn);
filtered.forEach(item => {
Object.entries(data).forEach(([k, v]) => {

// If the v is a function pass the `item[k]` and `item` to the v parameter and execute the v function.
// else return the value as it is.
  v = $.compute(v, item[k], item);
  
   item[k] = v;
 });
});

store.setItem(key, JSON.stringify(history));
if($.isNumeric(toIndex)) moveTo(filtered, toIndex);

return this;
}


/**
   * Removes matching items or deletes selected fields from matching items.
   *
   * If `fields` is provided, only those fields are removed from the matched items.
   * Otherwise, the matched items are removed from the collection entirely.
   *
   * @param {Function} fn - Predicate used to select items to remove or modify.
   * @param {string|string[]} [fields=[]] - Field name or field names to delete from matched items.
   * @returns {Object} The current API instance for chaining.
   * @throws Will throw if `fn` is not a function.
   */
obj.remove = function (fn, fields = []) {
if(typeof fn !== 'function') $.error(`"${fn}" is not a function`);

const filtered = history.filter(fn);
fields = [].concat(fields);
if(fields.length > 0) {
filtered.forEach(item => {
fields.forEach(k => delete item[k]);
}); 

// Filter out empty objects "{}" from the history array
history = $.filterify(history, { array: true });
} else {
history = history.filter(item => !filtered.includes(item));
}  
store.setItem(key, JSON.stringify(history));
return this;
}


 // Clears all stored data for the current key.
 // returns {Object} The current API instance for chaining.
obj.clear = function () {
store.removeItem(key);
history.length = 0;
return this;    
}


/**
   * Reorders matching items by moving them to the specified index.
   *
   * @param {Function} fn - Predicate used to select items to move.
   * @param {number} toIndex - Destination index.
   * @returns {Object} The current API instance for chaining.
   * @throws Will throw if `fn` is not a function or `toIndex` is not numeric.
   */
obj.reorder = function (fn, toIndex) {
if(typeof fn !== 'function') $.error(`"${fn}" is not a function`);

if(!$.isNumeric(toIndex)) $.error(`"${toIndex}" is not a numeric value`); 

const filtered = history.filter(fn); 
moveTo(filtered, toIndex);
return this;
}


// Check whether the store contains at least one item that has any of the specified fields.
obj.contains = function (fields) {
fields = [].concat(fields);
return history.some(item => {
return fields.some(k => (k in item));
});  
}


/*
  Select matching items from history
  - Returns a query object
  - Provides helpers for reading matched values
*/
obj.select = function (fn) {
if(typeof fn !== 'function') $.error(`"${fn}" is not a function`);

const filtered = $.clone(history).filter(fn);

const query = {
  get length() {
     return filtered.length;
  }
};

// Get the first matching field value
query.get = function (field) {
const result = [];
filtered.forEach(item => {
if(field in item) result.push(item[field]);
});  
return result.shift();
}

// Get all matching field values
query.getAll = function (field) {
const result = [];
filtered.forEach(item => {
if(field in item) result.push(item[field]);
});  
return result;    
}

// Check whether any matched item has a field
query.has = function (field) {
return filtered.some(item => (field in item));
}

// Limit the number of returned matched items
query.limit = function (max) {
return filtered.splice(0, max); 
}

// Return all matched items
query.all = (index) => {
return filtered;
};

return query;
}


/**
   * Moves the given items to a new index within the history array.
   *
   * @param {Array<Object>} items - Items to move.
   * @param {number} index - Destination index.
   * @private
   */
function moveTo(items, index) {
const data = history.filter(x => items.includes(x)); 
history = history.filter(x => !items.includes(x));
history.splice(index, 0, ...data);
store.setItem(key, JSON.stringify(history));    
}  

return obj;
}



/**
 * Small wrapper around localStorage with helper methods for
 * setting, getting, removing, and listing stored values.
 */
$.storage = (() => {
  // Convert objects to JSON strings before saving.
  // Primitive values are stored as-is.  
const serializeValue = (value) => {
 return typeof value === 'object' ? JSON.stringify(value) : value;
}

  // Try to parse stored JSON back into its original value.
  // If parsing fails, return the value unchanged.  
const deserializeValue = (value) => {
try { value = JSON.parse(value); } catch {}
return value;
}

const obj = {
// Expose the current number of items in localStorage.   
  get length() {
    return localStorage.length;
  }
};


  // Save one key/value pair or multiple key/value pairs.
  // If the key is an object, treat it as a batch update. 
obj.set = function (key, value) {
if($.isObject(key)) {
  for(let [k, v] of Object.entries(key)){
// Allow computed updates based on the current stored value.        
v = $.compute(v, localStorage.getItem(k));
localStorage.setItem(k, serializeValue(v));   
  } 
 } else {
// Allow computed updates for a single key as well.    
value = $.compute(value, localStorage.getItem(key));
localStorage.setItem(key, serializeValue(value)); 
 }    
return this;
}


  // Read one key or multiple keys from localStorage.
  // If an array of keys is provided, return an object of results.  
obj.get = function (key) {
 if(Array.isArray(key)) {
 const result = {};
 key.forEach(k => {
 let value = localStorage.getItem(k);  
 result[k] = deserializeValue(value);
 });
 return result;
 } else {
 let value = localStorage.getItem(key);
 return deserializeValue(value);   
 }   
}


// Remove one or more keys from localStorage.
obj.remove = function (fields = []) {
fields = [].concat(fields);

fields.forEach(key => localStorage.removeItem(key)); 

return this;
}


// Clear all localStorage data.
obj.clear = function () {
localStorage.clear();
return this; 
}


// Check whether a key exists in localStorage.
obj.has = function (key) {
return Object.keys(localStorage).includes(key);
}


// Return all localStorage entries as a plain object.
obj.all = function () {
const result = {};
Object.entries(localStorage).forEach(([key, value]) => {
 result[key] = deserializeValue(value);
});
return result;
}


// Return the key name at a given index.
obj.key = function (index) {
return localStorage.key(index);  
}

return obj;  
})();



/**
 * Small wrapper around sessionStorage with helper methods for
 * setting, getting, removing, and listing stored values.
 */
$.session = (() => {
 // Convert objects to JSON strings before saving.
 // Primitive values are returned unchanged.  
const serializeValue = (value) => {
 return typeof value === 'object' ? JSON.stringify(value) : value;
}

 // Try to parse a stored value as JSON.
 // If parsing fails, return the original value.
const deserializeValue = (value) => {
try { value = JSON.parse(value); } catch {}
return value;
}

const obj = {
// Get the number of items currently stored.   
  get length() {
    return sessionStorage.length;
  }
};


 // Store one key/value pair or multiple key/value pairs.
 // If the first argument is an object, each entry is stored separately.   
obj.set = function (key, value) {
if($.isObject(key)) {
  for(let [k, v] of Object.entries(key)){
// Allow computed updates based on the current stored value.     
v = $.compute(v, sessionStorage.getItem(k));
sessionStorage.setItem(k, serializeValue(v));   
  } 
 } else {
// Allow computed updates for a single key as well. 
value = $.compute(value, sessionStorage.getItem(key));
sessionStorage.setItem(key, serializeValue(value)); 
 }     
return this;
}


 // Retrieve one key or multiple keys from storage.
 // If an array of keys is provided, returns an object of key/value pairs.   
obj.get = function (key) {
 if(Array.isArray(key)) {
 const result = {};
 key.forEach(k => {
 let value = sessionStorage.getItem(k);  
 result[k] = deserializeValue(value);
 });
 return result;
 } else {
 let value = sessionStorage.getItem(key);
 return deserializeValue(value);   
 }   
}


// Remove one or more keys from storage. 
obj.remove = function (fields = []) {
fields = [].concat(fields);

fields.forEach(key => sessionStorage.removeItem(key)); 

return this;
}


// Clear all values from sessionStorage.   
obj.clear = function () {
sessionStorage.clear();
return this; 
}


// Check whether a key exists in sessionStorage.
obj.has = function (key) {
return Object.keys(sessionStorage).includes(key);
}


// Return all stored entries as a plain object.  
obj.all = function () {
const result = {};
Object.entries(sessionStorage).forEach(([key, value]) => {
 result[key] = deserializeValue(value);
});
return result;
}


// Get the key name at a specific index.  
obj.key = function (index) {
return sessionStorage.key(index);  
}

return obj;  
})();



/**
 * Temporary in-memory storage utility.
 * Stores data in $.tempData and provides a small API for
 * setting, getting, checking, removing, and listing values.
 */
$.temp = (() => {
 // Internal object used to hold temporary key/value pairs.
 // This data exists only in memory and is not persisted.   
$.tempData = {};

const obj = {
 // Get the number of stored keys.   
  get length() {
    return Object.keys($.tempData).length;
  }
};

 // Store one key/value pair or multiple key/value pairs.
 // If the first argument is an object, each entry is stored separately.   
obj.set = function (key, value) {
if($.isObject(key)) {
 for(let [k, v] of Object.entries(key)){
// Allow computed updates based on the current stored value. 
v = $.compute(v, $.tempData[k]);;    
$.tempData[k] = v;
 } 
return this;  
} else {
// Allow computed updates for a single key as well.   
value = $.compute(value, $.tempData[key]);
$.tempData[key] = value; 
}  
return this; 
}


// Retrieve one key or multiple keys from temporary storage.  
obj.get = function (key) {
 if(Array.isArray(key)) {
 const result = {};
 key.forEach(k => {
   result[k] = $.tempData[k];
 });
 return result;   
 } else {
 return $.tempData[key];   
 }  
}


// Check whether a key exists in temporary storage. 
obj.has = function (key) {
return key in $.tempData;   
}


// Remove one or more keys from temporary storage.   
obj.remove = function (fields = []) {
fields = [].concat(fields);

fields.forEach(key => delete $.tempData[key]);

return this;
}


// Clear all temporary data.
obj.clear = function () {
for(const key in $.tempData){
delete $.tempData[key];  
} 
return this;  
}


// Return a shallow copy of all temporary data.   
obj.all = function () {
return { ...$.tempData };  
}


// Get the key name at a specific index. 
obj.key = function (index) {
return Object.keys($.tempData)[index];  
}

return obj;  
})();



/**
 * Escapes special RegExp characters in a string so it can be safely used inside a regular expression.
 *
 * @param {any} value - The value to escape.
 * @returns {string} The escaped string.
 */
$.escapeRegExp = (value) => {
return String(value).replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
}
  


/**
 * Converts a string to camelCase or PascalCase by uppercasing characters that follow
 * the specified separator characters.
 *
 * @param {any} value - The value to convert.
 * @param {Object} [options={}] - Conversion options.
 * @param {number} [options.step=Infinity] - Maximum number of separator matches to transform.
 * @param {string|string[]} [options.separator=['-','_']] - Separator character or characters to use for splitting.
 * @param {boolean} [options.pascal=false] - If true, capitalizes the first character of the result.
 * @returns {string} The converted string.
 */
$.toCamelCase = function (value, options = {}) {
let { step = Infinity, separator = ['-', '_'], pascal = false } = options;

let limit = 0;

separator = [].concat(separator);

const result = separator.reduce((str, curr) => {
if(curr === '') return str;
const regex = new RegExp($.escapeRegExp(curr) + '(.)', 'g');

return String(str).replace(regex, (_, v) => {
// stop conversion once step limit is reached
if(limit++ >= step) return v;

return v.toUpperCase();
});    
}, value);

return pascal ? result.slice(0, 1).toUpperCase() + result.slice(1) : result;
}



/**
 * Converts a string to kebab-case by inserting hyphens before matched characters
 * and lowercasing the transformed characters.
 *
 * @param {any} value - The value to convert.
 * @param {Object} [options={}] - Conversion options.
 * @param {number} [options.step=Infinity] - Maximum number of matches to transform.
 * @param {string|string[]} [options.separator=['([A-Z])']] - Separator pattern(s) or special matcher(s) to use.
 * @param {boolean} [options.pascal=false] - If true, capitalizes the first character of the result.
 * @returns {string} The converted string.
 */
$.toKebabCase = function (value, options = {}) {
let { step = Infinity, separator = ['([A-Z])'], pascal = false } = options;

let limit = 0;

separator = [].concat(separator);

const result = separator.reduce((str, curr) => {
if(curr === '') return str;
let regex;
if(curr === '([A-Z])') {
regex = new RegExp(curr, 'g'); 
} else {
regex = new RegExp($.escapeRegExp(curr) + '(.)', 'g');
}

return String(str).replace(regex, (_, v) => {
// stop conversion once step limit is reached
if(limit++ >= step) return v;

return '-' + v.toLowerCase();
});        
}, value);  

return pascal ? result.slice(0, 1).toUpperCase() + result.slice(1) : result;
}



/**
 * Converts a plain object of CSS property/value pairs into a CSS text string.
 *
 * @param {Object} [options={}] - A plain object whose keys are CSS property names and whose values are CSS values.
 * @returns {string} A CSS text string in the form `property:value;property:value;`.
 * @throws {Error} Throws if `options` is not a plain object.
 */
$.toCssString = function (options = {}) {
// validate input type (must be an object)
if(!$.isPlainObject(options)) $.error(`${options} is not a plain object at argument 1`);

return Object.entries(options).map(([key, value]) => {
return `${$.toKebabCase(key)}:${value};`;   
}).join('');
}



/**
 * Converts a string to uppercase.
 *
 * Behavior depends on the number of arguments provided:
 * - With one argument, converts the entire string to uppercase.
 * - With two arguments, converts only the character at the given position to uppercase.
 * - With three arguments, converts the substring starting at `start` with the given `length` to uppercase.
 *
 * The function validates that `start` and `length`, when provided, are numeric values.
 *
 * @param {any} value - The value to convert.
 * @param {number} [start] - The starting index for partial conversion.
 * @param {number} [length] - The number of characters to convert when performing a range conversion.
 * @returns {string} The converted string.
 * @throws {Error} Throws if `start` or `length` is provided but is not numeric.
 */
$.toUpper = function (value, start, length) {
// Validate start argument
if(!$.isNumeric(start) && start !== undefined) $.error(`${start} is not a numeric value at argument 2`);

// Validate length argument
if(!$.isNumeric(length) && length !== undefined) $.error(`${length} is not a numeric value at argument 3`);

const result = Array.from(String(value)); 

// Full-string conversion
 if(arguments.length === 1) {
  return value.toUpperCase();
 } else if(arguments.length === 2) {
 // Single-character conversion at the given index   
  const index = $.pos(result.length).safe(Number(start)); 
  result.splice(index, 1, result[index].toUpperCase());
  return result.join('');   
 } else {
 // Range conversion from start for length characters   
 const extracted = result.splice(start, length).join('');    
 result.splice(start, 0, extracted.toUpperCase());
  return result.join('');
 }
}



/**
 * Converts a string to lowercase.
 *
 * Behavior depends on the number of arguments provided:
 * - With one argument, converts the entire string to lowercase.
 * - With two arguments, converts only the character at the given position to lowercase.
 * - With three arguments, converts the substring starting at `start` with the given `length` to lowercase.
 *
 * The function validates that `start` and `length`, when provided, are numeric values.
 *
 * @param {any} value - The value to convert.
 * @param {number} [start] - The starting index for partial conversion.
 * @param {number} [length] - The number of characters to convert when performing a range conversion.
 * @returns {string} The converted string.
 * @throws {Error} Throws if `start` or `length` is provided but is not numeric.
 */
$.toLower = function (value, start, length) {
// Validate start argument
if(!$.isNumeric(start) && start !== undefined) $.error(`${start} is not a numeric value at argument 2`);

// Validate length argument
if(!$.isNumeric(length) && length !== undefined) $.error(`${length} is not a numeric value at argument 3`);

const result = Array.from(String(value)); 

// Full-string conversion
 if(arguments.length === 1) {
  return value.toLowerCase();
 } else if(arguments.length === 2) {
 // Single-character conversion at the given index   
  const index = $.pos(result.length).safe(Number(start)); 
  result.splice(index, 1, result[index].toLowerCase());
  return result.join('');   
 } else {
 // Range conversion from start for length characters   
 const extracted = result.splice(start, length).join('');    
 result.splice(start, 0, extracted.toLowerCase());
  return result.join('');
 }
}



/**
 * Converts a string to inverse case by swapping uppercase characters to lowercase
 * and lowercase characters to uppercase.
 *
 * Behavior depends on the number of arguments provided:
 * - With one argument, swaps the case of every character in the string.
 * - With two arguments, swaps the case of only the character at the given position.
 * - With three arguments, swaps the case of the substring starting at `start`
 *   with the given `length`.
 *
 * The function validates that `start` and `length`, when provided, are numeric values.
 *
 * @param {any} value - The value to convert.
 * @param {number} [start] - The starting index for partial conversion.
 * @param {number} [length] - The number of characters to convert when performing a range conversion.
 * @returns {string} The converted string.
 * @throws {Error} Throws if `start` or `length` is provided but is not numeric.
 */
$.toInverseCase = function (value, start, length) {
// Validate start argument
if(!$.isNumeric(start) && start !== undefined) $.error(`${start} is not a numeric value at argument 2`);

// Validate length argument
if(!$.isNumeric(length) && length !== undefined) $.error(`${length} is not a numeric value at argument 3`);

const result = Array.from(String(value));

// Swap the case of a single character 
const swapCase = (value) => {
 if(value === value.toUpperCase()) {
  return value.toLowerCase();
 } else {
  return value.toUpperCase();
 }    
}

// Full-string conversion
 if(arguments.length === 1) {
  return result.map(char => swapCase(char)).join('');
 } else if(arguments.length === 2) {
 // Single-character conversion at the given index   
  const index = $.pos(result.length).safe(Number(start)); 
 result.splice(index, 1, swapCase(result[index]));
  return result.join('');
 } else {
 // Range conversion from start for length characters  
  const extracted = result.splice(start, length); 
result.splice(start, 0, extracted.map(char => swapCase(char)).join(''))
  return result.join('');  
 }   
}



/**
 * Creates a deduplication utility backed by a Set and exposes chainable methods
 * for checking, adding, deleting, removing, and clearing values.
 *
 * The utility supports both raw comparison and deep comparison for object-like values
 * using JSON stringification.
 *
 * @param {...any} args - Initial values used to populate the internal unique collection.
 * @returns {Object} A chainable dedupe utility object.
 */
$.dedupe = function (...args) {
 // Initialize the unique collection
let unique = new Set(args);  

const obj = {
  get length() {
 return unique.size;
  }
};


obj.add = {
// Add values using deep comparison for object-like items  
 deep(...values) {
const arr = [];
const referenceValues = [];

values.forEach(item => {
if(typeof item !== 'object') {
arr.push(item);
} else {
if(!JSON.stringify(referenceValues).includes(JSON.stringify(item))) {
referenceValues.push(item);
arr.push(item);
}
}
});
arr.forEach(item => unique.add(item));
return this;
 },
 
 // Add values using raw Set behavior   
 raw(...values) {
values.forEach(item => unique.add(item));   
return this;
 }     
}


obj.delete = {
// Delete values using deep comparison for object-like items  
 deep(...values) {
const items = Array.from(unique).filter(item => !JSON.stringify(values).includes(JSON.stringify(item)))
unique = new Set(items);
return this;
 },
 
// Delete values using raw Set behavior   
 raw(...values) {
values.forEach(item => unique.delete(item));
return this;   
 }     
}


obj.has = {
// Check whether a value exists using deep comparison for object-like items
 deep(value) {
if(typeof value !== 'object') {
return unique.has(value);      
} else {
return Array.from(unique).some(item => JSON.stringify(item) === JSON.stringify(value));
} 
 },
 
// Check whether a value exists using raw Set behavior    
 raw(value) {
return unique.has(value);  
 }    
}


// Clear all values from the collection
obj.clear = function () {
unique.clear();
return this; 
}


// Return a cloned array of all unique values 
obj.all = function () {
return $.clone(Array.from(unique));
}


obj.remove = {
// Remove values at the specified indexes  
 at(index = []) {
index = [].concat(index);
const filtered = Array.from(unique).filter((_, i) => !index.includes(i));  
unique = new Set(filtered);
return this;
 },
 
// Remove a range of values starting at `start` for `count` items   
 range(start, count) {
const items = Array.from(unique);
items.splice(start, count);
unique = new Set(items); 
return this;
 },
 
// Remove values that match a predicate function   
 where(fn) {
if(typeof fn !== 'function') $.error(`"${fn}" is not a function at argument 1`);

const filtered = Array.from(unique).filter((...args) => {
  if(!fn(...args)) return true;
  else return false;
});
unique = new Set(filtered);    
 }
}

return obj;     
}



/**
 * Creates an elapsed-time timer controller with pause, resume, cancel, and period management support.
 *
 * The returned object exposes:
 * - timeLeft: remaining time before the main timer fires
 * - timeElapsed: elapsed time since the timer started
 * - isRunning: whether the timer is currently active
 * - period: the current timer duration
 *
 * It also supports:
 * - pause(): pause the main timer
 * - resume(): resume a paused timer
 * - once(fn, duration): schedule a one-time callback
 * - repeat(fn, duration): schedule a repeating callback
 * - cancel(fn): cancel the main timer and all attached timers
 * - setPeriod(duration): replace the current period
 * - addPeriod(duration): extend the current period
 *
 * @param {Function} callback - Function called when the main timer completes.
 * @param {Object} [options={}] - Timer configuration options.
 * @param {"timeout"|"interval"} [options.mode="timeout"] - Timer mode to use.
 * @param {number} [options.period=Infinity] - Initial timer duration.
 * @returns {Object} Timer controller object.
 */
$.elapsed = function (callback, options = {}) {
let { mode = 'timeout', period = Infinity } = options; 

// Validate the selected mode.
if(!['timeout', 'interval'].includes(mode)) $.error(`${mode} is not a valid mode expects [timeout, interval]`);


// Small wrapper around native timer APIs so the mode can switch behavior.
const handle = {
  cancel: (id) => {
 (mode === 'timeout' ? clearTimeout : clearInterval)(id);
  },
  run: (fn, duration) => { 
return (mode === 'timeout' ? setTimeout : setInterval)(fn, duration);
 }
}


// Track the start time of the current running segment.
let startTime = Date.now();

// Track how much time remains when paused.
let remainingTime = period;

// Track whether the timer is paused.
let isPaused = false;

// Public timer state and computed properties.
const obj = {
 get timeLeft() {
// If paused, return the stored remaining time directly.     
  if(isPaused) return remainingTime;  
  
  const timeLeft = Math.max(0, remainingTime - (Date.now() - startTime));

 // Interval mode shifts internal start when cycle completes      
 if(mode === 'interval' && timeLeft <= 0) startTime += period; 
  
  return timeLeft; 
 },

// Derived elapsed time   
 get timeElapsed() {
  return period - this.timeLeft;    
 },

// Whether timer is actively running (not paused)   
 get isRunning() {
  return !isPaused;        
 },

 // Total cycle duration  
 get period() {
  return period;  
 }
};


// Schedule the main timer for the initial period.
let timerId = schedule(period);

// Pause the main timer if it is currently running.
obj.pause = function () {
// Only pause when it's not already paused 
 if(isPaused) return this;
 handle.cancel(timerId);
 remainingTime -= Date.now() - startTime;
 isPaused = true;
 return this;   
}


// Resume the main timer if it is currently paused.
obj.resume = function () {
// Only resume when it's actually paused
 if(!isPaused) return this; 
 startTime = Date.now();
 timerId = schedule(remainingTime);
 isPaused = false;
 return this;   
}


// Store all auxiliary timers so they can be canceled together.
const timers = [];

// Schedule a one-time callback after a given duration.
obj.once = function (fn, duration) {
 if(typeof fn !== 'function') $.error(`${fn} is not a function`);
 
 if(!$.isNumeric(duration)) $.error(`${duration} is not a numeric value`);

 const timeoutId = setTimeout(() => fn(this), duration);
 timers.push({once: timeoutId});
 return this;   
}


// Schedule a repeating callback at a given interval.
obj.repeat = function (fn, duration) {
 if(typeof fn !== 'function') $.error(`${fn} is not a function`);
 
 if(!$.isNumeric(duration)) $.error(`${duration} is not a numeric value`);
 
 const intervalId = setInterval(() => fn(this), duration);
 timers.push({repeat: intervalId});
 return this;  
}


 // Cancel the main timer and all auxiliary timers.
obj.cancel = function (fn) {
 handle.cancel(timerId); 
 
// Pause first so the internal state reflects cancellation.  
 this.pause();

// Disable pause/resume after cancellation.   
 this.pause = () => {};
 this.resume = () => {}; 

// Clear all attached timers created by once()/repeat(). 
 timers.forEach(id => {
  if(id.once) clearTimeout(id.once);
  if(id.repeat) clearInterval(id.repeat);
});  

// Optional completion callback after cancel.
 typeof fn === 'function' && fn(this); 
}


// Replace the current period with a new duration.
obj.setPeriod = function (duration) {
// Only accept numeric values
 if(!$.isNumeric(duration)) $.error(`${duration} is not a numeric value`);

// Explicit set the `duration` to be a Number type to prevent string addition issues. 
 duration = Number(duration);
 
 handle.cancel(timerId);
 timerId = schedule(duration);
 period = duration;
 remainingTime = duration;
 return this;   
}


// Increase the current period by a given duration.
obj.addPeriod = function (duration) {
 if(!$.isNumeric(duration)) $.error(`${duration} is not a numeric value`);

// Explicit set the `duration` to be a Number type to prevent string addition issues.
 duration = Number(duration);
 
 handle.cancel(timerId);
 period += duration;
 remainingTime += duration;
 timerId = schedule(period);
 return this;     
}


// Internal helper that schedules the main callback.
function schedule(duration) {
 return handle.run(() => {
// After the callback trigger let `isRunning` be set to false for consistency.
 isPaused = true;

// After callback trigger override `timeLeft` and `timeElapsed` for consistency 
 typeof callback === 'function' && callback({ ...obj, timeLeft: 0, timeElapsed: period }); 
 }, duration); 
}

return obj;
}



/**
 * Converts a duration object into milliseconds.
 *
 * Supported units:
 * - weeks
 * - days
 * - hours
 * - minutes
 * - seconds
 * - milliseconds
 *
 * Example:
 * $.toMs({ days: 2, hours: 5 })
 *
 * @param {Object} [options={}] - Duration values keyed by time unit.
 * @returns {number} Total duration in milliseconds.
 */
$.toMs = function (options = {}) {

// Conversion table from each supported unit to milliseconds.
 const conversions = {  
  weeks: 604_800_000, 
  days: 86_400_000, 
  hours: 3_600_000, 
  minutes: 60_000, 
  seconds: 1_000, 
  milliseconds: 1 
 }

// Convert each provided unit into milliseconds and accumulate the total.
return Object.entries(options).reduce((acc, [key, value]) => {

// Reject unknown time units to avoid silent mistakes and typos.
 if(!(key in conversions)) $.error(`"${key}" is not a valid time unit, expect [${Object.keys(conversions)}]`);

// Ensure each unit value is numeric before converting.    
 if(!$.isNumeric(value)) $.error(`${value} is not a numeric value`);
 
return acc + conversions[key] * Number(value);
}, 0);
}



/**
 * Creates a mutable date utility wrapper around an internal Date instance.
 *
 * This utility is designed to provide a convenient, chainable API for reading,
 * updating, shifting, formatting, and converting dates without exposing the
 * internal Date object directly.
 *
 * The wrapper supports:
 * - direct getters and setters for common date parts
 * - localized month and weekday names
 * - relative shifting by time units
 * - formatting with tokens
 * - safe cloning back into a native Date object
 *
 * @param {Date|string|number} [input] - Optional initial date value.
 *   If omitted, the current date and time are used.
 * @returns {Object} A date helper object with chainable methods.
 */
$.date = function (input) {
let now = new Date();

// Initialize the internal date from the provided input when one is supplied. 
if(input !== undefined) {
now = new Date(input);    
} 

const obj = {};


// Read or update the full year component.
obj.year = function (value) {
 if(value === undefined) {
  return now.getFullYear();
 } else {
  now.setFullYear(value);
  return this;
 }  
}


// Read or update the month using a 1-12 range instead of JavaScript's 0-11 range.
obj.month = function (value) {
 if(value === undefined) {
// Return the month in human-friendly form.    
  return now.getMonth() + 1;
 } else if(value >= 1 && value <= 12) {
// Convert the 1-12 input into the 0-11 range used by Date. 
  now.setMonth(value - 1);
  return this;
 } else {
  $.error(`${value} is out of month range, expect 1 - 12`);
 }
}


// Read or update the day of the month. 
obj.date = function (value) {
 if(value === undefined) {
  return now.getDate();
 } else {
  now.setDate(value);
  return this;
 }
}


 // Read or update the hour component. 
obj.hours = function (value) {
 if(value === undefined) {
  return now.getHours();
 } else {
  now.setHours(value);
  return this;
 }  
}


// Read or update the minute component.
obj.minutes = function (value) {
 if(value === undefined) {
  return now.getMinutes();
 } else {
  now.setMinutes(value);
  return this;
 } 
}


// Read or update the second component. 
obj.seconds = function (value) {
 if(value === undefined) {
  return now.getSeconds();
 } else {
  now.setSeconds(value);
 }  
}


// Read or update the millisecond component. 
obj.milliseconds = function (value) {
 if(value === undefined) {
  return now.getMilliseconds();
 } else {
  now.setMilliseconds(value);
  return this;
 } 
}


// Return the weekday using a 1-7 range for easier human interpretation. 
obj.day = function () {
 return now.getDay() + 1;
}


// Read or update the timestamp value in milliseconds since Unix epoch. 
obj.time = function (value) {
 if(value === undefined) {
  return now.getTime();
 } else {
  now.setTime(value);
  return this;
 }   
}


// Return the localized month name using the requested length and locale.
obj.monthName = function (length = 'long', locale = 'en-US') {
 return now.toLocaleString(locale, { month: length });  
}


// Return the localized weekday name using the requested length and locale.  
obj.weekName = function (length = 'long', locale = 'en-US') {
 return now.toLocaleString(locale, { weekday: length }); 
}


// Shift the current date by one or more time units.  
obj.shift = function (options = {}) {
Object.entries(options).forEach(([key, value]) => {
// Handle units that can be converted directly into milliseconds.     
 if(['weeks', 'days', 'hours', 'minutes', 'seconds', 'milliseconds'].includes(key)) {
// Delegate validation and conversion to the millisecond helper.         
 const ms = $.toMs({ [key]: value }); 
  now = new Date(now.getTime() + ms);   
 } else if(key === 'month') {
// Validate month shifts before applying them.      
if(!$.isNumeric(value)) $.error(`${value} is not a numeric value`);

// Convert value to a number, prevent string concentration 
value = Number(value);

// Preserve the current date parts so month rollover can be corrected.      
const y = now.getFullYear();
const m = now.getMonth();
const d = now.getDate();
const daysInMonth = new Date(y, (m + value) + 1, 0).getDate();

// Apply the month shift.        
now.setMonth(m + value);

// Fix invalid rollover when the target month has fewer days.        
if(now.getMonth() > m && now.getDate() !== d) {
  now.setDate(daysInMonth); 
  now.setMonth(m + value);    
  }  
 } else if(key === 'year') {
// Validate year shifts before applying them.     
if(!$.isNumeric(value)) $.error(`${value} is not a numeric value`);

// Preserve the current date parts so year rollover can be corrected.      
const y = now.getFullYear();
const m = now.getMonth();
const d = now.getDate();

// Apply the year shift.      
now.setFullYear(y + Number(value));

// Fix invalid rollover when the target year changes the day unexpectedly.        
if(now.getFullYear() > y && now.getDate() !== d) {
   const daysInMonth = new Date(now.getFullYear(), m + 1, 0).getDate();   
   now.setDate(daysInMonth);
   now.setMonth(m);
  }    
 } else {
// Reject unsupported time unit keys early.        
  $.error(`"${key}" is not a valid time unit, expect [year, month, weeks, days, hours, minutes, seconds, milliseconds]`);
 }
});
return this;
}


// Parse the internal date into a Unix timestamp.
obj.parse = function () {
 if(now instanceof Date) {
  return now.getTime();
 } else {
  return Date.parse(now); 
 }    
}


// Return the number of days in the current month.
obj.daysInMonth = function () {
const year = now.getFullYear();
// Add 1 to month for consistency 
const month = now.getMonth() + 1;
return new Date(year, month, 0).getDate(); 
}


// Convert a value into an ordinal string representation.
obj.ordinal = function (value) {
 return $.toOridnal(value); 
}


// Format the current date using a token-based string or a custom formatter function. 
obj.format = function (input = 'YYYY-MM-DD') {
 const hours24 = now.getHours();
 const hours12 = hours24 % 12 || 12;
 
 const pad = (value) => {
 return String(value).padStart(2, '0');
 }
 
 const map = {
    YYYY: now.getFullYear(),    
    MM: pad(now.getMonth() + 1), // add +1 for consistency 1 - 12 month based 
    DD: pad(now.getDate()),
    HH: pad(hours24),
    hh: pad(hours12),
    mm: pad(now.getMinutes()),
    ss: pad(now.getSeconds()),
    ms: now.getMilliseconds(),
    A: hours24 >= 12 ? 'PM' : 'AM',
    a: hours24 >= 12 ? 'pm' : 'am'       
  }; 
 
 if(typeof input === 'string') {
 return String(input).split(/\s/).map(token => {
 // Preserve literal tokens prefixed with $.        
  if(token.startsWith('$')) {
   return token.slice(1);
  } else {
// Replace supported format tokens with their current values.           
   return token.replace(/(YYYY|MM|DD|HH|WN|MN|hh|mm|ss|ms|A|a)/g, m => map[m]);
  }
 }).join(' ');
 } else if(typeof input === 'function') {
// Allow custom formatting logic through a callback.      
  return input(obj, now); 
 } else {
  $.error(`${input} is not a valid type, expect a function or a string`);   
 }
}


// Return a cloned Date object so external code cannot mutate the internal state.
obj.toDate = function () {
 return new Date(now.getTime());
}

return obj;
}



/**
 * Creates a gate object that can pause execution until it is released.
 *
 * The gate exposes three methods:
 * - `wait()` to pause until the gate is resolved
 * - `resolve()` to release the current waiting promise
 * - `resolveAll()` to mark the gate as settled and release waiting code
 *
 * @returns {Object} A gate controller object.
 */
$.gate = function () {
const obj = {};

let resolver;
let isSettled = false;

// Return a pending promise when the gate is not yet settled.
obj.wait = function () {
if(!isSettled) {
return new Promise(resolve => {
resolver = resolve;
});
} else {
return Promise.resolve();
}
}

// Resolve the current waiting promise if one exists.
obj.resolve = function (input) {
 if(typeof resolver === 'function') {
  resolver(input);
 }
}

// Mark the gate as settled and release the current waiter.
obj.resolveAll = function (input) {
isSettled = true;    
obj.resolve(input);
}

return obj;   
}



/**
 * Creates a promise-like utility with custom resolve/reject helpers and
 * convenience methods for done, fail, and always callbacks.
 *
 * The executor receives:
 * - a resolve wrapper
 * - a reject wrapper
 * - a config object with object-only resolve/reject methods
 *
 * If config.resolve or config.reject is used with an object, the object values
 * are stored so done/fail can receive them as separate arguments.
 *
 * @param {Function} callback - Executor function that receives resolve, reject, and config helpers.
 * @returns {Promise} A promise enhanced with done, fail, and always methods.
 */
$.promise = function (callback) {
// Validate that the executor is a function.
if(typeof callback !== 'function') $.error(`${callback} is not a function at argument 1`);

// Stores object values for custom multi-argument done/fail callbacks.
let result;

// Tracks whether the promise was settled through the native wrapper path.
let isCustomSettled = false;

// Tracks whether the custom config.resolve/config.reject path was used.
let hasCustomResult = false;

const promise = new Promise((resolve, reject) => {
const err1 = new TypeError(`Resolver input is not an object`);
const err2 = new TypeError(`Reject input is not an object`);
 const config = {
 // Resolve using an object only, then store its values for later unpacking.     
   resolve: (input) => {  
 if(!$.isObject(input)) $.error(err1);
    resolve(input);
    result = Object.values(input);
    hasCustomResult = true;
   },
   
 // Reject using an object only, then store its values for later unpacking.        
   reject: (input) => {  
 if(!$.isObject(input)) $.error(err2); 
    reject(input);     
    result = Object.values(input);      
    hasCustomResult = true;
   }
 }

// Native-style resolve/reject wrappers passed into the executor.
const fn = (value, state) => {
if(state === 'resolve') resolve(value);
else reject(value);
if(!hasCustomResult) isCustomSettled = true;
}

// Execute the user callback with resolve, reject, and config helpers.   
callback(v => fn(v, 'resolve'), (v) => fn(v, 'reject'), config); 
});


// Success handler: unpack object values when custom config.resolve/config.reject was used.
promise.done = function (callback) {
promise.then(value => {
if(Array.isArray(result) && !isCustomSettled) {
 callback(...result);
} else {
 callback(value);
}
}); 
return this;
}


// Failure handler: unpack object values when custom config.resolve/config.reject was used.
promise.fail = function (callback) {
promise.catch(value => {
if(Array.isArray(result) && !isCustomSettled) {
 callback(...result);
} else {
 callback(value);
}
}); 
return this;
}


// Always handler: runs after either resolve or reject.
promise.always = function (callback) {
promise.finally(callback); 
return this; 
}

return promise;
}



/**
 * Runs a numeric counter from one value to another at a fixed interval.
 *
 * The counter can move downward or upward depending on the relationship
 * between `from` and `to`. Each tick calls `onTick`, and when the target
 * value is reached, `onComplete` is called.
 *
 * @param {Object} options - Counter configuration.
 * @param {number|string} options.from - Starting value.
 * @param {number|string} options.to - Target value.
 * @param {number|string} [options.step=1] - Amount to change on each tick.
 * @param {number} [options.interval=1000] - Delay between ticks in milliseconds.
 * @param {Function} [options.onTick=() => {}] - Called after each update.
 * @param {Function} [options.onComplete=() => {}] - Called once when the target is reached.
 * @returns {void}
 */
$.counter = function (options = {}) {
let { 
from, 
to, 
step = 1, 
interval = 1000, 
onTick = () => {}, 
onComplete = () => {} 
} = options; 

// Validate callback arguments before starting the timer.
if(typeof onTick !== 'function' || typeof onComplete !== 'function') $.error(`Either onTick or onComplete is not a function`);

// Validate numeric inputs before converting and running the counter.
if(!$.isNumeric(from) || !$.isNumeric(to) || !$.isNumeric(step)) $.error(`Either from, to or step is not a numeric value`);

from = Number(from);
to = Number(to);
step = Number(step);

const intervalId = setInterval(async () => {
// Count down when the start value is greater than the target.
if(from > to) {
from -= step; 

// Stop the timer once the target value is reached.
if(from === to) clearInterval(intervalId); 
} else {
// Count up when the start value is less than the target.
from += step;

// Stop the timer once the target value is reached.
if(from === to) clearInterval(intervalId);
} 

// Notify listeners on every tick with the current value.
onTick(from);

// Run the completion callback after the final tick.  
if(from === to) onComplete();
}, interval);
}




/**
 * Creates a modal instance with HTML/text content support, configurable styles,
 * and promise-based open/close behavior.
 *
 * The modal supports:
 * - setting content as HTML or plain text
 * - applying styles to modal, backdrop, and content
 * - querying content-scoped elements
 * - resolving with a value or dismissing on backdrop click / timeout
 *
 * @returns {Object} Modal API with html, text, styles, and open methods.
 */
$.modalId = 0;

$.modal = function () {
const obj = {};

// Create the modal DOM structure.
const backdropEl = document.createElement('backdrop-142788r');
const modalEl = document.createElement('modal-4833194063f');
const contentEl = document.createElement('content-17921003y');


// Store user-provided style overrides and behavior options.
let opts = {};


// Set modal content as HTML.
obj.html = function (input) { 
// If input is a function, use its return value; otherwise use the input directly.  
input = $.compute(input); 
contentEl.innerHTML = input; 
return this;
}


// Set modal content as plain text.
obj.text = function (input) {
// If input is a function, use its return value; otherwise use the input directly. 
input = $.compute(input);  
contentEl.textContent = input;     
return this;
}


// Configure modal, backdrop, and content styles plus behavior options. 
obj.styles = function (options = {}) {
const {
modal = {}, 
backdrop = {}, 
content = {} 
} = options;

// Validate that style groups are plain objects.   
if(!$.isObject(modal) || !$.isObject(backdrop) || !$.isObject(content)) {
$.error(`Either backdrop, modal or content is not an object`);   
}

// Merge defaults with user options.   
Object.assign(opts, {
   timeout: null,
   closeOnBackdrop: true,
   ...options
});
return this;
}


// Open the modal and return a promise for the result.
obj.open = function (callback) {
if(typeof callback !== 'function') $.error(`${callback} is not a function`);

// Use the custom promise utility so the result supports .then(), .done(), and similar methods.
return $.promise(resolve => {
const currentId = $.modalId++;

// Build and mount the modal using the current configuration.    
 config(currentId, resolve);

// Expose a scoped query helper for modal content.      
 const root = {
   find: (s) => contentEl.querySelector(s),
   findAll: (s) => {
    const nodes = contentEl.querySelectorAll(s);
    return Array.from(nodes);
   }
 }

// Let the caller wire events and resolve the modal manually.     
 callback(root, (input) => {
   resolve(input);   
   backdropEl.remove();
 });  
});
}


// Apply default styles, user styles, and DOM mounting logic.
function config(currentId, resolve) { 
// Base backdrop styling.        
    backdropEl.style.cssText = `
      position: fixed;
      inset: 0; 
      width: 100%; height: 100%;
      background-color: rgba(0, 0, 0, 0.5);
      display: flex;
      justify-content: center;
      align-items: center;
      z-index: ${currentId};         
    `; 

// Base modal styling.         
    modalEl.style.cssText = `
      background-color: #fff;
      border: 1px solid #ddd;
      border-radius: 5px;
      width: 80%;
      max-width: 500px;
      min-height: 180px;
      max-height: calc(100vh - 15vh);
      display: flex;
      flex-direction: column;
      color: black;
      padding: 10px;
      z-index: ${currentId};  
      position: fixed;  
    `;   

// Apply user-defined style overrides.   
Object.assign(backdropEl.style, opts.backdrop);
Object.assign(modalEl.style, opts.modal);
Object.assign(contentEl.style, opts.content);

// Mount the modal into the document.        
modalEl.append(contentEl);
backdropEl.append(modalEl);
document.body.append(backdropEl); 

// Close the modal when the backdrop is clicked, if enabled.     
backdropEl.addEventListener('click', (event) => {
 if (event.target === backdropEl && opts.closeOnBackdrop) {  
    resolve({ ok: false, reason: 'backdrop' });
    backdropEl.remove();      
 }  
});


// Auto-close the modal after the configured timeout, if provided.  
if($.isNumeric(opts.timeout)) {
setTimeout(() => {
resolve({ ok: false, reason: 'timeout' });
backdropEl.remove();
}, opts.timeout);    
}
}

return obj;   
}



/**
 * Creates and opens a simple alert dialog with optional HTML or text content.
 *
 * The alert returns a promise-like object and supports:
 * - plain text or HTML content rendering
 * - configurable timeout
 * - closing on backdrop click
 * - basic style overrides
 *
 * @param {string} [content=''] - Alert content to display.
 * @param {string} [btnText='OK'] - Button label.
 * @param {Object} [options={}] - Alert configuration options.
 * @param {'text'|'html'} [options.type='text'] - How to render content and button text.
 * @param {number} [options.timeout] - Auto-close timeout in milliseconds.
 * @param {boolean} [options.closeOnBackdrop=true] - Whether clicking the backdrop closes the alert.
 * @param {Object} [options.style={}] - Style overrides for the modal.
 * @returns {Promise} Promise-like alert result.
 */
$.alertId = 0;

$.alert = function (content = '', btnText = 'OK', options = {}) {
const { 
type = 'text',
timeout, 
closeOnBackdrop = true, 
style = {}
} = options;

// Choose the DOM property used to render content and button text.  
let prop = 'textContent';     
if(type === 'html') prop = 'innerHTML';

// Validate the style object before applying overrides. 
if(!$.isObject(style)) $.error(`${style} is not an object`);

// Use the custom promise utility so the result supports .then(), .done(), and similar methods.  
return $.promise(resolve => {
 const currentId = $.alertId++;  

// Create the backdrop element that covers the viewport.     
 const backdropEl = document.createElement('backdrop-5262419z');    
    backdropEl.style.cssText = `
      position: fixed;
      top: 0; left: 0;
      width: 100%; height: 100%;
      background-color: ${style.backdropColor ?? 'rgba(0, 0, 0, 0.5)'};
      display: flex;
      justify-content: center;
      align-items: center;
      z-index: ${currentId};
    `; 

// Create the modal container.       
 const modalEl = document.createElement('modal-4432796329v');
    modalEl.style.cssText = `
      background-color: #fff;
      border: 1px solid #ddd;
      border-radius: 5px;
      width: 80%;
      max-width: 500px;
      min-height: 180px;
      max-height: calc(100vh - 15vh); 
      display: flex;
      flex-direction: column;
      color: black;
      padding: 10px;
      z-index: ${currentId};
      position: fixed;
    `;
 Object.assign(modalEl.style, style);

// Create the content area.     
   const contentRoot = document.createElement('root-42678934327g');
   contentRoot.style.cssText = `
      flex-grow: 1;
      overflow-y: auto;          
    `;     
  contentRoot[prop] = content;

// Create the button wrapper.    
   const btnRoot = document.createElement('button-526773239h');
   btnRoot.style.cssText = `
      display: flex;
      justify-content: flex-end;
      padding-bottom: 10px;      
    `;

// Create the confirmation button.        
   const btn = document.createElement('btn-432899936438k');
   btn[prop] = btnText;
    btn.style.cssText = `        
    font-weight: bold;
    margin-right: 10px;    
    `;  

// Resolve the alert when the button is clicked.      
   btn.onclick = () => {
      resolve({ ok: true, reason: 'confirm' });
      backdropEl.remove();
    }; 


// Mount the modal structure into the document.        
btnRoot.append(btn);
modalEl.append(contentRoot, btnRoot);
backdropEl.append(modalEl);
document.body.append(backdropEl);

// Close the alert when clicking outside the modal, if enabled.     
backdropEl.addEventListener('click', (event) => {
 if (event.target === backdropEl && closeOnBackdrop) {
   resolve({ ok: false, reason: 'backdrop' });
   backdropEl.remove();
 }
});   

 
// Auto-close the alert after the configured timeout.    
if($.isNumeric(timeout)) {
setTimeout(() => {
resolve({ ok: false, reason: 'timeout' });
backdropEl.remove();
}, timeout);
}   
}); 
}



$.confirmId = 0;

$.confirm = (content = '', cancelText = 'CANCEL', okText = 'OK', options = {}) => {
const {
  type = 'text',
  timeout, 
  closeOnBackdrop = true,  
  style = {} 
} = options;

let prop = 'textContent';     
if(type === 'html') prop = 'innerHTML';

if(!$.isObject(style)) $.error(`${style} is not an object`);

// Use the custom promise utility so the result supports .then(), .done(), and similar methods.
 return $.promise(resolve => {
    const currentId = $.confirmId++;

 const backdropEl = document.createElement('backdrop-5262419z');
    backdropEl.style.cssText = `
      position: fixed;
      top: 0; left: 0;
      width: 100%; height: 100%;
      background-color: ${style.backdropColor ?? 'rgba(0, 0, 0, 0.5)'};
      display: flex;
      justify-content: center;
      align-items: center;
      z-index: ${currentId};
    `;
  
 const modalEl = document.createElement('modal-4432796329v');    
    modalEl.style.cssText = `
      background: #fff;
      border: 1px solid #ddd;
      border-radius: 5px;
      width: 80%;
      max-width: 500px;
      min-height: 180px;
      max-height: calc(100vh - 15vh);
      display: flex;
      flex-direction: column;
      color: black;
      padding: 10px;
      z-index: ${currentId};
      position: fixed;
    `;
 Object.assign(modalEl.style, style);
 
    const contentRoot = document.createElement('root-42678934327g');
   contentRoot.style.cssText = `
      flex-grow: 1;
      overflow-y: auto;          
    `;     
  contentRoot[prop] = content;
  
 
   const btnRoot = document.createElement('button-526773239h');
   btnRoot.style.cssText = `
      display: flex;
      justify-content: flex-end;
      padding-bottom: 10px;      
    `;
 
   const cancelBtn = document.createElement('cancel-427950252d');
    cancelBtn[prop] = cancelText;
    cancelBtn.style.cssText = `    
    font-weight: bold;     
    margin-right: 30px;
    `;
  
    cancelBtn.onclick = () => {
 resolve({ ok: false, reason: 'cancel' });
      backdropEl.remove();
    };
 
   const okBtn = document.createElement('ok-5274935327495j');
    okBtn[prop] = okText;
    okBtn.style.cssText = `       
    font-weight: bold; 
    margin-right: 10px;    
    `;
  
    okBtn.onclick = () => {
 resolve({ ok: true, reason: 'confirm' });
      backdropEl.remove();
    };
  
btnRoot.append(cancelBtn, okBtn);
modalEl.append(contentRoot, btnRoot);
backdropEl.append(modalEl);
document.body.append(backdropEl);
 
backdropEl.addEventListener('click', (event) => {
 if (event.target === backdropEl && closeOnBackdrop) {
 resolve({ ok: false, reason: 'backdrop' });
     backdropEl.remove();
 }
});

  
if($.isNumeric(timeout)) {
setTimeout(() => {
resolve({ ok: false, reason: 'timeout' });
backdropEl.remove();
}, timeout);
}     
});
};



$.promptId = 0;

$.prompt = (content = '', cancelText = 'CANCEL', okText = 'OK', options = {}) => {

const {
  type = 'text',
  timeout,
  closeOnBackdrop = true, 
  style = {} 
} = options;

let prop = 'textContent';     
if(type === 'html') prop = 'innerHTML';

if(!$.isObject(style)) $.error(`${style} is not an object`);

// Use the custom promise utility so the result supports .then(), .done(), and similar methods.
  return $.promise(resolve => {
    const currentId = $.promptId++;

const backdropEl = document.createElement('backdrop-5262419z');    
    backdropEl.style.cssText = `
      position: fixed;
      top: 0; left: 0;
      width: 100%; height: 100%;
      background-color: ${style.backdropColor ?? 'rgba(0, 0, 0, 0.5)'};
      display: flex;
      justify-content: center;
      align-items: center;
      z-index: ${currentId};
    `;
 
 const modalEl = document.createElement('modal-4432796329v');    
    modalEl.style.cssText = `
      background: #fff;
      border: 1px solid #ddd;
      border-radius: 5px;
      width: 80%;
      max-width: 500px;
      min-height: 180px;
      max-height: calc(100vh - 15vh);
      display: flex;
      flex-direction: column;
      color: black;
      padding: 10px;
      z-index: ${currentId};
      position: fixed;
    `;
 Object.assign(modalEl.style, style);


    const contentRoot = document.createElement('root-42678934327g');
   contentRoot.style.cssText = `
      flex-grow: 1;
      overflow-y: auto;          
    `;     
  contentRoot[prop] = content;

    const inputEl = document.createElement('input');    
    inputEl.type = 'text';
    inputEl.style.cssText = `
      outline: none;
      border: none;
      border-bottom: 1px solid black;
      width: 100%;
      padding: 5px 0;
      background-color: transparent;
      color: black;
    `;
 
    const btnRoot = document.createElement('button-526773239h');
    btnRoot.style.cssText = `
      display: flex;
      justify-content: space-between;      
      padding-bottom: 10px;
      padding-top: 25px;
    `;
 
   const cancelBtn = document.createElement('cancel-427950252d');
    cancelBtn[prop] = cancelText;
    cancelBtn.style.cssText = `    
    font-weight: bold; 
    margin-left: 10px;
    `;
  
    cancelBtn.onclick = () => {
  resolve({ ok: false, reason: 'cancel' });
      backdropEl.remove();
    };
 
   const okBtn = document.createElement('ok-5274935327495j');
    okBtn[prop] = okText;
    okBtn.style.cssText = `    
    font-weight: bold; 
    margin-right: 10px;
    `;
 
    okBtn.onclick = () => {
 resolve({ ok: true, reason: 'confirm', value: inputEl.value });
      backdropEl.remove();
    };
 
btnRoot.append(cancelBtn, okBtn);
modalEl.append(contentRoot, inputEl, btnRoot);
backdropEl.append(modalEl);
document.body.append(backdropEl);

backdropEl.addEventListener('click', (event) => {
 if (event.target === backdropEl && closeOnBackdrop) {
  resolve({ ok: false, reason: 'backdrop' });
    backdropEl.remove();
 }
});    

  
if($.isNumeric(timeout)) {
setTimeout(() => {
resolve({ ok: false, reason: 'timeout' });
backdropEl.remove();
}, timeout);
}     
});
};



/**
 * jUtils AJAX implementation
 * Supports fetch/xhr transport, timeout, body transformation, and unified response handling
 * Returns a promise-like object with abort capability
 */
$.ajax = function (options = {}) {

 // Ensure options is a valid object
if(!$.isObject(options)) $.error(`${options} is not an object at argument 1`);

const controller = new AbortController();

const {
  responseType = 'text',
  transport = 'auto',
  headers = {},
  success = () => {},
  error = () => {},
  complete = () => {}
} = options;

// If options.body is a function use it return value otherwise use as-is
 // Normalize body (supports function-based transformation)
options.body = $.compute(options.body, {
  toParams: (input) => {
   return new URLSearchParams(input).toString();
  },
  toJSON: (input) => {
   return JSON.stringify(input);
  }
}, { ...options });

let xhr = {};
let reason = 'error';
let useFetch = false;

// Validate headers
if(!$.isObject(headers)) $.error(`headers is not an object`);

// Ensure URL exists
if(!('url' in options)) $.error(`url is required`);

// Attach query string for GET/HEAD requests
if(['GET', 'HEAD'].includes(options.method) && options.body !== undefined) {
 options.url += '?' + options.body;
  delete options.body;        
}

// Remove Content-Type if sending FormData (browser sets it automatically)
if(options.body instanceof FormData && 'Content-Type' in headers) {
delete options.headers['Content-Type'];  
}

// Use the custom promise utility so the result supports .then(), .done(), and similar methods.
const promise = $.promise((_1, _2, resolver) => {

// FETCH TRANSPORT 
 if(transport === 'fetch' || (window.fetch && transport === 'auto')) {   
 useFetch = true;  
 fetch(options.url, { 
 ...options, 
 signal: controller.signal 
 })  
 // Read raw response object first 
 .then(res => {
  xhr = res;    
  try {
   return res[responseType](); 
  } catch {}
 })
 // Success response
 .then(data => {
  reason = 'success';
  config(data, resolver);
 }) 
 // Error handling (ignore abort as special case)
 .catch(err => { 
  if(err.name !== 'AbortError') reason = 'error'; 
  config(resolver);
 })
 .finally(() => config());   

// Timeout handling 
 if($.isNumeric(options.timeout)) {
  setTimeout(() => {
   controller.abort();
   reason = 'timeout';
  }, options.timeout);
 }
 
 }
// XHR TRANSPORT 
  else if(transport === 'xhr' || transport === 'auto') {
 useFetch = false;
 xhr = new XMLHttpRequest();   
 xhr.open(options.method, options.url, true); 

// Set request headers 
 for(const [key, value] of Object.entries(headers)){
  xhr.setRequestHeader(key, value); 
 } 

xhr.responseType = responseType;

// Request success
xhr.onload = function () {
   reason = 'success';
   config(xhr.response, resolver);   
} 

// Network error
xhr.onerror = function () {
   reason = 'error'; 
   config(resolver);    
}

// Request finished (always fires)
xhr.onloadend = function () {
   config(); 
}

// Timeout event
xhr.ontimeout = function () {
   reason = 'timeout';
   config(resolver);   
}

// Abort event
xhr.onabort = function () {  
  config(resolver);
}

// Set timeout if numeric
if($.isNumeric(options.timeout)) {
xhr.timeout = options.timeout;
}

// Send request
xhr.send(options.body); 

 } 
// Invalid transport fallback  
 else {
  $.error(`"${transport}" is not a valid transport value, expects "fetch", "xhr" or "auto"`);
 }
});


/**
     * Unified response builder + lifecycle handler
     */
function config(response, resolver) {
const result = {
     headers,
     ok: xhr.status >= 200 && xhr.status < 300,
     status: xhr.status,
     transport: useFetch ? 'fetch' : 'xhr',
     native: xhr,
     url: options.url,
     reason,
     method: options.method,
     responseType,
     timeout: options.timeout
}  

// Resolve success response
if(arguments.length === 2) {
 resolver.resolve({ response, options: result });
 success(response, result);
} 
// Reject flow
else if(arguments.length === 1) {
 response.reject({ options: result });
 error(result);
} 
// Final cleanup callback
else {
  complete();
}    

// Attach runtime state
Object.assign(promise, {
  get aborted() {
   return reason === 'aborted';   
  }
});
}

/**
  * Abort request manually
  */
promise.abort = function () {
 reason = 'aborted';
 if(useFetch) controller.abort();
 else xhr.abort();   
}

return promise;
}



for(const key of Object.keys($)){
Object.defineProperty($, key, {
   writable: false,
   configurable: false,
   enumerable: true
});   
}
