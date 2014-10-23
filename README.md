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
..*Any combination of yyyy-MM-dd HH:mm where:
..*-y means year
..*-M means month
..*-d means day
..*-H means hour
..*-m means minutes
..*n for typing only numbers
..*az for typing only characters
4. Additionaly you can add a number after n or az to limit the maximun characters users can write


