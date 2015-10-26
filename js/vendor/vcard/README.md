vcard
=====

Simple js vCard parser/generator.

Example of usage:

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
