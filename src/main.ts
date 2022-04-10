import { h, diff, render } from './lily'

const a = h(
    'h1',
    {
        a: 'b',
        b: 'a',
        nested: {
            ok: 'ok!',
            n: 'k'
        }
    },
    ['Hello World!', 'Ok', h('span', null, ['a', 'Hello']), 'Overloaded']
)

const b = h(
    'h1',
    {
        a: 'c',
        c: 'd',
        nested: {
            n: 'k!'
        }
    },
    [
        'Hello World!',
        'Ok',
        h(
            'div',
            {
                class: 'hi'
            },
            ['a', 'Hello!']
        )
    ]
)

const root = document.getElementById('app')!

render(a, root)
render(diff(a, b), root)
