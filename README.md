Mask.js
======

What is Mask.js about?
----------------------

Mask.js is a simple functionality that you can use to force user met a pattern into inputs


Dependencies?
-------------

Mask.js works on most jQuery versions.

Main Features
-------------

<ul>
    <li>
        Accepts any pattern order you would like to use
    </li>
    <li>
        In case of dates, it will validates days out of range, and even leap years
    </li>
    <li>
        You can use a custom function to handle the non validating inputs
    </li>
    <li>
        It will write down any token automatically while you are typing.
    </li>
    <li>
        In erasing, tokens will be omitted, and while you are re-typing, them are going to ve pass over
    </li>
    
</ul>


How can I use Mask.js?
----------------------

There are just a few steps:

1. You have to import mark.js into your project 
2. Once imported, just pass the next parameter with you desired configuration:

    ```
    var options = {
      $el: jQuery input,
      mask: pattern to apply(described in the next section),
      errorFunction: callback function triggered on every error,
      defaultValue: defaultValue to be shown on initialization(applies on date format),
      hidePlaceholder: boolean for not showing the pattern placeholder,
      isUtc: if the pattern is a date format, utc will be considered
    }
    Mask.newMask(options);
    ```
3. Pattern is the mask you want to apply over the input. It can be one of the following:
<ul>
<li>Any combination of YYYY-MM-DD HH:mm, where:
<ul>
    <li>
        Y means year
    </li>
    <li>
        M means month
    </li>
    <li>
        D means day
    </li>
    <li>
        H means hour
    </li>
    <li>
        m means minutes
    </li>
</ul>
</li>
<li>n for typing only numbers</li>
<li>az for typing only characters</li>
<li>az/n for typing both characters and numbers</li>
</ul>

4. Additionaly you can add a number after n or az to limit the maximun characters users can write


Try it out
----------

You can play around with it here: http://bguzmanrio.github.io/maskjs
