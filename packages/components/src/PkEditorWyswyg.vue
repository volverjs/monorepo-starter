<script setup lang="ts">
    import { ref, watch, onBeforeUnmount } from 'vue'
    import {
        VvButton,
        VvButtonGroup,
        VvInputText,
    } from '@volverjs/ui-vue/components'
    import { useEditor, EditorContent } from '@tiptap/vue-3'
    import StarterKit from '@tiptap/starter-kit'

    enum OutputFormats {
        html = 'html',
        json = 'json',
    }

    const props = withDefaults(
        defineProps<{
            modelValue?: string
            label?: string
            outputFormat?: OutputFormats
            readonly?: boolean
        }>(),
        {
            modelValue: '',
            label: '',
            outputFormat: OutputFormats.html,
            readonly: false,
        },
    )
    const emits = defineEmits(['update:modelValue'])

    const fontSize = ref(10)

    const editor = useEditor({
        extensions: [StarterKit],
        editable: !props.readonly,
        content: props.modelValue,
        onUpdate: () => {
            if (props.outputFormat === OutputFormats.json) {
                emits('update:modelValue', editor.value?.getJSON())
            } else {
                emits('update:modelValue', editor.value?.getHTML())
            }
        },
    })

    watch(
        () => props.modelValue,
        (newValue) => {
            let isSame = false

            if (props.outputFormat === OutputFormats.json) {
                isSame =
                    JSON.stringify(editor.value?.getJSON()) ===
                    JSON.stringify(newValue)
            } else {
                isSame = editor.value?.getHTML() === newValue
            }

            if (isSame) {
                return
            }

            editor.value?.commands.setContent(newValue)
        },
    )

    const buttons = [
        {
            icon: 'octicon:bold-16',
            title: 'Bold',
            action: () => editor.value?.chain().focus().toggleBold().run(),
            isActive: () => editor.value?.isActive('bold'),
        },
        {
            icon: 'italic',
            title: 'Italic',
            action: () => editor.value?.chain().focus().toggleItalic().run(),
            isActive: () => editor.value?.isActive('italic'),
        },
        {
            icon: 'lucide:heading-1',
            title: 'Heading 1',
            action: () =>
                editor.value?.chain().focus().toggleHeading({ level: 1 }).run(),
            isActive: () => editor.value?.isActive('heading', { level: 1 }),
        },
        {
            icon: 'lucide:heading-2',
            title: 'Heading 2',
            action: () =>
                editor.value?.chain().focus().toggleHeading({ level: 2 }).run(),
            isActive: () => editor.value?.isActive('heading', { level: 2 }),
        },
        {
            icon: 'ri:paragraph',
            title: 'Paragraph',
            action: () => editor.value?.chain().focus().setParagraph().run(),
            isActive: () => editor.value?.isActive('paragraph'),
        },
        {
            icon: 'ri:list-unordered',
            title: 'Bullet List',
            action: () =>
                editor.value?.chain().focus().toggleBulletList().run(),
            isActive: () => editor.value?.isActive('bulletList'),
        },
        {
            icon: 'ri:list-ordered',
            title: 'Ordered List',
            action: () =>
                editor.value?.chain().focus().toggleOrderedList().run(),
            isActive: () => editor.value?.isActive('orderedList'),
        },
        {
            icon: 'clear-style',
            title: 'Clear Format',
            action: () =>
                editor.value
                    ?.chain()
                    .focus()
                    .clearNodes()
                    .unsetAllMarks()
                    .run(),
        },
    ]

    const selectedButtons = ref([])
    onBeforeUnmount(() => editor.value?.destroy())
</script>

<template>
    <div class="vv-input-text wysiwyg">
        <label v-if="label" :for="label" class="vv-input-text__label">
            {{ label }}
        </label>
        <div class="vv-input-text__wrapper flex-col items-start">
            <EditorContent
                :id="label"
                class="wysiwyg__content light-scrollbar preflight"
                :editor="editor" />
            <VvButtonGroup
                v-if="!readonly"
                v-model="selectedButtons"
                modifiers="compact"
                item-modifiers="action-quiet"
                class="wysiwyg__actions"
                multiple>
                <VvButton
                    v-for="(button, index) in buttons"
                    :key="`${button.title}_${index}`"
                    :title="button.title"
                    :icon="button.icon"
                    :pressed="button.isActive?.()"
                    @click="button.action" />
                <div>
                    <VvInputText
                        v-model="fontSize"
                        min="5"
                        name="font-size"
                        type="number"
                        class="wysiwyg__font-size" />
                </div>
            </VvButtonGroup>
        </div>
    </div>
</template>

<style lang="scss">
    .tiptap {
        flex-grow: 1;

        h1,
        h2,
        h3,
        p {
            margin: 0;
            vertical-align: middle;
        }
    }

    .wysiwyg {
        position: relative;

        .selectedCell {
            background: var(--color-surface-4);
        }

        font-size: var(--text-sm);

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

        &__font-size {
            margin: 0;

            &.vv-input-text {
                height: 35px;

                .vv-input-text__wrapper {
                    border: unset;

                    .vv-input-text__inner {
                        height: 100%;

                        input {
                            width: 25px;
                            min-height: unset;
                            padding: 0;
                            text-align: center;
                        }
                    }

                    .vv-input-text__actions-group {
                        height: 100%;
                        width: var(--spacing-26);

                        button {
                            width: unset;
                        }
                    }
                }
            }
        }

        th {
            background-color: var(--color-surface-2);
        }

        &__actions {
            justify-content: start;
            width: 100%;
            box-shadow: 0 0px 10px 2px
                hsla(
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
