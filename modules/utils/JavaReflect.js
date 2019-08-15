MapScript.loadModule("JavaReflect", {
	constructor : function(clazz, argTypes) {
		var i, invokeArgs = new Array(argTypes.length), constructor;
		clazz = this.parseClass(clazz);
		for (i = 0; i < argTypes.length; i++) {
			invokeArgs[i] = this.parseClass(argTypes[i]);
		}
		constructor = clazz.getConstructor(invokeArgs);
		return constructor.newInstance.bind(constructor);
	},
	declaredConstructor : function(clazz, argTypes) {
		var i, invokeArgs = new Array(argTypes.length), constructor;
		clazz = this.parseClass(clazz);
		for (i = 0; i < argTypes.length; i++) {
			invokeArgs[i] = this.parseClass(argTypes[i]);
		}
		constructor = clazz.getDeclaredConstructor(invokeArgs);
		constructor.setAccessible(true);
		return constructor.newInstance.bind(constructor);
	},
	method : function(clazz, methodName, argTypes) {
		var i, invokeArgs = new Array(argTypes.length), method;
		clazz = this.parseClass(clazz);
		for (i = 0; i < argTypes.length; i++) {
			invokeArgs[i] = this.parseClass(argTypes[i]);
		}
		method = clazz.getMethod(methodName, invokeArgs);
		return method.invoke.bind(method);
	},
	declaredMethod : function(clazz, methodName, argTypes) {
		var i, invokeArgs = new Array(argTypes.length), method;
		clazz = this.parseClass(clazz);
		for (i = 0; i < argTypes.length; i++) {
			invokeArgs[i] = this.parseClass(argTypes[i]);
		}
		method = clazz.getDeclaredMethod(methodName, invokeArgs);
		method.setAccessible(true);
		return method.invoke.bind(method);
	},
	field : function(clazz, fieldName) {
		var field;
		clazz = this.parseClass(clazz);
		field = clazz.getField(fieldName);
		return {
			get : field.get.bind(field),
			set : field.set.bind(field)
		};
	},
	declaredField : function(clazz, fieldName) {
		var field;
		clazz = this.parseClass(clazz);
		field = clazz.getField(fieldName);
		field.setAccessible(true);
		return {
			get : field.get.bind(field),
			set : field.set.bind(field)
		};
	},
	parseClass : function(type) {
		if (typeof type == "string") {
			try {
				return java.lang.Class.forName(type, true, ctx.getClassLoader());
			} catch(e) {/* Class not found */}
			if (type == "string") return java.lang.Class.forName("java.lang.String");
			if (type == "boolean") return java.lang.Boolean.TYPE;
			if (type == "byte") return java.lang.Byte.TYPE;
			if (type == "char") return java.lang.Character.TYPE;
			if (type == "double") return java.lang.Double.TYPE;
			if (type == "float") return java.lang.Float.TYPE;
			if (type == "int") return java.lang.Integer.TYPE;
			if (type == "long") return java.lang.Long.TYPE;
			if (type == "short") return java.lang.Short.TYPE;
			if (type == "void") return java.lang.Void.TYPE;
			return null;
		} else if (type instanceof java.lang.Class) {
			return type;
		} else if (type.arrayOf) {
			return this.arrayClass(type.arrayOf, type.dimensions);
		} else {
			return type.getClass();
		}
	},
	arrayClass : function(arrayOf, dimensions) {
		var i, str = "[";
		arrayOf = this.parseClass(arrayOf);
		dimensions = parseInt(dimensions);
		if (!(dimensions > 0)) dimensions = 1;
		for (i = 1; i < dimensions; i++) str += "[";
		if (arrayOf.isPrimitive()) {
			if (arrayOf == java.lang.Boolean.TYPE) {
				str += "Z";
			} else if (arrayOf == java.lang.Byte.TYPE) {
				str += "B";
			} else if (arrayOf == java.lang.Character.TYPE) {
				str += "C";
			} else if (arrayOf == java.lang.Double.TYPE) {
				str += "D";
			} else if (arrayOf == java.lang.Float.TYPE) {
				str += "F";
			} else if (arrayOf == java.lang.Integer.TYPE) {
				str += "I";
			} else if (arrayOf == java.lang.Long.TYPE) {
				str += "J";
			} else if (arrayOf == java.lang.Short.TYPE) {
				str += "S";
			} else { // void
				throw new Error("Component type cannot be void");
			}
		} else if (arrayOf.isArray()) {
			str += arrayOf.getName();
		} else {
			str += "L" + arrayOf.getName() + ";";
		}
		return str;
	},
	array : function(arrayOf) {
		var i, args = new Array(arguments.length);
		args[0] = this.parseClass(arrayOf);
		for (i = 1; i < arguments.length; i++) {
			args[i] = arguments[i];
		}
		return java.lang.reflect.Array.newInstance.apply(null, args);
	}
});