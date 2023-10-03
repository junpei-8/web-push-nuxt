import {
  type StyleValue,
  type HTMLAttributes,
  type ReservedProps,
  type VNodeRef,
} from 'nuxt/dist/app/compat/capi'
import type { VSnackbar } from 'vuetify/lib/components/index.mjs'

export type ToastNode = Parameters<Extract<VNodeRef, Function>>[0]

export interface ToastContentProps
  extends Omit<HTMLAttributes, 'style'>,
    ReservedProps {
  styles?: StyleValue
}

export interface ToastContentElementProps extends ToastContentProps {
  style?: StyleValue
}

type OriginalToastProps = VSnackbar['$props']
export interface ToastProps extends OriginalToastProps {
  contentProps?: ToastContentProps
  gap?: number
}

export interface ToastElementProps extends ToastProps {
  contentProps: ToastContentElementProps
}

export interface ToastElement {
  id: number
  message: string
  props: ToastElementProps
  ref: Element | null
  close: () => void
  detach: () => void
}

let _id = 0
const _elements = ref<ToastElement[]>([])

export type AppToastStore = typeof appToastStore
export const appToastStore = {
  elements: shallowReadonly(_elements),

  open(
    message: ToastElement['message'],
    toastProps: ToastProps | Ref<ToastProps> = {}
  ): ToastElement {
    const id = ++_id

    const elements = _elements.value as unknown as ToastElement[]

    const props = toRef(toastProps).value

    if (props.modelValue === void 0) props.modelValue = true
    if (props.location === void 0) props.location = 'bottom right'
    if (props.zIndex === void 0) props.zIndex = 800 - elements.length

    const element = {
      id,
      message,
      props,
      ref: null,
      close: null!,
      detach: null!,
    } as ToastElement

    element.close = this.close.bind(null, element)
    element.detach = this.detach.bind(null, element)

    const contentProps = toRef(
      ((props.contentProps as ToastProps) ||= {})
    ).value

    const contentPropsRef = contentProps.ref
    contentProps.ref = onChangeAttach.bind(this, element, contentPropsRef)

    elements.push(element)

    return element
  },
  openAsInfo: openAsColor.bind(null, 'info'),
  openAsSuccess: openAsColor.bind(null, 'success'),
  openAsWarning: openAsColor.bind(null, 'warning'),
  openAsError: openAsColor.bind(null, 'error'),

  close(element: ToastElement) {
    element.props.modelValue = false
  },

  detach(element: ToastElement) {
    const elements = _elements.value as unknown as ToastElement[]
    const index = elements.indexOf(element)
    if (index !== -1) elements.splice(index, 1)
  },
} as const

function openAsColor(
  color: string,
  message: ToastElement['message'],
  toastProps: ToastProps = {}
) {
  toastProps.color = color
  appToastStore.open(message, toastProps)
}

function onChangeAttach(
  this: typeof appToastStore,
  element: ToastElement,
  ref: ((node: ToastNode) => any) | undefined,
  node: ToastNode
) {
  // node が存在していたら高さを取得
  if (node instanceof Element) {
    element.ref = node
    return
  }

  // node が存在しなかったら削除
  this.detach(element)

  // 既に代入されている ref を実行
  ref?.(node)
}

watchEffect(
  () => {
    const elements = _elements.value as unknown as ToastElement[]

    let bottomOffset = 0

    for (let max = elements.length - 1, i = max; i > -1; i--) {
      const element = elements[i]
      const props = element.props
      const contentProps = props.contentProps

      const modelValue = props.modelValue

      nextTick(() => {
        const defaultStyle =
          `transition:transform 400ms, opacity 400ms;` +
          `transform:translateY(-${i === max ? 0 : bottomOffset}px)`

        const customStyle = contentProps.styles

        contentProps.style = customStyle
          ? [defaultStyle, customStyle]
          : defaultStyle

        if (modelValue) {
          const elRef = element.ref
          bottomOffset += elRef ? elRef.clientHeight + (props.gap || 8) : 0
        }
      })
    }
  },
  { flush: 'post' }
)
