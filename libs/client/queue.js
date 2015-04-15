define(function() {

  function queue(parallelism) {
    var slice = [].slice;
    var q,
      tasks = [],
      started = 0,
      priored = 0,
      active = 0,
      remaining = 0,
      popping,
      error = null,
      await = noop,
      all;

    if (!parallelism) parallelism = Infinity;

    function pop() {
      while (popping = started < tasks.length && active < parallelism) {
        var i = started++,
          t = tasks[i],
          a = slice.call(t, 1);
        delete tasks[i];
        a.push(callback(i));
        ++active;
        if (t[0].isPrior) {
          priored--;
        }
        t[0].apply(null, a);
      }
    }

    function callback(i) {
      return function(e, r) {
        --active;
        if (error != null) return;
        if (e != null) {
          error = e;
          started = remaining = NaN;
          notify();
        } else {
          tasks[i] = r;
          if (--remaining) popping || pop();
          else notify();
        }
      };
    }

    function notify() {
      if (error != null) await(error);
      else if (all) await(error, tasks);
      else await.apply(null, [error].concat(tasks));
    }

    return q = {
      defer: function() {
        if (!error) {
          tasks.push(arguments);
          ++remaining;
          pop();
        }
        return q;
      },
      prior: function() {
        if (!error) {
          arguments[0].isPrior = true;
          tasks.splice(started + priored, 0, arguments);
          priored++;
          ++remaining;
          pop();
        }
        return q;
      },
      await: function(f) {
        await = f;
        all = false;
        if (!remaining) notify();
        return q;
      },
      awaitAll: function(f) {
        await = f;
        all = true;
        if (!remaining) notify();
        return q;
      }
    };
  }

  function noop() {}

  return queue;
});