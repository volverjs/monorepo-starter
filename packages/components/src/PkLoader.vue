<template>
    <div>
        <div aria-hidden="true" class="loader"></div>
    </div>
</template>

<style lang="scss">
    .loader {
        width: var(--spacing-48);
        height: var(--spacing-48);
        border-radius: 50%;
        position: relative;
        animation: rotate 1s linear infinite;

        &::before {
            content: '';
            box-sizing: border-box;
            position: absolute;
            inset: 0px;
            border-radius: 50%;
            border: var(--spacing-5) solid var(--color-brand);
            animation: prix-clip-fix 2s linear infinite;
        }

        @keyframes rotate {
            100% {
                rotate: 360deg;
            }
        }

        @keyframes prix-clip-fix {
            0% {
                clip-path: polygon(50% 50%, 0 0, 0 0, 0 0, 0 0, 0 0);
            }

            25% {
                clip-path: polygon(
                    50% 50%,
                    0 0,
                    100% 0,
                    100% 0,
                    100% 0,
                    100% 0
                );
            }

            50% {
                clip-path: polygon(
                    50% 50%,
                    0 0,
                    100% 0,
                    100% 100%,
                    100% 100%,
                    100% 100%
                );
            }

            75% {
                clip-path: polygon(
                    50% 50%,
                    0 0,
                    100% 0,
                    100% 100%,
                    0 100%,
                    0 100%
                );
            }

            100% {
                clip-path: polygon(
                    50% 50%,
                    0 0,
                    100% 0,
                    100% 100%,
                    0 100%,
                    0 0
                );
            }
        }
    }
</style>
