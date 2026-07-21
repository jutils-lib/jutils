
/**
 * Factory function that creates a new `jUtils` instance.
 *
 * @param {*} input - A selector, element, collection, HTML string, or special shorthand input.
 * @returns {jUtils} A new `jUtils` instance wrapping the provided input.
 */
function $(input) { 
return new jUtils(input);
}



/**
 * Lightweight DOM utility wrapper.
 *
 * Supports:
 * - CSS selectors
 * - HTML strings
 * - shorthand element creation using `$tag`
 * - DOM elements
 * - array-like collections
 * - existing `jUtils` instances
 */
class jUtils {
/**
   * Creates a new `jUtils` instance from the given input.
   *
   * @param {*} input - Selector, HTML string, element, collection, or `jUtils` instance.
   */
constructor(input) {  
// Handle string input: selector, HTML string, or shorthand element creation.
if(typeof input === 'string') { 
 input = input.trim();  

// If the string looks like HTML, create a temporary container and parse it. 
 if(input.startsWith('<') && input.endsWith('>') && input.length >= 3) { 
  const element = document.createElement('div');
  element.innerHTML = input;
  return new jUtils(element);
 }

// Support shorthand element creation like `$div`, `$span`, etc.
 if(input.startsWith('$')) {
  const element = document.createElement(input.slice(1));
  return new jUtils(element); 
 }
    
 try {
 // Try to resolve the string as a CSS selector.
  const elements = Array.from(document.querySelectorAll(input));
  this.elements = elements.length > 0 ? elements : [input];
  this.length = elements.length;
 } catch { 
 // If the selector is invalid, store the raw input as a fallback value.
  this.elements = [input];
  this.length = 0;
 }
    
} else {
 const result = [];

// Normalize all input into a flat array of values/elements.
 [].concat(input).forEach(item => {     
  if(item instanceof jUtils) {
   result.push(...item.elements);
  } else if(item && Array.from(item).some(el => el && el.nodeType === 1)) {
   result.push(Array.from(item));
  } else { 
   result.push(item);
  }
});
 
this.elements = result;     
this.length = result.filter(el => el && el.nodeType === 1).length;
  }
 }
}

/**
 * Alias for the `jUtils` prototype, used for extending instance methods.
 */
jUtils.fn = jUtils.prototype;