

/**
 * jUtils utility wrapper for selecting, creating, and normalizing DOM elements.
 *
 * This utility accepts:
 * - CSS selectors
 * - HTML strings
 * - tag shorthand strings prefixed with ":"
 * - DOM elements
 * - arrays / array-like collections of elements
 * - existing jUtils instances
 *
 * The goal is to normalize different input forms into a consistent internal
 * `elements` array and a `length` value representing matched DOM elements.
 *
 * @param {string|Element|Array|NodeList|jUtils} selector - Input used to build the wrapper.
 * @returns {jUtils} A new jUtils instance wrapping the matched or created elements.
 */
function $(selector) { 
 return new jUtils(selector);
}



class jUtils {
/**
   * Create a new jUtils wrapper around the provided selector or element input.
   *
   * Behavior:
   * - HTML-like strings such as "<div>" are treated as element creation input
   * - Strings starting with ":" are treated as tag shorthand, e.g. ":div"
   * - Other strings are treated as CSS selectors
   * - Non-string values are normalized into an array of DOM elements when possible
   *
   * @param {*} selector - Input used to resolve DOM elements.
   */
constructor(selector) {
 // Handle HTML string input like "<div>" by creating a temporary container
 // and reading the generated element from its     
 if(typeof selector === 'string' && selector.trim().startsWith('<') && selector.trim().endsWith('>') && selector.trim().length >= 3) { 
const el = document.createElement('div');
el.innerHTML = selector;
return new jUtils(el);

// Handle shorthand tag creation like "$div" by creating a real DOM element.   
} else if(typeof selector === 'string' && selector.trim().startsWith('$')) {
const tag = selector.trim().slice(1);
const el = document.createElement(tag);
return new jUtils(el); 

// Handle normal CSS selector strings by querying the document.         
} else if(typeof selector === 'string') {
 try {
const elements = Array.from(document.querySelectorAll(selector));

 // If matches are found, store them; otherwise preserve the original string
 // so the wrapper still retains the input value.       
this.elements = elements.length > 0 ? elements : [selector];
this.length = elements.length;
 } catch {
 // If the selector is invalid, store the raw input and mark length as 0.      
this.elements = [selector];
this.length = 0;
 }
 
// Handle DOM nodes, arrays, NodeLists, jUtils instances, and other inputs.    
} else {
const elements = [];
[].concat(selector).forEach(item => {
// If the item is already a jUtils instance, reuse its internal elements.      
  if(item instanceof jUtils) {
   elements.push(...item.elements);
  } else if(item && Array.from(item).some(el => el && el.nodeType === 1)) {
// If the item is iterable and contains DOM elements.
   elements.push(...Array.from(item));
  } else {
// Otherwise keep the item as-is.      
   elements.push(item);
  }
});
 
this.elements = elements; 

// Count only actual DOM elements after filtering invalid values.      
this.length = elements.filter(el => el && el.nodeType === 1).length;
  }
 }
}

// Create a shorthand reference to the prototype for easier access and method extension.
jUtils.fn = jUtils.prototype;
