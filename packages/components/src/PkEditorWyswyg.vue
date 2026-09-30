<script setup lang="ts">
    /*
     * A rich text field. `v-model` is HTML, or tiptap JSON with
     * `output-format="json"`. The editor parses what it is given through its
     * schema, which drops scripts and unknown attributes, so stored HTML is
     * safe here and nowhere else: never render it with `v-html`. In a form,
     * bind it through the VvFormField default slot
     * (apps/frontend/src/pages/frontoffice/todos/[id].vue).
     */
    import type { JSONContent } from '@tiptap/core'
    import { watch, onBeforeUnmount, useId } from 'vue'
    import { useI18n } from 'vue-i18n'
    import { VvButton, VvButtonGroup } from '@volverjs/ui-vue/components'
    import { useEditor, EditorContent } from '@tiptap/vue-3'
    import StarterKit from '@tiptap/starter-kit'

    const props = withDefaults(
        defineProps<{
            modelValue?: string | JSONContent | null
            label?: string
            outputFormat?: 'html' | 'json'
            readonly?: boolean
            invalid?: boolean
            invalidLabel?: string | string[]
        }>(),
        {
            modelValue: '',
            label: '',
            outputFormat: 'html',
            readonly: false,
            invalid: false,
            invalidLabel: undefined,
        },
    )
    const emit = defineEmits<{
        'update:modelValue': [string | JSONContent]
    }>()

    const { t: $t } = useI18n({ useScope: 'global' })
    const id = useId()

    // An empty editor holds `<p></p>`: the model gets '' instead, so a cleared
    // field is stored empty.
    const currentValue = () => {
        if (!editor.value) {
            return undefined
        }
        if (props.outputFormat === 'json') {
            return editor.value.getJSON()
        }
        return editor.value.isEmpty ? '' : editor.value.getHTML()
    }

    const editor = useEditor({
        extensions: [StarterKit],
        editable: !props.readonly,
        content: props.modelValue,
        editorProps: {
            // The content is a contenteditable div, which a <label for> does
            // not name: the label is linked by id instead, when there is one.
            attributes: {
                role: 'textbox',
                'aria-multiline': 'true',
                ...(props.label ? { 'aria-labelledby': `${id}-label` } : {}),
            },
        },
        onUpdate: () => {
            const value = currentValue()
            if (value !== undefined) {
                emit('update:modelValue', value)
            }
        },
    })

    watch(
        () => props.modelValue,
        (newValue) => {
            const same =
                props.outputFormat === 'json'
                    ? JSON.stringify(currentValue()) ===
                      JSON.stringify(newValue)
                    : currentValue() === (newValue ?? '')
            if (!same) {
                editor.value?.commands.setContent(newValue ?? '')
            }
        },
    )

    watch(
        () => props.readonly,
        (readonly) => editor.value?.setEditable(!readonly),
    )

    const buttons = [
        {
            icon: 'bold',
            title: 'editor.bold',
            action: () => editor.value?.chain().focus().toggleBold().run(),
            isActive: () => editor.value?.isActive('bold'),
        },
        {
            icon: 'italic',
            title: 'editor.italic',
            action: () => editor.value?.chain().focus().toggleItalic().run(),
            isActive: () => editor.value?.isActive('italic'),
        },
        {
            icon: 'text-style',
            title: 'editor.heading',
            action: () =>
                editor.value?.chain().focus().toggleHeading({ level: 2 }).run(),
            isActive: () => editor.value?.isActive('heading', { level: 2 }),
        },
        {
            icon: 'text-body',
            title: 'editor.paragraph',
            action: () => editor.value?.chain().focus().setParagraph().run(),
            isActive: () => editor.value?.isActive('paragraph'),
        },
        {
            icon: 'bulleted-list',
            title: 'editor.bulletList',
            action: () =>
                editor.value?.chain().focus().toggleBulletList().run(),
            isActive: () => editor.value?.isActive('bulletList'),
        },
        {
            icon: 'numbered-list',
            title: 'editor.orderedList',
            action: () =>
                editor.value?.chain().focus().toggleOrderedList().run(),
            isActive: () => editor.value?.isActive('orderedList'),
        },
        {
            icon: 'clear-style',
            title: 'editor.clearFormat',
            action: () =>
                editor.value
                    ?.chain()
                    .focus()
                    .clearNodes()
                    .unsetAllMarks()
                    .run(),
        },
    ]

    onBeforeUnmount(() => editor.value?.destroy())
</script>

<template>
    <div
        class="vv-input-text pk-editor-wyswyg"
        :class="{ 'vv-input-text--invalid': invalid }">
        <label v-if="label" :id="`${id}-label`" class="vv-input-text__label">
            {{ label }}
        </label>
        <div class="vv-input-text__wrapper flex-col items-start">
            <EditorContent
                class="pk-editor-wyswyg__content light-scrollbar"
                :editor="editor" />
            <VvButtonGroup
                v-if="!readonly"
                modifiers="compact"
                item-modifiers="action-quiet"
                class="pk-editor-wyswyg__actions">
                <VvButton
                    v-for="button in buttons"
                    :key="button.title"
                    :title="$t(button.title)"
                    :aria-label="$t(button.title)"
                    :icon="button.icon"
                    :pressed="button.isActive?.()"
                    @click="button.action" />
            </VvButtonGroup>
        </div>
        <small v-if="invalid && invalidLabel" class="vv-input-text__hint">
            {{ Array.isArray(invalidLabel) ? invalidLabel[0] : invalidLabel }}
        </small>
    </div>
</template>

<style lang="scss">
    .pk-editor-wyswyg {
        position: relative;
        font-size: var(--text-sm);

        .tiptap {
            flex-grow: 1;
            outline: none;

            h2,
            p {
                margin: 0;
            }

            ul,
            ol {
                padding-left: var(--spacing-md);
            }

            ul {
                list-style: disc;
            }

            ol {
                list-style: decimal;
            }
        }

        &__content {
            min-height: var(--spacing-80);
            max-height: var(--spacing-384);
            overflow: auto;
            align-items: start;
            padding: var(--spacing-xs);
            width: 100%;

            &:has(.ProseMirror-focused) {
                border-color: var(--color-word);
            }
        }

        &__actions {
            justify-content: start;
            width: 100%;
            box-shadow: 0 0 10px 2px
                hsl(
                    var(--color-shadow-hue) var(--color-shadow-saturation)
                        var(--color-shadow-lightness) / 10%
                );

            .vv-button {
                border-bottom-left-radius: 0;
                border-bottom-right-radius: 0;

                &--action {
                    --vv-button-modifier-action-state-pressed-background: var(
                        --color-word
                    );

                    border-width: 1px 1px 0;
                    border-color: var(--color-surface-4);
                }
            }
        }
    }
</style>
