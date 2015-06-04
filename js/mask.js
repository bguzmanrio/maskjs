var Mask = {};

(function(){
    
    this.newMask = function(options){
        return new Masker(options);
    }
        
    var masks = {
        number: "",
        date: "yyyy-hh-mm",
        datetime: "",
        time: "",
        char: "",
    };
    
    function Masker(options){
        //$el, mask, errorFunction
        MaskerData.call(this);
        this.prototype = Object.create(this);
        this.$el = options.$el;
        this.mask = options.mask.trim();
        this.placeholder = options.placeholder;
        this.errorFunction = options.errorFunction;
        this.defaultValue = options.defaultValue;
        this.isUtc = options.isUtc || false;
        this.hidePlaceholder = options.hidePlaceholder || false;
        this.getBrowser();
        this.addExtraChars();
        this.setMask();
    };
    
    Masker.prototype.isIE = function(){
        var userAgent = window.navigator.userAgent;
        return userAgent.indexOf("MSIE") >= 0 || userAgent.indexOf("Trident") >= 0;
    };
    
    Masker.prototype.isFirefox = function(){
        var userAgent = window.navigator.userAgent;
        return userAgent.indexOf("Firefox") >= 0;
    };
    
    Masker.prototype.isChrome = function(){
        var userAgent = window.navigator.userAgent;
        return userAgent.indexOf("Chrome") >= 0;
    };
    
    Masker.prototype.isSafari = function(){
        var userAgent = window.navigator.userAgent;
        return userAgent.indexOf("Safari") >= 0;
    };
        
    Masker.prototype.getBrowser = function(){
        if(this.isIE()){
            this.browser = "ie";
        }else if(this.isFirefox()){
            this.browser = "firefox";
        }else if(this.isChrome()){
            this.browser = "chrome";
        }else if(this.isSafari()){
            this.browser = "chrome";
        }
    };
    
    Masker.prototype.addExtraChars = function(){
        var i = 0;
        var nCharsInMask = this.mask.length;
        var char;
        var functionAssociated;
        var context = this;
        var prevChar;
        var nextChar;
        var existsCompleteTemplate = this.templates[this.mask];
        for(; i<nCharsInMask && !existsCompleteTemplate ; i++){
            char = this.mask[i];
            functionAssociated = this.templates[char];
            if(!functionAssociated){
                createTemplateFunction();
                createValidationFunction();
                createException();
            }
        }
        
        function createTemplateFunction(){
            context.templates[char] = function(extraChar, input, context){
                var pos = context.$el.get(0).selectionStart;
                var charAtMask = context.mask[pos];
                var nextChar = input.charAt(pos);
                return extraChar == charAtMask && extraChar != nextChar;
            }
        };
        
        function createValidationFunction(){
            context.validator[char] = function(){
                return true;
            }
        };
        
        function createException(){
            context.doNotValidate[char] = true;
        };
    };
    
    Masker.prototype.setMask = function(){
        var context = this;
        if(this.$el.is("input")){
            if(!this.hidePlaceholder){
                this.$el.attr("placeholder", this.placeholder || this.mask);
            }
            this.specialMask = this.isSpecialMask(this.mask, this);
            if(this.defaultValue){                
                this.setDefaultValue();
            }
            
            this.$el.on("keydown", function(e){
                var input = $(this)
                var inputVal = input.val();
                var inputElement = input.get(0);
                var start = inputElement.selectionStart;
                var end = inputElement.selectionEnd;
                var pos = start;
                var backPosition = start-1;
                var char;
                var mustCheck = false;
                
                if(isBackSpace() || isDelete() ){
                    start--;
                    mustCheck = true;
                }else if(isSelection()){
                    mustCheck = true;
                }
                
                if(mustCheck){
                    avoidKeyPress();
                    if(start == end){
                        mustPrevent();
                    }
                }
                
                function avoidKeyPress(){
                    context.browserFunctionalities.keydown[context.browser](context);
                }
                
                function isBackSpace(){
                    return e.keyCode == context.BACKSPACE;
                };
                
                function isDelete(){
                    return e.keyCode == context.DELETE;
                };
                
                function isSelection(){
                    return context.MOVEMENT.indexOf(e.keyCode) >= 0;
                };
                
                function mustPrevent(){
                    char = inputVal.charAt(start);
                    if(context.doNotValidate[char]){
                        inputElement.selectionStart = backPosition;
                        inputElement.selectionEnd = backPosition;
                        e.preventDefault();
                    }
                }
            })
            
            this.$el.on("keypress", function(e){
                e.stopImmediatePropagation();
                var brwFunc = context.browserFunctionalities;
                var browser = context.browser;
                if(brwFunc.mustAllowKeyDown[browser](context)){
                    context.keyPressHandler(e, context);
                }
                brwFunc.keyPress[browser](context);
                
            });
        }
    };
                        
    Masker.prototype.keyPressHandler = function(e, context, tokenSkipped){
        //var event = arguments[1] || arguments[0];
        var event = e;
        var context = context;
        var validFormat;
        var input = $(event.target);
        var inputVal = input.val();
        var newChar = String.fromCharCode(event.charCode);
        var inputParent = input.parent();
        var actualPos = input.get(0).selectionStart;
        
        context.event = event;
        composeFinalInput();
        if(!this.specialMask){
            mustAdvancePositionBefore();
        }
        context.completePattern();
        if(context.validPattern){
            validateValue();
        }else{
            validFormat == false;
        }
        
        if(validFormat != false && tokenSkipped){
            input.val(context.finalValue);
        }
        
        if(context.advancePosition){
            context.advancePosition = false;
            context.$el.get(0).selectionStart = actualPos + 1 ;
            context.$el.get(0).selectionEnd = actualPos + 1 ;
            context.finalValue = inputVal;
        }

        function mustAdvancePositionBefore(){
            var actualChar = inputVal[actualPos];
            var maskActualChar = context.mask[actualPos];
            var group = context.getGroupValue(actualPos, inputVal);
            if(group.isCompleted){
                if(!actualChar && context.doNotValidate[maskActualChar]){
                    inputVal += maskActualChar;
                    input.val(inputVal);
                    input.get(0).selectionStart++;
                    actualPos++;
                }else if(context.doNotValidate[actualChar]){
                    input.get(0).selectionStart++;
                    actualPos++;
                }
            }
        };
        
        function composeFinalInput(){
            context.finalValue = context.insertCharInCaret(newChar, inputVal, actualPos);
        };

        function validateValue(){

            validFormat = context.validateValue(context);

            if(validFormat == false){
                context.errors[context.lastInput] = true;    
            }else if(typeof context.errors[context.lastInput]){
                context.errors[context.lastInput] = false;
            }
            
            validFormat = context.checkOldErrors(context);

            if(context.errorFunction){
                context.errorFunction(validFormat, context.$el)
            }
        };
    };
    
    Masker.prototype.isSpecialMask = function(mask, context){
        var mask = context.mask;
        var pattern;
        var patternName;
        var patternModifier;
        
        $.each(context.specialTemplates, function(i,val){
            if(mask.indexOf(i) >= 0){
                pattern = val;
                patternName = i;
                patternModifier = parseInt(mask.substring(i.length));
            }
        })
        if(patternModifier){
            context.specialModifiers[patternName] = patternModifier;   
			context.maskNoModifiers = patternName;
        }
        
        return pattern;        
    };
    
    Masker.prototype.UTCDateFunction = {
        "true":{
            "Y": "getUTCFullYear",
            "M": "getUTCMonth",
            "D": "getUTCDate",
            "H": "getUTCHours",
            "m": "getUTCMinutes",
            "s": "getUTCSeconds",
        },
        "false":{
            "Y": "getFullYear",
            "M": "getMonth",
            "D": "getDate",
            "H": "getHours",
            "m": "getMinutes",
            "s": "getSeconds",
        }
    }
    
    Masker.prototype.createDefaultValue = {
        "Y": function(context, length){
            var defDate = new Date(context.defaultValue);
            var isUtc = context.isUtc;
            var stringFunction = context.UTCDateFunction[context.isUtc]["Y"];
            return defDate[stringFunction]();
            
        },
        "M": function(context, length){
            var defDate = new Date(context.defaultValue);
            var isUtc = context.isUtc;
            var stringFunction = context.UTCDateFunction[context.isUtc]["M"];
            return defDate[stringFunction]() + 1;
        },
        "D": function(context, length){
            var defDate = new Date(context.defaultValue);
            var isUtc = context.isUtc;
            var stringFunction = context.UTCDateFunction[context.isUtc]["D"];
            return defDate[stringFunction]();
        },
        "H": function(context, length){
            var defDate = new Date(context.defaultValue);
            var isUtc = context.isUtc;
            var stringFunction = context.UTCDateFunction[context.isUtc]["H"];
            return defDate[stringFunction]();
        },
        "m": function(context, length){
            var defDate = new Date(context.defaultValue);
            var isUtc = context.isUtc;
            var stringFunction = context.UTCDateFunction[context.isUtc]["m"];
            return defDate[stringFunction]();
        },
        "s": function(context, length){
            var defDate = new Date(context.defaultValue);
            var stringFunction = context.UTCDateFunction[context.isUtc]["s"];
            return defDate[stringFunction]();
        }
    }
    
    Masker.prototype.setDefaultValue = function(){
        var context = this;
        var input = this.$el;
        var defaultValue = this.defaultValue;
        var finalValue = "";
        var charsInMask = [];
        var i = 0;
        var mask = this.mask;
        var nChars = mask.length;
        var auxChar;
        var nOccurrences;
        var validator;
        var key;
        var tempString = defaultValue;
        var charObject = {
            char: "",
            occurrences: 0
        };
        var isAlreadyInList = {};
        
        if(this.isSpecialMask(mask, context)){
            getKey();
            getValidator();
            validateLength();
            validateValue();
        }else{
            getCharsInMask();
            applyFormat();
        }
        context.$el.val(finalValue);
        
        function getKey(){
            key = Object.keys(context.specialModifiers)[0];
        };
        
        function getValidator(){
            if(key){
                validator = context.validator[key];
            }
        };
        
        function validateLength(){
            var length = context.specialModifiers[key];
            if(defaultValue.length > length){
                tempString = defaultValue.substr(0, length);
            }
        };
        
        function validateValue(){
            if(!validator || validator(tempString)){
                finalValue = tempString;   
            }
        };
        
        function getCharsInMask(){
            for(; i < nChars; i++){
                charObject = {
                    char: "",
                    occurrences: 0
                };
                auxChar = mask[i];
                charObject.char = auxChar;
                if(context.doNotValidate[auxChar]){
                    charObject.occurrences = 1;
                    charsInMask.push(charObject);
                }else if(!isAlreadyInList[auxChar]){
                    isAlreadyInList[auxChar] = true;
                    nOccurrences = context.getNumberOf(auxChar);
                    charObject.occurrences = nOccurrences;
                    charsInMask.push(charObject);
                }
            }
        }
        
        function applyFormat(){
            var i = 0;
            var nCharsInList = charsInMask.length;
            var charToParse;
            var functionToApply;
            var stringToAppend = "";
            for(; i<nCharsInList; i++){
                charToParse = charsInMask[i];
                functionToApply = context.createDefaultValue[charToParse.char];
                if(functionToApply){
                    stringToAppend = functionToApply(context, charToParse.occurrences);
                }else{
                    stringToAppend = charToParse.char;
                }
                stringToAppend = readjustLength(stringToAppend.toString(), charToParse.occurrences);
                finalValue += stringToAppend;
            }
        };
        
        function readjustLength(string, length){
            var stringLength = string.length;
            var subStringStart;
            var value = string;
            if(length<stringLength){
                subStringStart = stringLength-length;
                value = string.substr(subStringStart, stringLength);
            }else if(length > stringLength){
                diff = length - stringLength;
                value = readjustLength("0" + value, length);
            }
            
            return value;
        };
    };
    
    Masker.prototype.insertCharInCaret = function(newChar, inputVal, actualPos){
        var firstPart = inputVal.substring(0 , actualPos);
        var endPart = inputVal.substring(actualPos);
        return firstPart + newChar + endPart;
    };
    
    Masker.prototype.completePattern = function(){
        var event = this.event;
        var value = this.value = $(event.target).val();
        var context = this;
        var pattern = this.mask;
        var lastChar = String.fromCharCode(event.charCode);
        var pos = this.$el.get(0).selectionStart;
        var charNow = pattern[pos];
        var specialMask = this.specialMask;
        var mustPrevent = false;
        var functionToApply;
        var groupComparison;
        var newPos;
        this.getTokensBefore(pos);
        
        if(isCharInPattern()){
            getNewCharNow();
            getTemplateChecker();
            checkTemplate();
            mustAdvancePosition();
            isValidPattern();            
        }else{
            setPrevent();
        }
        preventWriting();
        
        function isSpecialChar(){
            return (charNow == lastChar) && context.doNotValidate[lastChar];
        };
        
        function isCharInPattern(){
            return typeof charNow != "undefined" || specialMask;
        };
        
        function getNewCharNow(){
            groupComparison = context.getGroupValue(pos);
            newPos = context.mask.indexOf(groupComparison.group) + groupComparison.groupCount;
            if(groupComparison.value.length > groupComparison.groupCount){
                charNow = context.lastInput = context.mask[newPos];
            }else{
                charNow = context.lastInput = groupComparison.group;
            }
        };
        
        function getTemplateChecker(){
            functionToApply = specialMask || context.templates[charNow];
        };
        
        function checkTemplate(){
            if( functionToApply){
                context.validPattern = functionToApply(lastChar, value, context);
            }else{
                context.validPattern = false;
            }
        };
        
        function mustAdvancePosition(){
            if(context.doNotValidate[charNow]){
                context.advancePosition = true;
            }
        };
        
        function isValidPattern(){
            if(context.validPattern == false){
                setPrevent();
                context.advancePosition = true;
            }
        };
        
        function setPrevent(){
            mustPrevent = true;
        };
        
        function preventWriting(){
            if(mustPrevent){
                event.preventDefault();
            }
        };
    };
    
    Masker.prototype.validateValue = function(context, lastChar){
        var validationFunction;
        var charToValidate = lastChar || context.lastInput;
        var isValid = context.doNotValidate[charToValidate];
        var valueForLastChar = context.getValueFor(charToValidate, context.finalValue, context);
        if(!isValid && valueForLastChar.patternCount == valueForLastChar.inputCount){
            validationFunction = context.validator[charToValidate];
            isValid = validationFunction(valueForLastChar.value, context, true);
            context.autoCompleteWithToken(context);
        }
        return isValid;
    };
    
    Masker.prototype.autoCompleteWithToken = function(context){
        var pos = context.$el.get(0).selectionStart + 1;
        var maskChar = context.mask[pos];
        var inputChar = context.finalValue[pos];
		var modifiers = context.specialModifiers || {};
		var modifier = modifiers[context.maskNoModifiers];
        
        if(context.doNotValidate[maskChar] && maskChar != inputChar && modifier != maskChar){
            var finalInput = context.insertCharInCaret(maskChar, context.finalValue, pos);
            context.$el.val(finalInput);
            context.event.preventDefault();
        }
    };
    
    Masker.prototype.checkOldErrors = function(context){
        var stillValid ;
        $.each(context.errors, function(i, val){
            if(val == true && stillValid!= false){
                stillValid = context.validateValue(context, i);
            }
        });
        return stillValid;
    }
    
    Masker.prototype.getGroupValue = function(pos, input){
        this.getTokensBefore(pos);
        var group = this.getPositionInMask();
        var groupCount = this.getNumberOf(group);
        var bounds = this.getInputGroupBounds(input);
        if(bounds.start == -1){
            bounds.start = 0;
        }
        
        if(bounds.end == -1){
            bounds.end = pos + groupCount;
        }
        var value = this.finalValue.substring(bounds.start, bounds.end);
        return {
            value: value,
            group: group,
            groupCount: groupCount,
            isCompleted: groupCount == value.length
        }
    };
    
    Masker.prototype.getInputGroupBounds = function(inputParam){
        var input = inputParam || this.finalValue;
        var i = 0;
        var inputLength = input.length;
        var char;
        var tokenCount = 0;
        var firstPosition = -1;
        var lastPosition = -1;
        var boundaries = {
            start: -1,
            end: -1
        };
        for(; i<inputLength ; i++){
            char = input[i];
            if(this.doNotValidate[char]){
                if(char == this.tokensBefore[tokenCount]){
                    firstPosition = i+1;
                    tokenCount++;
                }
            }
        }
        if(firstPosition < 0){
            firstPosition = 0;
        }
        boundaries.start = firstPosition;
        for(; firstPosition < inputLength; firstPosition++){
            char = input[firstPosition];
            if(this.doNotValidate[char]){
                lastPosition = firstPosition;
                firstPosition = inputLength;
            }
        }
        if(lastPosition < 0){
            lastPosition = inputLength;
        }
        boundaries.end = lastPosition;
        
        return boundaries;
    };
    
    Masker.prototype.getNumberOf = function(char){
        var pattern = this.mask;
        var i = 0;
        var patternLegth = pattern.length;
        var count = 0;
        for(; i<patternLegth ; i++){
            if(char == pattern[i]){
                count++;
            }
        }
        return count;
    };
    
    Masker.prototype.getTokensBefore = function(pos){
        this.tokensBefore = [];
        var i = 0;
        var char;
        this.distanceFromToken = 0;
        for(; i < pos ; i++){
            char = this.finalValue[i];
            this.distanceFromToken++;
            if(this.doNotValidate[char]){
                this.distanceFromToken = 1;
                this.tokensBefore.push(char);
            }
        }
    };
    
    Masker.prototype.getPositionInMask = function(){
        var token;
        var tokensBefore = this.tokensBefore;
        var nTokens = tokensBefore.length;
        var i = 0;
        var j;
        var lastPositionInMask = 0;
        var mask = this.mask;
        var maskLength = mask.length;
        var maskChar;
        var group = "";
        for(; i< nTokens ; i++){
            j = lastPositionInMask;
            token = tokensBefore[i];
            for(; j < maskLength ; j++){
                maskChar = mask[j];
                if( this.doNotValidate[maskChar] && token == maskChar){
                    group = mask[j+1];
                    lastPositionInMask = j+1;
                    j = maskLength;
                }
            }
        }
        if(i == 0){
            group = mask[0];
        }
        return group;
    };
        
    Masker.prototype.getValueFor = function(patternChar, input, context){
        var mask = context.mask;
        var firstPos = mask.indexOf(patternChar);
        var lastPos = mask.lastIndexOf(patternChar);
        var value = "";
        var result = {};
        var actualPos;
        var patternCount = 0;
        var inputCount = 0;
        for(; firstPos <= lastPos ; firstPos++){
            patternCount++;
            if(mask.charAt(firstPos) == patternChar){
                actualPos = input[firstPos] || "";
                if(context.templates[patternChar](actualPos, input, context)){
                    value += actualPos;
                    inputCount++;
                }else{
                    firstPos = lastPos + 1;
                }
            }else{
                value = "";
                firstPos = lastPos + 1;
            }
        }
        result.value = value;
        result.patternCount = patternCount;
        result.inputCount = inputCount;
        return result;
    };
    
    function MaskerData(){
        this.written = {};

        this.templates = {
            "Y": function(char, input, context){
                var length = input.length;
                var number = context.templates["n"](char, input, context);
                //context.lastInput = "Y";
                return number;
            },
            "M": function(char, input, context){
                var length = input.length;
                var number = context.templates["n"](char, input, context); 
                //context.lastInput = "M";
                return number;
            },
            "D": function(char, input, context){
                var length = input.length;
                var number = context.templates["n"](char, input, context);
                //context.lastInput = "D";
                return number;
            },
            "H": function(char, input, context){
                var length = input.length;
                var number = context.templates["n"](char, input, context);
                //context.lastInput = "H";
                return number;
            },
            "m": function(char, input, context){
                var length = input.length;
                var number = context.templates["n"](char, input, context);
                //context.lastInput = "m";
                return number;
            },
            "n": function(char, input, context){
                //context.lastInput = "n";
                return parseInt(char) >= 0;
            }
        };

        this.specialTemplates = {
            "n": function(char, input, context){
                //context.lastInput = "n";
                var isNumber = parseInt(char) >= 0;
                var modifier = context.specialModifiers["n"];
                if(modifier){
                    return isNumber && context.finalValue.length <= modifier;
                }else{
                    return isNumber;
                }
            },
            "az": function(char, input, context){
                //context.lastInput = "az";
                var matches = char.match("[\u00F1a-zA-Z]") || [];
                var modifier = context.specialModifiers["az"];
                if(modifier){
                    return matches && context.finalValue.length <= modifier;
                }else{
                    return matches.length;
                }
            },
            "az/n": function(char, input, context){
                //context.lastInput = "az";
                var matches = char.match("[\u00F1a-zA-Z0-9]") || [];
                var modifier = context.specialModifiers["az/n"];
                if(modifier){
                    return matches && context.finalValue.length <= modifier;
                }else{
                    return matches.length;
                }
            }
        }

        this.validator = {
            "Y": function(patternInput, context, propagateValidation){
                var valid = true;
                var dayValue = context.getValueFor("D", context.finalValue, context);
                if(dayValue.value && propagateValidation == true){
                    valid = valid && context.validator["D"](dayValue.value, context);
                }
                return valid;
            },
            "M": function(patternInput, context, propagateValidation){
                var month = parseInt(patternInput);
                var valid = month >= 1 && month <= 12;
                var dayValue = context.getValueFor("D", context.finalValue, context);
                if(dayValue.value && propagateValidation == true){
                    valid = valid && context.validator["D"](dayValue.value, context);
                }
                return valid;
            },
            "D": function(patternInput, context){
                var validationDate = new Date();
                var day = parseInt(patternInput);
                var maxDay = 31;
                var month = context.getValueFor("M", context.finalValue, context);
                var year = context.getValueFor("Y", context.finalValue, context);

                if(year.value && context.validator["Y"](year.value, context, false)){
                    validationDate.setFullYear(parseInt(year.value));
                }

                if(month.value && context.validator["M"](month.value, context, false)){
                    validationDate.setMonth(parseInt(month.value));
                    validationDate.setDate(0);
                    maxDay = validationDate.getDate();
                }

                if(day > 0 && day <= maxDay){
                    return true;
                }else{
                    return false;
                }
            },
            "H": function(patternInput){
                var hour = parseInt(patternInput);
                return hour >= 0 && hour < 24;
            },
            "m": function(patternInput){
                var minutes = parseInt(patternInput);
                return minutes >= 0 && minutes < 60;
            },
            "n": function(patternInput){
                var number = parseInt(patternInput);
                return number;
            },
            "az": function(patternInput){
                var matches = patternInput.match("[\u00F1a-zA-Z]") || false;
                return matches;
            }
        };
        
        this.browserFunctionalities = {
            keyPress: {
                ie: function(context){
                    
                },
                firefox: function(context){
                    context.avoidKeyPress = false;
                },
                chrome: function(context){
                    
                }
            },
            mustAllowKeyDown: {
                ie: function(context){
                    return true;
                },
                firefox: function(context){
                    return !context.avoidKeyPress
                },
                chrome: function(context){
                    return true;
                }
            },
            keydown: {
                ie: function(context){
                    
                },
                firefox: function(context){
                    context.avoidKeyPress = true;
                },
                chrome: function(context){
                    
                }
            }
        }
        
        this.specialModifiers = {};
        this.errors = {};
        this.doNotValidate = {};
        this.tokensBefore = [];
        this.BACKSPACE = 8;
        this.DELETE = 46;
        this.START = 36;
        this.END = 35;
        this.MOVEMENT = [36, 35, 37, 38, 39, 40];
    };
    
}).apply(Mask);
