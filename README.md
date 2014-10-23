Mask.js
======

What is Mask.js about?
----------------------

Mask.js is a simple functionality that you can use to force user met a pattern into inputs


Dependencies?
-------------

Mask.js works on most jQuery versions.


How can I use Mask.js?
----------------------

There are just a few steps:

1. You have to import mark.js into your project 
2. Once imported, just get the input you want to be masked using jQuery:
    ```
    <input id="maskExample" type="text"></input>
    ```
    ```
    Mask.newMask($("#maskExample"), pattern);
    ```
3. Pattern is the mask you want to apply over the input. It can be one of the following:
<ul>
<li>Any combination of yyyy-MM-dd HH:mm, where:
<ul>
    <li>
        y means year
    </li>
    <li>
        M means month
    </li>
    <li>
        d means day
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
</ul>

4. Additionaly you can add a number after n or az to limit the maximun characters users can write


Try it out
----------

You can play around with it here: http://jsfiddle.net/16wsgx40/1/
