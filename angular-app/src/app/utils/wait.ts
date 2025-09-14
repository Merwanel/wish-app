/* synchronous wait to debug asynchronous sutff */
function wait(ms:number) {
  var start = Date.now(),
      now = start;
  while (now - start < ms) {
    now = Date.now();
  }
}