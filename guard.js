
/**
 * Locks all existing methods on `jUtils.fn` so they cannot be overwritten or reconfigured.
 *
 * - Iterates over the current own enumerable keys on `jUtils.fn`
 * - Marks each property as non-writable and non-configurable
 * - Keeps properties enumerable so they still appear in iteration
 *
 * Note:
 * - This only affects properties that already exist at the time this code runs.
 * - New properties added later will not be locked unless this logic is run again.
 */
for(const key of Object.keys(jUtils.fn)){
Object.defineProperty(jUtils.fn, key, {
   writable: false,
   configurable: false,
   enumerable: true
});   
}



/**
 * Locks all existing static properties on `$` so they cannot be overwritten or reconfigured.
 *
 * - Iterates over the current own enumerable keys on `$`
 * - Marks each property as non-writable and non-configurable
 * - Keeps properties enumerable so they still appear in iteration
 *
 * Note:
 * - This only affects properties that already exist at the time this code runs.
 * - New properties added later will not be locked unless this logic is run again.
 */
for(const key of Object.keys($)){
Object.defineProperty($, key, {
   writable: false,
   configurable: false,
   enumerable: true,
});   
}
