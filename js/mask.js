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
        this.$el = $el;
        this.mask = mask.trim();
        this.errorFunction = errorFunction;
        this.addExtraChars();
        this.setMask();
    };
    
    Masker.prototype.specialModifiers = {};
    Masker.prototype.errors = {};
    Masker.prototype.doNotValidate = {};
    Masker.prototype.BACKSPACE = 8;
    Masker.prototype.DELETE = 46;
    
    Masker.prototype.addExtraChars = function(){
        var i = 0;
        var nCharsInMask = this.mask.length;
        var char;
        var functionAssociated;
        var existsCompleteTemplate = this.templates[this.mask];
        for(; i<nCharsInMask && !existsCompleteTemplate ; i++){
            char = this.mask[i];
            functionAssociated = this.templates[char];
            if(!functionAssociated){
                this.templates[char] = function(extraChar, input, context){
                    var pos = context.$el.get(0).selectionStart;
                    var charAtMask = context.mask[pos];
                    var nextChar = input.charAt(pos);
                    //context.lastInput = charAtMask;
                    return extraChar == charAtMask && extraChar != nextChar;
                }
                this.validator[char] = function(){
                    return true;
                }
                this.doNotValidate[char] = true;
            }
        }
    };
    
    Masker.prototype.setMask = function(){
        var context = this;
        if(this.$el.is("input")){
            this.$el.attr("placeholder", this.mask);
            this.specialMask = this.isSpecialMask(this.mask, this);
            
            this.$el.on("keydown", function(e){
                var input = $(this).val();
                var pos = $(this).get(0).selectionStart - 1;
                var char;
                if(e.keyCode == context.BACKSPACE){
                    char = input.charAt(pos);
                    if(context.doNotValidate[char]){
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
                context.completePattern(e, context);
                if(context.validPattern){
                    validateValue();
                }
                
                function composeFinalInput(){
                    context.finalValue = context.insertCharInCaret(newChar, inputVal, actualPos);
                };
                
                function validateValue(){
                    
                    validFormat = context.validateValue(context);
                    
                    if(validFormat == false){
                        context.errors[context.lastInput] = true;    
                    }else{
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
    
    Masker.prototype.insertCharInCaret = function(newChar, inputVal, actualPos){
        var firstPart = inputVal.substring(0 , actualPos);
        var endPart = inputVal.substring(actualPos);
        return firstPart + newChar + endPart;
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
                //var finalVal = context.insertCharInCaret(newChar, inputVal, actualPos);
                
            }
        }
        return isValid;
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
    }
    
    Masker.prototype.completePattern = function(e, context){
        var value = context.value = $(e.target).val();
        var length = value.length;
        var pattern = context.mask;
        var lastChar = String.fromCharCode(e.keyCode);
        var charNow = pattern[context.$el.get(0).selectionStart];
        var specialMask = context.specialMask;
        var mustPrevent = false;
        var event = e;
        var functionToApply;
        
        context.lastInput = charNow;
        if(isCharInPattern()){
            getTemplateChecker();
            if(functionToApply){
                checkTemplate();
            }
            
            if(context.validPattern == false){
                setPrevent();
            }else{
                context.written[charNow] = true;
            }
        }else{
            setPrevent();
        }
        preventWriting();
        
        
        
        function isCharInPattern(){
            return typeof charNow != "undefined" || specialMask;
        };
        
        function getTemplateChecker(){
            functionToApply = specialMask || context.templates[charNow];
        };
        
        function checkTemplate(){
            context.validPattern = functionToApply(lastChar, value, context);
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