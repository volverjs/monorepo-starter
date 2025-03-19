import { h, ref, VNode } from 'vue'
import { useI18n } from 'vue-i18n'
import {
    VvButton,
    VvButtonGroup,
    VvInputText,
} from '@volverjs/ui-vue/components'
import { useDialog } from './useDialog'

export const useDialogConfirm = () => {
    const { openDialog } = useDialog()
    const { t: $t } = useI18n({
        useScope: 'global',
    })

    const openDialogConfirm = ({
        emitReject = false,
        confirmLabel,
        cancelLabel,
        questionLabel,
        onlyConfirm = false,
        passphrase,
        passphraseLabel,
        passphraseHint,
    }: {
        emitReject?: boolean
        confirmLabel?: string
        cancelLabel?: string
        questionLabel?: string
        onlyConfirm?: boolean
        passphrase?: string
        passphraseLabel?: string
        passphraseHint?: string
    } = {}) => {
        return new Promise<boolean>((resolve, reject) => {
            const passphraseText = ref<string>()
            const isOpen = openDialog(
                {
                    role: 'alertdialog',
                    size: 'small',
                    keepOpen: true,
                },
                {
                    default: () =>
                        h('div', [
                            h(
                                'div',
                                { class: 'mb-sm' },
                                questionLabel ?? $t('message.confirm'),
                            ),
                            passphrase
                                ? h(VvInputText, {
                                      modelValue: passphraseText.value,
                                      'onUpdate:modelValue': (
                                          value: string,
                                      ) => {
                                          passphraseText.value = value
                                      },
                                      type: 'text',
                                      name: 'passphrase',
                                      class: 'mb-0',
                                      floating: true,
                                      label:
                                          passphraseLabel ??
                                          $t('label.passphrase'),
                                      hintLabel:
                                          passphraseHint ??
                                          $t('hint.passphrase', { passphrase }),
                                  })
                                : undefined,
                        ]),
                    footer: () =>
                        h(VvButtonGroup, () => {
                            const toReturn: VNode[] = []
                            if (!onlyConfirm) {
                                toReturn.push(
                                    h(VvButton, {
                                        label:
                                            cancelLabel ?? $t('action.cancel'),
                                        modifiers: 'ghost',
                                        onClick: () => {
                                            if (emitReject) {
                                                reject()
                                            }
                                            resolve(false)
                                            isOpen.value = false
                                        },
                                    }),
                                )
                            }
                            toReturn.push(
                                h(VvButton, {
                                    label: confirmLabel ?? $t('action.proceed'),
                                    disabled: passphrase
                                        ? passphrase !== passphraseText.value
                                        : false,
                                    onClick: () => {
                                        resolve(true)
                                        isOpen.value = false
                                    },
                                }),
                            )
                            return toReturn
                        }),
                },
            )
        })
    }

    return { openDialogConfirm }
}
