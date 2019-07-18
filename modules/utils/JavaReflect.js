MapScript.loadModule("JavaReflect", {
	constructor : function(className, argTypes) {
        var i, invokeArgs = new Array(argTypes.length), clazz, constructor;
        clazz = java.lang.Class.forName(className);
        for (i = 0; i < argTypes.length; i++) {
            invokeArgs[i] = this.parseArgType(argTypes[i]);
        }
        constructor = clazz.getConstructor(invokeArgs);
        return constructor.newInstance.bind(constructor);
    },
    declaredConstructor : function(className, argTypes) {
        var i, invokeArgs = new Array(argTypes.length), clazz, constructor;
        clazz = java.lang.Class.forName(className);
        for (i = 0; i < argTypes.length; i++) {
            invokeArgs[i] = this.parseArgType(argTypes[i]);
        }
        constructor = clazz.getDeclaredConstructor(invokeArgs);
        constructor.setAccessible(true);
        return constructor.newInstance.bind(constructor);
    },
    method : function(className, methodName, argTypes) {
        var i, invokeArgs = new Array(argTypes.length), clazz, method;
        clazz = java.lang.Class.forName(className);
        for (i = 0; i < argTypes.length; i++) {
            invokeArgs[i] = this.parseArgType(argTypes[i]);
        }
        method = clazz.getMethod(methodName, invokeArgs);
        return method.invoke.bind(method);
    },
    declaredMethod : function(className, methodName, argTypes) {
        var i, invokeArgs = new Array(argTypes.length), clazz, method;
        clazz = java.lang.Class.forName(className);
        for (i = 0; i < argTypes.length; i++) {
            invokeArgs[i] = this.parseArgType(argTypes[i]);
        }
        method = clazz.getDeclaredMethod(methodName, invokeArgs);
        method.setAccessible(true);
        return method.invoke.bind(method);
    },
    field : function(className, fieldName) {
        var clazz, field;
        clazz = java.lang.Class.forName(className);
        field = clazz.getField(fieldName);
        return {
            get : field.get.bind(field),
            set : field.set.bind(field)
        };
    },
    declaredField : function(className, fieldName) {
        var clazz, field;
        clazz = java.lang.Class.forName(className);
        field = clazz.getField(fieldName);
        field.setAccessible(true);
        return {
            get : field.get.bind(field),
            set : field.set.bind(field)
        };
    },
    parseArgType : function(type) {
        if (typeof type == "string") {
            try {
                return java.lang.Class.forName(type);
            } catch(e) {/* Class not found */}
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
        } else {
            return type.getClass();
        }
    }
});