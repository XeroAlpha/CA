MapScript.loadModule("Threads", {
	onCreate : function() {
		this.executor = java.util.concurrent.Executors.newCachedThreadPool();
	},
	run : function(f) {
		return this.executor.submit(new java.lang.Runnable(f));
	},
	call : function(f) {
		return this.executor.submit(new java.util.concurrent.Callable(f));
	},
	await : function(f) {
		return this.executor.submit(new java.util.concurrent.Callable(f)).get();
	},
	awaitTimeout : function(f, timeout) {
		return this.executor.submit(new java.util.concurrent.Callable(f)).get(timeout, java.util.concurrent.TimeUnit.MILLISECONDS);
	},
	awaitDefault : function(f, timeout, defaultValue) {
		var future = this.executor.submit(new java.util.concurrent.Callable(f));
		try {
			return future.get(timeout, java.util.concurrent.TimeUnit.MILLISECONDS);
		} catch(e) {
			return defaultValue;
		}
	}
});