# vcard
===

## Introduction
vcard allow you to parse vCard data into js object and convert js object into vCard data.
It can work both in browser and in node.

## Installation
Using bower:
```sh
bower install vcard
```

Using npm:
```sh
npm install vcard-parser
```

## Example of usage:
```javascript
var raw = 'BEGIN:VCARD\r\n' +
          'FN:Forrest Gump\r\n' +
          'N:Gump;Forrest;;Mr.;\r\n' +
          'TEL;TYPE=HOME:78884545247\r\n' +
          'END:VCARD';
var card = vCard.parse(raw);

expect(card.fn).toEqual([
    {value: 'Forrest Gump'}
]);
expect(card.n).toEqual([{
    value: [
        'Gump', 'Forrest', '', 'Mr.', ''
    ]
}]);
expect(card.tel).toEqual([
    {value: '78884545247', meta: {type: ['HOME']}}
]);

var generated = vCard.generate(card);

expect(generated).toEqual(raw);
```
