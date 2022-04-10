namespace Lily {
    export interface Node {
        name: string | null
        attr: Record<string, unknown> | null
        children: Lily.Children
    }

    export type Element = Node | string
    export type Attr = Record<string, unknown>
    export type Children = Array<Lily.Element | null> | null
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

const diff = (o: Lily.Element, n: Lily.Element): Lily.Element | null => {
    if (isString(o) || isString(n)) return o !== n ? n : null

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

    let isEmpty = true
    const children: Array<Lily.Element | null> = []

    for (const [index, node] of n.entries()) {
        const ov = o[index]

        if (!node || !ov) {
            children.push(node)
            isEmpty = false

            continue
        }

        if (isString(node) || isString(ov)) {
            if (node === ov) children.push(null)
            else {
                isEmpty = false
                children.push(node)
            }

            continue
        }

        if (ov) {
            const diffed = diff(ov, node)

            children.push(diffed)
            if (diffed) isEmpty = false
        } else children.push(node)
    }

    return !isEmpty ? children : null
}

const isString = (v: unknown): v is string =>
    Object.prototype.toString.call(v) === '[object String]'

const isObject = (v: unknown): v is Lily.Attr =>
    Object.prototype.toString.call(v) === '[object Object]' && !Array.isArray(v)

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

    if (
        isString(node) ||
        (node.name !== null && target.tagName !== node.name)
    ) {
        const newTarget = construct(node)
        target.parentNode!.replaceChild(newTarget, target)

        return
    }

    const { attr, children } = node

    if (attr)
        Object.entries(attr).forEach(([key, value]) => {
            if (key === 'style')
                return createStyle(value as Lily.Attr, target.style)

            if (isString(value)) return target.setAttribute(key, value)
        })

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
}

const render = (node: Lily.Element | null, target: HTMLElement) => {
    try {
        if (target.hasChildNodes())
            update(node, target.childNodes[0] as HTMLElement)
        else if (node) target.appendChild(construct(node))
    } catch (err) {
        if (node)
            if (target.firstChild)
                target.replaceChild(construct(node), target.firstChild)
            else target.appendChild(construct(node))
    }
}

export { h, construct, diff, update, render }
