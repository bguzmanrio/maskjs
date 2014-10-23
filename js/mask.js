var Mask = {};

(function(){
    
    this.newMask = function($el, options){
        return new Masker($el, options);
    }
        
    var masks = {
        number: "",
        date: "yyyy-hh-mm",
        datetime: "",
        time: "",
        char: "",
    };
    
    
    
    function Masker($el, mask){
        this.$el = $el;
        this.mask = mask.trim();
        this.addExtraChars();
        this.setMask();
    };
    
    Masker.prototype.specialModifiers = {};
    
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
                    var charAt = context.mask[pos];
                    context.lastInput = charAt;
                    return extraChar == charAt;
                }
                this.validator[char] = function(){
                    return true;
                }
            }
        }
    };
    
    Masker.prototype.setMask = function(){
        var context = this;
        if(this.$el.is("input")){
            this.$el.attr("placeholder", this.mask);
            this.specialMask = this.isSpecialMask(this.mask, this);
            
            this.$el.on("keypress", function(e){
                var validFormat;
                var lastChar;
                var valueForLastChar;
                var inputVal = $(e.target).val();
                var newChar = String.fromCharCode(e.keyCode);
                var inputParent = $(this).parent();
                var validationFunction;
                var actualPos = $(this).get(0).selectionStart;
                var firstPart;
                var endPart;
                
                composeFinalInput();
                context.completePattern(e, context);
                if(context.validPattern){
                    validateValue();
                }
                
                function composeFinalInput(){
                    firstPart = inputVal.substring(0 , actualPos);
                    endPart = inputVal.substring(actualPos);
                    inputVal = firstPart + newChar + endPart;
                    context.finalValue = inputVal;
                };
                
                function validateValue(){
                    lastChar = context.lastInput;
                    valueForLastChar = context.getValueFor(lastChar,inputVal, context);
                    if(valueForLastChar.patternCount == valueForLastChar.inputCount){
                        validationFunction = context.validator[lastChar];
                        validFormat = validationFunction(valueForLastChar.value, context, true);
                    }
                    if(validFormat == false){
                        inputParent.css("border", "1px solid red");
                    }else if(validFormat == true){
                        inputParent.css("border", "none");
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
    }
    
    Masker.prototype.getSpecialMask = function(){
        
    }
    
    Masker.prototype.checkInput = function($input, context){
        var value = $input.val();
        var length = value.length;
        
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
        "y": function(char, input, context){
            var length = input.length;
            var number = context.templates["n"](char, input, context);
            context.lastInput = "y";
            return number;
        },
        "M": function(char, input, context){
            var length = input.length;
            var number = context.templates["n"](char, input, context); 
            context.lastInput = "M";
            return number;
        },
        "d": function(char, input, context){
            var length = input.length;
            var number = context.templates["n"](char, input, context);
            context.lastInput = "d";
            return number;
        },
        "H": function(char, input, context){
            var length = input.length;
            var number = context.templates["n"](char, input, context);
            context.lastInput = "H";
            return number;
        },
        "m": function(char, input, context){
            var length = input.length;
            var number = context.templates["n"](char, input, context);
            context.lastInput = "m";
            return number;
        },
        "n": function(char, input, context){
            context.lastInput = "n";
            return parseInt(char) >= 0;
        }
    };
    
    Masker.prototype.specialTemplates = {
        "n": function(char, input, context){
            context.lastInput = "n";
            var isNumber = parseInt(char) >= 0;
            var modifier = context.specialModifiers["n"];
            if(modifier){
                return isNumber && context.finalValue.length <= modifier;
            }else{
                return isNumber;
            }
        },
        "az": function(char, input, context){
            context.lastInput = "az";
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
        "y": function(patternInput, context, propagateValidation){
            var valid = true;
            var dayValue = context.getValueFor("d", context.finalValue, context);
            if(dayValue.value && propagateValidation == true){
                valid = context.validator["d"](dayValue.value, context);
            }
            return valid;
        },
        "M": function(patternInput, context, propagateValidation){
            var month = parseInt(patternInput);
            var valid = month >= 1 && month <= 12;
            var dayValue = context.getValueFor("d", context.finalValue, context);
            if(dayValue.value && propagateValidation == true){
                valid = context.validator["d"](dayValue.value, context);
            }
            return valid;
        },
        "d": function(patternInput, context){
            var validationDate = new Date();
            var day = parseInt(patternInput);
            var maxDay = 31;
            var month = context.getValueFor("M", context.finalValue, context);
            var year = context.getValueFor("y", context.finalValue, context);
            
            if(year.value && context.validator["y"](year.value, context, false)){
                validationDate.setFullYear(parseInt(year.value));
            }
            
            if(month.value && context.validator["M"](month.value, context, false)){
                validationDate.setMonth(parseInt(month.value));
                validationDate.setDate(0);
                maxDay = validationDate.getDate();
            }
            
            if(day>0 && day <= maxDay){
                return true;
            }else{
                return false;
            }
        },
        "H": function(patternInput){
            var hour = parseInt(patternInput);
            return hour > 0 && hour <= 24;
        },
        "m": function(patternInput){
            var minutes = parseInt(patternInput);
            return minutes > 0 && minutes <= 60;
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