import { h, diff, render, component } from './lily'

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
            [
                'a',
                'Hello!',
                h(
                    'button',
                    {
                        onclick: () => console.log('clicked')
                    },
                    ['Hi']
                )
            ]
        )
    ]
)

const MyComponent = () => {
    return h('h1', null, ['Hello World!'])
}

const fc = component(MyComponent)

const root = document.getElementById('app')!

render(a, root)
render(diff(a, b), root)
