
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

// Parse HTML strings into DOM elements and return them as jUtils instances.
 if(input.startsWith('<') && input.endsWith('>') && input.length >= 3) { 
  const parts = input.split('<').filter(Boolean); 

  if(parts[parts.length - 1].startsWith('/') || parts.length > 1) { 
   const temp = document.createElement('div');
   temp.innerHTML = input;     
   return new jUtils(temp.firstChild);
  } else {
   const tag = String(parts).replace(/[/>]/g, '');   
   const temp = document.createElement(tag);   
   return new jUtils(temp);
  }
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
 } finally {
  this.total = this.elements.length;
 }
    
} else {
const result = [];

// Normalize input items into a flat array of DOM elements or values.
[].concat(input).forEach(item => {
 if(item instanceof jUtils) {  
  result.push(...item.elements);
 } else if(item instanceof NodeList || item instanceof HTMLCollection) {
  result.push(...item);
 } else {
  result.push(item);
 }    
});
 
this.elements = result;     
this.length = result.filter(el => el && el.nodeType === 1).length;
this.total = result.length;
}
}
}


/**
 * Alias for the `jUtils` prototype, used for extending instance methods.
 */
jUtils.fn = jUtils.prototype;
