var Mask = {};

(function(){
    
    this.newMask = function($el, options, errorFunction){
        return new Masker($el, options, errorFunction);
    }
        
    var masks = {
        number: "",
        date: "yyyy-hh-mm",
        datetime: "",
        time: "",
        char: "",
    };
    
    
    
    function Masker($el, mask, errorFunction){
        this.linkedMask = [];
        this.$el = $el;
        this.mask = mask.trim();
        this.errorFunction = errorFunction;
        this.addExtraChars();
        this.setMask();
    };
    
    Masker.prototype.linkedMask = [];
    Masker.prototype.specialModifiers = {};
    Masker.prototype.errors = {};
    Masker.prototype.doNotValidate = {};
    Masker.prototype.BACKSPACE = 8;
    Masker.prototype.DELETE = 46;
    Masker.prototype.tokensBefore = [];
    
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
            var charObject = {
                pos: i,
                maskValue: char
            }
            if(i>0){
                prevChar = this.linkedMask[i-1];
                charObject.prevChar = prevChar;
                prevChar.nextChar = charObject;
            }
            this.linkedMask.push(charObject);
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
            this.$el.attr("placeholder", this.mask);
            this.specialMask = this.isSpecialMask(this.mask, this);
            
            this.$el.on("keydown", function(e){
                var input = $(this)
                var inputVal = input.val();
                var pos = $(this).get(0).selectionStart;
                var backPosition = pos-1;
                var char;
                var mustCheck = false;
                
                if(isBackSpace()){
                    pos--;
                    mustCheck = true;
                }else if(isDelete()){
                    mustCheck = true;
                }
                
                if(mustCheck){
                    mustPrevent();
                }
                
                function isBackSpace(){
                    return e.keyCode == context.BACKSPACE;
                };
                
                function isDelete(){
                    return e.keyCode == context.DELETE;
                };
                
                function mustPrevent(){
                    char = inputVal.charAt(pos);
                    if(context.doNotValidate[char]){
                        input.get(0).selectionStart = backPosition;
                        input.get(0).selectionEnd = backPosition;
                        e.preventDefault();
                    }
                }
            })
            
            this.$el.on("keypress", function(e){
                var validFormat;
                var inputVal = $(e.target).val();
                var newChar = String.fromCharCode(e.keyCode);
                var inputParent = $(this).parent();
                var actualPos = $(this).get(0).selectionStart;
                
                context.event = e;
                composeFinalInput();
                context.completePattern();
                if(context.validPattern){
                    validateValue();
                }
                if(context.advancePosition){
                    context.advancePosition = false;
                    context.$el.get(0).selectionStart = actualPos + 1 ;
                    context.$el.get(0).selectionEnd = actualPos + 1 ;
                }
                
                function composeFinalInput(){
                    context.finalValue = context.insertCharInCaret(newChar, inputVal, actualPos);
                };
                
                function validateValue(){
                    
                    validFormat = context.validateValue(context);
                    
                    if(validFormat == false){
                        context.errors[context.lastInput] = true;    
                    }else{
                        if(context.linkedMask[actualPos]){
                            context.linkedMask[actualPos].inputVal = newChar;
                        }
                        
                        if(typeof context.errors[context.lastInput]){
                            context.errors[context.lastInput] = false;
                        }
                    }
                    validFormat = context.checkOldErrors(context);
                    
                    if(context.errorFunction){
                        context.errorFunction(validFormat, context.$el)
                    }else{
                        if(validFormat == false){
                            inputParent.css("border", "1px solid red");
                        }else if(validFormat == true){
                            inputParent.css("border", "none");
                        }
                    }
                };
            })
        }
    };
    
    Masker.prototype.isSpecialMask = function(mask, context){
        var mask = context.mask;
        var maskLength = mask.length;
        var pattern;
        var patternName;
        var patternLength;
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
        }
        
        return pattern;        
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
        var length = value.length;
        var pattern = this.mask;
        var lastChar = String.fromCharCode(event.keyCode);
        var pos = this.$el.get(0).selectionStart;
        var charNow = pattern[pos];
        var specialMask = this.specialMask;
        var mustPrevent = false;
        var functionToApply;
        this.getTokensBefore(pos);
        var groupComparison;
        var newPos;
        
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
            if(isValid){
                context.autoCompleteWithToken(context);
            }
        }
        return isValid;
    };
    
    Masker.prototype.autoCompleteWithToken = function(context){
        var pos = context.$el.get(0).selectionStart + 1;
        var maskChar = context.mask[pos];
        var inputChar = context.finalValue[pos];
        
        if(context.doNotValidate[maskChar] && maskChar != inputChar){
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
    
    Masker.prototype.getGroupValue = function(pos){
        this.getTokensBefore(pos);
        var group = this.getPositionInMask();
        var groupCount = this.getNumberOf(group);
        var bounds = this.getInputGroupBounds();
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
    
    Masker.prototype.getInputGroupBounds = function(){
        var input = this.finalValue;
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
    
    Masker.prototype.written = {};
    
    Masker.prototype.templates = {
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
    
    Masker.prototype.specialTemplates = {
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
            var matches = char.match("[a-zA-Z]") || false;
            var modifier = context.specialModifiers["az"];
            if(modifier){
                return matches && context.finalValue.length <= modifier;
            }else{
                return matches;
            }
        }
    }
    
    Masker.prototype.validator = {
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
            return hour >= 0 && hour <= 24;
        },
        "m": function(patternInput){
            var minutes = parseInt(patternInput);
            return minutes >= 0 && minutes <= 60;
        },
        "n": function(patternInput){
            var number = parseInt(patternInput);
            return number;
        },
        "az": function(patternInput){
            return true;
        },
        
    };
    
}).apply(Mask);