namespace Lily {
    export interface Node {
        name: string | null
        attr: Record<string, unknown> | null
        children: Lily.Children
    }

    export interface Component<
        State = Record<string, unknown>,
        Props = Record<string, unknown>
    > extends Node {
        id: symbol
        key: string | number | null
        state: State | null
        props: Props
    }

    export type FunctionComponent<Props = Record<string, unknown>> = (
        props: Props
    ) => Node

    export type Element = Node | string
    export type Attr = Record<string, unknown>
    export type Children = Array<Lily.Component | Lily.Element | null> | null
}

const h = (
    name: string,
    attr: Lily.Attr | null = null,
    children: Lily.Element[] | null = null
): Lily.Node => ({
    name: name.toUpperCase(),
    attr,
    children
})

const diff = (
    o: Lily.Element | Lily.Component,
    n: Lily.Element | Lily.Component
): Lily.Element | null => {
    if (isString(o) || isString(n)) return o !== n ? n : null
    if (isComponent(o) && isComponent(n) && o.id === n.id) return n

    if (o.name !== n.name) return n
    const attr = attrDiff(o.attr, n.attr)
    const children = diffChildren(o.children, n.children)

    if (!attr && !children) return null

    return {
        name: null,
        attr,
        children
    }
}

const diffChildren = (o: Lily.Children, n: Lily.Children): Lily.Children => {
    if (!o || !n) return n

    const children: Array<Lily.Element | null> = []

    for (const [index, node] of n.entries()) {
        const ov = o[index]

        if (!node || !ov) {
            children.push(node)
            continue
        }

        if (isString(node) || isString(ov)) {
            if (node === ov) children.push(null)
            else children.push(node)

            continue
        }

        if (ov) children.push(diff(ov, node))
        else children.push(node)
    }

    return !isEmpty(children) ? children : null
}

const isString = (v: unknown): v is string =>
    Object.prototype.toString.call(v) === '[object String]'

const isObject = <T = Lily.Attr>(v: unknown): v is T =>
    Object.prototype.toString.call(v) === '[object Object]' && !Array.isArray(v)

const isComponent = (v: unknown): v is Lily.Component =>
    isObject<Record<string, any>>(v) && v.symbol

const isEmpty = (obj: Object) => {
    for (const _ in obj) return false

    return true
}

const attrDiff = (o: Lily.Attr | null, n: Lily.Attr | null) => {
    if (!o || !n) return n

    const attr: Lily.Attr = {}

    for (const key in n) {
        const ov = o[key]
        const nv = n[key]

        if (!ov || ov !== nv)
            if (isObject(ov) && isObject(nv)) {
                const deepAttr = attrDiff(ov, nv)
                if (deepAttr) attr[key] = attrDiff(ov, nv)
            } else attr[key] = nv
    }

    return !isEmpty(attr) ? attr : null
}

const createStyle = (value: Lily.Attr, style: CSSStyleDeclaration) => {
    if (isObject(value))
        Object.entries(value).forEach(([styleKey, styleValue]) =>
            style.setProperty(styleKey, styleValue as string)
        )
    else style.cssText = value as string
}

const construct = (node: Lily.Element) => {
    if (isString(node)) return document.createTextNode(node)

    const { name, attr, children } = node

    if (!name) throw new Error("Node name can't be empty")

    const element = document.createElement(name)

    if (attr)
        Object.entries(attr).forEach(([key, value]) => {
            if (key === 'style')
                return createStyle(value as Lily.Attr, element.style)

            if (isString(value)) return element.setAttribute(key, value)
        })

    if (children)
        children.forEach((child) => {
            if (!child) return

            if (isString(child))
                element.appendChild(document.createTextNode(child))
            else element.appendChild(construct(child))
        })

    return element
}

const update = (node: Lily.Element | null, target: HTMLElement) => {
    if (!node) return

    if (isString(node))
        return void target.textContent !== node
            ? (target.textContent = node)
            : null

    if (node.name && target.tagName !== node.name)
        return void target.parentNode!.replaceChild(construct(node), target)

    const { attr, children } = node
    const attrKeys = Object.keys(target.attributes)
    const leftover = attrKeys
        ? new Set(attrKeys.map((key) => target.attributes[key as any].name))
        : null

    if (attr)
        Object.entries(attr).forEach(([key, value]) => {
            leftover!.delete(key)

            if (key === 'style')
                return createStyle(value as Lily.Attr, target.style)

            if (isString(value)) return target.setAttribute(key, value)
        })

    leftover?.forEach((key) => target.removeAttribute(key))

    if (children)
        children.forEach((child, index) => {
            if (!child) return

            const targetChild = target.childNodes[index]

            if (!targetChild)
                return void target.appendChild(
                    isString(child)
                        ? document.createTextNode(child)
                        : construct(child)
                )

            update(child, targetChild as HTMLElement)

            return
        })

    while ((children?.length ?? 0) < target.childNodes.length)
        target.removeChild(target.lastChild!)

    return
}

const render = (node: Lily.Element | null, target: HTMLElement) => {
    try {
        if (target.hasChildNodes())
            update(node, target.childNodes[0] as HTMLElement)
        else if (node) target.appendChild(construct(node))
    } catch (err) {
        // ? If failed somehow, blown all the node then create from scratch
        if (node)
            if (target.firstChild)
                target.replaceChild(construct(node), target.firstChild)
            else target.appendChild(construct(node))
    }
}

const component = <
    State = Record<string, unknown>,
    Props = Record<string, unknown>
>(
    build: Lily.FunctionComponent<Props>,
    state: State | null = null,
    props: Props = {} as Props
): Lily.Component<State, Props> => ({
    ...build(props),
    id: Symbol(),
    state,
    props,
    key: ''
})

export { h, construct, diff, update, render, component }
